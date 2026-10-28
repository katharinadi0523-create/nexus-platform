"use client";

export type PreviewQuoteMarker = {
  id: string;
  x: number;
  y: number;
  /** 与底栏引用芯片或文件附件 id 对应，删除底栏项时同步移除标记 */
  bindingId: string;
  /** 预览文本中的起止偏移，用来在再次刮选后仍高亮这一处 */
  start?: number;
  end?: number;
};

const MARKER_SELECTOR = ".workspace-preview-quote-marker";

function previewOffset(root: HTMLElement, container: Node, offset: number): number {
  const probe = document.createRange();
  try {
    probe.setStart(root, 0);
    probe.setEnd(container, offset);
  } catch {
    return 0;
  }
  const fragment = probe.cloneContents();
  fragment.querySelectorAll(MARKER_SELECTOR).forEach((el) => el.remove());
  return fragment.textContent?.length ?? 0;
}

function acceptPreviewText(node: Node): number {
  if (node.parentElement?.closest(MARKER_SELECTOR)) return NodeFilter.FILTER_REJECT;
  return NodeFilter.FILTER_ACCEPT;
}

export function rangeFromPreviewOffsets(
  root: HTMLElement,
  start: number,
  end: number,
): Range | null {
  if (end <= start) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: acceptPreviewText,
  });
  let seen = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  let current: Node | null;
  while ((current = walker.nextNode())) {
    const length = current.textContent?.length ?? 0;
    const next = seen + length;
    if (!startNode && start >= seen && start <= next) {
      startNode = current as Text;
      startOffset = start - seen;
    }
    if (end >= seen && end <= next) {
      endNode = current as Text;
      endOffset = end - seen;
      break;
    }
    seen = next;
  }
  if (!startNode || !endNode) return null;
  try {
    const range = document.createRange();
    range.setStart(startNode, Math.min(startOffset, startNode.length));
    range.setEnd(endNode, Math.min(endOffset, endNode.length));
    return range;
  } catch {
    return null;
  }
}

export type PreviewSelectionAnchor = {
  x: number;
  y: number;
  start: number;
  end: number;
};

export function markerAnchorFromSelection(root: HTMLElement): PreviewSelectionAnchor | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  const rootRect = root.getBoundingClientRect();
  const start = previewOffset(root, range.startContainer, range.startOffset);
  const end = previewOffset(root, range.endContainer, range.endOffset);
  if (end <= start) return null;
  return {
    x: rect.left - rootRect.left + root.scrollLeft,
    y: rect.top - rootRect.top + root.scrollTop,
    start,
    end,
  };
}
