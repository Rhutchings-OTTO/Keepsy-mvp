import { ImportContacts } from "@/components/admin/ImportContacts";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page = "1" } = await searchParams;
  const offset = (Math.max(1, Math.min(10000, Number(page) || 1)) - 1) * 50;
  const db = getSupabaseAdmin();
  let query = db
    ?.from("contacts")
    .select(
      "id,email,first_name,last_name,country,marketing_status,orders_count,created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + 49);
  if (query && q)
    query = query.ilike(
      "email",
      "%" + q.slice(0, 100).replace(/[\\%_]/g, "\\$&") + "%",
    );
  const result = query ? await query : null;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-5">
        <h1 className="font-serif text-4xl">Your contacts</h1>
        <Link
          className="rounded-full border border-black/15 px-5 py-3 text-sm"
          href="/api/crm/export"
        >
          Download contacts CSV
        </Link>
      </div>
      <p className="my-5 max-w-3xl text-black/60">
        Signups and customers are collected here automatically. Marketing
        permission is recorded separately from purchases. Addresses stay linked
        to their orders.
      </p>
      <ImportContacts />
      <form className="my-7 flex gap-3">
        <input
          name="q"
          defaultValue={q}
          aria-label="Search contacts by email"
          placeholder="Search by email"
          className="min-w-0 flex-1 rounded-full border border-black/15 bg-white px-5 py-3"
        />
        <button className="rounded-full bg-[#2C4A3E] px-6 text-white">
          Search
        </button>
      </form>
      {!result || result.error ? (
        <p>Contacts are unavailable. Check database setup.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-3xl border border-black/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {["Contact", "Country", "Email permission", "Orders"].map(
                    (h) => (
                      <th key={h} className="p-5">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {result.data.map((c) => (
                  <tr className="border-t border-black/5" key={c.id}>
                    <td className="p-5">
                      <Link href={"/admin/crm/" + c.id} className="underline">
                        {c.email}
                      </Link>
                      <p className="mt-1 text-black/50">
                        {[c.first_name, c.last_name].filter(Boolean).join(" ")}
                      </p>
                    </td>
                    <td className="p-5">{c.country || "—"}</td>
                    <td className="p-5">
                      {c.marketing_status.replace(/_/g, " ")}
                    </td>
                    <td className="p-5">{c.orders_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!result.data.length && (
              <p className="p-8">No matching contacts.</p>
            )}
          </div>
          <div className="mt-6 flex justify-between text-sm">
            <span>{result.count || 0} contacts</span>
            <div className="flex gap-5">
              {offset > 0 && (
                <Link
                  href={"?page=" + offset / 50 + "&q=" + encodeURIComponent(q)}
                >
                  Previous
                </Link>
              )}
              {offset + 50 < (result.count || 0) && (
                <Link
                  href={
                    "?page=" + (offset / 50 + 2) + "&q=" + encodeURIComponent(q)
                  }
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
