"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Card, CardHeader } from "@/components/ui";
import { beginEnrollment, confirmEnrollment, disableMfa } from "@/lib/actions/mfa";

export function MfaPanel({ initiallyEnabled }: { initiallyEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [enrollment, setEnrollment] = useState<{ secret: string; uri: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEnrollment() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await beginEnrollment();
      setEnrollment(result);
    });
  }

  function handleConfirm(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await confirmEnrollment(formData);
        setEnabled(true);
        setEnrollment(null);
        setSuccess("Two-factor authentication is now on for your account.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not confirm the code.");
      }
    });
  }

  function handleDisable(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await disableMfa(formData);
        setEnabled(false);
        setSuccess("Two-factor authentication is now off.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not disable MFA.");
      }
    });
  }

  return (
    <Card className="max-w-xl">
      <CardHeader
        title="Two-factor authentication"
        subtitle="Recommended for administrators, principals and bursars. Requires a free authenticator app (Google Authenticator, Authy, etc.)."
      />
      <div className="p-4 sm:p-5 space-y-4">
        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{success}</p>}

        {enabled ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-700 font-medium">Two-factor authentication is ON.</p>
            <form action={handleDisable} className="flex gap-2 items-end">
              <div>
                <Label>Enter a current code to turn it off</Label>
                <Input name="code" inputMode="numeric" placeholder="6-digit code" required />
              </div>
              <Button type="submit" variant="danger" disabled={isPending}>
                Disable
              </Button>
            </form>
          </div>
        ) : enrollment ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Add this account to your authenticator app using the key below, then enter the 6-digit code it shows.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-sm font-mono break-all">{enrollment.secret}</div>
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer">Show setup link (for apps that accept a URI)</summary>
              <p className="break-all mt-1">{enrollment.uri}</p>
            </details>
            <form action={handleConfirm} className="flex gap-2 items-end">
              <div>
                <Label>Code from your app</Label>
                <Input name="code" inputMode="numeric" placeholder="6-digit code" required autoFocus />
              </div>
              <Button type="submit" disabled={isPending}>
                Confirm & enable
              </Button>
            </form>
          </div>
        ) : (
          <Button type="button" onClick={startEnrollment} disabled={isPending}>
            {isPending ? "Setting up..." : "Set up two-factor authentication"}
          </Button>
        )}
      </div>
    </Card>
  );
}
