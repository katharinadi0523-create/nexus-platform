import type { SkillFile } from "@/components/skillhub-v2/types";
import { getExt } from "@/components/workspace-1/DocumentFilePreview";
import type { ClawInputAttachment } from "./ClawChatInput";

export function isWorkspaceHtmlFile(path: string): boolean {
  return getExt(path) === "html";
}

export function workspaceFileAttachmentId(path: string): string {
  return `ws-file:${path}`;
}

export function isSkillFolderPath(path: string): boolean {
  return path.endsWith("/");
}

export function skillFileBaseName(path: string): string {
  const normalized = path.replace(/\/$/, "");
  const parts = normalized.split("/");
  return parts[parts.length - 1] ?? path;
}

export function skillFileToAttachment(file: SkillFile): ClawInputAttachment {
  const content = file.content ?? "";
  return {
    id: workspaceFileAttachmentId(file.path),
    fileName: skillFileBaseName(file.path),
    content,
    fileSize: new TextEncoder().encode(content).length,
  };
}

type WorkspaceQuoteComposer = {
  hasFileAttachment: (path: string) => boolean;
  addWorkspaceFileAttachment: (item: ClawInputAttachment) => void;
  addHtmlSnippet: (file: ClawInputAttachment, html: string) => string | undefined;
  quotes: { id: string }[];
  attachments: ClawInputAttachment[];
};

export function quoteFileIntoComposer(
  quote: { path: string; name: string; excerpt?: string },
  files: SkillFile[],
  composer: WorkspaceQuoteComposer,
  showToast: (message: string) => void,
): string | undefined {
  const file = files.find((item) => item.path === quote.path);
  if (!file || isSkillFolderPath(file.path)) return undefined;

  const excerpt = quote.excerpt?.trim();
  if (excerpt) {
    const snippetId = composer.addHtmlSnippet(skillFileToAttachment(file), excerpt);
    showToast(
      isWorkspaceHtmlFile(file.path)
        ? `已引用「${quote.name}」中的 HTML 片段`
        : `已引用「${quote.name}」中的内容`,
    );
    return snippetId;
  }

  if (composer.hasFileAttachment(file.path)) return undefined;
  composer.addWorkspaceFileAttachment(skillFileToAttachment(file));
  showToast(`已引用「${quote.name}」`);
  return workspaceFileAttachmentId(file.path);
}

export function composerPreviewBindings(composer: Pick<WorkspaceQuoteComposer, "quotes" | "attachments">) {
  return [
    ...composer.quotes.map((item) => item.id),
    ...composer.attachments.flatMap((item) => [
      item.id,
      ...(item.snippets?.map((snippet) => snippet.id) ?? []),
    ]),
  ];
}

export function composerPreviewNumbers(
  composer: Pick<WorkspaceQuoteComposer, "quotes" | "attachments">,
) {
  const numbers: Record<string, number> = {};
  composer.quotes.forEach((item, index) => {
    numbers[item.id] = index + 1;
  });
  for (const item of composer.attachments) {
    item.snippets?.forEach((snippet, index) => {
      numbers[snippet.id] = index + 1;
    });
  }
  return numbers;
}
