import React from 'react';
import { GameState, GamePhase } from '../types';
import { sound } from '../utils/audio';
import { Shield, Sparkles, Volume2, VolumeX, Save, RotateCcw, Scroll, Landmark, Users } from 'lucide-react';

interface NavbarProps {
  state: GameState;
  onSelectPhase: (phase: GamePhase) => void;
  onSave: () => void;
  onReset: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  onSelectPhase,
  onSave,
  onReset,
  soundMuted,
  onToggleSound,
}) => {
  const totalMorale = Math.min(100, Math.max(0, state.resources.morale));
  const totalAlignment = state.player.benevolent + state.player.ruthless;
  const benPercent = totalAlignment > 0 ? Math.round((state.player.benevolent / totalAlignment) * 100) : 50;

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 border-b border-amber-900/40 backdrop-blur-md shadow-2xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Emperor Title & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-700 via-red-900 to-stone-900 border border-amber-500/50 flex items-center justify-center shadow-inner">
            <span className="text-amber-200 font-bold text-lg font-serif">明</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black text-amber-100 tracking-wider">
                {state.player.name}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-medium">
                {state.player.reignTitle}
              </span>
            </div>
            <div className="flex items-center text-[11px] text-stone-400 space-x-2 mt-0.5">
              <span>第 {state.currentChapterId} 卷</span>
              <span>•</span>
              <span className="text-amber-400/90 font-mono">第 {state.turnCount} 月</span>
            </div>
          </div>
        </div>

        {/* Center: Core Resources Bar */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-4 bg-stone-950/70 px-3 py-1.5 rounded-lg border border-amber-950/80 text-xs sm:text-sm">
          <div className="flex items-center space-x-1.5" title="粮草储备，行军作战与屯田之根">
            <span className="text-emerald-400">🌾</span>
            <span className="text-stone-400 text-xs">粮草:</span>
            <span className="font-semibold text-emerald-300 font-mono">{state.resources.grain}</span>
          </div>

          <div className="flex items-center space-x-1.5" title="白银军饷，募兵赏赐与器械铸造">
            <span className="text-amber-400">🪙</span>
            <span className="text-stone-400 text-xs">军饷:</span>
            <span className="font-semibold text-amber-300 font-mono">{state.resources.silver}两</span>
          </div>

          <div className="flex items-center space-x-1.5" title="麾下甲士雄兵">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-stone-400 text-xs">甲士:</span>
            <span className="font-semibold text-blue-300 font-mono">{state.resources.troops}人</span>
          </div>

          <div className="flex items-center space-x-1.5" title="三军将士与黎民士气">
            <span className="text-rose-400">🏮</span>
            <span className="text-stone-400 text-xs">民望:</span>
            <span className="font-semibold text-rose-300 font-mono">{totalMorale}%</span>
          </div>

          {/* 帝王心术 Gauge */}
          <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-stone-800 text-xs">
            <span className="text-emerald-400 font-medium">仁德 {state.player.benevolent}</span>
            <div className="w-16 h-2 bg-stone-800 rounded-full overflow-hidden flex border border-stone-700/60">
              <div
                className="bg-emerald-600 transition-all duration-300"
                style={{ width: `${benPercent}%` }}
                title={`仁德: ${benPercent}%`}
              />
              <div
                className="bg-rose-700 transition-all duration-300"
                style={{ width: `${100 - benPercent}%` }}
                title={`铁血: ${100 - benPercent}%`}
              />
            </div>
            <span className="text-rose-400 font-medium">铁血 {state.player.ruthless}</span>
          </div>
        </div>

        {/* Right: Navigation & Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <nav className="flex items-center bg-stone-950/60 p-1 rounded-lg border border-amber-950/70">
            <button
              onClick={() => {
                sound.playClick();
                onSelectPhase('story');
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center space-x-1 ${
                state.phase === 'story'
                  ? 'bg-amber-800/80 text-amber-100 shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>主线剧情</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onSelectPhase('strategy');
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center space-x-1 ${
                state.phase === 'strategy'
                  ? 'bg-amber-800/80 text-amber-100 shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>军政府</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onSelectPhase('roster');
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center space-x-1 ${
                state.phase === 'roster'
                  ? 'bg-amber-800/80 text-amber-100 shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>麾下名将 ({state.recruitedGenerals.filter((g) => g.recruited).length})</span>
            </button>
          </nav>

          {/* Sound, Save, Reset */}
          <button
            onClick={onToggleSound}
            className="p-1.5 text-stone-400 hover:text-amber-300 bg-stone-950/60 rounded-md border border-stone-800 transition"
            title={soundMuted ? '开启音效' : '静音'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSave();
            }}
            className="p-1.5 text-stone-400 hover:text-amber-300 bg-stone-950/60 rounded-md border border-stone-800 transition"
            title="保存进度"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (window.confirm('是否重置历史进度，重回凤阳皇觉寺？')) {
                onReset();
              }
            }}
            className="p-1.5 text-stone-400 hover:text-rose-400 bg-stone-950/60 rounded-md border border-stone-800 transition"
            title="重起义旗 (重置)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
