import React, { useState, useEffect } from 'react';
import { Student, LifeGroup, PairRule, DISTINCT_GROUP_COLORS, GroupRole } from '../types';
import { solveGroupFormation } from '../utils/solver';
import { 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Printer, 
  Check, 
  RefreshCw, 
  Plus, 
  Trash2, 
  FileText, 
  Layers, 
  ArrowLeft,
  Upload,
  UserCheck,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  FileDown,
  Eye,
  X
} from 'lucide-react';

interface GroupFormationWizardProps {
  students?: Student[];
  pairRules?: PairRule[];
  defaultGroups?: LifeGroup[];
  onSaveGroups: (groups: LifeGroup[], updatedStudents: Student[]) => void;
  onBackToHub: () => void;
}

const DEFAULT_ROLE_PRESETS = [
  '班長',
  '副班長',
  '給食係',
  '美化係',
  '保健係',
  '学習・号令係',
];

export const GroupFormationWizard: React.FC<GroupFormationWizardProps> = ({
  students = [],
  pairRules = [],
  defaultGroups = [],
  onSaveGroups,
  onBackToHub,
}) => {
  const [step, setStep] = useState<number>(1);
  const totalStudents = students.length;
  const boysCount = students.filter(s => s.gender === 'boy').length;
  const girlsCount = students.filter(s => s.gender === 'girl').length;

  // Step 1: Number of groups & names
  const [numGroups, setNumGroups] = useState<number>(defaultGroups?.length || 6);
  const [groupNames, setGroupNames] = useState<string[]>(
    defaultGroups && defaultGroups.length > 0 ? defaultGroups.map(g => g.name) : Array.from({ length: 6 }, (_, i) => `${i + 1}班`)
  );

  // Step 2: Target numbers for each group
  const [groupCapacities, setGroupCapacities] = useState<Array<{ boys: number; girls: number }>>([]);

  // Step 3: Leaders (1 Boy and 1 Girl per group)
  const [groupBoyLeaders, setGroupBoyLeaders] = useState<Array<number | null>>([]);
  const [groupGirlLeaders, setGroupGirlLeaders] = useState<Array<number | null>>([]);

  // Step 4: Shuffled members
  const [workingStudents, setWorkingStudents] = useState<Student[]>(students);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [shuffleWarnings, setShuffleWarnings] = useState<string[]>([]);
  const [shuffleCount, setShuffleCount] = useState<number>(0);

  // Sync workingStudents if students prop changes
  useEffect(() => {
    if (students && students.length > 0) {
      setWorkingStudents(students);
    }
  }, [students]);

  // Step 6: Roles definitions and assignments
  const [roleDefinitions, setRoleDefinitions] = useState<string[]>(DEFAULT_ROLE_PRESETS);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [rolesByGroup, setRolesByGroup] = useState<Record<number, GroupRole[]>>({});
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);

  // Reset capacities evenly
  const handleResetCapacitiesEvenly = () => {
    const baseBoys = Math.floor(boysCount / numGroups);
    const remBoys = boysCount % numGroups;
    const baseGirls = Math.floor(girlsCount / numGroups);
    const remGirls = girlsCount % numGroups;

    const newCapacities = Array.from({ length: numGroups }, (_, i) => ({
      boys: baseBoys + (i < remBoys ? 1 : 0),
      girls: baseGirls + (i < remGirls ? 1 : 0),
    }));
    setGroupCapacities(newCapacities);
  };

  // Initialize or synchronize groups capacity evenly when numGroups changes
  useEffect(() => {
    // Generate names if count changed
    const newNames = Array.from({ length: numGroups }, (_, i) => groupNames[i] || `${i + 1}班`);
    setGroupNames(newNames);

    // Distribute boys and girls evenly
    const baseBoys = Math.floor(boysCount / numGroups);
    const remBoys = boysCount % numGroups;
    const baseGirls = Math.floor(girlsCount / numGroups);
    const remGirls = girlsCount % numGroups;

    const newCapacities = Array.from({ length: numGroups }, (_, i) => ({
      boys: baseBoys + (i < remBoys ? 1 : 0),
      girls: baseGirls + (i < remGirls ? 1 : 0),
    }));
    setGroupCapacities(newCapacities);

    // Initialize boy & girl leaders
    setGroupBoyLeaders(Array.from({ length: numGroups }, (_, i) => groupBoyLeaders[i] ?? null));
    setGroupGirlLeaders(Array.from({ length: numGroups }, (_, i) => groupGirlLeaders[i] ?? null));
  }, [numGroups]);

  // Construct working LifeGroups object
  const buildCurrentLifeGroups = (): LifeGroup[] => {
    return Array.from({ length: numGroups }, (_, i) => {
      const palette = DISTINCT_GROUP_COLORS[i % DISTINCT_GROUP_COLORS.length];
      const cap = groupCapacities[i] || { boys: 0, girls: 0 };
      const roles = rolesByGroup[i + 1] || [];
      const boyLeader = groupBoyLeaders[i] ?? null;
      const girlLeader = groupGirlLeaders[i] ?? null;

      return {
        id: i + 1,
        name: groupNames[i] || `${i + 1}班`,
        boysCount: cap.boys,
        girlsCount: cap.girls,
        color: palette.hex,
        bgLight: palette.bgLight,
        border: palette.border,
        text: palette.text,
        leaderId: boyLeader || girlLeader || null,
        boyLeaderId: boyLeader,
        girlLeaderId: girlLeader,
        roles,
      };
    });
  };

  // Perform member shuffle
  const handlePerformShuffle = () => {
    setIsShuffling(true);
    const currentGroups = buildCurrentLifeGroups();

    setTimeout(() => {
      const result = solveGroupFormation(students, currentGroups, pairRules);
      setWorkingStudents(result.updatedStudents);
      setShuffleWarnings([]);
      setShuffleCount(prev => prev + 1);
      setIsShuffling(false);

      // Initialize default role slots for each group based on member count
      const initialRoles: Record<number, GroupRole[]> = {};
      currentGroups.forEach(g => {
        const members = result.updatedStudents.filter(s => s.groupId === g.id);
        const rolesForThisGroup: GroupRole[] = roleDefinitions.slice(0, members.length).map((rName, idx) => ({
          roleId: `role-${g.id}-${idx}`,
          roleName: rName,
          studentId: (idx === 0 && g.boyLeaderId) ? g.boyLeaderId : ((idx === 1 && g.girlLeaderId) ? g.girlLeaderId : (members[idx]?.id || null)),
        }));
        initialRoles[g.id] = rolesForThisGroup;
      });
      setRolesByGroup(initialRoles);
    }, 600);
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Download Word (.doc HTML format)
  const handleDownloadWord = () => {
    const currentGroups = buildCurrentLifeGroups();
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>生活班 班名簿＆役割分担表</title>
        <style>
          body { font-family: 'Yu Gothic', 'Hiragino Kaku Gothic ProN', sans-serif; margin: 20px; }
          h1 { text-align: center; font-size: 20pt; color: #1e293b; margin-bottom: 8px; }
          .subtitle { text-align: center; font-size: 11pt; color: #64748b; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th, td { border: 1px solid #94a3b8; padding: 8px 10px; font-size: 10.5pt; text-align: left; }
          th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
          .group-header { background-color: #e2e8f0; font-weight: bold; font-size: 12pt; text-align: center; }
          .leader-mark { font-weight: bold; color: #4338ca; }
        </style>
      </head>
      <body>
        <h1>生活班 班名簿＆役割分担表</h1>
        <div class="subtitle">クラス総人数: ${totalStudents}名（男子: ${boysCount}名 / 女子: ${girlsCount}名）</div>
    `;

    currentGroups.forEach((group, i) => {
      const gId = i + 1;
      const members = workingStudents.filter(s => s.groupId === gId);
      const boyLeaderId = groupBoyLeaders[i];
      const girlLeaderId = groupGirlLeaders[i];
      const gRoles = rolesByGroup[gId] || [];

      htmlContent += `
        <table>
          <tr>
            <th colspan="3" class="group-header">${group.name}（合計 ${members.length} 名）</th>
          </tr>
          <tr>
            <th style="width: 15%;">区分</th>
            <th style="width: 45%;">氏名（ふりがな）</th>
            <th style="width: 40%;">役割・係</th>
          </tr>
      `;

      members.forEach((std) => {
        const isLeader = std.id === boyLeaderId || std.id === girlLeaderId;
        const role = gRoles.find(r => r.studentId === std.id);
        const roleName = role ? role.roleName : '（なし）';

        htmlContent += `
          <tr>
            <td>${isLeader ? '◯ 班長' : (std.gender === 'boy' ? '男子' : '女子')}</td>
            <td><strong>${isLeader ? '◯ ' : ''}${std.name}</strong> <span style="font-size: 9pt; color: #64748b;">(${std.furigana})</span></td>
            <td>${roleName}</td>
          </tr>
        `;
      });

      htmlContent += `</table>`;
    });

    htmlContent += `
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `生活班_名簿_役割分担表_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save and finalize
  const handleSaveAndComplete = () => {
    const finalGroups = buildCurrentLifeGroups();
    onSaveGroups(finalGroups, workingStudents);
    onBackToHub();
  };

  const studentMap = new Map<number, Student>();
  (workingStudents.length > 0 ? workingStudents : students).forEach(s => studentMap.set(s.id, s));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header / Step indicator */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHub}
            id="btn-wizard-return-hub"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="生徒用画面に戻る"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>生徒用画面に戻る</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                MENU 01
              </span>
              <span className="text-xs text-slate-400">生活班の作成</span>
            </div>
            <h1 className="text-lg font-black text-slate-800">班編成ウィザード</h1>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {[
            { num: 1, label: '班数・班名' },
            { num: 2, label: '班の人数' },
            { num: 3, label: '班長選択' },
            { num: 4, label: 'シャッフル' },
            { num: 5, label: '一覧表' },
            { num: 6, label: '役割分担' },
            { num: 7, label: '完成' },
          ].map(s => (
            <div
              key={s.num}
              onClick={() => {
                // allow clicking previous steps
                if (s.num < step || (s.num <= 4 && shuffleCount > 0)) {
                  setStep(s.num);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                step === s.num
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : step > s.num
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <span>{s.num}.</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Number of Groups & Group Names */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              ステップ 1: 生活班の数と班名の設定
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              クラスの人数（{totalStudents}名）に合わせて、作成する班の数を入力してください。
            </p>
          </div>

          <div className="max-w-xs space-y-2">
            <label className="block text-xs font-bold text-slate-700">生活班の数</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={2}
                max={12}
                value={numGroups}
                onChange={(e) => setNumGroups(Math.max(2, Math.min(12, parseInt(e.target.value) || 2)))}
                className="w-24 px-3 py-2 text-base font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center"
              />
              <span className="text-sm font-bold text-slate-600">班</span>
              <span className="text-xs text-slate-400 font-mono">（1班あたり平均 {(totalStudents / numGroups).toFixed(1)} 人）</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">各班の名称</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: numGroups }).map((_, i) => {
                const palette = DISTINCT_GROUP_COLORS[i % DISTINCT_GROUP_COLORS.length];
                return (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl border bg-slate-50/50" style={{ borderColor: palette.border }}>
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: palette.hex }} />
                    <span className="text-xs font-bold text-slate-500 w-8">{i + 1}班:</span>
                    <input
                      type="text"
                      value={groupNames[i] || ''}
                      onChange={(e) => {
                        const updated = [...groupNames];
                        updated[i] = e.target.value;
                        setGroupNames(updated);
                      }}
                      className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onBackToHub}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>生徒用画面に戻る</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              id="btn-group-step1-next"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span>班の人数設定に進む</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Target Capacities per Group */}
      {step === 2 && (() => {
        const sumBoys = groupCapacities.reduce((sum, c) => sum + (c?.boys || 0), 0);
        const sumGirls = groupCapacities.reduce((sum, c) => sum + (c?.girls || 0), 0);
        const sumTotal = sumBoys + sumGirls;

        const isBoysDiff = sumBoys !== boysCount;
        const isGirlsDiff = sumGirls !== girlsCount;
        const isTotalDiff = sumTotal !== totalStudents;
        const hasAnyDiscrepancy = isBoysDiff || isGirlsDiff || isTotalDiff;

        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  ステップ 2: 各班の目標人数（男子・女子）の設定
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  初期状態ではクラスの合計人数と男女比を均等配分しています。必要に応じて変更できます。
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetCapacitiesEvenly}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>均等配分にリセット</span>
              </button>
            </div>

            {/* Discrepancy Highlight Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Summary */}
              <div className={`p-3.5 rounded-xl border-2 transition-all ${
                isTotalDiff 
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200 animate-pulse' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isTotalDiff ? 'text-rose-700' : 'text-slate-500'}`}>
                    班人数の合計
                  </span>
                  {isTotalDiff && (
                    <span className="text-[10px] font-black bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      不一致
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <div className={`text-2xl font-black ${isTotalDiff ? 'text-rose-700' : 'text-slate-800'}`}>
                    {sumTotal} <span className="text-xs font-normal">人</span>
                  </div>
                  <div className="text-xs text-slate-500 font-bold">
                    クラス総数: {totalStudents}人
                    {isTotalDiff && (
                      <span className="ml-1 text-rose-600 font-black">
                        ({sumTotal > totalStudents ? `+${sumTotal - totalStudents}` : `${sumTotal - totalStudents}`}人)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Boys Summary */}
              <div className={`p-3.5 rounded-xl border-2 transition-all ${
                isBoysDiff 
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200' 
                  : 'bg-blue-50/60 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isBoysDiff ? 'text-rose-700' : 'text-blue-700'}`}>
                    男子人数の合計
                  </span>
                  {isBoysDiff && (
                    <span className="text-[10px] font-black bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      不一致
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <div className={`text-2xl font-black ${isBoysDiff ? 'text-rose-700' : 'text-blue-800'}`}>
                    {sumBoys} <span className="text-xs font-normal">人</span>
                  </div>
                  <div className="text-xs text-slate-500 font-bold">
                    男子登録数: {boysCount}人
                    {isBoysDiff && (
                      <span className="ml-1 text-rose-600 font-black">
                        ({sumBoys > boysCount ? `+${sumBoys - boysCount}` : `${sumBoys - boysCount}`}人)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Girls Summary */}
              <div className={`p-3.5 rounded-xl border-2 transition-all ${
                isGirlsDiff 
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200' 
                  : 'bg-rose-50/60 border-rose-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isGirlsDiff ? 'text-rose-700' : 'text-rose-700'}`}>
                    女子人数の合計
                  </span>
                  {isGirlsDiff && (
                    <span className="text-[10px] font-black bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      不一致
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <div className={`text-2xl font-black ${isGirlsDiff ? 'text-rose-700' : 'text-rose-800'}`}>
                    {sumGirls} <span className="text-xs font-normal">人</span>
                  </div>
                  <div className="text-xs text-slate-500 font-bold">
                    女子登録数: {girlsCount}人
                    {isGirlsDiff && (
                      <span className="ml-1 text-rose-600 font-black">
                        ({sumGirls > girlsCount ? `+${sumGirls - girlsCount}` : `${sumGirls - girlsCount}`}人)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {hasAnyDiscrepancy && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  班の合計人数・男女比が名簿人数と合っていません。上部のハイライトされた項目を確認するか、「均等配分にリセット」をクリックして調整してください。
                </span>
              </div>
            )}

            {/* Group Capacity Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: numGroups }).map((_, i) => {
                const palette = DISTINCT_GROUP_COLORS[i % DISTINCT_GROUP_COLORS.length];
                const cap = groupCapacities[i] || { boys: 0, girls: 0 };
                const groupTotal = cap.boys + cap.girls;

                return (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border-2 space-y-3 bg-white"
                    style={{ borderColor: palette.border }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: palette.hex }} />
                        <span className="font-bold text-sm text-slate-800">{groupNames[i]}</span>
                      </div>
                      <span className="text-xs font-black text-slate-700 px-2 py-0.5 bg-slate-100 rounded-md">
                        計 {groupTotal} 人
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                        <label className="block text-[10px] font-bold text-blue-600 mb-1">男子</label>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...groupCapacities];
                              updated[i] = { ...updated[i], boys: Math.max(0, cap.boys - 1) };
                              setGroupCapacities(updated);
                            }}
                            className="w-6 h-6 rounded bg-white text-blue-700 font-bold border border-blue-200 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-black text-sm text-blue-900">{cap.boys}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...groupCapacities];
                              updated[i] = { ...updated[i], boys: cap.boys + 1 };
                              setGroupCapacities(updated);
                            }}
                            className="w-6 h-6 rounded bg-white text-blue-700 font-bold border border-blue-200 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="bg-rose-50/60 p-2 rounded-xl border border-rose-100">
                        <label className="block text-[10px] font-bold text-rose-600 mb-1">女子</label>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...groupCapacities];
                              updated[i] = { ...updated[i], girls: Math.max(0, cap.girls - 1) };
                              setGroupCapacities(updated);
                            }}
                            className="w-6 h-6 rounded bg-white text-rose-700 font-bold border border-rose-200 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-black text-sm text-rose-900">{cap.girls}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...groupCapacities];
                              updated[i] = { ...updated[i], girls: cap.girls + 1 };
                              setGroupCapacities(updated);
                            }}
                            className="w-6 h-6 rounded bg-white text-rose-700 font-bold border border-rose-200 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 px-4 py-2 text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
                戻る
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                id="btn-group-step2-next"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>班長入力に進む</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* STEP 3: Group Leaders Selection (Unique selection, 1 Boy & 1 Girl per Group) */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              ステップ 3: 各班の班長入力（男女各1名）
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              各班のリーダーとして男子1名・女子1名を選択してください。他の班で選択済みの生徒は自動的に候補から除外されます。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: numGroups }).map((_, i) => {
              const palette = DISTINCT_GROUP_COLORS[i % DISTINCT_GROUP_COLORS.length];
              const boyLeaderId = groupBoyLeaders[i];
              const girlLeaderId = groupGirlLeaders[i];

              // Filter out boys and girls selected by OTHER groups
              const otherSelectedBoyIds = groupBoyLeaders.filter((id, idx) => idx !== i && id !== null);
              const availableBoys = students.filter(s => s.gender === 'boy' && (!otherSelectedBoyIds.includes(s.id) || s.id === boyLeaderId));

              const otherSelectedGirlIds = groupGirlLeaders.filter((id, idx) => idx !== i && id !== null);
              const availableGirls = students.filter(s => s.gender === 'girl' && (!otherSelectedGirlIds.includes(s.id) || s.id === girlLeaderId));

              return (
                <div
                  key={i}
                  className="p-4 rounded-2xl border bg-slate-50/50 space-y-3"
                  style={{ borderColor: palette.border }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: palette.hex }} />
                    <span className="font-bold text-sm text-slate-800">{groupNames[i]}</span>
                  </div>

                  <div className="space-y-2">
                    {/* Boy Leader */}
                    <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
                      <label className="block text-[11px] font-bold text-blue-700 mb-1 flex items-center gap-1">
                        <span>◯ 男子リーダー（1名）</span>
                      </label>
                      <select
                        value={boyLeaderId ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null;
                          const updated = [...groupBoyLeaders];
                          updated[i] = val;
                          setGroupBoyLeaders(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-blue-400 cursor-pointer"
                      >
                        <option value="">（未定・自動配属）</option>
                        {availableBoys.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.furigana})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Girl Leader */}
                    <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
                      <label className="block text-[11px] font-bold text-rose-700 mb-1 flex items-center gap-1">
                        <span>◯ 女子リーダー（1名）</span>
                      </label>
                      <select
                        value={girlLeaderId ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null;
                          const updated = [...groupGirlLeaders];
                          updated[i] = val;
                          setGroupGirlLeaders(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-rose-400 cursor-pointer"
                      >
                        <option value="">（未定・自動配属）</option>
                        {availableGirls.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.furigana})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-1 px-4 py-2 text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
              戻る
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(4);
                handlePerformShuffle();
              }}
              id="btn-group-step3-next"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span>メンバーシャッフルへ</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Member Shuffle (Animated & Clean Student View) */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                ステップ 4: メンバーシャッフル
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                班の人数と男女比のバランスを考慮して各班のメンバーを自動編成しました。
              </p>
            </div>

            <button
              type="button"
              onClick={handlePerformShuffle}
              disabled={isShuffling}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>もう一度シャッフル</span>
            </button>
          </div>

          {/* Shuffled Groups Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: numGroups }).map((_, i) => {
              const gId = i + 1;
              const palette = DISTINCT_GROUP_COLORS[i % DISTINCT_GROUP_COLORS.length];
              const members = workingStudents.filter(s => s.groupId === gId);
              const boyLeaderId = groupBoyLeaders[i];
              const girlLeaderId = groupGirlLeaders[i];
              const boyLeader = boyLeaderId ? studentMap.get(boyLeaderId) : null;
              const girlLeader = girlLeaderId ? studentMap.get(girlLeaderId) : null;

              return (
                <div
                  key={gId}
                  className="rounded-2xl border-2 overflow-hidden bg-white shadow-xs flex flex-col justify-between"
                  style={{ borderColor: palette.border }}
                >
                  <div>
                    {/* Header with Group Name and 2 Leaders placed on the right */}
                    <div
                      className="px-3.5 py-2.5 font-bold text-xs flex items-center justify-between gap-2 border-b"
                      style={{ backgroundColor: palette.bgLight, color: palette.text, borderColor: palette.border }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: palette.hex }} />
                        <span className="font-extrabold text-sm truncate">{groupNames[i]}</span>
                      </div>

                      {/* 2 Leaders placed directly to the right of the group name */}
                      <div className="flex items-center gap-1 shrink-0">
                        {boyLeader && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                            ◯ {boyLeader.name}
                          </span>
                        )}
                        {girlLeader && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
                            ◯ {girlLeader.name}
                          </span>
                        )}
                        <span className="text-[10px] opacity-75 font-mono ml-0.5">({members.length}名)</span>
                      </div>
                    </div>

                    <div className="p-3 space-y-1.5 divide-y divide-slate-100">
                      {members.map(student => {
                        const isLeader = student.id === boyLeaderId || student.id === girlLeaderId;
                        return (
                          <div key={student.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${isLeader ? 'text-indigo-900 font-extrabold' : 'text-slate-800'}`}>
                                {isLeader ? '◯ ' : ''}{student.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">（{student.furigana}）</span>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              student.gender === 'boy' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {student.gender === 'boy' ? '男' : '女'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-1 px-4 py-2 text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
              班長設定に戻る
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              id="btn-group-step4-next"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span>班編成一覧表へ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Group List Overview & PDF / Print */}
      {step === 5 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                ステップ 5: 班編成一覧表（PDF出力・印刷可能）
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                決定した班の構成一覧です。印刷して教室に掲示したり配布したりできます。
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>印刷 / PDF保存</span>
            </button>
          </div>

          {/* Printable Layout Container */}
          <div className="printable-group-list border border-slate-200 rounded-2xl p-6 bg-white space-y-6">
            <div className="text-center border-b-2 border-slate-800 pb-4">
              <h2 className="text-xl font-black text-slate-800">生活班 班編成一覧表</h2>
              <div className="text-xs text-slate-500 mt-1">クラス総人数: {totalStudents}名（男子: {boysCount}名 / 女子: {girlsCount}名）</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: numGroups }).map((_, i) => {
                const gId = i + 1;
                const palette = DISTINCT_GROUP_COLORS[i % DISTINCT_GROUP_COLORS.length];
                const members = workingStudents.filter(s => s.groupId === gId);
                const boyLeaderId = groupBoyLeaders[i];
                const girlLeaderId = groupGirlLeaders[i];

                return (
                  <div key={gId} className="border-2 rounded-xl overflow-hidden" style={{ borderColor: palette.border }}>
                    <div className="p-2.5 font-bold text-sm text-center" style={{ backgroundColor: palette.bgLight, color: palette.text }}>
                      {groupNames[i]} ({members.length}名)
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {members.map((std, idx) => {
                          const isLeader = std.id === boyLeaderId || std.id === girlLeaderId;
                          return (
                            <tr key={std.id} className="border-t border-slate-100">
                              <td className="p-2 w-8 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-2 font-bold text-slate-800">
                                <div className="flex items-center gap-1">
                                  <span>{isLeader ? '◯ ' : ''}{std.name}</span>
                                </div>
                                <div className="text-[9px] text-slate-400">{std.furigana}</div>
                              </td>
                              <td className="p-2 text-center text-[10px] text-slate-500 font-bold">
                                {std.gender === 'boy' ? '男' : '女'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="flex items-center gap-1 px-4 py-2 text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
              シャッフルに戻る
            </button>
            <button
              type="button"
              onClick={() => setStep(6)}
              id="btn-group-step5-next"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span>詳細設定（役割分担票）へ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Detailed Roles Assignment */}
      {step === 6 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              ステップ 6: 班の役割分担票（詳細設定）
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              各班のメンバーに対して、係・役割（班長、給食係、保健係など）をドロップダウンで割り当てます。役割の追加・編集も可能です。
            </p>
          </div>

          {/* Role definitions manager */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700">役割・係リストの編集・追加</div>
            <div className="flex flex-wrap gap-2 items-center">
              {roleDefinitions.map((roleName, rIdx) => (
                <div key={rIdx} className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                  <span>{roleName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRoleDefinitions(roleDefinitions.filter((_, idx) => idx !== rIdx));
                    }}
                    className="text-slate-400 hover:text-rose-600 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="新しい役割名"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newRoleName.trim()) {
                      setRoleDefinitions([...roleDefinitions, newRoleName.trim()]);
                      setNewRoleName('');
                    }
                  }}
                  className="px-3 py-1 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700"
                >
                  追加
                </button>
              </div>
            </div>
          </div>

          {/* Roles Assignment per Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: numGroups }).map((_, i) => {
              const gId = i + 1;
              const palette = DISTINCT_GROUP_COLORS[i % DISTINCT_GROUP_COLORS.length];
              const members = workingStudents.filter(s => s.groupId === gId);
              const groupRoles = rolesByGroup[gId] || [];

              return (
                <div key={gId} className="border rounded-2xl p-4 bg-white space-y-3" style={{ borderColor: palette.border }}>
                  <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: palette.border }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: palette.hex }} />
                      <span className="font-bold text-sm text-slate-800">{groupNames[i]} 役割分担</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {roleDefinitions.map((roleName, rIdx) => {
                      const currentAssigned = groupRoles.find(r => r.roleName === roleName)?.studentId ?? null;

                      return (
                        <div key={rIdx} className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-bold text-slate-600 w-28 truncate">{roleName}</span>
                          <select
                            value={currentAssigned ?? ''}
                            onChange={(e) => {
                              const stdId = e.target.value ? Number(e.target.value) : null;
                              const updatedGroupRoles = [...(rolesByGroup[gId] || [])];
                              const existingIdx = updatedGroupRoles.findIndex(r => r.roleName === roleName);

                              if (existingIdx >= 0) {
                                updatedGroupRoles[existingIdx] = { ...updatedGroupRoles[existingIdx], studentId: stdId };
                              } else {
                                updatedGroupRoles.push({
                                  roleId: `role-${gId}-${rIdx}`,
                                  roleName,
                                  studentId: stdId,
                                });
                              }

                              setRolesByGroup({
                                ...rolesByGroup,
                                [gId]: updatedGroupRoles,
                              });
                            }}
                            className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-indigo-400"
                          >
                            <option value="">（未割り当て）</option>
                            {members.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(5)}
              className="flex items-center gap-1 px-4 py-2 text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
              一覧表に戻る
            </button>
            <button
              type="button"
              onClick={() => setStep(7)}
              id="btn-group-step6-next"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span>班編成の完成画面へ</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: Completed Final View */}
      {step === 7 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="text-center space-y-2 pb-4 border-b border-slate-100">
            <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800">生活班の編成が完成しました！</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              各班のメンバーおよび役割分担が確定しました。印刷・PDF保存してご利用ください。
            </p>
          </div>

          {/* Printable Combined View */}
          <div className="printable-group-final border-2 border-slate-800 rounded-2xl p-6 bg-white space-y-6">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-black text-slate-800">生活班 班名簿＆役割分担表</h2>
              <div className="text-xs text-slate-500 mt-1">クラス総計: {totalStudents} 名</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: numGroups }).map((_, i) => {
                const gId = i + 1;
                const palette = DISTINCT_GROUP_COLORS[i % DISTINCT_GROUP_COLORS.length];
                const members = workingStudents.filter(s => s.groupId === gId);
                const boyLeaderId = groupBoyLeaders[i];
                const girlLeaderId = groupGirlLeaders[i];
                const gRoles = rolesByGroup[gId] || [];

                return (
                  <div key={gId} className="border-2 rounded-xl overflow-hidden" style={{ borderColor: palette.border }}>
                    <div className="p-3 font-black text-center" style={{ backgroundColor: palette.bgLight, color: palette.text }}>
                      {groupNames[i]} ({members.length}名)
                    </div>

                    <div className="p-3 space-y-3">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">メンバー</div>
                        <div className="space-y-1">
                          {members.map(std => {
                            const isLeader = std.id === boyLeaderId || std.id === girlLeaderId;
                            return (
                              <div key={std.id} className="text-xs flex items-center justify-between">
                                <span className={`font-bold ${isLeader ? 'text-indigo-950 font-extrabold' : 'text-slate-800'}`}>
                                  {isLeader ? '◯ ' : ''}{std.name}
                                </span>
                                <span className="text-[10px] text-slate-400">{std.furigana}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {gRoles.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">役割分担</div>
                          <div className="space-y-1">
                            {gRoles.filter(r => r.studentId !== null).map((r, rIdx) => {
                              const std = studentMap.get(r.studentId!);
                              return (
                                <div key={rIdx} className="text-xs flex items-center justify-between">
                                  <span className="font-medium text-slate-500">{r.roleName}:</span>
                                  <span className="font-bold text-slate-800">{std?.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>印刷プレビュー</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>PDF / 印刷する</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadWord}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Word形式で保存 (.doc)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveAndComplete}
              id="btn-complete-and-return-to-hub"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>確定して生徒用画面に戻る</span>
            </button>
          </div>

          {/* Modal for Print Preview */}
          {showPrintPreview && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-sm">印刷プレビュー（A4 印刷イメージ）</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPrintPreview(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
                  <div className="bg-white border shadow-sm p-8 max-w-3xl mx-auto rounded-lg space-y-6">
                    <div className="text-center border-b pb-4">
                      <h1 className="text-2xl font-black text-slate-900">生活班 班名簿＆役割分担表</h1>
                      <p className="text-xs text-slate-500 mt-1">クラス総人数: {totalStudents}名（男子: {boysCount}名 / 女子: {girlsCount}名）</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {Array.from({ length: numGroups }).map((_, i) => {
                        const gId = i + 1;
                        const palette = DISTINCT_GROUP_COLORS[i % DISTINCT_GROUP_COLORS.length];
                        const members = workingStudents.filter(s => s.groupId === gId);
                        const boyLeaderId = groupBoyLeaders[i];
                        const girlLeaderId = groupGirlLeaders[i];
                        const gRoles = rolesByGroup[gId] || [];

                        return (
                          <div key={gId} className="border-2 rounded-lg p-3 text-xs space-y-2" style={{ borderColor: palette.border }}>
                            <div className="font-bold text-center py-1 rounded" style={{ backgroundColor: palette.bgLight, color: palette.text }}>
                              {groupNames[i]} ({members.length}名)
                            </div>
                            <div className="space-y-1">
                              {members.map(std => {
                                const isLeader = std.id === boyLeaderId || std.id === girlLeaderId;
                                const role = gRoles.find(r => r.studentId === std.id);
                                return (
                                  <div key={std.id} className="flex items-center justify-between text-[11px]">
                                    <span className={isLeader ? 'font-black text-indigo-900' : 'text-slate-700'}>
                                      {isLeader ? '◯ ' : ''}{std.name}
                                    </span>
                                    {role && (
                                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded">
                                        {role.roleName}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadWord}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Word保存</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrintPreview(false);
                      handlePrint();
                    }}
                    className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
                  >
                    <Printer className="w-4 h-4" />
                    <span>印刷を実行</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
