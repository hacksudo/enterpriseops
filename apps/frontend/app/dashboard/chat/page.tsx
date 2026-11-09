"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Users,
  Shield,
  Hash,
  Paperclip,
  CheckCircle2
} from "lucide-react";
import { api } from "@/lib/api";

export default function ChatPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getChannels()
      .then((chans) => {
        setChannels(chans);
        if (chans.length > 0) {
          setActiveChannel(chans[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeChannel) return;
    const fetchMsgs = () => {
      api.getMessages(activeChannel.id)
        .then(setMessages)
        .catch(() => {});
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 5000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeChannel) return;

    try {
      const newMsg = await api.sendMessage(activeChannel.id, content.trim());
      setMessages([...messages, newMsg]);
      setContent("");
    } catch (e: any) {
      alert("Failed to send: " + e.message);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 glass-panel rounded-2xl overflow-hidden border border-white/10">
      {/* Channels Sidebar */}
      <div className="w-full md:w-64 glass-panel-subtle border-r border-white/10 flex flex-col p-4">
        <div className="flex items-center gap-2 mb-4 px-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Channels</span>
        </div>
        <div className="space-y-1 overflow-y-auto flex-1">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(c)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition text-left ${
                activeChannel?.id === c.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <Hash className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 flex flex-col bg-slate-950/40">
        {/* Channel Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-white">{activeChannel?.name || "Select Channel"}</span>
          </div>
          <span className="text-[11px] text-slate-400">Scoped Department Stream</span>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              No messages in this channel. Send the first message below.
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-cyan-300">{m.sender_name || "User"}</span>
                  <span className="text-[10px] text-slate-500">{new Date(m.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-slate-200">{m.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Send Box */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex items-center gap-3">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Message #${activeChannel?.name || "channel"}...`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
