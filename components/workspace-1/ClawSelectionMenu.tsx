'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MAX_QUOTE_CHARS = 4000;
const SNAP = 6;

export type ClawQuoteItem = { id: string; text: string };

function snap(n: number): number {
  return Math.round(n / SNAP) * SNAP;
}

export type ClawTextSelectionHit = {
  text: string;
  top: number;
  centerX: number;
};

export function getTextSelectionInRoot(
  root: HTMLElement | null,
  options: {
    withinSelector: string;
    excludeSelector?: string;
  },
): ClawTextSelectionHit | null {
  if (!root) return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const text = sel.toString().trim();
  if (!text || text.length > MAX_QUOTE_CHARS) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;

  const anchorEl =
    range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : (range.commonAncestorContainer as Element | null);
  if (anchorEl instanceof Element) {
    const exclude = options.excludeSelector ?? '.claw-input, .claw-selection-menu';
    if (anchorEl.closest(exclude)) return null;
    if (!anchorEl.closest(options.withinSelector)) return null;
  }

  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return {
    text,
    top: snap(rect.top),
    centerX: snap(rect.left + rect.width / 2),
  };
}

export function buildClawQuotedUserContent(
  quotes: readonly { text: string }[],
  question: string,
): string {
  const q = question.trim();
  if (!quotes.length) return q;
  const body = quotes.map((item, i) => `${i + 1}. ${item.text.trim()}`).join('\n\n');
  if (!q) return `引用内容：\n${body}`;
  return `引用内容：\n${body}\n\n问题：\n${q}`;
}

export function createClawQuoteId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `cq-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type ClawTextSelectionMenuProps = {
  rootRef: React.RefObject<HTMLElement | null>;
  withinSelector: string;
  enabled: boolean;
  canAddMoreQuotes?: boolean;
  onQuote: (text: string) => void;
};

/**
 * 在 root 内划选文本后，在选区上方显示「引用」。
 */
export function ClawTextSelectionMenu({
  rootRef,
  withinSelector,
  enabled,
  canAddMoreQuotes = true,
  onQuote,
}: ClawTextSelectionMenuProps) {
  const [committed, setCommitted] = useState<ClawTextSelectionHit | null>(null);
  const pendingTextRef = useRef('');

  const flushFromDom = useCallback(() => {
    const next = enabled
      ? getTextSelectionInRoot(rootRef.current, { withinSelector })
      : null;
    if (!next) {
      pendingTextRef.current = '';
      setCommitted((prev) => (prev === null ? prev : null));
      return;
    }
    pendingTextRef.current = next.text;
    setCommitted((prev) => {
      if (
        prev &&
        prev.text === next.text &&
        prev.top === next.top &&
        prev.centerX === next.centerX
      ) {
        return prev;
      }
      return next;
    });
  }, [enabled, rootRef, withinSelector]);

  useEffect(() => {
    if (!enabled) setCommitted(null);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onPointerUp = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(flushFromDom);
      });
    };
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp, { passive: true });
    return () => {
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchend', onPointerUp);
    };
  }, [enabled, flushFromDom]);

  const overlay = useMemo(() => {
    if (!committed || typeof document === 'undefined' || !document.body) return null;

    const clearAfter = () => {
      window.getSelection()?.removeAllRanges();
      pendingTextRef.current = '';
      setCommitted(null);
    };
    const text = () => pendingTextRef.current || committed.text;

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    return createPortal(
      <div
        className="claw-selection-menu"
        role="toolbar"
        aria-label="划选操作"
        style={{
          position: 'fixed',
          top: committed.top,
          left: committed.centerX,
          transform: 'translate(-50%, calc(-100% - 10px))',
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          type="button"
          className="claw-selection-menu__btn"
          disabled={!canAddMoreQuotes}
          onClick={() => {
            const t = text();
            if (t && canAddMoreQuotes) onQuote(t);
            clearAfter();
          }}
        >
          引用
        </button>
      </div>,
      document.body,
    );
  }, [committed, canAddMoreQuotes, onQuote]);

  return <>{overlay}</>;
}

type ClawSelectionMenuProps = {
  messagesRootRef: React.RefObject<HTMLElement | null>;
  enabled: boolean;
  canAddMoreQuotes?: boolean;
  onQuote: (text: string) => void;
};

/** 消息区划选引用（限定在 .claw-msg__body 内） */
export function ClawSelectionMenu({
  messagesRootRef,
  enabled,
  canAddMoreQuotes = true,
  onQuote,
}: ClawSelectionMenuProps) {
  return (
    <ClawTextSelectionMenu
      rootRef={messagesRootRef}
      withinSelector=".claw-msg__body"
      enabled={enabled}
      canAddMoreQuotes={canAddMoreQuotes}
      onQuote={onQuote}
    />
  );
}
