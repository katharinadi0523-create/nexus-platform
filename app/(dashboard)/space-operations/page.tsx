import { redirect } from "next/navigation";
import { DEFAULT_SPACE_OPERATIONS_SEGMENT, spaceOperationsHref } from "@/lib/space-operations";

export default function SpaceOperationsIndexPage() {
  redirect(spaceOperationsHref(DEFAULT_SPACE_OPERATIONS_SEGMENT));
}
