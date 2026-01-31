import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Extended user profile with tag
export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id").primaryKey(),
  tag: varchar("tag").notNull().unique(), // @username
  displayName: varchar("display_name"),
  bio: text("bio"),
  language: varchar("language").default("en"), // 'en' or 'ru'
  lastSeen: timestamp("last_seen").defaultNow(),
  isOnline: boolean("is_online").default(false),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  lastSeen: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// Chats (1:1, group, or channel)
export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull().default("private"), // 'private', 'group', or 'channel'
  name: varchar("name"), // For group chats and channels
  description: text("description"), // For groups and channels
  iconUrl: varchar("icon_url"), // Custom icon for groups/channels
  createdBy: varchar("created_by"), // Creator/owner of group or channel
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;

// Chat participants
export const chatParticipants = pgTable("chat_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role").notNull().default("member"), // 'admin' or 'member' (for channels, only admins can post)
  joinedAt: timestamp("joined_at").defaultNow(),
  lastRead: timestamp("last_read"),
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
});

export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull(),
  type: varchar("type").notNull().default("text"), // 'text', 'image', 'file', 'voice'
  attachmentUrl: varchar("attachment_url"), // URL to attached file (image, video, voice)
  attachmentName: varchar("attachment_name"), // Original file name
  attachmentSize: integer("attachment_size"), // File size in bytes
  createdAt: timestamp("created_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Friendships
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  friendId: varchar("friend_id").notNull(),
  status: varchar("status").notNull().default("pending"), // 'pending', 'accepted', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
});

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

// Chat with last message and participant info
export type ChatWithDetails = Chat & {
  participants: (ChatParticipant & { profile?: UserProfile })[];
  lastMessage?: Message;
  unreadCount: number;
};

// Message with sender info
export type MessageWithSender = Message & {
  sender?: UserProfile;
};
