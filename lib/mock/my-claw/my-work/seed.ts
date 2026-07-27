import type { MyWorkProjection } from "./types";
import {
  PROJECT_CLAW_COLLAB_ID,
  PROJECT_KB_ID,
  PROJECT_RESEARCH_ID,
} from "@/lib/mock/my-claw/project-conversation/projects";
import { CURRENT_USER_ID } from "@/lib/mock/my-claw/project-conversation/workspaces";

export const SEED_MY_WORK: MyWorkProjection = {
  userId: CURRENT_USER_ID,
  attentionIssueIds: [
    "issue-review-collab",
    "issue-wait-auth",
    "issue-test-failed",
    "issue-research-survey",
  ],
  runningIssueIds: ["issue-coding-export", "issue-kb-index", "issue-prd-order-export"],
  recentDeliveryIssueIds: ["issue-kb-done", "issue-review-collab"],
  projectIds: [PROJECT_CLAW_COLLAB_ID, PROJECT_KB_ID, PROJECT_RESEARCH_ID],
  updatedAt: "2026-07-27T16:40:00+08:00",
};
