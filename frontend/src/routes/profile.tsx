import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/pages/profile";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/profile")({
  beforeLoad: requireAuth,
  component:  ProfilePage,
});