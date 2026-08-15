"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";

type AirQualityOutput = {
  city: string;
  aqi: number;
  pm25: number;
  pm10: number;
  status: string;
};

type AirQualityToolPart = ToolUIPart<{
  getAirQuality: {
    input: {
      city: string;
    };
    output: AirQualityOutput;
  };
}>;

function AirQualityCard({
  tool,
}: {
  tool: AirQualityToolPart;
}) {
  if (tool.state === "input-streaming") {
    return (
      <div className="rounded-xl border border-neon-cyan/20 bg-black/30 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neon-cyan/70">
          air quality
        </div>
        <p className="mt-2 text-sm text-white/70">
          Preparing air quality request...
        </p>
      </div>
    );
  }

  if (tool.state === "input-available") {
    return (
      <div className="rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neon-cyan/70">
          air quality
        </div>

        <p className="mt-2 text-sm text-white/80">
          Checking{" "}
          <span className="font-semibold text-white">
            {tool.input?.city ?? "location"}
          </span>
          ...
        </p>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse bg-neon-cyan" />
        </div>
      </div>
    );
  }

  if (tool.state === "output-error") {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-300/80">
          air quality — error
        </div>

        <p className="mt-2 text-sm text-red-200">
          Could not retrieve air quality data.
        </p>

        {tool.errorText && (
          <p className="mt-1 font-mono text-[10px] text-red-300/60">
            {tool.errorText}
          </p>
        )}
      </div>
    );
  }

  if (tool.state === "output-available") {
    const data = tool.output;

    if (!data) {
      return null;
    }

    return (
      <div className="rounded-xl border border-neon-cyan/30 bg-black/30 p-4 shadow-[0_0_25px_-10px_rgba(0,255,255,0.4)]">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neon-cyan/70">
          air quality
        </div>

        <div className="mt-1 text-lg font-semibold text-white">
          {data.city}
        </div>

        <div className="mt-4 flex items-end gap-3">
          <div>
            <div className="text-4xl font-bold text-neon-cyan text-glow-cyan">
              {data.aqi}
            </div>

            <div className="font-mono text-[10px] uppercase tracking-wider text-fog">
              AQI
            </div>
          </div>

          <div className="pb-1 text-sm text-white/70">
            {data.status}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-fog">
              PM2.5
            </div>
            <div className="mt-1 text-sm text-white">
              {data.pm25} µg/m³
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-fog">
              PM10
            </div>
            <div className="mt-1 text-sm text-white">
              {data.pm10} µg/m³
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function ChatPanel({
  onActivityChange,
}: {
  onActivityChange: (streaming: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const logRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isStreaming =
    status === "submitted" || status === "streaming";

  useEffect(() => {
    onActivityChange(isStreaming);
  }, [isStreaming, onActivityChange]);

  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function sendUserMessage() {
    const text = input.trim();

    if (!text || isStreaming) {
      return;
    }

    setError(null);
    setInput("");

    try {
      await sendMessage({
        text,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  }

  return (
    <div className="glass-panel relative flex h-full w-full flex-col rounded-2xl border-neon-cyan/10 shadow-[0_0_60px_-15px_rgba(255,43,214,0.35)]">

      {/* HUD header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2 w-2 rounded-full bg-neon-cyan ${
              isStreaming ? "pulse-dot" : ""
            }`}
          />

          <h1 className="font-display text-lg font-semibold tracking-wide text-white">
            GEMINI
            <span className="text-neon-magenta text-glow-magenta">
              ::LINK
            </span>
          </h1>
        </div>

        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fog">
          {isStreaming ? (
            <span className="text-neon-cyan text-glow-cyan">
              transmitting
            </span>
          ) : (
            "idle"
          )}
        </span>
      </div>

      {/* message log */}
      <div
        ref={logRef}
        className="neon-scroll flex-1 space-y-4 overflow-y-auto px-5 py-5"
      >
        {messages.length === 0 && (
          <div className="rounded-2xl rounded-bl-sm border border-neon-cyan/20 bg-white/[0.03] px-4 py-2.5 text-sm text-white/90">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-neon-cyan/70">
              gemini
            </div>

            <p className="leading-relaxed">
              Signal established. I'm running on Gemini — ask me
              anything and watch the tunnel react.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm border border-neon-violet/40 bg-neon-violet/20 px-4 py-2.5 text-sm text-white"
                  : "max-w-[90%] space-y-3 rounded-2xl rounded-bl-sm border border-neon-cyan/20 bg-white/[0.03] px-4 py-2.5 text-sm text-white/90"
              }
            >
              {message.role === "assistant" && (
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-neon-cyan/70">
                  gemini
                </div>
              )}

              {message.parts.map((part, index) => {
                /*
                 * Normal Gemini text
                 */
                if (part.type === "text") {
                  return (
                    <p
                      key={`${message.id}-text-${index}`}
                      className="whitespace-pre-wrap leading-relaxed"
                    >
                      {part.text}
                    </p>
                  );
                }

                /*
                 * Our getAirQuality tool
                 */
                if (part.type === "tool-getAirQuality") {
                  return (
                    <AirQualityCard
                      key={`${message.id}-tool-${index}`}
                      tool={part as AirQualityToolPart}
                    />
                  );
                }

                return null;
              })}
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
            onClick={sendUserMessage}
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