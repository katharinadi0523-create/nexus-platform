"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Quote } from "lucide-react";
import { createClawQuoteId } from "./ClawSelectionMenu";
import {
  markerAnchorFromSelection,
  rangeFromPreviewOffsets,
  type PreviewQuoteMarker,
} from "./WorkspacePreviewQuoteHost";
import {
  getWorkspaceHtmlPreviewIframe,
  htmlPreviewPointFromEvent,
  htmlSnippetFromEvent,
} from "./workspaceHtmlSnippet";

const MAX_EXCERPT = 4000;
const HIGHLIGHT_NAME = "workspace-preview-quote";
const HIGHLIGHT_STYLE_ID = "workspace-preview-quote-style";
const HIGHLIGHT_CSS = `::highlight(${HIGHLIGHT_NAME}){background-color:rgba(39,115,255,.22)}`;

function ensureHighlightStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = HIGHLIGHT_CSS;
  document.head.appendChild(style);
}

function paintQuoteHighlights(root: HTMLElement, markers: PreviewQuoteMarker[]) {
  const highlights = CSS.highlights;
  if (!highlights || typeof Highlight === "undefined") return;
  const highlight = new Highlight();
  for (const marker of markers) {
    if (marker.start == null || marker.end == null) continue;
    const range = rangeFromPreviewOffsets(root, marker.start, marker.end);
    if (range) highlight.add(range);
  }
  highlights.set(HIGHLIGHT_NAME, highlight);
}

type ContextMenuState = {
  parentX: number;
  parentY: number;
  snippet: string | null;
};

function markerPointFromClient(
  root: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = root.getBoundingClientRect();
  return {
    x: clientX - rect.left + root.scrollLeft,
    y: clientY - rect.top + root.scrollTop,
  };
}

