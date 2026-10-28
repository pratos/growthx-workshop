import { expect, test } from 'bun:test';
import { asPage, firecrawlRead } from '../src/firecrawl.ts';

// The request Firecrawl expects, and the page the model reads, without the network.
test('read_page asks Firecrawl with the key and reads back the page as Markdown', async () => {
  let sent: { url: string; init: RequestInit } | undefined;
  const fake = (async (url: string, init: RequestInit) => {
    sent = { url, init };
    return new Response(JSON.stringify({ success: true, data: { markdown: '# Retry budgets\n\nCap retries at 10%.', metadata: { title: 'Retry budgets', url: 'https://example.com/rb', sourceURL: 'https://example.com/rb' } } }), { status: 200 });
  }) as unknown as typeof fetch;
  const page = await firecrawlRead('https://example.com/rb', 'fc-test', fake);
  if (!sent) throw new Error('nothing was sent');
  expect(sent.url).toBe('https://api.firecrawl.dev/v2/scrape');
  expect((sent.init.headers as Record<string, string>).authorization).toBe('Bearer fc-test');
  expect(JSON.parse(sent.init.body as string)).toMatchObject({ url: 'https://example.com/rb', formats: ['markdown'], onlyMainContent: true });
  expect(asPage(page)).toBe('Retry budgets\nhttps://example.com/rb\n\n# Retry budgets\n\nCap retries at 10%.');
});

test('a long page is cut, and a refusal says why', async () => {
  const long = (async () => new Response(JSON.stringify({ success: true, data: { markdown: 'x'.repeat(50), metadata: {} } }))) as unknown as typeof fetch;
  expect((await firecrawlRead('https://e.com', 'k', long, 10)).markdown).toBe('xxxxxxxxxx\n\n(cut at 10 characters)');
  const refused = (async () => new Response('payment required', { status: 402 })) as unknown as typeof fetch;
  await expect(firecrawlRead('https://e.com', 'k', refused)).rejects.toThrow('Firecrawl answered 402: payment required');
});
