// Reading one page in full, through Firecrawl's scrape API (firecrawl.dev): the main content as Markdown, so the agent
// can read a source web_search found, or a link someone pasted. Needs FIRECRAWL_API_KEY (`just secret put
// FIRECRAWL_API_KEY`); without it the tool is not offered.
export type Page = { title: string; url: string; markdown: string };

export async function firecrawlRead(url: string, key: string, fetcher: typeof fetch = fetch, maxChars = 12_000): Promise<Page> {
  const r = await fetcher("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, timeout: 30_000 }),
    signal: AbortSignal.timeout(40_000),
  });
  if (!r.ok) throw new Error(`Firecrawl answered ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`);
  const body = (await r.json()) as { success?: boolean; data?: { markdown?: string; metadata?: { title?: string | string[]; url?: string; sourceURL?: string } } };
  if (!body.success || !body.data) throw new Error("Firecrawl could not read the page");
  const title = Array.isArray(body.data.metadata?.title) ? body.data.metadata.title[0] : body.data.metadata?.title;
  const markdown = body.data.markdown ?? "";
  return { title: title ?? url, url: body.data.metadata?.url ?? body.data.metadata?.sourceURL ?? url, markdown: markdown.length > maxChars ? `${markdown.slice(0, maxChars)}\n\n(cut at ${maxChars} characters)` : markdown };
}

export const asPage = (p: Page) => `${p.title}\n${p.url}\n\n${p.markdown}`;
