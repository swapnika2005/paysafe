import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/settings";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component:  SettingsPage,
});