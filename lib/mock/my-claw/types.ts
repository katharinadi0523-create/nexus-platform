export type MyClawModule =
  | "chat"
  | "agents"
  | "skills"
  | "plugins"
  | "automation"
  | "files"
  | "settings"
  | "product";

export type MyClawSessionKind =
  | "expense"
  | "enterprise_session"
  | "research_multi_agent"
  | "blank";

export interface MyClawSessionListItem {
  id: string;
  title: string;
  kind: MyClawSessionKind;
  pinned: boolean;
  updatedAt: string;
  preview: string;
}
