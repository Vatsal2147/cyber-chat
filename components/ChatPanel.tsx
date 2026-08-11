"use client";

import { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string };

const uid = () => Math.random().toString(36).slice(2, 10);

export default function ChatPanel({
  onActivityChange,
}: {
  onActivityChange: (streaming: boolean) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Signal established. I'm running on Gemini — ask me anything and watch the tunnel react.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onActivityChange(isStreaming);
  }, [isStreaming, onActivityChange]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    setError(null);
    setInput("");

    const userMsg: Message = { id: uid(), role: "user", content: text };
    const assistantMsg: Message = { id: uid(), role: "assistant", content: "" };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, assistantMsg]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "Request failed.");
        throw new Error(errText || "Request failed.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: m.content + chunkText } : m,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="glass-panel relative flex h-full w-full flex-col rounded-2xl border-neon-cyan/10 shadow-[0_0_60px_-15px_rgba(255,43,214,0.35)]">
      {/* HUD header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2 w-2 rounded-full bg-neon-cyan ${isStreaming ? "pulse-dot" : ""}`}
          />
          <h1 className="font-display text-lg font-semibold tracking-wide text-white">
            GEMINI<span className="text-neon-magenta text-glow-magenta">::LINK</span>
          </h1>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fog">
          {isStreaming ? (
            <span className="text-neon-cyan text-glow-cyan">transmitting</span>
          ) : (
            "idle"
          )}
        </span>
      </div>

      {/* message log */}
      <div ref={logRef} className="neon-scroll flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-neon-violet/20 border border-neon-violet/40 px-4 py-2.5 text-sm text-white"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm bg-white/[0.03] border border-neon-cyan/20 px-4 py-2.5 text-sm text-white/90"
              }
            >
              {m.role === "assistant" && (
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-neon-cyan/70">
                  gemini
                </div>
              )}
              <p className={m.content ? "whitespace-pre-wrap leading-relaxed" : "caret"}>
                {m.content}
              </p>
            </div>
          </div>
        ))}
        {error && (
          <div className="rounded-lg border border-amber/40 bg-amber/10 px-4 py-2 font-mono text-xs text-amber">
            SIGNAL ERROR — {error}
          </div>
        )}
      </div>

      {/* input */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 focus-within:border-neon-cyan/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Transmit a message..."
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm text-white placeholder:text-fog focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="font-display rounded-lg bg-gradient-to-r from-neon-magenta to-neon-violet px-4 py-2 text-sm font-semibold tracking-wide text-white transition disabled:cursor-not-allowed disabled:opacity-30"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}
