"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function parseInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-bold-${index}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${index}`}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-slate-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    lastIndex = match.index + token.length;
    index += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|?[\s\-:|]+\|?$/.test(line.trim());
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|");
}

function renderTable(rows: string[][], key: string): ReactNode {
  if (rows.length === 0) {
    return null;
  }

  const [headerRow, ...bodyRows] = rows;

  return (
    <div key={key} className="overflow-x-auto rounded-md border border-slate-200">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headerRow.map((cell, cellIndex) => (
              <th
                key={`${key}-head-${cellIndex}`}
                className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-800"
              >
                {parseInlineMarkdown(cell, `${key}-head-${cellIndex}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr key={`${key}-row-${rowIndex}`} className="border-b border-slate-100 last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={`${key}-cell-${rowIndex}-${cellIndex}`} className="px-3 py-2 text-slate-700">
                  {parseInlineMarkdown(cell, `${key}-cell-${rowIndex}-${cellIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderMarkdownBlocks(content: string): ReactNode[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push(
        <h1 key={`h1-${index}`} className="text-2xl font-semibold text-slate-950">
          {parseInlineMarkdown(trimmed.slice(2), `h1-${index}`)}
        </h1>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h2 key={`h2-${index}`} className="text-xl font-semibold text-slate-950">
          {parseInlineMarkdown(trimmed.slice(3), `h2-${index}`)}
        </h2>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${index}`} className="text-base font-semibold text-slate-950">
          {parseInlineMarkdown(trimmed.slice(4), `h3-${index}`)}
        </h3>
      );
      index += 1;
      continue;
    }

    if (isTableRow(trimmed)) {
      const tableLines: string[] = [];
      while (index < lines.length && isTableRow(lines[index].trim())) {
        if (!isTableSeparator(lines[index])) {
          tableLines.push(lines[index]);
        }
        index += 1;
      }

      const rows = tableLines.map(parseTableRow);
      blocks.push(renderTable(rows, `table-${index}`));
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${index}`} className="list-disc space-y-1.5 pl-5 text-slate-700">
          {items.map((item, itemIndex) => (
            <li key={`ul-${index}-item-${itemIndex}`} className="leading-7">
              {parseInlineMarkdown(item, `ul-${index}-item-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (
        !next ||
        next.startsWith("#") ||
        /^[-*]\s+/.test(next) ||
        isTableRow(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      index += 1;
    }

    blocks.push(
      <p key={`p-${index}`} className="leading-7 text-slate-700">
        {parseInlineMarkdown(paragraphLines.join(" "), `p-${index}`)}
      </p>
    );
  }

  return blocks;
}

export type MarkdownPreviewProps = {
  content: string;
  placeholder?: string;
  className?: string;
};

export function MarkdownPreview({ content, placeholder, className }: MarkdownPreviewProps) {
  const trimmed = content.trim();

  if (!trimmed) {
    return (
      <div className={cn("whitespace-pre-wrap text-sm leading-7 text-slate-400", className)}>
        {placeholder ?? "暂无内容"}
      </div>
    );
  }

  const blocks = renderMarkdownBlocks(content);

  return (
    <div className={cn("space-y-4 text-sm", className)}>
      {blocks.length > 0 ? blocks : <p className="leading-7 text-slate-700">{content}</p>}
    </div>
  );
}
