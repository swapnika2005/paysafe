import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "@/pages/history";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/history")({
  beforeLoad: requireAuth,
  component:  HistoryPage,
});