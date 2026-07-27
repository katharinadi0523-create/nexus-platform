import type { SkillFile } from "./types";

/** AI 创建 mock：上传本地尚无解析 Skill 的新格式（GFF） */
export const CREATE_SKILL_ID_PREFIX = "gff-parser";
export const CREATE_SKILL_NAME = "GFF解析";
export const CREATE_SKILL_DISPLAY_NAME = "GFF解析";
export const CREATE_SKILL_SAMPLE = "samples/genes.gff";
export const CREATE_SKILL_DESCRIPTION =
  "按解析流水线对 GFF 基因注释文件做确定性解析：检索本地技能与本体对象类型、按 Object Type 规则装配解析器、解码与 QC、生成元数据并记录血缘。";
export const CREATE_SKILL_USAGE =
  "上传已入库的 GFF / GFF3 文件。技能会先检索本地是否已有同类 Skill，再查本体 Object Type（如 GeneAnnotation），按预装工具做确定性解析，不访问外网。";

export const CREATE_SKILL_FILES: SkillFile[] = [
  {
    path: "SKILL.md",
    content: `---
name: gff-parser
description: "对 GFF 基因注释文件执行确定性解析流水线。"
runtime: deterministic
network: none
---

# 创建背景
本地技能库尚无 GFF 解析 Skill；本体命中 Object Type「GeneAnnotation」后，由 Skill 工厂按其属性与预装工具装配。

# 解析流水线
1. 文件上传：引用原始文件资产与 SHA-256（原始层只读）
2. 检索本地 Skill / 工单池
3. 本体查询：匹配 Object Type 及其属性 / 约束 / 解析规则 / 对应工具
4. Skill 调用：预装工具 · 确定性 · 不联网
5. 文件解析：解码 + 结构化 + QC
6. 元数据生成：字段 + 来源证据
7. 入库：沉淀资产并记录血缘
`,
    change: "added",
  },
  {
    path: "skill.json",
    content: `{
  "name": "gff-parser",
  "entry": "src/main.py",
  "runtime": "python3.11",
  "format": "gff",
  "qualityGate": null
}`,
    change: "added",
  },
  {
    path: "src/main.py",
    content: `from ontology import match_gff_operator
from parse import decode_and_qc
from metadata import build_metadata
from lineage import record_lineage, ingest

def run(file_asset):
    """Deterministic GFF parse pipeline. No LLM. No network."""
    operator = match_gff_operator(file_asset)
    if operator is None:
        return {"status": "need_skill_order", "reason": "no_operator"}
    parsed = decode_and_qc(file_asset, operator)
    meta = build_metadata(file_asset, parsed, operator)
    lineage = record_lineage(file_asset, "gff-parser", "1.0", parsed)
    return ingest(file_asset, parsed, meta, lineage)
`,
    change: "added",
  },
  {
    path: "src/ontology.py",
    content: `def match_gff_operator(file_asset):
    """本体查询：匹配 Object Type（GeneAnnotation）及其属性 / 规则 / 工具。"""
    hint = (file_asset.get("format") or file_asset.get("ext") or "").lower()
    if hint not in {"gff", "gff3"}:
        return None
    return {
        "object_type": "GeneAnnotation",
        "format": "gff3",
        "tools": ["gffutils", "Bio.SeqIO"],
        "properties": ["seqid", "source", "type", "start", "end", "strand", "feature_count", "species"],
        "parse_rule": "gff3_9col",
    }
`,
    change: "added",
  },
  {
    path: "src/parse.py",
    content: `def decode_and_qc(file_asset, operator):
    """解码 + 结构化 + QC。"""
    rows = read_gff_rows(file_asset["path"])
    feature_count = len(rows)
    seqids = sorted({row["seqid"] for row in rows})
    qc_pass = feature_count > 0 and all(row.get("type") for row in rows)
    return {
        "decode_ok": True,
        "feature_count": feature_count,
        "seqids": seqids,
        "qc_pass": qc_pass,
        "errors": [] if qc_pass else ["missing_feature_type"],
    }
`,
    change: "added",
  },
  {
    path: "src/metadata.py",
    content: `def build_metadata(file_asset, parsed, operator):
    """元数据：源文件没有的信息不填（防幻觉）。"""
    return {
        "fields": {
            "feature_count": parsed["feature_count"],
            "seqids": parsed["seqids"],
            "species": None,
        },
        "evidence": {
            "feature_count": {"source": "gff_rows", "file_sha256": file_asset["sha256"]},
            "species": {"source": None, "note": "GFF 未必含物种，保持 null"},
        },
        "missing": ["species"],
    }
`,
    change: "added",
  },
  {
    path: "src/lineage.py",
    content: `def record_lineage(file_asset, skill_id, version, parsed):
    return {
        "raw_file_id": file_asset["id"],
        "raw_sha256": file_asset["sha256"],
        "skill_id": skill_id,
        "skill_version": version,
        "parsed_ok": parsed.get("decode_ok") and parsed.get("qc_pass"),
        "layer": "parse_standardized",
    }

def ingest(file_asset, parsed, meta, lineage):
    return {
        "status": "ingested" if lineage["parsed_ok"] else "failed",
        "parsed": parsed,
        "metadata": meta,
        "lineage": lineage,
        "raw_readonly": True,
    }
`,
    change: "added",
  },
  {
    path: "tests/test_gff_pipeline.py",
    content: `def test_standard_gff_pipeline():
    asset = {"id": "fa-gff-001", "path": "samples/genes.gff", "sha256": "def", "format": "gff"}
    result = run(asset)
    assert result["status"] == "ingested"
    assert result["metadata"]["fields"]["species"] is None

def test_deterministic_same_input():
    asset = {"id": "fa-gff-001", "path": "samples/genes.gff", "sha256": "def", "format": "gff"}
    assert run(asset) == run(asset)
`,
    change: "added",
  },
  {
    path: "samples/genes.gff",
    content: `##gff-version 3
Chr1	maker	gene	1000	9000	.	+	.	ID=gene1;Name=OsDrought1
Chr1	maker	mRNA	1000	9000	.	+	.	ID=mRNA1;Parent=gene1
Chr1	maker	CDS	1200	1800	.	+	0	ID=cds1;Parent=mRNA1
`,
    change: "added",
  },
  {
    path: "runtime/dependencies.txt",
    content: `gffutils==0.12
biopython==1.83
`,
    change: "added",
  },
];
