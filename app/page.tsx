import { redirect } from "next/navigation";

export default function Home() {
  // 访问根域名时，直接跳转到“智能体列表页”
  redirect("/agent");
}