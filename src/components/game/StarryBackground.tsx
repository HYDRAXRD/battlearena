import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const StarryBackground: React.FC = () => {
  const stars = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 1, delay: Math.random() * 3, dur: Math.random() * 2 + 1,
    })), []);

  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i, x: Math.random() * 100, delay: Math.random() * 5,
      dur: Math.random() * 8 + 6, sym: ['⛓', '🔗', '💎', '₿', 'Ξ'][i % 5],
    })), []);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0a0a1a' }}>
      {stars.map(s => (
        <motion.div key={s.id} className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }} />
      ))}
      {particles.map(p => (
        <motion.div key={`p-${p.id}`} className="absolute select-none opacity-20"
          style={{ left: `${p.x}%`, fontSize: 14, color: '#8b5cf6' }}
          animate={{ y: ['-10vh', '110vh'] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'linear' }}>
          {p.sym}
        </motion.div>
      ))}
    </div>
  );
};

export default StarryBackground;
