"use client";

import type { ProjectMessage } from "@/lib/mock/my-claw/project-conversation";

interface SystemMessageProps {
  message: ProjectMessage;
}

export function SystemMessage({ message }: SystemMessageProps) {
  return (
    <div className="flex justify-center px-4 py-1.5">
      <p className="max-w-[520px] text-center text-[12px] leading-5 text-[#5a6779]/80">
        {message.content}
      </p>
    </div>
  );
}
