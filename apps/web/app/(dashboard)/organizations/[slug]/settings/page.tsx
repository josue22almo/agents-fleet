"use client";

import { use } from "react";
import { OrgSettingsPage } from "@/components/features/org-settings/org-settings-page";

export default function OrgSettingsRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <OrgSettingsPage slug={slug} />;
}
