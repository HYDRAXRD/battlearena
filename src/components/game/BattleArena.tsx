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

const ENEMY_IMAGES: Record<string, string> = {
  doge: dogeEnemy,
  pepe: pepeEnemy,
  hug: 'https://owbfemrwmvvikuvw3suwypr2hsn2noww6q237movtt6hxm65vagq.arweave.net/dYJSMjZlaoVSttypbD46PJumutb0Nb-x1Zz8e7PdqA0',
  wowo: 'https://xbhdiq74yh7ugpmlmm2fp7zu74p3ov4qhzjugpv74z2pvd5p7goq.arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-o-v-Z0',
  shiba: 'https://xbhdiq74yh7ugpmlmm2fp7zu74p3ov4qhzjugpv74z2pvd5p7goq.arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-o-v-Z0',
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

  useEffect(() => {
    const iv = setInterval(() => {
      if (!battleOverRef.current) setHydraEnergy(p => Math.min(hydra.maxEnergy, p + 5));
    }, 1000);
    return () => clearInterval(iv);
  }, [hydra.maxEnergy]);

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

    setCooldowns(p => ({ ...p, [ab.id]: ab.cooldownMs - (cooldownReduction * 500) }));
    addLog(`⚡ ${ab.name} for ${dmg}!`);
  };

  const hpPct = (hydraHp / hydra.maxHp) * 100;
  const epPct = (hydraEnergy / hydra.maxEnergy) * 100;
  const eHpPct = (enemyHp / enemy.maxHp) * 100;

  const enemyImg = ENEMY_IMAGES[enemy.id];

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden border-2 border-game-purple/30">
      <div className="bg-gradient-to-r from-game-purple/20 to-transparent p-4 flex justify-between items-center border-b border-game-purple/30">
        <div>
          <h2 className="font-pixel text-xs text-game-teal mb-1 tracking-wider">BATTLE {battleIndex + 1}/{ENEMIES.length}</h2>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[10px] text-white">vs {enemy.name}</span>
            <span className="font-pixel text-[7px] text-gray-500 uppercase">{enemy.subtitle}</span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-[200px] bg-gradient-to-b from-transparent to-game-purple/10 overflow-hidden">
        <AnimatePresence>
          {popups.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: p.y, x: `${p.x}%` }}
              animate={{ opacity: 0, y: p.y - 40 }}
              className={`absolute font-pixel text-[10px] md:text-sm z-50 pointer-events-none ${
                p.isMiss ? 'text-gray-400' : p.isHeal ? 'text-game-teal' : 'text-red-500'
              }`}
              style={{ textShadow: '2px 2px 0 #000' }}
            >
              {p.isMiss ? 'MISS' : p.isHeal ? `+${p.value}` : `-${p.value}`}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="absolute inset-x-0 top-6 px-4 md:px-12 flex justify-between items-start z-10">
          <div className="w-[45%]">
            <div className="flex justify-between items-end mb-1">
              <span className="font-pixel text-[7px] text-white/70 tracking-tighter">HYDRA</span>
              <span className="font-pixel text-[8px] text-white">{Math.max(0, hydraHp)}/{hydra.maxHp}</span>
            </div>
            <div className="h-3 bg-gray-900 border border-white/20 rounded-sm overflow-hidden p-[1px]">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-sm"
                animate={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          <div className="w-[45%]">
            <div className="flex justify-between items-end mb-1">
              <span className="font-pixel text-[8px] text-white">{Math.max(0, enemyHp)}/{enemy.maxHp}</span>
              <span className="font-pixel text-[7px] text-white/70 text-right uppercase tracking-tighter">{enemy.name}</span>
            </div>
            <div className="h-3 bg-gray-900 border border-white/20 rounded-sm overflow-hidden p-[1px]">
              <motion.div 
                className="h-full bg-gradient-to-l from-game-purple to-purple-400 rounded-sm"
                animate={{ width: `${eHpPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full relative flex items-center justify-around px-8">
            <motion.div
              animate={shakeHydra ? { x: [-5, 5, -5, 5, 0] } : {}}
              className="relative w-32 h-32 md:w-48 md:h-48"
            >
              <img src={hydraBattle} className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(29,111,232,0.4)]" alt="Hydra" />
            </motion.div>

            <div className="font-pixel text-game-teal text-lg md:text-2xl animate-pulse opacity-30 mt-12">VS</div>

            <motion.div
              animate={shakeEnemy ? { x: [5, -5, 5, -5, 0] } : {}}
              className="relative w-32 h-32 md:w-48 md:h-48"
            >
              {enemyImg ? (
                <img src={enemyImg} className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]" alt={enemy.name} />
              ) : (
                <div className="w-full h-full bg-gray-800 rounded animate-pulse" />
              )}
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] md:w-1/2 flex flex-col gap-1.5 z-20">
          {log.slice(-3).map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1 - i * 0.2, x: 0 }}
              className="font-pixel text-[6px] md:text-[8px] text-white/60 bg-black/40 px-2 py-1 rounded border-l-2 border-game-teal/50"
            >
              {m}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-black/60 grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-game-purple/30">
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
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-sm md:text-base leading-none">{ab.icon}</span>
                <span className="uppercase tracking-widest">{ab.name}</span>
                <span className={`text-[5px] ${hydraEnergy < ab.energyCost ? 'text-red-400' : 'text-blue-300'}`}>
                  {ab.energyCost} EP
                </span>
              </div>
              {cd > 0 && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-sm">
                  <span className="text-game-teal animate-pulse">{(cd / 1000).toFixed(1)}s</span>
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
