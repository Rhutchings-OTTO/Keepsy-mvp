import { parseShippingAddress } from "@/lib/orders/timeline";
export function PostalAddress({
  value,
}: {
  value: Record<string, unknown> | string | null;
}) {
  const a = parseShippingAddress(value);
  const inner = a?.address;
  const v = (inner && typeof inner === "object" ? inner : a) as Record<
    string,
    unknown
  > | null;
  if (!v) return <p className="text-sm text-black/50">No address recorded.</p>;
  const rows = [
    v.line1 || v.address1,
    v.line2 || v.address2,
    [v.city, v.state, v.postal_code || v.zip].filter(Boolean).join(" "),
    v.country || v.country_code,
  ]
    .filter(Boolean)
    .map(String);
  return (
    <address className="text-sm not-italic leading-7">
      {rows.map((s, i) => (
        <div key={i}>{s}</div>
      ))}
    </address>
  );
}
