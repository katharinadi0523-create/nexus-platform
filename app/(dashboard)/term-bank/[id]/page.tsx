"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, RefreshCw, Trash2, Upload, Plus, Edit, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CreateSynonymDialog } from "@/components/term-bank/CreateSynonymDialog";
import { CreateSpecializedTermDialog } from "@/components/term-bank/CreateSpecializedTermDialog";
import { ImportTermDialog } from "@/components/term-bank/ImportTermDialog";

interface Synonym {
  id: string;
  standardTerm: string;
  synonyms: string;
  updateTime: string;
}

interface SpecializedTerm {
  id: string;
  term: string;
  definition: string;
  updateTime: string;
}

const initialSynonyms: Synonym[] = Array.from({ length: 10 }, (_, i) => ({
  id: `${i + 1}`,
  standardTerm: `耐糖量测试${i > 0 ? i : ""}`,
  synonyms: i === 3 ? "耐糖1, GTT, 耐糖2, 耐糖3333, 耐糖56666666666666666666666666666666" : "耐糖, GTT",
  updateTime: "2025-05-05 05:05:05",
}));

const initialSpecializedTerms: SpecializedTerm[] = Array.from({ length: 7 }, (_, i) => ({
  id: `${i + 1}`,
  term: `耐糖量测试${i > 0 ? i : ""}`,
  definition: "诊断糖尿病前期和糖尿病的“金标准”之一，,尤其在诊断妊娠期糖尿病时至关重要。" + (i > 0 ? `${i}99` : ""),
  updateTime: "2025-05-05 05:05:05",
}));

