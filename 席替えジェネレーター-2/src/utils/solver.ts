import { Student, Seat, LifeGroup, PairRule, SeatingPattern } from '../types';

// Helper to calculate distance between two seats (Chebyshev distance)
export function getDistance(seatA: { row: number; col: number }, seatB: { row: number; col: number }): number {
  return Math.max(Math.abs(seatA.row - seatB.row), Math.abs(seatA.col - seatB.col));
}

// Generate initial seats grid
export function generateInitialSeats(
  rows: number,
  cols: number,
  pattern: SeatingPattern,
  boysCount: number,
  girlsCount: number,
  existingSeats?: Seat[]
): Seat[] {
  const seats: Seat[] = [];
  const existingDisabledMap = new Map<string, boolean>();
  if (existingSeats) {
    existingSeats.forEach(s => {
      if (s.disabled) {
        existingDisabledMap.set(`${s.row}-${s.col}`, true);
      }
    });
  }
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`;
      seats.push({
        id: key,
        row: r,
        col: c,
        genderPattern: 'any',
        studentId: null,
        disabled: !!existingDisabledMap.get(key),
      });
    }
  }

  return regenerateCheckerboardPattern(seats, boysCount, girlsCount, pattern);
}

// Recalculate checkerboard or random pattern based on active seats
export function regenerateCheckerboardPattern(
  seats: Seat[],
  boysCount: number,
  girlsCount: number,
  pattern: SeatingPattern = 'checkerboard'
): Seat[] {
  const newSeats = seats.map(s => ({ ...s }));

  if (pattern === 'checkerboard') {
    let activeEvenCount = 0;
    let activeOddCount = 0;

    newSeats.forEach(seat => {
      if (!seat.disabled) {
        if ((seat.row + seat.col) % 2 === 0) activeEvenCount++;
        else activeOddCount++;
      }
    });

    const scoreEvenIsBoys = Math.abs(boysCount - activeEvenCount) + Math.abs(girlsCount - activeOddCount);
    const scoreOddIsBoys = Math.abs(boysCount - activeOddCount) + Math.abs(girlsCount - activeEvenCount);
    const evenIsBoys = scoreEvenIsBoys <= scoreOddIsBoys;

    newSeats.forEach(seat => {
      if (seat.disabled) {
        seat.genderPattern = 'any';
      } else {
        const isEven = (seat.row + seat.col) % 2 === 0;
        seat.genderPattern = (isEven === evenIsBoys) ? 'boy' : 'girl';
      }
    });
  } else {
    newSeats.forEach(seat => {
      seat.genderPattern = 'any';
    });
  }

  return newSeats;
}

// Partition grid into contiguous blocks for each group considering spatial preferences
export function partitionGridIntoGroups(
  rows: number,
  cols: number,
  groups: LifeGroup[],
  totalStudents: number,
  availableSeats?: Seat[]
): Record<string, number> {
  const seatGroupMap: Record<string, number> = {};
  if (groups.length === 0) return seatGroupMap;

  const disabledSet = new Set<string>();
  if (availableSeats) {
    availableSeats.forEach(s => {
      if (s.disabled) disabledSet.add(s.id);
    });
  }

  const targetSizes = groups.reduce((acc, g) => {
    acc[g.id] = Math.max(1, g.boysCount + g.girlsCount);
    return acc;
  }, {} as Record<number, number>);

  const numGroups = groups.length;
  const seeds: { r: number; c: number; groupId: number }[] = [];

  // Group placement coordinates based on preferences
  groups.forEach((group, idx) => {
    let targetRow = (rows - 1) / 2;
    let targetCol = (cols - 1) / 2;

    if (group.prefRow === 'front') targetRow = 0;
    else if (group.prefRow === 'back') targetRow = rows - 1;

    if (group.prefCol === 'left') targetCol = 0;
    else if (group.prefCol === 'center') targetCol = (cols - 1) / 2;
    else if (group.prefCol === 'right') targetCol = cols - 1;

    // If no preference specified, distribute along circle/grid
    if ((!group.prefRow || group.prefRow === 'none') && (!group.prefCol || group.prefCol === 'none')) {
      const angle = (idx / numGroups) * 2 * Math.PI;
      const radiusR = Math.max(1, (rows - 1) * 0.4);
      const radiusC = Math.max(1, (cols - 1) * 0.4);
      targetRow = Math.round((rows - 1) / 2 + radiusR * Math.cos(angle));
      targetCol = Math.round((cols - 1) / 2 + radiusC * Math.sin(angle));
    }

    let r = Math.max(0, Math.min(rows - 1, Math.round(targetRow)));
    let c = Math.max(0, Math.min(cols - 1, Math.round(targetCol)));

    let attempts = 0;
    while ((seeds.some(s => s.r === r && s.c === c) || disabledSet.has(`${r}-${c}`)) && attempts < 100) {
      r = Math.floor(Math.random() * rows);
      c = Math.floor(Math.random() * cols);
      attempts++;
    }

    seeds.push({ r, c, groupId: group.id });
  });

  const allocatedCount: Record<number, number> = {};
  groups.forEach(g => {
    allocatedCount[g.id] = 0;
  });

  seeds.forEach(seed => {
    const key = `${seed.r}-${seed.c}`;
    if (!disabledSet.has(key)) {
      seatGroupMap[key] = seed.groupId;
      allocatedCount[seed.groupId] = 1;
    }
  });

  // Seed-growing algorithm to expand contiguous regions
  let changed = true;
  let iterations = 0;
  const maxIterations = 500;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    const shuffledGroups = [...groups].sort(() => Math.random() - 0.5);

    for (const group of shuffledGroups) {
      const gId = group.id;
      const targetSize = targetSizes[gId];
      if (allocatedCount[gId] >= targetSize) continue;

      const candidates: { r: number; c: number; key: string }[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = `${r}-${c}`;
          if (disabledSet.has(key)) continue;

          if (seatGroupMap[key] === gId) {
            const dirs = [
              [-1, 0], [1, 0], [0, -1], [0, 1],
              [-1, -1], [-1, 1], [1, -1], [1, 1]
            ];
            for (const [dr, dc] of dirs) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const nKey = `${nr}-${nc}`;
                if (!disabledSet.has(nKey) && seatGroupMap[nKey] === undefined) {
                  if (!candidates.some(cand => cand.key === nKey)) {
                    candidates.push({ r: nr, c: nc, key: nKey });
                  }
                }
              }
            }
          }
        }
      }

      if (candidates.length > 0) {
        const seed = seeds.find(s => s.groupId === gId) || seeds[0];
        candidates.sort((a, b) => {
          const distA = Math.pow(a.r - seed.r, 2) + Math.pow(a.c - seed.c, 2);
          const distB = Math.pow(b.r - seed.r, 2) + Math.pow(b.c - seed.c, 2);
          return distA - distB;
        });

        const chosen = candidates[0];
        seatGroupMap[chosen.key] = gId;
        allocatedCount[gId]++;
        changed = true;
      }
    }
  }

  // Fill remaining non-disabled cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`;
      if (disabledSet.has(key)) continue;

      if (seatGroupMap[key] === undefined) {
        const unfinishedGroup = groups.find(g => allocatedCount[g.id] < targetSizes[g.id]);
        if (unfinishedGroup) {
          seatGroupMap[key] = unfinishedGroup.id;
          allocatedCount[unfinishedGroup.id]++;
        } else {
          let minSeedDist = Infinity;
          let bestGroupId = groups[0]?.id || 1;
          seeds.forEach(seed => {
            const dist = Math.pow(r - seed.r, 2) + Math.pow(c - seed.c, 2);
            if (dist < minSeedDist) {
              minSeedDist = dist;
              bestGroupId = seed.groupId;
            }
          });
          seatGroupMap[key] = bestGroupId;
        }
      }
    }
  }

  return seatGroupMap;
}

