"use client";

import { useCallback, useRef, useState } from "react";
import {
  buildMessageWithAttachments,
  filterUploadFiles,
  readDroppedFileAsAttachment,
  type ClawInputAttachment,
} from "./ClawChatInput";
import { createClawQuoteId, type ClawQuoteItem } from "./ClawSelectionMenu";

export function useWorkspaceClawComposer(showToast: (message: string) => void) {
  const [draft, setDraft] = useState("");
  const [quotes, setQuotes] = useState<ClawQuoteItem[]>([]);
  const [attachments, setAttachments] = useState<ClawInputAttachment[]>([]);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (!files.length) return;
      void (async () => {
        const { accepted, errors, hasBlockedType } = filterUploadFiles(
          files,
          attachmentsRef.current,
        );
        if (!accepted.length) {
          showToast(hasBlockedType ? "该文件格式暂不支持" : (errors[0] ?? "没有可上传的文件"));
          return;
        }
        try {
          const next = await Promise.all(accepted.map((f) => readDroppedFileAsAttachment(f)));
          setAttachments((prev) => {
            const merged = [...prev];
            for (const item of next) {
              if (merged.length >= 10) break;
              if (merged.some((a) => a.fileName === item.fileName && a.fileSize === item.fileSize)) {
                continue;
              }
              merged.push(item);
            }
            return merged;
          });
          if (hasBlockedType) showToast("该文件格式暂不支持");
          else if (errors.length) showToast(`已添加 ${accepted.length} 个，部分文件未通过校验`);
          else
            showToast(
              accepted.length === 1 ? `已添加 ${accepted[0].name}` : `已添加 ${accepted.length} 个附件`,
            );
        } catch {
          showToast("读取文件失败");
        }
      })();
    },
    [showToast],
  );

  const removeQuote = useCallback((id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    setDraft("");
    setQuotes([]);
    setAttachments([]);
  }, []);

  const buildSendText = useCallback(
    () => buildMessageWithAttachments(quotes, attachments, draft).trim(),
    [attachments, draft, quotes],
  );

  const addWorkspaceFileAttachment = useCallback(
    (item: ClawInputAttachment) => {
      setAttachments((prev) => {
        if (prev.some((a) => a.id === item.id)) return prev;
        if (prev.length >= 10) {
          showToast("附件最多 10 个");
          return prev;
        }
        return [...prev, item];
      });
    },
    [showToast],
  );

  const addQuoteText = useCallback((text: string): string | undefined => {
    const trimmed = text.trim().slice(0, 4000);
    if (!trimmed) return undefined;
    const id = createClawQuoteId();
    setQuotes((prev) => [...prev, { id, text: trimmed }]);
    return id;
  }, []);

  const addHtmlSnippet = useCallback(
    (fileItem: ClawInputAttachment, html: string): string | undefined => {
      const trimmed = html.trim().slice(0, 4000);
      if (!trimmed) return undefined;
      const id = createClawQuoteId();
      setAttachments((prev) => {
        const existing = prev.find((item) => item.id === fileItem.id);
        if (existing) {
          return prev.map((item) =>
            item.id === fileItem.id
              ? { ...item, snippets: [...(item.snippets ?? []), { id, text: trimmed }] }
              : item,
          );
        }
        if (prev.length >= 10) {
          showToast("附件最多 10 个");
          return prev;
        }
        return [...prev, { ...fileItem, snippets: [{ id, text: trimmed }] }];
      });
      return id;
    },
    [showToast],
  );

  const removeAttachmentSnippet = useCallback((attachmentId: string, snippetId: string) => {
    setAttachments((prev) =>
      prev.map((item) =>
        item.id === attachmentId
          ? { ...item, snippets: (item.snippets ?? []).filter((snippet) => snippet.id !== snippetId) }
          : item,
      ),
    );
  }, []);

  const hasFileAttachment = useCallback((path: string) => {
    const id = `ws-file:${path}`;
    return attachmentsRef.current.some((a) => a.id === id);
  }, []);

  return {
    draft,
    setDraft,
    quotes,
    setQuotes,
    attachments,
    setAttachments,
    addFiles,
    removeQuote,
    removeAttachment,
    clear,
    buildSendText,
    addWorkspaceFileAttachment,
    addQuoteText,
    addHtmlSnippet,
    removeAttachmentSnippet,
    hasFileAttachment,
  };
}
