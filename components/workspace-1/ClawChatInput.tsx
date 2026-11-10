'use client';

import React, { useCallback, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { normalizeMarkdownMath } from '@/components/workspace-1/normalizeMarkdownMath';
import "./katex.min.css";
import "./claw-render.css";
import type { ClawQuoteItem } from './ClawSelectionMenu';
import { buildClawQuotedUserContent } from './ClawSelectionMenu';
import {
  IconCompass,
  IconDocSparkle,
  IconGrid,
  IconMic,
  IconPaperclip,
  IconSend,
} from './clawRenderIcons';

export type ClawInputSnippet = { id: string; text: string };

export type ClawInputAttachment = {
  id: string;
  fileName: string;
  content: string;
  fileSize?: number;
  snippets?: ClawInputSnippet[];
};

function QuoteChipMarkdown({ text }: { text: string }) {
  const md = normalizeMarkdownMath(text);
  return (
    <div className="claw-quote-chip__md" title={text}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }]]}
        components={{
          p: ({ children }) => <p className="claw-quote-chip__p">{children}</p>,
          code: ({ children, className }) => {
            const isBlock = typeof className === 'string' && className.includes('language-');
            if (isBlock) return <code className={className}>{children}</code>;
            return <code className="claw-inline-code">{children}</code>;
          },
          pre: ({ children }) => <pre className="claw-quote-chip__pre">{children}</pre>,
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}

const CLAW_UPLOAD_BLOCKED: { category: string; formats: string }[] = [
  { category: '压缩包', formats: 'zip, 7z, tar, rar, gz' },
  { category: '可执行程序', formats: 'exe, com, scr, pif, cpl, msi, msix, appx, appxbundle, app, run' },
  { category: '动态库与系统驱动', formats: 'dll, sys, drv, ocx, so, dylib, ko' },
  { category: '快捷方式与系统控制文件', formats: 'lnk, scf, url, reg, inf, desktop' },
  { category: '高风险网页执行文件', formats: 'hta, chm, mhtml, mht, xap' },
  { category: 'Office 宏文件', formats: 'docm, dotm, xlsm, xltm, xlam, pptm, potm, ppsm' },
  { category: '软件安装包', formats: 'apk, aab, ipa, pkg, deb, rpm, appimage, snap' },
  { category: '磁盘与虚拟机镜像', formats: 'iso, dmg, img, vhd, vhdx, vmdk, qcow, qcow2' },
  { category: '密钥与凭证容器', formats: 'key, p12, pfx, jks, keystore, kdb, kdbx' },
  { category: '高风险序列化对象', formats: 'pkl, pickle, joblib, dill, pt, pth, ckpt' },
  { category: '编译产物与字节码', formats: 'o, obj, a, lib, class, pyc, pyo, dex' },
  { category: '固件与底层二进制', formats: 'rom, firmware, fw, elf, axf' },
  { category: '通用未知二进制', formats: 'bin, blob, dat, dump, core' },
  {
    category: '数据库运行附属文件',
    formats: 'sqlite-wal, sqlite-shm, sqlite-journal, ldf, ibd, frm, myd, myi',
  },
  { category: '临时与自动恢复文件', formats: 'tmp, temp, swp, swo, crdownload, part' },
];

const CLAW_UPLOAD_MAX_COUNT = 10;
const CLAW_UPLOAD_MAX_TOTAL_BYTES = 200 * 1024 * 1024;
const CLAW_UPLOAD_MAX_FILE_BYTES = 50 * 1024 * 1024;
const CLAW_UPLOAD_TEXT_MAX_CHARS = 200_000;
/** 粘贴纯文本超过该字数时，按 txt 附件处理（原型仅渲染文件框） */
const CLAW_PASTE_AS_FILE_MIN_CHARS = 5_000;
/** 粘贴纯文本达到该字数时直接拒绝 */
const CLAW_PASTE_REJECT_MIN_CHARS = 100_000;
/** 粘贴转 txt 单文件大小上限 */
const CLAW_PASTE_AS_FILE_MAX_BYTES = 10 * 1024 * 1024;

function createPasteAsTxtFile(charCount: number): File {
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return new File(
    [`[超长粘贴文本已转为附件：约 ${charCount} 字]`],
    `粘贴文本-${stamp}-${rand}.txt`,
    { type: 'text/plain' },
  );
}

function fileExtension(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const i = base.lastIndexOf('.');
  if (i <= 0 || i === base.length - 1) return '';
  return base.slice(i + 1).toLowerCase();
}

function formatUploadBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CLAW_UPLOAD_BLOCKED_EXT = new Set(
  CLAW_UPLOAD_BLOCKED.flatMap((row) =>
    row.formats.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  ),
);

const CLAW_UPLOAD_TEXT_EXTS = new Set(
  [
    'txt',
    'md',
    'markdown',
    'log',
    'rst',
    'tex',
    'csv',
    'tsv',
    'json',
    'jsonl',
    'ndjson',
    'yaml',
    'yml',
    'xml',
    'toml',
    'ini',
    'cfg',
    'conf',
    'properties',
    'env',
    'py',
    'c',
    'h',
    'cpp',
    'cc',
    'hpp',
    'java',
    'kt',
    'go',
    'rs',
    'cs',
    'swift',
    'dart',
    'php',
    'rb',
    'r',
    'lua',
    'sql',
    'html',
    'htm',
    'css',
    'scss',
    'js',
    'mjs',
    'cjs',
    'ts',
    'jsx',
    'tsx',
    'vue',
    'svelte',
    'sh',
    'bash',
    'zsh',
    'bat',
    'cmd',
    'ps1',
    'ipynb',
    'proto',
    'graphql',
    'rtf',
  ].map((s) => s.toLowerCase()),
);

function isFileDragEvent(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes('Files');
}

export async function readDroppedFileAsAttachment(file: File): Promise<ClawInputAttachment> {
  const ext = fileExtension(file.name);
  const isText =
    CLAW_UPLOAD_TEXT_EXTS.has(ext) ||
    file.type.startsWith('text/') ||
    file.type === 'application/json' ||
    file.type === 'application/xml';

  let content: string;
  if (isText) {
    const raw = await file.text();
    content =
      raw.length > CLAW_UPLOAD_TEXT_MAX_CHARS
        ? `${raw.slice(0, CLAW_UPLOAD_TEXT_MAX_CHARS)}\n\n…（内容过长，已截断）`
        : raw;
  } else {
    content = `[已上传附件：${file.name}，${formatUploadBytes(file.size)}${
      ext ? `，.${ext}` : ''
    }]`;
  }

  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    fileName: file.name,
    content,
    fileSize: file.size,
  };
}

