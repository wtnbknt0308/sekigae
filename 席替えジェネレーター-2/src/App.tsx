import { useState, useEffect } from 'react';
import { 
  Student, 
  Seat, 
  LifeGroup, 
  SeatingPattern, 
  ZeroSettingsData, 
  DEFAULT_ZERO_SETTINGS 
} from './types';
import { generateInitialSeats } from './utils/solver';
import { ZeroSettings } from './components/ZeroSettings';
import { StudentMenuHub } from './components/StudentMenuHub';
import { GroupFormationWizard } from './components/GroupFormationWizard';
import { BasicSettings } from './components/BasicSettings';
import { SeatPatternConfirm } from './components/SeatPatternConfirm';
import { DetailedSettings } from './components/DetailedSettings';
import { ExecutionResult } from './components/ExecutionResult';
import { ManualSwap } from './components/ManualSwap';
import { FinalResult } from './components/FinalResult';
import { 
  Grid, 
  Users, 
  Lock, 
  Settings2, 
  Sparkles, 
  Play, 
  Shuffle, 
  CheckSquare, 
  Layers, 
  LogOut,
  RotateCcw,
  FileCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  X
} from 'lucide-react';

type AppMode = 'zero_settings' | 'student_hub' | 'group_formation' | 'seating_flow';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('zero_settings');
  const [zeroSettings, setZeroSettings] = useState<ZeroSettingsData>(DEFAULT_ZERO_SETTINGS);

  // Seating flow specific state
  const [seatingStep, setSeatingStep] = useState<number>(1);
  const [columns, setColumns] = useState<number>(6);
  const [rows, setRows] = useState<number>(6);
  const [pattern, setPattern] = useState<SeatingPattern>('checkerboard');
  const [hasGroups, setHasGroups] = useState<boolean>(true);
  const [groups, setGroups] = useState<LifeGroup[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);

  // App HTML Export Modal state
  const [showAppHtmlModal, setShowAppHtmlModal] = useState<boolean>(false);
  const [downloadingAppHtml, setDownloadingAppHtml] = useState<boolean>(false);
  const [downloadingLightHtml, setDownloadingLightHtml] = useState<boolean>(false);
  const [appHtmlCopied, setAppHtmlCopied] = useState<boolean>(false);

  const handleDownloadAppHtml = async () => {
    try {
      setDownloadingAppHtml(true);
      const res = await fetch('/sekigae_full_app.html');
      if (!res.ok) throw new Error('HTML load failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `席替え＆班編成ジェネレーター_完全版_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download app html:', err);
      window.open('/sekigae_full_app.html', '_blank');
    } finally {
      setDownloadingAppHtml(false);
    }
  };

  const handleDownloadLightHtml = async () => {
    try {
      setDownloadingLightHtml(true);
      const res = await fetch('/sekigae_light_app.html');
      if (!res.ok) throw new Error('HTML load failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `席替え＆班編成ジェネレーター_軽量版_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download light html:', err);
      window.open('/sekigae_light_app.html', '_blank');
    } finally {
      setDownloadingLightHtml(false);
    }
  };

  const handleCopyAppHtml = async () => {
    try {
      const res = await fetch('/sekigae_full_app.html');
      if (!res.ok) throw new Error('HTML load failed');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setAppHtmlCopied(true);
      setTimeout(() => setAppHtmlCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy app html:', err);
    }
  };

  // 1. Load from localStorage
  useEffect(() => {
    const cached = localStorage.getItem('class_seating_group_app_v2');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.zeroSettings && Array.isArray(parsed.zeroSettings.students) && parsed.zeroSettings.students.length > 0) {
          setZeroSettings({
            ...DEFAULT_ZERO_SETTINGS,
            ...parsed.zeroSettings,
          });
        } else {
          setZeroSettings(DEFAULT_ZERO_SETTINGS);
        }
        if (parsed.appMode) setAppMode(parsed.appMode);
        if (parsed.columns) setColumns(parsed.columns);
        if (parsed.rows) setRows(parsed.rows);
        if (parsed.pattern) setPattern(parsed.pattern);
        if (parsed.hasGroups !== undefined) setHasGroups(parsed.hasGroups);
        if (parsed.groups) setGroups(parsed.groups);
        if (parsed.seats) setSeats(parsed.seats);
        return;
      } catch (e) {
        console.error('Error loading cache:', e);
      }
    }
  }, []);

  // 2. Save to localStorage
  useEffect(() => {
    const stateToCache = {
      zeroSettings,
      appMode,
      columns,
      rows,
      pattern,
      hasGroups,
      groups,
      seats,
    };
    localStorage.setItem('class_seating_group_app_v2', JSON.stringify(stateToCache));
  }, [zeroSettings, appMode, columns, rows, pattern, hasGroups, groups, seats]);

  // Synchronize seats only when dimension (rows/cols) changes or empty
  useEffect(() => {
    const boys = zeroSettings.students.filter(s => s.gender === 'boy').length;
    const girls = zeroSettings.students.filter(s => s.gender === 'girl').length;

    setSeats(prevSeats => {
      if (prevSeats.length === rows * columns) {
        // Keep existing seats and student assignments, only updating genderPattern if needed
        return prevSeats;
      }
      return generateInitialSeats(rows, columns, pattern, boys, girls, prevSeats);
    });
  }, [rows, columns]);

  // Handle direct updates to boys count
  const handleUpdateBoysCount = (newCount: number) => {
    const currentBoys = zeroSettings.students.filter(s => s.gender === 'boy');
    const currentGirls = zeroSettings.students.filter(s => s.gender === 'girl');
    
    let updatedBoys: Student[] = [];
    if (newCount > currentBoys.length) {
      const highestId = zeroSettings.students.length > 0 ? Math.max(...zeroSettings.students.map(s => s.id)) : 0;
      const additional = Array.from({ length: newCount - currentBoys.length }).map((_, i) => ({
        id: highestId + i + 1,
        name: `男子${currentBoys.length + i + 1}`,
        furigana: `だんし${currentBoys.length + i + 1}`,
        gender: 'boy' as const,
        groupId: null,
        prefRow: 'none' as const,
        prefCol: 'none' as const,
      }));
      updatedBoys = [...currentBoys, ...additional];
    } else {
      updatedBoys = currentBoys.slice(0, newCount);
    }

    setZeroSettings(prev => ({
      ...prev,
      boysCount: newCount,
      totalStudents: newCount + currentGirls.length,
      students: [...updatedBoys, ...currentGirls],
    }));
  };

  // Handle direct updates to girls count
  const handleUpdateGirlsCount = (newCount: number) => {
    const currentBoys = zeroSettings.students.filter(s => s.gender === 'boy');
    const currentGirls = zeroSettings.students.filter(s => s.gender === 'girl');
    
    let updatedGirls: Student[] = [];
    if (newCount > currentGirls.length) {
      const highestId = zeroSettings.students.length > 0 ? Math.max(...zeroSettings.students.map(s => s.id)) : 0;
      const additional = Array.from({ length: newCount - currentGirls.length }).map((_, i) => ({
        id: highestId + i + 1,
        name: `女子${currentGirls.length + i + 1}`,
        furigana: `じょし${currentGirls.length + i + 1}`,
        gender: 'girl' as const,
        groupId: null,
        prefRow: 'none' as const,
        prefCol: 'none' as const,
      }));
      updatedGirls = [...currentGirls, ...additional];
    } else {
      updatedGirls = currentGirls.slice(0, newCount);
    }

    setZeroSettings(prev => ({
      ...prev,
      girlsCount: newCount,
      totalStudents: currentBoys.length + newCount,
      students: [...currentBoys, ...updatedGirls],
    }));
  };

  // Update zero settings and propagate students
  const handleUpdateZeroSettings = (newSettings: ZeroSettingsData) => {
    setZeroSettings(newSettings);
  };

  // Switch to student screen
  const handleGoToStudentScreen = () => {
    setAppMode('student_hub');
  };

  // Switch back to zero settings (teacher mode)
  const handleReturnToZeroSettings = () => {
    setAppMode('zero_settings');
  };

  // Completed group formation saves the formed groups into state
  const handleGroupFormationComplete = (formedGroups: LifeGroup[], updatedStudents: Student[]) => {
    setGroups(formedGroups);
    setZeroSettings(prev => ({
      ...prev,
      students: updatedStudents,
      groups: formedGroups,
    }));
    setAppMode('student_hub');
  };

  // Refresh and load latest group formation data
  const handleRefreshGroups = () => {
    let latestGroups = zeroSettings.groups;
    let latestStudents = zeroSettings.students;
    try {
      const cached = localStorage.getItem('class_seating_group_app_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.zeroSettings?.groups && Array.isArray(parsed.zeroSettings.groups) && parsed.zeroSettings.groups.length > 0) {
          latestGroups = parsed.zeroSettings.groups;
        } else if (parsed.groups && Array.isArray(parsed.groups) && parsed.groups.length > 0) {
          latestGroups = parsed.groups;
        }
        if (parsed.zeroSettings?.students && Array.isArray(parsed.zeroSettings.students) && parsed.zeroSettings.students.length > 0) {
          latestStudents = parsed.zeroSettings.students;
        }
      }
    } catch (e) {
      console.error('Failed to reload groups from cache:', e);
    }

    if (latestGroups && latestGroups.length > 0) {
      setGroups(latestGroups);
    }
    setZeroSettings(prev => ({
      ...prev,
      groups: latestGroups && latestGroups.length > 0 ? latestGroups : prev.groups,
      students: latestStudents && latestStudents.length > 0 ? latestStudents : prev.students,
    }));
  };

  // Helper values
  const boysCount = zeroSettings.students.filter(s => s.gender === 'boy').length;
  const girlsCount = zeroSettings.students.filter(s => s.gender === 'girl').length;
  const totalStudents = zeroSettings.students.length;

  const SEATING_STEPS = [
    { num: 1, label: '席数設定', icon: Settings2 },
    { num: 2, label: 'パターン・除外席', icon: Grid },
    { num: 3, label: '生活班配置設定', icon: Sparkles },
    { num: 4, label: '自動配置実行', icon: Play },
    { num: 5, label: '手動入れ替え', icon: Shuffle },
    { num: 6, label: '完成座席表', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-800 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      {/* Top Main Navigation Bar (Hidden during printing) */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm shadow-indigo-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  班編成＆席替えジェネレーター
                </h1>
                {appMode === 'zero_settings' ? (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                    <Lock className="w-3 h-3" />
                    ゼロ設定 (先生専用)
                  </span>
                ) : (
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-200">
                    <Users className="w-3 h-3" />
                    生徒用画面
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                クラス生徒数: {totalStudents}名（男{boysCount} / 女{girlsCount}）
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download/Export App HTML */}
            <button
              type="button"
              onClick={() => setShowAppHtmlModal(true)}
              id="btn-export-app-html"
              className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-teal-200"
              title="このアプリ全体を単一HTMLファイルとして保存・ダウンロードします"
            >
              <Download className="w-3.5 h-3.5" />
              <span>HTMLダウンロード</span>
            </button>

            {/* 生徒用画面に戻る (生徒用メニューハブ以外の全画面で常時表示) */}
            {appMode !== 'student_hub' && (
              <button
                type="button"
                onClick={handleGoToStudentScreen}
                id="btn-return-student-screen-header"
                className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 px-3.5 py-2 rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                title="生徒用画面（メインメニュー）に戻ります"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>生徒用画面に戻る</span>
              </button>
            )}

            {appMode !== 'zero_settings' && (
              <button
                type="button"
                onClick={handleReturnToZeroSettings}
                id="btn-return-zero-settings"
                className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3.5 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>先生用設定へ</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Seating Flow Step Wizard Bar */}
      {appMode === 'seating_flow' && (
        <div className="no-print bg-white border-b border-slate-100 py-3 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[650px] md:min-w-0">
              {SEATING_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = seatingStep === step.num;
                const isCompleted = seatingStep > step.num;

                return (
                  <div key={step.num} className="flex items-center flex-1 last:flex-initial">
                    <button
                      type="button"
                      disabled={step.num > seatingStep && !isCompleted}
                      onClick={() => setSeatingStep(step.num)}
                      className="flex flex-col items-center gap-1 focus:outline-hidden group cursor-pointer disabled:cursor-not-allowed"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                          isActive
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-105'
                            : isCompleted
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                            : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'
                        }`}
                      >
                        <StepIcon className="w-3.5 h-3.5" />
                      </div>
                      <span
                        className={`text-[10px] font-black ${
                          isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </button>

                    {idx < SEATING_STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-3 rounded-full ${
                          isCompleted ? 'bg-emerald-400' : 'bg-slate-100'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main App Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {/* 1. Zero Settings Layer (Teacher Mode) */}
        {appMode === 'zero_settings' && (
          <ZeroSettings
            students={zeroSettings.students}
            pairRules={zeroSettings.pairRules}
            defaultGroups={zeroSettings.defaultGroups}
            rows={rows}
            columns={columns}
            onUpdateStudents={(s) => setZeroSettings(prev => ({ ...prev, students: s }))}
            onUpdatePairRules={(r) => setZeroSettings(prev => ({ ...prev, pairRules: r }))}
            onUpdateGroups={(g) => setZeroSettings(prev => ({ ...prev, defaultGroups: g, groups: g }))}
            onUpdateDimensions={(r, c) => {
              setRows(r);
              setColumns(c);
              setZeroSettings(prev => ({ ...prev, rows: r, columns: c }));
            }}
            onProceedToStudentMode={handleGoToStudentScreen}
          />
        )}

        {/* 2. Student Hub (Menu) */}
        {appMode === 'student_hub' && (
          <StudentMenuHub
            totalStudents={totalStudents}
            boysCount={boysCount}
            girlsCount={girlsCount}
            onSelectGroupFormation={() => setAppMode('group_formation')}
            onSelectSeating={() => {
              setSeatingStep(1);
              setAppMode('seating_flow');
            }}
            onBackToZeroSettings={handleReturnToZeroSettings}
          />
        )}

        {/* 3. Group Formation Wizard */}
        {appMode === 'group_formation' && (
          <GroupFormationWizard
            students={zeroSettings.students}
            pairRules={zeroSettings.pairRules}
            defaultGroups={zeroSettings.defaultGroups}
            onBackToHub={() => setAppMode('student_hub')}
            onSaveGroups={handleGroupFormationComplete}
          />
        )}

        {/* 4. Seating Arrangement Flow */}
        {appMode === 'seating_flow' && (
          <div>
            {seatingStep === 1 && (
              <BasicSettings
                boysCount={boysCount}
                girlsCount={girlsCount}
                columns={columns}
                rows={rows}
                pattern={pattern}
                groups={zeroSettings.groups.length > 0 ? zeroSettings.groups : groups}
                students={zeroSettings.students}
                onRefreshGroups={handleRefreshGroups}
                onBackToStudentHub={() => setAppMode('student_hub')}
                onGoToGroupFormation={() => setAppMode('group_formation')}
                onUpdateBoys={handleUpdateBoysCount}
                onUpdateGirls={handleUpdateGirlsCount}
                onUpdateColumns={(c) => {
                  setColumns(c);
                  setZeroSettings(prev => ({ ...prev, columns: c }));
                }}
                onUpdateRows={(r) => {
                  setRows(r);
                  setZeroSettings(prev => ({ ...prev, rows: r }));
                }}
                onUpdatePattern={setPattern}
                onNext={() => setSeatingStep(2)}
              />
            )}

            {seatingStep === 2 && (
              <SeatPatternConfirm
                rows={rows}
                columns={columns}
                pattern={pattern}
                seats={seats}
                boysCount={boysCount}
                girlsCount={girlsCount}
                onUpdatePattern={setPattern}
                onUpdateSeats={setSeats}
                onBack={() => setSeatingStep(1)}
                onBackToStudentHub={() => setAppMode('student_hub')}
                onNext={() => setSeatingStep(3)}
              />
            )}

            {seatingStep === 3 && (
              <DetailedSettings
                students={zeroSettings.students}
                hasGroups={hasGroups}
                groups={zeroSettings.groups.length > 0 ? zeroSettings.groups : groups}
                pairRules={zeroSettings.pairRules}
                onUpdateHasGroups={setHasGroups}
                onUpdateGroups={(g) => {
                  setGroups(g);
                  setZeroSettings(prev => ({ ...prev, groups: g }));
                }}
                onRefreshGroups={handleRefreshGroups}
                onBack={() => setSeatingStep(2)}
                onBackToStudentHub={() => setAppMode('student_hub')}
                onNext={() => setSeatingStep(4)}
              />
            )}

            {seatingStep === 4 && (
              <ExecutionResult
                totalStudents={totalStudents}
                boysCount={boysCount}
                girlsCount={girlsCount}
                rows={rows}
                columns={columns}
                pattern={pattern}
                students={zeroSettings.students}
                hasGroups={hasGroups}
                groups={zeroSettings.groups.length > 0 ? zeroSettings.groups : groups}
                pairRules={zeroSettings.pairRules}
                seats={seats}
                onUpdateSeats={setSeats}
                onBack={() => setSeatingStep(3)}
                onBackToStudentHub={() => setAppMode('student_hub')}
                onNext={() => setSeatingStep(5)}
              />
            )}

            {seatingStep === 5 && (
              <ManualSwap
                students={zeroSettings.students}
                seats={seats}
                hasGroups={hasGroups}
                groups={zeroSettings.groups.length > 0 ? zeroSettings.groups : groups}
                columns={columns}
                rows={rows}
                onUpdateSeats={setSeats}
                onBack={() => setSeatingStep(4)}
                onBackToStudentHub={() => setAppMode('student_hub')}
                onNext={() => setSeatingStep(6)}
              />
            )}

            {seatingStep === 6 && (
              <FinalResult
                students={zeroSettings.students}
                seats={seats}
                hasGroups={hasGroups}
                groups={zeroSettings.groups.length > 0 ? zeroSettings.groups : groups}
                columns={columns}
                rows={rows}
                onBack={() => setSeatingStep(5)}
                onRestart={() => setAppMode('student_hub')}
                onBackToStudentHub={() => setAppMode('student_hub')}
              />
            )}
          </div>
        )}
      </main>

      {/* App Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 font-medium">
        <span>班編成＆席替えジェネレーター © 2026 | 学校現場の業務をスムーズにサポート</span>
      </footer>

      {/* App Standalone HTML Export Modal */}
      {showAppHtmlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-600 rounded-xl text-white shadow-sm shadow-teal-200">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">このアプリを単一HTMLとして出力・保存</h3>
                  <p className="text-xs text-slate-500">
                    サーバーやNode.js不要！ブラウザだけで完全に動くオフラインHTMLファイル
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAppHtmlModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                title="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
              {/* Feature Box */}
              <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/50 p-4 rounded-xl border border-teal-200/80">
                <h4 className="font-bold text-teal-900 text-xs mb-2 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-teal-600" />
                  <span>単一HTML版の特徴（校務用PC・USB保存に最適）</span>
                </h4>
                <ul className="text-xs text-teal-800 space-y-1.5 list-disc list-inside">
                  <li><strong>完全スタンドアロン</strong>：全プログラム・スタイル・UIアイコンが1つのファイル（.html）に内包されています。</li>
                  <li><strong>インターネット接続不要</strong>：オフライン環境でもChrome、Edge、Safariでダブルクリックするだけでそのまま起動します。</li>
                  <li><strong>全機能利用可能</strong>：先生用ゼロ設定、生徒用班編成、自動席替え、市松模様、手動入れ替え、生徒用＆教師用印刷、Word/HTML保存のすべてがそのまま使えます。</li>
                  <li><strong>データ保持</strong>：入力した名簿や設定はブラウザのLocalStorageに自動保存されるため、次回開いた時も続きから使えます。</li>
                </ul>
              </div>

              {/* Download Action Section */}
              <div className="space-y-3">
                {/* 1. Full Edition */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-teal-300 transition-all flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">
                        席替え＆班編成ジェネレーター【完全版】
                      </span>
                      <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">おすすめ</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      全機能・美麗UI・先生用設定・班編成・手動調整・印刷・Word出力（約780KB / 単一HTML）
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingAppHtml}
                    onClick={handleDownloadAppHtml}
                    id="btn-download-full-html"
                    className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-teal-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingAppHtml ? '保存中...' : '完全版をダウンロード'}</span>
                  </button>
                </div>

                {/* 2. Light Edition */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">
                        席替え＆班編成ジェネレーター【軽量版】
                      </span>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">超高速</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      HTML/CSS/JSプレーン記述・瞬速起動・主要機能完備（約35KB / 単一HTML）
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingLightHtml}
                    onClick={handleDownloadLightHtml}
                    id="btn-download-light-html"
                    className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingLightHtml ? '保存中...' : '軽量版をダウンロード'}</span>
                  </button>
                </div>
              </div>

              {/* Secondary Actions: Copy & Direct Links */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyAppHtml}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer transition-all shadow-2xs"
                >
                  {appHtmlCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{appHtmlCopied ? '完全版HTMLをコピーしました！' : 'HTMLコードをクリップボードにコピー'}</span>
                </button>

                <a
                  href="/sekigae_full_app.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer transition-all shadow-2xs"
                >
                  <ExternalLink className="w-4 h-4 text-slate-600" />
                  <span>別タブで直接プレビュー</span>
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAppHtmlModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer transition-all"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
