import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import hydrToken from '@/assets/hydr-token.png';

const HydrToken = ({ size = 14 }: { size?: number }) => (
  <img src={hydrToken} alt="HYDR" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', imageRendering: 'pixelated' }} />
);

interface Score {
  name: string;
  score: number;
  tokens: number;
}

interface Props {
  playerName: string;
  totalScore: number;
  totalTokens: number;
  onBack: () => void;
}

const Leaderboard: React.FC<Props> = ({ playerName, totalScore, totalTokens, onBack }) => {
  const trophies = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Salva o score do jogador ao montar
  useEffect(() => {
    if (playerName && totalScore > 0 && !submitted) {
      setSubmitted(true);
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score: totalScore, tokens: totalTokens }),
      }).catch(() => {});
    }
  }, [playerName, totalScore, totalTokens, submitted]);

  // Busca scores globais
  useEffect(() => {
    setLoading(true);
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then((data: Score[]) => setScores(Array.isArray(data) ? data : []))
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative z-10 min-h-screen flex flex-col px-4 py-6">
      <button onClick={onBack} className="font-pixel text-[10px] text-game-teal hover:text-game-teal/80 self-start mb-6">← BACK</button>
      <h1 className="font-pixel text-lg text-center text-game-purple mb-6">🏆 LEADERBOARD</h1>
      <div className="max-w-md mx-auto w-full">
        {/* Score do jogador atual */}
        {playerName && totalScore > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between py-4 px-4 mb-4 rounded border-2 border-game-teal bg-game-teal/10 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
          >
            <div className="flex items-center gap-3">
              <span className="font-pixel text-lg">⭐</span>
              <div>
                <div className="font-pixel text-[9px] text-game-teal">{playerName}</div>
                <div className="font-pixel text-[6px] text-muted-foreground mt-1">YOUR SCORE</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-pixel text-sm text-yellow-400">{totalScore}</span>
              {totalTokens > 0 && (
                <span className="font-pixel text-[8px] text-yellow-300 flex items-center gap-1">
                  <HydrToken size={10} /> {totalTokens} HYDR
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Scores globais */}
        {loading ? (
          <div className="text-center py-8 font-pixel text-[8px] text-muted-foreground">Loading scores...</div>
        ) : scores.length === 0 ? (
          <div className="text-center py-8 font-pixel text-[8px] text-muted-foreground">No scores yet. Be the first!</div>
        ) : (
          <div className="space-y-2">
            {scores.map((s, i) => (
              <motion.div
                key={`${s.name}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center justify-between py-3 px-4 rounded border ${
                  s.name === playerName ? 'border-game-teal bg-game-teal/10' : 'border-game-purple/30 bg-game-purple/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-pixel text-sm">{trophies[i] || `${i + 1}.`}</span>
                  <span className="font-pixel text-[9px] text-white">{s.name}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-pixel text-[9px] text-yellow-400">{s.score}</span>
                  {s.tokens > 0 && (
                    <span className="font-pixel text-[7px] text-yellow-300 flex items-center gap-1">
                      <HydrToken size={8} /> {s.tokens}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
