import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/features/reset-password/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
