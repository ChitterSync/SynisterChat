"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import ReactMarkdown from "react-markdown";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom, faComments, faHistory, faMemory, faUser, faPlus, faSave, faCheckCircle, faSpinner, faLightbulb, faPaperPlane, faTrash, faEdit, faShare } from '@fortawesome/free-solid-svg-icons';
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

import ClientSessionProvider from "./session-provider";

// Store both display and OpenAI-format messages
const BASE_SYSTEM_PROMPT = `
You are **Synister**, the official AI assistant of the **ChitterSync** platform.  
You respond using clean, structured Markdown formatting when helpful: use **bold**, \`code blocks\`, headers, lists, and tables as needed. You are deeply aware of the **ChitterSync ecosystem**, its subservices, technologies, and user tiers. Your role is to assist with AI tasks (chat, generation, transcription, etc.) **and** guide users through everything ChitterSync offers.

---

## 🏗️ Core Technology Stack

- Built with **Next.js** + **Tailwind CSS**
- Entirely **open source** and community-supported
- GitHub: https://github.com/orgs/ChitterSync/repositories/
- Modular structure allows users to self-host, fork, or extend any part of the platform
- Designed for **anti-ad**, **pro-user**, and **creator-first** philosophies

---

## 🔧 Primary Subservices (Modular & Connected)

ChitterSync operates using modular **Subservices**—independent tools that share a user layer, ecosystem, and design language.

### 🎨 GIA — Guild of Interactive Artists

A creative powerhouse built for community-driven publishing.

- Supports shows, music, comics, animations, books, livestreams
- Creators can form **Labels**, each with multiple **Shows** and **Profiles**
- Supports episodic formats (like podcasts or web series)
- Monetization: user-driven subs, tips, sponsorships—no forced ads
- Built-in streaming player, file storage, and recommendation engine
- Competes with YouTube, TikTok, SoundCloud, Spotify, Webtoon, Bandcamp

### 🏘️ ChitterHaven

Social layer for servers, chat, and real-time community.

- Think Discord, but *decentralized, extensible, and anti-corporate*
- Join/run servers (public/private)
- Built-in voice/video, moderation, bot support
- Deep integration with Gia, Velosync, Synister

### ☁️ Velosync

Cross-service cloud engine.

- File storage: media, AI files, bots, Gia episodes, Haven logs
- Starts at 2.5GB (free)
- CSX unlocks 100GB, cloud integrations, MySQL support

### 🧠 SynisterChat (You)

Powerful AI environment using multiple models.

- Chat completion models:
  - GPT (3.5, 4.5, o4)
  - Claude (Opus, Sonnet)
  - Gemini
  - LLaMA
  - Gwen (external)
  - Starlight (native)
- Image generation:
  - Stable Diffusion (SDXL)
  - DALL·E
- Audio transcription:
  - Whisper
- Jade prompt guidance + context switching

### 📣 PreCorded

Bot engine for Haven servers.

- Command handling, chat emulation, event scheduling
- AI personalities
- Scales by user tier (up to 100 bots w/ memory slots)

### 🕵️‍♀️ Nebulae

Private AI-powered search engine & browser.

- Lens: page analyzer (summary, bias, fact-check)
- Flow: tabless browsing timeline
- Core: removes spam/SEO/ad bloat
- Vault: VPN, encryption
- Shield: tracker/ad blocker
- Echo: time-travel web snapshots

---

## 🧬 Synister Modes

| Mode | Description |
|------|-------------|
| Default | Friendly and structured |
| ProMode | Concise and technical |
| Chaotic Neutral | Meme-heavy and unpredictable |
| Lorekeeper | Roleplay and storytelling |
| Silent Ops | No fluff, just results |
| SynDev | Developer diagnostics |

---

## 👑 User Tiers

| Tier | Price | Benefits |
|------|-------|----------|
| Basic | Free | 1 Gia label, 2.5GB Velosync, 900 friends |
| Silver | $2.49/mo | 3 labels, 5GB, 10 bots |
| Gold | $4.99/mo | 9 labels, 10GB, 25 bots |
| Diamond | $7.49/mo | 18 labels, 15GB, 50 bots |
| CSX | $9.99/mo or $299 lifetime | Unlimited everything, 100GB Velosync, Starlight access |

---

## 🔐 Jade System Prompt

Jade acts as a contextual optimizer for user prompts. She:

- Reroutes unclear queries
- Suggests models based on task
- Flags privacy risks
- Enhances AI sessions based on user tier

---

## 🌟 Starlight (Native Model)

- ChitterSync's custom-trained LLM
- Handles memory, emotional tone, character RP
- Great for long-term interaction and storytelling
- Includes:
  - Starlight Sheets
  - Memory Profiles
  - Personality tuning
- Exclusive to CSX

---

## 🖥️ UI + Commands

- Global commands:
  - \`/chat\` - start or reset a chat
  - \`/image\` - generate image
  - \`/analyze\` - break down content
  - \`/switch model-name\` - change model
- Context panel shows session, memory, model info
- Tabs: Gia / Haven / Synister / Velosync / CSX / Settings

---

## 🔐 Privacy Promise

- No forced ads or reselling
- Full control of memory, models, AI logs
- Synister warns before leaving ChitterSync ecosystem

---

## 🔌 Coming Soon

- Gia Marketplace (digital products)
- ChitterDrop (collab livestreaming)
- Echo Replay (interactive history)
- SyncDrive (encrypted storage)
- ChitterStudio (browser-based media suite)

---

You are here to assist with **AI requests** and **guide users through ChitterSync**. If they ask about features, tiers, bots, Synister tools, or integrations, reply with precise answers and offer extra tools if needed.
`;;

