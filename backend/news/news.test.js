'use strict';

// Run with:  node --test backend/news/
const test = require('node:test');
const assert = require('node:assert/strict');

const { cleanUrl, normalizeItem } = require('./sanitize');
const { createMatcher, TICKER_ALIASES } = require('./tickers');
const { assertSafeUrl } = require('./fetcher');
const { MemoryStore } = require('./stores/memoryStore');
const { NewsService } = require('./service');
const { parseQuery } = require('./routes');

const DAY = 24 * 60 * 60 * 1000;
const matchTickers = createMatcher(TICKER_ALIASES);
const ctx = () => ({ now: Date.now(), retentionMs: 14 * DAY, matchTickers });
const source = { name: 'Pub', splitPublisher: false };

test('markup and hidden characters are removed from titles', () => {
  const item = normalizeItem(
    {
      title: '<img src=x onerror=alert(1)>GTCO\u202E dividend declared',
      link: 'https://example.com/a',
      pubDate: new Date().toUTCString(),
    },
    source,
    ctx()
  );
  assert.equal(item.title, 'GTCO dividend declared');
  assert.deepEqual(item.tickers, ['GTCO']);
});

test('only clean https links are accepted', () => {
  assert.equal(cleanUrl('javascript:alert(1)'), null);
  assert.equal(cleanUrl('data:text/html,hi'), null);
  assert.equal(cleanUrl('http://example.com/a'), null);
  assert.equal(cleanUrl('https://user:pw@example.com/a'), null);
  assert.equal(
    cleanUrl('https://example.com/a?utm_source=x&id=1#frag'),
    'https://example.com/a?id=1'
  );
});

test('future dates are clamped and stale items are dropped', () => {
  const c = ctx();
  const future = normalizeItem(
    { title: 'Future dated headline here', link: 'https://example.com/f', pubDate: new Date(c.now + 5 * DAY).toUTCString() },
    source,
    c
  );
  assert.ok(future.publishedAt <= c.now);
  const old = normalizeItem(
    { title: 'Very old headline here', link: 'https://example.com/o', pubDate: new Date(c.now - 30 * DAY).toUTCString() },
    source,
    c
  );
  assert.equal(old, null);
});

test('google style titles are split into headline and publisher', () => {
  const item = normalizeItem(
    { title: 'Zenith Bank posts profit - Some Daily', link: 'https://example.com/z', pubDate: new Date().toUTCString() },
    { name: 'Google News', splitPublisher: true },
    ctx()
  );
  assert.equal(item.title, 'Zenith Bank posts profit');
  assert.equal(item.source, 'Some Daily');
  assert.deepEqual(item.tickers, ['ZENITHBANK']);
});

test('ticker matching avoids short-word false positives', () => {
  assert.deepEqual(matchTickers('Tourism in Cuba grows'), []);
  assert.deepEqual(matchTickers('UBA raises capital'), ['UBA']);
  assert.deepEqual(matchTickers('NBA finals tonight'), []);
});

test('fetcher blocks unsafe urls', () => {
  assert.throws(() => assertSafeUrl('http://news.google.com/rss', 'news.google.com'));
  assert.throws(() => assertSafeUrl('https://evil.example/rss', 'news.google.com'));
  assert.throws(() => assertSafeUrl('https://news.google.com.evil.example/rss', 'news.google.com'));
  assert.throws(() => assertSafeUrl('https://user:pw@news.google.com/rss', 'news.google.com'));
  assert.throws(() => assertSafeUrl('https://news.google.com:8443/rss', 'news.google.com'));
  assert.doesNotThrow(() => assertSafeUrl('https://www.nairametrics.com/feed/', 'nairametrics.com'));
});

test('query validation rejects injection attempts and bad values', () => {
  assert.equal(parseQuery({ tickers: { $ne: 'x' } }), null);
  assert.equal(parseQuery({ tickers: ['GTCO', 'UBA'] }), null);
  assert.equal(parseQuery({ tickers: 'GTCO;drop' }), null);
  assert.equal(parseQuery({ limit: '-5' }), null);
  assert.equal(parseQuery({ before: 'abc' }), null);
  assert.deepEqual(parseQuery({ tickers: 'gtco, uba', limit: '500' }), {
    tickers: ['GTCO', 'UBA'],
    limit: 50,
    before: null,
  });
});

const mk = (id, publishedAt, tickers = []) => ({
  id, title: 'Headline ' + id, url: 'https://example.com/' + id, source: 'Pub',
  publishedAt, expiresAt: Date.now() + DAY, tickers,
});

test('memory store dedupes, filters, expires and pages without gaps', async () => {
  const store = new MemoryStore();
  const t = Date.now() - 1000;
  await store.upsertMany([mk('a', t, ['GTCO']), mk('b', t, ['UBA']), mk('c', t - 500)]);
  assert.equal(await store.upsertMany([mk('a', t)]), 0); // duplicate ignored

  assert.deepEqual((await store.list({ tickers: ['UBA'] })).map((r) => r.id), ['b']);

  const page1 = await store.list({ limit: 1 });
  assert.equal(page1[0].id, 'b'); // same timestamp as a, ordered by id descending
  const page2 = await store.list({ limit: 1, before: { publishedAt: page1[0].publishedAt, id: page1[0].id } });
  assert.equal(page2[0].id, 'a');

  await store.upsertMany([{ ...mk('old', t), expiresAt: Date.now() - 1 }]);
  assert.equal((await store.list({ limit: 50 })).some((r) => r.id === 'old'), false);
});

const RSS = () => `<?xml version="1.0"?><rss version="2.0"><channel><title>t</title>
<item><title>GTCO declares interim dividend</title><link>https://example.com/a</link>
<pubDate>${new Date().toUTCString()}</pubDate></item></channel></rss>`;

const baseConfig = {
  sources: [{ id: 's1', name: 'S1', domain: 'example.com', url: 'https://example.com/feed', splitPublisher: false }],
  refreshIntervalMs: 15 * 60 * 1000,
  retentionMs: 14 * DAY,
  fetchTimeoutMs: 1000,
  maxFeedBytes: 1024 * 1024,
  maxItemsPerSource: 50,
  userAgent: 'test',
};
const quiet = { info() {}, warn() {}, error() {} };

test('service stores items from a feed and serves them', async () => {
  const service = new NewsService({
    store: new MemoryStore(), config: baseConfig, matchTickers, logger: quiet,
    fetchText: async () => RSS(),
  });
  await service.refresh();
  const data = await service.getNews({ limit: 10 });
  assert.equal(data.items.length, 1);
  assert.deepEqual(data.items[0].tickers, ['GTCO']);
  assert.equal(data.stale, false);
});

test('a failing source backs off instead of being retried every refresh', async () => {
  let calls = 0;
  const service = new NewsService({
    store: new MemoryStore(), config: baseConfig, matchTickers, logger: quiet,
    fetchText: async () => { calls += 1; throw new Error('boom'); },
  });
  await service.refresh();
  await service.refresh();
  assert.equal(calls, 1);
  const h = service.getHealth().sources[0];
  assert.equal(h.failures, 1);
  assert.ok(h.nextAttemptAt > Date.now());
});

test('malformed xml is handled without crashing', async () => {
  const service = new NewsService({
    store: new MemoryStore(), config: baseConfig, matchTickers, logger: quiet,
    fetchText: async () => '<rss><not closed',
  });
  await service.refresh();
  assert.equal(service.getHealth().sources[0].failures, 1);
});
