import React, { useState } from 'react';
import { Student, PairRule, LifeGroup, Gender, DISTINCT_GROUP_COLORS } from '../types';
import { suggestFurigana } from '../utils/furiganaHelper';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Trash2, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  UserMinus, 
  HeartHandshake, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  Plus,
  Minus
} from 'lucide-react';

interface ZeroSettingsProps {
  students?: Student[];
  pairRules?: PairRule[];
  defaultGroups?: LifeGroup[];
  rows?: number;
  columns?: number;
  onUpdateStudents: (students: Student[]) => void;
  onUpdatePairRules: (rules: PairRule[]) => void;
  onUpdateGroups: (groups: LifeGroup[]) => void;
  onUpdateDimensions: (rows: number, columns: number) => void;
  onProceedToStudentMode: () => void;
}

export const ZeroSettings: React.FC<ZeroSettingsProps> = ({
  students = [],
  pairRules = [],
  defaultGroups = [],
  rows = 6,
  columns = 6,
  onUpdateStudents,
  onUpdatePairRules,
  onUpdateGroups,
  onUpdateDimensions,
  onProceedToStudentMode,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'pairs' | 'positions'>('students');
  const [bulkText, setBulkText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);

  // New Student input form
  const [newName, setNewName] = useState('');
  const [newFurigana, setNewFurigana] = useState('');
  const [newGender, setNewGender] = useState<Gender>('boy');

  // Pair Rule inputs
  const [pairStudentA, setPairStudentA] = useState<number>(students?.[0]?.id || 1);
  const [pairStudentB, setPairStudentB] = useState<number>(students?.[1]?.id || 2);
  const [pairType, setPairType] = useState<'avoid' | 'together'>('avoid');

  // Position preference inputs
  const [selectedStudentForPos, setSelectedStudentForPos] = useState<number>(students?.[0]?.id || 1);
  const [posRow, setPosRow] = useState<'front' | 'middle' | 'back' | 'none'>('none');
  const [posCol, setPosCol] = useState<'left' | 'center' | 'right' | 'none'>('none');

  const safeStudents = students || [];
  const boysCount = safeStudents.filter(s => s.gender === 'boy').length;
  const girlsCount = safeStudents.filter(s => s.gender === 'girl').length;
  const totalStudents = safeStudents.length;

  // Adjust count of specific gender dynamically
  const handleAdjustGenderCount = (gender: Gender, targetCount: number) => {
    const validCount = Math.max(1, Math.min(30, Math.floor(targetCount)));
    const currentBoys = safeStudents.filter(s => s.gender === 'boy');
    const currentGirls = safeStudents.filter(s => s.gender === 'girl');
    let updatedBoys = [...currentBoys];
    let updatedGirls = [...currentGirls];

    if (gender === 'boy') {
      if (validCount > currentBoys.length) {
        const toAdd = validCount - currentBoys.length;
        const startNum = currentBoys.length + 1;
        let maxId = safeStudents.length > 0 ? Math.max(...safeStudents.map(s => s.id)) : 0;
        for (let i = 0; i < toAdd; i++) {
          const num = startNum + i;
          maxId++;
          updatedBoys.push({
            id: maxId,
            name: `男子${num}`,
            furigana: `だんし${num}`,
            gender: 'boy',
            groupId: null,
            prefRow: 'none',
            prefCol: 'none',
          });
        }
      } else if (validCount < currentBoys.length) {
        const removedBoys = updatedBoys.slice(validCount);
        const removedIds = new Set(removedBoys.map(s => s.id));
        updatedBoys = updatedBoys.slice(0, validCount);
        onUpdatePairRules(pairRules.filter(r => !removedIds.has(r.studentAId) && !removedIds.has(r.studentBId)));
      }
    } else {
      if (validCount > currentGirls.length) {
        const toAdd = validCount - currentGirls.length;
        const startNum = currentGirls.length + 1;
        let maxId = safeStudents.length > 0 ? Math.max(...safeStudents.map(s => s.id)) : 0;
        for (let i = 0; i < toAdd; i++) {
          const num = startNum + i;
          maxId++;
          updatedGirls.push({
            id: maxId,
            name: `女子${num}`,
            furigana: `じょし${num}`,
            gender: 'girl',
            groupId: null,
            prefRow: 'none',
            prefCol: 'none',
          });
        }
      } else if (validCount < currentGirls.length) {
        const removedGirls = updatedGirls.slice(validCount);
        const removedIds = new Set(removedGirls.map(s => s.id));
        updatedGirls = updatedGirls.slice(0, validCount);
        onUpdatePairRules(pairRules.filter(r => !removedIds.has(r.studentAId) && !removedIds.has(r.studentBId)));
      }
    }

    onUpdateStudents([...updatedBoys, ...updatedGirls]);
  };

  // Adjust total count
  const handleAdjustTotalCount = (targetTotal: number) => {
    const validTotal = Math.max(2, Math.min(60, Math.floor(targetTotal)));
    const half = Math.floor(validTotal / 2);
    const boysTarget = half + (validTotal % 2);
    const girlsTarget = half;

    const currentBoys = safeStudents.filter(s => s.gender === 'boy');
    const currentGirls = safeStudents.filter(s => s.gender === 'girl');
    let updatedBoys = [...currentBoys];
    let updatedGirls = [...currentGirls];

    let maxId = safeStudents.length > 0 ? Math.max(...safeStudents.map(s => s.id)) : 0;

    // Adjust boys
    if (boysTarget > currentBoys.length) {
      const toAdd = boysTarget - currentBoys.length;
      for (let i = 0; i < toAdd; i++) {
        maxId++;
        const num = currentBoys.length + i + 1;
        updatedBoys.push({
          id: maxId,
          name: `男子${num}`,
          furigana: `だんし${num}`,
          gender: 'boy',
          groupId: null,
          prefRow: 'none',
          prefCol: 'none',
        });
      }
    } else {
      updatedBoys = updatedBoys.slice(0, boysTarget);
    }

    // Adjust girls
    if (girlsTarget > currentGirls.length) {
      const toAdd = girlsTarget - currentGirls.length;
      for (let i = 0; i < toAdd; i++) {
        maxId++;
        const num = currentGirls.length + i + 1;
        updatedGirls.push({
          id: maxId,
          name: `女子${num}`,
          furigana: `じょし${num}`,
          gender: 'girl',
          groupId: null,
          prefRow: 'none',
          prefCol: 'none',
        });
      }
    } else {
      updatedGirls = updatedGirls.slice(0, girlsTarget);
    }

    const currentIds = new Set([...updatedBoys, ...updatedGirls].map(s => s.id));
    onUpdatePairRules(pairRules.filter(r => currentIds.has(r.studentAId) && currentIds.has(r.studentBId)));
    onUpdateStudents([...updatedBoys, ...updatedGirls]);
  };

  // Add individual student with auto-furigana
  const handleAddStudent = () => {
    if (!newName.trim()) return;
    const nextId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    const autoFuri = suggestFurigana(newName.trim());
    const newStd: Student = {
      id: nextId,
      name: newName.trim(),
      furigana: newFurigana.trim() || autoFuri || newName.trim(),
      gender: newGender,
      groupId: null,
      prefRow: 'none',
      prefCol: 'none',
    };
    onUpdateStudents([...students, newStd]);
    setNewName('');
    setNewFurigana('');
  };

  // Remove individual student
  const handleRemoveStudent = (id: number) => {
    const updated = students.filter(s => s.id !== id);
    onUpdateStudents(updated);
    // Also remove from pair rules
    onUpdatePairRules(pairRules.filter(r => r.studentAId !== id && r.studentBId !== id));
  };

  // Parse bulk pasted text (Excel, tab-delimited, space-delimited, or line by line)
  const handleApplyBulkText = () => {
    if (!bulkText.trim()) {
      setBulkParseError('テキストを入力してください');
      return;
    }

    try {
      const lines = bulkText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      const parsed: Student[] = [];

      lines.forEach((line, index) => {
        // Support tab, comma, or whitespace splitting
        const parts = line.split(/[\t, ]+/).filter(Boolean);
        if (parts.length === 0) return;

        let name = parts[0];
        let furigana = '';
        let gender: Gender = 'boy';

        if (parts.length === 1) {
          // Just name
          furigana = name;
          gender = index % 2 === 0 ? 'boy' : 'girl';
        } else if (parts.length === 2) {
          // name + gender or name + furigana
          const second = parts[1].toLowerCase();
          if (second === '男' || second === '男子' || second === 'boy' || second === 'm') {
            gender = 'boy';
            furigana = name;
          } else if (second === '女' || second === '女子' || second === 'girl' || second === 'f') {
            gender = 'girl';
            furigana = name;
          } else {
            furigana = parts[1];
            gender = index % 2 === 0 ? 'boy' : 'girl';
          }
        } else {
          // name + furigana + gender
          furigana = parts[1];
          const third = parts[2].toLowerCase();
          if (third === '女' || third === '女子' || third === 'girl' || third === 'f') {
            gender = 'girl';
          } else {
            gender = 'boy';
          }
        }

        parsed.push({
          id: index + 1,
          name,
          furigana: furigana || name,
          gender,
          groupId: null,
          prefRow: 'none',
          prefCol: 'none',
        });
      });

      if (parsed.length === 0) {
        setBulkParseError('有効な生徒データが読み取れませんでした');
        return;
      }

      onUpdateStudents(parsed);
      setShowBulkModal(false);
      setBulkText('');
      setBulkParseError(null);
    } catch {
      setBulkParseError('パース中にエラーが発生しました');
    }
  };

  // Add pair rule
  const handleAddPairRule = () => {
    if (pairStudentA === pairStudentB) return;

    // Check duplicate
    const exists = pairRules.some(
      r => (r.studentAId === pairStudentA && r.studentBId === pairStudentB) ||
           (r.studentAId === pairStudentB && r.studentBId === pairStudentA)
    );
    if (exists) return;

    const newRule: PairRule = {
      id: `${Date.now()}-${Math.random()}`,
      studentAId: pairStudentA,
      studentBId: pairStudentB,
      type: pairType,
    };
    onUpdatePairRules([...pairRules, newRule]);
  };

  const handleRemovePairRule = (id: string) => {
    onUpdatePairRules(pairRules.filter(r => r.id !== id));
  };

  // Apply student position preference
  const handleApplyStudentPos = () => {
    const updated = students.map(s => {
      if (s.id === selectedStudentForPos) {
        return {
          ...s,
          prefRow: posRow,
          prefCol: posCol,
        };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  // Update Group Preference
  const handleUpdateGroupPref = (groupId: number, prefRow: 'front' | 'back' | 'none', prefCol: 'left' | 'center' | 'right' | 'none') => {
    const updated = defaultGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, prefRow, prefCol };
      }
      return g;
    });
    onUpdateGroups(updated);
  };

  const studentMap = new Map<number, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Secret / Teacher Header Badge */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400/20 text-amber-300 text-[11px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                先生専用・非公開設定
              </span>
              <span className="text-xs text-slate-400">※生徒には非公開</span>
            </div>
            <h1 className="text-xl font-black text-white mt-0.5">ゼロ設定（基本台帳・ペア制限・希望配置）</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={onProceedToStudentMode}
          id="btn-move-to-student-mode"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Users className="w-5 h-5" />
          <span>生徒用画面に戻る</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Overview Stats Card with interactive count controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500">
            クラス人数・男女比のクイック変更（人数の変更に合わせて下の名簿が自動連動します）
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Students */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="text-xs font-bold text-slate-500">登録生徒総数</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-2xl font-black text-slate-800">
                {totalStudents} <span className="text-xs font-normal text-slate-500">人</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAdjustTotalCount(totalStudents - 1)}
                  disabled={totalStudents <= 2}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 disabled:opacity-40 cursor-pointer"
                  title="1名減らす"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustTotalCount(totalStudents + 1)}
                  disabled={totalStudents >= 60}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 disabled:opacity-40 cursor-pointer"
                  title="1名増やす"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Boys Count */}
          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex flex-col justify-between">
            <div className="text-xs font-bold text-blue-700">男子人数</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-2xl font-black text-blue-800">
                {boysCount} <span className="text-xs font-normal text-blue-600">人</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAdjustGenderCount('boy', boysCount - 1)}
                  disabled={boysCount <= 1}
                  className="w-7 h-7 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 flex items-center justify-center text-blue-700 disabled:opacity-40 cursor-pointer"
                  title="男子を1名減らす"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustGenderCount('boy', boysCount + 1)}
                  disabled={boysCount >= 30}
                  className="w-7 h-7 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 flex items-center justify-center text-blue-700 disabled:opacity-40 cursor-pointer"
                  title="男子を1名増やす"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Girls Count */}
          <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 flex flex-col justify-between">
            <div className="text-xs font-bold text-rose-700">女子人数</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-2xl font-black text-rose-800">
                {girlsCount} <span className="text-xs font-normal text-rose-600">人</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAdjustGenderCount('girl', girlsCount - 1)}
                  disabled={girlsCount <= 1}
                  className="w-7 h-7 rounded-lg bg-white border border-rose-200 hover:bg-rose-100 flex items-center justify-center text-rose-700 disabled:opacity-40 cursor-pointer"
                  title="女子を1名減らす"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustGenderCount('girl', girlsCount + 1)}
                  disabled={girlsCount >= 30}
                  className="w-7 h-7 rounded-lg bg-white border border-rose-200 hover:bg-rose-100 flex items-center justify-center text-rose-700 disabled:opacity-40 cursor-pointer"
                  title="女子を1名増やす"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Pair / Condition Rules */}
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 flex flex-col justify-between">
            <div className="text-xs font-bold text-amber-700">ペア制限 / 個別希望</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-2xl font-black text-amber-800">
                {pairRules.length} <span className="text-xs font-normal text-amber-600">組</span>
              </div>
              <span className="text-[10px] bg-amber-200/60 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                非公開
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            生徒名簿・男女比（一括貼付）
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pairs')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'pairs'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserMinus className="w-4 h-4" />
            離すペア / 一緒にするペア
            {pairRules.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {pairRules.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'positions'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            固定・希望位置（班/個人）
          </button>
        </div>

        {/* TAB 1: Students Management */}
        {activeTab === 'students' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-800">生徒名簿と男女情報</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  生徒の名前・ふりがな・性別を登録します。エクセルや名簿テキストから一括貼り付けも可能です。
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  id="btn-bulk-paste-modal"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  名簿の一括貼り付け・入力
                </button>
              </div>
            </div>

            {/* Individual Add Form */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  名前（氏名）
                  <span className="text-[10px] text-indigo-600 font-normal ml-1">※ふりがな自動補完</span>
                </label>
                <input
                  type="text"
                  placeholder="例: 山田 太郎"
                  value={newName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewName(val);
                    if (val.trim()) {
                      const suggested = suggestFurigana(val);
                      setNewFurigana(suggested);
                    } else {
                      setNewFurigana('');
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">ふりがな</label>
                <input
                  type="text"
                  placeholder="例: やまだ たろう"
                  value={newFurigana}
                  onChange={(e) => setNewFurigana(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="w-28">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">性別</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as Gender)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="boy">男子</option>
                  <option value="girl">女子</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddStudent}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                追加
              </button>
            </div>

            {/* Students Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-12 text-center">No.</th>
                    <th className="p-3">名前</th>
                    <th className="p-3">ふりがな</th>
                    <th className="p-3 w-28 text-center">性別</th>
                    <th className="p-3 w-16 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student, index) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-400 font-mono font-bold">
                        {index + 1}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={student.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            const currentFuri = student.furigana;
                            const isDefaultOrMatchesOld = !currentFuri || currentFuri === student.name || currentFuri === suggestFurigana(student.name);
                            const newFuri = isDefaultOrMatchesOld && val.trim() ? suggestFurigana(val) : currentFuri;
                            onUpdateStudents(students.map(s => s.id === student.id ? { ...s, name: val, furigana: newFuri } : s));
                          }}
                          className="w-full px-2 py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded font-bold text-slate-800"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={student.furigana}
                          onChange={(e) => {
                            const val = e.target.value;
                            onUpdateStudents(students.map(s => s.id === student.id ? { ...s, furigana: val } : s));
                          }}
                          className="w-full px-2 py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded text-slate-600 text-xs"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const nextGender: Gender = student.gender === 'boy' ? 'girl' : 'boy';
                            onUpdateStudents(students.map(s => s.id === student.id ? { ...s, gender: nextGender } : s));
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            student.gender === 'boy'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {student.gender === 'boy' ? '男子' : '女子'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(student.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grid dimension preview & adjustment */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
              <div className="font-bold text-slate-700">教室レイアウト基本マス数（列×行）：</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">横列（最前列）：</span>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={columns}
                    onChange={(e) => onUpdateDimensions(rows, Math.max(2, parseInt(e.target.value) || 6))}
                    className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-center"
                  />
                  <span>列</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">縦行（奥行き）：</span>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={rows}
                    onChange={(e) => onUpdateDimensions(Math.max(2, parseInt(e.target.value) || 6), columns)}
                    className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-center"
                  />
                  <span>行</span>
                </div>
                <span className="text-slate-400 font-mono">（最大 {columns * rows} 席）</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Pair Rules (Avoid / Together) */}
        {activeTab === 'pairs' && (
          <div className="p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">生徒ペアの相性・配置条件設定</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                「近づけてはいけないペア（離すペア）」は席替え時・班編成時に絶対に離します。「一緒にすべきペア」は同じ班・近接席にまとめます。
              </p>
            </div>

            {/* Add Pair Form */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">生徒 A</label>
                  <select
                    value={pairStudentA}
                    onChange={(e) => setPairStudentA(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.gender === 'boy' ? '男' : '女'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">生徒 B</label>
                  <select
                    value={pairStudentB}
                    onChange={(e) => setPairStudentB(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.gender === 'boy' ? '男' : '女'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">条件タイプ</label>
                  <div className="flex gap-2">
                    <select
                      value={pairType}
                      onChange={(e) => setPairType(e.target.value as 'avoid' | 'together')}
                      className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                    >
                      <option value="avoid">離す（絶対NG）</option>
                      <option value="together">一緒にする（同班推奨）</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddPairRule}
                      disabled={pairStudentA === pairStudentB}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
                    >
                      追加
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* List of Registered Rules */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500">登録済みのペア条件（{pairRules.length} 件）</div>

              {pairRules.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                  ペア制限は現在登録されていません
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pairRules.map(rule => {
                    const sA = studentMap.get(rule.studentAId);
                    const sB = studentMap.get(rule.studentBId);
                    const isAvoid = rule.type === 'avoid';

                    return (
                      <div
                        key={rule.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 shadow-2xs ${
                          isAvoid
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded-lg ${isAvoid ? 'bg-rose-200/80 text-rose-800' : 'bg-emerald-200/80 text-emerald-800'}`}>
                            {isAvoid ? <UserMinus className="w-4 h-4" /> : <HeartHandshake className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">
                              {sA?.name || '不明'} & {sB?.name || '不明'}
                            </div>
                            <div className="text-[11px] opacity-80 mt-0.5 font-medium">
                              {isAvoid ? '🚫 絶対に離す（2席以上＆別班）' : '✨ 一緒にする（同班・近接）'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePairRule(rule.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white/80 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Positions (Group & Individual Preferred Positions) */}
        {activeTab === 'positions' && (
          <div className="p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">席替え場所の固定・希望条件（ゼロ設定）</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                生活班ごとの大まかな希望位置や、個人生徒の「前列希望」「端席希望」などの配慮条件を設定します。
              </p>
            </div>

            {/* Individual Student Position */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                個人の希望・固定位置（視力・配慮など）
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">対象生徒</label>
                  <select
                    value={selectedStudentForPos}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedStudentForPos(id);
                      const std = studentMap.get(id);
                      if (std) {
                        setPosRow(std.prefRow || 'none');
                        setPosCol(std.prefCol || 'none');
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.gender === 'boy' ? '男' : '女'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-32">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">縦（前後）</label>
                  <select
                    value={posRow}
                    onChange={(e) => setPosRow(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="none">指定なし</option>
                    <option value="front">前列（前側）</option>
                    <option value="middle">中列（中央）</option>
                    <option value="back">後列（後ろ側）</option>
                  </select>
                </div>

                <div className="w-32">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">横（左右）</label>
                  <select
                    value={posCol}
                    onChange={(e) => setPosCol(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="none">指定なし</option>
                    <option value="left">左側（窓側）</option>
                    <option value="center">中央</option>
                    <option value="right">右側（廊下側）</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleApplyStudentPos}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
                >
                  条件を保存
                </button>
              </div>

              {/* Display students with custom positions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {students.filter(s => (s.prefRow && s.prefRow !== 'none') || (s.prefCol && s.prefCol !== 'none')).map(s => (
                  <div key={s.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {s.prefRow === 'front' ? '前列' : s.prefRow === 'back' ? '後列' : s.prefRow === 'middle' ? '中列' : ''}
                        {' '}
                        {s.prefCol === 'left' ? '左側' : s.prefCol === 'right' ? '右側' : s.prefCol === 'center' ? '中央' : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateStudents(students.map(st => st.id === s.id ? { ...st, prefRow: 'none', prefCol: 'none' } : st));
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="クリア"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Life Groups Positions */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                生活班ごとの希望配置（前/後・左/中/右）
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {defaultGroups.map((group, idx) => {
                  const palette = DISTINCT_GROUP_COLORS[idx % DISTINCT_GROUP_COLORS.length];
                  return (
                    <div
                      key={group.id}
                      className="p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-white"
                      style={{ borderColor: palette.border }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: palette.hex }}
                        />
                        <span className="font-bold text-xs sm:text-sm text-slate-800">{group.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={group.prefRow || 'none'}
                          onChange={(e) => handleUpdateGroupPref(group.id, e.target.value as any, group.prefCol || 'none')}
                          className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded font-medium"
                        >
                          <option value="none">縦: 指定なし</option>
                          <option value="front">前列</option>
                          <option value="back">後列</option>
                        </select>

                        <select
                          value={group.prefCol || 'none'}
                          onChange={(e) => handleUpdateGroupPref(group.id, group.prefRow || 'none', e.target.value as any)}
                          className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded font-medium"
                        >
                          <option value="none">横: 指定なし</option>
                          <option value="left">左側</option>
                          <option value="center">中央</option>
                          <option value="right">右側</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Row */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <span className="text-xs text-slate-500 font-medium">
          ※ ゼロ設定内容はブラウザに自動保存されます。
        </span>

        <button
          type="button"
          onClick={onProceedToStudentMode}
          id="btn-bottom-return-student-mode"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition-all cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>生徒用画面に戻る</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bulk Paste Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                名簿の一括貼り付け・自動パース
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Excelやスプレッドシート、テキストからコピーした内容をそのまま貼り付けてください。<br />
              <strong>対応形式：</strong><br />
              ・「名前　ふりがな　性別（男/女）」<br />
              ・「名前　性別」<br />
              ・「名前」のみ（改行区切り）
            </p>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="田中 太郎	たなか たろう	男&#10;佐藤 花子	さとう はなこ	女&#10;鈴木 一郎	すずき いちろう	男"
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />

            {bulkParseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bulkParseError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleApplyBulkText}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                名簿を反映する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
