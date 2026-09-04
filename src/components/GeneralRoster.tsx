import React, { useState } from 'react';
import { General, GameState } from '../types';
import { sound } from '../utils/audio';
import { Shield, Swords, Zap, Award, Sparkles, Heart, ChevronRight, Lock } from 'lucide-react';

interface GeneralRosterProps {
  gameState: GameState;
  onUpgradeGeneral: (generalId: string) => void;
}

export const GeneralRoster: React.FC<GeneralRosterProps> = ({
  gameState,
  onUpgradeGeneral,
}) => {
  const [selectedGenId, setSelectedGenId] = useState<string>(gameState.recruitedGenerals[0]?.id || 'zhu_yuanzhang');
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  const selectedGen = gameState.recruitedGenerals.find((g) => g.id === selectedGenId) || gameState.recruitedGenerals[0];

  const handleUpgrade = (general: General) => {
    if (gameState.resources.silver < 80 || gameState.resources.grain < 50) {
      sound.playGong();
      setUpgradeMsg('钱粮不足！擢升名将需 80 两白银与 50 担粮草。');
      return;
    }

    sound.playVictory();
    onUpgradeGeneral(general.id);
    setUpgradeMsg(`加官进爵！【${general.name}】得授殊勋，武力+8，统御+6，最大生命+60！`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950 border border-amber-900/40 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2 text-xs text-amber-400">
          <Award className="w-4 h-4" />
          <span>大明开国武侯与内阁谋臣</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-amber-100 font-serif tracking-wider mt-1">
          淮西勋贵 · 庙算群英
        </h2>
        <p className="text-xs text-stone-400 mt-1">
          检阅麾下帅才、先锋与谋士，查看其生平绝技，并可拨赐钱粮进行军功封赏与属性擢升。
        </p>
      </div>

      {upgradeMsg && (
        <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-800 text-xs text-amber-200 flex items-center space-x-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{upgradeMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Generals List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-stone-400 px-1 font-serif">
            麾下勋贵阵容 ({gameState.recruitedGenerals.filter((g) => g.recruited).length} / {gameState.recruitedGenerals.length})
          </div>

          <div className="space-y-2">
            {gameState.recruitedGenerals.map((gen) => {
              const isSelected = gen.id === selectedGenId;
              const isRecruited = gen.recruited;

              return (
                <div
                  key={gen.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedGenId(gen.id);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    !isRecruited
                      ? 'opacity-40 bg-stone-950/50 border-stone-800 hover:border-stone-700'
                      : isSelected
                      ? 'bg-amber-950/70 border-amber-500 shadow-lg shadow-amber-950/50 scale-[1.01]'
                      : 'bg-stone-900/80 border-stone-800 hover:border-amber-900/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-serif text-base ${
                        isRecruited
                          ? isSelected
                            ? 'bg-amber-600 text-stone-950 border border-amber-300'
                            : 'bg-stone-800 text-amber-200 border border-amber-900/60'
                          : 'bg-stone-900 text-stone-600 border border-stone-800'
                      }`}
                    >
                      {gen.avatar}
                    </div>

                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm font-bold text-stone-100 font-serif">{gen.name}</span>
                        {!isRecruited && (
                          <span className="text-[10px] text-stone-500 flex items-center space-x-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>第{gen.unlockedAtChapter}卷归顺</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400">{gen.title}</div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-stone-600'}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Selected General Details */}
        {selectedGen && (
          <div className="lg:col-span-8 bg-stone-900/90 border border-amber-900/40 rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-800 pb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-700 via-red-950 to-stone-950 border-2 border-amber-500/70 flex items-center justify-center text-amber-200 text-2xl font-bold font-serif shadow-xl">
                  {selectedGen.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black text-amber-100 font-serif">{selectedGen.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80">
                      {selectedGen.title}
                    </span>
                  </div>
                  {selectedGen.courtesyName && (
                    <div className="text-xs text-stone-400 mt-0.5 font-serif">{selectedGen.courtesyName}</div>
                  )}
                  <div className="text-xs text-emerald-400 mt-1">
                    {selectedGen.recruited ? '● 正在大营效命中' : '○ 尚未出仕招募'}
                  </div>
                </div>
              </div>

              {/* Upgrade Button */}
              {selectedGen.recruited && (
                <button
                  disabled={gameState.resources.silver < 80 || gameState.resources.grain < 50}
                  onClick={() => handleUpgrade(selectedGen)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 text-amber-100 border border-amber-500/60 text-xs font-bold font-serif shadow-lg flex items-center space-x-1.5 transition disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>军功赏赐 (耗白银80两 粮草50担)</span>
                </button>
              )}
            </div>

            {/* Combat Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block font-serif">最大生命 (HP)</span>
                <span className="text-base font-bold text-emerald-400">{selectedGen.hp} / {selectedGen.maxHp}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block font-serif">统兵战意 / 武力</span>
                <span className="text-base font-bold text-red-400">{selectedGen.attack} 点</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block font-serif">铁甲坚韧 / 统御</span>
                <span className="text-base font-bold text-blue-400">{selectedGen.defense} 点</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block font-serif">行军机动 / 身法</span>
                <span className="text-base font-bold text-amber-400">{selectedGen.speed} 点</span>
              </div>
            </div>

            {/* Biography */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-amber-300 font-serif">【青史本纪与列传】</div>
              <p className="text-xs text-stone-300 leading-relaxed font-serif p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80">
                {selectedGen.bio}
              </p>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-amber-300 font-serif">【征战绝技与特长】</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedGen.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-3 rounded-xl bg-stone-950/70 border border-amber-900/30 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-200 font-serif">{skill.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                        {skill.cost === 0 ? '平攻蓄气' : `耗气 ${skill.cost}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed font-serif">
                      {skill.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
