import React from 'react';
import { StudentMenuChoice } from '../types';
import { Users, LayoutGrid, Shield, Sparkles, ArrowRight } from 'lucide-react';

interface StudentMenuHubProps {
  totalStudents?: number;
  boysCount?: number;
  girlsCount?: number;
  onSelectMenu?: (menu: StudentMenuChoice) => void;
  onSelectGroupFormation?: () => void;
  onSelectSeating?: () => void;
  onBackToZeroSettings?: () => void;
}

export const StudentMenuHub: React.FC<StudentMenuHubProps> = ({
  totalStudents = 36,
  boysCount = 18,
  girlsCount = 18,
  onSelectMenu,
  onSelectGroupFormation,
  onSelectSeating,
  onBackToZeroSettings,
}) => {
  const handleGroupFormation = () => {
    if (onSelectGroupFormation) {
      onSelectGroupFormation();
    } else if (onSelectMenu) {
      onSelectMenu('group_formation');
    }
  };

  const handleSeatArrangement = () => {
    if (onSelectSeating) {
      onSelectSeating();
    } else if (onSelectMenu) {
      onSelectMenu('seat_arrangement');
    }
  };
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200/80 rounded-full text-indigo-700 text-xs font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span>生徒用メニュー</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          班編成 ＆ 席替えジェネレーター
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          行いたい操作を選んでください。クラス全員（{totalStudents}名：男子{boysCount}名 / 女子{girlsCount}名）の設定が準備されています。
        </p>
      </div>

      {/* 2 Main Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: 班編成 */}
        <div
          onClick={handleGroupFormation}
          id="btn-choice-group-formation"
          className="group relative bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between overflow-hidden text-left active:scale-98"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-100 transition-colors" />

          <div className="space-y-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <Users className="w-7 h-7" />
            </div>

            <div>
              <div className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">
                MENU 01
              </div>
              <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                班編成
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                生活班の数・班名・人数や各班の班長を設定し、メンバーをシャッフルして一覧表・役割分担票を作成します。
              </p>
            </div>

            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-indigo-600">
              <span>班編成を開始する</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 2: 席替え */}
        <div
          onClick={handleSeatArrangement}
          id="btn-choice-seat-arrangement"
          className="group relative bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between overflow-hidden text-left active:scale-98"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-100 transition-colors" />

          <div className="space-y-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <LayoutGrid className="w-7 h-7" />
            </div>

            <div>
              <div className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">
                MENU 02
              </div>
              <h2 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                席替え
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                市松模様や空席フリック調整、生活班のまとまりを自動計算！5秒間の演出付きでワクワクの席替えを実行します。
              </p>
            </div>

            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span>席替えを開始する</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
