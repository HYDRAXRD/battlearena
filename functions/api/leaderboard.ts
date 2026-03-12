export interface LeaderboardEntry {
  name: string;
  score: number;
  tokens: number;
}

export const onRequestGet: PagesFunction<{ BATTLE_ARENA_KV: KVNamespace }> = async (context) => {
  try {
    const data = await context.env.BATTLE_ARENA_KV.get('leaderboard');
    return new Response(data || '[]', {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response('[]', {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

export const onRequestPost: PagesFunction<{ BATTLE_ARENA_KV: KVNamespace }> = async (context) => {
  try {
    const entry: LeaderboardEntry = await context.request.json();
    if (!entry.name || typeof entry.score !== 'number' || entry.score < 0) {
      return new Response('Invalid data', {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const currentData = await context.env.BATTLE_ARENA_KV.get('leaderboard');
    let leaderboard: LeaderboardEntry[] = JSON.parse(currentData || '[]');

    const existingIndex = leaderboard.findIndex(e => e.name === entry.name);
    if (existingIndex > -1) {
      if (entry.score > leaderboard[existingIndex].score) {
        leaderboard[existingIndex].score = entry.score;
        leaderboard[existingIndex].tokens = entry.tokens ?? 0;
      }
    } else {
      leaderboard.push({ name: entry.name, score: entry.score, tokens: entry.tokens ?? 0 });
    }

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 20);

    await context.env.BATTLE_ARENA_KV.put('leaderboard', JSON.stringify(leaderboard));

    return new Response(JSON.stringify(leaderboard), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response('Internal Server Error', {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
