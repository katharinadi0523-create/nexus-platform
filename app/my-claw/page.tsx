import { redirect } from "next/navigation";

/** Everyday entry is the basic client. Project collaboration stays on /my-claw/chat. */
export default function MyClawHomePage() {
  redirect("/claw-client");
}
