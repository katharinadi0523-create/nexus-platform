export interface AuthUser {
  username: string;
  password: string;
  displayName: string;
  role?: string;
}

/**
 * Fixed demo accounts. Add entries here to support more users.
 */
export const AUTH_USERS: AuthUser[] = [
  {
    username: "admin",
    password: "diruonan",
    displayName: "管理员",
    role: "admin",
  },
  {
    username: "agentfoundry",
    password: "agentfoundry2026",
    displayName: "Agent Foundry",
    role: "user",
  },
];

export function findAuthUser(
  username: string,
  password: string
): AuthUser | undefined {
  const normalizedUsername = username.trim().toLowerCase();
  return AUTH_USERS.find(
    (user) =>
      user.username.toLowerCase() === normalizedUsername &&
      user.password === password
  );
}

export function findAuthUserByUsername(
  username: string
): AuthUser | undefined {
  const normalizedUsername = username.trim().toLowerCase();
  return AUTH_USERS.find(
    (user) => user.username.toLowerCase() === normalizedUsername
  );
}
