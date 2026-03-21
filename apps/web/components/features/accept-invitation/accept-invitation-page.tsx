"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, CheckCircle, XCircle } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { useInvitation, useAcceptInvitation, useDeclineInvitation } from "@/hooks/use-invitation";
import { Button, buttonVariants } from "@/components/ui/button";
import { isAuthenticated } from "@/lib/auth";

export function AcceptInvitationPage({ token }: { token: string }) {
  const router = useRouter();
  const { data: invite, isLoading: loading, error: queryError } = useInvitation(token);
  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation();

  const error = queryError
    ? (queryError instanceof ApiError ? queryError.message : "Invitation not found")
    : acceptMutation.error
      ? (acceptMutation.error instanceof ApiError ? acceptMutation.error.message : "Failed to accept invitation")
      : declineMutation.error
        ? (declineMutation.error instanceof ApiError ? declineMutation.error.message : "Failed to decline invitation")
        : "";

  const submitting = acceptMutation.isPending || declineMutation.isPending;

  async function handleAccept() {
    if (!isAuthenticated()) {
      router.push(`/login?redirect=/invite/${token}`);
      return;
    }
    acceptMutation.mutate(token);
  }

  async function handleDecline() {
    declineMutation.mutate(token);
  }

  if (loading) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Loading invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-destructive/10 text-destructive mb-4">
            <XCircle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Invalid Invitation</h1>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
            Go to sign in
          </Link>
        </p>
      </>
    );
  }

  if (acceptMutation.isSuccess) {
    return (
      <>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Invitation Accepted</h1>
          <p className="text-sm text-muted-foreground mt-2">
            You&apos;re now a member of {invite?.organizationName}
          </p>
        </div>
        <div className="text-center">
          <Link href="/dashboard" className={buttonVariants()}>Go to Dashboard</Link>
        </div>
      </>
    );
  }

  if (declineMutation.isSuccess) {
    return (
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Invitation Declined</h1>
        <p className="text-sm text-muted-foreground mt-2">You declined the invitation.</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground mb-4">
          <Zap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;re Invited</h1>
        <p className="text-sm text-muted-foreground mt-2">
          You&apos;ve been invited to join <strong>{invite?.organizationName}</strong>
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Organization</span>
            <span className="font-medium">{invite?.organizationName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{invite?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invited by</span>
            <span className="font-medium">{invite?.invitedByName}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button className="flex-1" onClick={handleAccept} disabled={submitting}>
            {submitting ? "Accepting..." : "Accept Invitation"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleDecline} disabled={submitting}>
            Decline
          </Button>
        </div>
      </div>
    </>
  );
}
