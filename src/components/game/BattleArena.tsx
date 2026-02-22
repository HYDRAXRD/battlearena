import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HydraStats, DamagePopup } from '@/game/types';
import { ENEMIES, ABILITIES, PIXEL_PALETTE, CHARACTER_ART } from '@/game/constants';
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
};

const PixelArt = ({ art, size = 8 }: { art: string[], size?: number }) => {
  if (!art || !art.length) return <div className="text-4xl">👾</div>;
  const cols = art[0]?.length || 1;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gridTemplateRows: `repeat(${art.length}, ${size}px)`,
        imageRendering: 'pixelated',
      }}
    >
      {art.flatMap((row, y) =>
        row.split('').map((char, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: size,
              height: size,
              backgroundColor: PIXEL_PALETTE[char] || 'transparent',
            }}
          />
        ))
      )}
    </div>
  );
};
const BattleArena: React.FC<Props> = ({ hydra, battleIndex, cooldownReduction, onWin, onLose }) => {
  const { playSfx } = useGameAudio();
  const enemy = useMemo(() => ENEMIES[battleIndex] || ENEMIES[ENEMIES.length - 1], [battleIndex]);
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

  useEffect(() => { enemyHpRef.current = enemyHp; }, [enemyHp]);

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
        addLog(`💥 ${enemy.name} PANIC SELL!`);
        playSfx('ability');
      }
      setHydraHp(p => Math.max(0, p - dmg));
      setShakeHydra(true);
      setTimeout(() => setShakeHydra(false), 200);
      addPopup(dmg, 'left');
      addLog(`${enemy.name} hits ${dmg}!`);
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
        if (v > 0) { n[k] = Math.max(0, v - 100); changed = true; }
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

  const hpPct = Math.max(0, (hydraHp / hydra.maxHp) * 100);
  const epPct = Math.max(0, (hydraEnergy / hydra.maxEnergy) * 100);
  const eHpPct = Math.max(0, (enemyHp / enemy.maxHp) * 100);
  const enemyImg = ENEMY_IMAGES[enemy.id];
  const enemyArt = CHARACTER_ART[enemy.id];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-start z-10 gap-2">
        <div className="flex flex-col gap-1 w-5/12">
          <span className="font-pixel text-xs text-game-teal">Hydra</span>
          <div className="h-4 w-full bg-gray-900 border border-game-teal/30 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all" style={{ width: `${hpPct}%` }} />
          </div>
          <span className="font-pixel text-[9px] text-white/60">{Math.max(0, Math.floor(hydraHp))}/{hydra.maxHp} HP</span>
          <div className="h-2 w-3/4 bg-gray-900 border border-blue-500/30 rounded-full overflow-hidden">
            <motion.div className="h-full bg-blue-500" style={{ width: `${epPct}%` }} />
          </div>
        </div>
        <div className="flex flex-col items-center shrink-0">
          <span className="font-pixel text-[9px] text-white/40">BATTLE {battleIndex + 1}/{ENEMIES.length}</span>
          <span className="font-pixel text-xl text-white">VS</span>
        </div>
        <div className="flex flex-col gap-1 w-5/12 items-end">
          <span className="font-pixel text-xs text-game-purple">{enemy.name}</span>
          <div className="h-4 w-full bg-gray-900 border border-game-purple/30 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-l from-orange-500 to-orange-400 ml-auto transition-all" style={{ width: `${eHpPct}%` }} />
          </div>
          <span className="font-pixel text-[9px] text-white/60">{Math.max(0, Math.floor(enemyHp))}/{enemy.maxHp} HP</span>
          <span className="font-pixel text-[7px] text-white/30 italic">{enemy.subtitle}</span>
        </div>
      </div>

      {/* Damage Popups */}
      <div className="absolute inset-0 pointer-events-none z-30">
        <AnimatePresence>
          {popups.map(p => (
            <motion.div key={p.id} initial={{ opacity: 1, y: `${p.y}%`, x: `${p.x}%` }} animate={{ opacity: 0, y: `${p.y - 12}%` }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
              className={`absolute font-pixel text-base font-bold ${ p.isMiss ? 'text-gray-400' : p.isHeal ? 'text-green-400' : 'text-red-400' }`}>
              {p.isMiss ? 'MISS' : p.isHeal ? `+${p.value}` : `-${p.value}`}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Battle Scene */}
      <div className="relative flex-1 w-full flex items-center justify-around">
        <motion.div animate={shakeHydra ? { x: [-8, 8, -4, 4, 0] } : {}} className="z-10">
          <img src={hydraBattle} alt="Hydra" className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_0_20px_rgba(0,200,255,0.3)]" />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <div className="w-32 h-32 rounded-full bg-game-teal blur-3xl" />
        </div>
        <motion.div animate={shakeEnemy ? { x: [8, -8, 4, -4, 0] } : {}} className="z-10">
          {enemyImg ? (
            <img src={enemyImg} alt={enemy.name} className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_0_20px_rgba(255,100,0,0.2)]" />
          ) : enemyArt ? (
            <PixelArt art={enemyArt} size={7} />
          ) : (
            <div className="text-6xl">👾</div>
          )}
        </motion.div>
      </div>

      {/* Battle Log */}
      <div className="hidden md:block absolute left-4 bottom-24 z-20 w-52">
        <div className="bg-black/50 border border-white/10 rounded p-2 backdrop-blur-sm">
          <div className="font-pixel text-[7px] text-white/30 mb-1 uppercase tracking-widest">BATTLE LOG</div>
          {log.slice(-3).map((m, i) => <div key={i} className="font-pixel text-[8px] text-game-teal/80 leading-snug truncate">{m}</div>)}
        </div>
      </div>

      {/* Abilities */}
      <div className="w-full flex justify-center gap-2 md:gap-3 pb-2 z-20">
        {ABILITIES.map((ab, i) => {
          const cd = cooldowns[ab.id] || 0;
          const disabled = cd > 0 || hydraEnergy < ab.energyCost || battleOverRef.current;
          return (
            <button key={ab.id} onClick={() => useAbility(i)} disabled={disabled}
              className={`relative flex flex-col items-center justify-center w-20 h-14 md:w-24 md:h-16 p-1 rounded border-2 transition-all ${ disabled ? 'bg-gray-800/50 border-gray-700 text-gray-600 cursor-not-allowed' : 'bg-black/60 border-game-purple/50 text-white hover:border-game-purple hover:bg-game-purple/10 active:scale-95' }`}
            >
              <span className="text-lg">{ab.icon}</span>
              <span className="font-pixel text-[6px] mt-0.5 leading-tight text-center">{ab.name}</span>
              <span className="absolute -top-2 -right-2 bg-blue-700 text-[7px] font-pixel px-1 rounded border border-blue-500">{ab.energyCost}</span>
              {cd > 0 && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded">
                  <span className="font-pixel text-[10px] text-game-teal">{(cd / 1000).toFixed(1)}s</span>
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