// Seating arrangement penalty calculator
export function calculatePenalty(
  seats: Seat[],
  students: Student[],
  pairRules: PairRule[],
  hasAvoidPairs: boolean,
  pattern: SeatingPattern,
  seatGroupMap: Record<string, number>,
  hasGroups: boolean,
  rows: number,
  cols: number
): { total: number; avoidViolations: string[]; genderMismatches: number; groupMismatches: number } {
  let score = 0;
  const avoidViolations: string[] = [];
  let genderMismatches = 0;
  let groupMismatches = 0;

  const studentMap = new Map<number, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  // 1. PRIORITY 1: Avoid Pairs (MUST NOT be adjacent / within distance < 2)
  if (hasAvoidPairs && pairRules.length > 0) {
    for (const rule of pairRules) {
      if (rule.type === 'avoid') {
        const seatA = seats.find(s => s.studentId === rule.studentAId);
        const seatB = seats.find(s => s.studentId === rule.studentBId);

        if (seatA && seatB) {
          const dist = getDistance(seatA, seatB);
          if (dist < 2) {
            score += 1000000; // Strict fatal penalty
            const sA = studentMap.get(rule.studentAId);
            const sB = studentMap.get(rule.studentBId);
            avoidViolations.push(
              `${sA?.name || rule.studentAId} と ${sB?.name || rule.studentBId} が隣接しています`
            );
          }
        }
      } else if (rule.type === 'together') {
        // Together pairs: reward proximity
        const seatA = seats.find(s => s.studentId === rule.studentAId);
        const seatB = seats.find(s => s.studentId === rule.studentBId);

        if (seatA && seatB) {
          const dist = getDistance(seatA, seatB);
          if (dist > 2) {
            score += 200 * dist; // Gentle penalty for being far apart
          }
        }
      }
    }
  }

  // 2. PRIORITY 2: Gender Pattern Mismatch (Checkerboard)
  if (pattern === 'checkerboard') {
    seats.forEach(seat => {
      if (seat.studentId !== null && !seat.disabled) {
        const student = studentMap.get(seat.studentId);
        if (student && seat.genderPattern !== 'any' && student.gender !== seat.genderPattern) {
          score += 1500;
          genderMismatches++;
        }
      }
    });
  }

  // 3. PRIORITY 2: Group Contiguity & Block alignment
  if (hasGroups) {
    seats.forEach(seat => {
      if (seat.studentId !== null && !seat.disabled) {
        const student = studentMap.get(seat.studentId);
        const expectedGroupId = seatGroupMap[seat.id];
        if (student && expectedGroupId !== undefined && student.groupId !== expectedGroupId) {
          score += 2000;
          groupMismatches++;
        }
      }
    });
  }

  // 4. PRIORITY 3: Individual Student Position Preferences (Zero settings)
  seats.forEach(seat => {
    if (seat.studentId !== null && !seat.disabled) {
      const student = studentMap.get(seat.studentId);
      if (student) {
        // Row preference
        if (student.prefRow === 'front' && seat.row > 1) {
          score += 100 * seat.row;
        } else if (student.prefRow === 'back' && seat.row < rows - 2) {
          score += 100 * (rows - 1 - seat.row);
        } else if (student.prefRow === 'middle' && (seat.row === 0 || seat.row === rows - 1)) {
          score += 50;
        }

        // Column preference
        if (student.prefCol === 'left' && seat.col > Math.floor(cols / 3)) {
          score += 80 * seat.col;
        } else if (student.prefCol === 'right' && seat.col < cols - 1 - Math.floor(cols / 3)) {
          score += 80 * (cols - 1 - seat.col);
        }
      }
    }
  });

  return {
    total: score,
    avoidViolations,
    genderMismatches,
    groupMismatches,
  };
}

