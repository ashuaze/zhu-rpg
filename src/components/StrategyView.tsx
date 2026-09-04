import React, { useState } from 'react';
import { GameState, StrategyPolicy } from '../types';
import { STRATEGY_POLICIES } from '../data/chapters';
import { sound } from '../utils/audio';
import { Landmark, Wheat, Coins, Users, Shield, Sparkles, AlertCircle, ShoppingBag, Plus } from 'lucide-react';

interface StrategyViewProps {
  gameState: GameState;
  onApplyPolicy: (policy: StrategyPolicy) => void;
  onBuyItem: (itemType: 'medicines' | 'rations' | 'bombs', cost: number) => void;
  onHealAllGenerals: () => void;
}

export const StrategyView: React.FC<StrategyViewProps> = ({
  gameState,
  onApplyPolicy,
  onBuyItem,
  onHealAllGenerals,
}) => {
  const [activeTab, setActiveTab] = useState<'policies' | 'market'>('policies');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handlePolicyClick = (policy: StrategyPolicy) => {
    // Check cost
    if (policy.cost.silver && gameState.resources.silver < policy.cost.silver) {
      sound.playGong();
      setFeedback(`白银不足！推行「${policy.title}」需 ${policy.cost.silver} 两白银。`);
      return;
    }
    if (policy.cost.grain && gameState.resources.grain < policy.cost.grain) {
      sound.playGong();
      setFeedback(`粮草不足！推行「${policy.title}」需 ${policy.cost.grain} 担粮草。`);
      return;
    }

    sound.playDrum();
    onApplyPolicy(policy);
    setFeedback(`推行大政「${policy.title}」奏效！四方响应，府库充盈！`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Strategy Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950 border border-amber-900/40 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-400">
            <Landmark className="w-4 h-4" />
            <span>帅府军政府 · 战略决断厅</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-100 font-serif tracking-wider mt-1">
            经略山河 · 治国安民
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-xl">
            “广积粮，高筑墙，缓称王。” 在这里调拨粮饷、修筑营盘、推行军屯政令、购置军需，为争夺天下打下坚实后盾。
          </p>
        </div>

        {/* Camp Rally Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (gameState.resources.grain < 30) {
                alert('粮草不足30担，无法犒赏全军！');
                return;
              }
              sound.playSkill();
              onHealAllGenerals();
              setFeedback('大犒三军！全军名将生命值全部回满！');
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-stone-800 hover:from-emerald-700 text-emerald-100 border border-emerald-600/50 text-xs font-bold font-serif shadow-lg flex items-center space-x-2 transition"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>犒赏三军 (耗粮30担·全员回满)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-800 pb-2">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('policies');
          }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold font-serif transition ${
            activeTab === 'policies'
              ? 'bg-amber-900/80 text-amber-100 border border-amber-700'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          太祖新政与军令
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('market');
          }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold font-serif transition flex items-center space-x-1.5 ${
            activeTab === 'market'
              ? 'bg-amber-900/80 text-amber-100 border border-amber-700'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>军械辎重采购</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-800/60 text-xs text-amber-200 flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tab 1: Policies */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STRATEGY_POLICIES.map((policy) => {
            const canAffordSilver = !policy.cost.silver || gameState.resources.silver >= policy.cost.silver;
            const canAffordGrain = !policy.cost.grain || gameState.resources.grain >= policy.cost.grain;
            const canAfford = canAffordSilver && canAffordGrain;

            return (
              <div
                key={policy.id}
                className="bg-stone-900/90 border border-amber-900/30 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-amber-700/60 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-amber-100 font-serif">{policy.title}</h3>
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      {policy.cost.silver && (
                        <span className="text-amber-400">-{policy.cost.silver}两白银</span>
                      )}
                      {policy.cost.grain && (
                        <span className="text-emerald-400">-{policy.cost.grain}担粮草</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 mt-2 leading-relaxed font-serif">
                    {policy.description}
                  </p>

                  <div className="mt-3 p-2 rounded bg-stone-950/80 border border-stone-800/80 text-[11px] text-amber-300/80 font-serif italic">
                    典故：{policy.historicalContext}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                  {/* Gain tags */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    {policy.gain.grain && (
                      <span className="text-emerald-300">+粮草 {policy.gain.grain}</span>
                    )}
                    {policy.gain.silver && (
                      <span className="text-amber-300">+军饷 {policy.gain.silver}</span>
                    )}
                    {policy.gain.troops && (
                      <span className="text-blue-300">+兵力 {policy.gain.troops}</span>
                    )}
                    {policy.gain.morale && (
                      <span className="text-rose-300">+民望 {policy.gain.morale}</span>
                    )}
                    {policy.gain.benevolent && (
                      <span className="text-emerald-400">+仁德 {policy.gain.benevolent}</span>
                    )}
                    {policy.gain.ruthless && (
                      <span className="text-rose-400">+铁血 {policy.gain.ruthless}</span>
                    )}
                  </div>

                  <button
                    disabled={!canAfford}
                    onClick={() => handlePolicyClick(policy)}
                    className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 disabled:opacity-30 disabled:hover:bg-amber-800 text-amber-100 text-xs font-bold font-serif shadow transition"
                  >
                    准奏颁行
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Military Market */}
      {activeTab === 'market' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Item 1: 金创药 */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-300 text-xl font-serif mb-3">
                药
              </div>
              <h3 className="text-base font-bold text-stone-100 font-serif">金创回春药</h3>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                军医秘制膏药。可在战阵中使用，立刻为全军将领恢复 180 点生命值。
              </p>
              <div className="mt-3 text-xs text-stone-400 font-mono">
                当前库存: <span className="text-amber-300 font-bold">{gameState.items.medicines} 瓶</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
              <span className="text-xs text-amber-400 font-mono font-bold">40 两白银</span>
              <button
                disabled={gameState.resources.silver < 40}
                onClick={() => {
                  sound.playClick();
                  onBuyItem('medicines', 40);
                  setFeedback('成功购入 1 份金创回春药！');
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700 text-xs font-bold transition flex items-center space-x-1 disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
                <span>购入</span>
              </button>
            </div>
          </div>

          {/* Item 2: 震天雷 */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-950 border border-red-700/60 flex items-center justify-center text-red-300 text-xl font-serif mb-3">
                雷
              </div>
              <h3 className="text-base font-bold text-stone-100 font-serif">铁壳震天雷</h3>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                神机营铸造的黑火药炸弹。战阵中使用，对敌方全军轰炸造成 160 点毁灭伤害。
              </p>
              <div className="mt-3 text-xs text-stone-400 font-mono">
                当前库存: <span className="text-amber-300 font-bold">{gameState.items.bombs} 枚</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
              <span className="text-xs text-amber-400 font-mono font-bold">60 两白银</span>
              <button
                disabled={gameState.resources.silver < 60}
                onClick={() => {
                  sound.playClick();
                  onBuyItem('bombs', 60);
                  setFeedback('成功采办 1 枚铁壳震天雷！');
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700 text-xs font-bold transition flex items-center space-x-1 disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
                <span>购入</span>
              </button>
            </div>
          </div>

          {/* Item 3: 犒军干粮 */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-700/60 flex items-center justify-center text-amber-300 text-xl font-serif mb-3">
                粮
              </div>
              <h3 className="text-base font-bold text-stone-100 font-serif">行军风干肉干粮</h3>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                淮西精制风干肉与炒米。使用可立即提升民望士气 15 点。
              </p>
              <div className="mt-3 text-xs text-stone-400 font-mono">
                当前库存: <span className="text-amber-300 font-bold">{gameState.items.rations} 包</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
              <span className="text-xs text-amber-400 font-mono font-bold">30 两白银</span>
              <button
                disabled={gameState.resources.silver < 30}
                onClick={() => {
                  sound.playClick();
                  onBuyItem('rations', 30);
                  setFeedback('采买行军干粮入库！');
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700 text-xs font-bold transition flex items-center space-x-1 disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
                <span>购入</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
