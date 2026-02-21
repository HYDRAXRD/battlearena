export interface LeaderboardEntry {
  name: string;
  score: number;
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
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPost: PagesFunction<{ BATTLE_ARENA_KV: KVNamespace }> = async (context) => {
  try {
    const entry: LeaderboardEntry = await context.request.json();
    if (!entry.name || typeof entry.score !== 'number') {
      return new Response('Invalid data', { status: 400 });
    }

    const currentData = await context.env.BATTLE_ARENA_KV.get('leaderboard');
    let leaderboard: LeaderboardEntry[] = JSON.parse(currentData || '[]');

    const existingIndex = leaderboard.findIndex(e => e.name === entry.name);
    if (existingIndex > -1) {
      if (entry.score > leaderboard[existingIndex].score) {
        leaderboard[existingIndex].score = entry.score;
      }
    } else {
      leaderboard.push(entry);
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
    return new Response(String(e), { status: 500 });
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
