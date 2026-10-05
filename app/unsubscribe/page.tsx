"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
function Form() {
  const params = useSearchParams();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="font-serif text-4xl">Your email preferences</h1>
      <p className="my-6">
        Stop gift ideas and offers from Keepsy. You will still receive updates
        about your orders.
      </p>
      {message ? (
        <p role="status">{message}</p>
      ) : (
        <button
          className="rounded-full bg-[#2C4A3E] px-8 py-4 text-white disabled:opacity-50"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await fetch(
                "/api/crm/unsubscribe?token=" +
                  encodeURIComponent(params.get("token") || ""),
                { method: "POST" },
              );
              setMessage(
                r.ok
                  ? "You're unsubscribed from Keepsy marketing emails."
                  : "This link could not be used. Please contact hello@keepsy.store.",
              );
            } catch {
              setMessage("Please try again shortly.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Unsubscribe
        </button>
      )}
    </main>
  );
}
export default function Page() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
