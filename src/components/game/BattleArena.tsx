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
  if (!art || !art.length) return <div className='text-4xl'>👾</div>;
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
              height: size
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
    <div className='flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-4'>
      <div className='flex justify-between items-center w-full px-2'>
        <div className='flex flex-col items-start space-y-1 w-1/3'>
          <span className='text-xs md:text-sm font-pixel text-white'>Hydra</span>
          <div className='w-full h-3 md:h-4 bg-gray-800 border-2 border-white rounded-full overflow-hidden'>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${hpPct}%` }}
              className='h-full bg-gradient-to-r from-game-red to-game-purple'
            />
          </div>
          <span className='text-[10px] md:text-xs font-pixel text-white'>
            {Math.max(0, Math.floor(hydraHp))}/{hydra.maxHp} HP
          </span>
          <div className='w-full h-1.5 md:h-2 bg-gray-800 rounded-full overflow-hidden'>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${epPct}%` }}
              className='h-full bg-game-blue'
            />
          </div>
        </div>

        <div className='flex flex-col items-center w-1/3'>
          <div className='text-lg md:text-2xl font-pixel text-white'>VS</div>
          <div className='text-[10px] md:text-xs font-pixel text-game-purple bg-black/50 px-2 py-1 rounded'>
            BATTLE {battleIndex + 1}/{ENEMIES.length}
          </div>
        </div>

        <div className='flex flex-col items-end space-y-1 w-1/3'>
          <span className='text-xs md:text-sm font-pixel text-white'>{enemy.name}</span>
          <div className='w-full h-3 md:h-4 bg-gray-800 border-2 border-white rounded-full overflow-hidden'>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${eHpPct}%` }}
              className='h-full bg-game-red'
            />
          </div>
          <span className='text-[10px] md:text-xs font-pixel text-white'>
            {Math.max(0, Math.floor(enemyHp))}/{enemy.maxHp} HP
          </span>
          <span className='text-[8px] md:text-[10px] font-pixel text-gray-400'>{enemy.subtitle}</span>
        </div>
      </div>

      <div className='relative w-full aspect-video bg-black/40 rounded-lg border-2 border-game-purple/30 flex items-center justify-around overflow-hidden'>
        {popups.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.8 }}
            className='absolute font-pixel text-xl md:text-3xl pointer-events-none z-50'
            style={{ left: `${p.x}%`, top: `${p.y}%`, color: p.isMiss ? '#9ca3af' : p.isHeal ? '#22c55e' : '#ef4444' }}
          >
            {p.isMiss ? 'MISS' : `${p.isHeal ? '+' : '-'}${p.value}`}
          </motion.div>
        ))}

        <motion.div 
          animate={shakeHydra ? { x: [-10, 10, -10, 10, 0] } : {}}
          className='relative'
        >
          <img 
            src={hydraBattle} 
            alt='Hydra' 
            className='w-32 md:w-48 h-auto pixelated drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
          />
        </motion.div>

        <motion.div 
          animate={shakeEnemy ? { x: [10, -10, 10, -10, 0] } : {}}
          className='relative flex flex-col items-center'
        >
          {enemyImg ? (
            <img 
              src={enemyImg} 
              alt={enemy.name} 
              className='w-32 md:w-48 h-auto pixelated object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
            />
          ) : enemyArt ? (
            <PixelArt art={enemyArt} size={6} />
          ) : (
            <div className='text-6xl'>👾</div>
          )}
        </motion.div>
      </div>

      <div className='w-full bg-black/60 border border-game-purple/50 rounded p-2 h-20 md:h-24 font-pixel overflow-hidden'>
        <div className='text-[10px] text-game-purple mb-1 border-b border-game-purple/20'>BATTLE LOG</div>
        {log.slice(-3).map((m, i) => (
          <div key={i} className='text-[10px] md:text-xs text-white/90 leading-tight'>
            {m}
          </div>
        ))}
      </div>

      <div className='grid grid-cols-3 gap-2 md:gap-4 w-full'>
        {ABILITIES.map((ab, i) => {
          const cd = cooldowns[ab.id] || 0;
          const disabled = cd > 0 || hydraEnergy < ab.energyCost || battleOverRef.current;
          
          return (
            <button
              key={ab.id}
              onClick={() => useAbility(i)}
              disabled={disabled}
              className={`relative flex flex-col items-center justify-center w-full h-14 md:h-16 p-1 rounded border-2 transition-all ${
                disabled 
                  ? 'bg-gray-800/50 border-gray-700 text-gray-600 cursor-not-allowed' 
                  : 'bg-black/60 border-game-purple/50 text-white hover:border-game-purple hover:bg-game-purple/10 active:scale-95'
              }`}
            >
              <div className='flex items-center space-x-1'>
                <span className='text-sm md:text-base'>{ab.icon}</span>
                <span className='text-[10px] md:text-xs font-pixel uppercase tracking-tighter'>{ab.name}</span>
              </div>
              <div className='text-[8px] md:text-[10px] font-pixel text-game-blue mt-0.5'>
                ⚡ {ab.energyCost}
              </div>
              
              {cd > 0 && (
                <div className='absolute inset-0 bg-black/60 flex items-center justify-center font-pixel text-xs text-white rounded-sm'>
                  {(cd / 1000).toFixed(1)}s
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
