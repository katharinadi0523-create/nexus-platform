const MAX_HTML_SNIPPET = 4000;

const SKIP_TAGS = new Set(["HTML", "HEAD", "SCRIPT", "STYLE", "LINK", "META"]);

function previewHtmlIframe(root: HTMLElement): HTMLIFrameElement | null {
  return root.querySelector("iframe[data-workspace-html-preview-frame]");
}

function isElementNode(node: EventTarget | Node | null): node is Element {
  return Boolean(node && (node as Node).nodeType === 1);
}

function formatOuterHtml(el: Element): string | null {
  let html = (el.outerHTML ?? "").trim();
  if (!html) return null;
  if (html.length > MAX_HTML_SNIPPET) {
    html = `${html.slice(0, MAX_HTML_SNIPPET)}…`;
  }
  return html;
}

function pickQuoteElement(start: Element | null, boundary: Element | null): Element | null {
  let el: Element | null = start;
  while (el && el !== boundary) {
    if (!SKIP_TAGS.has(el.tagName)) return el;
    el = el.parentElement;
  }
  return null;
}

export function htmlPreviewPointFromEvent(
  root: HTMLElement,
  event: MouseEvent,
): { parentX: number; parentY: number; localX: number; localY: number } {
  const iframe = previewHtmlIframe(root);
  const iframeWin = iframe?.contentWindow ?? null;
  if (iframe && event.view === iframeWin) {
    const rect = iframe.getBoundingClientRect();
    return {
      parentX: event.clientX + rect.left,
      parentY: event.clientY + rect.top,
      localX: event.clientX,
      localY: event.clientY,
    };
  }
  if (iframe) {
    const rect = iframe.getBoundingClientRect();
    return {
      parentX: event.clientX,
      parentY: event.clientY,
      localX: event.clientX - rect.left,
      localY: event.clientY - rect.top,
    };
  }
  return {
    parentX: event.clientX,
    parentY: event.clientY,
    localX: event.clientX,
    localY: event.clientY,
  };
}

/** 取右键目标节点的 outerHTML（等同 F12 选中该元素） */
export function htmlSnippetFromEvent(
  previewRoot: HTMLElement | null,
  event: MouseEvent,
): string | null {
  if (!previewRoot) return null;

  const iframe = previewHtmlIframe(previewRoot);
  const doc = iframe?.contentDocument ?? previewRoot.ownerDocument;
  const boundary = iframe?.contentDocument?.body ?? previewRoot;
  if (!doc || !boundary) return null;

  const fromTarget = isElementNode(event.target)
    ? event.target
    : isElementNode((event.target as Node | null)?.parentElement ?? null)
      ? (event.target as Node).parentElement
      : null;
  const picked = pickQuoteElement(fromTarget, boundary);
  if (picked) return formatOuterHtml(picked);

  const point = htmlPreviewPointFromEvent(previewRoot, event);
  const stack =
    typeof doc.elementsFromPoint === "function"
      ? doc.elementsFromPoint(point.localX, point.localY)
      : [];
  for (const node of stack) {
    if (!isElementNode(node) || !boundary.contains(node)) continue;
    const candidate = pickQuoteElement(node, boundary);
    if (candidate) return formatOuterHtml(candidate);
  }

  return null;
}

export function getWorkspaceHtmlPreviewIframe(root: HTMLElement): HTMLIFrameElement | null {
  return previewHtmlIframe(root);
}
