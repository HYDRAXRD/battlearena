import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HydraStats, DamagePopup } from '@/game/types';
import { ENEMIES, ABILITIES } from '@/game/constants';
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
      setTimeout(() => onLose(), 800);
    } else if (enemyHp <= 0) {
      battleOverRef.current = true;
      setTimeout(() => onWin(enemy.tokenReward, enemy.scoreValue), 800);
    }
  }, [hydraHp, enemyHp, onWin, onLose, enemy]);

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
    }, 2000);
    return () => clearInterval(iv);
  }, [enemy, hydra.attack, addPopup, addLog]);

  // Enemy auto-attack
  useEffect(() => {
    const iv = setInterval(() => {
      if (battleOverRef.current) return;
      let dmg = enemy.attack;
      if (enemy.specialThreshold && enemy.specialMultiplier && enemyHpRef.current / enemy.maxHp <= enemy.specialThreshold) {
        dmg = Math.floor(dmg * enemy.specialMultiplier);
        addLog(`\u{1F4A5} ${enemy.name} uses PANIC SELL!`);
      }
      setHydraHp(p => Math.max(0, p - dmg));
      setShakeHydra(true);
      setTimeout(() => setShakeHydra(false), 200);
      addPopup(dmg, 'left');
      addLog(`${enemy.name} hits for ${dmg}!`);
      if (enemy.healRate) {
        setEnemyHp(p => Math.min(enemy.maxHp, p + enemy.healRate!));
        addPopup(enemy.healRate, 'right', true);
      }
    }, enemy.attackSpeed);
    return () => clearInterval(iv);
  }, [enemy, addPopup, addLog]);

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
    if (heal > 0) {
      setHydraHp(p => Math.min(hydra.maxHp, p + heal));
      addPopup(heal, 'left', true);
    }
    setCooldowns(p => ({ ...p, [ab.id]: ab.cooldownMs - cooldownReduction * 500 }));
    addLog(`\u26A1 ${ab.name} for ${dmg}!`);
  };

  const hpPct = (hydraHp / hydra.maxHp) * 100;
  const epPct = (hydraEnergy / hydra.maxEnergy) * 100;
  const eHpPct = (enemyHp / enemy.maxHp) * 100;
  const enemyImg = ENEMY_IMAGES[enemy.id];

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
      <div className="font-pixel text-game-purple text-xs">
        BATTLE {battleIndex + 1}/{ENEMIES.length}
      </div>

      <div className="text-center">
        <div className="font-pixel text-white text-sm">vs {enemy.name}</div>
        <div className="font-pixel text-gray-400 text-[8px]">{enemy.subtitle}</div>
      </div>

      {/* Battle area */}
      <div className="relative w-full flex justify-between items-end px-4" style={{ height: '200px' }}>
        <AnimatePresence>
          {popups.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
              className={`absolute font-pixel text-xs pointer-events-none ${
                p.isMiss ? 'text-gray-400' : p.isHeal ? 'text-green-400' : 'text-red-400'
              }`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {p.isMiss ? 'MISS' : p.isHeal ? `+${p.value}` : `-${p.value}`}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Hydra side */}
        <div className="flex flex-col items-center gap-1" style={{ width: '45%' }}>
          <div className="font-pixel text-[7px] text-white w-full">
            HYDRA &nbsp;{Math.max(0, hydraHp)}/{hydra.maxHp}
          </div>
          <div className="w-full h-2 bg-gray-800 rounded">
            <div className="h-full bg-game-green rounded transition-all" style={{ width: `${hpPct}%` }} />
          </div>
          <div className="font-pixel text-[6px] text-blue-400 w-full">
            EP {Math.floor(hydraEnergy)}/{hydra.maxEnergy}
          </div>
          <div className="w-full h-1 bg-gray-800 rounded">
            <div className="h-full bg-blue-500 rounded transition-all" style={{ width: `${epPct}%` }} />
          </div>
          <motion.div
            animate={shakeHydra ? { x: [-4, 4, -4, 0] } : {}}
            className="mt-1"
            style={{ height: '100px', display: 'flex', alignItems: 'flex-end' }}
          >
            <img src={hydraBattle} alt="Hydra" className="h-full object-contain" />
          </motion.div>
        </div>

        <div className="font-pixel text-game-purple text-lg self-center">VS</div>

        {/* Enemy side */}
        <div className="flex flex-col items-center gap-1" style={{ width: '45%' }}>
          <div className="font-pixel text-[7px] text-white w-full text-right">
            {enemy.name.toUpperCase()} &nbsp;{Math.max(0, enemyHp)}/{enemy.maxHp}
          </div>
          <div className="w-full h-2 bg-gray-800 rounded">
            <div className="h-full bg-red-500 rounded transition-all" style={{ width: `${eHpPct}%` }} />
          </div>
          <motion.div
            animate={shakeEnemy ? { x: [-4, 4, -4, 0] } : {}}
            className="mt-3"
            style={{ height: '100px', display: 'flex', alignItems: 'flex-end' }}
          >
            {enemyImg ? (
              <img src={enemyImg} alt={enemy.name} className="h-full object-contain" />
            ) : (
              <div className="font-pixel text-white text-xs text-center">{enemy.name}</div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Log */}
      <div className="w-full bg-black/40 border border-game-purple/20 rounded p-2 h-16 overflow-hidden">
        {log.slice(-3).map((m, i) => (
          <div key={i} className="font-pixel text-[7px] text-gray-300">{m}</div>
        ))}
      </div>

      {/* Abilities */}
      <div className="flex gap-2 w-full justify-center flex-wrap">
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
              <div className="text-lg">{ab.icon}</div>
              <div>{ab.name}</div>
              <div className="text-blue-400">{ab.energyCost} EP</div>
              {cd > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                  <span className="text-yellow-400">{(cd / 1000).toFixed(1)}s</span>
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
