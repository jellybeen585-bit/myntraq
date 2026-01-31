import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import { z } from "zod";

// Validation schemas
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(200).optional(),
  language: z.enum(['en', 'ru']).optional(),
});

const createChatSchema = z.object({
  participantId: z.string().min(1),
});

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string()).optional().default([]),
  type: z.enum(['group', 'channel']).default('group'),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'file', 'voice']).optional().default('text'),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  iconUrl: z.string().optional(),
});

const addMembersSchema = z.object({
  memberIds: z.array(z.string()).min(1),
});

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

const createFriendshipSchema = z.object({
  friendId: z.string().min(1),
});

const updateFriendshipSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

function generateTag(email?: string | null, firstName?: string | null): string {
  const base = firstName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
               email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 
               'user';
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}_${random}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Setup object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Get or create user profile
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let profile = await storage.getProfile(userId);

      if (!profile) {
        // Create profile for new user
        const email = req.user.claims.email;
        const firstName = req.user.claims.first_name;
        const lastName = req.user.claims.last_name;
        
        profile = await storage.createProfile({
          userId,
          tag: generateTag(email, firstName),
          displayName: firstName && lastName ? `${firstName} ${lastName}` : firstName || null,
          bio: null,
          language: 'en',
          isOnline: true,
        });
      } else {
        // Update online status
        await storage.updateProfile(userId, { isOnline: true });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error getting profile:", error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  // Update user profile
  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: validation.error.errors });
      }

      const { displayName, bio, language } = validation.data;

      const profile = await storage.updateProfile(userId, {
        displayName,
        bio,
        language,
      });

      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Search users
  app.get("/api/users/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const query = req.query.query as string || req.query[0] as string;

      if (!query || query.length < 2) {
        return res.json([]);
      }

      const profiles = await storage.searchProfiles(query, userId);
      res.json(profiles);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Get all chats for user
  app.get("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error getting chats:", error);
      res.status(500).json({ message: "Failed to get chats" });
    }
  });

  // Get single chat
  app.get("/api/chats/:chatId", isAuthenticated, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const chat = await storage.getChatWithDetails(chatId);

      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      res.json(chat);
    } catch (error) {
      console.error("Error getting chat:", error);
      res.status(500).json({ message: "Failed to get chat" });
    }
  });

  // Create new chat
  app.post("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = createChatSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid chat data", errors: validation.error.errors });
      }
      
      const { participantId } = validation.data;

      // Check if chat already exists
      const existingChat = await storage.getPrivateChatBetweenUsers(userId, participantId);
      if (existingChat) {
        const chatWithDetails = await storage.getChatWithDetails(existingChat.id);
        return res.json(chatWithDetails);
      }

      // Create new chat
      const chat = await storage.createChat({ type: 'private' });

      // Add participants
      await storage.addChatParticipant({ chatId: chat.id, userId });
      await storage.addChatParticipant({ chatId: chat.id, userId: participantId });

      const chatWithDetails = await storage.getChatWithDetails(chat.id);
      res.json(chatWithDetails);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  // Create new group or channel
  app.post("/api/groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = createGroupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid group data", errors: validation.error.errors });
      }
      
      const { name, description, memberIds, type } = validation.data;

      // Create new group/channel
      const chat = await storage.createChat({ 
        type, 
        name, 
        description: description || null,
        createdBy: userId,
      });

      // Add creator as admin
      await storage.addChatParticipant({ chatId: chat.id, userId, role: 'admin' });
      
      // Add other members
      for (const memberId of memberIds) {
        await storage.addChatParticipant({ chatId: chat.id, userId: memberId, role: 'member' });
      }

      const chatWithDetails = await storage.getChatWithDetails(chat.id);
      res.json(chatWithDetails);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  // Get messages for a chat
  app.get("/api/chats/:chatId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user.claims.sub;

      // Mark messages as read
      await storage.markMessagesAsRead(chatId, userId);

      const messages = await storage.getMessages(chatId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Send a message
  app.post("/api/chats/:chatId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user.claims.sub;
      
      const validation = sendMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid message data", errors: validation.error.errors });
      }

      const { content, type, attachmentUrl, attachmentName, attachmentSize } = validation.data;

      // Check channel permissions - only admins can post
      const chat = await storage.getChatWithDetails(chatId);
      if (chat?.type === 'channel') {
        const participant = chat.participants.find(p => p.userId === userId);
        if (!participant || participant.role !== 'admin') {
          return res.status(403).json({ message: "Only admins can post in channels" });
        }
      }

      const message = await storage.createMessage({
        chatId,
        senderId: userId,
        content: content.trim(),
        type,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        attachmentSize: attachmentSize || null,
      });

      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Update group/channel settings
  app.patch("/api/groups/:chatId", isAuthenticated, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user.claims.sub;
      
      const validation = updateGroupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }

      // Check if user is admin
      const participant = await storage.getChatParticipant(chatId, userId);
      if (!participant || participant.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update group settings" });
      }

      const { name, description, iconUrl } = validation.data;
      const chat = await storage.updateChat(chatId, { name, description, iconUrl });

      res.json(chat);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  // Delete group/channel
  app.delete("/api/groups/:chatId", isAuthenticated, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user.claims.sub;

      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // Only the creator can delete
      if (chat.createdBy !== userId) {
        return res.status(403).json({ message: "Only the creator can delete this group" });
      }

      await storage.deleteChat(chatId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // Add members to group/channel
  app.post("/api/groups/:chatId/members", isAuthenticated, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user.claims.sub;
      
      const validation = addMembersSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }

      // Check if user is admin
      const participant = await storage.getChatParticipant(chatId, userId);
      if (!participant || participant.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can add members" });
      }

      const { memberIds } = validation.data;
      
      for (const memberId of memberIds) {
        // Check if already a member
        const existing = await storage.getChatParticipant(chatId, memberId);
        if (!existing) {
          await storage.addChatParticipant({ chatId, userId: memberId, role: 'member' });
        }
      }

      const chatWithDetails = await storage.getChatWithDetails(chatId);
      res.json(chatWithDetails);
    } catch (error) {
      console.error("Error adding members:", error);
      res.status(500).json({ message: "Failed to add members" });
    }
  });

  // Remove member from group/channel
  app.delete("/api/groups/:chatId/members/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const { chatId, memberId } = req.params;
      const userId = req.user.claims.sub;

      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // User can remove themselves, or admin can remove others
      if (memberId !== userId) {
        const participant = await storage.getChatParticipant(chatId, userId);
        if (!participant || participant.role !== 'admin') {
          return res.status(403).json({ message: "Only admins can remove members" });
        }
      }

      // Cannot remove the creator
      if (memberId === chat.createdBy) {
        return res.status(400).json({ message: "Cannot remove the group creator" });
      }

      await storage.removeChatParticipant(chatId, memberId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // Update member role
  app.patch("/api/groups/:chatId/members/:memberId/role", isAuthenticated, async (req: any, res) => {
    try {
      const { chatId, memberId } = req.params;
      const userId = req.user.claims.sub;
      
      const validation = updateRoleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }

      // Check if user is admin
      const participant = await storage.getChatParticipant(chatId, userId);
      if (!participant || participant.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can change roles" });
      }

      const { role } = validation.data;
      const updated = await storage.updateParticipantRole(chatId, memberId, role);

      res.json(updated);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Friend requests
  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getUserFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error getting friends:", error);
      res.status(500).json({ message: "Failed to get friends" });
    }
  });

  app.get("/api/friends/requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getPendingRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error getting friend requests:", error);
      res.status(500).json({ message: "Failed to get friend requests" });
    }
  });

  app.post("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = createFriendshipSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid friend data", errors: validation.error.errors });
      }
      
      const { friendId } = validation.data;

      // Check if friendship already exists
      const existing = await storage.getFriendship(userId, friendId);
      if (existing) {
        return res.status(400).json({ message: "Friendship already exists" });
      }

      const friendship = await storage.createFriendship({
        userId,
        friendId,
        status: 'pending',
      });

      res.json(friendship);
    } catch (error) {
      console.error("Error adding friend:", error);
      res.status(500).json({ message: "Failed to add friend" });
    }
  });

  app.patch("/api/friends/:friendshipId", isAuthenticated, async (req: any, res) => {
    try {
      const { friendshipId } = req.params;
      
      const validation = updateFriendshipSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid status", errors: validation.error.errors });
      }
      
      const { status } = validation.data;

      const friendship = await storage.updateFriendshipStatus(friendshipId, status);
      res.json(friendship);
    } catch (error) {
      console.error("Error updating friendship:", error);
      res.status(500).json({ message: "Failed to update friendship" });
    }
  });

  return httpServer;
}
