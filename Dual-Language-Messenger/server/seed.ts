import { db } from "./db";
import { userProfiles, chats, chatParticipants, messages } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if we already have seed data
    const existingProfiles = await db.select().from(userProfiles).limit(1);
    if (existingProfiles.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database with demo data...");

    // Create demo user profiles
    const demoUsers = [
      {
        userId: "demo_alex_001",
        tag: "alex_dev",
        displayName: "Alex Johnson",
        bio: "Full-stack developer | Open source enthusiast",
        language: "en",
        isOnline: true,
      },
      {
        userId: "demo_maria_002",
        tag: "maria_design",
        displayName: "Maria Petrova",
        bio: "UI/UX Designer | Creating beautiful experiences",
        language: "ru",
        isOnline: true,
      },
      {
        userId: "demo_james_003",
        tag: "james_pm",
        displayName: "James Wilson",
        bio: "Product Manager | Building the future",
        language: "en",
        isOnline: false,
      },
      {
        userId: "demo_anna_004",
        tag: "anna_code",
        displayName: "Anna Smirnova",
        bio: "Backend engineer | Coffee lover",
        language: "ru",
        isOnline: true,
      },
    ];

    await db.insert(userProfiles).values(demoUsers);

    // Create demo chats
    const chat1 = await db.insert(chats).values({
      type: "private",
    }).returning();

    const chat2 = await db.insert(chats).values({
      type: "private",
    }).returning();

    // Add participants
    await db.insert(chatParticipants).values([
      { chatId: chat1[0].id, userId: "demo_alex_001" },
      { chatId: chat1[0].id, userId: "demo_maria_002" },
      { chatId: chat2[0].id, userId: "demo_alex_001" },
      { chatId: chat2[0].id, userId: "demo_james_003" },
    ]);

    // Add some demo messages
    const now = new Date();
    await db.insert(messages).values([
      {
        chatId: chat1[0].id,
        senderId: "demo_alex_001",
        content: "Hey Maria! How's the new design coming along?",
        type: "text",
        createdAt: new Date(now.getTime() - 3600000 * 2),
      },
      {
        chatId: chat1[0].id,
        senderId: "demo_maria_002",
        content: "Hi Alex! It's going great! Just finished the dark theme mockups.",
        type: "text",
        createdAt: new Date(now.getTime() - 3600000),
      },
      {
        chatId: chat1[0].id,
        senderId: "demo_alex_001",
        content: "Awesome! Can't wait to see them. The VS Code-inspired theme sounds perfect!",
        type: "text",
        createdAt: new Date(now.getTime() - 1800000),
      },
      {
        chatId: chat2[0].id,
        senderId: "demo_james_003",
        content: "Alex, do we have the sprint planning meeting today?",
        type: "text",
        createdAt: new Date(now.getTime() - 7200000),
      },
      {
        chatId: chat2[0].id,
        senderId: "demo_alex_001",
        content: "Yes! 3 PM. I'll send the agenda shortly.",
        type: "text",
        createdAt: new Date(now.getTime() - 5400000),
      },
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
