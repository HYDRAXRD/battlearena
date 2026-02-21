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
  hug: 'https://owbfemrwmvvikuvw3suwypr2hsn2noww6q237movtt6hxm65vagq.arweave.net/dYJSMjZlaoVSttypbD46PJumutb0Nb-x1Zz8e7PdqA0',
  wowo: 'https://xbhdiq74yh7ugpmlmm2fp7zu74p3ov4qhzjugpv74z2pvd5p7goq.arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-o-v-Z0',
  shiba: 'https://xbhdiq74yh7ugpmlmm2fp7zu74p3ov4qhzjugpv74z2pvd5p7goq.arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-o-v-Z0',
  bonk: 'https://xbhdiq74yh7ugpmlmm2fp7zu74p3ov4qhzjugpv74z2pvd5p7goq.arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-o-v-Z0',
  pengu: 'https://xbhdiq74yh7ugpmlmm2fp7zu74p3ov4qhzjugpv74z2pvd5p7goq.arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-o-v-Z0',
  floki: 'https://xbhdiq74yh7ugpmlmm2fp7zu74p3ov4qhzjugpv74z2pvd5p7goq.arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-o-v-Z0',
  dog: 'https://xbhdiq74yh7ugpmlmm2fp7zu74p3ov4qhzjugpv74z2pvd5p7goq.arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-o-v-Z0',
  trump: 'https://xbhdiq74yh7ugpmlmm2fp7zu74p3ov4qhzjugpv74z2pvd5p7goq.arweave.net/uE40Q_zB_0M9i2M0V_80_x-3V5A-U0M-v-Z0-o-v-Z0',
};

