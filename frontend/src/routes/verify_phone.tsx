import { createFileRoute } from '@tanstack/react-router'
import   { VerifyPhonePage } from '@/pages/verify-phone'

export const Route = createFileRoute('/verify_phone')({
  component: VerifyPhonePage,
})


