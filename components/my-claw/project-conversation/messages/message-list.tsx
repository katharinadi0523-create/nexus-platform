"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { ProjectMessage } from "@/lib/mock/my-claw/project-conversation";
import { MessageItem } from "./message-item";

export interface MessageListHandle {
  scrollToMessage: (messageId: string) => void;
}

interface MessageListProps {
  messages: ProjectMessage[];
  highlightedMessageId?: string | null;
  onQuote?: (message: ProjectMessage) => void;
  className?: string;
}

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(
  function MessageList(
    { messages, highlightedMessageId, onQuote, className },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const prevCountRef = useRef(messages.length);

    const scrollToMessage = useCallback((messageId: string) => {
      const el = document.getElementById(`message-${messageId}`);
      if (!el || !containerRef.current) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, []);

    useImperativeHandle(ref, () => ({ scrollToMessage }), [scrollToMessage]);

    useEffect(() => {
      if (highlightedMessageId) {
        const timer = window.setTimeout(() => {
          scrollToMessage(highlightedMessageId);
        }, 80);
        return () => window.clearTimeout(timer);
      }
      return undefined;
    }, [highlightedMessageId, scrollToMessage]);

    useEffect(() => {
      if (messages.length > prevCountRef.current && !highlightedMessageId) {
        const last = messages[messages.length - 1];
        if (last) {
          const el = document.getElementById(`message-${last.id}`);
          el?.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }
      prevCountRef.current = messages.length;
    }, [highlightedMessageId, messages]);

    return (
      <div
        ref={containerRef}
        className={`min-h-0 flex-1 overflow-y-auto px-4 py-3 ${className ?? ""}`}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-1">
          {messages.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-[#5a6779]">
              开始在 Project Conversation 中协作吧
            </div>
          ) : (
            messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                highlighted={highlightedMessageId === message.id}
                onQuote={onQuote}
              />
            ))
          )}
        </div>
      </div>
    );
  }
);
