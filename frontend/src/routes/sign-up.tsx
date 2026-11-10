import { createFileRoute } from "@tanstack/react-router";
import { SignUpPage } from "@/components/sections/SignUpPage";
import { requireGuest } from "@/lib/guards";

export const Route = createFileRoute("/sign-up")({
  beforeLoad: requireGuest,
  component:  SignUpPage,
});