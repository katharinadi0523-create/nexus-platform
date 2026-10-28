/**
 * 将 TeX 风格定界符转为 remark-math / KaTeX 可识别的 $ / $$。
 *
 * - `\(...\)` → `$...$`（行内）
 * - `\[...\]` → 独立成段的 `$$...$$`（行间 / 块级，确保走 display + 复制条）
 *
 * 默认跳过 fenced code 与行内 code，避免误伤代码里的 `\[` / `\(`。
 */

const FENCE_RE = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;
const INLINE_CODE_RE = /`[^`\n]+`/g;

function protectSegments(source: string): { text: string; slots: string[] } {
  const slots: string[] = [];
  const stash = (match: string) => {
    const i = slots.length;
    slots.push(match);
    return `\u0000MDMATH${i}\u0000`;
  };

  let text = source.replace(FENCE_RE, stash);
  text = text.replace(INLINE_CODE_RE, stash);
  return { text, slots };
}

function restoreSegments(text: string, slots: string[]): string {
  return text.replace(/\u0000MDMATH(\d+)\u0000/g, (_, idx: string) => slots[Number(idx)] ?? '');
}

/** 是否含有尚未被 $ 化的 TeX 定界符 */
export function hasTexStyleMathDelimiters(source: string): boolean {
  if (!source) return false;
  return /\\\(|\\\[/.test(source);
}

/**
 * 规范化 Markdown 中的数学定界符，供 ReactMarkdown + remark-math 使用。
 * 已是 `$...$` / `$$...$$` 的内容保持不变。
 *
 * 行间公式前后加空行，避免夹在段落中间被解析成 inlineMath，
 * 从而丢失居中与复制按钮（MathBlockWithCopy 只包 katex-display）。
 */
export function normalizeMarkdownMath(source: string): string {
  if (!source || !hasTexStyleMathDelimiters(source)) {
    return source;
  }

  const { text: protectedText, slots } = protectSegments(source);
  let text = protectedText;

  // 行间：\[ ... \]（可多行）→ 独立块级 $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, body: string) => {
    const inner = String(body).trim();
    return `\n\n$$\n${inner}\n$$\n\n`;
  });

  // 行内：\( ... \) → $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, body: string) => {
    const inner = String(body).trim();
    return `$${inner}$`;
  });

  // 收敛多余空行
  text = text.replace(/\n{3,}/g, '\n\n');

  return restoreSegments(text, slots);
}
