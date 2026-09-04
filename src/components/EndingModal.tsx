import React from 'react';
import { GameState } from '../types';
import { sound } from '../utils/audio';
import { Crown, Sparkles, Scroll, RotateCcw, Award } from 'lucide-react';

interface EndingModalProps {
  gameState: GameState;
  onRestart: () => void;
  onContinue: () => void;
}

export const EndingModal: React.FC<EndingModalProps> = ({
  gameState,
  onRestart,
  onContinue,
}) => {
  const isBenevolent = gameState.player.benevolent > gameState.player.ruthless + 15;
  const isRuthless = gameState.player.ruthless > gameState.player.benevolent + 15;

  let endingTitle = '大明开天行道承平日月高皇帝';
  let legacyText = '';
  let evaluation = '';

  if (isBenevolent) {
    endingTitle = '大明太祖 · 仁厚布衣圣君';
    evaluation = '轻徭薄赋，与民休息。保护元勋功臣，善待天下黎庶，天下士农工商皆安居乐业。';
    legacyText = '你秉持发妻马皇后与大儒宋濂之仁心，废除苛政，薄赋恤民。民间立祠感念太祖从乞僧起家却不忘苍生之恩，史称“洪武仁治”。';
  } else if (isRuthless) {
    endingTitle = '大明太祖 · 震古烁今铁血霸皇';
    evaluation = '严刑峻法，重典肃贪。设立锦衣亲军，剥皮实草以绝贪墨，集权专制臻于极峰。';
    legacyText = '你以雷霆万钧之势肃清天下贪官污吏，文武百官战战兢兢、早出晚归不敢有欺瞒。漠北残元闻风丧胆，后世叹为“铁血天子，威震万邦”。';
  } else {
    endingTitle = '大明太祖 · 兼济刚柔一代雄主';
    evaluation = '仁以安民，法以惩贪。文武兼济，日月重开，驱逐蒙元，开创近三百年之盛明！';
    legacyText = '你一手持仁德之盾庇护寒士黎庶，一手握铁血之剑诛灭乱臣贼子。文治武功皆冠绝百代，实现了从行乞和尚到千古一帝的旷世传奇！';
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-8 bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
        {/* Ambient Crest */}
        <div className="absolute top-2 right-2 text-stone-800/30 text-9xl font-black font-serif pointer-events-none select-none">
          明
        </div>

        {/* Crown Icon */}
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 via-red-800 to-amber-400 border-2 border-amber-300 flex items-center justify-center shadow-xl">
          <Crown className="w-10 h-10 text-amber-100" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-amber-400 font-serif">
            大明洪武 · 终章御笔定谥
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-100 font-serif tracking-wider">
            {endingTitle}
          </h2>
          <p className="text-xs text-stone-400 font-serif">
            庙号：【明太祖】 • 谥号：【开天行道肇纪立极大圣至神仁文义武俊德成功高皇帝】
          </p>
        </div>

        {/* Statistics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-950/80 p-4 rounded-2xl border border-amber-900/40 text-xs font-mono">
          <div>
            <span className="text-stone-500 block text-[10px] font-serif">历经岁月</span>
            <span className="text-amber-300 font-bold">{gameState.turnCount} 月春秋</span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px] font-serif">天下仓廪</span>
            <span className="text-emerald-400 font-bold">{gameState.resources.grain} 担粮</span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px] font-serif">归心名将</span>
            <span className="text-blue-400 font-bold">
              {gameState.recruitedGenerals.filter((g) => g.recruited).length} 员柱石
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[10px] font-serif">帝王之道</span>
            <span className="text-rose-400 font-bold">
              仁{gameState.player.benevolent} / 铁{gameState.player.ruthless}
            </span>
          </div>
        </div>

        {/* Narrative Legacy */}
        <div className="text-left bg-stone-950/60 p-5 rounded-2xl border border-stone-800 space-y-3 font-serif">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
            <Scroll className="w-4 h-4 text-amber-400" />
            <span>【皇明本纪·史官总论】</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed indent-6">
            {evaluation}
          </p>
          <p className="text-xs text-stone-400 leading-relaxed indent-6 italic">
            {legacyText}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              sound.playClick();
              onContinue();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-800/80 hover:bg-amber-700 text-amber-100 font-bold font-serif text-sm border border-amber-600 transition"
          >
            继续治世摄政 (自由沙盘)
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold font-serif text-sm border border-stone-700 transition flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重温开国风云 (再起义旗)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
