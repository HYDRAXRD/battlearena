import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HydraStats, DamagePopup } from '@/game/types';
import { ENEMIES, ABILITIES, CHARACTER_ART } from '@/game/constants';
import { useGameAudio } from '@/hooks/useGameAudio';
import PixelCanvas from './PixelCanvas';
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
  hug: 'https://arweave.net/dYJSMjZlaoVSttypbD46PJumutb0Nb-x1Zz8e7PdqA0',
  wowo: 'https://arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-O-v-Z0',
  shiba: 'https://arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-O-v-Z0',
  bonk: 'https://arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-O-v-Z0',
  pengu: 'https://arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-O-v-Z0',
  floki: 'https://arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-O-v-Z0',
  dog: 'https://arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-O-v-Z0',
  trump: 'https://arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-O-v-Z0',
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
    <div className="flex flex-col h-full bg-background/95 p-4 md:p-6 overflow-hidden relative">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="font-pixel text-[8px] md:text-xs text-game-purple animate-pulse">
          BATTLE {battleIndex + 1}/{ENEMIES.length}
        </div>
        <div className="text-right">
          <div className="font-pixel text-[10px] md:text-sm text-white">vs {enemy.name}</div>
          <div className="font-pixel text-[6px] md:text-[8px] text-muted-foreground">{enemy.subtitle}</div>
        </div>
      </div>

      <div className="flex-1 relative border-2 border-game-purple/20 rounded-lg overflow-hidden bg-black/40 mb-4 md:mb-6">
        <AnimatePresence>
          {popups.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: p.y }}
              animate={{ opacity: 1, y: p.y - 40 }}
              exit={{ opacity: 0 }}
              className={`absolute font-pixel text-[10px] md:text-sm z-50 pointer-events-none ${
                p.isHeal ? 'text-game-teal' : p.isMiss ? 'text-gray-400' : 'text-game-red'
              }`}
              style={{ left: `${p.x}%` }}
            >
              {p.isMiss ? 'MISS' : p.isHeal ? `+${p.value}` : `-${p.value}`}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="absolute inset-x-0 top-4 px-4 flex justify-between z-10">
          <div className="w-[40%]">
            <div className="h-2 md:h-3 bg-gray-800 rounded-full border border-gray-700 overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-game-red to-red-400"
                initial={{ width: "100%" }}
                animate={{ width: `${hpPct}%` }}
              />
            </div>
            <div className="font-pixel text-[6px] md:text-[8px] text-white mt-1 drop-shadow-md">
              HYDRA {Math.max(0, hydraHp)}/{hydra.maxHp}
            </div>
            <div className="h-1 md:h-1.5 bg-gray-800 rounded-full border border-gray-700 overflow-hidden mt-2">
              <motion.div
                className="h-full bg-gradient-to-r from-game-purple to-purple-400"
                initial={{ width: "0%" }}
                animate={{ width: `${epPct}%` }}
              />
            </div>
            <div className="font-pixel text-[5px] md:text-[7px] text-game-purple mt-0.5">
              EP {Math.floor(hydraEnergy)}/{hydra.maxEnergy}
            </div>
          </div>

          <div className="w-[40%] text-right">
            <div className="h-2 md:h-3 bg-gray-800 rounded-full border border-gray-700 overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-l from-game-red to-red-400"
                initial={{ width: "100%" }}
                animate={{ width: `${eHpPct}%` }}
              />
            </div>
            <div className="font-pixel text-[6px] md:text-[8px] text-white mt-1 drop-shadow-md">
              {enemy.name.toUpperCase()} {Math.max(0, enemyHp)}/{enemy.maxHp}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-around pointer-events-none">
          <motion.div
            animate={shakeHydra ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.2 }}
            className="w-24 md:w-48 h-24 md:h-48 relative"
          >
            <img
              src={hydraBattle}
              alt="Hydra"
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(29,111,232,0.4)]"
            />
          </motion.div>

          <div className="font-pixel text-xl md:text-3xl text-game-purple opacity-20 italic">VS</div>

          <motion.div
            animate={shakeEnemy ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.2 }}
            className="w-24 md:w-48 h-24 md:h-48 relative"
          >
            {enemyImg ? (
              <img
                src={enemyImg}
                alt={enemy.name}
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(232,29,29,0.4)]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PixelCanvas 
                  art={CHARACTER_ART[enemy.id] || CHARACTER_ART['doge']} 
                  pixelSize={6}
                  className="filter drop-shadow-[0_0_15px_rgba(232,29,29,0.4)]"
                />
              </div>
            )}
          </motion.div>
        </div>

        <div className="absolute bottom-4 inset-x-0 px-4 flex justify-center pointer-events-none">
          <div className="bg-black/60 border border-game-purple/30 p-2 rounded max-w-[80%] backdrop-blur-sm">
            {log.slice(-3).map((m, i) => (
              <div
                key={i}
                className={`font-pixel text-[6px] md:text-[9px] mb-0.5 last:mb-0 ${
                  i === 2 ? 'text-white' : 'text-white/40'
                }`}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 md:gap-4 h-24 md:h-32">
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
              <div className="text-[10px] md:text-lg mb-1">{ab.icon}</div>
              <div className="font-bold truncate">{ab.name}</div>
              <div className="text-game-purple mt-1">{ab.energyCost} EP</div>
              {cd > 0 && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-game-purple/20"
                    initial={{ height: "100%" }}
                    animate={{ height: "0%" }}
                    transition={{ duration: cd / 1000, ease: "linear" }}
                  />
                  <div className="relative z-10 text-[8px] md:text-xs text-white">
                    {(cd / 1000).toFixed(1)}s
                  </div>
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
