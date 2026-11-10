import { createFileRoute } from "@tanstack/react-router";
import { FraudLogPage } from "@/pages/fraud";
import { requireAdmin } from "@/lib/guards";

export const Route = createFileRoute("/fraud")({
  beforeLoad: requireAdmin,
  component: FraudLogPage,
});
