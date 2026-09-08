/**
 * Tiny in-memory stand-in for the subset of the Supabase query builder the
 * app uses (from/select/insert/upsert/update/delete/eq/neq/order/limit/
 * maybeSingle/single + thenable). Enough to assert what rows the routes write.
 */
type Row = Record<string, unknown>;
type Filter = { op: "eq" | "neq" | "is"; key: string; value: unknown };

export type FakeSupabase = {
  from: (table: string) => Builder;
  tables: Record<string, Row[]>;
  calls: Array<{ table: string; op: string; payload?: unknown; filters: Filter[] }>;
  auth: { getUser: () => Promise<{ data: { user: { id: string; email?: string } | null } }> };
};

type Result = { data: Row[] | null; error: { message: string; code?: string } | null };

type QueryResult = Result | { data: Row | null; error: Result["error"] };

class Builder implements PromiseLike<QueryResult> {
  private op: "select" | "insert" | "upsert" | "update" | "delete" = "select";
  private payload: unknown = null;
  private filters: Filter[] = [];
  private onConflict: string | null = null;
  private wantSingle: "maybe" | "single" | null = null;
  private limitN: number | null = null;
  private claimFilter = false;

  constructor(private readonly db: FakeSupabase, private readonly table: string) {}

  select(_cols?: string) {
    if (this.op === "select") this.op = "select";
    return this;
  }
  insert(p: unknown) { this.op = "insert"; this.payload = p; return this; }
  upsert(p: unknown, opts?: { onConflict?: string }) { this.op = "upsert"; this.payload = p; this.onConflict = opts?.onConflict ?? null; return this; }
  update(p: unknown) { this.op = "update"; this.payload = p; return this; }
  delete() { this.op = "delete"; return this; }
  eq(key: string, value: unknown) { this.filters.push({ op: "eq", key, value }); return this; }
  neq(key: string, value: unknown) { this.filters.push({ op: "neq", key, value }); return this; }
  is(key: string, value: unknown) { this.filters.push({ op: "is", key, value }); return this; }
  or(expr: string) { if (expr === "printify_status.is.null,printify_status.not.in.(fulfilling,submit_uncertain)") this.claimFilter = true; return this; }
  order(_col: string, _opts?: unknown) { return this; }
  limit(n: number) { this.limitN = n; return this; }
  maybeSingle() { this.wantSingle = "maybe"; return this; }
  single() { this.wantSingle = "single"; return this; }

  private rows(): Row[] {
    return (this.db.tables[this.table] ??= []);
  }
  private matches(row: Row): boolean {
    return (!this.claimFilter || !["fulfilling", "submit_uncertain"].includes(String(row.printify_status))) && this.filters.every((f) => (f.op === "is" ? (row[f.key] ?? null) === f.value : f.op === "eq" ? row[f.key] === f.value : row[f.key] !== f.value));
  }

  private exec(): Result {
    this.db.calls.push({ table: this.table, op: this.op, payload: this.payload, filters: this.filters });
    const rows = this.rows();
    if (this.op === "select") {
      let out = rows.filter((r) => this.matches(r));
      if (this.limitN != null) out = out.slice(0, this.limitN);
      return { data: out, error: null };
    }
    if (this.op === "insert") {
      const items = (Array.isArray(this.payload) ? this.payload : [this.payload]) as Row[];
      const inserted = items.map((r, i) => ({ id: r.id ?? `${this.table}-${rows.length + i + 1}`, ...r }));
      rows.push(...inserted);
      return { data: inserted, error: null };
    }
    if (this.op === "upsert") {
      const items = (Array.isArray(this.payload) ? this.payload : [this.payload]) as Row[];
      const key = this.onConflict ?? "id";
      const out: Row[] = [];
      for (const item of items) {
        const idx = rows.findIndex((r) => r[key] === item[key]);
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...item };
          out.push(rows[idx]);
        } else {
          const created = { id: `${this.table}-${rows.length + 1}`, ...item };
          rows.push(created);
          out.push(created);
        }
      }
      return { data: out, error: null };
    }
    if (this.op === "update") {
      const out: Row[] = [];
      rows.forEach((r, i) => {
        if (this.matches(r)) {
          rows[i] = { ...r, ...(this.payload as Row) };
          out.push(rows[i]);
        }
      });
      return { data: out, error: null };
    }
    if (this.op === "delete") {
      const keep = rows.filter((r) => !this.matches(r));
      const removed = rows.length - keep.length;
      this.db.tables[this.table] = keep;
      return { data: new Array(removed).fill({}), error: null };
    }
    return { data: null, error: { message: "unsupported" } };
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: Result | { data: Row | null; error: Result["error"] }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    const res = this.exec();
    let value: Result | { data: Row | null; error: Result["error"] } = res;
    if (this.wantSingle) {
      const first = res.data?.[0] ?? null;
      if (this.wantSingle === "single" && !first) value = { data: null, error: { message: "Row not found" } };
      else value = { data: first, error: res.error };
    }
    return Promise.resolve(value).then(onfulfilled ?? undefined, onrejected ?? undefined);
  }
}

export function createFakeSupabase(initial: Record<string, Row[]> = {}, user: { id: string; email?: string } | null = null): FakeSupabase {
  const db: FakeSupabase = {
    tables: { ...initial },
    calls: [],
    from: (table: string) => new Builder(db, table),
    auth: { getUser: async () => ({ data: { user } }) },
  };
  return db;
}
