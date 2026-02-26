export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-black">Terms of Service</h1>
      <p className="mt-3 text-black/70">By placing an order you confirm that you have rights to the uploaded images and content used in the design.</p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-black/70">
        <li>Do not upload illegal, unsafe, or copyrighted material without permission.</li>
        <li>Keepsy may refuse requests that violate policy.</li>
        <li>Payment processing is handled securely by Stripe.</li>
      </ul>
    </section>
  );
}
