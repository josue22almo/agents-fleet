"use client";

import { use } from "react";
import { AgentDetailPage } from "@/components/features/agent-detail/agent-detail-page";

export default function AgentDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AgentDetailPage id={id} />;
}
