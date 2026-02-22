import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HydraStats, DamagePopup } from '@/game/types';
import { ENEMIES, ABILITIES, PIXEL_PALETTE, CHARACTER_ART } from '@/game/constants';
import { useGameAudio } from '@/hooks/useGameAudio';
import hydraBattle from '@/assets/hydra-battle.png';
import dogeEnemy from '@/assets/doge-enemy.png';
import pepeEnemy from '@/assets/pepe-enemy.png';
import hugEnemy from '@/assets/hug-enemy.PNG';
import wowoEnemy from '@/assets/wowo-enemy.PNG';
import shibaEnemy from '@/assets/shiba-enemy.png';
import bonkEnemy from '@/assets/bonk-enemy.PNG';
import penguEnemy from '@/assets/pengu-enemy.PNG';
import flokiEnemy from '@/assets/early.PNG';
import dogEnemy from '@/assets/dog-enemy.PNG';
import trumpEnemy from '@/assets/trump-enemy.PNG';

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
  hug: hugEnemy,
  wowo: wowoEnemy,
  shiba: shibaEnemy,
  bonk: bonkEnemy,
  pengu: penguEnemy,
  floki: flokiEnemy,
  dog: dogEnemy,
  trump: trumpEnemy,
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
              backgroundColor: PIXEL_PALETTE[char] || 'transparent',
              width: size,
              height: size,
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

  const hpPct = Math.max(0, (hydraHp / hydra.maxHp) * 100);
  const epPct = Math.max(0, (hydraEnergy / hydra.maxEnergy) * 100);
  const eHpPct = Math.max(0, (enemyHp / enemy.maxHp) * 100);
  const enemyImg = ENEMY_IMAGES[enemy.id];
  const enemyArt = CHARACTER_ART[enemy.id];

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto gap-4 p-4 md:p-6 select-none relative z-10">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-[10px] font-pixel text-white px-1">
            <span>Hydra</span>
            <span>{Math.max(0, Math.floor(hydraHp))}/{hydra.maxHp} HP</span>
          </div>
          <div className="h-4 bg-gray-900 border-2 border-white/20 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 via-game-teal to-game-teal"
              initial={{ width: '100%' }}
              animate={{ width: `${hpPct}%` }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            />
          </div>
          <div className="h-2 bg-gray-900 border border-white/10 rounded-full overflow-hidden mt-1">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: '100%' }}
              animate={{ width: `${epPct}%` }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center pt-2">
          <div className="font-pixel text-[12px] text-white/40 mb-1">VS</div>
          <div className="font-pixel text-[8px] px-2 py-1 bg-black/40 rounded border border-white/10 text-game-teal whitespace-nowrap">
            BATTLE {battleIndex + 1}/{ENEMIES.length}
          </div>
        </div>

        <div className="flex-1 space-y-2 text-right">
          <div className="flex justify-between text-[10px] font-pixel text-white px-1 flex-row-reverse">
            <span>{enemy.name}</span>
            <span>{Math.max(0, Math.floor(enemyHp))}/{enemy.maxHp} HP</span>
          </div>
          <div className="h-4 bg-gray-900 border-2 border-white/20 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <motion.div
              className="h-full bg-gradient-to-l from-red-600 to-red-400"
              initial={{ width: '100%' }}
              animate={{ width: `${eHpPct}%` }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            />
          </div>
          <div className="font-pixel text-[7px] text-white/40 mt-1 truncate uppercase tracking-tighter">
            {enemy.subtitle}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {popups.map(p => (
          <DamagePopup key={p.id} popup={p} />
        ))}
      </AnimatePresence>

      <div className="relative h-48 md:h-64 flex items-center justify-between px-4 md:px-12 mt-4">
        <motion.div
          animate={shakeHydra ? { x: [-5, 5, -5, 5, 0] } : {}}
          className="relative z-10"
        >
          <img 
            src={hydraBattle} 
            alt="Hydra" 
            className="w-32 h-32 md:w-48 md:h-48 object-contain" 
          />
        </motion.div>

        <motion.div
          animate={shakeEnemy ? { x: [5, -5, 5, -5, 0] } : {}}
          className="relative z-10"
        >
          {enemyImg ? (
            <img 
              src={enemyImg} 
              alt={enemy.name} 
              className={`w-32 h-32 md:w-48 md:h-48 object-contain ${shakeEnemy ? 'animate-shake' : ''} -scale-x-100`}
            />
          ) : enemyArt ? (
            <div className="-scale-x-100">
              <PixelArt art={enemyArt} size={8} />
            </div>
          ) : (
            <div className="text-5xl">👾</div>
          )}
        </motion.div>
      </div>

      <div className="bg-black/60 border-2 border-game-teal/30 rounded p-2 font-pixel min-h-[60px] relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 bg-game-teal/20 px-1.5 py-0.5 text-[6px] text-game-teal uppercase tracking-widest border-br border-game-teal/30">
          BATTLE LOG
        </div>
        <div className="mt-3 flex flex-col gap-1">
          {log.slice(-3).map((m, i) => (
            <div key={i} className="font-pixel text-[8px] text-game-teal/80 leading-snug truncate">
              {m}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex justify-center gap-2 md:gap-3 pb-2 z-20">
        {ABILITIES.map((ab, i) => {
          const cd = cooldowns[ab.id] || 0;
          const disabled = cd > 0 || hydraEnergy < ab.energyCost || battleOverRef.current;
          return (
            <button
              key={ab.id}
              onClick={() => useAbility(i)}
              disabled={disabled}
              className={`relative flex flex-col items-center justify-center w-20 h-14 md:w-24 md:h-16 p-1 rounded border-2 transition-all ${
                disabled 
                  ? 'bg-gray-800/50 border-gray-700 text-gray-600 cursor-not-allowed' 
                  : 'bg-black/60 border-game-purple/50 text-white hover:border-game-purple hover:bg-game-purple/10 active:scale-95'
              }`}
            >
              <span className="text-sm md:text-lg mb-0.5">{ab.icon}</span>
              <span className="font-pixel text-[7px] md:text-[8px] uppercase">{ab.name}</span>
              <div className="mt-1 flex items-center gap-1 font-pixel text-[6px] md:text-[7px]">
                <span className={hydraEnergy < ab.energyCost ? 'text-red-400' : 'text-blue-400'}>
                  ⚡ {ab.energyCost}
                </span>
              </div>
              
              {cd > 0 && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded">
                  <span className="font-pixel text-[10px] text-white">{(cd / 1000).toFixed(1)}s</span>
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
