"use client";

import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom, faComments, faHistory, faMemory, faUser, faPlus, faSave, faCheckCircle, faSpinner, faLightbulb, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

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
type SettingsTab = "general" | "history" | "memory" | "account";

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

export default function Home() {
  // Helper to reset all chat sessions and global storage
  async function resetAllSessions() {
    await fetch("/api/storage", { method: "DELETE" });
    const def = getDefaultSession();
    setSessions([def]);
    setCurrentSessionId(def.id);
    setInput("");
  }

  // --- All hooks must be called unconditionally at the top ---
  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  // Show loading spinner only during first mount (before useEffect runs)
  const [mounted, setMounted] = useState(false);
  // Chat input and waiting state
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Memory auto-save and update indicator (for current session)
  // (already declared at top)

  // --- End of hooks ---

  // On mount, load sessions from encrypted global storage
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/storage");
        const json = await res.json();
        const allSessions = json.data || {};
        const sessionArr: ChatSession[] = Object.values(allSessions);
        if (sessionArr.length > 0) {
          setSessions(sessionArr);
          setCurrentSessionId(sessionArr[0]?.id || "");
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

  // Save sessions to encrypted global storage on change
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

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Derived state for current session
  const currentSession: ChatSession | null = sessions.length > 0
    ? sessions.find(s => s.id === currentSessionId) || sessions[0]
    : null;

  // Scroll on new message
  useEffect(() => {
    if (currentSession) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.messages]);

  // Always call all hooks before any early return!
  // Early return for loading spinner
  // Move all hooks above this point, do not add hooks below here.
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="text-center flex flex-col items-center gap-4">
          <span className="text-gray-500 text-lg flex items-center gap-2"><FontAwesomeIcon icon={faSpinner} spin /> Loading chat…</span>
          <button
            className="text-xs px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-2"
            onClick={resetAllSessions}
            type="button"
          >
            <FontAwesomeIcon icon={faBroom} /> Reset All (Clear Local Storage)
          </button>
        </div>
      </div>
    );
  }

  // Remove duplicate declaration of currentSession
  const messages = currentSession ? currentSession.messages : [];
  const memory = currentSession ? currentSession.memory : [];

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
        : ""),
  };
  // Save sessions to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("synister-chat-sessions-v2", JSON.stringify(sessions));
    }
  }, [sessions]);
  // Remove duplicate declaration of scrollToBottom

  // Scroll on new message
