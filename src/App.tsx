import React, { useState, useEffect } from 'react';
import { GameState, StoryChoice, GamePhase, StrategyPolicy, BattleState, BattleConfig } from './types';
import { INITIAL_GENERALS } from './data/characters';
import { STORY_EVENTS } from './data/chapters';
import { Navbar } from './components/Navbar';
import { StoryView } from './components/StoryView';
import { BattleView } from './components/BattleView';
import { StrategyView } from './components/StrategyView';
import { GeneralRoster } from './components/GeneralRoster';
import { EndingModal } from './components/EndingModal';
import { sound } from './utils/audio';

const STORAGE_KEY = 'hongwu_rpg_save_v1';

const getInitialState = (): GameState => ({
  player: {
    name: '朱元璋',
    level: 1,
    reignTitle: '皇觉沙弥',
    benevolent: 50,
    ruthless: 50,
  },
  resources: {
    grain: 80,
    silver: 40,
    troops: 15,
    morale: 60,
  },
  currentChapterId: 1,
  currentEventId: 'c1_e1',
  phase: 'story',
  activeBattle: null,
  recruitedGenerals: JSON.parse(JSON.stringify(INITIAL_GENERALS)),
  items: {
    medicines: 2,
    rations: 3,
    bombs: 1,
  },
  eventHistory: ['c1_e1'],
  turnCount: 1,
  gameEnding: null,
});

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error('Failed to load local save:', e);
      }
    }
    return getInitialState();
  });

  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [recentFeedback, setRecentFeedback] = useState<string | null>(null);
  const [showEnding, setShowEnding] = useState<boolean>(false);

  // Auto-save on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
      console.error('Failed to auto-save:', e);
    }
  }, [gameState]);

  // Update Reign Title as story progresses
  useEffect(() => {
    let newTitle = gameState.player.reignTitle;
    if (gameState.currentChapterId === 1) newTitle = '皇觉沙弥';
    if (gameState.currentChapterId === 2) newTitle = '濠州九夫长';
    if (gameState.currentChapterId === 3) newTitle = '集庆大都督';
    if (gameState.currentChapterId === 4) newTitle = '江南吴王';
    if (gameState.currentChapterId >= 5) newTitle = '大明洪武皇帝';

    if (newTitle !== gameState.player.reignTitle) {
      setGameState((prev) => ({
        ...prev,
        player: { ...prev.player, reignTitle: newTitle },
      }));
    }
  }, [gameState.currentChapterId]);

  // Manual save
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
      alert('史官已将当前征战历程录入金匮石室！');
    } catch (e) {
      alert('保存失败，请检查浏览器权限。');
    }
  };

  // Reset
  const handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    const fresh = getInitialState();
    setGameState(fresh);
    setRecentFeedback('烽火重燃，重登皇觉寺古道！');
    setShowEnding(false);
  };

  // Sound Toggle
  const handleToggleSound = () => {
    const isMuted = sound.toggleMute();
    setSoundMuted(isMuted);
  };

  // Trigger Battle helper
  const triggerBattle = (battleConfig: BattleConfig) => {
    const activeAllies = gameState.recruitedGenerals.filter((g) => g.recruited);
    const newBattleState: BattleState = {
      config: battleConfig,
      allies: activeAllies.map((a) => ({ ...a })), // deep copy
      enemies: battleConfig.enemies.map((e) => ({ ...e })),
      currentTurn: 1,
      actionQueue: [],
      activeUnitIndex: 0,
      logs: [
        {
          id: Math.random().toString(),
          type: 'info',
          text: `【${battleConfig.title}】擂鼓开战！三军列阵，誓扫敌顽！`,
        },
      ],
      status: 'ongoing',
    };

    setGameState((prev) => ({
      ...prev,
      activeBattle: newBattleState,
      phase: 'battle',
    }));
  };

  // Handle Story Choice
  const handleMakeChoice = (choice: StoryChoice) => {
    let nextBenevolent = gameState.player.benevolent;
    let nextRuthless = gameState.player.ruthless;

    if (choice.alignmentEffect?.benevolent) {
      nextBenevolent += choice.alignmentEffect.benevolent;
    }
    if (choice.alignmentEffect?.ruthless) {
      nextRuthless += choice.alignmentEffect.ruthless;
    }

    const nextGrain = Math.max(0, gameState.resources.grain + (choice.resourceEffect?.grain || 0));
    const nextSilver = Math.max(0, gameState.resources.silver + (choice.resourceEffect?.silver || 0));
    const nextTroops = Math.max(0, gameState.resources.troops + (choice.resourceEffect?.troops || 0));
    const nextMorale = Math.min(100, Math.max(0, gameState.resources.morale + (choice.resourceEffect?.morale || 0)));

    // General recruit
    let updatedGenerals = [...gameState.recruitedGenerals];
    if (choice.unlockGeneralId) {
      updatedGenerals = updatedGenerals.map((g) =>
        g.id === choice.unlockGeneralId ? { ...g, recruited: true } : g
      );
    }

    setRecentFeedback(choice.narrativeFeedback);

    // Battle trigger?
    if (choice.battleTrigger) {
      setGameState((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          benevolent: nextBenevolent,
          ruthless: nextRuthless,
        },
        resources: {
          grain: nextGrain,
          silver: nextSilver,
          troops: nextTroops,
          morale: nextMorale,
        },
        recruitedGenerals: updatedGenerals,
      }));
      triggerBattle(choice.battleTrigger);
      return;
    }

    // Ending?
    if (choice.nextEventId === 'ending') {
      setShowEnding(true);
      return;
    }

    // Next event
    const nextEvent = STORY_EVENTS[choice.nextEventId];
    const nextChapterId = nextEvent ? nextEvent.chapterId : gameState.currentChapterId;

    setGameState((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        benevolent: nextBenevolent,
        ruthless: nextRuthless,
      },
      resources: {
        grain: nextGrain,
        silver: nextSilver,
        troops: nextTroops,
        morale: nextMorale,
      },
      currentChapterId: nextChapterId,
      currentEventId: choice.nextEventId,
      recruitedGenerals: updatedGenerals,
      eventHistory: [...prev.eventHistory, choice.nextEventId],
      turnCount: prev.turnCount + 1,
    }));
  };

  // Battle Victory handler
  const handleBattleVictory = () => {
    if (!gameState.activeBattle) return;
    const reward = gameState.activeBattle.config.reward;
    const nextEventId = gameState.activeBattle.config.onVictoryEventId;

    const nextEvent = nextEventId ? STORY_EVENTS[nextEventId] : null;
    const nextChapterId = nextEvent ? nextEvent.chapterId : gameState.currentChapterId;

    setGameState((prev) => ({
      ...prev,
      resources: {
        ...prev.resources,
        silver: prev.resources.silver + reward.silver,
        grain: prev.resources.grain + reward.grain,
        morale: Math.min(100, prev.resources.morale + reward.morale),
      },
      phase: 'story',
      activeBattle: null,
      currentChapterId: nextChapterId,
      currentEventId: nextEventId || prev.currentEventId,
      turnCount: prev.turnCount + 1,
    }));

    setRecentFeedback(`战事告捷！斩获白银 ${reward.silver} 两，粮草 ${reward.grain} 担，民望士气大幅上升！`);
  };

  // Battle Defeat handler
  const handleBattleDefeat = () => {
    setGameState((prev) => ({
      ...prev,
      phase: 'story',
      activeBattle: null,
      resources: {
        ...prev.resources,
        morale: Math.max(10, prev.resources.morale - 20),
      },
    }));
    setRecentFeedback('我军失利暂退，士气受挫。请在军政府犒赏休整后再试！');
  };

  // Use Item
  const handleUseItemInBattle = (type: 'medicines' | 'bombs') => {
    setGameState((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [type]: Math.max(0, prev.items[type] - 1),
      },
    }));
  };

  // Strategy Policy Applied
  const handleApplyPolicy = (policy: StrategyPolicy) => {
    setGameState((prev) => {
      const nextSilver = Math.max(0, prev.resources.silver - (policy.cost.silver || 0) + (policy.gain.silver || 0));
      const nextGrain = Math.max(0, prev.resources.grain - (policy.cost.grain || 0) + (policy.gain.grain || 0));
      const nextTroops = prev.resources.troops + (policy.gain.troops || 0);
      const nextMorale = Math.min(100, Math.max(0, prev.resources.morale + (policy.gain.morale || 0)));

      const nextBenevolent = prev.player.benevolent + (policy.gain.benevolent || 0);
      const nextRuthless = prev.player.ruthless + (policy.gain.ruthless || 0);

      return {
        ...prev,
        resources: {
          silver: nextSilver,
          grain: nextGrain,
          troops: nextTroops,
          morale: nextMorale,
        },
        player: {
          ...prev.player,
          benevolent: nextBenevolent,
          ruthless: nextRuthless,
        },
        turnCount: prev.turnCount + 1,
      };
    });
  };

  // Buy Item in Strategy market
  const handleBuyItem = (itemType: 'medicines' | 'rations' | 'bombs', cost: number) => {
    setGameState((prev) => {
      if (prev.resources.silver < cost) return prev;
      return {
        ...prev,
        resources: {
          ...prev.resources,
          silver: prev.resources.silver - cost,
        },
        items: {
          ...prev.items,
          [itemType]: prev.items[itemType] + 1,
        },
      };
    });
  };

  // Heal all generals
  const handleHealAllGenerals = () => {
    setGameState((prev) => {
      if (prev.resources.grain < 30) return prev;
      return {
        ...prev,
        resources: {
          ...prev.resources,
          grain: prev.resources.grain - 30,
        },
        recruitedGenerals: prev.recruitedGenerals.map((g) => ({
          ...g,
          hp: g.maxHp,
          rage: 25,
        })),
      };
    });
  };

  // Upgrade General in Roster
  const handleUpgradeGeneral = (generalId: string) => {
    setGameState((prev) => {
      if (prev.resources.silver < 80 || prev.resources.grain < 50) return prev;

      return {
        ...prev,
        resources: {
          ...prev.resources,
          silver: prev.resources.silver - 80,
          grain: prev.resources.grain - 50,
        },
        recruitedGenerals: prev.recruitedGenerals.map((g) => {
          if (g.id !== generalId) return g;
          return {
            ...g,
            attack: g.attack + 8,
            defense: g.defense + 6,
            maxHp: g.maxHp + 60,
            hp: g.maxHp + 60,
          };
        }),
      };
    });
  };

  const currentEvent = STORY_EVENTS[gameState.currentEventId] || STORY_EVENTS['c1_e1'];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-800 selection:text-white">
      {/* Navbar */}
      <Navbar
        state={gameState}
        onSelectPhase={(phase: GamePhase) => setGameState((prev) => ({ ...prev, phase }))}
        onSave={handleSave}
        onReset={handleReset}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {gameState.phase === 'story' && (
          <StoryView
            currentEvent={currentEvent}
            gameState={gameState}
            onMakeChoice={handleMakeChoice}
            recentFeedback={recentFeedback}
          />
        )}

        {gameState.phase === 'battle' && gameState.activeBattle && (
          <BattleView
            battleState={gameState.activeBattle}
            gameState={gameState}
            onVictory={handleBattleVictory}
            onDefeat={handleBattleDefeat}
            onUpdateBattle={(newBattle) =>
              setGameState((prev) => ({ ...prev, activeBattle: newBattle }))
            }
            onUseItem={handleUseItemInBattle}
          />
        )}

        {gameState.phase === 'strategy' && (
          <StrategyView
            gameState={gameState}
            onApplyPolicy={handleApplyPolicy}
            onBuyItem={handleBuyItem}
            onHealAllGenerals={handleHealAllGenerals}
          />
        )}

        {gameState.phase === 'roster' && (
          <GeneralRoster
            gameState={gameState}
            onUpgradeGeneral={handleUpgradeGeneral}
          />
        )}
      </main>

      {/* Ending Modal */}
      {showEnding && (
        <EndingModal
          gameState={gameState}
          onRestart={handleReset}
          onContinue={() => {
            setShowEnding(false);
            setGameState((prev) => ({ ...prev, phase: 'strategy' }));
          }}
        />
      )}
    </div>
  );
}
