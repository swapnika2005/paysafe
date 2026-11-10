import { createFileRoute } from "@tanstack/react-router";
import  AdminDashboard  from "@/pages/admin/dashboard";
import { requireAdmin } from "@/lib/guards";

export const Route = createFileRoute("/admin/dashboard")({
  beforeLoad: requireAdmin,
  component:  AdminDashboard,
});