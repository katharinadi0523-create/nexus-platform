"use client";

import { useMemo } from "react";
import {
  DocumentFilePreview,
  getExt,
  inferPreviewKind,
  type PreviewKind,
} from "@/components/workspace-1/DocumentFilePreview";
import { WorkspaceHtmlFilePreview } from "@/components/workspace-1/WorkspaceHtmlFilePreview";
import "@/components/workspace-1/highlight-github.css";
import "./skill-file-preview.css";

const EXTRA_CODE_EXTS = new Set(["tsx", "jsx", "go", "rs", "java", "kt", "sh"]);

const UNSUPPORTED_PREVIEW_EXTS = new Set([
  "zip",
  "gz",
  "tgz",
  "rar",
  "7z",
]);

const UNSUPPORTED_EDIT_EXTS = new Set([
  "docx",
  "doc",
  "pdf",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "bmp",
  ...UNSUPPORTED_PREVIEW_EXTS,
]);

export function isSkillFilePreviewable(path: string) {
  return !UNSUPPORTED_PREVIEW_EXTS.has(getExt(path));
}

export function isSkillFileTextEditable(path: string) {
  return isSkillFilePreviewable(path) && !UNSUPPORTED_EDIT_EXTS.has(getExt(path));
}

function skillPreviewKind(path: string): PreviewKind {
  const ext = getExt(path);
  if (EXTRA_CODE_EXTS.has(ext)) return "code";
  return inferPreviewKind(path);
}

function prepareMarkdownContent(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return content;
  return `\`\`\`yaml\n${match[1].trimEnd()}\n\`\`\`\n\n${content.slice(match[0].length)}`;
}

export function SkillFilePreview({
  path,
  content,
  htmlLivePreview = false,
}: {
  path: string;
  content: string;
  /** 工作空间：.html 按页面渲染，便于右键引用节点 HTML */
  htmlLivePreview?: boolean;
}) {
  const kind = skillPreviewKind(path);
  const previewContent = useMemo(
    () => (kind === "markdown" ? prepareMarkdownContent(content) : content),
    [content, kind]
  );

  if (!isSkillFilePreviewable(path)) {
    const ext = getExt(path) || "该";
    return (
      <div className="skill-file-preview skill-file-preview--unsupported">
        <p className="skill-file-preview__empty">.{ext} 文件不支持预览</p>
      </div>
    );
  }

  if (!content.trim()) {
    return <p className="skill-file-preview__empty">暂无内容</p>;
  }

  if (htmlLivePreview && getExt(path) === "html") {
    return (
      <div className="skill-file-preview skill-file-preview--html-live">
        <WorkspaceHtmlFilePreview content={content} />
      </div>
    );
  }

  return (
    <div className="skill-file-preview">
      <DocumentFilePreview
        file={{
          id: path,
          name: path,
          kind,
          content: previewContent,
          language: getExt(path),
        }}
      />
    </div>
  );
}
