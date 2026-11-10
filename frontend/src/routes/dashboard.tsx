// src/routes/dashboard.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/pages/dashboard";
import { requireAuth } from "@/lib/guards";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  component:  Dashboard,
});