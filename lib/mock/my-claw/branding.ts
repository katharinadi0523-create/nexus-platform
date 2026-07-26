/** Original 会话交互 brand mark (suit lobster). */
export const MY_CLAW_BRAND_ICON_SRC = "/my-claw/claw-brand-icon.png";

export const MY_CLAW_BRAND_NAME = "我的Claw";

export const MY_CLAW_PRODUCT_NAME = "Clawflow";

/** Display name for greetings / footer until platform auth profile is wired. */
export const MY_CLAW_USER_DISPLAY_NAME = "若楠";

export function getMyClawOpeningGreeting(username: string = MY_CLAW_USER_DISPLAY_NAME): string {
  return `你好, ${username}，我是${MY_CLAW_PRODUCT_NAME}，你的个人Agent助手，你想让我做些什么？`;
}
