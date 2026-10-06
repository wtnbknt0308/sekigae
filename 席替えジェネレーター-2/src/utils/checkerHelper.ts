import { Seat, Student, LifeGroup } from '../types';

/**
 * Detects seats where the alternating checkerboard gender pattern is broken
 * (i.e. where adjacent orthogonal seats have students of the same gender).
 */
export function getBrokenCheckerSeatIds(seats: Seat[], studentMap: Map<number, Student>): Set<string> {
  const brokenSeatIds = new Set<string>();

  seats.forEach((seat) => {
    if (seat.disabled || seat.studentId === null) return;
    const student = studentMap.get(seat.studentId);
    if (!student) return;

    // Find orthogonal active neighbors (up, down, left, right)
    const neighbors = seats.filter((s) => {
      if (s.disabled || s.studentId === null || s.id === seat.id) return false;
      const isHorizontalNeighbor = s.row === seat.row && Math.abs(s.col - seat.col) === 1;
      const isVerticalNeighbor = s.col === seat.col && Math.abs(s.row - seat.row) === 1;
      return isHorizontalNeighbor || isVerticalNeighbor;
    });

    const isSameGenderNeighborPresent = neighbors.some((n) => {
      const neighborStudent = studentMap.get(n.studentId!);
      return neighborStudent && neighborStudent.gender === student.gender;
    });

    if (isSameGenderNeighborPresent) {
      brokenSeatIds.add(seat.id);
    }
  });

  return brokenSeatIds;
}

/**
 * Detects seats where students of the same life group are disconnected or isolated.
 * For each group, we compute connected components based on 8-neighborhood (orthogonal + diagonal).
 * Seats in secondary/smaller components or completely isolated are flagged.
 */
export function getDisconnectedGroupSeatIds(
  seats: Seat[],
  studentMap: Map<number, Student>,
  hasGroups: boolean
): Set<string> {
  const disconnectedSeatIds = new Set<string>();
  if (!hasGroups) return disconnectedSeatIds;

  // Group seats by groupId
  const groupSeatsMap = new Map<number, Seat[]>();

  seats.forEach((seat) => {
    if (seat.disabled || seat.studentId === null) return;
    const student = studentMap.get(seat.studentId);
    if (!student || !student.groupId) return;

    const list = groupSeatsMap.get(student.groupId) || [];
    list.push(seat);
    groupSeatsMap.set(student.groupId, list);
  });

  groupSeatsMap.forEach((gSeats) => {
    if (gSeats.length <= 1) return;

    // Build adjacency graph within this group (8-directional neighbor)
    const adj = new Map<string, string[]>();
    gSeats.forEach((s1) => {
      adj.set(s1.id, []);
      gSeats.forEach((s2) => {
        if (s1.id === s2.id) return;
        const rowDiff = Math.abs(s1.row - s2.row);
        const colDiff = Math.abs(s1.col - s2.col);
        // Adjacent if orthogonal or diagonal (within 1 step in both row and col)
        if (rowDiff <= 1 && colDiff <= 1) {
          adj.get(s1.id)!.push(s2.id);
        }
      });
    });

    // Find connected components using BFS/DFS
    const visited = new Set<string>();
    const components: string[][] = [];

    gSeats.forEach((s) => {
      if (!visited.has(s.id)) {
        const comp: string[] = [];
        const queue: string[] = [s.id];
        visited.add(s.id);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          comp.push(curr);
          const neighbors = adj.get(curr) || [];
          neighbors.forEach((nId) => {
            if (!visited.has(nId)) {
              visited.add(nId);
              queue.push(nId);
            }
          });
        }
        components.push(comp);
      }
    });

    // If more than 1 component, the members are not all contiguous.
    // Sort components by size descending. The largest is the main cluster;
    // seats in any smaller cluster/isolated seats are marked as disconnected.
    if (components.length > 1) {
      components.sort((a, b) => b.length - a.length);
      // All components except the largest one are considered disconnected
      for (let i = 1; i < components.length; i++) {
        components[i].forEach((seatId) => disconnectedSeatIds.add(seatId));
      }
    }
  });

  return disconnectedSeatIds;
}

export interface LayoutEvaluation {
  isCheckerComplete: boolean;
  brokenCheckerCount: number;
  brokenCheckerSeatIds: Set<string>;
  
  hasGroups: boolean;
  isGroupContiguousComplete: boolean;
  disconnectedGroupCount: number;
  disconnectedGroupSeatIds: Set<string>;

  // Combined set of seats violating either condition
  attentionSeatIds: Set<string>;
}

export function evaluateLayoutQuality(
  seats: Seat[],
  studentMap: Map<number, Student>,
  hasGroups: boolean
): LayoutEvaluation {
  const brokenCheckerSeatIds = getBrokenCheckerSeatIds(seats, studentMap);
  const disconnectedGroupSeatIds = getDisconnectedGroupSeatIds(seats, studentMap, hasGroups);

  const attentionSeatIds = new Set<string>();
  brokenCheckerSeatIds.forEach((id) => attentionSeatIds.add(id));
  disconnectedGroupSeatIds.forEach((id) => attentionSeatIds.add(id));

  return {
    isCheckerComplete: brokenCheckerSeatIds.size === 0,
    brokenCheckerCount: brokenCheckerSeatIds.size,
    brokenCheckerSeatIds,

    hasGroups,
    isGroupContiguousComplete: disconnectedGroupSeatIds.size === 0,
    disconnectedGroupCount: disconnectedGroupSeatIds.size,
    disconnectedGroupSeatIds,

    attentionSeatIds,
  };
}
