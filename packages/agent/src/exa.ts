// Web research for the agent, through Exa's search API (exa.ai). The agent gets titles, URLs, dates and the passages
// that match, so it can cite what it found. Needs EXA_API_KEY (`just secret put EXA_API_KEY`); without it the tool is
// not offered at all.
export type Found = { title: string; url: string; publishedDate?: string; highlights: string[] };

export async function exaSearch(query: string, numResults: number, key: string, fetcher: typeof fetch = fetch): Promise<Found[]> {
  const r = await fetcher("https://api.exa.ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key },
    body: JSON.stringify({ query, type: "auto", numResults: Math.min(Math.max(Math.round(numResults), 1), 8), contents: { highlights: { maxCharacters: 600 } } }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new Error(`Exa answered ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`);
  const body = (await r.json()) as { results?: { title?: string | null; url: string; publishedDate?: string | null; highlights?: string[] }[] };
  return (body.results ?? []).map((x) => ({ title: x.title ?? x.url, url: x.url, ...(x.publishedDate ? { publishedDate: x.publishedDate.slice(0, 10) } : {}), highlights: x.highlights ?? [] }));
}

// What the model reads: numbered sources it can cite by URL.
export const asSources = (found: Found[]) =>
  found.length === 0 ? "No results." :
  found.map((f, i) => `${i + 1}. ${f.title}${f.publishedDate ? ` (${f.publishedDate})` : ""}\n   ${f.url}${f.highlights.map((h) => `\n   > ${h.replace(/\s+/g, " ").trim()}`).join("")}`).join("\n\n");
