/**
 * Tiny in-memory stand-in for the subset of the Supabase query builder the
 * app uses (from/select/insert/upsert/update/delete/eq/neq/is/in/gt/gte/lt/
 * lte/ilike/like/not/or/order/limit/range/maybeSingle/single + thenable,
 * plus `select("*", { count: "exact" })`). Enough to assert what rows the
 * routes write. Owned by the coordinator — extend additively only.
 */
type Row = Record<string, unknown>;
type Op =
  | "eq"
  | "neq"
  | "is"
  | "in"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "ilike"
  | "like"
  | "not-in"
  | "not-eq"
  | "not-is";
type Filter = { op: Op; key: string; value: unknown };
type OrGroup = Filter[];

export type FakeSupabase = {
  from: (table: string) => Builder;
  tables: Record<string, Row[]>;
  calls: Array<{
    table: string;
    op: string;
    payload?: unknown;
    filters: Filter[];
  }>;
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string; email?: string } | null };
    }>;
  };
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: null | { message: string } }>;
};

type Result = {
  data: Row[] | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
};

type QueryResult =
  | Result
  | { data: Row | null; error: Result["error"]; count?: number | null };

function likeToRegex(pattern: string, flags: string): RegExp {
  const esc = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/%/g, ".*")
    .replace(/_/g, ".");
  return new RegExp(`^${esc}$`, flags);
}

function matchFilter(row: Row, f: Filter): boolean {
  const v = row[f.key];
  switch (f.op) {
    case "eq":
      return v === f.value;
    case "neq":
      return v !== f.value;
    case "is":
      return (v ?? null) === f.value;
    case "not-is":
      return (v ?? null) !== f.value;
    case "not-eq":
      return v !== f.value;
    case "in":
      return Array.isArray(f.value) && f.value.includes(v);
    case "not-in":
      return !(Array.isArray(f.value) && f.value.includes(v));
    case "gt":
      return (v as number | string) > (f.value as number | string);
    case "gte":
      return (v as number | string) >= (f.value as number | string);
    case "lt":
      return (v as number | string) < (f.value as number | string);
    case "lte":
      return (v as number | string) <= (f.value as number | string);
    case "ilike":
      return typeof v === "string" && likeToRegex(String(f.value), "i").test(v);
    case "like":
      return typeof v === "string" && likeToRegex(String(f.value), "").test(v);
    default:
      return true;
  }
}

/** Parse a PostgREST `or()` expression such as "a.is.null,b.not.in.(x,y),c.eq.1". */
function parseOr(expr: string): OrGroup {
  const out: OrGroup = [];
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of expr) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur) parts.push(cur);
  for (const part of parts) {
    const m = part.match(
      /^([a-zA-Z0-9_]+)\.(not\.)?(eq|neq|is|in|gt|gte|lt|lte|ilike|like)\.(.*)$/,
    );
    if (!m) continue;
    const [, key, not, op, raw] = m;
    let value: unknown = raw;
    if (op === "is" && raw === "null") value = null;
    else if (op === "in")
      value = raw
        .replace(/^\(|\)$/g, "")
        .split(",")
        .map((s) => s.trim().replace(/^"|"$/g, ""));
    else if (/^-?\d+(\.\d+)?$/.test(raw)) value = Number(raw);
    else if (raw === "true") value = true;
    else if (raw === "false") value = false;
    const opKey: Op = not
      ? op === "neq"
        ? "eq"
        : (`not-${op}` as Op)
      : (op as Op);
    out.push({ op: opKey, key, value });
  }
  return out;
}

class Builder implements PromiseLike<QueryResult> {
  private op: "select" | "insert" | "upsert" | "update" | "delete" = "select";
  private payload: unknown = null;
  private filters: Filter[] = [];
  private orGroups: OrGroup[] = [];
  private onConflict: string | null = null;
  private ignoreDuplicates = false;
  private wantSingle: "maybe" | "single" | null = null;
  private limitN: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private orderBy: Array<{ col: string; ascending: boolean }> = [];
  private wantCount = false;
  private headOnly = false;

