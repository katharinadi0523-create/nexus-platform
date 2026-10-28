let pending: { sessionId: string; text: string } | null = null;

export function queueWorkspaceChatBootstrap(sessionId: string, text: string) {
  pending = { sessionId, text };
}

export function takeWorkspaceChatBootstrap() {
  const next = pending;
  pending = null;
  return next;
}
