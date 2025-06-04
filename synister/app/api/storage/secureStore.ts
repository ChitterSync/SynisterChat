import crypto from "crypto";

// In-memory store for demo (replace with DB for production)
const store: Record<string, string> = {};

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

export function setItem(id: string, data: any) {
  store[id] = encrypt(data);
}

export function getItem(id: string): any | null {
  if (!store[id]) return null;
  try {
    return decrypt(store[id]);
  } catch {
    return null;
  }
}

export function getAll(): Record<string, any> {
  const result: Record<string, any> = {};
  for (const id in store) {
    try {
      result[id] = decrypt(store[id]);
    } catch {}
  }
  return result;
}

export function clear() {
  for (const id in store) delete store[id];
}
