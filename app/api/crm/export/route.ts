import { requireOwner } from "@/lib/admin/ownerAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+@\-]|^[\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export async function GET() {
  const a = await requireOwner();
  if (!a.ok) return a.response;
  const db = getSupabaseAdmin();
  if (!db) return new Response("Unavailable", { status: 503 });
  const rows: string[] = [
    [
      "Email",
      "First name",
      "Last name",
      "Country",
      "Marketing permission",
      "Orders",
      "Created",
    ]
      .map(csvCell)
      .join(","),
  ];
  for (let offset = 0; offset < 100000; offset += 1000) {
    const { data, error } = await db
      .from("contacts")
      .select(
        "email,first_name,last_name,country,marketing_status,orders_count,created_at",
      )
      .order("id")
      .range(offset, offset + 999);
    if (error) return new Response("Export failed", { status: 503 });
    for (const c of data || [])
      rows.push(
        [
          c.email,
          c.first_name,
          c.last_name,
          c.country,
          c.marketing_status,
          c.orders_count,
          c.created_at,
        ]
          .map(csvCell)
          .join(","),
      );
    if ((data || []).length < 1000) break;
  }
  return new Response("\uFEFF" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": 'attachment; filename="keepsy-contacts.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
