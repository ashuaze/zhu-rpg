import React, { useState } from 'react';
import { StoryEvent, StoryChoice, GameState } from '../types';
import { CHAPTER_NAMES } from '../data/characters';
import { sound } from '../utils/audio';
import { BookOpen, Compass, MapPin, Sparkles, Swords, ChevronRight, CheckCircle2 } from 'lucide-react';

interface StoryViewProps {
  currentEvent: StoryEvent;
  gameState: GameState;
  onMakeChoice: (choice: StoryChoice) => void;
  recentFeedback?: string | null;
}

export const StoryView: React.FC<StoryViewProps> = ({
  currentEvent,
  gameState,
  onMakeChoice,
  recentFeedback,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const chapterInfo = CHAPTER_NAMES[currentEvent.chapterId] || {
    title: `第 ${currentEvent.chapterId} 卷`,
    subtitle: '风云激荡，日月重开',
    period: '至正年间',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Chapter Title Badge */}
      <div className="text-center space-y-1.5 border-b border-amber-900/30 pb-4">
        <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/40">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>{chapterInfo.period}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-amber-100 tracking-widest font-serif">
          {chapterInfo.title}
        </h2>
        <p className="text-xs sm:text-sm text-amber-300/70 italic font-serif">
          {chapterInfo.subtitle}
        </p>
      </div>

      {/* Narrative Card */}
      <div className="relative rounded-2xl bg-gradient-to-b from-stone-900 via-stone-900/90 to-stone-950 border border-amber-900/40 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Background watermarked ancient dragon or character */}
        <div className="absolute top-4 right-4 text-stone-800/20 text-8xl font-black pointer-events-none select-none font-serif">
          明
        </div>

        {/* Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3 mb-5 text-xs text-stone-400">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-amber-400 text-sm">{currentEvent.title}</span>
            <span>•</span>
            <span className="text-stone-300 font-mono">{currentEvent.year}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-amber-200/80">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>{currentEvent.location}</span>
          </div>
        </div>

        {/* Speaker & Content */}
        <div className="flex items-start space-x-4 mb-6">
          {/* Avatar Seal */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-red-900 to-amber-950 border-2 border-amber-500/60 shadow-lg flex flex-col items-center justify-center text-amber-200">
            <span className="text-xl font-bold font-serif">{currentEvent.speakerAvatar || currentEvent.speaker.slice(0, 1)}</span>
            <span className="text-[10px] text-amber-300/80 mt-0.5">{currentEvent.speakerRole.slice(0, 4)}</span>
          </div>

          {/* Dialogue / Narrative Text */}
          <div className="flex-1 space-y-3">
            <div className="text-xs font-semibold text-amber-400/90">
              【{currentEvent.speaker}】 · {currentEvent.speakerRole}
            </div>
            <div className="space-y-2.5 text-stone-200 text-sm sm:text-base leading-relaxed tracking-wide font-serif">
              {currentEvent.content.map((paragraph, idx) => (
                <p key={idx} className="indent-6 sm:indent-8 first:indent-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Historical Note Accordion */}
        {currentEvent.historicalNote && (
          <div className="mt-4 pt-3 border-t border-stone-800/80">
            <button
              onClick={() => {
                sound.playClick();
                setShowHistory(!showHistory);
              }}
              className="flex items-center space-x-2 text-xs text-amber-400/80 hover:text-amber-300 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>{showHistory ? '收起史籍原典考据' : '查阅《明史·太祖本纪》考据'}</span>
            </button>
            {showHistory && (
              <div className="mt-2.5 p-3 rounded-lg bg-stone-950/80 border border-amber-900/30 text-xs text-amber-200/80 leading-relaxed font-serif italic">
                {currentEvent.historicalNote}
              </div>
            )}
          </div>
        )}

        {/* Immediate Feedback Consequence */}
        {recentFeedback && (
          <div className="mt-4 p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-center space-x-2 text-xs text-amber-200 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{recentFeedback}</span>
          </div>
        )}
      </div>

      {/* Choices Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-amber-400/90 px-1">
          <span>太祖抉择（决定天命与历史走向）：</span>
          <span>可用决策：{currentEvent.choices.length} 项</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {currentEvent.choices.map((choice, idx) => {
            const hasBattle = !!choice.battleTrigger;
            const isBenevolent = (choice.alignmentEffect?.benevolent || 0) > 0;
            const isRuthless = (choice.alignmentEffect?.ruthless || 0) > 0;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (hasBattle) {
                    sound.playDrum();
                  } else {
                    sound.playClick();
                  }
                  onMakeChoice(choice);
                }}
                className={`group relative text-left p-4 sm:p-5 rounded-xl border transition-all duration-200 shadow-lg flex flex-col justify-between ${
                  hasBattle
                    ? 'bg-gradient-to-r from-red-950/80 to-stone-900 hover:from-red-900/90 hover:to-stone-800 border-red-800/70 hover:border-red-600'
                    : 'bg-stone-900/90 hover:bg-stone-800 border-amber-900/40 hover:border-amber-600/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-stone-950 border border-amber-700/60 flex items-center justify-center text-xs font-mono text-amber-300 font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="text-stone-100 font-medium text-sm sm:text-base font-serif group-hover:text-amber-200 transition">
                        {choice.text}
                      </p>
                      {choice.hint && (
                        <p className="text-xs text-stone-400 group-hover:text-stone-300 transition">
                          {choice.hint}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {hasBattle && (
                      <span className="px-2 py-0.5 rounded bg-red-900/80 text-red-200 text-xs font-semibold flex items-center space-x-1 border border-red-700">
                        <Swords className="w-3 h-3" />
                        <span>触发战役</span>
                      </span>
                    )}
                    {choice.unlockGeneralId && (
                      <span className="px-2 py-0.5 rounded bg-amber-900/80 text-amber-200 text-xs font-semibold flex items-center space-x-1 border border-amber-700">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>良将效忠</span>
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-300 group-hover:translate-x-1 transition" />
                  </div>
                </div>

                {/* Effects Preview Tags */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-stone-800/60 text-[11px]">
                  {isBenevolent && (
                    <span className="text-emerald-400 font-medium">
                      +仁德 {choice.alignmentEffect?.benevolent}
                    </span>
                  )}
                  {isRuthless && (
                    <span className="text-rose-400 font-medium">
                      +铁血 {choice.alignmentEffect?.ruthless}
                    </span>
                  )}
                  {choice.resourceEffect?.grain && (
                    <span className="text-amber-300 font-mono">
                      粮草 {choice.resourceEffect.grain > 0 ? `+${choice.resourceEffect.grain}` : choice.resourceEffect.grain}
                    </span>
                  )}
                  {choice.resourceEffect?.silver && (
                    <span className="text-amber-300 font-mono">
                      军饷 {choice.resourceEffect.silver > 0 ? `+${choice.resourceEffect.silver}` : choice.resourceEffect.silver}
                    </span>
                  )}
                  {choice.resourceEffect?.troops && (
                    <span className="text-blue-300 font-mono">
                      兵力 +{choice.resourceEffect.troops}
                    </span>
                  )}
                  {choice.resourceEffect?.morale && (
                    <span className="text-red-300 font-mono">
                      民望 +{choice.resourceEffect.morale}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
