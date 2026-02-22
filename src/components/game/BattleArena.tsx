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
  const enemy = ENEMIES[battleIndex] || ENEMIES[ENEMIES.length - 1];
  
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

  useEffect(() => {
    battleOverRef.current = false;
    setHydraHp(hydra.hp);
    setHydraEnergy(hydra.energy);
    setEnemyHp(enemy.maxHp);
    enemyHpRef.current = enemy.maxHp;
    setCooldowns({});
    setLog([`A new challenger appears: ${enemy.name}!`]);
  }, [battleIndex, enemy.maxHp, enemy.name, hydra.hp, hydra.energy]);

  useEffect(() => {
    enemyHpRef.current = enemyHp;
  }, [enemyHp]);

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
      if (enemy.specialThreshold && enemy.specialMultiplier && (enemyHpRef.current / enemy.maxHp) <= enemy.specialThreshold) {
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
      let changed = false;
      for (const [k, v] of Object.entries(p)) {
        if (v > 0) {
          n[k] = Math.max(0, v - 100);
          changed = true;
        }
      }
      return changed ? n : p;
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
    <div className="flex flex-col items-center justify-between h-full w-full max-w-4xl mx-auto p-4 font-pixel text-white bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
      <div className="w-full flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1 w-1/3">
          <div className="text-[10px] text-game-purple uppercase tracking-widest">Hydra</div>
          <div className="h-4 bg-gray-900 rounded-full border border-game-purple/30 overflow-hidden relative">
            <motion.div className="h-full bg-gradient-to-r from-red-500 to-red-400" animate={{ width: `${hpPct}%` }} />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
              {Math.max(0, Math.floor(hydraHp))}/{hydra.maxHp} HP
            </div>
          </div>
          <div className="h-2 bg-gray-900 rounded-full border border-blue-900/30 overflow-hidden relative">
            <motion.div className="h-full bg-blue-500" animate={{ width: `${epPct}%` }} />
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-yellow-500 font-bold mb-1">BATTLE {battleIndex + 1}/{ENEMIES.length}</div>
          <div className="text-[8px] text-white/50 animate-pulse">VS</div>
        </div>
        <div className="flex flex-col gap-1 w-1/3 items-end text-right">
          <div className="text-[10px] text-red-500 uppercase tracking-widest">{enemy.name}</div>
          <div className="h-4 bg-gray-900 rounded-full border border-red-900/30 overflow-hidden relative w-full">
            <motion.div className="h-full bg-gradient-to-l from-red-600 to-orange-500" animate={{ width: `${eHpPct}%` }} />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
              {Math.max(0, Math.floor(enemyHp))}/{enemy.maxHp} HP
            </div>
          </div>
          <div className="text-[7px] text-white/40 italic">{enemy.subtitle}</div>
        </div>
      </div>
      <div className="relative flex-1 w-full flex items-center justify-around py-8 overflow-visible">
        <AnimatePresence>
          {popups.map(p => (
            <motion.div key={p.id} initial={{ opacity: 1, y: 0, scale: 0.5 }} animate={{ opacity: 0, y: -60, scale: 1.5 }}
              className={`absolute z-30 font-pixel text-xs font-bold pointer-events-none ${p.isMiss ? 'text-gray-400' : p.isHeal ? 'text-green-400' : 'text-red-500'}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {p.isMiss ? 'MISS' : p.isHeal ? `+${p.value}` : `-${p.value}`}
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="flex items-center justify-between w-full px-4">
          <motion.div animate={shakeHydra ? { x: [-10, 10, -10, 10, 0] } : {}} className="relative z-10 drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <img src={hydraBattle} alt="Hydra" className="w-40 md:w-56 h-auto pixelated" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/40 blur-md rounded-full -z-10" />
          </motion.div>
          <div className="text-2xl font-bold text-white/10 select-none">VS</div>
          <motion.div animate={shakeEnemy ? { x: [10, -10, 10, -10, 0] } : {}} className="relative z-10 drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            {enemyImg ? <img src={enemyImg} alt={enemy.name} className="w-32 md:w-48 h-auto pixelated" /> : <div className="text-6xl">👾</div>}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/40 blur-md rounded-full -z-10" />
          </motion.div>
        </div>
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="md:col-span-1 bg-black/40 p-2 rounded border border-white/5 h-20 flex flex-col justify-end overflow-hidden">
          {log.slice(-3).map((m, i) => <div key={i} className={`text-[7px] leading-relaxed ${i === 2 ? 'text-white' : 'text-white/40'}`}>{m}</div>)}
        </div>
        <div className="md:col-span-2 flex justify-center gap-2">
          {ABILITIES.map((ab, i) => {
            const cd = cooldowns[ab.id] || 0;
            const disabled = cd > 0 || hydraEnergy < ab.energyCost || battleOverRef.current;
            return (
              <button key={ab.id} onClick={() => useAbility(i)} disabled={disabled}
                className={`relative group flex flex-col items-center justify-center w-24 h-16 p-1 rounded border-2 transition-all ${disabled ? 'bg-gray-800/50 border-gray-700 text-gray-600 cursor-not-allowed' : 'bg-background border-game-purple/50 text-white hover:border-game-purple hover:bg-game-purple/10 active:scale-95 shadow-lg'}`}
              >
                <span className="text-sm mb-1">{ab.icon}</span>
                <span className="text-[7px] uppercase font-bold text-center leading-none">{ab.name}</span>
                <div className="mt-1 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /><span className="text-[8px] font-bold text-blue-400">{ab.energyCost}</span></div>
                {cd > 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded"><span className="text-[10px] font-bold text-yellow-400">{(cd / 1000).toFixed(1)}s</span></div>}
                {!disabled && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BattleArena;
