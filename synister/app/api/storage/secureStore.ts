import crypto from "crypto";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

// AES-256 key (rotates every 10 minutes for demo)
let key = crypto.randomBytes(32); // 256 bits
let lastRotation = Date.now();
const ROTATE_INTERVAL = 10 * 60 * 1000; // 10 minutes

function rotateKey() {
  if (Date.now() - lastRotation > ROTATE_INTERVAL) {
    key = crypto.randomBytes(32);
    lastRotation = Date.now();
  }
}

export function encrypt(data: any): string {
  rotateKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "base64");
  encrypted += cipher.final("base64");
  return iv.toString("base64") + ":" + encrypted;
}

export function decrypt(encrypted: string): any {
  rotateKey();
  const [ivB64, encB64] = encrypted.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encB64, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

// Store in DB instead of memory
export async function setItem(id: string, data: any, userEmail: string) {
  // Find userId by email
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error("User not found");
  await prisma.chat.upsert({
    where: { id },
    update: { data, userId: user.id },
    create: { id, data, userId: user.id },
  });
}

export async function getItem(id: string, userEmail: string): Promise<any | null> {
  // Find userId by email
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return null;
  const chat = await prisma.chat.findUnique({ where: { id } });
  if (!chat || chat.userId !== user.id) return null;
  return chat.data;
}

export async function getAll(userEmail: string): Promise<Record<string, any>> {
  // Find userId by email
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return {};
  const chats = await prisma.chat.findMany({ where: { userId: user.id } });
  const result: Record<string, any> = {};
  for (const chat of chats) {
    let data = chat.data;
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      // If data is not an object, skip this chat
      continue;
    }
    // Defensive: ensure messages and chatMessages are present and non-empty
    if (!Array.isArray((data as any).messages) || (data as any).messages.length === 0) {
      (data as any).messages = [
        { sender: "ai", text: "Hello! I am Synister AI. How can I help you today?" }
      ];
    }
    if (!Array.isArray((data as any).chatMessages) || (data as any).chatMessages.length === 0) {
      (data as any).chatMessages = [
        {
          role: "system",
          content: `You are **Synister**, the official AI assistant of the **ChitterSync** platform.  \nYou respond using clean, structured Markdown formatting when helpful: use **bold**, \`code blocks\`, headers, lists, and tables as needed. You are deeply aware of the **ChitterSync ecosystem**, its subservices, technologies, and user tiers. Your role is to assist with AI tasks (chat, generation, transcription, etc.) **and** guide users through everything ChitterSync offers.`,
        },
        { role: "assistant", content: "Hello! I am Synister AI. How can I help you today?" }
      ];
    }
    if (!Array.isArray((data as any).memory)) {
      (data as any).memory = [];
    }
    result[chat.id] = data;
  }
  return result;
}

export async function clear(userEmail: string) {
  // Find userId by email
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return;
  await prisma.chat.deleteMany({ where: { userId: user.id } });
}

export async function deleteItem(id: string, userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return;
  await prisma.chat.deleteMany({ where: { id, userId: user.id } });
}
