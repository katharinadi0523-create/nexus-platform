"use client";

export function WorkspaceHtmlFilePreview({ content }: { content: string }) {
  return (
    <iframe
      title="HTML 预览"
      className="workspace-html-preview__frame"
      data-workspace-html-preview-frame
      sandbox="allow-same-origin"
      srcDoc={content}
    />
  );
}
