import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/pages/notification";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/notification")({
  beforeLoad: requireAuth,
  component:  NotificationsPage,
});