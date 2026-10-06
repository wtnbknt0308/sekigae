import React, { useState, useMemo } from 'react';
import { Seat, Student, LifeGroup, DISTINCT_GROUP_COLORS } from '../types';
import { 
  ChevronLeft, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  Monitor,
  Eye,
  X,
  GraduationCap,
  School,
  Layers,
  FileCode,
  Download,
  Code,
  Users
} from 'lucide-react';

interface FinalResultProps {
  seats: Seat[];
  students: Student[];
  groups: LifeGroup[];
  hasGroups: boolean;
  rows: number;
  columns: number;
  onBack: () => void;
  onRestart?: () => void;
  onBackToStudentHub?: () => void;
}

type DisplayViewMode = 'both' | 'student' | 'teacher';
type PrintTargetMode = 'both' | 'student' | 'teacher';

export const FinalResult: React.FC<FinalResultProps> = ({
  seats,
  students,
  groups,
  hasGroups,
  rows,
  columns,
  onBack,
  onRestart,
  onBackToStudentHub,
}) => {
  const [copied, setCopied] = useState(false);
  const [chartTitle, setChartTitle] = useState('クラス座席表');
  const [viewMode, setViewMode] = useState<DisplayViewMode>('both');
  const [printTarget, setPrintTarget] = useState<PrintTargetMode>('both');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);

  const studentMap = useMemo(() => {
    return new Map<number, Student>(students.map(s => [s.id, s]));
  }, [students]);

  const groupMap = useMemo(() => {
    return new Map<number, LifeGroup>(groups.map(g => [g.id, g]));
  }, [groups]);

  // Action: Trigger standard print window with specific mode
  const handlePrint = (mode: PrintTargetMode = 'both') => {
    setPrintTarget(mode);
    // Short timeout to let react apply the print classes if needed before window.print()
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Helper to build a table in Word HTML
  const generateWordTable = (isTeacherView: boolean) => {
    let html = `
      <div style="page-break-after: ${isTeacherView ? 'auto' : 'always'}; margin-bottom: 40px;">
        <h1 style="text-align: center; font-size: 18pt; margin-bottom: 2px;">
          ${chartTitle}（${isTeacherView ? '教師用・教卓が下' : '生徒用・教卓が上'}）
        </h1>
        <div style="text-align: center; font-size: 9pt; color: #64748b; margin-bottom: 15px;">
          作成日: ${new Date().toLocaleDateString('ja-JP')}
        </div>
    `;

    if (!isTeacherView) {
      // Student View: Front Blackboard at top
      html += `
        <div style="text-align: center; background-color: #1e293b; color: #ffffff; padding: 6px; font-weight: bold; width: 65%; margin: 0 auto 4px; border-radius: 4px; font-size: 10pt;">
          黒板 (FRONT)
        </div>
        <div style="text-align: center; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; width: 25%; margin: 0 auto 16px; border-radius: 4px; font-size: 9pt;">
          教卓
        </div>
      `;
    }

    html += `<table style="width: 100%; border-collapse: separate; border-spacing: 6px; margin: 0 auto;">`;

    // Row order: standard (0 -> rows-1) for student, reversed (rows-1 -> 0) for teacher
    const rowIndices = isTeacherView
      ? Array.from({ length: rows }, (_, i) => rows - 1 - i)
      : Array.from({ length: rows }, (_, i) => i);

    for (const r of rowIndices) {
      html += `<tr>`;
      for (let c = 0; c < columns; c++) {
        const seat = seats.find(s => s.row === r && s.col === c);
        if (!seat || seat.disabled || seat.studentId === null) {
          html += `<td style="width: ${Math.floor(100 / columns)}%; border: 1px dashed #cbd5e1; background-color: #f8fafc; color: #94a3b8; font-size: 8pt; text-align: center; padding: 8px 2px;">
            ${seat?.disabled ? '✕' : '空席'}
          </td>`;
        } else {
          const student = studentMap.get(seat.studentId);
          const group = student?.groupId ? groupMap.get(student.groupId) : null;
          const groupPalette = student?.groupId
            ? DISTINCT_GROUP_COLORS[(student.groupId - 1) % DISTINCT_GROUP_COLORS.length]
            : null;

          const borderColor = hasGroups && groupPalette 
            ? groupPalette.border 
            : (student?.gender === 'boy' ? '#3b82f6' : (student?.gender === 'girl' ? '#f43f5e' : '#cbd5e1'));
          const bgColor = hasGroups && groupPalette 
            ? groupPalette.bgLight 
            : (student?.gender === 'boy' ? '#eff6ff' : (student?.gender === 'girl' ? '#fff1f2' : '#ffffff'));

          html += `
            <td style="width: ${Math.floor(100 / columns)}%; border: 2px solid ${borderColor}; background-color: ${bgColor}; border-radius: 6px; padding: 6px 2px; text-align: center; vertical-align: middle;">
              ${group ? `<div style="font-size: 7pt; font-weight: bold; color: ${groupPalette?.text || '#334155'};">${group.name}</div>` : ''}
              <div style="font-size: 7.5pt; color: #64748b;">${student?.furigana || ''}</div>
              <div style="font-size: 11pt; font-weight: bold; color: #0f172a;">${student?.name || ''}</div>
            </td>
          `;
        }
      }
      html += `</tr>`;
    }

    html += `</table>`;

    if (isTeacherView) {
      // Teacher View: Blackboard & podium at bottom
      html += `
        <div style="text-align: center; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; width: 25%; margin: 16px auto 4px; border-radius: 4px; font-size: 9pt;">
          教卓
        </div>
        <div style="text-align: center; background-color: #1e293b; color: #ffffff; padding: 6px; font-weight: bold; width: 65%; margin: 0 auto; border-radius: 4px; font-size: 10pt;">
          黒板 (FRONT)
        </div>
      `;
    }

    html += `</div>`;
    return html;
  };

  // Action: Export as Word Document (.doc via HTML/XML)
  const handleDownloadWord = () => {
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${chartTitle}</title>
        <style>
          body { font-family: 'Yu Gothic', 'Hiragino Sans', sans-serif; padding: 20px; }
        </style>
      </head>
      <body>
        ${generateWordTable(false)}
        ${generateWordTable(true)}
        <div style="margin-top: 20px; text-align: center; font-size: 8pt; color: #94a3b8;">※ 班編成＆席替えジェネレーターで作成</div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `座席表_${chartTitle}_生徒用＆教師用_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Action: Format and copy text layout to clipboard
  const handleCopyText = () => {
    let textLayout = `=== ${chartTitle} ===\n作成日: ${new Date().toLocaleDateString('ja-JP')}\n\n`;

    // 1. Student View
    textLayout += `【① 生徒用座席表（教卓・黒板が上）】\n`;
    textLayout += `[ 黒板 (FRONT) / 教卓 ]\n`;
    for (let r = 0; r < rows; r++) {
      const rowSeats = seats.filter(s => s.row === r).sort((a, b) => a.col - b.col);
      const rowNames = rowSeats.map(seat => {
        if (seat.disabled || seat.studentId === null) return '[ 空席 ]';
        const student = studentMap.get(seat.studentId);
        return student ? `${student.name}(${student.furigana})` : '[ 空席 ]';
      });
      textLayout += `${r + 1}行目: ${rowNames.join('　|　')}\n`;
    }

    textLayout += `\n--------------------------------------------\n\n`;

    // 2. Teacher View
    textLayout += `【② 教師用座席表（教卓・黒板が下 / 先生目線）】\n`;
    for (let r = rows - 1; r >= 0; r--) {
      const rowSeats = seats.filter(s => s.row === r).sort((a, b) => a.col - b.col);
      const rowNames = rowSeats.map(seat => {
        if (seat.disabled || seat.studentId === null) return '[ 空席 ]';
        const student = studentMap.get(seat.studentId);
        return student ? `${student.name}(${student.furigana})` : '[ 空席 ]';
      });
      textLayout += `${r + 1}行目: ${rowNames.join('　|　')}\n`;
    }
    textLayout += `[ 教卓 / 黒板 (FRONT) ]\n`;

    navigator.clipboard.writeText(textLayout).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Helper to escape HTML characters
  const escapeHtml = (str: string): string => {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Generate complete, standalone HTML document
  const generateStandaloneHtml = (): string => {
    const currentDate = new Date().toLocaleDateString('ja-JP');

    const renderHtmlSection = (isTeacher: boolean) => {
      const rowIndices = isTeacher
        ? Array.from({ length: rows }, (_, i) => rows - 1 - i)
        : Array.from({ length: rows }, (_, i) => i);

      let sec = `
      <section class="sheet-card ${isTeacher ? 'teacher-page' : 'student-page'}">
        <div class="sheet-header">
          <div class="view-badge ${isTeacher ? 'view-badge-teacher' : 'view-badge-student'}">
            ${isTeacher ? '教師用座席表（教卓が下 / 先生目線）' : '生徒用座席表（教卓・黒板が上 / 生徒目線）'}
          </div>
          <h2 class="sheet-title">${escapeHtml(chartTitle)} ${isTeacher ? '（教師用）' : '（生徒用）'}</h2>
          <div class="sheet-date">作成日: ${currentDate}</div>
        </div>
      `;

      if (!isTeacher) {
        sec += `
        <div class="blackboard">黒板 (FRONT)</div>
        <div class="podium">教卓</div>
        `;
      }

      sec += `<table class="seating-table"><thead><tr>`;
      for (let c = 0; c < columns; c++) {
        sec += `<th class="col-heading">${c + 1}列</th>`;
      }
      sec += `</tr></thead><tbody>`;

      for (const r of rowIndices) {
        sec += `<tr>`;
        for (let c = 0; c < columns; c++) {
          const seat = seats.find(s => s.row === r && s.col === c);
          if (!seat || seat.disabled || seat.studentId === null) {
            sec += `
            <td class="seat-cell seat-empty-cell">
              <div class="seat-inner">
                <span class="empty-text">${seat?.disabled ? '✕' : '空席'}</span>
              </div>
            </td>
            `;
          } else {
            const student = studentMap.get(seat.studentId);
            const group = student?.groupId ? groupMap.get(student.groupId) : null;
            const groupPalette = student?.groupId
              ? DISTINCT_GROUP_COLORS[(student.groupId - 1) % DISTINCT_GROUP_COLORS.length]
              : null;

            const borderColor = hasGroups && groupPalette
              ? groupPalette.border
              : (student?.gender === 'boy' ? '#3b82f6' : (student?.gender === 'girl' ? '#f43f5e' : '#cbd5e1'));
            const bgColor = hasGroups && groupPalette
              ? groupPalette.bgLight
              : (student?.gender === 'boy' ? '#eff6ff' : (student?.gender === 'girl' ? '#fff1f2' : '#ffffff'));

            sec += `
            <td class="seat-cell" style="border: 2.5px solid ${borderColor}; background-color: ${bgColor};">
              <div class="seat-inner">
                ${group ? `
                  <div class="group-tag" style="color: ${groupPalette?.text || '#334155'};">
                    <span class="group-dot" style="background-color: ${groupPalette?.hex || '#64748b'};"></span>
                    <span>${escapeHtml(group.name)}</span>
                  </div>
                ` : ''}
                <div class="furigana">${escapeHtml(student?.furigana || '')}</div>
                <div class="student-name">${escapeHtml(student?.name || '')}</div>
              </div>
            </td>
            `;
          }
        }
        sec += `</tr>`;
      }
      sec += `</tbody></table>`;

      if (isTeacher) {
        sec += `
        <div class="podium" style="margin-top: 18px; margin-bottom: 6px;">教卓</div>
        <div class="blackboard">黒板 (FRONT)</div>
        `;
      }

      sec += `
        <div class="sheet-footer">※ 班編成＆席替えジェネレーターで作成</div>
      </section>
      `;

      return sec;
    };

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(chartTitle)} - 生徒用＆教師用座席表</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Hiragino Sans", "Yu Gothic", sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      padding: 24px 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .wrapper { max-width: 1040px; margin: 0 auto; }
    .nav-bar {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .nav-title {
      font-weight: 800;
      font-size: 15px;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .print-btn {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 9px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 1px 2px rgba(79,70,229,0.25);
      transition: background 0.15s;
    }
    .print-btn:hover { background: #4338ca; }
    .sheet-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px 28px;
      margin-bottom: 32px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .student-page {
      page-break-after: always;
      break-after: page;
    }
    .sheet-header { text-align: center; margin-bottom: 20px; }
    .view-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      margin-bottom: 8px;
      border: 1px solid transparent;
    }
    .view-badge-student { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
    .view-badge-teacher { background: #eef2ff; color: #4338ca; border-color: #c7d2fe; }
    .sheet-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .sheet-date { font-size: 11px; color: #64748b; }
    .blackboard {
      width: 55%;
      margin: 0 auto 6px;
      background: #1e293b;
      color: #f8fafc;
      text-align: center;
      padding: 8px;
      font-weight: 800;
      font-size: 13px;
      border-radius: 6px;
      letter-spacing: 3px;
      border: 2px solid #0f172a;
    }
    .podium {
      width: 22%;
      margin: 0 auto 18px;
      background: #f1f5f9;
      color: #475569;
      text-align: center;
      padding: 5px;
      font-weight: 800;
      font-size: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      letter-spacing: 2px;
    }
    .seating-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 10px;
      margin: 0 auto;
      table-layout: fixed;
    }
    .col-heading {
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      color: #94a3b8;
      padding-bottom: 4px;
    }
    .seat-cell {
      border-radius: 10px;
      height: 76px;
      vertical-align: middle;
      text-align: center;
      padding: 6px 4px;
      position: relative;
    }
    .seat-empty-cell {
      border: 1.5px dashed #cbd5e1;
      background-color: #f8fafc;
    }
    .seat-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    .group-tag {
      font-size: 9px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .group-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }
    .furigana {
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.1;
      margin-bottom: 2px;
    }
    .student-name {
      font-size: 14px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.2;
    }
    .empty-text {
      font-size: 11px;
      color: #94a3b8;
      font-style: italic;
    }
    .sheet-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body { background: transparent; padding: 0; margin: 0; }
      .no-print { display: none !important; }
      .wrapper { max-width: 100%; }
      .sheet-card {
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 10mm 4mm !important;
        margin: 0 !important;
      }
      .student-page {
        page-break-after: always !important;
        break-after: page !important;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="nav-bar no-print">
      <div class="nav-title">
        <span>🏫</span>
        <span>${escapeHtml(chartTitle)} - HTML座席表（生徒用＆教師用）</span>
      </div>
      <button class="print-btn" onclick="window.print()">
        <span>🖨️</span>
        <span>ブラウザから印刷 (Ctrl+P / Cmd+P)</span>
      </button>
    </div>

    ${renderHtmlSection(false)}
    ${renderHtmlSection(true)}
  </div>
</body>
</html>`;
  };

  // Action: Download as standalone HTML file
  const handleDownloadHtml = () => {
    const htmlContent = generateStandaloneHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `座席表_${chartTitle}_生徒用＆教師用_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Action: Copy standalone HTML source code
  const handleCopyHtml = () => {
    const htmlContent = generateStandaloneHtml();
    navigator.clipboard.writeText(htmlContent).then(() => {
      setHtmlCopied(true);
      setTimeout(() => setHtmlCopied(false), 2500);
    });
  };

  // Render Seating Chart Component (Reused for Student and Teacher Views)
  const renderSeatingChart = (isTeacherView: boolean) => {
    // When isTeacherView is true:
    // Rows are reversed: rows-1 (back row, 奥) at top, 0 (front row, 手前) at bottom.
    // Columns remain 1..columns (left to right facing forward).
    const rowIndices = isTeacherView
      ? Array.from({ length: rows }, (_, i) => rows - 1 - i)
      : Array.from({ length: rows }, (_, i) => i);

    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm print:border-0 print:p-0 print:shadow-none print:m-0">
        {/* Chart Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 shadow-2xs border bg-slate-100 text-slate-800 border-slate-200">
            {isTeacherView ? (
              <>
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>教師用座席表（教卓が下 / 先生目線）</span>
              </>
            ) : (
              <>
                <School className="w-3.5 h-3.5 text-emerald-600" />
                <span>生徒用座席表（黒板・教卓が上 / 生徒目線）</span>
              </>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {chartTitle} {isTeacherView ? '（教師用）' : '（生徒用）'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            作成日: {new Date().toLocaleDateString('ja-JP')}
          </p>
        </div>

        {/* Blackboard & Teacher Desk at TOP for Student View */}
        {!isTeacherView && (
          <div className="space-y-2 mb-6">
            <div className="w-3/5 mx-auto bg-slate-800 text-slate-100 py-1.5 rounded-lg text-center font-bold text-xs sm:text-sm tracking-widest border-2 border-slate-700">
              黒板 (FRONT)
            </div>
            <div className="w-1/4 mx-auto bg-slate-100 text-slate-600 py-1 rounded-lg flex items-center justify-center gap-1.5 border border-slate-200">
              <Monitor className="w-3.5 h-3.5 text-slate-400 no-print" />
              <span className="text-xs font-bold tracking-widest">教卓</span>
            </div>
          </div>
        )}

        {/* Desks Grid */}
        <div className="relative">
          {/* Column indicators */}
          <div className="grid gap-2 sm:gap-3 mb-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div key={colIdx} className="text-center text-[10px] sm:text-xs font-bold text-slate-400 font-mono">
                {colIdx + 1}列
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-2 sm:space-y-3">
            {rowIndices.map((rowIdx) => (
              <div key={rowIdx} className="relative">
                {/* Row label */}
                <div className="absolute -left-9 sm:-left-11 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-bold text-slate-400 font-mono text-right no-print">
                  {rowIdx + 1}行
                </div>

                <div
                  className="grid gap-2 sm:gap-3"
                  style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                >
                  {seats
                    .filter((s) => s.row === rowIdx)
                    .map((seat) => {
                      const student = seat.studentId !== null ? studentMap.get(seat.studentId) : null;
                      const group = student?.groupId ? groupMap.get(student.groupId) : null;
                      const groupPalette = student?.groupId
                        ? DISTINCT_GROUP_COLORS[(student.groupId - 1) % DISTINCT_GROUP_COLORS.length]
                        : null;

                      // Desk border reflects group color (or gender if no group)
                      let deskBgStyle: React.CSSProperties = {};

                      if (seat.disabled) {
                        deskBgStyle = {
                          backgroundColor: '#f8fafc',
                          borderColor: '#cbd5e1',
                        };
                      } else if (hasGroups && groupPalette) {
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
                          className={`aspect-4/3 rounded-xl border-2 sm:border-3 flex flex-col justify-center items-center p-1.5 sm:p-2 relative shadow-2xs ${
                            seat.disabled ? 'border-dashed opacity-50' : ''
                          }`}
                        >
                          {/* Group label */}
                          {hasGroups && group && !seat.disabled && (
                            <div className="absolute top-1 left-1.5 flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: groupPalette?.hex }}
                              />
                              <span
                                className="text-[8px] sm:text-[9px] font-extrabold truncate max-w-[42px] sm:max-w-none"
                                style={{ color: groupPalette?.text }}
                              >
                                {group.name}
                              </span>
                            </div>
                          )}

                          {student ? (
                            <div className="text-center w-full px-1">
                              <div className="text-[9px] sm:text-[10px] font-mono leading-none truncate text-slate-500 font-medium">
                                {student.furigana}
                              </div>
                              <div className="text-xs sm:text-sm md:text-base mt-1 leading-tight truncate text-slate-900 font-black">
                                {student.name}
                              </div>
                            </div>
                          ) : seat.disabled ? (
                            <span className="text-[10px] font-bold text-slate-400">空席</span>
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

        {/* Blackboard & Teacher Desk at BOTTOM for Teacher View */}
        {isTeacherView && (
          <div className="space-y-2 mt-6">
            <div className="w-1/4 mx-auto bg-slate-100 text-slate-600 py-1 rounded-lg flex items-center justify-center gap-1.5 border border-slate-200">
              <Monitor className="w-3.5 h-3.5 text-slate-400 no-print" />
              <span className="text-xs font-bold tracking-widest">教卓</span>
            </div>
            <div className="w-3/5 mx-auto bg-slate-800 text-slate-100 py-1.5 rounded-lg text-center font-bold text-xs sm:text-sm tracking-widest border-2 border-slate-700">
              黒板 (FRONT)
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-[10px] text-slate-400 font-medium">
          ※ 班編成＆席替えジェネレーターで作成
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Action Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            id="btn-back-to-manual"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>手動調整へ戻る</span>
          </button>

          {(onBackToStudentHub || onRestart) && (
            <button
              type="button"
              onClick={onBackToStudentHub || onRestart}
              id="btn-return-student-hub-final"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="生徒用メイン画面に戻ります"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>生徒用画面に戻る</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-56"
              placeholder="座席表のタイトルを入力"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'both' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>両方表示</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('student')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'student' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>生徒用 (教卓上)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('teacher')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'teacher' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>教師用 (教卓下)</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Preview Button */}
          <button
            type="button"
            onClick={() => setShowPrintPreview(true)}
            id="btn-preview-print"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>印刷プレビュー</span>
          </button>

          {/* Copy Text Button */}
          <button
            type="button"
            onClick={handleCopyText}
            id="btn-copy-layout-text"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'コピー完了！' : 'テキストコピー'}</span>
          </button>

          {/* Word Download */}
          <button
            type="button"
            onClick={handleDownloadWord}
            id="btn-download-word"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-all cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>Word保存 (.doc)</span>
          </button>

          {/* HTML Download (.html) */}
          <button
            type="button"
            onClick={handleDownloadHtml}
            id="btn-download-html"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-xs transition-all cursor-pointer shadow-xs"
            title="生徒用＆教師用の2種類が含まれるHTMLファイルをダウンロードします"
          >
            <FileCode className="w-4 h-4 text-teal-700" />
            <span>HTML保存 (.html)</span>
          </button>

          {/* HTML Code View / Copy */}
          <button
            type="button"
            onClick={() => setShowHtmlModal(true)}
            id="btn-open-html-modal"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            title="HTMLソースコードの確認・クリップボードへのコピー"
          >
            <Code className="w-4 h-4 text-slate-600" />
            <span>HTMLコード</span>
          </button>

          {/* Print Options */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePrint('student')}
              id="btn-print-student"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 font-bold text-xs text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
              title="生徒用（教卓が上）のみを印刷します"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>生徒用印刷</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrint('teacher')}
              id="btn-print-teacher"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 font-bold text-xs text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
              title="教師用（教卓が下）のみを印刷します"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>教師用印刷</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrint('both')}
              id="btn-print-both"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 font-bold text-xs text-white shadow-md hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              title="生徒用と教師用の2種類を2ページでまとめて印刷します"
            >
              <Printer className="w-4 h-4" />
              <span>2種類まとめて印刷</span>
            </button>
          </div>
        </div>
      </div>

      {/* Screen & Printable Display Area */}
      <div id="printable-seating-container" className="space-y-8">
        {/* 1. Student Seating Chart (教卓が上) */}
        {(viewMode === 'both' || viewMode === 'student') && (
          <div className={`print-page-student ${
            printTarget === 'teacher' ? 'print:hidden' : ''
          } ${
            printTarget === 'both' ? 'print:break-after-page' : ''
          }`}>
            {renderSeatingChart(false)}
          </div>
        )}

        {/* 2. Teacher Seating Chart (教卓が下) */}
        {(viewMode === 'both' || viewMode === 'teacher') && (
          <div className={`print-page-teacher ${
            printTarget === 'student' ? 'print:hidden' : ''
          }`}>
            {renderSeatingChart(true)}
          </div>
        )}
      </div>

      {/* Bottom Navigation Buttons (no-print) */}
      <div className="flex flex-wrap justify-between items-center gap-3 pt-2 no-print">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            id="btn-back-to-manual-bottom"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs sm:text-sm text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>手動調整へ戻る</span>
          </button>

          {(onBackToStudentHub || onRestart) && (
            <button
              type="button"
              onClick={onBackToStudentHub || onRestart}
              id="btn-return-student-hub-bottom"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>生徒用画面に戻る</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowPrintPreview(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>印刷プレビュー</span>
        </button>
      </div>

      {/* Modal for Print Preview */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">座席表 印刷プレビュー（生徒用＆教師用）</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60 space-y-6">
              {/* Preview Student View */}
              <div>
                <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-emerald-600" />
                  <span>1ページ目：生徒用座席表（教卓が上）</span>
                </div>
                <div className="bg-white border border-slate-300 shadow-sm p-6 max-w-3xl mx-auto rounded-lg">
                  {renderSeatingChart(false)}
                </div>
              </div>

              {/* Preview Teacher View */}
              <div>
                <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>2ページ目：教師用座席表（教卓が下）</span>
                </div>
                <div className="bg-white border border-slate-300 shadow-sm p-6 max-w-3xl mx-auto rounded-lg">
                  {renderSeatingChart(true)}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                閉じる
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintPreview(false);
                    handlePrint('student');
                  }}
                  className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>生徒用を印刷</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintPreview(false);
                    handlePrint('teacher');
                  }}
                  className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>教師用を印刷</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintPreview(false);
                    handlePrint('both');
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>2種類まとめて印刷</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* HTML Code & Export Modal */}
      {showHtmlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">HTML出力（生徒用＆教師用 座席表）</h3>
                  <p className="text-xs text-slate-500">
                    ブラウザで直接開けるスタンドアロンHTMLファイルです（印刷CSS・班カラー完全対応）
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHtmlModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
                title="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-6 py-3 bg-teal-50/50 border-b border-teal-100 flex flex-wrap justify-between items-center gap-2">
              <div className="text-xs font-semibold text-teal-800">
                ファイル名: <code className="bg-teal-100/70 px-1.5 py-0.5 rounded font-mono">座席表_{chartTitle}_生徒用＆教師用.html</code>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyHtml}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 rounded-lg cursor-pointer transition-all shadow-2xs"
                >
                  {htmlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-teal-600" />}
                  <span>{htmlCopied ? 'コピー完了！' : 'HTMLコードをコピー'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.html ファイル保存</span>
                </button>
              </div>
            </div>

            {/* HTML Source Code Box */}
            <div className="p-6 overflow-auto flex-1 bg-slate-950 font-mono text-xs">
              <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed select-all">
                {generateStandaloneHtml()}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowHtmlModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                閉じる
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyHtml}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  {htmlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                  <span>{htmlCopied ? 'コピー完了！' : 'コードコピー'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.html をダウンロード</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
