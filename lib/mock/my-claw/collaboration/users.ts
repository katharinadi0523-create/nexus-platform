import type { CollaborationUser, PersonalSpace } from "./types";
import { CURRENT_USER_ID } from "./types";

export const COLLABORATION_USERS: CollaborationUser[] = [
  {
    id: CURRENT_USER_ID,
    name: "若楠",
    roleLabel: "技术产品经理",
    initials: "RN",
  },
  {
    id: "user-linxiao",
    name: "林晓",
    roleLabel: "产品负责人",
    initials: "LX",
  },
  {
    id: "user-litao",
    name: "李涛",
    roleLabel: "SRE",
    initials: "LT",
  },
  {
    id: "user-zhouning",
    name: "周宁",
    roleLabel: "数据研究员",
    initials: "ZN",
  },
];

export const PERSONAL_SPACE: PersonalSpace = {
  id: "personal",
  kind: "personal",
  name: "个人空间",
  ownerUserId: CURRENT_USER_ID,
};

export function getUserById(userId: string): CollaborationUser | undefined {
  return COLLABORATION_USERS.find((user) => user.id === userId);
}
