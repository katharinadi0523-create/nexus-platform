export type SkillEditChatContext = {
  mode: "promote" | "update";
  skillId: string;
  name: string;
  description: string;
  scene?: string;
  skillMdContent: string;
  files: string[];
  packageFiles?: Array<{ path: string; content: string }>;
  version?: string;
};

export type SkillCreateChatContext = { examplePrompt: string };

let pending: { sessionId: string; text: string; skillEdit?: SkillEditChatContext; skillCreate?: SkillCreateChatContext } | null = null;

export function queueWorkspaceChatBootstrap(sessionId: string, text: string, skillEdit?: SkillEditChatContext, skillCreate?: SkillCreateChatContext) {
  pending = { sessionId, text, skillEdit, skillCreate };
}

export function takeWorkspaceChatBootstrap() {
  const next = pending;
  pending = null;
  return next;
}
