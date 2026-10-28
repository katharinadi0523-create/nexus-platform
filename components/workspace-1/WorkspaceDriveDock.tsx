"use client";

import { ClawChatInput } from "./ClawChatInput";
import type { ClawInputAttachment } from "./ClawChatInput";
import type { ClawQuoteItem } from "./ClawSelectionMenu";

export function WorkspaceDriveDock({
  draft,
  onDraftChange,
  onSend,
  quotes,
  onRemoveQuote,
  attachments,
  onRemoveAttachment,
  onRemoveAttachmentSnippet,
  onAddFiles,
  onToast,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  quotes: ClawQuoteItem[];
  onRemoveQuote: (id: string) => void;
  attachments: ClawInputAttachment[];
  onRemoveAttachment: (id: string) => void;
  onRemoveAttachmentSnippet: (attachmentId: string, snippetId: string) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onToast?: (message: string) => void;
}) {
  const lastQuote = quotes[quotes.length - 1]?.text?.trim() ?? "";
  const snippetCount = attachments.reduce((count, item) => count + (item.snippets?.length ?? 0), 0);
  const citedCount = quotes.length + snippetCount;
  const lastSnippetFile = [...attachments]
    .reverse()
    .find((item) => (item.snippets?.length ?? 0) > 0);
  const lastAttachment = attachments[attachments.length - 1]?.fileName?.trim() ?? "";
  const quotePlaceholder =
    citedCount > 1
      ? `已引用 ${citedCount} 处，可继续刮选添加，输入问题后发送`
      : lastSnippetFile
        ? `围绕「${lastSnippetFile.fileName}」中的引用提问`
        : lastQuote
          ? `围绕引用内容提问：${lastQuote.length > 72 ? `${lastQuote.slice(0, 72)}…` : lastQuote}`
          : lastAttachment
            ? `已引用「${lastAttachment}」，输入问题后发送`
            : "引用文件或直接提问，Enter 发送";

  return (
    <footer className="workspace-drive-dock" aria-label="工作空间对话">
      <div className="claw-composer">
        <ClawChatInput
          value={draft}
          onChange={onDraftChange}
          onSend={onSend}
          placeholder={quotePlaceholder}
          quotes={quotes}
          onRemoveQuote={onRemoveQuote}
          attachments={attachments}
          onRemoveAttachment={onRemoveAttachment}
          onRemoveAttachmentSnippet={onRemoveAttachmentSnippet}
          onAddFiles={onAddFiles}
          onToast={onToast}
        />
      </div>
    </footer>
  );
}
