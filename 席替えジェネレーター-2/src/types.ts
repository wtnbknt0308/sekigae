export type Gender = 'boy' | 'girl';

export interface Student {
  id: number;
  name: string;
  furigana: string;
  gender: Gender;
  groupId: number | null; // Null means no group assigned
  isLeader?: boolean;
  prefRow?: 'front' | 'middle' | 'back' | 'none';
  prefCol?: 'left' | 'center' | 'right' | 'none';
}

export interface Seat {
  id: string; // e.g., "0-0" for row-col
  row: number;
  col: number;
  genderPattern: Gender | 'any'; // Recommended gender for checkerboard
  studentId: number | null; // Student assigned to this seat, null means empty
  disabled?: boolean; // True if this seat is excluded / marked as unused empty seat
}

export interface GroupRole {
  roleId: string;
  roleName: string;
  studentId: number | null;
}

export interface LifeGroup {
  id: number;
  name: string;
  boysCount: number;
  girlsCount: number;
  color: string;
  bgLight: string;
  border: string;
  text: string;
  leaderId?: number | null; // Backward compatibility
  boyLeaderId?: number | null; // 男子リーダー
  girlLeaderId?: number | null; // 女子リーダー
  prefRow?: 'front' | 'back' | 'none';
  prefCol?: 'left' | 'center' | 'right' | 'none';
  roles?: GroupRole[];
}

export type PairRuleType = 'avoid' | 'together';

export interface PairRule {
  id: string;
  studentAId: number;
  studentBId: number;
  type: PairRuleType;
}

export type AvoidPair = PairRule; // Backwards compatibility

export type SeatingPattern = 'random' | 'checkerboard';

export type AppMode = 'zero_setting' | 'student_menu';
export type StudentMenuChoice = 'hub' | 'group_formation' | 'seat_arrangement';

export interface ZeroSettingsData {
  totalStudents: number;
  boysCount: number;
  girlsCount: number;
  columns: number;
  rows: number;
  students: Student[];
  pairRules: PairRule[];
  defaultGroups: LifeGroup[];
  groups: LifeGroup[];
}

export const DISTINCT_GROUP_COLORS = [
  { id: 1, name: 'スカイブルー', hex: '#2563eb', bgLight: '#eff6ff', border: '#60a5fa', text: '#1e40af', badgeBg: 'bg-blue-100', badgeText: 'text-blue-900' },
  { id: 2, name: 'クリムゾン', hex: '#e11d48', bgLight: '#fff1f2', border: '#fb7185', text: '#9f1239', badgeBg: 'bg-rose-100', badgeText: 'text-rose-900' },
  { id: 3, name: 'エメラルド', hex: '#16a34a', bgLight: '#f0fdf4', border: '#4ade80', text: '#166534', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-900' },
  { id: 4, name: 'ブラック', hex: '#18181b', bgLight: '#f4f4f5', border: '#71717a', text: '#09090b', badgeBg: 'bg-zinc-200', badgeText: 'text-zinc-900' },
  { id: 5, name: 'クリーム', hex: '#ca8a04', bgLight: '#fefce8', border: '#facc15', text: '#854d0e', badgeBg: 'bg-amber-100', badgeText: 'text-amber-900' },
  { id: 6, name: 'パープル', hex: '#9333ea', bgLight: '#faf5ff', border: '#c084fc', text: '#6b21a8', badgeBg: 'bg-purple-100', badgeText: 'text-purple-900' },
  { id: 7, name: 'オレンジ', hex: '#ea580c', bgLight: '#fff7ed', border: '#fb923c', text: '#9a3412', badgeBg: 'bg-orange-100', badgeText: 'text-orange-900' },
  { id: 8, name: 'マゼンタピンク', hex: '#db2777', bgLight: '#fdf2f8', border: '#f472b6', text: '#831843', badgeBg: 'bg-pink-100', badgeText: 'text-pink-900' },
];

export const DEFAULT_ZERO_SETTINGS: ZeroSettingsData = {
  totalStudents: 36,
  boysCount: 18,
  girlsCount: 18,
  columns: 6,
  rows: 6,
  students: Array.from({ length: 36 }).map((_, i) => {
    const isBoy = i < 18;
    const num = isBoy ? i + 1 : i - 17;
    return {
      id: i + 1,
      name: isBoy ? `男子${num}` : `女子${num}`,
      furigana: isBoy ? `だんし${num}` : `じょし${num}`,
      gender: isBoy ? 'boy' : 'girl',
      groupId: ((i % 6) + 1),
      isLeader: false,
      prefRow: 'none',
      prefCol: 'none',
    };
  }),
  pairRules: [],
  defaultGroups: Array.from({ length: 6 }).map((_, i) => {
    const palette = DISTINCT_GROUP_COLORS[i % DISTINCT_GROUP_COLORS.length];
    return {
      id: i + 1,
      name: `${i + 1}班`,
      boysCount: 3,
      girlsCount: 3,
      color: palette.hex,
      bgLight: palette.bgLight,
      border: palette.border,
      text: palette.text,
      leaderId: null,
      prefRow: 'none',
      prefCol: 'none',
    };
  }),
  groups: Array.from({ length: 6 }).map((_, i) => {
    const palette = DISTINCT_GROUP_COLORS[i % DISTINCT_GROUP_COLORS.length];
    return {
      id: i + 1,
      name: `${i + 1}班`,
      boysCount: 3,
      girlsCount: 3,
      color: palette.hex,
      bgLight: palette.bgLight,
      border: palette.border,
      text: palette.text,
      leaderId: null,
      prefRow: 'none',
      prefCol: 'none',
    };
  }),
};

