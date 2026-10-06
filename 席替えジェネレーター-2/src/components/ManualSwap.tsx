import React, { useState, useMemo } from 'react';
import { Seat, Student, LifeGroup, DISTINCT_GROUP_COLORS } from '../types';
import { evaluateLayoutQuality } from '../utils/checkerHelper';
import { 
  ChevronLeft, 
  ChevronRight, 
  Monitor, 
  RefreshCw as SwapIcon, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Users
} from 'lucide-react';

interface ManualSwapProps {
  students: Student[];
  seats: Seat[];
  hasGroups: boolean;
  groups: LifeGroup[];
  columns: number;
  rows: number;
  onUpdateSeats: (seats: Seat[]) => void;
  onBack: () => void;
  onBackToStudentHub?: () => void;
  onNext: () => void;
}

export const ManualSwap: React.FC<ManualSwapProps> = ({
  students,
  seats,
  hasGroups,
  groups,
  columns,
  rows,
  onUpdateSeats,
  onBack,
  onBackToStudentHub,
  onNext,
}) => {
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);

  const studentMap = useMemo(() => {
    return new Map<number, Student>(students.map(s => [s.id, s]));
  }, [students]);

  const groupMap = useMemo(() => {
    return new Map<number, LifeGroup>(groups.map(g => [g.id, g]));
  }, [groups]);

  // Real-time evaluation of layout quality (checkerboard + group adjacency)
  const layoutQuality = useMemo(() => {
    return evaluateLayoutQuality(seats, studentMap, hasGroups);
  }, [seats, studentMap, hasGroups]);

  // Handle seat selection and swapping
  const handleSeatClick = (seatId: string) => {
    if (selectedSeatId === null) {
      // Select the first seat
      setSelectedSeatId(seatId);
    } else {
      // If clicking the same seat, deselect
      if (selectedSeatId === seatId) {
        setSelectedSeatId(null);
        return;
      }

      // Perform swap between selectedSeatId and seatId
      const newSeats = seats.map(s => ({ ...s }));
      const seatA = newSeats.find(s => s.id === selectedSeatId);
      const seatB = newSeats.find(s => s.id === seatId);

      if (seatA && seatB) {
        const tempStudentId = seatA.studentId;
        seatA.studentId = seatB.studentId;
        seatB.studentId = tempStudentId;
        onUpdateSeats(newSeats);
      }

      setSelectedSeatId(null);
    }
  };

  const isSelected = (seatId: string) => selectedSeatId === seatId;

  const selectedSeatObj = useMemo(() => {
    if (!selectedSeatId) return null;
    return seats.find(s => s.id === selectedSeatId) || null;
  }, [selectedSeatId, seats]);

  const selectedStudentObj = useMemo(() => {
    if (!selectedSeatObj || selectedSeatObj.studentId === null) return null;
    return studentMap.get(selectedSeatObj.studentId) || null;
  }, [selectedSeatObj, studentMap]);

  return (
    <div className="space-y-6">
      {/* Top Helper Banner & Realtime Quality Indicators */}
      <div className="space-y-3">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <SwapIcon className="w-5 h-5 text-indigo-600" />
              座席の手動入れ替え（タップ／クリック調整）
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              入れ替えたい２つの席を順番にクリックすると、席が即座に入れ替わります。
            </p>
            {/* Legend chip */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1 font-bold text-[11px]">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                要調整タグの見方:
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                <span className="bg-rose-700 text-white text-[9px] px-1 rounded font-black">市松</span>
                男女の交互配置が崩れている席
              </span>
              {hasGroups && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  <span className="bg-amber-600 text-white text-[9px] px-1 rounded font-black">班</span>
                  同じ班の仲間から離れている席
                </span>
              )}
            </div>
          </div>

          {/* Selection Status pill */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs shrink-0 self-start sm:self-center">
            {selectedSeatId ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="font-bold text-amber-900">
                  選択中: {selectedStudentObj ? selectedStudentObj.name : '空席'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSeatId(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-1 cursor-pointer"
                >
                  解除
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>入れ替える席をクリックしてください</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Status Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-bold ${
            layoutQuality.isCheckerComplete 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}>
            {layoutQuality.isCheckerComplete ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>
              市松模様: {layoutQuality.isCheckerComplete ? '完全成立（OK）' : `同性隣接あり（${layoutQuality.brokenCheckerCount}席に【市松】表示）`}
            </span>
          </div>

          {hasGroups ? (
            <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-bold ${
              layoutQuality.isGroupContiguousComplete 
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}>
              {layoutQuality.isGroupContiguousComplete ? (
                <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>
                班隣接: {layoutQuality.isGroupContiguousComplete ? '全班まとまり良好（OK）' : `分断あり（${layoutQuality.disconnectedGroupCount}席に【班】表示）`}
              </span>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 flex items-center gap-2">
              <span>班設定: なし</span>
            </div>
          )}
        </div>
      </div>

      {/* Classroom Seating Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 bg-slate-50/50 shadow-inner">
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
                  {seats
                    .filter((s) => s.row === rowIdx)
                    .map((seat) => {
                      const student = seat.studentId !== null ? studentMap.get(seat.studentId) : null;
                      const group = student?.groupId ? groupMap.get(student.groupId) : null;
                      const groupPalette = student?.groupId
                        ? DISTINCT_GROUP_COLORS[(student.groupId - 1) % DISTINCT_GROUP_COLORS.length]
                        : null;

                      const isCurrentSelected = isSelected(seat.id);
                      const isBrokenChecker = Boolean(student && layoutQuality.brokenCheckerSeatIds.has(seat.id));
                      const isDisconnectedGroup = Boolean(student && layoutQuality.disconnectedGroupSeatIds.has(seat.id));
                      const isAttentionNeeded = isBrokenChecker || isDisconnectedGroup;

                      // Desk style setup
                      let deskBgStyle: React.CSSProperties = {};
                      let customBorderClass = '';

                      if (isCurrentSelected) {
                        deskBgStyle = {
                          backgroundColor: '#fef3c7', // amber-100
                          borderColor: '#f59e0b', // amber-500
                        };
                        customBorderClass = 'ring-4 ring-amber-400/60 border-amber-500 scale-95 shadow-lg z-20';
                      } else if (seat.disabled) {
                        customBorderClass = 'border-dashed border-slate-350 bg-slate-200/70 opacity-60';
                      } else if (hasGroups && groupPalette) {
                        // Frame border is the group color
                        if (isAttentionNeeded) {
                          // Darken / enhance color for students not satisfying checkerboard or group adjacency
                          deskBgStyle = {
                            backgroundColor: groupPalette.hex, // Rich deep color
                            borderColor: groupPalette.border,
                            borderWidth: '3px',
                          };
                          customBorderClass = 'shadow-md ring-2 ring-rose-400/70';
                        } else {
                          // Standard pleasant pastel background with group border
                          deskBgStyle = {
                            backgroundColor: groupPalette.bgLight,
                            borderColor: groupPalette.border,
                            borderWidth: '2.5px',
                          };
                        }
                      } else {
                        // Non-group mode
                        if (isAttentionNeeded) {
                          deskBgStyle = student?.gender === 'boy' 
                            ? { backgroundColor: '#93c5fd', borderColor: '#1d4ed8', borderWidth: '3px' }
                            : { backgroundColor: '#f9a8d4', borderColor: '#be185d', borderWidth: '3px' };
                          customBorderClass = 'shadow-md ring-2 ring-rose-400/70';
                        } else {
                          deskBgStyle = student?.gender === 'boy'
                            ? { backgroundColor: '#eff6ff', borderColor: '#3b82f6', borderWidth: '2.5px' }
                            : (student?.gender === 'girl' 
                                ? { backgroundColor: '#fff1f2', borderColor: '#f43f5e', borderWidth: '2.5px' }
                                : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: '2px' });
                        }
                      }

                      // Dynamic text color for darkened desks
                      const isDarkened = isAttentionNeeded && !isCurrentSelected && hasGroups;

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          onClick={() => handleSeatClick(seat.id)}
                          style={deskBgStyle}
                          className={`aspect-4/3 sm:aspect-video rounded-xl border-2 sm:border-3 flex flex-col justify-center items-center p-1.5 sm:p-2 relative transition-all duration-200 cursor-pointer select-none shadow-2xs hover:shadow-md active:scale-95 ${customBorderClass}`}
                        >
                          {/* Group badge */}
                          {hasGroups && group && !seat.disabled && (
                            <div className="absolute top-1 left-1 sm:left-1.5 flex items-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${isDarkened ? 'border border-white/60' : ''}`}
                                style={{ backgroundColor: isDarkened ? '#ffffff' : groupPalette?.hex }}
                              />
                              <span
                                className={`text-[8px] sm:text-[9px] font-extrabold truncate max-w-[40px] sm:max-w-none ${
                                  isDarkened ? 'text-white' : ''
                                }`}
                                style={{ color: isDarkened ? '#ffffff' : groupPalette?.text }}
                              >
                                {group.name}
                              </span>
                            </div>
                          )}

                          {/* Selected pill */}
                          {isCurrentSelected && (
                            <div className="absolute top-1 right-1 sm:right-1.5 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs">
                              選択中
                            </div>
                          )}

                          {/* Attention needed badge with adjustment elements (市松 / 班) */}
                          {!isCurrentSelected && isAttentionNeeded && (
                            <div className="absolute top-1 right-1 sm:right-1.5 flex flex-col items-end gap-0.5 z-10 pointer-events-none">
                              <span className="bg-rose-600 text-white text-[7px] sm:text-[8px] font-black px-1 py-0.5 rounded shadow-xs leading-none">
                                要調整
                              </span>
                              <div className="flex items-center gap-0.5">
                                {isBrokenChecker && (
                                  <span className="bg-rose-800 text-white text-[6.5px] sm:text-[7.5px] font-black px-1 py-0.2 rounded leading-tight border border-white/30 shadow-2xs">
                                    市松
                                  </span>
                                )}
                                {isDisconnectedGroup && (
                                  <span className="bg-amber-700 text-white text-[6.5px] sm:text-[7.5px] font-black px-1 py-0.2 rounded leading-tight border border-white/30 shadow-2xs">
                                    班
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {student ? (
                            <>
                              <span className={`text-xs sm:text-sm leading-tight text-center truncate max-w-full font-black ${
                                isDarkened ? 'text-white' : 'text-slate-900'
                              }`}>
                                {student.name}
                              </span>
                              <span className={`text-[9px] sm:text-[10px] font-mono mt-0.5 truncate max-w-full ${
                                isDarkened ? 'text-white/80 font-bold' : 'text-slate-500 font-medium'
                              }`}>
                                {student.furigana}
                              </span>
                            </>
                          ) : seat.disabled ? (
                            <span className="text-[10px] font-bold text-slate-400">✕ 空席</span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-350 italic">空席</span>
                          )}
                        </button>
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
            id="btn-back-from-manual-swap"
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>結果一覧に戻る</span>
          </button>

          {onBackToStudentHub && (
            <button
              type="button"
              onClick={onBackToStudentHub}
              id="btn-back-to-hub-step5"
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
          id="btn-confirm-final"
          className="flex items-center gap-2 px-7 py-3 rounded-xl bg-indigo-600 font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
        >
          <span>調整を確定して印刷へ</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
