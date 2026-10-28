'use client';

import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import "./sdp-preview.css";

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('toml', bash);

export type PreviewKind =
  | 'markdown'
  | 'plaintext'
  | 'structured'
  | 'code'
  | 'spreadsheet'
  | 'docx'
  | 'pdf'
  | 'pptx'
  | 'image'
  | 'env';

export type SpreadsheetSheet = {
  name: string;
  rows: string[][];
};

export type PdfPage = {
  title: string;
  lines: string[];
};

export type PptSlide = {
  title: string;
  bullets: string[];
};

export type DocFile = {
  id: string;
  name: string;
  kind: PreviewKind;
  /** 文本类内容 */
  content?: string;
  /** 代码高亮语言 */
  language?: string;
  /** 结构化数据的树（JSON/YAML 等） */
  tree?: unknown;
  sheets?: SpreadsheetSheet[];
  /** Word 预览 HTML */
  docHtml?: string;
  pdfPages?: PdfPage[];
  slides?: PptSlide[];
  imageSrc?: string;
  imageAlt?: string;
};

export function getExt(name: string): string {
  if (name === '.env' || name.endsWith('/.env')) return 'env';
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function inferPreviewKind(name: string): PreviewKind {
  const ext = getExt(name);
  if (ext === 'md') return 'markdown';
  if (ext === 'txt') return 'plaintext';
  if (['json', 'jsonl', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) return 'structured';
  if (['py', 'js', 'ts', 'mjs', 'css', 'sql', 'html'].includes(ext)) return 'code';
  if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) return 'spreadsheet';
  if (['docx', 'doc'].includes(ext)) return 'docx';
  if (ext === 'pdf') return 'pdf';
  if (['pptx', 'ppt'].includes(ext)) return 'pptx';
  if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'ico'].includes(ext)) return 'image';
  if (ext === 'env') return 'env';
  return 'plaintext';
}

