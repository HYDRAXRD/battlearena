import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HydraStats, DamagePopup } from '@/game/types';
import { ENEMIES, ABILITIES, PIXEL_PALETTE, CHARACTER_ART } from '@/game/constants';
import { useGameAudio } from '@/hooks/useGameAudio';
import hydraBattle from '@/assets/hydra-battle.png';
import dogeEnemy from '@/assets/doge-enemy.png';
import pepeEnemy from '@/assets/pepe-enemy.png';
import hugEnemy from '@/assets/hug-enemy.png';
import wowoEnemy from '@/assets/wowo-enemy.png';
import shibaEnemy from '@/assets/shiba-enemy.png';
import bonkEnemy from '@/assets/bonk-enemy.png';
import penguEnemy from '@/assets/pengu-enemy.png';
import flokiEnemy from '@/assets/floki-enemy.png';
import dogEnemy from '@/assets/dog-enemy.png';
import trumpEnemy from '@/assets/trump-enemy.png';

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
  if (!art || !art.length) return <div className="text-4xl">\uD83D\uDC7E</div>;
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
        addLog(`\uD83D\uDCA5 ${enemy.name} PANIC SELL!`);
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
    addLog(`\u26A1 ${ab.name} for ${dmg}!`);
  };

  const hpPct = Math.max(0, (hydraHp / hydra.maxHp) * 100);
  const epPct = Math.max(0, (hydraEnergy / hydra.maxEnergy) * 100);
  const eHpPct = Math.max(0, (enemyHp / enemy.maxHp) * 100);
  const enemyImg = ENEMY_IMAGES[enemy.id];
  const enemyArt = CHARACTER_ART[enemy.id];

  return (
    <div className="relative flex flex-col w-full h-full max-w-4xl mx-auto p-4 md:p-6 bg-black/40 backdrop-blur-sm rounded-lg border border-game-purple/30 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-3 items-center mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-end">
            <span className="font-pixel text-[10px] text-game-teal uppercase tracking-wider">Hydra</span>
            <span className="font-pixel text-[8px] text-white/70">{Math.max(0, Math.floor(hydraHp))}/{hydra.maxHp} HP</span>
          </div>
          <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 to-red-400"
              initial={{ width: '100%' }}
              animate={{ width: `${hpPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="h-1.5 w-full bg-gray-800/50 rounded-full overflow-hidden mt-1">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: '100%' }}
              animate={{ width: `${epPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="font-pixel text-[14px] text-white mb-1">VS</div>
          <div className="font-pixel text-[8px] text-white/50 tracking-tighter uppercase whitespace-nowrap">
            BATTLE {battleIndex + 1}/{ENEMIES.length}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-right">
          <div className="flex justify-between items-end flex-row-reverse">
            <span className="font-pixel text-[10px] text-red-400 uppercase tracking-wider">{enemy.name}</span>
            <span className="font-pixel text-[8px] text-white/70">{Math.max(0, Math.floor(enemyHp))}/{enemy.maxHp} HP</span>
          </div>
          <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-l from-orange-600 to-orange-400"
              initial={{ width: '100%' }}
              animate={{ width: `${eHpPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="font-pixel text-[7px] text-white/40 mt-1 italic leading-tight">
            {enemy.subtitle}
          </div>
        </div>
      </div>

      {/* Damage Popups */}
      <AnimatePresence>
        {popups.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: p.y, x: `${p.x}%`, scale: 0.5 }}
            animate={{ opacity: 1, y: p.y - 40, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className={`absolute z-20 font-pixel text-[12px] pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${
              p.isMiss ? 'text-gray-400' : p.isHeal ? 'text-green-400' : 'text-yellow-400'
            }`}
          >
            {p.isMiss ? 'MISS' : p.isHeal ? `+${p.value}` : `-${p.value}`}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Battle Scene */}
      <div className="relative flex-1 flex items-center justify-around my-4 min-h-[200px] sm:min-h-[250px]">
        <motion.div
          animate={shakeHydra ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex flex-col items-center"
        >
          <img
            src={hydraBattle}
            alt="Hydra"
            className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="absolute -bottom-2 w-24 h-4 bg-black/30 blur-md rounded-[100%] -z-10" />
        </motion.div>

        <motion.div
          animate={shakeEnemy ? { x: [10, -10, 10, -10, 0] } : {}}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex flex-col items-center"
        >
          {enemyImg ? (
            <img
              src={enemyImg}
              alt={enemy.name}
              className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              style={{ imageRendering: 'pixelated', transform: 'scaleX(-1)' }}
            />
          ) : enemyArt ? (
            <div style={{ transform: 'scaleX(-1)' }}>
              <PixelArt art={enemyArt} size={window.innerWidth < 640 ? 6 : 8} />
            </div>
          ) : (
            <div className="text-6xl">\uD83D\uDC7E</div>
          )}
          <div className="absolute -bottom-2 w-24 h-4 bg-black/30 blur-md rounded-[100%] -z-10" />
        </motion.div>
      </div>

      {/* Battle Log */}
      <div className="bg-black/60 rounded border border-game-purple/30 p-3 mb-6 min-h-[85px]">
        <div className="font-pixel text-[8px] text-game-purple mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-game-purple animate-pulse rounded-full" />
          BATTLE LOG
        </div>
        <div className="flex flex-col gap-1.5">
          {log.slice(-3).map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className={`font-pixel text-[9px] ${
                m.includes('Hydra hits') ? 'text-white' :
                m.includes('hits') ? 'text-red-400' :
                m.includes('⚡') ? 'text-game-teal' :
                m.includes('dodged') ? 'text-gray-400' : 'text-game-purple/80'
              }`}
            >
              {m}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Abilities */}
      <div className="flex justify-center gap-3 md:gap-6 mt-auto">
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
              <div className={`mt-1 flex items-center gap-1 font-pixel text-[6px] md:text-[7px] ${hydraEnergy < ab.energyCost ? 'text-red-400' : 'text-blue-400'}`}>
                \u26A1 {ab.energyCost}
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
