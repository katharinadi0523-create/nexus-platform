"use client";

import { useState } from "react";
import { AgentPreviewPanel } from "@/components/agent/agent-preview-panel";

export function ThirdPartyAgentDebugPanel({ className }: { className?: string }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  function send(content: string) {
    setMessages((current) => [
      ...current,
      { role: "user", content },
      { role: "assistant", content: "原型示例回复：已收到你的消息。接入真实服务后，这里将展示第三方 Agent 的回复。" },
    ]);
  }
  return (
    <AgentPreviewPanel
      className={className}
      onSend={send}
      onClear={() => setMessages([])}
      notice="调试将实际调用第三方 Agent，可能产生第三方服务费用。"
    >
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">输入消息，开始调试</div>
      ) : (
        <div className="space-y-5">
          {messages.map((message, index) => (
            <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <p className={message.role === "user"
                ? "max-w-[88%] whitespace-pre-wrap rounded-[22px] bg-slate-900 px-4 py-3 text-sm leading-7 text-white"
                : "max-w-[90%] whitespace-pre-wrap rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700"}>
                {message.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </AgentPreviewPanel>
  );
}
