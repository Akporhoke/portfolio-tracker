'use strict';

// Run with: node --test backend/news/news.test.js

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  cleanText,
  cleanUrl,
  extractImage,
  extractDescription,
  classifyCategory,
  normalizeItem,
} = require('./sanitize');

const { createMatcher, TICKER_ALIASES } = require('./tickers');
const { assertSafeUrl } = require('./fetcher');
const { MemoryStore } = require('./stores/memoryStore');
const { NewsService } = require('./service');
const { parseQuery } = require('./routes');

const DAY = 24 * 60 * 60 * 1000;

const matchTickers = createMatcher(TICKER_ALIASES);

const ctx = () => ({
  now: Date.now(),
  retentionMs: 14 * DAY,
  matchTickers,
});

const source = {
  name: 'Pub',
  splitPublisher: false,
};

// --------------------------------------------------
// TEXT AND URL SANITISATION
// --------------------------------------------------

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

test('cleanText decodes common HTML entities', () => {
  assert.equal(
    cleanText('Stocks &amp; shares &nbsp; rise', 100),
    'Stocks & shares rise'
  );
});

test('cleanText limits output length', () => {
  const result = cleanText('A'.repeat(600), 100);

  assert.equal(result.length, 100);
});

// --------------------------------------------------
// PUBLICATION DATES
// --------------------------------------------------

test('future dates are clamped and stale items are dropped', () => {
  const c = ctx();

  const future = normalizeItem(
    {
      title: 'Future dated headline here',
      link: 'https://example.com/f',
      pubDate: new Date(c.now + 5 * DAY).toUTCString(),
    },
    source,
    c
  );

  assert.ok(future.publishedAt <= c.now);

  const old = normalizeItem(
    {
      title: 'Very old headline here',
      link: 'https://example.com/o',
      pubDate: new Date(c.now - 30 * DAY).toUTCString(),
    },
    source,
    c
  );

  assert.equal(old, null);
});

// --------------------------------------------------
// HEADLINE AND PUBLISHER
// --------------------------------------------------

test('google style titles are split into headline and publisher', () => {
  const item = normalizeItem(
    {
      title: 'Zenith Bank posts profit - Some Daily',
      link: 'https://example.com/z',
      pubDate: new Date().toUTCString(),
    },
    {
      name: 'Google News',
      splitPublisher: true,
    },
    ctx()
  );

  assert.equal(item.title, 'Zenith Bank posts profit');
  assert.equal(item.source, 'Some Daily');
  assert.deepEqual(item.tickers, ['ZENITHBANK']);
});

// --------------------------------------------------
// TICKER MATCHING
// --------------------------------------------------

test('ticker matching avoids short-word false positives', () => {
  assert.deepEqual(matchTickers('Tourism in Cuba grows'), []);
  assert.deepEqual(matchTickers('UBA raises capital'), ['UBA']);
  assert.deepEqual(matchTickers('NBA finals tonight'), []);
});

// --------------------------------------------------
// IMAGE EXTRACTION
// --------------------------------------------------

test('extracts images from standard RSS enclosures', () => {
  const image = extractImage({
    enclosure: {
      url: 'https://example.com/images/gtco.jpg',
      type: 'image/jpeg',
    },
  });

  assert.equal(image, 'https://example.com/images/gtco.jpg');
});

test('extracts images from media:content attributes', () => {
  const image = extractImage({
    mediaContent: [
      {
        $: {
          url: 'https://example.com/images/uba.jpg',
          medium: 'image',
        },
      },
    ],
  });

  assert.equal(image, 'https://example.com/images/uba.jpg');
});

test('extracts images from media:thumbnail attributes', () => {
  const image = extractImage({
    mediaThumbnail: [
      {
        $: {
          url: 'https://example.com/images/ngx.jpg',
        },
      },
    ],
  });

  assert.equal(image, 'https://example.com/images/ngx.jpg');
});

test('rejects unsafe RSS image URLs', () => {
  assert.equal(
    extractImage({
      enclosure: {
        url: 'http://example.com/image.jpg',
      },
    }),
    null
  );

  assert.equal(
    extractImage({
      enclosure: {
        url: 'javascript:alert(1)',
      },
    }),
    null
  );

  assert.equal(
    extractImage({
      enclosure: {
        url: 'https://user:password@example.com/image.jpg',
      },
    }),
    null
  );

  assert.equal(
    extractImage({
      enclosure: {
        url: 'data:image/png;base64,AAAA',
      },
    }),
    null
  );
});

test('returns null when an RSS item has no usable image', () => {
  assert.equal(extractImage({}), null);
  assert.equal(extractImage(null), null);
  assert.equal(extractImage('invalid'), null);
});

// --------------------------------------------------
// DESCRIPTION EXTRACTION
// --------------------------------------------------

test('extracts and cleans RSS descriptions', () => {
  const description = extractDescription({
    description: '<p>GTCO reports <strong>strong earnings</strong>.</p>',
  });

  assert.equal(description, 'GTCO reports strong earnings .');
});

