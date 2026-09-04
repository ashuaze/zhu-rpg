import React, { useState, useEffect, useRef } from 'react';
import { BattleState, General, Enemy, GeneralSkill, GameState } from '../types';
import { sound } from '../utils/audio';
import { Swords, Shield, Heart, Zap, Crosshair, Award, Flame, AlertCircle } from 'lucide-react';

interface BattleViewProps {
  battleState: BattleState;
  gameState: GameState;
  onVictory: () => void;
  onDefeat: () => void;
  onUpdateBattle: (newBattle: BattleState) => void;
  onUseItem: (itemType: 'medicines' | 'bombs') => void;
}

export const BattleView: React.FC<BattleViewProps> = ({
  battleState,
  gameState,
  onVictory,
  onDefeat,
  onUpdateBattle,
  onUseItem,
}) => {
  const [selectedEnemyIdx, setSelectedEnemyIdx] = useState<number>(0);
  const [selectedSkill, setSelectedSkill] = useState<GeneralSkill | null>(null);
  const [isProcessingTurn, setIsProcessingTurn] = useState<boolean>(false);
  const [floatingEffects, setFloatingEffects] = useState<{ id: string; text: string; isCrit?: boolean; isHeal?: boolean }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleState.logs]);

  // Ensure selected target is valid
  useEffect(() => {
    if (battleState.enemies[selectedEnemyIdx]?.hp <= 0) {
      const nextLiving = battleState.enemies.findIndex((e) => e.hp > 0);
      if (nextLiving !== -1) {
        setSelectedEnemyIdx(nextLiving);
      }
    }
  }, [battleState.enemies, selectedEnemyIdx]);

  const activeAllies = battleState.allies;
  const currentAllyIndex = battleState.activeUnitIndex % activeAllies.length;
  const currentAlly = activeAllies[currentAllyIndex];

  // Helper to add floating damage text
  const addFloatingText = (text: string, isCrit = false, isHeal = false) => {
    const id = Math.random().toString();
    setFloatingEffects((prev) => [...prev, { id, text, isCrit, isHeal }]);
    setTimeout(() => {
      setFloatingEffects((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  // Check victory / defeat conditions
  const checkBattleEnd = (newEnemies: Enemy[], newAllies: General[]): 'ongoing' | 'victory' | 'defeat' => {
    const allEnemiesDefeated = newEnemies.every((e) => e.hp <= 0);
    const allAlliesDefeated = newAllies.every((a) => a.hp <= 0);

    if (allEnemiesDefeated) return 'victory';
    if (allAlliesDefeated) return 'defeat';
    return 'ongoing';
  };

  // Enemy Counter-Attack Turn
  const processEnemyTurn = (currentAllies: General[], currentEnemies: Enemy[]) => {
    setIsProcessingTurn(true);
    setTimeout(() => {
      const livingEnemies = currentEnemies.filter((e) => e.hp > 0);
      const livingAllies = currentAllies.filter((a) => a.hp > 0);

      if (livingEnemies.length === 0 || livingAllies.length === 0) {
        setIsProcessingTurn(false);
        return;
      }

      let updatedAllies = [...currentAllies];
      const newLogs = [...battleState.logs];

      livingEnemies.forEach((enemy) => {
        // Find living target ally
        const targetAlly = livingAllies[Math.floor(Math.random() * livingAllies.length)];
        const allyIdx = updatedAllies.findIndex((a) => a.id === targetAlly.id);
        if (allyIdx === -1) return;

        // Skill vs normal
        const useSpecial = Math.random() < 0.4 && enemy.type === 'boss';
        const baseDamage = Math.max(8, enemy.attack - Math.floor(updatedAllies[allyIdx].defense * 0.4));
        const finalDamage = useSpecial ? Math.floor(baseDamage * 1.4) : baseDamage;

        updatedAllies[allyIdx] = {
          ...updatedAllies[allyIdx],
          hp: Math.max(0, updatedAllies[allyIdx].hp - finalDamage),
          rage: Math.min(updatedAllies[allyIdx].maxRage, updatedAllies[allyIdx].rage + 15),
        };

        sound.playSword();
        if (useSpecial) {
          newLogs.push({
            id: Math.random().toString(),
            type: 'skill',
            text: `【${enemy.name}】施展绝技「${enemy.skillName}」，重创【${updatedAllies[allyIdx].name}】造成 ${finalDamage} 点烈创！`,
          });
        } else {
          newLogs.push({
            id: Math.random().toString(),
            type: 'attack',
            text: `【${enemy.name}】挥舞军刃袭击【${updatedAllies[allyIdx].name}】，造成 ${finalDamage} 点战损。`,
          });
        }

        if (updatedAllies[allyIdx].hp <= 0) {
          newLogs.push({
            id: Math.random().toString(),
            type: 'defeat',
            text: `【${updatedAllies[allyIdx].name}】伤重脱力，暂退帅帐！`,
          });
        }
      });

      const finalStatus = checkBattleEnd(currentEnemies, updatedAllies);

      onUpdateBattle({
        ...battleState,
        allies: updatedAllies,
        enemies: currentEnemies,
        logs: newLogs,
        status: finalStatus,
        activeUnitIndex: (battleState.activeUnitIndex + 1) % updatedAllies.length,
      });

      setIsProcessingTurn(false);

      if (finalStatus === 'defeat') {
        sound.playGong();
      }
    }, 700);
  };

  // Ally Executes Action
  const executeAllyAction = (skill: GeneralSkill) => {
    if (isProcessingTurn || battleState.status !== 'ongoing') return;
    if (currentAlly.hp <= 0) {
      // Advance to next living ally
      onUpdateBattle({
        ...battleState,
        activeUnitIndex: (battleState.activeUnitIndex + 1) % activeAllies.length,
      });
      return;
    }

    if (currentAlly.rage < skill.cost) {
      alert(`气力不足！需要 ${skill.cost} 点怒气，当前 ${currentAlly.rage} 点。`);
      return;
    }

    const newLogs = [...battleState.logs];
    let updatedEnemies = [...battleState.enemies];
    let updatedAllies = [...battleState.allies];
    const allyIdx = currentAllyIndex;

    // Deduct rage
    const newRage = Math.max(0, currentAlly.rage - skill.cost);
    updatedAllies[allyIdx] = { ...currentAlly, rage: newRage };

    if (skill.type === 'damage') {
      sound.playSword();
      if (skill.target === 'all') {
        // AOE Damage
        sound.playSkill();
        const baseDmg = Math.floor(currentAlly.attack * skill.power);
        updatedEnemies = updatedEnemies.map((e) => {
          if (e.hp <= 0) return e;
          const dmg = Math.max(12, baseDmg - Math.floor(e.defense * 0.35));
          return { ...e, hp: Math.max(0, e.hp - dmg) };
        });
        addFloatingText(`群攻 ${baseDmg}`, true);
        newLogs.push({
          id: Math.random().toString(),
          type: 'skill',
          text: `【${currentAlly.name}】施展大招「${skill.name}」，威慑全场，对敌全军造成重创！`,
        });
      } else {
        // Single target
        const target = updatedEnemies[selectedEnemyIdx];
        if (!target || target.hp <= 0) return;

        const isCrit = Math.random() < 0.25;
        const multiplier = isCrit ? skill.power * 1.5 : skill.power;
        const damage = Math.max(10, Math.floor((currentAlly.attack * multiplier) - (target.defense * 0.3)));

        updatedEnemies[selectedEnemyIdx] = {
          ...target,
          hp: Math.max(0, target.hp - damage),
        };

        // If normal attack, gain rage
        if (skill.cost === 0) {
          updatedAllies[allyIdx].rage = Math.min(100, updatedAllies[allyIdx].rage + 25);
        }

        addFloatingText(`-${damage}${isCrit ? ' 暴击!' : ''}`, isCrit);
        newLogs.push({
          id: Math.random().toString(),
          type: skill.cost > 0 ? 'skill' : 'attack',
          text: `【${currentAlly.name}】发招「${skill.name}」命中【${target.name}】，造成 ${damage} 点伤害！`,
        });

        if (updatedEnemies[selectedEnemyIdx].hp <= 0) {
          newLogs.push({
            id: Math.random().toString(),
            type: 'defeat',
            text: `【${target.name}】被彻底斩落马下，失去战斗力！`,
          });
        }
      }
    } else if (skill.type === 'heal') {
      sound.playSkill();
      if (skill.target === 'ally_all') {
        updatedAllies = updatedAllies.map((a) => ({
          ...a,
          hp: Math.min(a.maxHp, a.hp + skill.power),
          rage: Math.min(a.maxRage, a.rage + 15),
        }));
        addFloatingText(`治愈全员 +${skill.power}`, false, true);
        newLogs.push({
          id: Math.random().toString(),
          type: 'heal',
          text: `【${currentAlly.name}】施展「${skill.name}」，抚恤全军，恢复 ${skill.power} 点生机并提振士气！`,
        });
      } else {
        // Heal lowest ally
        let lowestIdx = 0;
        let lowestHp = 9999;
        updatedAllies.forEach((a, i) => {
          if (a.hp > 0 && a.hp < lowestHp) {
            lowestHp = a.hp;
            lowestIdx = i;
          }
        });
        updatedAllies[lowestIdx] = {
          ...updatedAllies[lowestIdx],
          hp: Math.min(updatedAllies[lowestIdx].maxHp, updatedAllies[lowestIdx].hp + skill.power),
        };
        addFloatingText(`+${skill.power}`, false, true);
        newLogs.push({
          id: Math.random().toString(),
          type: 'heal',
          text: `【${currentAlly.name}】施展「${skill.name}」，抢救【${updatedAllies[lowestIdx].name}】恢复 ${skill.power} 点体力！`,
        });
      }
    } else if (skill.type === 'buff' || skill.type === 'control') {
      sound.playSkill();
      sound.playDrum();
      newLogs.push({
        id: Math.random().toString(),
        type: 'skill',
        text: `【${currentAlly.name}】催动军令「${skill.name}」，全军战意昂扬，阵势森严！`,
      });
      // Boost team attack & defense
      updatedAllies = updatedAllies.map((a) => ({
        ...a,
        attack: Math.floor(a.attack * 1.15),
        defense: Math.floor(a.defense * 1.15),
      }));
    }

    const currentStatus = checkBattleEnd(updatedEnemies, updatedAllies);

    if (currentStatus === 'victory') {
      sound.playVictory();
      onUpdateBattle({
        ...battleState,
        allies: updatedAllies,
        enemies: updatedEnemies,
        logs: newLogs,
        status: 'victory',
      });
      return;
    }

    // Process enemy counter turn
    processEnemyTurn(updatedAllies, updatedEnemies);
  };

  // Use Item in battle
  const handleUseItem = (type: 'medicines' | 'bombs') => {
    if (isProcessingTurn || battleState.status !== 'ongoing') return;
    if (type === 'medicines' && gameState.items.medicines <= 0) return;
    if (type === 'bombs' && gameState.items.bombs <= 0) return;

    onUseItem(type);
    const newLogs = [...battleState.logs];

    if (type === 'medicines') {
      sound.playSkill();
      const updatedAllies = battleState.allies.map((a) => ({
        ...a,
        hp: Math.min(a.maxHp, a.hp + 180),
      }));
      newLogs.push({
        id: Math.random().toString(),
        type: 'heal',
        text: `主帅朱元璋传令分发「金创药」，全军将领恢复 180 点生命！`,
      });
      addFloatingText('全军疗伤 +180', false, true);
      processEnemyTurn(updatedAllies, battleState.enemies);
    } else if (type === 'bombs') {
      sound.playDrum();
      sound.playSkill();
      const updatedEnemies = battleState.enemies.map((e) => ({
        ...e,
        hp: Math.max(0, e.hp - 160),
      }));
      newLogs.push({
        id: Math.random().toString(),
        type: 'skill',
        text: `大明神机营点燃「震天雷」，火药剧烈轰鸣！全体敌军受到 160 点烈焰爆炸伤害！`,
      });
      addFloatingText('震天雷轰击 160', true);
      const curStatus = checkBattleEnd(updatedEnemies, battleState.allies);
      if (curStatus === 'victory') {
        sound.playVictory();
        onUpdateBattle({
          ...battleState,
          enemies: updatedEnemies,
          logs: newLogs,
          status: 'victory',
        });
      } else {
        processEnemyTurn(battleState.allies, updatedEnemies);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-5">
      {/* Battle Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/90 border border-red-900/60 p-4 rounded-xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-xs font-bold font-mono">
              战役进行中
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-amber-100 font-serif">
              {battleState.config.title}
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">{battleState.config.description}</p>
        </div>

        {/* Action turn status indicator */}
        <div className="flex items-center space-x-3 bg-stone-950/80 px-4 py-2 rounded-lg border border-stone-800">
          <div className="text-right">
            <div className="text-xs text-stone-400">当前行动阵营</div>
            <div className="text-sm font-bold text-amber-300 font-serif">
              {isProcessingTurn ? '敌军反扑中...' : `【${currentAlly?.name || '主帅'}】待命`}
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${isProcessingTurn ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
        </div>
      </div>

      {/* Main Battlefield: Grid of Enemies (Top) and Allies (Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Center 8 Cols: Battlefield Units */}
        <div className="lg:col-span-8 space-y-6">
          {/* Enemies Formation */}
          <div className="bg-stone-950/90 border border-red-900/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-red-950/80 pb-2 mb-3">
              <span className="text-xs font-bold text-red-400 tracking-wider flex items-center space-x-1.5">
                <Swords className="w-4 h-4" />
                <span>敌军阵列（点击指定攻击目标）</span>
              </span>
              <span className="text-xs text-stone-400 font-mono">
                存活: {battleState.enemies.filter((e) => e.hp > 0).length} / {battleState.enemies.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {battleState.enemies.map((enemy, idx) => {
                const isTarget = selectedEnemyIdx === idx;
                const isDead = enemy.hp <= 0;
                const hpPercent = Math.max(0, Math.round((enemy.hp / enemy.maxHp) * 100));

                return (
                  <div
                    key={enemy.id}
                    onClick={() => {
                      if (!isDead) {
                        sound.playClick();
                        setSelectedEnemyIdx(idx);
                      }
                    }}
                    className={`relative p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isDead
                        ? 'opacity-40 bg-stone-900/40 border-stone-800 line-through'
                        : isTarget
                        ? 'bg-red-950/60 border-red-500 shadow-lg shadow-red-950/50 scale-[1.02]'
                        : 'bg-stone-900/80 border-stone-800 hover:border-red-800'
                    }`}
                  >
                    {isTarget && !isDead && (
                      <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center space-x-0.5 shadow">
                        <Crosshair className="w-3 h-3" />
                        <span>锁定</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-red-900/70 border border-red-600/60 flex items-center justify-center font-bold text-red-200 text-sm font-serif">
                          {enemy.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-stone-100 flex items-center space-x-1">
                            <span>{enemy.name}</span>
                            {enemy.type === 'boss' && (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-900 text-amber-200 font-normal">
                                头领
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400">{enemy.title}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-red-300">
                          {enemy.hp} / {enemy.maxHp}
                        </span>
                      </div>
                    </div>

                    {/* HP Bar */}
                    <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden mt-3 border border-stone-800">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player Allies Formation */}
          <div className="bg-stone-950/90 border border-amber-900/40 rounded-2xl p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
              <span className="text-xs font-bold text-amber-400 tracking-wider flex items-center space-x-1.5">
                <Shield className="w-4 h-4" />
                <span>大明三军良将（当前待命将领高亮）</span>
              </span>
              <span className="text-xs text-stone-400 font-mono">
                存活: {battleState.allies.filter((a) => a.hp > 0).length} / {battleState.allies.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {battleState.allies.map((ally, idx) => {
                const isActive = currentAllyIndex === idx;
                const isDead = ally.hp <= 0;
                const hpPercent = Math.max(0, Math.round((ally.hp / ally.maxHp) * 100));
                const ragePercent = Math.min(100, Math.round((ally.rage / ally.maxRage) * 100));

                return (
                  <div
                    key={ally.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isDead
                        ? 'opacity-30 bg-stone-900/40 border-stone-800'
                        : isActive
                        ? 'bg-amber-950/50 border-amber-500 shadow-xl shadow-amber-950/40 ring-1 ring-amber-500'
                        : 'bg-stone-900/70 border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm font-serif ${
                            isActive
                              ? 'bg-amber-600 text-stone-950 border border-amber-300'
                              : 'bg-stone-800 text-amber-200 border border-amber-900/50'
                          }`}
                        >
                          {ally.avatar}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-100 flex items-center space-x-1">
                            <span>{ally.name}</span>
                            {isActive && (
                              <span className="text-[10px] px-1 rounded bg-amber-400 text-stone-950 font-bold">
                                出手
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-400">{ally.title.split('/')[0]}</div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-mono">
                        <span className="text-emerald-400 font-semibold">{ally.hp}</span>
                        <span className="text-stone-500">/{ally.maxHp}</span>
                      </div>
                    </div>

                    {/* HP Bar */}
                    <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden mt-2.5 border border-stone-800">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>

                    {/* Rage Bar */}
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-400">
                      <div className="flex items-center space-x-1">
                        <Zap className={`w-3 h-3 ${ally.rage >= 50 ? 'text-amber-400 animate-pulse' : 'text-stone-500'}`} />
                        <span>气力:</span>
                      </div>
                      <span className="font-mono text-amber-300 font-bold">{ally.rage}/100</span>
                    </div>
                    <div className="w-full h-1 bg-stone-950 rounded-full overflow-hidden border border-stone-800/80">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300"
                        style={{ width: `${ragePercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Command Panel for Current Ally */}
          <div className="bg-stone-900/90 border border-amber-900/50 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-xs font-bold text-amber-300 font-serif">
                【{currentAlly?.name}】战斗指令：
              </span>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-stone-400">军中辎重：</span>
                <button
                  disabled={isProcessingTurn || gameState.items.medicines <= 0}
                  onClick={() => handleUseItem('medicines')}
                  className="px-2 py-0.5 rounded bg-stone-800 hover:bg-emerald-950 text-emerald-300 border border-emerald-900/60 disabled:opacity-40 transition font-mono"
                >
                  金创药 x{gameState.items.medicines}
                </button>
                <button
                  disabled={isProcessingTurn || gameState.items.bombs <= 0}
                  onClick={() => handleUseItem('bombs')}
                  className="px-2 py-0.5 rounded bg-stone-800 hover:bg-red-950 text-red-300 border border-red-900/60 disabled:opacity-40 transition font-mono"
                >
                  震天雷 x{gameState.items.bombs}
                </button>
              </div>
            </div>

            {/* Skills Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {currentAlly?.skills.map((skill) => {
                const canCast = currentAlly.rage >= skill.cost;
                const isNormal = skill.cost === 0;

                return (
                  <button
                    key={skill.id}
                    disabled={isProcessingTurn || !canCast}
                    onClick={() => executeAllyAction(skill)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      !canCast
                        ? 'opacity-40 bg-stone-950 border-stone-800 cursor-not-allowed'
                        : isNormal
                        ? 'bg-stone-800 hover:bg-stone-700 border-amber-800/80 hover:border-amber-500'
                        : 'bg-gradient-to-br from-amber-950/80 to-stone-900 hover:from-amber-900 border-amber-600/70 hover:border-amber-400 shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-200 font-serif">{skill.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          isNormal ? 'bg-stone-700 text-stone-300' : 'bg-amber-900 text-amber-200'
                        }`}
                      >
                        {isNormal ? '普攻 +25气' : `耗气 ${skill.cost}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1 line-clamp-2 leading-tight">
                      {skill.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Live Battle Action Log Console */}
        <div className="lg:col-span-4 bg-stone-950/95 border border-stone-800 rounded-2xl p-4 flex flex-col h-[520px] shadow-2xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
            <span className="text-xs font-bold text-stone-300 font-serif">军前烽火战报</span>
            <span className="text-[10px] text-stone-500 font-mono">战况实时录</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs font-serif leading-relaxed">
            {battleState.logs.length === 0 ? (
              <div className="text-stone-600 text-center py-12">号角长鸣，战鼓待发...</div>
            ) : (
              battleState.logs.map((log) => {
                let colorClass = 'text-stone-300';
                if (log.type === 'skill') colorClass = 'text-amber-300 font-semibold';
                if (log.type === 'heal') colorClass = 'text-emerald-300';
                if (log.type === 'defeat') colorClass = 'text-rose-400 font-bold';

                return (
                  <div key={log.id} className={`p-2 rounded bg-stone-900/60 border border-stone-800/60 ${colorClass}`}>
                    {log.text}
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* Victory Modal */}
      {battleState.status === 'victory' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500 rounded-2xl p-6 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
              <Award className="w-8 h-8 text-amber-400" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-amber-200 font-serif tracking-widest">
                捷报！大胜克敌！
              </h3>
              <p className="text-xs text-stone-400 mt-1">三军用命，敌寇尽除，缴获大批战备辎重！</p>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-3 gap-2 bg-stone-950 p-3 rounded-xl border border-amber-900/50 text-xs font-mono">
              <div>
                <span className="text-stone-400 block text-[10px]">缴获军饷</span>
                <span className="text-amber-400 font-bold">+{battleState.config.reward.silver}两</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">夺得粮草</span>
                <span className="text-emerald-400 font-bold">+{battleState.config.reward.grain}担</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">全军士气</span>
                <span className="text-red-400 font-bold">+{battleState.config.reward.morale}%</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onVictory();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-700 to-red-900 hover:from-amber-600 hover:to-red-800 text-amber-100 font-bold font-serif shadow-lg transition tracking-wider"
            >
              班师回朝·继续历史征程
            </button>
          </div>
        </div>
      )}

      {/* Defeat Modal */}
      {battleState.status === 'defeat' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-red-600 rounded-2xl p-6 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-950 border-2 border-red-500 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-red-300 font-serif tracking-widest">
                军情危急·战阵受挫
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                众将寡不敌众，退守大营整军备战。胜败乃兵家常事，整顿人马重振旗鼓！
              </p>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onDefeat();
              }}
              className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold font-serif shadow-lg transition tracking-wider border border-stone-700"
            >
              收拢残卒·回营休养再战
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
