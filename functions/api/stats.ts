const TREASURY = 'account_rdx129sv0vcuj4zvspeu8ql4z6wm6zp3xs86a46388aw64xevvfyhnsx4e';
const GATEWAY_URL = 'https://mainnet.radixdlt.com/stream/transactions';
const CACHE_KEY = 'stats_tx_cache';
const CACHE_TTL_MS = 60_000; // 60 seconds

interface StatsCache {
  count: number;
  ts: number;
}

interface GatewayStreamResponse {
  items?: unknown[];
  next_cursor?: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const onRequestGet: PagesFunction<{ BATTLE_ARENA_KV: KVNamespace }> = async (context) => {
  try {
    // Serve from KV cache if still fresh
    const cached = await context.env.BATTLE_ARENA_KV.get(CACHE_KEY);
    if (cached) {
      const parsed: StatsCache = JSON.parse(cached);
      if (Date.now() - parsed.ts < CACHE_TTL_MS) {
        return new Response(
          JSON.stringify({ total_transactions: parsed.count }),
          { headers: CORS_HEADERS }
        );
      }
    }

    // Query Radix Gateway — paginate until no next_cursor to count all txs
    let count = 0;
    let cursor: string | undefined = undefined;

    do {
      const body: Record<string, unknown> = {
        manifest_accounts_deposited_into_filter: [TREASURY],
        limit_per_page: 100,
      };
      if (cursor) body['cursor'] = cursor;

      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Gateway responded with ${response.status}`);
      }

      const data: GatewayStreamResponse = await response.json();
      count += data.items?.length ?? 0;
      cursor = data.next_cursor;
    } while (cursor);

    // Persist result in KV cache
    const cachePayload: StatsCache = { count, ts: Date.now() };
    await context.env.BATTLE_ARENA_KV.put(CACHE_KEY, JSON.stringify(cachePayload));

    return new Response(
      JSON.stringify({ total_transactions: count }),
      { headers: CORS_HEADERS }
    );
  } catch {
    return new Response(
      JSON.stringify({ total_transactions: 0 }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
