import { createFileRoute } from "@tanstack/react-router";
import { SignInPage } from "@/components/sections/SignInPage";
import { requireGuest } from "@/lib/guards";

export const Route = createFileRoute("/sign-in")({
  beforeLoad: requireGuest,
  component:  SignInPage,
});