// components/ChatWindow.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export interface ChatMessage {
  senderType: string;
  content: string;
  timestamp: number;
}

interface ChatWindowProps {
  chatRoomId: string;
  userId: string;
  userName: string;
}

export default function ChatWindow({
  chatRoomId,
  userId,
  userName,
}: ChatWindowProps) {
  const [socket, setSocket] = useState<Socket>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1) Establish socket connection once
  useEffect(() => {
    const s = io("http://localhost:5002", {
      transports: ["websocket"],
      withCredentials: true,
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  // 2) Join room & subscribe to incoming messages
  useEffect(() => {
    if (!socket) return;
    socket.emit("joinRoom", { chatRoomId, userId });
    socket.on("receiveMessage", (msg: ChatMessage) => {
      setMessages((ms) => [
        ...ms,
        { ...msg, timestamp: msg.timestamp || Date.now() },
      ]);
    });
    return () => {
      socket.off("receiveMessage");
    };
  }, [socket, chatRoomId, userId]);

  // 3) Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4) Send handler (no local echo)
  const send = () => {
    if (!socket || !draft.trim()) return;
    socket.emit("sendMessage", {
      chatRoomId,
      content: draft.trim(),
    });
    setDraft("");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.senderType === userName ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`
                max-w-[70%] px-3 py-2 rounded-lg
                ${
                  m.senderType === userName
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                }
              `}
            >
              <div className="text-xs font-semibold">{m.senderType}</div>
              <div>{m.content}</div>
              <div className="text-[10px] text-right mt-1 opacity-60">
                {new Date(m.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* input bar */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 rounded-lg border px-3 py-2 bg-white dark:bg-gray-800"
          placeholder="Type a message…"
        />
        <button
          onClick={send}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
