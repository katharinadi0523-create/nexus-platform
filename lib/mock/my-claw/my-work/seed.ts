import type { MyWorkProjection } from "./types";
import {
  PROJECT_CLAW_COLLAB_ID,
  PROJECT_KB_ID,
  PROJECT_LUNG_IMMUNO_ID,
  PROJECT_WHEAT_WATER_ID,
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
  runningIssueIds: [
    "issue-coding-export",
    "issue-kb-index",
    "issue-prd-order-export",
  ],
  recentDeliveryIssueIds: [
    "issue-sci-101-inclusion",
    "issue-sci-102-qc",
    "issue-sci-104-report",
    "issue-agri-102-toa5",
    "issue-agri-106-report",
    "issue-kb-done",
  ],
  projectIds: [
    PROJECT_LUNG_IMMUNO_ID,
    PROJECT_WHEAT_WATER_ID,
    PROJECT_CLAW_COLLAB_ID,
    PROJECT_KB_ID,
    PROJECT_RESEARCH_ID,
  ],
  updatedAt: "2026-07-29T17:00:00+08:00",
};