// Seating Arrangement Solver
export function solveSeating(
  totalStudents: number,
  boysCount: number,
  girlsCount: number,
  rows: number,
  cols: number,
  pattern: SeatingPattern,
  students: Student[],
  hasGroups: boolean,
  groups: LifeGroup[],
  hasAvoidPairs: boolean,
  pairRules: PairRule[],
  existingSeats?: Seat[]
): { seats: Seat[]; success: boolean; violations: string[]; stats: { genderMismatches: number; groupMismatches: number } } {
  
  let seats: Seat[] = [];
  if (existingSeats && existingSeats.length === rows * cols) {
    seats = existingSeats.map(s => ({
      ...s,
      studentId: null,
    }));
  } else {
    seats = generateInitialSeats(rows, cols, pattern, boysCount, girlsCount);
  }

  const seatGroupMap = hasGroups ? partitionGridIntoGroups(rows, cols, groups, totalStudents, seats) : {};
  const remainingStudents = [...students];
  const activeSeats = seats.filter(s => !s.disabled);

  // Initial smart placement
  activeSeats.forEach(seat => {
    if (remainingStudents.length === 0) {
      seat.studentId = null;
      return;
    }

    const expectedGroupId = hasGroups ? seatGroupMap[seat.id] : null;
    const expectedGender = pattern === 'checkerboard' ? seat.genderPattern : 'any';

    let bestIndex = -1;
    
    // 1. Group & Gender match
    bestIndex = remainingStudents.findIndex(s => {
      const groupMatch = !hasGroups || s.groupId === expectedGroupId;
      const genderMatch = expectedGender === 'any' || s.gender === expectedGender;
      return groupMatch && genderMatch;
    });

    // 2. Group match
    if (bestIndex === -1 && hasGroups) {
      bestIndex = remainingStudents.findIndex(s => s.groupId === expectedGroupId);
    }

    // 3. Gender match
    if (bestIndex === -1 && expectedGender !== 'any') {
      bestIndex = remainingStudents.findIndex(s => s.gender === expectedGender);
    }

    // 4. Any student
    if (bestIndex === -1) {
      bestIndex = 0;
    }

    const student = remainingStudents.splice(bestIndex, 1)[0];
    seat.studentId = student.id;
  });

  seats.forEach(seat => {
    if (seat.disabled) {
      seat.studentId = null;
    }
  });

  // Hill Climbing Optimization with Simulated Annealing characteristics
  let currentSeats = JSON.parse(JSON.stringify(seats)) as Seat[];
  let bestSeats = JSON.parse(JSON.stringify(currentSeats)) as Seat[];
  
  let currentScoreObj = calculatePenalty(currentSeats, students, pairRules, hasAvoidPairs, pattern, seatGroupMap, hasGroups, rows, cols);
  let bestScore = currentScoreObj.total;

  const maxSteps = 20000;
  let step = 0;
  const activeIndices = currentSeats
    .map((s, idx) => (!s.disabled ? idx : -1))
    .filter(idx => idx !== -1);

  if (activeIndices.length > 1) {
    while (step < maxSteps && bestScore > 0) {
      step++;

      const randA = Math.floor(Math.random() * activeIndices.length);
      const randB = Math.floor(Math.random() * activeIndices.length);
      if (randA === randB) continue;

      const idxA = activeIndices[randA];
      const idxB = activeIndices[randB];

      const seatA = currentSeats[idxA];
      const seatB = currentSeats[idxB];

      if (seatA.studentId === null && seatB.studentId === null) continue;

      // Swap
      const tempId = seatA.studentId;
      seatA.studentId = seatB.studentId;
      seatB.studentId = tempId;

      const newScoreObj = calculatePenalty(currentSeats, students, pairRules, hasAvoidPairs, pattern, seatGroupMap, hasGroups, rows, cols);
      const newScore = newScoreObj.total;

      const isAccepted = newScore < bestScore || (newScore === bestScore && Math.random() < 0.15);

      if (isAccepted) {
        bestScore = newScore;
        currentScoreObj = newScoreObj;
        bestSeats = JSON.parse(JSON.stringify(currentSeats)) as Seat[];
      } else {
        // Revert
        const revertId = seatA.studentId;
        seatA.studentId = seatB.studentId;
        seatB.studentId = revertId;
      }
    }
  }

  const finalScoreObj = calculatePenalty(bestSeats, students, pairRules, hasAvoidPairs, pattern, seatGroupMap, hasGroups, rows, cols);

  return {
    seats: bestSeats,
    success: finalScoreObj.avoidViolations.length === 0,
    violations: finalScoreObj.avoidViolations,
    stats: {
      genderMismatches: finalScoreObj.genderMismatches,
      groupMismatches: finalScoreObj.groupMismatches,
    }
  };
}

