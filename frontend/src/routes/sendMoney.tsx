import { createFileRoute } from "@tanstack/react-router";
import { SendMoney } from "@/pages/sendMoney";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/sendMoney")({
  beforeLoad: requireAuth,
  component:  SendMoney,
});