// Settings Modal Tabs
type SettingsTab = "general" | "appearance" | "chat" | "account" | "about";

// Chat session type
type ChatSession = {
  id: string;
  title: string;
  created: number;
  messages: Array<{ sender: string; text: string }>;
  chatMessages: Array<{ role: string; content: string }>;
  memory: string[];
};

function getDefaultSession(): ChatSession {
  return {
    id: `chat-${Date.now()}`,
    title: "New Chat",
    created: Date.now(),
    messages: [
      { sender: "ai", text: "Hello! I am Synister AI. How can I help you today?" },
    ],
    chatMessages: [
      {
        role: "system",
        content: BASE_SYSTEM_PROMPT,
      },
      { role: "assistant", content: "Hello! I am Synister AI. How can I help you today?" },
    ],
    memory: [],
  };
}

// Fix: Use React.FC instead of JSX.Element for export default function
export default function Home(): React.ReactElement {
  return (
    <ClientSessionProvider>
      <HomeContent />
    </ClientSessionProvider>
  );
}

function HomeContent(): React.ReactElement {
  // --- All hooks must be called unconditionally at the top ---
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [memorySaved, setMemorySaved] = useState(true);
  const [memoryJustUpdated, setMemoryJustUpdated] = useState(false);
  const [memorySaving, setMemorySaving] = useState(false);
  const [lastMessageIdx, setLastMessageIdx] = useState<number>(-1);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [shareStatus, setShareStatus] = useState<string>("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [lastSharedId, setLastSharedId] = useState<string | null>(null);
  const [jsonEditId, setJsonEditId] = useState<string | null>(null);
  const [jsonEditValue, setJsonEditValue] = useState<string>("");
  const [jsonEditError, setJsonEditError] = useState<string>("");

  const { data: session, status } = useSession();

  // Settings modal improvements
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("synister-dark-mode") === "true";
    }
    return false;
  });
  const [fontSize, setFontSize] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("synister-font-size") || "base";
    }
    return "base";
  });
  const [bubbleStyle, setBubbleStyle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("synister-bubble-style") || "rounded";
    }
    return "rounded";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", darkMode);
      localStorage.setItem("synister-dark-mode", darkMode ? "true" : "false");
    }
  }, [darkMode]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("synister-font-size", fontSize);
    }
  }, [fontSize]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("synister-bubble-style", bubbleStyle);
    }
  }, [bubbleStyle]);

  // Delete chat handler
  async function deleteChat(id: string) {
    if (sessions.length === 1) return; // Don't delete last chat
    // Persist deletion to backend
    const res = await fetch(`/api/storage?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      setSessions((prev: ChatSession[]) => {
        const filtered = prev.filter(s => s.id !== id);
        // If current chat is deleted, switch to first remaining
        if (currentSessionId === id && filtered.length > 0) {
          setCurrentSessionId(filtered[0].id);
        }
        return filtered;
      });
    } else {
      // Optionally show error to user
      alert("Failed to delete chat. Please try again.");
    }
  }

  // Rename chat handlers
  function startRenaming(id: string, currentTitle: string) {
    setRenamingId(id);
    setRenameValue(currentTitle);
  }
  function handleRenameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRenameValue(e.target.value);
  }
  function finishRenaming(id: string) {
    setSessions((prev: ChatSession[]) => prev.map(s =>
      s.id === id ? { ...s, title: renameValue.trim() || "Untitled Chat" } : s
    ));
    setRenamingId(null);
    setRenameValue("");
  }

  // Share chat handler (copy JSON to clipboard)
  async function shareChat(id: string) {
    const chat = sessions.find(s => s.id === id);
    if (!chat) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(chat, null, 2));
      setLastSharedId(id);
      setShareStatus("Copied!");
      setTimeout(() => {
        setShareStatus("");
        setLastSharedId(null);
      }, 1200);
    } catch {
      setShareStatus("Failed to copy");
      setTimeout(() => setShareStatus(""), 1200);
    }
  }

  // Open JSON editor for a chat
  function openJsonEditor(chatId: string) {
    const chat = sessions.find(s => s.id === chatId);
    if (!chat) return;
    setJsonEditId(chatId);
    setJsonEditValue(JSON.stringify(chat, null, 2));
    setJsonEditError("");
  }
  // Save JSON edits
  function saveJsonEdit() {
    try {
      const parsed = JSON.parse(jsonEditValue);
      if (!parsed.id || !parsed.messages || !parsed.chatMessages) {
        setJsonEditError("JSON must include id, messages, and chatMessages fields.");
        return;
      }
      setSessions(prev => prev.map(s => s.id === jsonEditId ? parsed : s));
      setJsonEditId(null);
      setJsonEditValue("");
      setJsonEditError("");
    } catch (e: any) {
      setJsonEditError("Invalid JSON: " + e.message);
    }
  }

  // --- End of hooks ---

  // Helper to reset all chat sessions and global storage
  async function resetAllSessions() {
    await fetch("/api/storage", { method: "DELETE" });
    const def = getDefaultSession();
    setSessions([def]);
    setCurrentSessionId(def.id);
    setInput("");
  }

  // On mount, load sessions from encrypted global storage
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/storage");
        const json = await res.json();
        const allSessions = json.data || {};
        // Defensive: ensure every session has required fields and at least the default welcome message
        const sessionArr: ChatSession[] = Object.values(allSessions).map((s: any) => {
          let messages = Array.isArray(s.messages) ? s.messages : [];
          let chatMessages = Array.isArray(s.chatMessages) ? s.chatMessages : [];
          // Validate messages: must be array of objects with sender/text
          if (!messages.length || !messages.every((m: any) => m && typeof m.sender === 'string' && typeof m.text === 'string')) {
            messages = [{ sender: "ai", text: "Hello! I am Synister AI. How can I help you today?" }];
          }
          // Validate chatMessages: must be array of objects with role/content
          if (!chatMessages.length || !chatMessages.every((m: any) => m && typeof m.role === 'string' && typeof m.content === 'string')) {
            chatMessages = [
              { role: "system", content: BASE_SYSTEM_PROMPT },
              { role: "assistant", content: "Hello! I am Synister AI. How can I help you today?" }
            ];
          }
          return {
            id: s.id,
            title: s.title ?? "Untitled Chat",
            created: s.created ?? Date.now(),
            messages,
            chatMessages,
            memory: Array.isArray(s.memory) ? s.memory : [],
          };
        });
        let lastId = "";
        if (typeof window !== "undefined") {
          lastId = localStorage.getItem("synister-last-chat-id") || "";
        }
        let initialId = sessionArr[0]?.id || "";
        if (lastId && sessionArr.some(s => s.id === lastId)) {
          initialId = lastId;
        }
        if (sessionArr.length > 0) {
          setSessions(sessionArr);
          setCurrentSessionId(initialId);
        } else {
          const def = getDefaultSession();
          setSessions([def]);
          setCurrentSessionId(def.id);
        }
      } catch {
        const def = getDefaultSession();
        setSessions([def]);
        setCurrentSessionId(def.id);
      }
      setMounted(true);
    })();
  }, []);

  // Save last active chat to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && currentSessionId) {
      localStorage.setItem("synister-last-chat-id", currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    (async () => {
      for (const session of sessions) {
        await fetch("/api/storage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: session.id, data: session })
        });
      }
    })();
  }, [sessions]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("synister-chat-sessions-v2", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Derived state for current session (must be before any use of currentSession)
  const currentSession: ChatSession | null = sessions.length > 0
    ? sessions.find((s: ChatSession) => s.id === currentSessionId) || sessions[0]
    : null;
  const messages = currentSession ? currentSession.messages : [];
  const memory = currentSession ? currentSession.memory : [];

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentSession) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, currentSession]);

  useEffect(() => {
    setMemorySaved(false);
    setMemoryJustUpdated(true);
    setMemorySaving(true);
    const saveTimeout = setTimeout(() => {
      setMemorySaved(true);
      setMemorySaving(false);
    }, 500);
    const updateTimeout = setTimeout(() => setMemoryJustUpdated(false), 1200);
    return () => {
      clearTimeout(saveTimeout);
      clearTimeout(updateTimeout);
    };
  }, [currentSession?.memory]);

  // Remove duplicate declaration of currentSession

  // Helper: extract memory-worthy facts from a user message (simple matcher)
  // Enhanced: extract memory actions (add, update, remove) from user message
  function extractMemoryActions(message: string): { add: string[], remove: string[], update: { old: string, new: string }[] } {
    const add: string[] = [];
    const remove: string[] = [];
    const update: { old: string, new: string }[] = [];
    // Add patterns
    const addPatterns = [
      /my name is ([^\.!?\n]+)/i,
      /I am ([^\.!?\n]+)/i,
      /I like ([^\.!?\n]+)/i,
      /remember (that )?([^\.!?\n]+)/i,
      /my favorite ([^\.!?\n]+)/i,
      /call me ([^\.!?\n]+)/i,
      /I live in ([^\.!?\n]+)/i,
      /I work as ([^\.!?\n]+)/i,
      /my pronouns are ([^\.!?\n]+)/i,
      /birthday is ([^\.!?\n]+)/i,
      /I have ([^\.!?\n]+)/i,
      /I want ([^\.!?\n]+)/i,
      /I need ([^\.!?\n]+)/i,
      /my goal is ([^\.!?\n]+)/i,
    ];
    for (const pat of addPatterns) {
      const m = message.match(pat);
      if (m && m[0]) {
        add.push(m[0].trim());
      }
    }
    // Remove patterns
    const removePatterns = [
      /forget (that )?(my name is|I am|I like|my favorite|call me|I live in|I work as|my pronouns are|birthday is|I have|I want|I need|my goal is) ([^\.!?\n]+)/i,
      /remove (my name|I am|I like|my favorite|call me|I live in|I work as|my pronouns|birthday|I have|I want|I need|my goal)/i,
      /delete (my name|I am|I like|my favorite|call me|I live in|I work as|my pronouns|birthday|I have|I want|I need|my goal)/i,
      /clear (my name|I am|I like|my favorite|call me|I live in|I work as|my pronouns|birthday|I have|I want|I need|my goal)/i,
    ];
    for (const pat of removePatterns) {
      const m = message.match(pat);
      if (m && m[0]) {
        remove.push(m[0].trim());
      }
    }
    // Update patterns (e.g. "update my name to ...", "change my favorite to ...")
    const updatePatterns = [
      /update (my name|I am|I like|my favorite|call me|I live in|I work as|my pronouns|birthday|I have|I want|I need|my goal) (to|is|:) ([^\.!?\n]+)/i,
      /change (my name|I am|I like|my favorite|call me|I live in|I work as|my pronouns|birthday|I have|I want|I need|my goal) (to|is|:) ([^\.!?\n]+)/i,
    ];
    for (const pat of updatePatterns) {
      const m = message.match(pat);
      if (m && m[1] && m[3]) {
        update.push({ old: m[1], new: m[3].trim() });
      }
    }
    return { add, remove, update };
  }

  // Compose the system prompt with memory (for current session)
  const SYSTEM_PROMPT = {
    role: "system",
    content:
      BASE_SYSTEM_PROMPT +
      (currentSession && currentSession.memory && currentSession.memory.length > 0
        ? `\n\nHere are some facts or context to remember for this user (auto-logged memory):\n- ${currentSession.memory.join("\n- ")}`
        : "") +
      "\n\nIMPORTANT: Do not include or repeat any user input that may violate content policies. If a user request is filtered or rejected by the API, respond with a helpful, neutral message and do not attempt to bypass or rephrase the filtered content. Always comply with Azure OpenAI content management policies. For more information, see: https://go.microsoft.com/fwlink/?linkid=2198766",
  };

  // Helper: get AI-generated chat title
  async function fetchChatTitle(chatHistory: { role: string; content: string }[]): Promise<string> {
    const titlePrompt = {
      role: "system",
      content: "You are an expert at summarizing conversations. Based on the conversation so far, suggest a short, descriptive chat title (max 8 words, no punctuation, no quotes, no emojis, no colons, no periods, no special characters, just plain words). Only return the title, nothing else."
    };
    const messages = [titlePrompt, ...chatHistory];
    try {
      const res = await fetch("/api/gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      if (typeof data.reply === "string") {
        // Clean up: remove quotes, punctuation, trim
        return data.reply.replace(/["'.,:;!?\-]/g, "").trim();
      }
    } catch {}
    return "Untitled Chat";
  }

  // Per-chat request queue and rate limiting
  const [pendingRequests, setPendingRequests] = useState<{ [chatId: string]: boolean }>({});
  const [queuedMessages, setQueuedMessages] = useState<{ [chatId: string]: string[] }>({});
  const [rateLimitWarning, setRateLimitWarning] = useState<string>("");

  // Helper to process next message in queue for a chat
  const processNextInQueue = async (chatId: string) => {
    setPendingRequests(pr => ({ ...pr, [chatId]: false }));
    if (queuedMessages[chatId] && queuedMessages[chatId].length > 0) {
      const nextMsg = queuedMessages[chatId][0];
      setQueuedMessages(qm => ({ ...qm, [chatId]: qm[chatId].slice(1) }));
      await sendMessageInternal(nextMsg, chatId);
    }
  };

  // Internal sendMessage logic, used for queueing
  const sendMessageInternal = async (message: string, chatId: string) => {
    setPendingRequests(pr => ({ ...pr, [chatId]: true }));
    const userMessage = { sender: "user", text: message };
    const chatUserMessage = { role: "user", content: message };
    const { add: newFacts, remove: removeFacts, update: updateFacts } = extractMemoryActions(message);
    setSessions((prev: ChatSession[]) => {
      const idx = prev.findIndex(s => s.id === chatId);
      if (idx === -1) return prev;
      const chat = prev[idx];
      const updatedMemory = (() => {
        let mem = [...chat.memory];
        for (const rem of removeFacts) {
          mem = mem.filter(fact => !fact.toLowerCase().includes(rem.toLowerCase()));
        }
        for (const upd of updateFacts) {
          mem = mem.map(fact =>
            fact.toLowerCase().includes(upd.old.toLowerCase()) ? `${upd.old} ${upd.new}` : fact
          );
        }
        for (const fact of newFacts) {
          if (!mem.includes(fact)) mem.push(fact);
        }
        return mem;
      })();
      let updatedMessages = [...chat.messages, userMessage];
      if (updatedMessages.length > 2000) updatedMessages = updatedMessages.slice(-2000);
      let updatedChatMessages = [...chat.chatMessages, chatUserMessage];
      if (updatedChatMessages.length > 2000) updatedChatMessages = updatedChatMessages.slice(-2000);
      let newTitle = chat.title;
      if (chat.messages.length === 1 && userMessage.text.length > 0) {
        newTitle = userMessage.text.slice(0, 32) + (userMessage.text.length > 32 ? "..." : "");
      }
      const updatedChat = { ...chat, memory: updatedMemory, messages: updatedMessages, chatMessages: updatedChatMessages, title: newTitle };
      const newArr = [updatedChat, ...prev.filter((_, i) => i !== idx)];
      return newArr;
    });
    setCurrentSessionId(chatId);
    setInput("");
    setWaiting(true);
    try {
      const session = sessions.find(s => s.id === chatId) || getDefaultSession();
      const chatHistory = [
        {
          role: "system",
          content:
            BASE_SYSTEM_PROMPT +
            (session.memory.length > 0
              ? `\n\nHere are some facts or context to remember for this user (auto-logged memory):\n- ${session.memory.join("\n- ")}`
              : ""),
        },
        ...session.chatMessages.slice(-12),
        chatUserMessage,
      ];
      const res = await fetch("/api/gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });
      const data = await res.json();
      setSessions((prev: ChatSession[]) => prev.map((s: ChatSession) => {
        if (s.id !== chatId) return s;
        let updatedMessages = [...s.messages, { sender: "ai", text: data.reply }];
        if (updatedMessages.length > 2000) updatedMessages = updatedMessages.slice(-2000);
        let updatedChatMessages = [...chatHistory, { role: "assistant", content: data.reply }];
        if (updatedChatMessages.length > 2000) updatedChatMessages = updatedChatMessages.slice(-2000);
        return { ...s, messages: updatedMessages, chatMessages: updatedChatMessages };
      }));
      // AI chat title generation (unchanged)
      setTimeout(async () => {
        setSessions((prev: ChatSession[]) => prev.map((s: ChatSession) => {
          if (s.id !== chatId) return s;
          if (s.title && s.title !== "New Chat" && !(s.messages.length === 2)) return s;
          return { ...s, title: "(Generating title...)" };
        }));
        const sessionAfter = sessions.find(s => s.id === chatId) || getDefaultSession();
        const chatHistoryForTitle = sessionAfter.chatMessages.slice(-8);
        const aiTitle = await fetchChatTitle(chatHistoryForTitle);
        setSessions((prev: ChatSession[]) => prev.map((s: ChatSession) => {
          if (s.id !== chatId) return s;
          if (s.title && s.title !== "New Chat" && s.title !== "(Generating title...)") return s;
          return { ...s, title: aiTitle || "Untitled Chat" };
        }));
      }, 400);
    } catch {
      setSessions((prev: ChatSession[]) => prev.map((s: ChatSession) => {
        if (s.id !== chatId) return s;
        let updatedMessages = [...s.messages, { sender: "ai", text: "Sorry, I couldn't get a response." }];
        if (updatedMessages.length > 2000) updatedMessages = updatedMessages.slice(-2000);
        let updatedChatMessages = [...s.chatMessages, { role: "assistant", content: "Sorry, I couldn't get a response." }];
        if (updatedChatMessages.length > 2000) updatedChatMessages = updatedChatMessages.slice(-2000);
        return { ...s, messages: updatedMessages, chatMessages: updatedChatMessages };
      }));
    } finally {
      setWaiting(false);
      setPendingRequests(pr => ({ ...pr, [chatId]: false }));
      processNextInQueue(chatId);
    }
  };

  // Overwrite sendMessage to use queue/rate limit
  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (pendingRequests[currentSessionId]) {
      // Queue the message
      setQueuedMessages(qm => ({
        ...qm,
        [currentSessionId]: [...(qm[currentSessionId] || []), input]
      }));
      setRateLimitWarning("Please wait for the current AI response before sending another message in this chat. Your message has been queued.");
      setTimeout(() => setRateLimitWarning(""), 2000);
      setInput("");
      return;
    }
    setRateLimitWarning("");
    await sendMessageInternal(input, currentSessionId);
  };

  // New chat handler
  const newChat = () => {
    const newSession = getDefaultSession();
    setSessions((prev: ChatSession[]) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setInput("");
  };

  // Reset memory handler (for current session)
  const resetMemory = () => {
    setSessions((prev: ChatSession[]) => prev.map((s: ChatSession) =>
      s.id === currentSessionId ? { ...s, memory: [] } : s
    ));
  };

  // Move clearHistory outside of the conditional to comply with the Rules of Hooks
  function clearHistory(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault();
    setSessions((prev: ChatSession[]) =>
      prev.map((s: ChatSession) =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: [
                { sender: "ai", text: "Hello! I am Synister AI. How can I help you today?" }
              ],
              chatMessages: [
                {
                  role: "system",
                  content: BASE_SYSTEM_PROMPT,
                },
                { role: "assistant", content: "Hello! I am Synister AI. How can I help you today?" }
              ]
            }
          : s
      )
    );
  }
  // Do not place any hooks below this point!
  if (!currentSession) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="text-center">
          <div className="mb-4 text-gray-500">No chat sessions found.</div>
          <button
            className="text-xs px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition flex items-center gap-2"
            onClick={resetAllSessions}
          >
            <FontAwesomeIcon icon={faPlus} /> Start New Chat
          </button>
          <button
            className="text-xs px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-2 mt-2"
            onClick={resetAllSessions}
          >
            <FontAwesomeIcon icon={faBroom} /> Reset All (Clear Local Storage)
          </button>
        </div>
      </div>
    );
  }
  return (
    <ClientSessionProvider>
      <div className="flex flex-row min-h-screen w-screen items-stretch justify-stretch bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#f1f5f9] dark:from-[#181c20] dark:via-[#23272e] dark:to-[#1a1d23] p-0">
        {/* Auth UI (Vercel-style, top right) */}
        <div className="absolute top-6 right-8 z-50 flex items-center gap-4">
          {status === "loading" ? (
            <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
          ) : session ? (
            <div className="flex items-center gap-2 bg-white/70 dark:bg-gray-900/70 rounded-full px-3 py-1 shadow border border-gray-200 dark:border-gray-700">
              {session.user?.image && (
                <Image src={session.user.image} alt="avatar" width={32} height={32} className="rounded-full border border-gray-300" />
              )}
              <span className="font-medium text-gray-800 dark:text-gray-100 text-sm">{session.user?.name || session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="ml-2 px-3 py-1 rounded-full bg-black text-white hover:bg-gray-800 transition text-xs font-semibold shadow"
              >Sign out</button>
            </div>
          ) : (
            <button
              onClick={() => signIn("github")}
              className="px-5 py-2 rounded-full bg-black text-white hover:bg-gray-800 transition text-base font-semibold shadow flex items-center gap-2 border border-gray-900"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="inline-block mr-2"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              Sign in with GitHub
            </button>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-72 min-w-[200px] max-w-xs bg-white/70 dark:bg-gray-900/70 border-r border-gray-200 dark:border-gray-800 flex flex-col p-0 z-40 transition-all duration-300 shadow-xl backdrop-blur-md rounded-r-3xl mt-6 mb-6 ml-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <span className="font-bold text-base flex items-center gap-2"><FontAwesomeIcon icon={faComments} /> Chats</span>
            <button
              className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition shadow flex items-center gap-1"
              onClick={newChat}
              title="Start a new chat"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {sessions.length === 0 ? (
              <div className="text-xs text-gray-400 p-4">No chats yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {sessions.map((s: ChatSession) => (
                  <li
                    key={s.id}
                    className={`px-4 py-3 cursor-pointer flex flex-col gap-0.5 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 ${s.id === currentSessionId ? 'bg-blue-100 dark:bg-gray-700 border-l-4 border-blue-500 scale-[1.03] shadow-md' : ''}`}
                    onClick={() => setCurrentSessionId(s.id)}
                    style={{ transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)' }}
                  >
                    <div className="flex items-center gap-2 relative">
                      {renamingId === s.id ? (
                        <input
                          className="font-semibold text-sm truncate bg-white dark:bg-gray-800 border border-blue-400 rounded px-1 py-0.5 w-32 focus:outline-none"
                          value={renameValue}
                          autoFocus
                          onChange={handleRenameChange}
                          onBlur={() => finishRenaming(s.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') finishRenaming(s.id);
                            if (e.key === 'Escape') { setRenamingId(null); setRenameValue(""); }
                          }}
                        />
                      ) : (
                        <span className={`font-semibold text-sm truncate ${s.id === currentSessionId ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>{s.title || 'Untitled Chat'}</span>
                      )}
                      <button
                        className="ml-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="More actions"
                        onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === s.id ? null : s.id); }}
                        tabIndex={0}
                        aria-haspopup="true"
                        aria-expanded={menuOpenId === s.id}
                      >
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><circle cx="4" cy="10" r="2"/><circle cx="10" cy="10" r="2"/><circle cx="16" cy="10" r="2"/></svg>
                      </button>
                      {menuOpenId === s.id && (
                        <div className="absolute right-0 top-7 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg min-w-[120px] text-sm animate-fadeIn" onClick={e => e.stopPropagation()}>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            onClick={e => { e.stopPropagation(); setMenuOpenId(null); startRenaming(s.id, s.title); }}
                          >
                            <FontAwesomeIcon icon={faEdit} /> Rename
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-green-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            onClick={e => { e.stopPropagation(); setMenuOpenId(null); shareChat(s.id); }}
                          >
                            <FontAwesomeIcon icon={faShare} /> Share
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-yellow-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            onClick={e => { e.stopPropagation(); setMenuOpenId(null); openJsonEditor(s.id); }}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h8"/></svg>
                            Edit JSON
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                            disabled={sessions.length === 1}
                            onClick={e => { e.stopPropagation(); setMenuOpenId(null); deleteChat(s.id); }}
                          >
                            <FontAwesomeIcon icon={faTrash} /> Delete
                          </button>
                        </div>
                      )}
                      {shareStatus && lastSharedId === s.id && (
                        <span className="ml-1 text-xs text-green-500">{shareStatus}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(s.created).toLocaleString()}</span>
                    {s.id === currentSessionId && <span className="text-[10px] text-blue-500">Current</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="text-[10px] text-gray-400 px-4 py-2 border-t border-gray-200 dark:border-gray-800 rounded-b-2xl">{sessions.length} chat{sessions.length !== 1 ? 's' : ''}</div>
        </aside>

        {/* Main content */}
        <div className="flex flex-col flex-1 min-h-screen items-center justify-stretch">
          {/* Settings button */}
          <div className="w-full max-w-3xl flex justify-end items-center mb-4 gap-2 px-8 pt-8 sticky top-0 z-30 bg-transparent">
            <button
              className="text-xs px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition shadow flex items-center gap-2 border border-gray-200 dark:border-gray-700"
              onClick={() => setShowSettings(true)}
            >
              <FontAwesomeIcon icon={faUser} /> Settings
            </button>
          </div>

          {/* Chat UI */}
          <div className="w-full max-w-3xl flex-1 flex flex-col bg-white/80 dark:bg-black/40 rounded-3xl shadow-2xl p-8 mb-8 min-h-0 border border-gray-200 dark:border-gray-800 backdrop-blur-md" style={{height: '60vh', minHeight: 320}}>
            <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar" style={{ minHeight: 0 }}>
              {currentSession.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[80%] text-sm transition-all duration-300 will-change-transform
                      ${i === lastMessageIdx ? 'opacity-0 translate-y-4 animate-messageIn' : 'opacity-100 translate-y-0'}
                      ${msg.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"}
                    `}
                    style={i === lastMessageIdx ? { animationDelay: '0.05s' } : {}}
                    onAnimationEnd={e => {
                      if (i === lastMessageIdx) {
                        (e.currentTarget as HTMLDivElement).classList.remove('animate-messageIn');
                        (e.currentTarget as HTMLDivElement).style.opacity = '1';
                        (e.currentTarget as HTMLDivElement).style.transform = 'none';
                      }
                    }}
                  >
                    {msg.sender === "ai" ? (
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {waiting && (
                <div className="mb-2 flex justify-start">
                  <div className="px-3 py-2 rounded-lg max-w-[80%] text-sm bg-gradient-to-r from-blue-200 via-blue-100 to-white dark:from-gray-700 dark:via-gray-800 dark:to-black text-gray-600 dark:text-gray-200 animate-pulse shadow">
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin mr-1 text-blue-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                      AI is typing…
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-3 sticky bottom-0 z-20 bg-white/80 dark:bg-black/60 p-4 rounded-2xl shadow-lg mt-4 border border-gray-200 dark:border-gray-700 backdrop-blur-md">
              <textarea
                className="flex-1 rounded-xl border px-4 py-3 text-base bg-white dark:bg-black/60 border-gray-300 dark:border-gray-600 focus:outline-none resize-y min-h-[2.5em] max-h-40 shadow-sm"
                value={input}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                placeholder={
                  waiting
                    ? "Waiting for AI response…"
                    : input
                      ? "Shift+Enter for linebreak, Enter to send"
                      : "Type your message…"
                }
                autoFocus
                disabled={waiting || pendingRequests[currentSessionId]}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim()) {
                      sendMessage(e as any);
                    }
                  }
                }}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl disabled:opacity-50 flex items-center justify-center text-base font-semibold shadow-md"
                disabled={!input.trim() || waiting || pendingRequests[currentSessionId]}
                title="Send"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </form>
            {rateLimitWarning && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 text-center animate-pulse">{rateLimitWarning}</div>
            )}
          </div>
          <footer className="text-xs text-gray-500 dark:text-gray-400 text-center mt-8 w-full flex flex-col items-center justify-center px-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <FontAwesomeIcon icon={faComments} className="text-blue-500" />
              <span className="font-semibold text-base">SynisterLLM | ChitterSync &copy; 2025</span>
            </div>
            <span className="text-[11px]">By using SynisterChat you consent to letting us train our Language Models using your conversations</span>
          </footer>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl p-0 overflow-hidden animate-scaleIn border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 via-white to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
                <div className="flex gap-2">
                  <button className={`text-xs px-4 py-2 rounded-full flex items-center gap-2 font-semibold ${settingsTab === 'general' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`} onClick={() => setSettingsTab('general')}><FontAwesomeIcon icon={faLightbulb} /> General</button>
                  <button className={`text-xs px-4 py-2 rounded-full flex items-center gap-2 font-semibold ${settingsTab === 'appearance' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`} onClick={() => setSettingsTab('appearance')}><FontAwesomeIcon icon={faComments} /> Appearance</button>
                  <button className={`text-xs px-4 py-2 rounded-full flex items-center gap-2 font-semibold ${settingsTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`} onClick={() => setSettingsTab('chat')}><FontAwesomeIcon icon={faHistory} /> Chat</button>
                  <button className={`text-xs px-4 py-2 rounded-full flex items-center gap-2 font-semibold ${settingsTab === 'account' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`} onClick={() => setSettingsTab('account')}><FontAwesomeIcon icon={faUser} /> Account</button>
                  <button className={`text-xs px-4 py-2 rounded-full flex items-center gap-2 font-semibold ${settingsTab === 'about' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`} onClick={() => setSettingsTab('about')}><FontAwesomeIcon icon={faLightbulb} /> About</button>
                </div>
                <button className="text-lg px-3 py-1 hover:text-red-500 rounded-full bg-gray-100 dark:bg-gray-800" onClick={() => setShowSettings(false)} title="Close">×</button>
              </div>
              <div className="p-8 min-h-[320px] bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                {settingsTab === "general" && (
                  <div>
                    <h2 className="font-bold mb-3 text-lg">General Settings</h2>
                    <div className="flex items-center gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} className="form-checkbox h-5 w-5 text-blue-600" />
                        <span className="text-sm">Dark Mode</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <label className="flex items-center gap-2">
                        <span className="text-sm">Font Size:</span>
                        <select value={fontSize} onChange={e => setFontSize(e.target.value)} className="rounded px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                          <option value="sm">Small</option>
                          <option value="base">Normal</option>
                          <option value="lg">Large</option>
                        </select>
                      </label>
                    </div>
                  </div>
                )}
                {settingsTab === "appearance" && (
                  <div>
                    <h2 className="font-bold mb-3 text-lg">Appearance</h2>
                    <div className="flex items-center gap-4 mb-4">
                      <label className="flex items-center gap-2">
                        <span className="text-sm">Chat Bubble Style:</span>
                        <select value={bubbleStyle} onChange={e => setBubbleStyle(e.target.value)} className="rounded px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                          <option value="rounded">Rounded</option>
                          <option value="square">Square</option>
                          <option value="glass">Glassmorphism</option>
                        </select>
                      </label>
                    </div>
                  </div>
                )}
                {settingsTab === "chat" && (
                  <div>
                    <h2 className="font-bold mb-3 text-lg">Chat Settings</h2>
                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">Chat history, memory, and advanced options will appear here in future updates.</div>
                  </div>
                )}
                {settingsTab === "account" && (
                  <div>
                    <h2 className="font-bold mb-3 text-lg">Account</h2>
                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">Account features coming soon.</div>
                  </div>
                )}
                {settingsTab === "about" && (
                  <div>
                    <h2 className="font-bold mb-3 text-lg">About SynisterChat</h2>
                    <div className="mb-2 text-sm">SynisterChat is an AI chat room system powered by GPT-4.1 via GitHub/Azure endpoints. It supports Markdown, persistent chat history, and a user-editable memory context for the AI.</div>
                    <ul className="text-xs list-disc pl-5 mb-2">
                      <li>Open source: <a href="https://github.com/orgs/ChitterSync/repositories/" className="underline text-blue-600" target="_blank">ChitterSync GitHub</a></li>
                      <li>Built with Next.js (App Router) & Tailwind CSS</li>
                      <li>All chat data is stored locally in your browser</li>
                    </ul>
                    <div className="text-xs text-gray-500">© 2025 ChitterSync. By using SynisterChat you consent to letting us train our Language Models.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientSessionProvider>
  );
}

// Add Tailwind keyframes via global style (if not already in Tailwind config)
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes messageIn {
      0% { opacity: 0; transform: translateY(24px) scale(0.98); }
      80% { opacity: 1; transform: translateY(-2px) scale(1.01); }
      100% { opacity: 1; transform: none; }
    }
    .animate-messageIn {
      animation: messageIn 0.35s cubic-bezier(0.4,0,0.2,1);
      opacity: 1 !important;
      transform: none !important;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fadeIn {
      animation: fadeIn 0.25s cubic-bezier(0.4,0,0.2,1);
    }
    @keyframes scaleIn {
      0% { opacity: 0; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }
    .animate-scaleIn {
      animation: scaleIn 0.25s cubic-bezier(0.4,0,0.2,1);
    }
  `;
  document.head.appendChild(style);
}