type ClawUploadFilterResult = {
  accepted: File[];
  errors: string[];
  hasBlockedType: boolean;
};

export function filterUploadFiles(
  files: readonly File[],
  existing: readonly ClawInputAttachment[],
): ClawUploadFilterResult {
  const errors: string[] = [];
  const accepted: File[] = [];
  let hasBlockedType = false;
  let totalBytes = existing.reduce((sum, a) => sum + (a.fileSize ?? 0), 0);
  let count = existing.length;

  for (const file of files) {
    const ext = fileExtension(file.name);
    if (!ext) {
      errors.push(`${file.name}：缺少扩展名`);
      continue;
    }
    if (CLAW_UPLOAD_BLOCKED_EXT.has(ext)) {
      hasBlockedType = true;
      continue;
    }
    // 黑名单外默认放行；统一单文件上限 50MB
    if (file.size > CLAW_UPLOAD_MAX_FILE_BYTES) {
      errors.push(`${file.name}：超过单文件限制（50MB）`);
      continue;
    }
    if (count + 1 > CLAW_UPLOAD_MAX_COUNT) {
      errors.push(`已达整体个数上限（${CLAW_UPLOAD_MAX_COUNT} 个）`);
      break;
    }
    if (totalBytes + file.size > CLAW_UPLOAD_MAX_TOTAL_BYTES) {
      errors.push(`已达整体大小上限（200MB）`);
      break;
    }
    if (existing.some((a) => a.fileName === file.name && a.fileSize === file.size)) {
      errors.push(`${file.name}：已在附件列表中`);
      continue;
    }
    if (accepted.some((a) => a.name === file.name && a.size === file.size)) {
      continue;
    }
    accepted.push(file);
    count += 1;
    totalBytes += file.size;
  }

  return { accepted, errors, hasBlockedType };
}