test('uses another description field when the first is empty', () => {
  const description = extractDescription({
    contentSnippet: '   ',
    summary: 'UBA announces its latest financial results.',
  });

  assert.equal(
    description,
    'UBA announces its latest financial results.'
  );
});

test('description length is limited', () => {
  const description = extractDescription({
    description: 'A'.repeat(1000),
  });

  assert.equal(description.length, 500);
});

test('description extraction handles malformed values', () => {
  assert.equal(extractDescription(null), '');
  assert.equal(extractDescription('invalid'), '');
  assert.equal(extractDescription({ description: 123 }), '');
});

// --------------------------------------------------
// NEWS CATEGORIES
// --------------------------------------------------

test('classifies dividend announcements', () => {
  assert.equal(
    classifyCategory('GTCO declares interim dividend'),
    'Dividends'
  );
});

test('classifies NGX market news', () => {
  assert.equal(
    classifyCategory('Nigerian Exchange stocks gain'),
    'NGX'
  );
});

test('classifies company financial results', () => {
  assert.equal(
    classifyCategory('Zenith Bank reports quarterly profit'),
    'Companies'
  );
});

test('classifies economic news', () => {
  assert.equal(
    classifyCategory('CBN announces new interest rate'),
    'Economy'
  );
});

test('uses Global for unmatched headlines', () => {
  assert.equal(
    classifyCategory('Technology developments around the world'),
    'Global'
  );
});

// --------------------------------------------------
// NORMALISED NEWS ITEM
// --------------------------------------------------

test('normalised items include image, description and category', () => {
  const item = normalizeItem(
    {
      title: 'GTCO declares interim dividend',
      link: 'https://example.com/gtco',
      pubDate: new Date().toUTCString(),
      description: '<p>GTCO announces an interim dividend.</p>',
      enclosure: {
        url: 'https://example.com/images/gtco.jpg',
      },
    },
    source,
    ctx()
  );

  assert.ok(item);
  assert.equal(item.image, 'https://example.com/images/gtco.jpg');
  assert.equal(
    item.description,
    'GTCO announces an interim dividend.'
  );
  assert.equal(item.category, 'Dividends');
  assert.deepEqual(item.tickers, ['GTCO']);
});

test('headline ticker matching does not use description mentions', () => {
  const item = normalizeItem(
    {
      title: 'Nigerian technology companies expand operations',
      link: 'https://example.com/technology',
      description: 'GTCO and UBA were mentioned in the report.',
      pubDate: new Date().toUTCString(),
    },
    source,
    ctx()
  );

  assert.deepEqual(item.tickers, []);
});

// --------------------------------------------------
// FETCHER SECURITY
// --------------------------------------------------

test('fetcher blocks unsafe urls', () => {
  assert.throws(() =>
    assertSafeUrl('http://news.google.com/rss', 'news.google.com')
  );

  assert.throws(() =>
    assertSafeUrl('https://evil.example/rss', 'news.google.com')
  );

  assert.throws(() =>
    assertSafeUrl(
      'https://news.google.com.evil.example/rss',
      'news.google.com'
    )
  );

  assert.throws(() =>
    assertSafeUrl(
      'https://user:pw@news.google.com/rss',
      'news.google.com'
    )
  );

  assert.throws(() =>
    assertSafeUrl(
      'https://news.google.com:8443/rss',
      'news.google.com'
    )
  );

  assert.doesNotThrow(() =>
    assertSafeUrl(
      'https://www.nairametrics.com/feed/',
      'nairametrics.com'
    )
  );
});

// --------------------------------------------------
// API QUERY VALIDATION
// --------------------------------------------------

test('query validation rejects injection attempts and bad values', () => {
  assert.equal(parseQuery({ tickers: { $ne: 'x' } }), null);
  assert.equal(parseQuery({ tickers: ['GTCO', 'UBA'] }), null);
  assert.equal(parseQuery({ tickers: 'GTCO;drop' }), null);
  assert.equal(parseQuery({ limit: '-5' }), null);
  assert.equal(parseQuery({ before: 'abc' }), null);

  assert.deepEqual(
    parseQuery({
      tickers: 'gtco, uba',
      limit: '500',
    }),
    {
      tickers: ['GTCO', 'UBA'],
      limit: 50,
      before: null,
    }
  );
});

// --------------------------------------------------
// MEMORY STORE
// --------------------------------------------------

const mk = (id, publishedAt, tickers = [], extra = {}) => ({
  id,
  title: 'Headline ' + id,
  url: 'https://example.com/' + id,
  source: 'Pub',
  publishedAt,
  expiresAt: Date.now() + DAY,
  tickers,
  image: null,
  description: '',
  category: 'Global',
  ...extra,
});

