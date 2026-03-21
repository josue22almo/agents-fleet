"use client";

import { use } from "react";
import { AcceptInvitationPage } from "@/components/features/accept-invitation/accept-invitation-page";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <AcceptInvitationPage token={token} />;
}
