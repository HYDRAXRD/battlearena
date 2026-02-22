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
  hug: 'https://owbfemrwmvvikuvw3suwypr2hsn2noww6q237movtt6hxm65vagq.arweave.net/dYJSMjZlaoVSttypbD46PJumutb0Nb-x1Zz8e7PdqA0',
  wowo: 'https://xbhdiq74yh7ugpmlmm2fp7zu74p3ov4qhzjugpv74z2pvd5p7goq.arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-o-v-Z0',
  shiba: 'https://xbhdiq74yh7ugpmlmm2fp7zu74p3ov4qhzjugpv74z2pvd5p7goq.arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-o-v-Z0',
};

const PixelArt = ({ art, size = 160 }: { art: string[]; size?: number }) => {
  if (!art || art.length === 0) return null;
  const rows = art.length;
  const cols = art[0].length;
  const pixelSize = size / Math.max(rows, cols);

  return (
    <div 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        width: size,
        height: size,
        imageRendering: 'pixelated'
      }}
    >
      {art.map((row, y) => 
        row.split('').map((char, x) => (
          <div 
            key={`${x}-${y}`} 
            style={{ 
              backgroundColor: PIXEL_PALETTE[char] || 'transparent',
              width: pixelSize,
              height: pixelSize
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
  const enemyArt = CHARACTER_ART[enemy.id];

  return (
    <div className="relative z-10 flex flex-col items-center justify-between min-h-[500px] w-full max-w-4xl mx-auto p-4 md:p-8">
      {/* Top HUD */}
      <div className="w-full flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1 w-1/3">
          <div className="font-pixel text-[10px] text-game-teal mb-1">Hydra</div>
          <div className="h-4 w-full bg-gray-800 rounded-full border-2 border-black overflow-hidden relative shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-600 to-red-400"
              initial={{ width: '100%' }}
              animate={{ width: `${hpPct}%` }}
            />
          </div>
          <div className="font-pixel text-[6px] text-white/60 mt-1">{Math.max(0, Math.floor(hydraHp))}/{hydra.maxHp} HP</div>
          
          <div className="h-2 w-3/4 bg-gray-800 rounded-full border border-black overflow-hidden mt-1 shadow-inner">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: '100%' }}
              animate={{ width: `${epPct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="font-pixel text-[8px] text-white/40 mb-1">BATTLE {battleIndex + 1}/{ENEMIES.length}</div>
          <div className="font-pixel text-xl text-game-purple animate-pulse">VS</div>
        </div>

        <div className="flex flex-col gap-1 w-1/3 items-end">
          <div className="font-pixel text-[10px] text-red-400 mb-1 text-right">{enemy.name}</div>
          <div className="h-4 w-full bg-gray-800 rounded-full border-2 border-black overflow-hidden relative shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
              initial={{ width: '100%' }}
              animate={{ width: `${eHpPct}%` }}
            />
          </div>
          <div className="font-pixel text-[6px] text-white/60 mt-1">{Math.max(0, Math.floor(enemyHp))}/{enemy.maxHp} HP</div>
          <div className="font-pixel text-[5px] text-white/30 text-right italic">{enemy.subtitle}</div>
        </div>
      </div>

      {/* Popups Layer */}
      <div className="absolute inset-0 pointer-events-none z-50">
        <AnimatePresence>
          {popups.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: p.y, x: `${p.x}%`, scale: 0.5 }}
              animate={{ opacity: 0, y: p.y - 60, scale: 1.5 }}
              exit={{ opacity: 0 }}
              className={`fixed font-pixel text-sm md:text-xl font-bold shadow-sm ${
                p.isMiss ? 'text-gray-400' : p.isHeal ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {p.isMiss ? 'MISS' : p.isHeal ? `+${p.value}` : `-${p.value}`}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Battlefield */}
      <div className="flex-1 flex items-center justify-between w-full gap-8 py-8 relative">
        <motion.div 
          animate={shakeHydra ? { x: [-10, 10, -10, 10, 0] } : {}}
          className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center"
        >
          <div className="absolute -bottom-4 w-3/4 h-6 bg-black/30 rounded-full blur-md" />
          <img src={hydraBattle} alt="Hydra" className="w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-pixel text-[8px] text-game-teal whitespace-nowrap">Hydra</div>
        </motion.div>

        <motion.div 
          animate={shakeEnemy ? { x: [10, -10, 10, -10, 0] } : {}}
          className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center"
        >
          <div className="absolute -bottom-4 w-3/4 h-6 bg-black/30 rounded-full blur-md" />
          {enemyImg ? (
            <img src={enemyImg} alt={enemy.name} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(234,88,12,0.3)]" />
          ) : enemyArt ? (
            <PixelArt art={enemyArt} size={180} />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-6xl">👾</div>
          )}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-pixel text-[8px] text-red-400 whitespace-nowrap">{enemy.name}</div>
        </motion.div>
      </div>

      {/* Bottom Bar: Logs & Abilities */}
      <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-between mt-auto">
        <div className="w-full md:w-48 bg-black/60 border border-game-teal/30 rounded p-2 h-20 overflow-hidden shadow-lg backdrop-blur-sm">
          <div className="font-pixel text-[5px] text-white/20 mb-1 uppercase tracking-widest">Battle Logs</div>
          {log.slice(-3).map((m, i) => (
            <div key={i} className={`font-pixel text-[6px] mb-0.5 ${m.includes('Hydra') ? 'text-game-teal' : 'text-red-400/80'}`}>
              {m}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {ABILITIES.map((ab, i) => {
            const cd = cooldowns[ab.id] || 0;
            const disabled = cd > 0 || hydraEnergy < ab.energyCost || battleOverRef.current;
            return (
              <button
                key={ab.id}
                onClick={() => useAbility(i)}
                disabled={disabled}
                className={`relative group flex flex-col items-center justify-center w-24 h-16 p-1 rounded border-2 transition-all ${
                  disabled
                    ? 'bg-gray-800/50 border-gray-700 text-gray-600 cursor-not-allowed'
                    : 'bg-background border-game-purple/50 text-white hover:border-game-purple hover:bg-game-purple/10 active:scale-95 shadow-lg'
                }`}
              >
                <span className="text-lg mb-0.5">{ab.icon}</span>
                <span className="font-pixel text-[6px] uppercase">{ab.name}</span>
                <div className="mt-1 flex items-center gap-1 font-pixel text-[5px] text-blue-400">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {ab.energyCost}
                </div>
                {cd > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-pixel text-[10px] text-white rounded">
                    {(cd / 1000).toFixed(1)}s
                  </div>
                )}
                {!disabled && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-game-teal rounded-full animate-ping opacity-75" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BattleArena;
