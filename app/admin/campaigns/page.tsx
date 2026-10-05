import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { CampaignComposer } from "@/components/admin/CampaignComposer";
export default async function Page() {
  const db = getSupabaseAdmin();
  const q = db
    ? await db
        .from("email_queue")
        .select(
          "id,template_key,to_email,status,last_error,sent_at,next_attempt_at",
        )
        .order("created_at", { ascending: false })
        .limit(50)
    : null;
  return (
    <>
      <h1 className="font-serif text-4xl">Email studio</h1>
      <p className="my-5 max-w-3xl text-black/60">
        Subscribers receive their welcome code and a getting-started email three
        days later. Every send checks current permission. Past purchases alone
        do not enrol someone in marketing.
      </p>
      <div className="mb-8 rounded-2xl bg-white p-5">
        Automatic sending:{" "}
        <strong>
          {process.env.EMAIL_QUEUE_ENABLED === "true"
            ? "enabled"
            : "paused until configured"}
        </strong>
      </div>
      <CampaignComposer />
      <h2 className="mb-5 mt-12 font-serif text-2xl">
        Recent delivery activity
      </h2>
      {!q || q.error ? (
        <p>Email history is unavailable. Check database setup.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {["Email", "Recipient", "Status", "Details"].map((x) => (
                  <th key={x} className="p-4">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.data.map((e) => (
                <tr key={e.id} className="border-t border-black/5">
                  <td className="p-4">{e.template_key}</td>
                  <td className="p-4">{e.to_email}</td>
                  <td className="p-4">{e.status}</td>
                  <td className="p-4">
                    {e.last_error ||
                      new Date(e.sent_at || e.next_attempt_at).toLocaleString(
                        "en-GB",
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
