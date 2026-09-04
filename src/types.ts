export type GamePhase = 'prologue' | 'story' | 'battle' | 'strategy' | 'roster' | 'ending';

export type Alignment = 'benevolent' | 'ruthless'; // 仁德 vs 铁血

export interface GeneralSkill {
  id: string;
  name: string;
  cost: number; // 怒气消耗 (Rage)
  description: string;
  type: 'damage' | 'heal' | 'buff' | 'control';
  target: 'single' | 'all' | 'ally_single' | 'ally_all';
  power: number; // 基础威力加成
}

export interface General {
  id: string;
  name: string;
  title: string;
  courtesyName?: string;
  avatar: string; // 标识或历史描述
  role: 'commander' | 'vanguard' | 'strategist' | 'counselor' | 'support';
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  rage: number;
  maxRage: number;
  skills: GeneralSkill[];
  bio: string;
  recruited: boolean;
  unlockedAtChapter: number;
}

export interface Enemy {
  id: string;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  type: 'soldier' | 'elite' | 'boss';
  skillName: string;
  skillDesc: string;
}

export interface StoryChoice {
  text: string;
  hint?: string;
  alignmentEffect?: { benevolent?: number; ruthless?: number };
  resourceEffect?: { grain?: number; silver?: number; troops?: number; morale?: number };
  battleTrigger?: BattleConfig;
  nextEventId: string;
  unlockGeneralId?: string;
  narrativeFeedback: string;
}

export interface StoryEvent {
  id: string;
  chapterId: number;
  title: string;
  year: string;
  location: string;
  speaker: string;
  speakerRole: string;
  speakerAvatar?: string;
  content: string[];
  historicalNote?: string;
  choices: StoryChoice[];
  bgAtmosphere?: 'temple' | 'war' | 'court' | 'lake' | 'camp';
}

export interface BattleConfig {
  id: string;
  title: string;
  description: string;
  location: string;
  enemies: Enemy[];
  reward: {
    exp?: number;
    silver: number;
    grain: number;
    morale: number;
  };
  onVictoryEventId?: string;
}

export interface StrategyPolicy {
  id: string;
  title: string;
  description: string;
  historicalContext: string;
  cost: { silver?: number; grain?: number };
  gain: { grain?: number; silver?: number; troops?: number; morale?: number; benevolent?: number; ruthless?: number };
  cooldownTurns: number;
  lastUsedTurn?: number;
}

export interface GameState {
  player: {
    name: string;
    level: number;
    reignTitle: string; // 皇觉僧 -> 九夫长 -> 吴王 -> 大明洪武皇帝
    benevolent: number; // 仁德度 (0-100)
    ruthless: number;   // 铁血度 (0-100)
  };
  resources: {
    grain: number;  // 粮草 (担)
    silver: number; // 军饷/白银 (两)
    troops: number; // 兵力 (人)
    morale: number; // 民心士气 (0-100)
  };
  currentChapterId: number;
  currentEventId: string;
  phase: GamePhase;
  activeBattle?: BattleState | null;
  recruitedGenerals: General[];
  items: {
    medicines: number; // 金创药
    rations: number;   // 犒军干粮
    bombs: number;     // 震天雷
  };
  eventHistory: string[];
  turnCount: number;
  gameEnding?: GameEnding | null;
}

export interface BattleActionLog {
  id: string;
  text: string;
  type: 'attack' | 'skill' | 'heal' | 'defeat' | 'info';
}

export interface BattleState {
  config: BattleConfig;
  allies: General[];
  enemies: Enemy[];
  currentTurn: number;
  actionQueue: string[];
  activeUnitIndex: number;
  logs: BattleActionLog[];
  status: 'ongoing' | 'victory' | 'defeat';
}

export interface GameEnding {
  title: string;
  reignEvaluation: string;
  posthumousTitle: string; // 庙号谥号
  historicalLegacy: string;
  alignmentSummary: 'benevolent_sage' | 'iron_conqueror' | 'balanced_sovereign';
  score: number;
}
