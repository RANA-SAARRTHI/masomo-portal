"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

// Drop-in replacement for <Button type="submit"> inside a <form action={serverAction}>.
// useFormStatus reads the nearest parent form's pending state, so plain
// (non-client-wrapped) server-action forms get a visible pending state too.
export function SubmitButton({
  children,
  pendingText,
  ...props
}: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText ?? "Saving..." : children}
    </Button>
  );
}
