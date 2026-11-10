import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/sections/LandingPage";
import { requireGuest } from "@/lib/guards";
  
export const Route = createFileRoute("/")({
   beforeLoad: requireGuest,
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "PaySafe — Simple, secure digital payments" },
      { name: "description", content: "PaySafe makes everyday digital payments simple, with clear transaction details and thoughtful security." },
    ],
  }),
});
