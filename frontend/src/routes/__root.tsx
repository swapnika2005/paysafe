import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <Outlet />
  ),

  pendingComponent: () => (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading…</p>
      </div>
    </div>
  ),
});