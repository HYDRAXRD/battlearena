import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelCanvas from './PixelCanvas';
import { HydraStats, DamagePopup } from '@/game/types';
import { ENEMIES, ABILITIES, CHARACTER_ART } from '@/game/constants';
import hydraBattle from '@/assets/hydra-battle.png';

interface Props {
  hydra: HydraStats;
  battleIndex: number;
  cooldownReduction: number;
  onWin: (tokens: number, score: number) => void;
  onLose: () => void;
}

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
    if (hydraHp <= 0) { battleOverRef.current = true; setTimeout(() => onLose(), 800); }
    else if (enemyHp <= 0) { battleOverRef.current = true; setTimeout(() => onWin(enemy.tokenReward, enemy.scoreValue), 800); }
  }, [hydraHp, enemyHp, onWin, onLose, enemy]);

  // Hydra auto-attack
  useEffect(() => {
    const iv = setInterval(() => {
      if (battleOverRef.current) return;
      if (Math.random() < enemy.dodgeRate) { addPopup(0, 'right', false, true); addLog(`${enemy.name} dodged!`); return; }
      const dmg = Math.max(1, hydra.attack - enemy.defense);
      setEnemyHp(p => Math.max(0, p - dmg));
      setShakeEnemy(true); setTimeout(() => setShakeEnemy(false), 200);
      addPopup(dmg, 'right'); addLog(`Hydra hits for ${dmg}!`);
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
        addLog(`💥 ${enemy.name} uses PANIC SELL!`);
      }
      setHydraHp(p => Math.max(0, p - dmg));
      setShakeHydra(true); setTimeout(() => setShakeHydra(false), 200);
      addPopup(dmg, 'left'); addLog(`${enemy.name} hits for ${dmg}!`);
      if (enemy.healRate) {
        setEnemyHp(p => Math.min(enemy.maxHp, p + enemy.healRate!));
        addPopup(enemy.healRate, 'right', true);
      }
    }, enemy.attackSpeed);
    return () => clearInterval(iv);
  }, [enemy, addPopup, addLog]);

  // Energy regen
  useEffect(() => {
    const iv = setInterval(() => { if (!battleOverRef.current) setHydraEnergy(p => Math.min(hydra.maxEnergy, p + 5)); }, 1000);
    return () => clearInterval(iv);
  }, [hydra.maxEnergy]);

  // Cooldown ticker
  useEffect(() => {
    const iv = setInterval(() => setCooldowns(p => {
      const n: Record<string, number> = {};
      for (const [k, v] of Object.entries(p)) { if (v > 100) n[k] = v - 100; }
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
    setShakeEnemy(true); setTimeout(() => setShakeEnemy(false), 300);
    addPopup(dmg, 'right');
    if (heal > 0) { setHydraHp(p => Math.min(hydra.maxHp, p + heal)); addPopup(heal, 'left', true); }
    setCooldowns(p => ({ ...p, [ab.id]: ab.cooldownMs - cooldownReduction * 500 }));
    addLog(`⚡ ${ab.name} for ${dmg}!`);
  };

  const hpPct = (hydraHp / hydra.maxHp) * 100;
  const epPct = (hydraEnergy / hydra.maxEnergy) * 100;
  const eHpPct = (enemyHp / enemy.maxHp) * 100;

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      <div className="text-center pt-4 font-pixel">
        <div className="text-[8px] text-game-teal">BATTLE {battleIndex + 1}/4</div>
        <div className="text-xs text-white mt-1">vs {enemy.name}</div>
        <div className="text-[7px] text-muted-foreground">{enemy.subtitle}</div>
      </div>

      <div className="flex-1 flex items-center justify-center relative px-4">
        <AnimatePresence>
          {popups.map(p => (
            <motion.div key={p.id}
              className={`absolute font-pixel text-sm z-20 pointer-events-none ${p.isMiss ? 'text-gray-400' : p.isHeal ? 'text-game-teal' : 'text-red-400'}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              initial={{ opacity: 1, y: 0, scale: 1 }} animate={{ opacity: 0, y: -40, scale: 1.5 }}
              transition={{ duration: 0.8 }}>
              {p.isMiss ? 'MISS' : p.isHeal ? `+${p.value}` : `-${p.value}`}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Hydra */}
        <div className="flex flex-col items-center w-2/5">
          <div className="mb-2 w-full max-w-[160px]">
            <div className="flex justify-between font-pixel text-[7px] text-white mb-1"><span>HYDRA</span><span>{Math.max(0, hydraHp)}/{hydra.maxHp}</span></div>
            <div className="w-full h-3 bg-gray-800 rounded-sm overflow-hidden border border-green-500/30">
              <motion.div className="h-full bg-gradient-to-r from-green-600 to-green-400" animate={{ width: `${hpPct}%` }} transition={{ duration: 0.3 }} />
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-sm overflow-hidden mt-1 border border-blue-500/30">
              <motion.div className="h-full bg-gradient-to-r from-blue-600 to-blue-400" animate={{ width: `${epPct}%` }} transition={{ duration: 0.3 }} />
            </div>
            <div className="font-pixel text-[6px] text-blue-400 mt-0.5">EP {Math.floor(hydraEnergy)}/{hydra.maxEnergy}</div>
          </div>
          <motion.div animate={shakeHydra ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.2 }}>
            <PixelCanvas art={HYDRA_ART} pixelSize={6} />
          </motion.div>
        </div>

        <div className="font-pixel text-game-purple text-lg mx-2 animate-pulse">VS</div>

        {/* Enemy */}
        <div className="flex flex-col items-center w-2/5">
          <div className="mb-2 w-full max-w-[160px]">
            <div className="flex justify-between font-pixel text-[7px] text-white mb-1"><span>{enemy.name.toUpperCase()}</span><span>{Math.max(0, enemyHp)}/{enemy.maxHp}</span></div>
            <div className="w-full h-3 bg-gray-800 rounded-sm overflow-hidden border border-red-500/30">
              <motion.div className="h-full bg-gradient-to-r from-red-600 to-red-400" animate={{ width: `${eHpPct}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
          <motion.div animate={shakeEnemy ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.2 }}>
            <PixelCanvas art={CHARACTER_ART[enemy.id]} pixelSize={6} />
          </motion.div>
        </div>
      </div>

      {/* Log */}
      <div className="px-4 mb-2">
        <div className="bg-black/60 rounded p-2 h-14 overflow-hidden border border-game-purple/20">
          {log.slice(-3).map((m, i) => <div key={i} className="font-pixel text-[6px] text-gray-400 leading-relaxed">{m}</div>)}
        </div>
      </div>

      {/* Abilities */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-3 gap-2">
          {ABILITIES.map((ab, i) => {
            const cd = cooldowns[ab.id] || 0;
            const disabled = cd > 0 || hydraEnergy < ab.energyCost || battleOverRef.current;
            return (
              <button key={ab.id} onClick={() => useAbility(i)} disabled={disabled}
                className={`relative font-pixel text-[6px] md:text-[7px] p-3 rounded border-2 transition-all ${disabled
                  ? 'bg-gray-800/50 border-gray-700 text-gray-600 cursor-not-allowed'
                  : 'bg-background border-game-purple/50 text-white hover:border-game-purple hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-95'}`}>
                <div className="text-lg mb-1">{ab.icon}</div>
                <div className="leading-tight">{ab.name}</div>
                <div className="text-[5px] text-game-teal mt-1">{ab.energyCost} EP</div>
                {cd > 0 && (
                  <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
                    <span className="text-yellow-400 text-[8px]">{(cd / 1000).toFixed(1)}s</span>
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
