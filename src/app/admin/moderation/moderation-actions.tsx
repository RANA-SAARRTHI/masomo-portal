"use client";

import { useState, useTransition } from "react";
import { Button, Input } from "@/components/ui";
import { moderateAssessment, publishAssessment, sendBackToTeacher } from "@/lib/actions/admin";

export function ModerateCard({ assessmentId }: { assessmentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleModerate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await moderateAssessment(formData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not moderate this assessment.");
      }
    });
  }

  function handleSendBack(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await sendBackToTeacher(formData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not send this back.");
      }
    });
  }

  return (
    <div className="p-4 sm:p-5 space-y-3">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
      <form action={handleModerate} className="flex flex-wrap gap-2 items-center">
        <input type="hidden" name="assessmentId" value={assessmentId} />
        <Input name="note" placeholder="Moderation note (optional)" className="w-64" />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Working..." : "Approve moderation"}
        </Button>
      </form>
      <form action={handleSendBack} className="flex gap-2 items-center">
        <input type="hidden" name="assessmentId" value={assessmentId} />
        <Input name="reason" placeholder="Reason for sending back (optional)" className="w-64" />
        <Button type="submit" variant="secondary" disabled={isPending}>
          Send back to teacher
        </Button>
      </form>
    </div>
  );
}

export function PublishCard({ assessmentId, canPublish }: { assessmentId: string; canPublish: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePublish(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await publishAssessment(formData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not publish.");
      }
    });
  }

  // Moderation isn't the last word — if the principal disagrees with what
  // was approved (missing scores a moderator missed, a mistake in the
  // moderation note, etc.), there needs to be a way back to the teacher
  // rather than a forced choice between publishing something wrong or
  // leaving the assessment stuck in APPROVED forever.
  function handleSendBack(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await sendBackToTeacher(formData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not send this back.");
      }
    });
  }

  return (
    <div className="p-4 sm:p-5 space-y-3">
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
      {canPublish ? (
        <>
          <form action={handlePublish}>
            <input type="hidden" name="assessmentId" value={assessmentId} />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Publishing..." : "Publish to students & guardians"}
            </Button>
          </form>
          <form action={handleSendBack} className="flex gap-2 items-center">
            <input type="hidden" name="assessmentId" value={assessmentId} />
            <Input name="reason" placeholder="Reason for sending back (optional)" className="w-64" />
            <Button type="submit" variant="secondary" disabled={isPending}>
              Send back to teacher
            </Button>
          </form>
        </>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500">Moderated — waiting for the principal to publish.</p>
      )}
    </div>
  );
}