  constructor(
    private readonly db: FakeSupabase,
    private readonly table: string,
  ) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }
  insert(p: unknown) {
    this.op = "insert";
    this.payload = p;
    return this;
  }
  upsert(
    p: unknown,
    opts?: { onConflict?: string; ignoreDuplicates?: boolean },
  ) {
    this.op = "upsert";
    this.payload = p;
    this.onConflict = opts?.onConflict ?? null;
    this.ignoreDuplicates = Boolean(opts?.ignoreDuplicates);
    return this;
  }
  update(p: unknown) {
    this.op = "update";
    this.payload = p;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(key: string, value: unknown) {
    this.filters.push({ op: "eq", key, value });
    return this;
  }
  neq(key: string, value: unknown) {
    this.filters.push({ op: "neq", key, value });
    return this;
  }
  is(key: string, value: unknown) {
    this.filters.push({ op: "is", key, value });
    return this;
  }
  in(key: string, value: unknown[]) {
    this.filters.push({ op: "in", key, value });
    return this;
  }
  gt(key: string, value: unknown) {
    this.filters.push({ op: "gt", key, value });
    return this;
  }
  gte(key: string, value: unknown) {
    this.filters.push({ op: "gte", key, value });
    return this;
  }
  lt(key: string, value: unknown) {
    this.filters.push({ op: "lt", key, value });
    return this;
  }
  lte(key: string, value: unknown) {
    this.filters.push({ op: "lte", key, value });
    return this;
  }
  ilike(key: string, value: string) {
    this.filters.push({ op: "ilike", key, value });
    return this;
  }
  like(key: string, value: string) {
    this.filters.push({ op: "like", key, value });
    return this;
  }
  not(key: string, op: string, value: unknown) {
    if (op === "is") this.filters.push({ op: "not-is", key, value });
    else if (op === "in")
      this.filters.push({
        op: "not-in",
        key,
        value: Array.isArray(value)
          ? value
          : String(value)
              .replace(/^\(|\)$/g, "")
              .split(","),
      });
    else this.filters.push({ op: "not-eq", key, value });
    return this;
  }
  or(expr: string) {
    this.orGroups.push(parseOr(expr));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy.push({ col, ascending: opts?.ascending ?? true });
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }
  maybeSingle() {
    this.wantSingle = "maybe";
    return this;
  }
  single() {
    this.wantSingle = "single";
    return this;
  }

  private rows(): Row[] {
    return (this.db.tables[this.table] ??= []);
  }
  private matches(row: Row): boolean {
    if (!this.filters.every((f) => matchFilter(row, f))) return false;
    return this.orGroups.every(
      (group) => group.length === 0 || group.some((f) => matchFilter(row, f)),
    );
  }
  private sort(rows: Row[]): Row[] {
    if (this.orderBy.length === 0) return rows;
    return [...rows].sort((a, b) => {
      for (const o of this.orderBy) {
        const av = a[o.col] as number | string | null;
        const bv = b[o.col] as number | string | null;
        if (av === bv) continue;
        if (av == null) return 1;
        if (bv == null) return -1;
        return (av < bv ? -1 : 1) * (o.ascending ? 1 : -1);
      }
      return 0;
    });
  }

  private exec(): Result {
    this.db.calls.push({
      table: this.table,
      op: this.op,
      payload: this.payload,
      filters: this.filters,
    });
    const rows = this.rows();
    if (this.op === "select") {
      let out = this.sort(rows.filter((r) => this.matches(r)));
      const total = out.length;
      if (this.rangeFrom != null)
        out = out.slice(
          this.rangeFrom,
          this.rangeTo != null ? this.rangeTo + 1 : undefined,
        );
      if (this.limitN != null) out = out.slice(0, this.limitN);
      return {
        data: this.headOnly ? [] : out,
        error: null,
        count: this.wantCount ? total : null,
      };
    }
    if (this.op === "insert") {
      const items = (
        Array.isArray(this.payload) ? this.payload : [this.payload]
      ) as Row[];
      // Emulate unique violations on columns that are commonly unique in our schema.
      for (const item of items) {
        for (const uniq of UNIQUE_COLUMNS[this.table] ?? []) {
          if (item[uniq] != null && rows.some((r) => r[uniq] === item[uniq])) {
            return {
              data: null,
              error: {
                message: `duplicate key value violates unique constraint (${uniq})`,
                code: "23505",
              },
            };
          }
        }
      }
      const inserted = items.map((r, i) => ({
        id: r.id ?? `${this.table}-${rows.length + i + 1}`,
        ...r,
      }));
      rows.push(...inserted);
      return { data: inserted, error: null };
    }
    if (this.op === "upsert") {
      const items = (
        Array.isArray(this.payload) ? this.payload : [this.payload]
      ) as Row[];
      const key = this.onConflict ?? "id";
      const out: Row[] = [];
      for (const item of items) {
        const idx = rows.findIndex((r) => r[key] === item[key]);
        if (idx >= 0) {
          if (!this.ignoreDuplicates) rows[idx] = { ...rows[idx], ...item };
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
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    const res = this.exec();
    let value: QueryResult = res;
    if (this.wantSingle) {
      const first = res.data?.[0] ?? null;
      if (this.wantSingle === "single" && !first)
        value = { data: null, error: { message: "Row not found" } };
      else value = { data: first, error: res.error, count: res.count };
    }
    return Promise.resolve(value).then(
      onfulfilled ?? undefined,
      onrejected ?? undefined,
    );
  }
}

/** Columns treated as unique per table so tests can assert 23505 handling. */
const UNIQUE_COLUMNS: Record<string, string[]> = {
  stripe_events: ["stripe_event_id"],
  orders: ["order_ref"],
  discount_codes: ["code"],
  contacts: ["email_canonical"],
  email_queue: ["dedupe_key"],
  email_events: ["provider_event_id"],
  notification_outbox: ["dedupe_key"],
  order_events: ["idempotency_key"],
};

export function createFakeSupabase(
  initial: Record<string, Row[]> = {},
  user: { id: string; email?: string } | null = null,
): FakeSupabase {
  const db: FakeSupabase = {
    tables: { ...initial },
    calls: [],
    from: (table: string) => new Builder(db, table),
    auth: { getUser: async () => ({ data: { user } }) },
    rpc: async () => ({ data: null, error: null }),
  };
  return db;
}