// Save sessions to localStorage on change
useEffect(() => {
  if (typeof window !== "undefined") {
    localStorage.setItem("synister-chat-sessions-v2", JSON.stringify(sessions));
  }
}, [sessions]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    const chatUserMessage = { role: "user", content: input };

    // Enhanced: extract memory actions from user message
    const { add: newFacts, remove: removeFacts, update: updateFacts } = extractMemoryActions(input);

    setSessions((prev) => prev.map(s => {
      if (s.id !== currentSessionId) return s;
      // Update memory
      let updatedMemory = [...s.memory];
      for (const rem of removeFacts) {
        updatedMemory = updatedMemory.filter(fact => !fact.toLowerCase().includes(rem.toLowerCase()));
      }
      for (const upd of updateFacts) {
        updatedMemory = updatedMemory.map(fact =>
          fact.toLowerCase().includes(upd.old.toLowerCase()) ? `${upd.old} ${upd.new}` : fact
        );
      }
      for (const fact of newFacts) {
        if (!updatedMemory.includes(fact)) updatedMemory.push(fact);
      }
      // Update messages
      let updatedMessages = [...s.messages, userMessage];
      if (updatedMessages.length > 2000) updatedMessages = updatedMessages.slice(-2000);
      let updatedChatMessages = [...s.chatMessages, chatUserMessage];
      if (updatedChatMessages.length > 2000) updatedChatMessages = updatedChatMessages.slice(-2000);
      // If first user message, set as title
      let newTitle = s.title;
      if (s.messages.length === 1 && userMessage.text.length > 0) {
        newTitle = userMessage.text.slice(0, 32) + (userMessage.text.length > 32 ? "..." : "");
      }
      return { ...s, memory: updatedMemory, messages: updatedMessages, chatMessages: updatedChatMessages, title: newTitle };
    }));
    setInput("");
    setWaiting(true);

    // Call API route for AI response
    try {
      // Always send system prompt (with memory) as first message
      const session = sessions.find(s => s.id === currentSessionId) || getDefaultSession();
      const chatHistory = [
        {
          role: "system",
          content:
            BASE_SYSTEM_PROMPT +
            (session.memory.length > 0
              ? `\n\nHere are some facts or context to remember for this user (auto-logged memory):\n- ${session.memory.join("\n- ")}`
              : ""),
        },
        ...session.chatMessages.slice(1),
        chatUserMessage,
      ];
      const res = await fetch("/api/gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });
      const data = await res.json();
      setSessions((prev) => prev.map(s => {
        if (s.id !== currentSessionId) return s;
        let updatedMessages = [...s.messages, { sender: "ai", text: data.reply }];
        if (updatedMessages.length > 2000) updatedMessages = updatedMessages.slice(-2000);
        let updatedChatMessages = [...chatHistory, { role: "assistant", content: data.reply }];
        if (updatedChatMessages.length > 2000) updatedChatMessages = updatedChatMessages.slice(-2000);
        return { ...s, messages: updatedMessages, chatMessages: updatedChatMessages };
      }));
    } catch {
      setSessions((prev) => prev.map(s => {
        if (s.id !== currentSessionId) return s;
        let updatedMessages = [...s.messages, { sender: "ai", text: "Sorry, I couldn't get a response." }];
        if (updatedMessages.length > 2000) updatedMessages = updatedMessages.slice(-2000);
        let updatedChatMessages = [...s.chatMessages, { role: "assistant", content: "Sorry, I couldn't get a response." }];
        if (updatedChatMessages.length > 2000) updatedChatMessages = updatedChatMessages.slice(-2000);
        return { ...s, messages: updatedMessages, chatMessages: updatedChatMessages };
      }));
    } finally {
      setWaiting(false);
    }
  };

  // Memory auto-save and update indicator (for current session)
  const [memorySaved, setMemorySaved] = useState(true);
  const [memoryJustUpdated, setMemoryJustUpdated] = useState(false);
  const [memorySaving, setMemorySaving] = useState(false);
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

  // New chat handler
  const newChat = () => {
    const newSession = getDefaultSession();
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setInput("");
  };

  // Reset memory handler (for current session)
  const resetMemory = () => {
    setSessions((prev) => prev.map(s =>
      s.id === currentSessionId ? { ...s, memory: [] } : s
    ));
  };

  // Move clearHistory outside of the conditional to comply with the Rules of Hooks
  function clearHistory(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault();
    setSessions(prev =>
      prev.map(s =>
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
    <div className="flex flex-row min-h-screen w-screen items-stretch justify-stretch bg-background p-0">
      {/* Sidebar */}
      <aside className="w-64 min-w-[180px] max-w-xs bg-white/90 dark:bg-gray-900/80 border-r border-gray-200 dark:border-gray-800 flex flex-col p-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
          <span className="font-bold text-base flex items-center gap-2"><FontAwesomeIcon icon={faComments} /> Chats</span>
          <button
            className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition shadow flex items-center gap-1"
            onClick={newChat}
            title="Start a new chat"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="text-xs text-gray-400 p-4">No chats yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className={`px-4 py-3 cursor-pointer flex flex-col gap-0.5 hover:bg-blue-50 dark:hover:bg-gray-800 transition ${s.id === currentSessionId ? 'bg-blue-100 dark:bg-gray-700 border-l-4 border-blue-500' : ''}`}
                  onClick={() => setCurrentSessionId(s.id)}
                >
                  <span className={`font-semibold text-sm truncate ${s.id === currentSessionId ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>{s.title || 'Untitled Chat'}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(s.created).toLocaleString()}</span>
                  {s.id === currentSessionId && <span className="text-[10px] text-blue-500">Current</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="text-[10px] text-gray-400 px-4 py-2 border-t border-gray-200 dark:border-gray-800">{sessions.length} chat{sessions.length !== 1 ? 's' : ''}</div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-h-screen items-center justify-stretch">
        {/* Settings button */}
        <div className="w-full max-w-2xl flex justify-end items-center mb-2 gap-2 px-4 pt-4 sticky top-0 z-30 bg-background/80 backdrop-blur shadow-sm">
          <button
            className="text-xs px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition shadow flex items-center gap-2"
            onClick={() => setShowSettings(true)}
          >
            <FontAwesomeIcon icon={faUser} /> Settings
          </button>
        </div>



        {/* Settings Modal */}
        {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex gap-2">
                <button className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${settingsTab === 'general' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`} onClick={() => setSettingsTab('general')}><FontAwesomeIcon icon={faLightbulb} /> General</button>
                <button className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${settingsTab === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`} onClick={() => setSettingsTab('history')}><FontAwesomeIcon icon={faHistory} /> Chat History</button>
                <button className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${settingsTab === 'memory' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`} onClick={() => setSettingsTab('memory')}><FontAwesomeIcon icon={faMemory} /> Memory</button>
                <button className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${settingsTab === 'account' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`} onClick={() => setSettingsTab('account')}><FontAwesomeIcon icon={faUser} /> Account</button>
              </div>
              <button className="text-lg px-2 py-0.5 hover:text-red-500" onClick={() => setShowSettings(false)} title="Close">×</button>
            </div>
            <div className="p-4 min-h-[200px]">
              {/* General Info Tab */}
              {settingsTab === "general" && (
                <div>
                  <h2 className="font-bold mb-2 text-sm">About SynisterChat</h2>
                  <p className="text-xs mb-2">SynisterChat is an AI chat room system powered by GPT-4.1 via GitHub/Azure endpoints. It supports Markdown, persistent chat history, and a user-editable memory context for the AI.</p>
                  <ul className="text-xs list-disc pl-5 mb-2">
                    <li>Open source: <a href="https://github.com/orgs/ChitterSync/repositories/" className="underline text-blue-600" target="_blank">ChitterSync GitHub</a></li>
                    <li>Built with Next.js (App Router) & Tailwind CSS</li>
                    <li>All chat data is stored locally in your browser</li>
                  </ul>
                  <p className="text-xs text-gray-500">© 2025 ChitterSync. By using SynisterChat you consent to letting us train our Language Models.</p>
                </div>
              )}
              {/* Chat History Tab */}
              {settingsTab === "history" && (
                <div>
                  <h2 className="font-bold mb-2 text-sm">Chat History</h2>
                  <div className="mb-2 max-h-32 overflow-y-auto border rounded bg-gray-50 dark:bg-gray-800 p-2 text-xs">
                    {messages.length > 1 ? (
                      messages.map((msg, i) => (
                        <div key={i} className="mb-1">
                          <span className={`font-bold ${msg.sender === 'user' ? 'text-blue-600' : 'text-green-600'}`}>{msg.sender === 'user' ? 'You' : 'AI'}:</span> {msg.text}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400">No chat history yet.</div>
                    )}
                  </div>
                  <button
                    className="text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition"
                    onClick={clearHistory}
                    disabled={messages.length <= 1}
                  >
                    Clear Chat History
                  </button>
                </div>
              )}
              {/* Memory Tab */}
              {settingsTab === "memory" && (
                <div>
                  <h2 className="font-bold mb-2 text-sm">Session Memory (auto-logged)</h2>
                  <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] flex items-center gap-1 ${memoryJustUpdated ? 'text-blue-500' : memorySaved ? 'text-green-500' : 'text-gray-400'}`}>
                    {memorySaving ? <FontAwesomeIcon icon={faSpinner} spin /> : memoryJustUpdated ? <FontAwesomeIcon icon={faCheckCircle} /> : <FontAwesomeIcon icon={faSave} />}
                    {memoryJustUpdated ? 'Memory updated' : memorySaved ? 'Saved' : memorySaving ? 'Saving...' : 'Saved'}
                  </span>
                    <button
                      type="button"
                      className="text-xs px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 flex items-center gap-1 transition"
                      onClick={resetMemory}
                      disabled={waiting || memory.length === 0}
                      title="Clear memory"
                    >
                      <FontAwesomeIcon icon={faBroom} /> Reset
                    </button>
                  </div>
                  <div className="w-full rounded border px-2 py-1 text-xs bg-white dark:bg-black/60 border-gray-300 dark:border-gray-600 min-h-[2.5em] whitespace-pre-line">
                    {memory.length === 0 ? (
                      <span className="text-gray-400">No memory facts logged yet. Tell me something about yourself!</span>
                    ) : (
                      memory.map((fact, i) => <div key={i}>• {fact}</div>)
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">This memory is included in every AI response. It is extracted automatically from your messages.</div>
                </div>
              )}
              {/* Account Tab */}
              {settingsTab === "account" && (
                <div>
                  <h2 className="font-bold mb-2 text-sm">Account</h2>
                  <p className="text-xs text-gray-500">Account features coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Chat UI */}
        <div className="w-full max-w-2xl flex-1 flex flex-col bg-white/80 dark:bg-black/40 rounded-lg shadow p-4 mb-4 min-h-0" style={{height: '60vh', minHeight: 320}}>
          <div className="flex-1 overflow-y-auto mb-2" style={{ minHeight: 0 }}>
            {currentSession.messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-[80%] text-sm ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                  }`}
                >
                  {msg.sender === "ai" ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 sticky bottom-0 z-20 bg-white/80 dark:bg-black/60 p-2 rounded shadow mt-2">
            <textarea
              className="flex-1 rounded border px-3 py-2 text-sm bg-white dark:bg-black/60 border-gray-300 dark:border-gray-600 focus:outline-none resize-y min-h-[2.5em] max-h-40"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                waiting
                  ? "Waiting for AI response…"
                  : input
                    ? "Shift+Enter for linebreak, Enter to send"
                    : "Type your message…"
              }
              autoFocus
              disabled={waiting}
              onKeyDown={(e) => {
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 flex items-center justify-center"
              disabled={!input.trim()}
              title="Send"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
        <footer className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4 w-full flex flex-col items-center justify-center px-4 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <FontAwesomeIcon icon={faComments} className="text-blue-500" />
            <span>SynisterLLM | ChitterSync &copy; 2025</span>
          </div>
          <span>By using SynisterChat you consent to letting us train our Language Models using your conversations</span>
        </footer>
      </div>
    </div>
  );
}
