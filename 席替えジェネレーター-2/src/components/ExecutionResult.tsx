import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Seat, Student, LifeGroup, PairRule, SeatingPattern, DISTINCT_GROUP_COLORS } from '../types';
import { solveSeating } from '../utils/solver';
import { evaluateLayoutQuality } from '../utils/checkerHelper';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Monitor, 
  Zap, 
  Sliders,
  Users
} from 'lucide-react';

interface ExecutionResultProps {
  totalStudents: number;
  boysCount: number;
  girlsCount: number;
  rows: number;
  columns: number;
  pattern: SeatingPattern;
  students: Student[];
  hasGroups: boolean;
  groups: LifeGroup[];
  pairRules: PairRule[];
  seats: Seat[];
  onUpdateSeats: (seats: Seat[]) => void;
  onBack: () => void;
  onBackToStudentHub?: () => void;
  onNext: () => void;
}

export const ExecutionResult: React.FC<ExecutionResultProps> = ({
  totalStudents,
  boysCount,
  girlsCount,
  rows,
  columns,
  pattern,
  students,
  hasGroups,
  groups,
  pairRules,
  seats,
  onUpdateSeats,
  onBack,
  onBackToStudentHub,
  onNext,
}) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [countdown, setCountdown] = useState<number>(5);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);
  const [, setViolations] = useState<string[]>([]);
  const [, setStats] = useState({ genderMismatches: 0, groupMismatches: 0 });
  const [currentDisplaySeats, setCurrentDisplaySeats] = useState<Seat[]>(seats);

  const finalSeatsRef = useRef<Seat[]>([]);
  const shuffleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const studentMap = useMemo(() => {
    return new Map<number, Student>(students.map(s => [s.id, s]));
  }, [students]);

  const groupMap = useMemo(() => {
    return new Map<number, LifeGroup>(groups.map(g => [g.id, g]));
  }, [groups]);

  // Evaluate checkerboard and group adjacency quality
  const layoutQuality = useMemo(() => {
    return evaluateLayoutQuality(currentDisplaySeats, studentMap, hasGroups);
  }, [currentDisplaySeats, studentMap, hasGroups]);

  // Clean up all timers safely
  const clearAllTimers = () => {
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }
    if (countIntervalRef.current) {
      clearInterval(countIntervalRef.current);
      countIntervalRef.current = null;
    }
  };

  // Finish animation and commit final seats
  const finishAndCommit = (finalComputedSeats: Seat[]) => {
    clearAllTimers();
    setCurrentDisplaySeats(finalComputedSeats);
    onUpdateSeats(finalComputedSeats);
    setIsAnimating(false);
    setCountdown(0);
  };

  // Execute solver with 5-second countdown animation
  const runGeneration = () => {
    clearAllTimers();
    setIsAnimating(true);
    setCountdown(5);
    setFlashEffect(true);

    // Calculate final solved optimal seats
    const result = solveSeating(
      totalStudents,
      boysCount,
      girlsCount,
      rows,
      columns,
      pattern,
      students,
      hasGroups,
      groups,
      true, // hasAvoidPairs
      pairRules,
      seats
    );

    finalSeatsRef.current = result.seats;
    setViolations(result.violations);
    setStats(result.stats);

    // Initial shuffle display during animation
    const assignableSeats = seats.filter((s) => !s.disabled);
    const assignedStudents = students.slice(0, assignableSeats.length);

    // High frequency shuffle animation (every 90ms)
    shuffleIntervalRef.current = setInterval(() => {
      const shuffled = [...assignedStudents].sort(() => 0.5 - Math.random());
      let sIdx = 0;
      const tempSeats = seats.map((seat) => {
        if (seat.disabled) return { ...seat };
        const student = shuffled[sIdx++];
        return {
          ...seat,
          studentId: student ? student.id : null,
        };
      });
      setCurrentDisplaySeats(tempSeats);
    }, 90);

    // 1-second countdown clock (from 5 down to 0)
    let currentCount = 5;
    countIntervalRef.current = setInterval(() => {
      currentCount -= 1;
      setCountdown(currentCount);

      if (currentCount <= 0) {
        finishAndCommit(finalSeatsRef.current);
      }
    }, 1000);
  };

  // Trigger on initial mount
  useEffect(() => {
    runGeneration();
    return () => {
      clearAllTimers();
    };
  }, []);

  // Quick flash effect reset
  useEffect(() => {
    if (flashEffect) {
      const timer = setTimeout(() => setFlashEffect(false), 400);
      return () => clearTimeout(timer);
    }
  }, [flashEffect]);

  // Skip countdown animation immediately
  const handleSkipAnimation = () => {
    if (finalSeatsRef.current && finalSeatsRef.current.length > 0) {
      finishAndCommit(finalSeatsRef.current);
    } else {
      clearAllTimers();
      setIsAnimating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 5-Second Fullscreen / Large Dramatic Countdown Overlay */}
      {isAnimating && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white select-none animate-in fade-in duration-300">
          <div className="flex flex-col items-center max-w-md w-full px-6 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-widest uppercase animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              席替えシャッフル中
            </div>

            {/* Huge Dynamic Countdown Counter */}
            <div className="relative flex items-center justify-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-indigo-500/30 flex items-center justify-center relative shadow-2xl shadow-indigo-500/20 bg-slate-900/60">
                <span className="text-7xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-indigo-400 tabular-nums animate-bounce">
                  {countdown}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-lg sm:text-xl font-black text-slate-100">
                新しい座席を決定しています...
              </p>
              <p className="text-xs sm:text-sm text-slate-400">
                班のまとまりや教室のバランスを自動計算中
              </p>
            </div>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkipAnimation}
              id="btn-skip-countdown"
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>スキップして確定する</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner with Quality Assessments */}
      {!isAnimating && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-100 text-emerald-700">
                    自動配置完了
                  </span>
                  <span className="text-xs text-slate-400">
                    座席配置が最適化されました
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  新しい座席配置が完成しました！
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={runGeneration}
              id="btn-regenerate-seating"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>もう一度シャッフル（再生成）</span>
            </button>
          </div>

          {/* Quality Assessment Cards (Checkerboard & Group Adjacency) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Checkerboard Evaluation Card */}
            <div className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
              layoutQuality.isCheckerComplete 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50/90 border-amber-200 text-amber-950'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                layoutQuality.isCheckerComplete ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {layoutQuality.isCheckerComplete ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-500">市松模様判定（男女交互）</div>
                <div className="text-sm font-black mt-0.5">
                  {layoutQuality.isCheckerComplete ? (
                    <span className="text-emerald-700">完全成立（男女が綺麗に交互配置されています）</span>
                  ) : (
                    <span className="text-amber-800">
                      崩れあり（{layoutQuality.brokenCheckerCount}席で同性が隣接・手動調整可能）
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Group Adjacency Evaluation Card */}
            {hasGroups ? (
              <div className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
                layoutQuality.isGroupContiguousComplete 
                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950' 
                  : 'bg-amber-50/90 border-amber-200 text-amber-950'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  layoutQuality.isGroupContiguousComplete ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {layoutQuality.isGroupContiguousComplete ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500">班メンバー隣接判定</div>
                  <div className="text-sm font-black mt-0.5">
                    {layoutQuality.isGroupContiguousComplete ? (
                      <span className="text-indigo-700">完全成立（全班まとまって配置されています）</span>
                    ) : (
                      <span className="text-amber-800">
                        離れている班あり（{layoutQuality.disconnectedGroupCount}席が分断・手動調整可能）
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 text-slate-500 font-bold text-xs">
                  -
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-400">班メンバー隣接判定</div>
                  <div className="text-sm font-bold text-slate-600 mt-0.5">班設定なし（個人配置モード）</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Classroom Seating Grid Visual */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 md:p-8 bg-slate-50/50 shadow-inner">
        {/* Blackboard & Teacher desk */}
        <div className="space-y-3 mb-8">
          <div className="w-4/5 mx-auto bg-slate-800 text-slate-100 py-2 rounded-lg text-center font-bold text-xs sm:text-sm shadow-md tracking-widest border-2 border-slate-700">
            黒板 (FRONT)
          </div>
          <div className="w-1/3 mx-auto bg-slate-200 text-slate-600 py-2 rounded-lg flex items-center justify-center gap-2 border border-slate-300 shadow-xs">
            <Monitor className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-extrabold tracking-widest">教卓</span>
          </div>
        </div>

        {/* Desks Grid */}
        <div className="relative">
          <div className="grid gap-2 sm:gap-3 mb-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div key={colIdx} className="text-center text-[10px] sm:text-xs font-bold text-slate-400 font-mono">
                {colIdx + 1}列
              </div>
            ))}
          </div>

          <div className="space-y-2 sm:space-y-3">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <div key={rowIdx} className="relative">
                <div className="absolute -left-10 sm:-left-12 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-bold text-slate-400 font-mono w-8 sm:w-10 text-right no-print">
                  {rowIdx + 1}行
                </div>

                <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                  {currentDisplaySeats
                    .filter((s) => s.row === rowIdx)
                    .map((seat) => {
                      const student = seat.studentId !== null ? studentMap.get(seat.studentId) : null;
                      const group = student?.groupId ? groupMap.get(student.groupId) : null;
                      const groupPalette = student?.groupId
                        ? DISTINCT_GROUP_COLORS[(student.groupId - 1) % DISTINCT_GROUP_COLORS.length]
                        : null;

                      // Student Desk Style: frame border reflects group color (or gender if no group)
                      let deskBgStyle: React.CSSProperties = {};

                      if (seat.disabled) {
                        deskBgStyle = {
                          backgroundColor: '#f1f5f9',
                          borderColor: '#cbd5e1',
                        };
                      } else if (hasGroups && groupPalette) {
                        // Frame border is the group color
                        deskBgStyle = {
                          backgroundColor: groupPalette.bgLight,
                          borderColor: groupPalette.border,
                          borderWidth: '2.5px',
                        };
                      } else if (student?.gender === 'boy') {
                        deskBgStyle = { backgroundColor: '#eff6ff', borderColor: '#3b82f6', borderWidth: '2.5px' };
                      } else if (student?.gender === 'girl') {
                        deskBgStyle = { backgroundColor: '#fff1f2', borderColor: '#f43f5e', borderWidth: '2.5px' };
                      } else {
                        deskBgStyle = { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: '2px' };
                      }

                      return (
                        <div
                          key={seat.id}
                          style={deskBgStyle}
                          className={`aspect-4/3 sm:aspect-video rounded-xl border-2 sm:border-3 flex flex-col justify-center items-center p-1.5 sm:p-2 relative transition-all duration-300 select-none shadow-2xs ${
                            seat.disabled ? 'border-dashed opacity-60' : 'hover:shadow-md'
                          }`}
                        >
                          {/* Group badge tag on the top left */}
                          {hasGroups && group && !seat.disabled && (
                            <div className="absolute top-1 left-1.5 flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: groupPalette?.hex }}
                              />
                              <span
                                className="text-[8px] sm:text-[9px] font-extrabold truncate max-w-[45px] sm:max-w-none"
                                style={{ color: groupPalette?.text }}
                              >
                                {group.name}
                              </span>
                            </div>
                          )}

                          {student ? (
                            <>
                              <span className="text-xs sm:text-sm leading-tight text-center truncate max-w-full text-slate-900 font-bold">
                                {student.name}
                              </span>
                              <span className="text-[9px] sm:text-[10px] font-mono mt-0.5 truncate max-w-full text-slate-500">
                                {student.furigana}
                              </span>
                            </>
                          ) : seat.disabled ? (
                            <span className="text-[10px] font-bold text-slate-400">✕ 空席</span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-350 italic">空席</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>条件設定に戻る</span>
          </button>

          {onBackToStudentHub && (
            <button
              type="button"
              onClick={onBackToStudentHub}
              id="btn-back-to-hub-step4"
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
          id="btn-next-to-manual-swap"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
        >
          <Sliders className="w-4 h-4" />
          <span>手動微調整に進む</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
