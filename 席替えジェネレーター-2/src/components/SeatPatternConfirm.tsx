import React, { useState, useRef, useEffect } from 'react';
import { Seat, SeatingPattern } from '../types';
import { regenerateCheckerboardPattern } from '../utils/solver';
import { 
  ChevronLeft, 
  ChevronRight, 
  Monitor, 
  User, 
  Sparkles, 
  RefreshCw, 
  Ban, 
  Check, 
  AlertTriangle, 
  Info,
  Layers,
  Hand,
  CheckCircle2,
  Users
} from 'lucide-react';

interface SeatPatternConfirmProps {
  rows: number;
  columns: number;
  pattern: SeatingPattern;
  seats: Seat[];
  boysCount: number;
  girlsCount: number;
  onUpdatePattern: (pattern: SeatingPattern) => void;
  onUpdateSeats: (seats: Seat[]) => void;
  onBack: () => void;
  onBackToStudentHub?: () => void;
  onNext: () => void;
}

export const SeatPatternConfirm: React.FC<SeatPatternConfirmProps> = ({
  rows,
  columns,
  pattern,
  seats,
  boysCount,
  girlsCount,
  onUpdatePattern,
  onUpdateSeats,
  onBack,
  onBackToStudentHub,
  onNext,
}) => {
  const totalStudents = boysCount + girlsCount;
  const capacity = rows * columns;
  
  // Count active vs disabled seats
  const disabledSeatsCount = seats.filter(s => s.disabled).length;
  const activeSeatsCount = capacity - disabledSeatsCount;
  const boySeatsCount = seats.filter(s => !s.disabled && s.genderPattern === 'boy').length;
  const girlSeatsCount = seats.filter(s => !s.disabled && s.genderPattern === 'girl').length;

  // Interaction state for flick/drag selection
  const [isPointerDown, setIsPointerDown] = useState(false);
  const targetModeRef = useRef<boolean | null>(null); // true = turning into disabled, false = enabling
  const touchedSeatIdsRef = useRef<Set<string>>(new Set());
  const [justGenerated, setJustGenerated] = useState(false);

  // Global pointer up listener
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setIsPointerDown(false);
      targetModeRef.current = null;
      touchedSeatIdsRef.current.clear();
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    window.addEventListener('touchcancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
      window.removeEventListener('touchcancel', handleGlobalPointerUp);
    };
  }, []);

  // Toggle seat disabled state
  const setSeatDisabled = (seatId: string, disabledValue: boolean) => {
    const targetSeat = seats.find(s => s.id === seatId);
    if (!targetSeat || targetSeat.disabled === disabledValue) return;

    const updated = seats.map(s => {
      if (s.id === seatId) {
        return {
          ...s,
          disabled: disabledValue,
          studentId: null,
        };
      }
      return s;
    });

    onUpdateSeats(updated);
  };

  // Start gesture
  const handlePointerDown = (seat: Seat) => {
    setIsPointerDown(true);
    const newDisabledState = !seat.disabled;
    targetModeRef.current = newDisabledState;
    touchedSeatIdsRef.current.clear();
    touchedSeatIdsRef.current.add(seat.id);

    setSeatDisabled(seat.id, newDisabledState);
  };

  // Drag over another seat with mouse/pointer
  const handlePointerEnter = (seatId: string) => {
    if (!isPointerDown || targetModeRef.current === null) return;
    if (touchedSeatIdsRef.current.has(seatId)) return;

    touchedSeatIdsRef.current.add(seatId);
    setSeatDisabled(seatId, targetModeRef.current);
  };

  // Touch move flick gesture
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPointerDown || targetModeRef.current === null) return;
    const touch = e.touches[0];
    if (!touch) return;

    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    const seatElement = element.closest('[data-seat-id]');
    if (seatElement) {
      const seatId = seatElement.getAttribute('data-seat-id');
      if (seatId && !touchedSeatIdsRef.current.has(seatId)) {
        touchedSeatIdsRef.current.add(seatId);
        setSeatDisabled(seatId, targetModeRef.current);
      }
    }
  };

  // Generate pattern button (Only active when activeSeatsCount === totalStudents or valid)
  const handleGeneratePattern = () => {
    const updated = regenerateCheckerboardPattern(seats, boysCount, girlsCount, pattern);
    onUpdateSeats(updated);
    setJustGenerated(true);
    setTimeout(() => setJustGenerated(false), 2000);
  };

  // Reset: Enable all seats
  const handleEnableAllSeats = () => {
    const updated = seats.map(s => ({ ...s, disabled: false }));
    const withPattern = regenerateCheckerboardPattern(updated, boysCount, girlsCount, pattern);
    onUpdateSeats(withPattern);
  };

  // Auto-disable excess seats from back row
  const handleAutoAdjustSeats = () => {
    if (capacity < totalStudents) return;
    const neededDisables = capacity - totalStudents;
    
    // Sort seats from back to front, right to left to disable
    const sorted = [...seats].sort((a, b) => {
      if (b.row !== a.row) return b.row - a.row;
      return b.col - a.col;
    });

    const disableIds = new Set(sorted.slice(0, neededDisables).map(s => s.id));
    const updated = seats.map(s => ({
      ...s,
      disabled: disableIds.has(s.id),
      studentId: null,
    }));

    const withPattern = regenerateCheckerboardPattern(updated, boysCount, girlsCount, pattern);
    onUpdateSeats(withPattern);
  };

  const isExactMatch = activeSeatsCount === totalStudents;
  const isSeatShortage = activeSeatsCount < totalStudents;

  return (
    <div className="space-y-6">
      {/* Top Controls Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            パターン選択・使用しない席の除外設定
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ① まず配置パターンを選択し、② フリックやタップで使用しない席を選択します。席数がクラス人数と一致したら「パターン生成」を押してください。
          </p>
        </div>

        {/* Step 1: Pattern selection */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-700">1. 配置パターンの選択</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => {
                onUpdatePattern('checkerboard');
                const updated = regenerateCheckerboardPattern(seats, boysCount, girlsCount, 'checkerboard');
                onUpdateSeats(updated);
              }}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                pattern === 'checkerboard'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                  {pattern === 'checkerboard' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">市松模様（男女交互）</div>
                  <div className="text-xs text-slate-500 mt-0.5">男女が隣り合わないよう交互に配置</div>
                </div>
              </div>
              <Sparkles className={`w-5 h-5 ${pattern === 'checkerboard' ? 'text-indigo-600' : 'text-slate-300'}`} />
            </div>

            <div
              onClick={() => {
                onUpdatePattern('random');
                const updated = regenerateCheckerboardPattern(seats, boysCount, girlsCount, 'random');
                onUpdateSeats(updated);
              }}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                pattern === 'random'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                  {pattern === 'random' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">ランダム（性別不問）</div>
                  <div className="text-xs text-slate-500 mt-0.5">男女の交互条件なしで自由に配置</div>
                </div>
              </div>
              <Sparkles className={`w-5 h-5 ${pattern === 'random' ? 'text-indigo-600' : 'text-slate-300'}`} />
            </div>
          </div>
        </div>

        {/* Real-time Status / Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400">クラス生徒数</div>
            <div className="text-base sm:text-lg font-black text-slate-800 mt-0.5">
              {totalStudents} <span className="text-xs font-normal text-slate-500">人 (男{boysCount}/女{girlsCount})</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400">使用しない席 (空席)</div>
            <div className="text-base sm:text-lg font-black text-slate-600 mt-0.5">
              {disabledSeatsCount} <span className="text-xs font-normal text-slate-400">席除外</span>
            </div>
          </div>

          <div className={`p-3 rounded-lg border shadow-2xs ${
            isSeatShortage
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : isExactMatch
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="text-[11px] font-bold opacity-80">有効座席数</div>
            <div className="text-base sm:text-lg font-black mt-0.5">
              {activeSeatsCount} <span className="text-xs font-normal">席</span>
            </div>
          </div>

          <div className="flex items-center justify-center p-1">
            <button
              type="button"
              onClick={handleGeneratePattern}
              id="btn-generate-pattern"
              disabled={isSeatShortage}
              className={`w-full h-full min-h-[48px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 ${
                isExactMatch
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer ring-2 ring-indigo-300 animate-pulse'
                  : isSeatShortage
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 cursor-pointer'
              }`}
            >
              {justGenerated ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  生成完了！
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  パターン生成
                </>
              )}
            </button>
          </div>
        </div>

        {/* Capacity evaluation alert */}
        <div>
          {isSeatShortage ? (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs sm:text-sm font-medium">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong>座席が不足しています：</strong> 生徒数（{totalStudents}人）に対して有効な席（{activeSeatsCount}席）が <strong>{totalStudents - activeSeatsCount} 席</strong> 足りません。空席除外を解除してください。
              </div>
            </div>
          ) : isExactMatch ? (
            <div className="flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-medium">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>座席数と生徒数がぴったり一致しています！</strong> 「パターン生成」ボタンを押して男女比を反映した配置を確認し、詳細設定へ進んでください。
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-xl text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-600 shrink-0" />
                <div>
                  生徒数（{totalStudents}人）に対して席が <strong>{activeSeatsCount - totalStudents} 席</strong> 余っています。後方や端の席を除外するか、「自動調整」を押してください。
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutoAdjustSeats}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs shadow-xs shrink-0 cursor-pointer active:scale-95 transition-all"
              >
                生徒数に自動調整する
              </button>
            </div>
          )}
        </div>

        {/* Interactive Guide Banner */}
        <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-medium">
          <div className="flex items-center gap-2">
            <Hand className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
            <span>
              <strong>フリック操作のヒント：</strong> 席をクリック／タップするか、指・マウスで続けてなぞる（フリック）と連続して空席のON/OFFが切り替えられます。
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {capacity > totalStudents && activeSeatsCount !== totalStudents && (
              <button
                type="button"
                onClick={handleAutoAdjustSeats}
                className="text-xs text-indigo-700 underline font-bold hover:text-indigo-900"
              >
                自動で揃える
              </button>
            )}
            {disabledSeatsCount > 0 && (
              <button
                type="button"
                onClick={handleEnableAllSeats}
                className="text-xs text-amber-800 underline font-bold hover:text-amber-950"
              >
                全席を戻す
              </button>
            )}
          </div>
        </div>

        {/* Virtual Classroom Frame */}
        <div 
          className="border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 bg-slate-50/50 shadow-inner max-w-4xl mx-auto select-none touch-none"
          onTouchMove={handleTouchMove}
        >
          {/* Black Board & Teacher Desk */}
          <div className="space-y-3 mb-8">
            <div className="w-4/5 mx-auto bg-slate-800 text-slate-100 py-2 rounded-lg text-center font-bold text-xs sm:text-sm shadow-md tracking-widest border-2 border-slate-700">
              黒板 (FRONT)
            </div>

            <div className="w-1/3 mx-auto bg-slate-200 text-slate-600 py-2 rounded-lg flex items-center justify-center gap-2 border border-slate-300 shadow-xs">
              <Monitor className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-extrabold tracking-widest">教卓</span>
            </div>
          </div>

          {/* Student Desks Grid Container */}
          <div className="relative">
            <div className="grid gap-2 sm:gap-3 mb-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <div key={colIdx} className="text-center text-[10px] sm:text-xs font-bold text-slate-400 font-mono">
                  {colIdx + 1}列
                </div>
              ))}
            </div>

            {/* Row-by-Row Grid */}
            <div className="space-y-2 sm:space-y-3">
              {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="relative">
                  <div className="absolute -left-10 sm:-left-12 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-bold text-slate-400 font-mono w-8 sm:w-10 text-right no-print">
                    {rowIdx + 1}行
                  </div>

                  <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                    {seats
                      .filter((s) => s.row === rowIdx)
                      .map((seat) => {
                        const isDisabled = !!seat.disabled;
                        const isBoy = seat.genderPattern === 'boy';
                        const isGirl = seat.genderPattern === 'girl';

                        let bgClass = '';
                        let textLabel = '';
                        let icon = null;

                        if (isDisabled) {
                          bgClass = 'bg-slate-200/80 border-dashed border-slate-350 text-slate-400 hover:bg-slate-250';
                          textLabel = '使用しない (空席)';
                          icon = <Ban className="w-4 h-4 text-slate-400 mb-0.5" />;
                        } else if (pattern === 'checkerboard') {
                          if (isBoy) {
                            bgClass = 'bg-blue-50/90 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400';
                            textLabel = '男子席';
                            icon = <User className="w-4 h-4 text-blue-500 mb-0.5" />;
                          } else if (isGirl) {
                            bgClass = 'bg-rose-50/90 border-rose-300 text-rose-700 hover:bg-rose-100 hover:border-rose-400';
                            textLabel = '女子席';
                            icon = <User className="w-4 h-4 text-rose-500 mb-0.5" />;
                          } else {
                            bgClass = 'bg-slate-50 border-slate-250 text-slate-600 hover:bg-slate-100';
                            textLabel = '不問';
                            icon = <User className="w-4 h-4 text-slate-400 mb-0.5" />;
                          }
                        } else {
                          bgClass = 'bg-slate-50 border-slate-250 text-slate-600 hover:bg-slate-100';
                          textLabel = 'ランダム';
                          icon = <User className="w-4 h-4 text-slate-400 mb-0.5" />;
                        }

                        return (
                          <div
                            key={seat.id}
                            data-seat-id={seat.id}
                            id={`seat-pattern-cell-${seat.id}`}
                            onPointerDown={() => handlePointerDown(seat)}
                            onPointerEnter={() => handlePointerEnter(seat.id)}
                            className={`aspect-4/3 sm:aspect-video rounded-xl border-2 flex flex-col justify-center items-center p-1 sm:p-2 transition-all cursor-pointer select-none active:scale-95 shadow-2xs ${bgClass} ${
                              isDisabled ? 'opacity-70 saturate-50' : 'opacity-100'
                            }`}
                            title={isDisabled ? 'クリック／フリックで使用可能に戻す' : 'クリック／フリックで使用しない席（空席）にする'}
                          >
                            {icon}
                            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight text-center leading-tight truncate max-w-full">
                              {textLabel}
                            </span>
                            <span className="text-[8px] sm:text-[9px] opacity-60 mt-0.5 font-mono">
                              {seat.row + 1}-{seat.col + 1}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400 font-medium">
            ※ 上側が最前列（黒板・教卓側）、下側が最後列になります。
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            id="btn-back-to-step1"
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>席数設定に戻る</span>
          </button>

          {onBackToStudentHub && (
            <button
              type="button"
              onClick={onBackToStudentHub}
              id="btn-back-to-hub-step2"
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
          id="btn-next-to-detailed"
          disabled={isSeatShortage}
          className={`flex items-center gap-1 px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all ${
            isSeatShortage
              ? 'bg-slate-300 cursor-not-allowed opacity-60'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 cursor-pointer shadow-indigo-100'
          }`}
        >
          <span>詳細条件設定に進む</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
