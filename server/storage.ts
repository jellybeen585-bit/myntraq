import { 
  userProfiles, 
  chats, 
  chatParticipants, 
  messages, 
  friendships,
  type UserProfile,
  type InsertUserProfile,
  type Chat,
  type InsertChat,
  type ChatParticipant,
  type InsertChatParticipant,
  type Message,
  type InsertMessage,
  type Friendship,
  type InsertFriendship,
  type ChatWithDetails,
  type MessageWithSender
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User Profiles
  getProfile(userId: string): Promise<UserProfile | undefined>;
  getProfileByTag(tag: string): Promise<UserProfile | undefined>;
  createProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  searchProfiles(query: string, excludeUserId: string): Promise<UserProfile[]>;
  
  // Chats
  getChat(chatId: string): Promise<Chat | undefined>;
  getChatWithDetails(chatId: string): Promise<ChatWithDetails | undefined>;
  getUserChats(userId: string): Promise<ChatWithDetails[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChat(chatId: string, data: Partial<InsertChat>): Promise<Chat | undefined>;
  deleteChat(chatId: string): Promise<void>;
  getPrivateChatBetweenUsers(userId1: string, userId2: string): Promise<Chat | undefined>;
  
  // Chat Participants
  addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  removeChatParticipant(chatId: string, userId: string): Promise<void>;
  updateParticipantRole(chatId: string, userId: string, role: string): Promise<ChatParticipant | undefined>;
  getChatParticipants(chatId: string): Promise<(ChatParticipant & { profile?: UserProfile })[]>;
  getChatParticipant(chatId: string, userId: string): Promise<ChatParticipant | undefined>;
  
  // Messages
  getMessages(chatId: string, limit?: number): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(chatId: string, userId: string): Promise<void>;
  
  // Friendships
  getFriendship(userId: string, friendId: string): Promise<Friendship | undefined>;
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  updateFriendshipStatus(id: string, status: string): Promise<Friendship | undefined>;
  getUserFriends(userId: string): Promise<(Friendship & { friend?: UserProfile })[]>;
  getPendingRequests(userId: string): Promise<(Friendship & { user?: UserProfile })[]>;
}

class DatabaseStorage implements IStorage {
  // User Profiles
  async getProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async getProfileByTag(tag: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.tag, tag));
    return profile;
  }

  async createProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [created] = await db.insert(userProfiles).values(profile).returning();
    return created;
  }

  async updateProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db
      .update(userProfiles)
      .set({ ...data, lastSeen: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  async searchProfiles(query: string, excludeUserId: string): Promise<UserProfile[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(userProfiles)
      .where(
        and(
          or(
            ilike(userProfiles.tag, searchPattern),
            ilike(userProfiles.displayName, searchPattern)
          ),
          sql`${userProfiles.userId} != ${excludeUserId}`
        )
      )
      .limit(20);
  }

  // Chats
  async getChat(chatId: string): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    return chat;
  }

  async getChatWithDetails(chatId: string): Promise<ChatWithDetails | undefined> {
    const chat = await this.getChat(chatId);
    if (!chat) return undefined;

    const participants = await this.getChatParticipants(chatId);
    const msgs = await this.getMessages(chatId, 1);
    const lastMessage = msgs[0];

    return {
      ...chat,
      participants,
      lastMessage,
      unreadCount: 0,
    };
  }

  async getUserChats(userId: string): Promise<ChatWithDetails[]> {
    const userParticipations = await db
      .select()
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, userId));

    const chatIds = userParticipations.map(p => p.chatId);
    if (chatIds.length === 0) return [];

    const userChats = await Promise.all(
      chatIds.map(async (chatId) => {
        const chatWithDetails = await this.getChatWithDetails(chatId);
        if (!chatWithDetails) return null;

        // Calculate unread count
        const participation = userParticipations.find(p => p.chatId === chatId);
        const lastRead = participation?.lastRead;
        
        const unreadMessages = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.chatId, chatId),
              sql`${messages.senderId} != ${userId}`,
              lastRead ? sql`${messages.createdAt} > ${lastRead}` : sql`true`
            )
          );

        return {
          ...chatWithDetails,
          unreadCount: Number(unreadMessages[0]?.count || 0),
        };
      })
    );

    return userChats
      .filter((c): c is ChatWithDetails => c !== null)
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.createdAt;
        const bTime = b.lastMessage?.createdAt || b.createdAt;
        return new Date(bTime!).getTime() - new Date(aTime!).getTime();
      });
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [created] = await db.insert(chats).values(chat).returning();
    return created;
  }

  async updateChat(chatId: string, data: Partial<InsertChat>): Promise<Chat | undefined> {
    const [updated] = await db
      .update(chats)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chats.id, chatId))
      .returning();
    return updated;
  }

  async deleteChat(chatId: string): Promise<void> {
    // Delete all messages first
    await db.delete(messages).where(eq(messages.chatId, chatId));
    // Delete all participants
    await db.delete(chatParticipants).where(eq(chatParticipants.chatId, chatId));
    // Delete the chat
    await db.delete(chats).where(eq(chats.id, chatId));
  }

  async getPrivateChatBetweenUsers(userId1: string, userId2: string): Promise<Chat | undefined> {
    // Find private chats where both users are participants
    const user1Chats = await db
      .select()
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, userId1));

    for (const participation of user1Chats) {
      const chat = await this.getChat(participation.chatId);
      if (chat?.type !== 'private') continue;

      const participants = await this.getChatParticipants(participation.chatId);
      if (participants.length === 2 && participants.some(p => p.userId === userId2)) {
        return chat;
      }
    }

    return undefined;
  }

  // Chat Participants
  async addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant> {
    const [created] = await db.insert(chatParticipants).values(participant).returning();
    return created;
  }

  async removeChatParticipant(chatId: string, userId: string): Promise<void> {
    await db
      .delete(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      );
  }

  async updateParticipantRole(chatId: string, userId: string, role: string): Promise<ChatParticipant | undefined> {
    const [updated] = await db
      .update(chatParticipants)
      .set({ role })
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      )
      .returning();
    return updated;
  }

  async getChatParticipant(chatId: string, userId: string): Promise<ChatParticipant | undefined> {
    const [participant] = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      );
    return participant;
  }

  async getChatParticipants(chatId: string): Promise<(ChatParticipant & { profile?: UserProfile })[]> {
    const participants = await db
      .select()
      .from(chatParticipants)
      .where(eq(chatParticipants.chatId, chatId));

    return await Promise.all(
      participants.map(async (p) => {
        const profile = await this.getProfile(p.userId);
        return { ...p, profile };
      })
    );
  }

  // Messages
  async getMessages(chatId: string, limit: number = 50): Promise<MessageWithSender[]> {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    const messagesWithSender = await Promise.all(
      msgs.map(async (m) => {
        const sender = await this.getProfile(m.senderId);
        return { ...m, sender };
      })
    );

    return messagesWithSender.reverse();
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    
    // Update chat's updatedAt
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, message.chatId));

    return created;
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    await db
      .update(chatParticipants)
      .set({ lastRead: new Date() })
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      );
  }

  // Friendships
  async getFriendship(userId: string, friendId: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
          and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
        )
      );
    return friendship;
  }

  async createFriendship(friendship: InsertFriendship): Promise<Friendship> {
    const [created] = await db.insert(friendships).values(friendship).returning();
    return created;
  }

  async updateFriendshipStatus(id: string, status: string): Promise<Friendship | undefined> {
    const [updated] = await db
      .update(friendships)
      .set({ status })
      .where(eq(friendships.id, id))
      .returning();
    return updated;
  }

  async getUserFriends(userId: string): Promise<(Friendship & { friend?: UserProfile })[]> {
    const userFriendships = await db
      .select()
      .from(friendships)
      .where(
        and(
          or(eq(friendships.userId, userId), eq(friendships.friendId, userId)),
          eq(friendships.status, 'accepted')
        )
      );

    return await Promise.all(
      userFriendships.map(async (f) => {
        const friendId = f.userId === userId ? f.friendId : f.userId;
        const friend = await this.getProfile(friendId);
        return { ...f, friend };
      })
    );
  }

  async getPendingRequests(userId: string): Promise<(Friendship & { user?: UserProfile })[]> {
    const pending = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.friendId, userId),
          eq(friendships.status, 'pending')
        )
      );

    return await Promise.all(
      pending.map(async (f) => {
        const user = await this.getProfile(f.userId);
        return { ...f, user };
      })
    );
  }
}

export const storage = new DatabaseStorage();