export default function TermBankDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"synonyms" | "terms">("synonyms");
  const [synonymSearch, setSynonymSearch] = useState("");
  const [termSearch, setTermSearch] = useState("");
  const [selectedSynonyms, setSelectedSynonyms] = useState<string[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [synonymPage, setSynonymPage] = useState(1);
  const [termPage, setTermPage] = useState(1);
  const [synonyms, setSynonyms] = useState<Synonym[]>(initialSynonyms);
  const [specializedTerms, setSpecializedTerms] = useState<SpecializedTerm[]>(initialSpecializedTerms);
  
  // Dialog states
  const [createSynonymOpen, setCreateSynonymOpen] = useState(false);
  const [createTermOpen, setCreateTermOpen] = useState(false);
  const [importSynonymOpen, setImportSynonymOpen] = useState(false);
  const [importTermOpen, setImportTermOpen] = useState(false);

  const termBankName = "耐糖量测试";
  const description = "我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述";
  const creator = "阿星";
  const updateTime = "2025-05-05 05:05:05";
  const synonymCount = 400;
  const termCount = 300;
  const totalCapacity = 1000;

  const filteredSynonyms = synonyms.filter((s) =>
    s.standardTerm.toLowerCase().includes(synonymSearch.toLowerCase()) ||
    s.synonyms.toLowerCase().includes(synonymSearch.toLowerCase())
  );

  const filteredTerms = specializedTerms.filter((t) =>
    t.term.toLowerCase().includes(termSearch.toLowerCase()) ||
    t.definition.toLowerCase().includes(termSearch.toLowerCase())
  );

  const handleCreateSynonym = (data: { standardTerm: string; synonyms: string[] }) => {
    const newSynonym: Synonym = {
      id: Date.now().toString(),
      standardTerm: data.standardTerm,
      synonyms: data.synonyms.join(", "),
      updateTime: new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).replace(/\//g, "-"),
    };
    setSynonyms([newSynonym, ...synonyms]);
    toast.success("创建同义词成功");
  };

  const handleCreateSpecializedTerm = (data: { term: string; definition: string }) => {
    const newTerm: SpecializedTerm = {
      id: Date.now().toString(),
      term: data.term,
      definition: data.definition,
      updateTime: new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).replace(/\//g, "-"),
    };
    setSpecializedTerms([newTerm, ...specializedTerms]);
    toast.success("创建专有名词成功");
  };

  const handleImportSynonym = (file: File) => {
    toast.success(`已导入文件：${file.name}`);
    // TODO: 实现文件解析和导入逻辑
  };

  const handleImportTerm = (file: File) => {
    toast.success(`已导入文件：${file.name}`);
    // TODO: 实现文件解析和导入逻辑
  };

  const handleSynonymSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSynonyms([...selectedSynonyms, id]);
    } else {
      setSelectedSynonyms(selectedSynonyms.filter((i) => i !== id));
    }
  };

  const handleTermSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTerms([...selectedTerms, id]);
    } else {
      setSelectedTerms(selectedTerms.filter((i) => i !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link
          href="/term-bank"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">
            术语库 / {termBankName}
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Edit className="mr-2 h-4 w-4" />
          编辑
        </Button>
      </div>

      {/* Term Bank Info */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">A</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold mb-2">{termBankName}</h1>
            <p className="text-muted-foreground mb-2">{description}</p>
            <div className="text-sm text-muted-foreground">
              @{creator} · {updateTime} 更新
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "synonyms" | "terms")}>
        <TabsList>
          <TabsTrigger value="synonyms" className="flex items-center gap-2">
            同义词 ({synonymCount}/{totalCapacity})
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="cursor-help">
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 text-xs">
                同义词说明
              </PopoverContent>
            </Popover>
          </TabsTrigger>
          <TabsTrigger value="terms" className="flex items-center gap-2">
            专有名词 ({termCount}/{totalCapacity})
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="cursor-help">
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 text-xs">
                专有名词说明
              </PopoverContent>
            </Popover>
          </TabsTrigger>
        </TabsList>

        {/* Synonyms Tab */}
        <TabsContent value="synonyms" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索同义词"
                value={synonymSearch}
                onChange={(e) => setSynonymSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline">批量删除</Button>
              <ImportTermDialog
                open={importSynonymOpen}
                onOpenChange={setImportSynonymOpen}
                title="导入同义词"
                onImport={handleImportSynonym}
              />
              <Button
                variant="outline"
                onClick={() => setImportSynonymOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                文件导入
              </Button>
              <CreateSynonymDialog
                open={createSynonymOpen}
                onOpenChange={setCreateSynonymOpen}
                onSubmit={handleCreateSynonym}
              />
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setCreateSynonymOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                创建同义词
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSynonyms.length === filteredSynonyms.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSynonyms(filteredSynonyms.map((s) => s.id));
                        } else {
                          setSelectedSynonyms([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>标准词</TableHead>
                  <TableHead>同义词</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      更新时间
                    </div>
                  </TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSynonyms.map((synonym) => (
                  <TableRow key={synonym.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSynonyms.includes(synonym.id)}
                        onCheckedChange={(checked) =>
                          handleSynonymSelect(synonym.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">{synonym.standardTerm}</TableCell>
                    <TableCell className="max-w-md">{synonym.synonyms}</TableCell>
                    <TableCell className="text-muted-foreground">{synonym.updateTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">删除</button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-4">
            <div className="text-sm text-muted-foreground">共 {filteredSynonyms.length} 条</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={synonymPage === 1}>
                ‹
              </Button>
              <Button variant="outline" size="sm">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <span className="px-2">...</span>
              <Button variant="outline" size="sm">20</Button>
              <Button variant="outline" size="sm">›</Button>
            </div>
            <Button variant="outline" size="sm">20条/页</Button>
            <form className="flex items-center gap-2">
              <span className="text-sm">前往</span>
              <Input type="number" className="w-16 h-8 text-center" defaultValue={1} />
              <span className="text-sm">页</span>
            </form>
          </div>
        </TabsContent>

        {/* Specialized Terms Tab */}
        <TabsContent value="terms" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索专有名词"
                value={termSearch}
                onChange={(e) => setTermSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline">批量删除</Button>
              <ImportTermDialog
                open={importTermOpen}
                onOpenChange={setImportTermOpen}
                title="导入专有名词"
                onImport={handleImportTerm}
              />
              <Button
                variant="outline"
                onClick={() => setImportTermOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                文件导入
              </Button>
              <CreateSpecializedTermDialog
                open={createTermOpen}
                onOpenChange={setCreateTermOpen}
                onSubmit={handleCreateSpecializedTerm}
              />
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setCreateTermOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                创建专有名词
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTerms.length === filteredTerms.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTerms(filteredTerms.map((t) => t.id));
                        } else {
                          setSelectedTerms([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>专有名词</TableHead>
                  <TableHead>释义</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTerms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTerms.includes(term.id)}
                        onCheckedChange={(checked) =>
                          handleTermSelect(term.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Link href="#" className="text-blue-600 hover:text-blue-800 font-medium">
                        {term.term}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-md text-muted-foreground truncate">
                      {term.definition}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{term.updateTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
                        <button className="text-red-600 hover:text-red-800 text-sm">删除</button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-4">
            <div className="text-sm text-muted-foreground">共 {filteredTerms.length} 条</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={termPage === 1}>
                ‹
              </Button>
              <Button variant="outline" size="sm">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <span className="px-2">...</span>
              <Button variant="outline" size="sm">20</Button>
              <Button variant="outline" size="sm">›</Button>
            </div>
            <Button variant="outline" size="sm">20条/页</Button>
            <form className="flex items-center gap-2">
              <span className="text-sm">前往</span>
              <Input type="number" className="w-16 h-8 text-center" defaultValue={1} />
              <span className="text-sm">页</span>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
