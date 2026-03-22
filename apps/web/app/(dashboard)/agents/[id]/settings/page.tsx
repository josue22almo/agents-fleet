"use client";

import { use } from "react";
import { AgentSettingsPage } from "@/components/features/agent-settings/agent-settings-page";

export default function AgentSettingsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AgentSettingsPage id={id} />;
}
