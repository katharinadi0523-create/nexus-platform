"use client";

import { useState, type ReactNode } from "react";
import { RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function AgentPreviewPanel({
  children, onSend, onClear, notice, footerExtras, titleExtra, className,
}: {
  children: ReactNode;
  onSend: (message: string) => void;
  onClear?: () => void;
  notice?: string;
  footerExtras?: ReactNode;
  titleExtra?: ReactNode;
  className?: string;
}) {
  const [draft, setDraft] = useState("");
  function send() {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft("");
  }
  return (
    <section className={cn("flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#f6f8fc_0%,#f3f7ff_52%,#eef3fb_100%)]", className)}>
      <header className="border-b border-slate-100/80 px-5 py-4">
        <div className="group flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">预览与调试</h2>
            {titleExtra}
          </div>
          {onClear ? <button type="button" title="清空会话" aria-label="清空会话" onClick={() => { setDraft(""); onClear(); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><RotateCcw className="h-4 w-4" /></button> : null}
        </div>
        {notice ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">{notice}</p> : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">{children}</div>
      <div className="border-t border-slate-100/80 bg-white/55 px-5 py-4 backdrop-blur-sm">
        {footerExtras}
        <div className="flex gap-3">
          <input type="text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="输入消息..." onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} className="min-w-0 flex-1 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400" />
          <button type="button" onClick={send} disabled={!draft.trim()} aria-label="发送" className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-900 text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-5 w-5" /></button>
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">内容由智能生成，仅供参考</p>
      </div>
    </section>
  );
}
