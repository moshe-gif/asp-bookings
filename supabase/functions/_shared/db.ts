// Reading every row of a query (2026-11-12 audit #2). The API returns at most 1,000 rows per request
// (PostgREST max_rows), so a single `.limit(20000)` silently stops at 1,000 -- and the "already sent"
// list then forgets the newest sends and they go out again. This pages through in a stable order and
// throws on an error instead of returning an empty list (an empty "already sent" list re-sends everything).
// deno-lint-ignore no-explicit-any
type Query = any;
const PAGE = 1000;
// `build` must return a fresh query each call (a builder can only be awaited once); `orderBy` must be unique.
export async function readAllRows<T = Record<string, unknown>>(build: () => Query, orderBy = "id"): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().order(orderBy, { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw new Error(`read failed: ${error.message || error}`);
    out.push(...(data || []));
    if (!data || data.length < PAGE) return out;
  }
}