// ----------------------------------------------------
// Group Formation Solver (班編成ソルバー)
// ----------------------------------------------------
export function solveGroupFormation(
  students: Student[],
  groups: LifeGroup[],
  pairRules: PairRule[]
): { updatedStudents: Student[]; success: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const updatedStudents = students.map(s => ({ ...s, groupId: null as number | null }));
  const groupCount = groups.length;
  if (groupCount === 0) return { updatedStudents, success: true, warnings };

  // 1. Assign Leaders (both boy and girl leaders) to their respective groups first
  const assignedStudentIds = new Set<number>();
  groups.forEach(g => {
    // Boy leader
    const boyLeaderId = g.boyLeaderId ?? (g.leaderId ? (students.find(s => s.id === g.leaderId && s.gender === 'boy')?.id ?? null) : null);
    if (boyLeaderId) {
      const student = updatedStudents.find(s => s.id === boyLeaderId);
      if (student) {
        student.groupId = g.id;
        student.isLeader = true;
        assignedStudentIds.add(student.id);
      }
    }

    // Girl leader
    const girlLeaderId = g.girlLeaderId ?? (g.leaderId ? (students.find(s => s.id === g.leaderId && s.gender === 'girl')?.id ?? null) : null);
    if (girlLeaderId) {
      const student = updatedStudents.find(s => s.id === girlLeaderId);
      if (student) {
        student.groupId = g.id;
        student.isLeader = true;
        assignedStudentIds.add(student.id);
      }
    }
  });

  // Calculate remaining targets for each group
  const groupCurrentCounts: Record<number, { boys: number; girls: number; total: number }> = {};
  groups.forEach(g => {
    groupCurrentCounts[g.id] = { boys: 0, girls: 0, total: 0 };
  });

  updatedStudents.forEach(s => {
    if (s.groupId !== null && groupCurrentCounts[s.groupId]) {
      if (s.gender === 'boy') groupCurrentCounts[s.groupId].boys++;
      else groupCurrentCounts[s.groupId].girls++;
      groupCurrentCounts[s.groupId].total++;
    }
  });

  // Helper to evaluate group penalty
  const evaluateGroupAssignment = (stds: Student[]): number => {
    let penalty = 0;

    // Rule: Avoid Pairs must NOT be in the same group
    pairRules.filter(r => r.type === 'avoid').forEach(rule => {
      const sA = stds.find(s => s.id === rule.studentAId);
      const sB = stds.find(s => s.id === rule.studentBId);
      if (sA && sB && sA.groupId !== null && sB.groupId !== null && sA.groupId === sB.groupId) {
        penalty += 100000;
      }
    });

    // Rule: Together Pairs MUST be in the same group
    pairRules.filter(r => r.type === 'together').forEach(rule => {
      const sA = stds.find(s => s.id === rule.studentAId);
      const sB = stds.find(s => s.id === rule.studentBId);
      if (sA && sB && sA.groupId !== null && sB.groupId !== null && sA.groupId !== sB.groupId) {
        penalty += 20000;
      }
    });

    // Target sizes penalty
    const counts: Record<number, { boys: number; girls: number; total: number }> = {};
    groups.forEach(g => {
      counts[g.id] = { boys: 0, girls: 0, total: 0 };
    });

    stds.forEach(s => {
      if (s.groupId !== null && counts[s.groupId]) {
        if (s.gender === 'boy') counts[s.groupId].boys++;
        else counts[s.groupId].girls++;
        counts[s.groupId].total++;
      }
    });

    groups.forEach(g => {
      const c = counts[g.id];
      penalty += Math.abs(c.boys - g.boysCount) * 500;
      penalty += Math.abs(c.girls - g.girlsCount) * 500;
    });

    return penalty;
  };

  // Initial greedy distribution of unassigned students
  const unassigned = updatedStudents.filter(s => s.groupId === null);
  // Sort together pairs to bundle them
  const togetherPairs = pairRules.filter(r => r.type === 'together');
  const processedTogether = new Set<number>();

  togetherPairs.forEach(pair => {
    const sA = updatedStudents.find(s => s.id === pair.studentAId);
    const sB = updatedStudents.find(s => s.id === pair.studentBId);
    if (sA && sB) {
      if (sA.groupId !== null && sB.groupId === null) {
        sB.groupId = sA.groupId;
        processedTogether.add(sB.id);
      } else if (sB.groupId !== null && sA.groupId === null) {
        sA.groupId = sB.groupId;
        processedTogether.add(sA.id);
      } else if (sA.groupId === null && sB.groupId === null) {
        // Pick best group for both
        const availableGroup = groups.reduce((best, g) => {
          const curr = groupCurrentCounts[g.id].total;
          const target = g.boysCount + g.girlsCount;
          return curr < target ? g : best;
        }, groups[0]);
        sA.groupId = availableGroup.id;
        sB.groupId = availableGroup.id;
        processedTogether.add(sA.id);
        processedTogether.add(sB.id);
      }
    }
  });

  // Assign remaining unassigned students
  const remainingUnassigned = updatedStudents.filter(s => s.groupId === null);
  // Separate by gender
  const boys = remainingUnassigned.filter(s => s.gender === 'boy');
  const girls = remainingUnassigned.filter(s => s.gender === 'girl');

  // Distribute boys
  boys.forEach(b => {
    // Find group with biggest boy deficit
    const bestGroup = groups.reduce((best, g) => {
      const count = updatedStudents.filter(s => s.groupId === g.id && s.gender === 'boy').length;
      const bestCount = updatedStudents.filter(s => s.groupId === best.id && s.gender === 'boy').length;
      return (g.boysCount - count) > (best.boysCount - bestCount) ? g : best;
    }, groups[0]);
    b.groupId = bestGroup.id;
  });

  // Distribute girls
  girls.forEach(g => {
    const bestGroup = groups.reduce((best, grp) => {
      const count = updatedStudents.filter(s => s.groupId === grp.id && s.gender === 'girl').length;
      const bestCount = updatedStudents.filter(s => s.groupId === best.id && s.gender === 'girl').length;
      return (grp.girlsCount - count) > (best.girlsCount - bestCount) ? grp : best;
    }, groups[0]);
    g.groupId = bestGroup.id;
  });

  // Optimize with swaps between students of the same gender (strictly preserving exact target counts)
  let bestScore = evaluateGroupAssignment(updatedStudents);
  const swappableBoys = updatedStudents.filter(s => !s.isLeader && s.gender === 'boy');
  const swappableGirls = updatedStudents.filter(s => !s.isLeader && s.gender === 'girl');

  for (let iter = 0; iter < 10000 && bestScore > 0; iter++) {
    const isBoySwap = Math.random() < 0.5;
    const pool = isBoySwap ? swappableBoys : swappableGirls;
    if (pool.length < 2) continue;

    const idxA = Math.floor(Math.random() * pool.length);
    const idxB = Math.floor(Math.random() * pool.length);
    if (idxA === idxB) continue;

    const sA = pool[idxA];
    const sB = pool[idxB];

    if (sA.groupId === sB.groupId) continue;

    // Swap groups
    const tempGroup = sA.groupId;
    sA.groupId = sB.groupId;
    sB.groupId = tempGroup;

    const newScore = evaluateGroupAssignment(updatedStudents);
    if (newScore < bestScore || (newScore === bestScore && Math.random() < 0.1)) {
      bestScore = newScore;
    } else {
      // Revert
      sB.groupId = sA.groupId;
      sA.groupId = tempGroup;
    }
  }

  // Check violations
  pairRules.filter(r => r.type === 'avoid').forEach(rule => {
    const sA = updatedStudents.find(s => s.id === rule.studentAId);
    const sB = updatedStudents.find(s => s.id === rule.studentBId);
    if (sA && sB && sA.groupId === sB.groupId) {
      warnings.push(`離す設定の「${sA.name}」と「${sB.name}」が同じ班になっています`);
    }
  });

  return {
    updatedStudents,
    success: warnings.length === 0,
    warnings,
  };
}
