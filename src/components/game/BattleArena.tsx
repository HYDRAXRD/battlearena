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

  // Reset battle state when battleIndex changes (fix for getting stuck after 1st fight)
  useEffect(() => {
    battleOverRef.current = false;
    setHydraHp(hydra.hp);
    setHydraEnergy(hydra.energy);
    setEnemyHp(enemy.maxHp);
    enemyHpRef.current = enemy.maxHp;
    setCooldowns({});
    setLog([`A new challenger appears: ${enemy.name}!`]);
  }, [battleIndex, enemy.maxHp, enemy.name, hydra.hp, hydra.energy]);

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
    <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-4 flex flex-col min-h-screen">
      <div className="text-center font-pixel text-[8px] md:text-[10px] text-game-teal mb-4 animate-pulse">
        BATTLE {battleIndex + 1}/{ENEMIES.length}
        <br />
        -----------------------------------------
      </div>

      <div className="flex justify-between items-start mb-8">
        <div className="w-5/12">
          <div className="font-pixel text-[7px] text-white mb-1">HYDRA</div>
          <div className="w-full h-3 bg-gray-800 border-2 border-black rounded-sm overflow-hidden mb-1">
            <motion.div animate={{ width: `${hpPct}%` }} className="h-full bg-red-500" />
          </div>
          <div className="w-full h-1.5 bg-gray-800 border border-black rounded-sm overflow-hidden">
            <motion.div animate={{ width: `${epPct}%` }} className="h-full bg-blue-500" />
          </div>
          <div className="font-pixel text-[5px] text-right text-gray-400 mt-1">{Math.max(0, hydraHp)}/{hydra.maxHp} HP</div>
        </div>

        <div className="w-5/12 text-right">
          <div className="font-pixel text-[7px] text-white mb-1">{enemy.name}</div>
          <div className="w-full h-3 bg-gray-800 border-2 border-black rounded-sm overflow-hidden mb-1">
            <motion.div animate={{ width: `${eHpPct}%` }} className="h-full bg-red-500" />
          </div>
          <div className="font-pixel text-[5px] text-gray-400 mt-1">{Math.max(0, enemyHp)}/{enemy.maxHp} HP</div>
          <div className="font-pixel text-[6px] text-game-teal italic mt-1">{enemy.subtitle}</div>
        </div>
      </div>

      {/* Battle Visual Container - Centered and Aligned */}
      <div className="flex-1 relative flex items-center justify-center min-h-[300px] mb-8">
        <AnimatePresence>
          {popups.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: p.y, x: `${p.x}%` }}
              animate={{ opacity: 0, y: p.y - 40 }}
              className={`absolute font-pixel text-[12px] md:text-lg z-20 pointer-events-none ${p.isMiss ? 'text-gray-400' : p.isHeal ? 'text-green-400' : 'text-red-500'}`}
              style={{ left: 0, top: 0 }}
            >
              {p.isMiss ? 'MISS' : p.isHeal ? `+${p.value}` : `-${p.value}`}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="relative w-full h-full flex items-center justify-around px-8">
          {/* Hydra Side */}
          <motion.div 
            animate={shakeHydra ? { x: [-5, 5, -5, 5, 0] } : {}}
            className="relative z-10"
          >
            <img 
              src={hydraBattle} 
              alt="Hydra" 
              className="w-40 md:w-56 object-contain filter drop-shadow-[0_0_20px_rgba(29,111,232,0.4)]"
              style={{ imageRendering: 'pixelated' }} 
            />
          </motion.div>

          <div className="font-pixel text-lg text-game-purple opacity-40 animate-pulse">VS</div>

          {/* Enemy Side */}
          <motion.div 
            animate={shakeEnemy ? { x: [5, -5, 5, -5, 0] } : {}}
            className="relative z-10"
          >
            {enemyImg ? (
              <img 
                src={enemyImg} 
                alt={enemy.name} 
                className="w-40 md:w-56 object-contain filter drop-shadow-[0_0_20px_rgba(184,20,166,0.4)]"
                style={{ imageRendering: 'pixelated' }} 
              />
            ) : (
              <div className="w-40 h-40 bg-gray-800 rounded-full border-4 border-game-purple flex items-center justify-center text-4xl">👾</div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Log and Abilities Footer */}
      <div className="mt-auto">
        <div className="bg-black/60 border-2 border-game-teal/30 p-2 rounded mb-4 min-h-[50px]">
          {log.slice(-3).map((m, i) => (
            <div key={i} className={`font-pixel text-[6px] md:text-[8px] ${i === 2 ? 'text-white' : 'text-white/40'}`}>
              {m}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] md:text-[12px]">{ab.icon}</span>
                  <span>{ab.name}</span>
                  <span className="text-blue-400">{ab.energyCost} EP</span>
                </div>
                {cd > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-yellow-400">
                    {(cd / 1000).toFixed(1)}s
                  </div>
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