export function useWorkspacePreviewQuote({
  rootRef,
  selectionEnabled,
  htmlContextEnabled,
  fileKey,
  activeBindingIds,
  onQuoteExcerpt,
  onQuoteHtmlFile,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  selectionEnabled: boolean;
  htmlContextEnabled: boolean;
  fileKey: string;
  activeBindingIds: string[];
  onQuoteExcerpt: (excerpt: string) => string | undefined;
  onQuoteHtmlFile: (snippet: string) => string | undefined;
}) {
  const [markersByFile, setMarkersByFile] = useState<Record<string, PreviewQuoteMarker[]>>({});
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const markers = markersByFile[fileKey] ?? [];

  useEffect(() => {
    setMenu(null);
  }, [fileKey]);

  useEffect(() => {
    const active = new Set(activeBindingIds);
    setMarkersByFile((prev) => {
      let changed = false;
      const next: Record<string, PreviewQuoteMarker[]> = {};
      for (const [key, list] of Object.entries(prev)) {
        const filtered = list.filter((marker) => active.has(marker.bindingId));
        next[key] = filtered;
        if (filtered.length !== list.length) changed = true;
      }
      return changed ? next : prev;
    });
  }, [activeBindingIds]);

  useLayoutEffect(() => {
    ensureHighlightStyle();
    const root = rootRef.current;
    if (!root) return;
    paintQuoteHighlights(root, markers);
    return () => {
      CSS.highlights?.delete(HIGHLIGHT_NAME);
    };
  });

  const pushMarker = useCallback(
    (clientX: number, clientY: number, bindingId: string) => {
      const root = rootRef.current;
      if (!root || !bindingId) return;
      const point = markerPointFromClient(root, clientX, clientY);
      const marker = { id: createClawQuoteId(), bindingId, ...point };
      setMarkersByFile((prev) => ({
        ...prev,
        [fileKey]: [...(prev[fileKey] ?? []), marker],
      }));
    },
    [fileKey, rootRef],
  );

  const pushMarkerFromSelection = useCallback(
    (bindingId: string) => {
      const root = rootRef.current;
      if (!root || !bindingId) return;
      const point = markerAnchorFromSelection(root);
      if (!point) return;
      const marker = { id: createClawQuoteId(), bindingId, ...point };
      setMarkersByFile((prev) => ({
        ...prev,
        [fileKey]: [...(prev[fileKey] ?? []), marker],
      }));
    },
    [fileKey, rootRef],
  );

  const quoteFromSelection = useCallback(
    (text: string) => {
      if (!selectionEnabled) return;
      const excerpt = text.trim().slice(0, MAX_EXCERPT);
      if (!excerpt) return;
      const bindingId = onQuoteExcerpt(excerpt);
      if (bindingId) pushMarkerFromSelection(bindingId);
    },
    [onQuoteExcerpt, pushMarkerFromSelection, selectionEnabled],
  );

  const commitContextQuote = useCallback(() => {
    if (!menu || !htmlContextEnabled || !menu.snippet) {
      setMenu(null);
      return;
    }
    const bindingId = onQuoteHtmlFile(menu.snippet);
    if (bindingId) {
      pushMarker(menu.parentX, menu.parentY, bindingId);
    }
    setMenu(null);
    window.getSelection()?.removeAllRanges();
  }, [htmlContextEnabled, menu, onQuoteHtmlFile, pushMarker]);

  useEffect(() => {
    const root = rootRef.current;
    if (!htmlContextEnabled || !root) return;

    const onContextMenu = (event: MouseEvent) => {
      const target = event.target;
      if (target && (target as Node).nodeType === 1) {
        const el = target as Element;
        if (
          typeof el.closest === "function" &&
          el.closest(
            "button, a, input, textarea, .workspace-preview-quote-marker, .workspace-preview-context-menu",
          )
        ) {
          return;
        }
      }
      event.preventDefault();
      event.stopPropagation();
      const point = htmlPreviewPointFromEvent(root, event);
      const snippet = htmlSnippetFromEvent(root, event);
      setMenu({
        parentX: point.parentX,
        parentY: point.parentY,
        snippet,
      });
    };

    const cleanups: (() => void)[] = [];
    let boundDoc: Document | null = null;

    const bindDoc = (doc: Document) => {
      if (boundDoc === doc) return;
      if (boundDoc) {
        boundDoc.removeEventListener("contextmenu", onContextMenu);
      }
      boundDoc = doc;
      doc.addEventListener("contextmenu", onContextMenu);
    };

    const iframe = getWorkspaceHtmlPreviewIframe(root);
    if (iframe) {
      const attach = () => {
        const doc = iframe.contentDocument;
        if (doc) bindDoc(doc);
      };
      iframe.addEventListener("load", attach);
      cleanups.push(() => iframe.removeEventListener("load", attach));
      attach();
    } else {
      const onRootContextMenu = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof Node) || !root.contains(target)) return;
        onContextMenu(event);
      };
      root.addEventListener("contextmenu", onRootContextMenu);
      cleanups.push(() => root.removeEventListener("contextmenu", onRootContextMenu));
    }

    return () => {
      if (boundDoc) boundDoc.removeEventListener("contextmenu", onContextMenu);
      for (const cleanup of cleanups) cleanup();
    };
  }, [htmlContextEnabled, fileKey, rootRef]);

  useEffect(() => {
    if (!menu) return;
    const close = (event: Event) => {
      const target = event.target;
      if (menuRef.current && target instanceof Node && menuRef.current.contains(target)) return;
      setMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);

    const iframe = rootRef.current ? getWorkspaceHtmlPreviewIframe(rootRef.current) : null;
    const iframeDoc = iframe?.contentDocument;
    iframeDoc?.addEventListener("pointerdown", close);

    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
      iframeDoc?.removeEventListener("pointerdown", close);
    };
  }, [menu, rootRef]);

  const contextMenuPortal =
    menu && htmlContextEnabled && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            className="workspace-preview-context-menu"
            style={{ top: menu.parentY, left: menu.parentX }}
            role="menu"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              disabled={!menu.snippet}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                commitContextQuote();
              }}
            >
              <Quote className="h-3.5 w-3.5" aria-hidden />
              引用该段 HTML
            </button>
          </div>,
          document.body,
        )
      : null;

  return {
    markers,
    contextMenuPortal,
    quoteFromSelection,
  };
}
