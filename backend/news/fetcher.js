'use strict';

// Requires Node 18+ (built-in fetch and AbortSignal.timeout).
// This is the only code that talks to the outside world, so it is strict:
// https only, one allowed domain per source, bounded time, bounded size.

function hostAllowed(host, domain) {
  return host === domain || host.endsWith('.' + domain);
}

// Throws unless the URL is safe to request for this source.
function assertSafeUrl(urlString, domain) {
  const u = new URL(urlString); // throws on malformed input
  if (u.protocol !== 'https:') throw new Error('blocked: only https is allowed');
  if (u.username || u.password) throw new Error('blocked: credentials in url');
  if (u.port && u.port !== '443') throw new Error('blocked: unexpected port');
  if (!hostAllowed(u.hostname.toLowerCase(), domain)) {
    throw new Error('blocked: host not allowed');
  }
  return u;
}

// Read the body in chunks and stop as soon as it exceeds the cap, so a hostile
// or broken server cannot make us buffer an unbounded response.
async function readCapped(res, maxBytes) {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error('response too large');
  }
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error('response too large');
    }
    chunks.push(value);
  }
  return new TextDecoder('utf-8').decode(Buffer.concat(chunks));
}

async function fetchFeedText(
  source,
  { timeoutMs, maxBytes, userAgent, maxRedirects = 3, fetchImpl = fetch }
) {
  // One deadline for the whole operation (all redirects and the body read).
  const signal = AbortSignal.timeout(timeoutMs);
  let current = source.url;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const u = assertSafeUrl(current, source.domain);

    // redirect: 'manual' so every hop is re-checked against the allowlist.
    // Automatic redirects are how a trusted host bounces you to an internal one.
    const res = await fetchImpl(u, {
      redirect: 'manual',
      signal,
      headers: {
        'user-agent': userAgent,
        accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8',
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (res.body) await res.body.cancel().catch(() => {});
      if (!location) throw new Error('redirect without location');
      current = new URL(location, u).toString();
      continue;
    }

    if (!res.ok) {
      if (res.body) await res.body.cancel().catch(() => {});
      throw new Error(`HTTP ${res.status}`);
    }

    const type = (res.headers.get('content-type') || '').toLowerCase();
    if (!/(xml|rss|atom)/.test(type)) {
      if (res.body) await res.body.cancel().catch(() => {});
      throw new Error('unexpected content type');
    }

    return readCapped(res, maxBytes);
  }
  throw new Error('too many redirects');
}

module.exports = { fetchFeedText, assertSafeUrl };
