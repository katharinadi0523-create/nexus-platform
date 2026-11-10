export const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "mhtml", "pptx", "wps", "md", "txt", "html", "xmind", "json", "xml", "log", "jsonl", "zip"];
export const TABLE_EXTENSIONS = ["xlsx", "xls", "csv"];
export const UPLOAD_ACCEPT = [...DOCUMENT_EXTENSIONS, ...TABLE_EXTENSIONS].map(ext => `.${ext}`).join(",");

export async function validateKnowledgeFile(file: File): Promise<{ kind: "text" | "table"; error?: string }> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const kind = TABLE_EXTENSIONS.includes(extension) ? "table" : "text";
  if (!DOCUMENT_EXTENSIONS.includes(extension) && !TABLE_EXTENSIONS.includes(extension)) return { kind, error: "不支持的文件格式" };
  const maxMB = kind === "table" ? 50 : 200;
  if (file.size > maxMB * 1024 * 1024) return { kind, error: `单个文件不能超过 ${maxMB}MB` };
  if (kind === "text") return { kind };
  try {
    const XLSX = await import("xlsx");
    const data = await file.arrayBuffer();
    const workbook = extension === "csv"
      ? XLSX.read(new TextDecoder("utf-8").decode(data), { type: "string", raw: true })
      : XLSX.read(data, { type: "array", cellText: true });
    if (!workbook.SheetNames.length) return { kind, error: "表格内容无法读取" };
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const counts = new Map<number, number>();
      for (const address of Object.keys(sheet)) {
        if (address.startsWith("!")) continue;
        const cell = sheet[address];
        const row = XLSX.utils.decode_cell(address).r;
        const count = (counts.get(row) ?? 0) + Array.from(String(cell.w ?? cell.v ?? "")).length;
        if (count > 10000) return { kind, error: `工作表“${name}”第 ${row + 1} 行超过 10000 字符` };
        counts.set(row, count);
      }
    }
    return { kind };
  } catch {
    return { kind, error: "表格解析失败，请确认文件完整且未加密" };
  }
}