const BattleArena: React.FC<Props> = ({ hydra, battleIndex, cooldownReduction, onWin, onLose }) => {
  const { playSfx } = useGameAudio();
  const enemy = ENEMIES[battleIndex] || ENEMIES[0];
  
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
        addLog(\`\${enemy.name} dodged!\`);
        return;
      }
      const dmg = Math.max(1, hydra.attack - enemy.defense);
      setEnemyHp(p => Math.max(0, p - dmg));
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 200);
      addPopup(dmg, 'right');
      addLog(\`Hydra hits for \${dmg}!\`);
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
        addLog(\`💥 \${enemy.name} uses PANIC SELL!\`);
        playSfx('ability');
      }
      setHydraHp(p => Math.max(0, p - dmg));
      setShakeHydra(true);
      setTimeout(() => setShakeHydra(false), 200);
      addPopup(dmg, 'left');
      addLog(\`\${enemy.name} hits for \${dmg}!\`);
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
    addLog(\`⚡ \${ab.name} for \${dmg}!\`);
  };

  const hpPct = (hydraHp / hydra.maxHp) * 100;
  const epPct = (hydraEnergy / hydra.maxEnergy) * 100;
  const eHpPct = (enemyHp / enemy.maxHp) * 100;
  const enemyImg = ENEMY_IMAGES[enemy.id];

  return (
    <div className="flex flex-col items-center justify-between h-full w-full max-w-2xl mx-auto p-4 md:p-6 bg-black/40 backdrop-blur-sm border-x-2 border-game-purple/30">
      <div className="w-full text-center space-y-1">
        <h2 className="font-pixel text-xs md:text-sm text-game-teal tracking-widest">BATTLE {battleIndex + 1}/{ENEMIES.length}</h2>
        <div className="flex items-center justify-center gap-2">
          <span className="h-px w-8 bg-game-purple/50" />
          <h1 className="font-pixel text-lg md:text-2xl text-white">vs {enemy.name}</h1>
          <span className="h-px w-8 bg-game-purple/50" />
        </div>
        <p className="font-pixel text-[8px] md:text-[10px] text-gray-400 italic">"{enemy.subtitle}"</p>
      </div>

      <div className="relative w-full aspect-video bg-black/60 rounded-lg border-2 border-game-purple/20 overflow-hidden shadow-inner">
        <AnimatePresence>
          {popups.map(p => (
            <motion.div
              key={p.id}
              initial={{ y: p.y, x: p.x + '%', opacity: 1, scale: 0.5 }}
              animate={{ y: p.y - 40, opacity: 0, scale: 1.5 }}
              className={\`absolute z-50 font-pixel text-[10px] md:text-xs \${p.isMiss ? 'text-gray-400' : p.isHeal ? 'text-game-green' : 'text-game-red'}\`}
            >
              {p.isMiss ? 'MISS' : p.isHeal ? \`+\${p.value}\` : \`-\${p.value}\`}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="absolute top-4 left-4 w-32 md:w-48 space-y-1 z-10">
          <div className="flex justify-between font-pixel text-[8px] md:text-[10px] text-white">
            <span>HYDRA</span>
            <span>{Math.max(0, hydraHp)}/{hydra.maxHp}</span>
          </div>
          <div className="h-2 md:h-3 w-full bg-gray-900 border border-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-game-red to-red-400"
              initial={{ width: '100%' }}
              animate={{ width: \`\${hpPct}%\` }}
            />
          </div>
          <div className="flex justify-between font-pixel text-[8px] md:text-[10px] text-game-teal mt-1">
            <span>EP</span>
            <span>{Math.floor(hydraEnergy)}/{hydra.maxEnergy}</span>
          </div>
          <div className="h-1.5 md:h-2 w-full bg-gray-900 border border-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-game-teal"
              initial={{ width: '100%' }}
              animate={{ width: \`\${epPct}%\` }}
            />
          </div>
        </div>

        <div className="absolute top-4 right-4 w-32 md:w-48 space-y-1 z-10 text-right">
          <div className="flex justify-between font-pixel text-[8px] md:text-[10px] text-white">
            <span>{enemy.name.toUpperCase()}</span>
            <span>{Math.max(0, enemyHp)}/{enemy.maxHp}</span>
          </div>
          <div className="h-2 md:h-3 w-full bg-gray-900 border border-white/20 rounded-full overflow-hidden scale-x-[-1]">
            <motion.div 
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-400"
              initial={{ width: '100%' }}
              animate={{ width: \`\${eHpPct}%\` }}
            />
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-between px-8 md:px-16 pt-8">
          <motion.div 
            animate={shakeHydra ? { x: [-5, 5, -5, 5, 0] } : {}}
            className="relative"
          >
            <div className="w-24 h-24 md:w-40 md:h-40 flex items-center justify-center">
              <PixelCanvas art={CHARACTER_ART.hydra} size={4} />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/40 blur-md rounded-full" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 font-pixel text-[8px] text-white/50">Hydra</div>
          </motion.div>

          <div className="font-pixel text-xl md:text-3xl text-game-purple/40 italic">VS</div>

          <motion.div 
            animate={shakeEnemy ? { x: [-5, 5, -5, 5, 0] } : {}}
            className="relative"
          >
            <div className="w-24 h-24 md:w-40 md:h-40 flex items-center justify-center">
              {enemyImg ? (
                <img src={enemyImg} alt={enemy.name} className="w-full h-full object-contain pixelated" />
              ) : (
                <PixelCanvas art={CHARACTER_ART[enemy.id as keyof typeof CHARACTER_ART] || CHARACTER_ART.doge} size={4} />
              )}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/40 blur-md rounded-full" />
          </motion.div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 space-y-1 z-10">
          {log.slice(-3).map((m, i) => (
            <motion.p 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1 - (2-i)*0.3, x: 0 }}
              className="font-pixel text-[8px] md:text-[10px] text-white/80 text-center"
            >
              {m}
            </motion.p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4 w-full pt-4">
        {ABILITIES.map((ab, i) => {
          const cd = cooldowns[ab.id] || 0;
          const disabled = cd > 0 || hydraEnergy < ab.energyCost || battleOverRef.current;
          
          return (
            <button
              key={ab.id}
              onClick={() => useAbility(i)}
              disabled={disabled}
              className={\`relative font-pixel text-[6px] md:text-[7px] p-3 rounded border-2 transition-all \${
                disabled 
                  ? 'bg-gray-800/50 border-gray-700 text-gray-600 cursor-not-allowed' 
                  : 'bg-background border-game-purple/50 text-white hover:border-game-purple hover:shadow-[0_0_15px_rgba(29,111,232,0.3)] active:scale-95'
              }\`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-sm md:text-lg">{ab.icon}</span>
                <span className="uppercase tracking-tighter">{ab.name}</span>
                <span className="text-game-teal/80">{ab.energyCost} EP</span>
              </div>
              {cd > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-sm">
                  <span className="text-[10px] md:text-xs text-game-red font-bold">{(cd / 1000).toFixed(1)}s</span>
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

