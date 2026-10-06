import React from 'react';
import { Student, LifeGroup, PairRule, DISTINCT_GROUP_COLORS } from '../types';
import { 
  ChevronLeft, 
  Sparkles, 
  Users, 
  RefreshCw, 
  ArrowRight, 
  MapPin, 
  Check, 
  Layers
} from 'lucide-react';

interface DetailedSettingsProps {
  students: Student[];
  hasGroups: boolean;
  groups: LifeGroup[];
  pairRules: PairRule[];
  onUpdateHasGroups: (has: boolean) => void;
  onUpdateGroups: (groups: LifeGroup[]) => void;
  onRefreshGroups?: () => void;
  onBack: () => void;
  onBackToStudentHub?: () => void;
  onNext: () => void;
}

export const DetailedSettings: React.FC<DetailedSettingsProps> = ({
  students,
  hasGroups,
  groups,
  pairRules,
  onUpdateHasGroups,
  onUpdateGroups,
  onRefreshGroups,
  onBack,
  onBackToStudentHub,
  onNext,
}) => {
  // Update group position preference
  const handleUpdateGroupPref = (
    groupId: number,
    prefRow: 'front' | 'back' | 'none',
    prefCol: 'left' | 'center' | 'right' | 'none'
  ) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, prefRow, prefCol };
      }
      return g;
    });
    onUpdateGroups(updated);
  };

  // Shuffle group spatial positions
  const handleShuffleGroupPositions = () => {
    const positions: Array<{ row: 'front' | 'back' | 'none'; col: 'left' | 'center' | 'right' | 'none' }> = [
      { row: 'front', col: 'left' },
      { row: 'front', col: 'center' },
      { row: 'front', col: 'right' },
      { row: 'back', col: 'left' },
      { row: 'back', col: 'center' },
      { row: 'back', col: 'right' },
    ];

    const shuffledPos = [...positions].sort(() => Math.random() - 0.5);

    const updated = groups.map((g, idx) => {
      const pos = shuffledPos[idx % shuffledPos.length];
      return {
        ...g,
        prefRow: pos.row,
        prefCol: pos.col,
      };
    });

    onUpdateGroups(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            詳細条件設定（生活班ブロック＆場所指定）
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            生活班ごとに教室内でまとまって着席するかどうかや、各班の配置エリア（前/後、左/中/右）を指定します。
          </p>
        </div>

        {/* 1. Group Block Toggle Switch */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              生活班ブロック配置の有無
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              生活班のメンバーが近くの席に集まるように配置します（※ゼロ設定より本画面の設定が優先されます）。
            </div>
          </div>

          <div className="flex bg-slate-200/80 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => onUpdateHasGroups(false)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !hasGroups ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              設定しない (バラバラ)
            </button>
            <button
              type="button"
              onClick={() => onUpdateHasGroups(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                hasGroups ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              設定する (班で固まる)
            </button>
          </div>
        </div>

        {/* 2. Group spatial locations (If enabled) */}
        {hasGroups && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  生活班の配置場所（前/後・左/中/右）
                </div>
                <div className="text-xs text-slate-500">
                  各班を座らせたい大まかなエリアを選択してください。
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onRefreshGroups && (
                  <button
                    type="button"
                    onClick={onRefreshGroups}
                    id="btn-refresh-groups-step3"
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer"
                    title="班編成を更新する"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>班編成を更新する</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleShuffleGroupPositions}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>班の配置をシャッフル</span>
                </button>
              </div>
            </div>

            {/* Groups cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {groups.map((group, idx) => {
                const palette = DISTINCT_GROUP_COLORS[idx % DISTINCT_GROUP_COLORS.length];
                const members = students.filter(s => s.groupId === group.id);

                return (
                  <div
                    key={group.id}
                    className="p-4 rounded-2xl border-2 space-y-3 bg-white shadow-xs"
                    style={{ borderColor: palette.border }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: palette.hex }}
                        />
                        <span className="font-bold text-sm text-slate-800">{group.name}</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: palette.bgLight, color: palette.text }}>
                        {members.length > 0 ? `${members.length}名` : '0名'}
                      </span>
                    </div>

                    {/* Member names list */}
                    {members.length > 0 && (
                      <div className="pt-1 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 mb-1">班メンバー:</div>
                        <div className="flex flex-wrap gap-1">
                          {members.map(std => {
                            const isLeader = std.id === group.boyLeaderId || std.id === group.girlLeaderId || std.id === group.leaderId;
                            return (
                              <span
                                key={std.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  std.gender === 'boy'
                                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                                }`}
                              >
                                {isLeader && <span className="text-[8px] text-amber-600 font-bold">◯ </span>}
                                {std.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">前後（縦）</label>
                        <select
                          value={group.prefRow || 'none'}
                          onChange={(e) =>
                            handleUpdateGroupPref(group.id, e.target.value as any, group.prefCol || 'none')
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-indigo-400"
                        >
                          <option value="none">指定なし</option>
                          <option value="front">前側（黒板側）</option>
                          <option value="back">後ろ側</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">左右（横）</label>
                        <select
                          value={group.prefCol || 'none'}
                          onChange={(e) =>
                            handleUpdateGroupPref(group.id, group.prefRow || 'none', e.target.value as any)
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-indigo-400"
                        >
                          <option value="none">指定なし</option>
                          <option value="left">左側（窓側）</option>
                          <option value="center">中央</option>
                          <option value="right">右側（廊下側）</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info summary */}
        <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-medium">
          <div>
            <strong>座席自動配置のポイント：</strong>
            <p className="mt-1 text-indigo-850 text-[11px] leading-relaxed">
              市松模様（男女交互）や生活班のまとまり、指定された前後・左右のエリア希望を考慮して、公平でバランスの取れた座席を自動生成します。
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            id="btn-back-to-pattern"
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>席パターン確認に戻る</span>
          </button>

          {onBackToStudentHub && (
            <button
              type="button"
              onClick={onBackToStudentHub}
              id="btn-back-to-hub-step3"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>生徒用画面に戻る</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onNext}
          id="btn-start-auto-arrange"
          className="flex items-center gap-2 px-7 py-3 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-200 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>席替えの自動配置を実行する</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
