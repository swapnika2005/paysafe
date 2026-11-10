import { createFileRoute } from "@tanstack/react-router";
import { WalletPage } from "@/pages/wallet";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/wallet")({
  beforeLoad: requireAuth,
  component:  WalletPage,
});