export function ClawChatInput({
  value,
  onChange,
  onSend,
  placeholder = '有问题，尽管提',
  quotes = [],
  onRemoveQuote,
  attachments = [],
  onRemoveAttachment,
  onRemoveAttachmentSnippet,
  onAddFiles,
  onToast,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
  quotes?: ClawQuoteItem[];
  onRemoveQuote?: (id: string) => void;
  attachments?: ClawInputAttachment[];
  onRemoveAttachment?: (id: string) => void;
  onRemoveAttachmentSnippet?: (attachmentId: string, snippetId: string) => void;
  onAddFiles?: (files: FileList | File[]) => void;
  onToast?: (message: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSend = value.trim().length > 0 || quotes.length > 0 || attachments.length > 0;

  const clearDrag = useCallback(() => {
    dragDepthRef.current = 0;
    setDragging(false);
  }, []);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onAddFiles || !isFileDragEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onAddFiles || !isFileDragEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onAddFiles || !isFileDragEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onAddFiles) return;
    e.preventDefault();
    e.stopPropagation();
    clearDrag();
    const files = e.dataTransfer.files;
    if (files.length > 0) onAddFiles(files);
  };

  return (
    <div
      className={`claw-input${dragging ? ' claw-input--drag' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {dragging ? (
        <div className="claw-input-drag" aria-hidden>
          <IconPaperclip />
          <strong>松开以上传附件</strong>
          <span>
            附件支持PDF、DOC(X)、XLS(X)、CSV、WPS、OFD、txt、image、audio等常见格式，最多10个文件，每个50MB，总大小不超过200MB。
          </span>
        </div>
      ) : null}
      {attachments.length > 0 ? (
        <div className="claw-input-files" aria-label="引用文档">
          {attachments.map((item) => {
            const snippets = item.snippets ?? [];
            return (
              <div key={item.id} className="claw-input-file-chip">
                <IconDocSparkle />
                <span className="claw-input-file-chip__name" title={item.fileName}>
                  {item.fileName}
                </span>
                {snippets.length ? (
                  <span className="claw-input-file-snips">
                    {snippets.map((snippet, index) => (
                      <span key={snippet.id} className="claw-input-html-pill">
                        <span className="claw-input-html-pill__num">{index + 1}</span>
                        {onRemoveAttachmentSnippet ? (
                          <button
                            type="button"
                            className="claw-quote-chip__remove"
                            aria-label={`移除引用 ${index + 1}`}
                            onClick={() => onRemoveAttachmentSnippet(item.id, snippet.id)}
                          >
                            ×
                          </button>
                        ) : null}
                        <span className="claw-input-html-pill__tip" role="tooltip">
                          {snippet.text}
                        </span>
                      </span>
                    ))}
                  </span>
                ) : null}
                {onRemoveAttachment ? (
                  <button
                    type="button"
                    className="claw-quote-chip__remove"
                    aria-label="移除引用文档"
                    onClick={() => onRemoveAttachment(item.id)}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {quotes.length > 0 ? (
        <div className="claw-quotes" aria-label="追问引用">
          {quotes.map((item, index) => (
            <div key={item.id} className="claw-quote-chip">
              <span className="claw-quote-chip__num">{index + 1}</span>
              <QuoteChipMarkdown text={item.text} />
              {onRemoveQuote ? (
                <button
                  type="button"
                  className="claw-quote-chip__remove"
                  aria-label="移除该条引用"
                  onClick={() => onRemoveQuote(item.id)}
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <textarea
        className="claw-input__textarea"
        rows={2}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text/plain');
          if (!text) return;
          if (text.length >= CLAW_PASTE_REJECT_MIN_CHARS) {
            e.preventDefault();
            onToast?.('粘贴文本超过 10 万字，已拒绝');
            return;
          }
          const byteLength = new TextEncoder().encode(text).length;
          if (byteLength > CLAW_PASTE_AS_FILE_MAX_BYTES) {
            e.preventDefault();
            onToast?.('粘贴文本超过 10MB，已拒绝');
            return;
          }
          if (!onAddFiles || text.length < CLAW_PASTE_AS_FILE_MIN_CHARS) return;
          e.preventDefault();
          onAddFiles([createPasteAsTxtFile(text.length)]);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
      />
      <div className="claw-input__bar">
        <div className="claw-input__chips">
          <button type="button" className="claw-chip">
            <IconCompass />
            <span>技能</span>
          </button>
          <button type="button" className="claw-chip">
            <IconGrid />
            <span>智能体</span>
          </button>
        </div>
        <div className="claw-input__actions">
          <button
            type="button"
            className="claw-icon-btn"
            title="附件"
            aria-label="附件"
            onClick={() => fileInputRef.current?.click()}
          >
            <IconPaperclip />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="claw-file-input"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0 && onAddFiles) onAddFiles(files);
              e.target.value = '';
            }}
          />
          <button type="button" className="claw-icon-btn" title="语音" aria-label="语音">
            <IconMic />
          </button>
          <button
            type="button"
            className={`claw-send${canSend ? ' claw-send--active' : ''}`}
            disabled={!canSend}
            onClick={onSend}
            aria-label="发送"
          >
            <IconSend />
          </button>
        </div>
      </div>
    </div>
  );
}
export function buildMessageWithAttachments(
  quotes: readonly ClawQuoteItem[],
  attachments: readonly ClawInputAttachment[],
  draft: string,
): string {
  const base = buildClawQuotedUserContent(quotes, draft).trim();
  if (!attachments.length) return base;
  const files = attachments
    .map((f) => {
      const body = `【附件：${f.fileName}】\n\`\`\`\n${f.content.trim()}\n\`\`\``;
      const snips = (f.snippets ?? [])
        .map((s, index) => `【${f.fileName} 引用片段 ${index + 1}】\n\`\`\`html\n${s.text.trim()}\n\`\`\``)
        .join('\n\n');
      return snips ? `${body}\n\n${snips}` : body;
    })
    .join('\n\n');
  return base ? `${files}\n\n${base}` : files;
}
