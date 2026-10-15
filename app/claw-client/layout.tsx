import { MyClawProvider } from "@/components/my-claw/provider";

/**
 * 基础使用端独立于 Project 协作端：只复用个人 Claw 的会话和能力状态，
 * 不挂载项目、事项和团队协作的上下文。
 */
export default function ClawClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <MyClawProvider navigationBasePath="/claw-client">{children}</MyClawProvider>;
}
