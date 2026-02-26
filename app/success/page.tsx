export default function SuccessPage({ searchParams }: { searchParams: { session_id?: string } }) {
  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Payment received ✅</h1>
      <p>Order is now being processed.</p>
      <p style={{ color: "#666" }}>Session: {searchParams.session_id || "—"}</p>
      <p>
        MVP note: next step is fulfilment automation via Stripe webhook → Printful order create.
      </p>
    </main>
  );
}