function highlightCode(code: string, language?: string): string {
  try {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function CodeHighlight({ code, language }: { code: string; language?: string }) {
  const html = useMemo(() => highlightCode(code, language), [code, language]);
  return (
    <pre className="sdp-preview-code">
      <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}

type TreeNodeProps = {
  label: string;
  value: unknown;
  depth?: number;
  defaultOpen?: boolean;
};

function TreeNode({ label, value, depth = 0, defaultOpen = true }: TreeNodeProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isObj = value !== null && typeof value === 'object';
  const isArr = Array.isArray(value);

  if (!isObj) {
    const type =
      value === null ? 'null' : typeof value === 'string' ? 'string' : typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'bool' : 'other';
    return (
      <div className="sdp-tree__row" style={{ paddingLeft: depth * 14 }}>
        <span className="sdp-tree__key">{label}</span>
        <span className="sdp-tree__colon">:</span>
        <span className={`sdp-tree__val sdp-tree__val--${type}`}>
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    );
  }

  const entries = isArr
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  return (
    <div className="sdp-tree__node">
      <button
        type="button"
        className="sdp-tree__row sdp-tree__toggle"
        style={{ paddingLeft: depth * 14 }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={`sdp-tree__caret${open ? ' is-open' : ''}`}>▸</span>
        <span className="sdp-tree__key">{label}</span>
        <span className="sdp-tree__meta">
          {isArr ? `Array(${entries.length})` : `Object(${entries.length})`}
        </span>
      </button>
      {open
        ? entries.map(([k, v]) => (
            <TreeNode key={`${depth}-${k}`} label={k} value={v} depth={depth + 1} defaultOpen={depth < 1} />
          ))
        : null}
    </div>
  );
}

function StructuredPreview({ file }: { file: DocFile }) {
  const [mode, setMode] = useState<'code' | 'tree'>('tree');
  const tree = useMemo(() => {
    if (file.tree !== undefined) return file.tree;
    if (!file.content) return null;
    try {
      return JSON.parse(file.content);
    } catch {
      return null;
    }
  }, [file.content, file.tree]);

  return (
    <div className="sdp-structured">
      <div className="sdp-preview-toolbar">
        <button
          type="button"
          className={`sdp-preview-toolbar__btn${mode === 'tree' ? ' is-active' : ''}`}
          onClick={() => setMode('tree')}
        >
          树形结构
        </button>
        <button
          type="button"
          className={`sdp-preview-toolbar__btn${mode === 'code' ? ' is-active' : ''}`}
          onClick={() => setMode('code')}
        >
          语法高亮
        </button>
      </div>
      {mode === 'code' ? (
        <CodeHighlight code={file.content ?? ''} language={file.language ?? getExt(file.name)} />
      ) : tree != null ? (
        <div className="sdp-tree">
          <TreeNode label="root" value={tree} defaultOpen />
        </div>
      ) : (
        <CodeHighlight code={file.content ?? ''} language={file.language ?? getExt(file.name)} />
      )}
    </div>
  );
}

function SpreadsheetPreview({ sheets }: { sheets: SpreadsheetSheet[] }) {
  const [sheetIdx, setSheetIdx] = useState(0);
  const sheet = sheets[sheetIdx] ?? sheets[0];
  if (!sheet) return <p className="sdp-preview-empty">无可预览的工作表</p>;

  return (
    <div className="sdp-sheet">
      <div className="sdp-sheet__tabs" role="tablist" aria-label="工作表">
        {sheets.map((s, i) => (
          <button
            key={s.name}
            type="button"
            role="tab"
            aria-selected={i === sheetIdx}
            className={`sdp-sheet__tab${i === sheetIdx ? ' is-active' : ''}`}
            onClick={() => setSheetIdx(i)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="sdp-sheet__scroll">
        <table className="sdp-sheet__table">
          <tbody>
            {sheet.rows.map((row, ri) => (
              <tr key={ri} className={ri === 0 ? 'is-header' : undefined}>
                <td className="sdp-sheet__rownum">{ri + 1}</td>
                {row.map((cell, ci) => (
                  <td key={ci}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocxPreview({ html }: { html: string }) {
  return (
    <div className="sdp-docx">
      <div className="sdp-docx__badge">已转换为 HTML 预览</div>
      <article className="sdp-docx__page" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function PdfPreview({ pages }: { pages: PdfPage[] }) {
  const [page, setPage] = useState(0);
  const cur = pages[page] ?? pages[0];
  if (!cur) return <p className="sdp-preview-empty">无可预览的 PDF 页面</p>;

  return (
    <div className="sdp-pdf">
      <div className="sdp-preview-toolbar">
        <button
          type="button"
          className="sdp-preview-toolbar__btn"
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          上一页
        </button>
        <span className="sdp-preview-toolbar__meta">
          {page + 1} / {pages.length}
        </span>
        <button
          type="button"
          className="sdp-preview-toolbar__btn"
          disabled={page >= pages.length - 1}
          onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
        >
          下一页
        </button>
      </div>
      <div className="sdp-pdf__page">
        <h3 className="sdp-pdf__title">{cur.title}</h3>
        {cur.lines.map((line, i) => (
          <p key={i} className="sdp-pdf__line">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function PptxPreview({ slides }: { slides: PptSlide[] }) {
  if (!slides.length) return <p className="sdp-preview-empty">无可预览的幻灯片</p>;

  return (
    <div className="sdp-pptx" aria-label="幻灯片预览">
      {slides.map((slide, i) => (
        <div key={`${slide.title}-${i}`} className="sdp-pptx__slide">
          <div className="sdp-pptx__slide-label">幻灯片 {i + 1}</div>
          <div className="sdp-pptx__stage">
            <h3 className="sdp-pptx__title">{slide.title}</h3>
            <ul className="sdp-pptx__bullets">
              {slide.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function ImagePreview({ src, alt, name }: { src: string; alt: string; name: string }) {
  const [zoom, setZoom] = useState(1);

  const download = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = name;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.click();
  };

  return (
    <div className="sdp-img">
      <div className="sdp-preview-toolbar">
        <button
          type="button"
          className="sdp-preview-toolbar__btn"
          onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
        >
          缩小
        </button>
        <span className="sdp-preview-toolbar__meta">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="sdp-preview-toolbar__btn"
          onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
        >
          放大
        </button>
        <button type="button" className="sdp-preview-toolbar__btn" onClick={() => setZoom(1)}>
          重置
        </button>
        <button type="button" className="sdp-preview-toolbar__btn" onClick={download}>
          下载
        </button>
      </div>
      <div className="sdp-img__viewport">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="sdp-img__el"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>
    </div>
  );
}

function EnvPreview({ content }: { content: string }) {
  const rows = content
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  return (
    <div className="sdp-env">
      {rows.map((line, i) => {
        if (line.trimStart().startsWith('#')) {
          return (
            <div key={i} className="sdp-env__row sdp-env__row--comment">
              {line}
            </div>
          );
        }
        const eq = line.indexOf('=');
        if (eq < 0) {
          return (
            <div key={i} className="sdp-env__row">
              {line}
            </div>
          );
        }
        return (
          <div key={i} className="sdp-env__row">
            <span className="sdp-env__key">{line.slice(0, eq)}</span>
            <span className="sdp-env__eq">=</span>
            <span className="sdp-env__val">{line.slice(eq + 1)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DocumentFilePreview({ file }: { file: DocFile }) {
  switch (file.kind) {
    case 'markdown':
      return (
        <div className="sdp-md">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {file.content ?? ''}
          </ReactMarkdown>
        </div>
      );
    case 'plaintext':
      return <pre className="sdp-preview-plain">{file.content ?? ''}</pre>;
    case 'structured':
      return <StructuredPreview file={file} />;
    case 'code':
      return <CodeHighlight code={file.content ?? ''} language={file.language ?? getExt(file.name)} />;
    case 'spreadsheet':
      return <SpreadsheetPreview sheets={file.sheets ?? []} />;
    case 'docx':
      return <DocxPreview html={file.docHtml ?? '<p>空文档</p>'} />;
    case 'pdf':
      return <PdfPreview pages={file.pdfPages ?? []} />;
    case 'pptx':
      return <PptxPreview slides={file.slides ?? []} />;
    case 'image':
      return (
        <ImagePreview
          src={file.imageSrc ?? ''}
          alt={file.imageAlt ?? file.name}
          name={file.name}
        />
      );
    case 'env':
      return <EnvPreview content={file.content ?? ''} />;
    default:
      return <pre className="sdp-preview-plain">{file.content ?? ''}</pre>;
  }
}