test('memory store dedupes, filters, expires and pages without gaps', async () => {
  const store = new MemoryStore();
  const t = Date.now() - 1000;

  await store.upsertMany([
    mk('a', t, ['GTCO']),
    mk('b', t, ['UBA']),
    mk('c', t - 500),
  ]);

  assert.equal(
    await store.upsertMany([mk('a', t)]),
    0
  );

  assert.deepEqual(
    (await store.list({ tickers: ['UBA'] })).map((r) => r.id),
    ['b']
  );

  const page1 = await store.list({ limit: 1 });

  assert.equal(page1[0].id, 'b');

  const page2 = await store.list({
    limit: 1,
    before: {
      publishedAt: page1[0].publishedAt,
      id: page1[0].id,
    },
  });

  assert.equal(page2[0].id, 'a');

  await store.upsertMany([
    {
      ...mk('old', t),
      expiresAt: Date.now() - 1,
    },
  ]);

  assert.equal(
    (await store.list({ limit: 50 })).some((r) => r.id === 'old'),
    false
  );
});

test('memory store returns image, description and category', async () => {
  const store = new MemoryStore();

  await store.upsertMany([
    mk('editorial', Date.now(), ['GTCO'], {
      image: 'https://example.com/gtco.jpg',
      description: 'GTCO announces financial results.',
      category: 'Companies',
    }),
  ]);

  const [item] = await store.list();

  assert.equal(item.image, 'https://example.com/gtco.jpg');

  assert.equal(
    item.description,
    'GTCO announces financial results.'
  );

  assert.equal(item.category, 'Companies');
});

test('memory store does not overwrite existing articles', async () => {
  const store = new MemoryStore();
  const t = Date.now();

  await store.upsertMany([
    mk('same-id', t, ['GTCO'], {
      description: 'Original description',
    }),
  ]);

  await store.upsertMany([
    mk('same-id', t, ['UBA'], {
      description: 'Replacement description',
    }),
  ]);

  const [item] = await store.list();

  assert.deepEqual(item.tickers, ['GTCO']);
  assert.equal(item.description, 'Original description');
});

// --------------------------------------------------
// RSS SERVICE
// --------------------------------------------------

const RSS = () => `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test feed</title>
    <item>
      <title>GTCO declares interim dividend</title>
      <link>https://example.com/a</link>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

const baseConfig = {
  sources: [
    {
      id: 's1',
      name: 'S1',
      domain: 'example.com',
      url: 'https://example.com/feed',
      splitPublisher: false,
    },
  ],
  refreshIntervalMs: 15 * 60 * 1000,
  retentionMs: 14 * DAY,
  fetchTimeoutMs: 1000,
  maxFeedBytes: 1024 * 1024,
  maxItemsPerSource: 50,
  userAgent: 'test',
};

const quiet = {
  info() {},
  warn() {},
  error() {},
};

test('service stores items from a feed and serves them', async () => {
  const service = new NewsService({
    store: new MemoryStore(),
    config: baseConfig,
    matchTickers,
    logger: quiet,
    fetchText: async () => RSS(),
  });

  await service.refresh();

  const data = await service.getNews({ limit: 10 });

  assert.equal(data.items.length, 1);
  assert.deepEqual(data.items[0].tickers, ['GTCO']);
  assert.equal(data.items[0].category, 'Dividends');
  assert.equal(data.stale, false);
});

test('service parses media RSS images and encoded descriptions', async () => {
  const xml = `<?xml version="1.0"?>
  <rss version="2.0"
    xmlns:media="http://search.yahoo.com/mrss/"
    xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
      <title>Test media feed</title>
      <item>
        <title>GTCO reports strong financial results</title>
        <link>https://example.com/gtco</link>
        <pubDate>${new Date().toUTCString()}</pubDate>
        <media:content
          url="https://example.com/images/gtco.jpg"
          medium="image" />
        <content:encoded><![CDATA[
          <p>GTCO reports <strong>strong financial results</strong>.</p>
        ]]></content:encoded>
      </item>
    </channel>
  </rss>`;

  const service = new NewsService({
    store: new MemoryStore(),
    config: baseConfig,
    matchTickers,
    logger: quiet,
    fetchText: async () => xml,
  });

  await service.refresh();

  const data = await service.getNews({ limit: 10 });

  assert.equal(data.items.length, 1);

  assert.equal(
    data.items[0].image,
    'https://example.com/images/gtco.jpg'
  );

  assert.match(
    data.items[0].description,
    /GTCO reports/
  );

  assert.equal(data.items[0].category, 'Companies');
});

test('a failing source backs off instead of being retried every refresh', async () => {
  let calls = 0;

  const service = new NewsService({
    store: new MemoryStore(),
    config: baseConfig,
    matchTickers,
    logger: quiet,
    fetchText: async () => {
      calls += 1;
      throw new Error('boom');
    },
  });

  await service.refresh();
  await service.refresh();

  assert.equal(calls, 1);

  const health = service.getHealth().sources[0];

  assert.equal(health.failures, 1);
  assert.ok(health.nextAttemptAt > Date.now());
});

test('malformed xml is handled without crashing', async () => {
  const service = new NewsService({
    store: new MemoryStore(),
    config: baseConfig,
    matchTickers,
    logger: quiet,
    fetchText: async () => '<rss><not closed',
  });

  await service.refresh();

  assert.equal(service.getHealth().sources[0].failures, 1);
});