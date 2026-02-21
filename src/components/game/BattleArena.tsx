import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HydraStats, DamagePopup } from '@/game/types';
import { ENEMIES, ABILITIES } from '@/game/constants';
import { useGameAudio } from '@/hooks/useGameAudio';
import hydraBattle from '@/assets/hydra-battle.png';
import dogeEnemy from '@/assets/doge-enemy.png';
import pepeEnemy from '@/assets/pepe-enemy.png';

interface Props {
  hydra: HydraStats;
  battleIndex: number;
  cooldownReduction: number;
  onWin: (tokens: number, score: number) => void;
  onLose: () => void;
}

// Map enemy id to custom image (if available)
const ENEMY_IMAGES: Record<string, string> = {
  doge: dogeEnemy,
  pepe: pepeEnemy,
};

const BattleArena: React.FC<Props> = ({ hydra, battleIndex, cooldownReduction, onWin, onLose }) => {
  const { playSfx } = useGameAudio();
  const enemy = ENEMIES[battleIndex];
  const [hydraHp, setHydraHp] = useState(hydra.hp);
  const [hydraEnergy, setHydraEnergy] = useState(hydra.energy);
  const [enemyHp, setEnemyHp] = useState(enemy.maxHp);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const [shakeHydra, setShakeHydra] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [log, setLog] = useState<string[]>(['Battle start!']);
  
  const battleOverRef = useRef(false);
  const enemyHpRef = useRef(enemy.maxHp);
  const popupIdRef = useRef(0);
  
  enemyHpRef.current = enemyHp;

  const addPopup = useCallback((value: number, side: 'left' | 'right', isHeal = false, isMiss = false) => {
    const id = popupIdRef.current++;
    const x = side === 'left' ? 15 + Math.random() * 15 : 65 + Math.random() * 15;
    const y = 25 + Math.random() * 20;
    setPopups(p => [...p, { id, value, x, y, isHeal, isMiss }]);
    setTimeout(() => setPopups(p => p.filter(d => d.id !== id)), 900);
  }, []);

  const addLog = useCallback((msg: string) => setLog(p => [...p.slice(-4), msg]), []);

  // Battle end check
  useEffect(() => {
    if (battleOverRef.current) return;

    if (hydraHp <= 0) {
      battleOverRef.current = true;
      playSfx('lose');
      setTimeout(() => onLose(), 800);
    } else if (enemyHp <= 0) {
      battleOverRef.current = true;
      playSfx('win');
      setTimeout(() => onWin(enemy.tokenReward, enemy.scoreValue), 800);
    }
  }, [hydraHp, enemyHp, onWin, onLose, enemy, playSfx]);

  // Hydra auto-attack
  useEffect(() => {
    const iv = setInterval(() => {
      if (battleOverRef.current) return;
      
      if (Math.random() < enemy.dodgeRate) {
        addPopup(0, 'right', false, true);
        addLog(`${enemy.name} dodged!`);
        return;
      }

      const dmg = Math.max(1, hydra.attack - enemy.defense);
      setEnemyHp(p => Math.max(0, p - dmg));
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 200);
      addPopup(dmg, 'right');
      addLog(`Hydra hits for ${dmg}!`);
      playSfx('hit');
    }, 2000);
    return () => clearInterval(iv);
  }, [enemy, hydra.attack, addPopup, addLog, playSfx]);

  // Enemy auto-attack
  useEffect(() => {
    const iv = setInterval(() => {
      if (battleOverRef.current) return;

      let dmg = enemy.attack;
      if (enemy.specialThreshold && enemy.specialMultiplier && enemyHpRef.current / enemy.maxHp <= enemy.specialThreshold) {
        dmg = Math.floor(dmg * enemy.specialMultiplier);
        addLog(`💥 ${enemy.name} uses PANIC SELL!`);
        playSfx('ability');
      }

      setHydraHp(p => Math.max(0, p - dmg));
      setShakeHydra(true);
      setTimeout(() => setShakeHydra(false), 200);
      addPopup(dmg, 'left');
      addLog(`${enemy.name} hits for ${dmg}!`);
      playSfx('hit');

      if (enemy.healRate) {
        setEnemyHp(p => Math.min(enemy.maxHp, p + enemy.healRate!));
        addPopup(enemy.healRate, 'right', true);
      }
    }, enemy.attackSpeed);
    return () => clearInterval(iv);
  }, [enemy, addPopup, addLog, playSfx]);

  // Energy regen
  useEffect(() => {
    const iv = setInterval(() => {
      if (!battleOverRef.current) setHydraEnergy(p => Math.min(hydra.maxEnergy, p + 5));
    }, 1000);
    return () => clearInterval(iv);
  }, [hydra.maxEnergy]);

  // Cooldown ticker
  useEffect(() => {
    const iv = setInterval(() => setCooldowns(p => {
      const n: Record<string, number> = {};
      for (const [k, v] of Object.entries(p)) {
        if (v > 100) n[k] = v - 100;
      }
      return n;
    }), 100);
    return () => clearInterval(iv);
  }, []);

  const useAbility = (i: number) => {
    if (battleOverRef.current) return;
    const ab = ABILITIES[i];
    if ((cooldowns[ab.id] || 0) > 0 || hydraEnergy < ab.energyCost) return;

    const dmg = Math.max(1, ab.baseDamage + hydra.headPower[ab.headIndex] - enemy.defense);
    const heal = ab.healAmount + (ab.headIndex === 2 ? hydra.headPower[2] : 0);

    setHydraEnergy(p => p - ab.energyCost);
    setEnemyHp(p => Math.max(0, p - dmg));
    setShakeEnemy(true);
    setTimeout(() => setShakeEnemy(false), 300);
    addPopup(dmg, 'right');
    playSfx('ability');

    if (heal > 0) {
      setHydraHp(p => Math.min(hydra.maxHp, p + heal));
      addPopup(heal, 'left', true);
    }

    setCooldowns(p => ({ ...p, [ab.id]: ab.cooldownMs - cooldownReduction * 500 }));
    addLog(`⚡ ${ab.name} for ${dmg}!`);
  };

  const hpPct = (hydraHp / hydra.maxHp) * 100;
  const epPct = (hydraEnergy / hydra.maxEnergy) * 100;
  const eHpPct = (enemyHp / enemy.maxHp) * 100;
  const enemyImg = ENEMY_IMAGES[enemy.id];

  return (
    <div className="flex flex-col h-full bg-background/95 p-4 md:p-6 overflow-hidden relative">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="font-pixel text-[8px] md:text-xs text-game-purple animate-pulse">
          BATTLE {battleIndex + 1}/{ENEMIES.length}
        </div>
        <div className="text-right">
          <div className="font-pixel text-[10px] md:text-sm text-white">vs {enemy.name}</div>
          <div className="font-pixel text-[6px] md:text-[8px] text-gray-400">{enemy.subtitle}</div>
        </div>
      </div>

      {/* Battle area */}
      <div className="flex-1 relative flex items-center justify-center gap-4 md:gap-12 py-8 md:py-12 border-y border-white/5">
        <AnimatePresence>
          {popups.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: p.y, x: p.x + '%' }}
              animate={{ opacity: 1, y: p.y - 40 }}
              exit={{ opacity: 0 }}
              className={`absolute z-50 font-pixel text-xs md:text-lg ${
                p.isMiss ? 'text-gray-400' : p.isHeal ? 'text-green-400' : 'text-red-500'
              } drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]`}
            >
              {p.isMiss ? 'MISS' : p.isHeal ? `+${p.value}` : `-${p.value}`}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Hydra side */}
        <div className="flex-1 flex flex-col items-center gap-3 md:gap-6">
          <div className="w-full max-w-[120px] md:max-w-[200px]">
            <div className="flex justify-between mb-1 font-pixel text-[6px] md:text-[8px]">
              <span className="text-green-400">HYDRA &nbsp;{Math.max(0, hydraHp)}/{hydra.maxHp}</span>
            </div>
            <div className="h-2 md:h-3 bg-gray-900 border border-white/10 rounded-full overflow-hidden p-[1px]">
              <motion.div 
                className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                animate={{ width: `${hpPct}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-1 mb-1 font-pixel text-[6px] md:text-[8px]">
              <span className="text-blue-400">EP {Math.floor(hydraEnergy)}/{hydra.maxEnergy}</span>
            </div>
            <div className="h-1.5 md:h-2 bg-gray-900 border border-white/10 rounded-full overflow-hidden p-[1px]">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                animate={{ width: `${epPct}%` }}
              />
            </div>
          </div>

          <motion.div
            animate={shakeHydra ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <img 
              src={hydraBattle} 
              alt="Hydra" 
              className="w-20 h-20 md:w-48 md:h-48 object-contain drop-shadow-[0_0_20px_rgba(29,111,232,0.2)]"
            />
          </motion.div>
        </div>

        <div className="font-pixel text-xs md:text-2xl text-white/20 italic select-none">VS</div>

        {/* Enemy side */}
        <div className="flex-1 flex flex-col items-center gap-3 md:gap-6">
          <div className="w-full max-w-[120px] md:max-w-[200px]">
            <div className="flex justify-between mb-1 font-pixel text-[6px] md:text-[8px]">
              <span className="text-red-400">{enemy.name.toUpperCase()} &nbsp;{Math.max(0, enemyHp)}/{enemy.maxHp}</span>
            </div>
            <div className="h-2 md:h-3 bg-gray-900 border border-white/10 rounded-full overflow-hidden p-[1px]">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                animate={{ width: `${eHpPct}%` }}
              />
            </div>
          </div>

          <motion.div
            animate={shakeEnemy ? { x: [5, -5, 5, -5, 0] } : {}}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {enemyImg ? (
              <img 
                src={enemyImg} 
                alt={enemy.name} 
                className="w-20 h-20 md:w-48 md:h-48 object-contain drop-shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              />
            ) : (
              <div className="w-20 h-20 md:w-48 md:h-48 flex items-center justify-center font-pixel text-4xl bg-white/5 rounded-xl border border-white/10">
                {enemy.name[0]}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Log */}
      <div className="my-4 h-12 md:h-20 bg-black/40 rounded border border-white/5 p-2 overflow-hidden">
        {log.slice(-3).map((m, i) => (
          <div key={i} className="font-pixel text-[6px] md:text-[8px] text-gray-300 leading-relaxed">
            {m}
          </div>
        ))}
      </div>

      {/* Abilities */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-auto">
        {ABILITIES.map((ab, i) => {
          const cd = cooldowns[ab.id] || 0;
          const disabled = cd > 0 || hydraEnergy < ab.energyCost || battleOverRef.current;
          
          return (
            <button
              key={ab.id}
              onClick={() => useAbility(i)}
              disabled={disabled}
              className={`relative font-pixel text-[6px] md:text-[7px] p-3 rounded border-2 transition-all ${
                disabled 
                  ? 'bg-gray-800/50 border-gray-700 text-gray-600 cursor-not-allowed' 
                  : 'bg-background border-game-purple/50 text-white hover:border-game-purple hover:shadow-[0_0_15px_rgba(29,111,232,0.3)] active:scale-95'
              }`}
            >
              <div className="text-[10px] md:text-sm mb-1">{ab.icon}</div>
              <div className="font-bold truncate mb-1">{ab.name}</div>
              <div className="text-blue-400">{ab.energyCost} EP</div>
              
              {cd > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-sm">
                  <span className="text-white text-[10px] md:text-sm font-bold">
                    {(cd / 1000).toFixed(1)}s
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BattleArena;
