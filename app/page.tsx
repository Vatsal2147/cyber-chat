"use client";

import { useCallback, useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import ThreeTunnel from "@/components/ThreeTunnel";

export default function Home() {
  const [intensity, setIntensity] = useState(0);

  const handleActivityChange = useCallback((streaming: boolean) => {
    setIntensity(streaming ? 1 : 0);
  }, []);

  return (
    <main className="scanlines relative flex h-dvh w-dvw overflow-hidden bg-void">
      {/* tunnel fills the whole viewport; chat glass floats above it */}
      <div className="absolute inset-0">
        <ThreeTunnel intensity={intensity} />
      </div>

      <div className="pointer-events-none relative z-10 flex h-full w-full items-center justify-start p-6 md:p-10">
        <div className="pointer-events-auto h-full w-full max-w-md md:h-[88%]">
          <ChatPanel onActivityChange={handleActivityChange} />
        </div>
      </div>

      {/* corner HUD label */}
      <div className="pointer-events-none absolute bottom-6 right-6 z-10 font-mono text-[11px] uppercase tracking-[0.2em] text-fog/70">
        conduit://active
      </div>
    </main>
  );
}
