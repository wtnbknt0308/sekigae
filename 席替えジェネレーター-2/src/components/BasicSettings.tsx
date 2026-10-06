import React, { useState } from 'react';
import { SeatingPattern, LifeGroup, Student, DISTINCT_GROUP_COLORS } from '../types';
import { 
  Users, 
  Grid, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  ExternalLink,
  Layers,
  Crown
} from 'lucide-react';

interface BasicSettingsProps {
  boysCount: number;
  girlsCount: number;
  columns: number;
  rows: number;
  pattern: SeatingPattern;
  groups?: LifeGroup[];
  students?: Student[];
  onRefreshGroups?: () => void;
  onBackToStudentHub?: () => void;
  onGoToGroupFormation?: () => void;
  onUpdateBoys: (count: number) => void;
  onUpdateGirls: (count: number) => void;
  onUpdateColumns: (cols: number) => void;
  onUpdateRows: (rows: number) => void;
  onUpdatePattern: (pattern: SeatingPattern) => void;
  onNext: () => void;
}

export const BasicSettings: React.FC<BasicSettingsProps> = ({
  boysCount,
  girlsCount,
  columns,
  rows,
  pattern,
  groups = [],
  students = [],
  onRefreshGroups,
  onBackToStudentHub,
  onGoToGroupFormation,
  onUpdateBoys,
  onUpdateGirls,
  onUpdateColumns,
  onUpdateRows,
  onUpdatePattern,
  onNext,
}) => {
  const totalStudents = boysCount + girlsCount;
  const capacity = columns * rows;
  const isCapacitySufficient = capacity >= totalStudents;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [showMemberDetails, setShowMemberDetails] = useState(true);

  // Group members calculation
  const safeGroups = groups && groups.length > 0 ? groups : [];
  const assignedStudentsCount = students.filter(s => s.groupId !== null && s.groupId !== undefined).length;

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefreshGroups) {
      onRefreshGroups();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshMessage(`最新の班編成（全${safeGroups.length}班・${assignedStudentsCount}名）を正常に呼び出しました！`);
      setTimeout(() => {
        setRefreshMessage(null);
      }, 4000);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Return to Student Screen button and Sync Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {onBackToStudentHub && (
          <button
            type="button"
            onClick={onBackToStudentHub}
            id="btn-back-to-hub-top"
            className="self-start flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>生徒用画面に戻る</span>
          </button>
        )}

        {/* Zero Settings Sync Indicator */}
        <div className="bg-indigo-50/70 border border-indigo-100 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs text-indigo-900 font-bold gap-3 grow sm:grow-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>名簿・座席設定 同期中</span>
          </div>
          <span className="bg-white text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 text-[10px]">
            生徒数: {totalStudents}名 / {capacity}席
          </span>
        </div>
      </div>

      {/* 席替えジェネレーター側 生活班の編成情報・呼び出し＆更新セクション */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                編成済み生活班の呼び出し・確認
              </h2>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                {safeGroups.length}班 編成済み
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              生活班編成ウィザードで決定した班名・メンバーを席替えに呼び出して利用します。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshClick}
              id="btn-refresh-groups"
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
              title="最新の班編成情報（班名と所属メンバー）を再取得して更新します"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>班編成を更新する</span>
            </button>

            {onGoToGroupFormation && (
              <button
                type="button"
                onClick={onGoToGroupFormation}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-indigo-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                title="班編成ウィザードを開いて新しい生活班を作成します"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>班編成を開く</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowMemberDetails(!showMemberDetails)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200"
              title={showMemberDetails ? 'メンバー詳細を折りたたむ' : 'メンバー詳細を表示する'}
            >
              {showMemberDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Refresh feedback toast */}
        {refreshMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{refreshMessage}</span>
          </div>
        )}

        {/* Groups Cards Grid */}
        {safeGroups.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {safeGroups.map((group, idx) => {
                const palette = DISTINCT_GROUP_COLORS[idx % DISTINCT_GROUP_COLORS.length];
                const members = students.filter(s => s.groupId === group.id);
                const boyLeader = group.boyLeaderId ? students.find(s => s.id === group.boyLeaderId) : null;
                const girlLeader = group.girlLeaderId ? students.find(s => s.id === group.girlLeaderId) : null;
                const legacyLeader = (!boyLeader && !girlLeader && group.leaderId) ? students.find(s => s.id === group.leaderId) : null;

                return (
                  <div
                    key={group.id}
                    className="p-3.5 rounded-xl border-2 bg-white shadow-2xs space-y-2 transition-all hover:shadow-xs"
                    style={{ borderColor: palette.border }}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: palette.hex }}
                        />
                        <span className="font-black text-sm text-slate-800">{group.name}</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: palette.bgLight, color: palette.text }}>
                        計 {members.length}名
                      </span>
                    </div>

                    {/* Leaders info if set */}
                    {(boyLeader || girlLeader || legacyLeader) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                        <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="font-bold text-slate-500">班長:</span>
                        {boyLeader && (
                          <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                            {boyLeader.name}
                          </span>
                        )}
                        {girlLeader && (
                          <span className="bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                            {girlLeader.name}
                          </span>
                        )}
                        {legacyLeader && (
                          <span className="bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                            {legacyLeader.name}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Member names list */}
                    {showMemberDetails && (
                      <div className="pt-1.5 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400">所属メンバー:</div>
                        {members.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {members.map(std => {
                              const isLeader = std.id === group.boyLeaderId || std.id === group.girlLeaderId || std.id === group.leaderId;
                              return (
                                <span
                                  key={std.id}
                                  className={`text-[11px] px-2 py-0.5 rounded-md border font-medium flex items-center gap-1 ${
                                    std.gender === 'boy'
                                      ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                                      : 'bg-rose-50/70 border-rose-200 text-rose-900'
                                  }`}
                                >
                                  {isLeader && <span className="text-[9px] text-amber-600 font-bold">◯</span>}
                                  <span>{std.name}</span>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">（メンバー未割当）</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
              <span>※ 席替えウィザードの第3ステップ「生活班配置設定」にて、班ごとに教室内で集まるよう自動配置できます。</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-600 font-medium">
              現在、編成された班データがありません。「班編成を開く」から班を編成するか、「班編成を更新する」ボタンを押して最新データを呼び出してください。
            </p>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          1. クラスの人数設定
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              男子の人数 (人)
            </label>
            <div className="relative rounded-lg shadow-xs">
              <input
                type="number"
                min="0"
                max="50"
                value={boysCount}
                onChange={(e) => onUpdateBoys(Math.max(0, parseInt(e.target.value) || 0))}
                className="block w-full rounded-lg border border-slate-200 py-2.5 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-lg font-semibold text-slate-800 text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              女子の人数 (人)
            </label>
            <div className="relative rounded-lg shadow-xs">
              <input
                type="number"
                min="0"
                max="50"
                value={girlsCount}
                onChange={(e) => onUpdateGirls(Math.max(0, parseInt(e.target.value) || 0))}
                className="block w-full rounded-lg border border-slate-200 py-2.5 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-lg font-semibold text-slate-800 text-center"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl flex flex-col justify-center items-center border border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              合計人数
            </span>
            <span className="text-3xl font-extrabold text-slate-800 mt-1">
              {totalStudents} <span className="text-sm font-normal text-slate-500">人</span>
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Grid className="w-5 h-5 text-indigo-500" />
          2. 教室の座席レイアウト設定
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1 flex justify-between">
              <span>最前列の席数 (列数 / 横の座席数)</span>
              <span className="text-indigo-600 font-bold">{columns} 列</span>
            </label>
            <p className="text-xs text-slate-400 mb-3">教室の横方向に並ぶ机の数です</p>
            <input
              type="range"
              min="2"
              max="10"
              value={columns}
              onChange={(e) => onUpdateColumns(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>2列</span>
              <span>10列</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1 flex justify-between">
              <span>最右列の席数 (行数 / 縦の座席数)</span>
              <span className="text-indigo-600 font-bold">{rows} 行</span>
            </label>
            <p className="text-xs text-slate-400 mb-3">教室の縦方向に並ぶ机の数です</p>
            <input
              type="range"
              min="2"
              max="10"
              value={rows}
              onChange={(e) => onUpdateRows(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>2行</span>
              <span>10行</span>
            </div>
          </div>
        </div>

        {/* Capacity Warning */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">座席の使用率</span>
            <span className={`text-sm font-bold ${isCapacitySufficient ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalStudents} / {capacity} 席 ({Math.round((totalStudents / capacity) * 100) || 0}%)
            </span>
          </div>
          
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                !isCapacitySufficient 
                  ? 'bg-rose-500' 
                  : (totalStudents / capacity) > 0.95 
                    ? 'bg-amber-500' 
                    : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, (totalStudents / capacity) * 100)}%` }}
            />
          </div>

          {!isCapacitySufficient && (
            <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">座席数が不足しています！</p>
                <p className="text-xs text-rose-600 mt-0.5">
                  現在の生徒数合計 ({totalStudents}人) に対して、設定された座席数 ({capacity}席) が足りません。列数または行数を増やしてください。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          3. 配置パターンの選択
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onUpdatePattern('random')}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              pattern === 'random'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-base font-bold ${pattern === 'random' ? 'text-indigo-900' : 'text-slate-800'}`}>
                男女ランダム
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pattern === 'random' ? 'border-indigo-600' : 'border-slate-300'}`}>
                {pattern === 'random' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              男子席・女子席の固定パターンを定めず、クラス全体に男女をランダムに配置します。
            </p>
          </button>

          <button
            type="button"
            onClick={() => onUpdatePattern('checkerboard')}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              pattern === 'checkerboard'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-base font-bold ${pattern === 'checkerboard' ? 'text-indigo-900' : 'text-slate-800'}`}>
                市松模様 (男女交互)
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pattern === 'checkerboard' ? 'border-indigo-600' : 'border-slate-300'}`}>
                {pattern === 'checkerboard' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              男女が隣り合って座るように、男子席と女子席を格子状に交互に配置します。
            </p>
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        {onBackToStudentHub ? (
          <button
            type="button"
            onClick={onBackToStudentHub}
            id="btn-back-to-hub-bottom"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>生徒用画面に戻る</span>
          </button>
        ) : <div />}

        <button
          type="button"
          onClick={onNext}
          disabled={!isCapacitySufficient || totalStudents === 0}
          className={`flex items-center gap-1.5 px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all ${
            isCapacitySufficient && totalStudents > 0
              ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] cursor-pointer'
              : 'bg-slate-300 cursor-not-allowed shadow-none'
          }`}
        >
          <span>座席パターンを確認する</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
