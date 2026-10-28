import { expect, test } from 'bun:test';
import { asSources, exaSearch } from '../src/exa.ts';

// The request Exa expects, and the sources the model reads, without the network.
test('web_search asks Exa with the key and reads back citable sources', async () => {
  let sent: { url: string; init: RequestInit } | undefined;
  const fake = (async (url: string, init: RequestInit) => {
    sent = { url, init };
    return new Response(JSON.stringify({ results: [
      { title: 'Retry budgets', url: 'https://example.com/retry-budgets', publishedDate: '2026-03-02T00:00:00.000Z', highlights: ['Cap retries at 10% of requests.'] },
      { title: null, url: 'https://example.com/untitled', highlights: [] },
    ] }), { status: 200 });
  }) as unknown as typeof fetch;
  const found = await exaSearch('retry budget', 50, 'k-test', fake);
  if (!sent) throw new Error('nothing was sent');
  expect(sent.url).toBe('https://api.exa.ai/search');
  expect((sent.init.headers as Record<string, string>)['x-api-key']).toBe('k-test');
  expect(JSON.parse(sent.init.body as string)).toMatchObject({ query: 'retry budget', type: 'auto', numResults: 8 });
  expect(asSources(found)).toBe('1. Retry budgets (2026-03-02)\n   https://example.com/retry-budgets\n   > Cap retries at 10% of requests.\n\n2. https://example.com/untitled\n   https://example.com/untitled');
});

test('a refused search says why', async () => {
  const fake = (async () => new Response('bad key', { status: 401 })) as unknown as typeof fetch;
  await expect(exaSearch('x', 3, 'nope', fake)).rejects.toThrow('Exa answered 401: bad key');
});
