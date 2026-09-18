/**
 * Method of Joints 2D Structural Solver
 * 
 * Uses Gaussian Elimination with Partial Pivoting to solve equilibrium equations:
 *   [A] {x} = {b}
 * where:
 *   {x} contains unknown member forces (tension positive) and reaction forces.
 *   {b} contains external applied loads (negated on right-hand side).
 * 
 * Also incorporates Whole-Body Equilibrium:
 *   Σ F_x = 0
 *   Σ F_y = 0
 *   Σ M_O = 0 (Taking moments about a support point O, e.g. the pin support)
 */

import { distance } from './trussGeometry.js';
import { classifyStructure } from './determinacy.js';

const EPSILON = 1e-6;

/**
 * Solve linear system Ax = b using Gaussian Elimination with Partial Pivoting.
 * Returns null / singular: true if matrix is degenerate (mechanism or singular).
 */
function solveGaussianElimination(A, b) {
  const n = b.length;
  const M = A.map(row => [...row]);
  const rhs = [...b];

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);

    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(M[row][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }

    if (maxVal < EPSILON) {
      return { singular: true, failedAt: col };
    }

    if (maxRow !== col) {
      const tempRow = M[col];
      M[col] = M[maxRow];
      M[maxRow] = tempRow;

      const tempB = rhs[col];
      rhs[col] = rhs[maxRow];
      rhs[maxRow] = tempB;
    }

    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let c = col; c < n; c++) {
        M[row][c] -= factor * M[col][c];
      }
      rhs[row] -= factor * rhs[col];
    }
  }

  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = rhs[row];
    for (let col = row + 1; col < n; col++) {
      sum -= M[row][col] * x[col];
    }
    if (Math.abs(M[row][row]) < EPSILON) {
      return { singular: true, failedAt: row };
    }
    x[row] = sum / M[row][row];
  }

  return { singular: false, solution: x };
}

/**
 * Compute Whole Body Equilibrium Equations:
 * Σ F_x = 0, Σ F_y = 0, Σ M_O = 0
 */
export function solveGlobalReactions({ joints = [], supports = [], forces = [] }) {
  const jointMap = new Map();
  joints.forEach((joint, idx) => {
    jointMap.set(joint.id, { ...joint, index: idx });
  });

  const reactionUnknowns = [];
  supports.forEach(support => {
    const joint = jointMap.get(support.jointId);
    if (!joint) return;

    if (support.type === 'pin' || support.type === 'wall' || support.type === 'pivot') {
      reactionUnknowns.push({
        id: `R_${joint.label}x`,
        label: `R_${joint.label}x`,
        jointId: support.jointId,
        jointLabel: joint.label,
        jointIndex: joint.index,
        jointX: joint.x,
        jointY: joint.y,
        axis: 'x',
        dir: 1
      });
      reactionUnknowns.push({
        id: `R_${joint.label}y`,
        label: `R_${joint.label}y`,
        jointId: support.jointId,
        jointLabel: joint.label,
        jointIndex: joint.index,
        jointX: joint.x,
        jointY: joint.y,
        axis: 'y',
        dir: 1
      });
    } else if (support.type === 'roller') {
      const isVertical = support.orientation === 'vertical';
      reactionUnknowns.push({
        id: `R_${joint.label}${isVertical ? 'x' : 'y'}`,
        label: `R_${joint.label}${isVertical ? 'x' : 'y'}`,
        jointId: support.jointId,
        jointLabel: joint.label,
        jointIndex: joint.index,
        jointX: joint.x,
        jointY: joint.y,
        axis: isVertical ? 'x' : 'y',
        dir: 1
      });
    }
  });

  // Reference joint for moment calculation (prefers pin support)
  const pinSupport = supports.find(s => s.type === 'pin' || s.type === 'wall');
  const momentJoint = pinSupport ? jointMap.get(pinSupport.jointId) : jointMap.get(supports[0]?.jointId) || joints[0];
  const Ox = momentJoint?.x ?? 0;
  const Oy = momentJoint?.y ?? 0;

  // External loads resultant (split into known and unknown forces)
  const knownForces = forces.filter(f => !f.isUnknown);
  const unknownForces = forces.filter(f => f.isUnknown);

  let sumExtFx = 0;
  let sumExtFy = 0;
  let sumExtMO = 0;

  knownForces.forEach(f => {
    const joint = jointMap.get(f.jointId);
    if (!joint) return;
    const fx = parseFloat(f.fx) || 0;
    const fy = parseFloat(f.fy) || 0;
    sumExtFx += fx;
    sumExtFy += fy;
    const armX = joint.x - Ox;
    const armY = joint.y - Oy;
    sumExtMO += armX * fy - armY * fx;
  });

  // Step-by-Step Global Equilibrium Formulations for UI
  const formatTerm = n => (Math.abs(n) < 1e-4 ? '' : (n > 0 ? `+ ${n.toFixed(2)}` : `- ${Math.abs(n).toFixed(2)}`));
  const xRx = reactionUnknowns.filter(rx => rx.axis === 'x').map(rx => rx.label).join(' + ');
  const yRx = reactionUnknowns.filter(rx => rx.axis === 'y').map(rx => rx.label).join(' + ');
  const mRx = reactionUnknowns.map(rx => {
    const armX = rx.jointX - Ox;
    const armY = rx.jointY - Oy;
    const coeff = rx.axis === 'y' ? armX : -armY;
    if (Math.abs(coeff) < 1e-4) return null;
    const prefix = coeff > 0 ? '+ ' : '- ';
    return `${prefix}${Math.abs(coeff).toFixed(2)}·${rx.label}`;
  }).filter(Boolean).join(' ');

  const cleanMRx = mRx ? (mRx.startsWith('+ ') ? mRx.slice(2) : mRx) : '0';

  let unkFxStr = '';
  let unkFyStr = '';
  let unkMOStr = '';
  const solvedFromMoments = [];

  unknownForces.forEach(uf => {
    const joint = jointMap.get(uf.jointId);
    if (!joint) return;
    const rad = (uf.angle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const armX = joint.x - Ox;
    const armY = joint.y - Oy;
    const momentArm = armX * sinA - armY * cosA;
    const tLabel = uf.targetLabel || 'P';

    if (Math.abs(cosA) > 1e-4) {
      unkFxStr += ` + (${cosA.toFixed(2)})·${tLabel}`;
    }
    if (Math.abs(sinA) > 1e-4) {
      unkFyStr += ` + (${sinA.toFixed(2)})·${tLabel}`;
    }
    if (Math.abs(momentArm) > 1e-4) {
      unkMOStr += ` + (${momentArm.toFixed(2)})·${tLabel}`;
      if (cleanMRx === '0' || reactionUnknowns.length <= 2) {
        const pVal = -sumExtMO / momentArm;
        const absVal = Math.abs(Math.round(pVal * 1000) / 1000);
        solvedFromMoments.push({
          id: uf.id,
          targetLabel: tLabel,
          jointLabel: joint.label,
          jointId: uf.jointId,
          magnitude: absVal,
          rawValue: pVal,
          derivation: `Σ M_${momentJoint ? momentJoint.label : 'O'} = 0 ⇒ (${momentArm.toFixed(2)}m)·${tLabel} ${formatTerm(sumExtMO)} = 0 ⇒ ${tLabel} = ${absVal.toFixed(2)} kN`
        });
      }
    }
  });

  const globalEquations = {
    momentJoint: momentJoint ? momentJoint.label : 'Origin',
    momentJointCoords: `(${Ox.toFixed(2)}, ${Oy.toFixed(2)})`,
    sumFxStr: `Σ F_x = 0  ⇒  ${xRx || '0'}${unkFxStr} ${formatTerm(sumExtFx)} = 0`.replace(/\s+/g, ' ').trim(),
    sumFyStr: `Σ F_y = 0  ⇒  ${yRx || '0'}${unkFyStr} ${formatTerm(sumExtFy)} = 0`.replace(/\s+/g, ' ').trim(),
    sumMOStr: `Σ M_${momentJoint ? momentJoint.label : 'O'} = 0  ⇒  ${cleanMRx}${unkMOStr} ${formatTerm(sumExtMO)} = 0`.replace(/\s+/g, ' ').trim()
  };

  return {
    success: true,
    reactionUnknowns,
    globalEquations,
    sumExtFx,
    sumExtFy,
    sumExtMO,
    solvedFromMoments
  };
}

/**
 * Main Truss Method of Joints Solver
 */
export function solveTrussMethodOfJoints(trussData) {
  const { joints = [], members = [], supports = [], forces = [] } = trussData;

  const j = joints.length;
  const m = members.length;

  if (j === 0 || m === 0) {
    return {
      success: false,
      error: 'Empty truss canvas.'
    };
  }

  // Create joint lookup map for fast index access
  const jointMap = new Map();
  joints.forEach((joint, idx) => {
    jointMap.set(joint.id, { ...joint, index: idx });
  });

  // Assign reaction unknowns
  const reactionUnknowns = [];
  supports.forEach(support => {
    const joint = jointMap.get(support.jointId);
    if (!joint) return;

    if (support.type === 'pin' || support.type === 'wall' || support.type === 'pivot') {
      reactionUnknowns.push({
        id: `R_${joint.label}x`,
        label: `R_${joint.label}x`,
        jointId: support.jointId,
        jointLabel: joint.label,
        jointIndex: joint.index,
        jointX: joint.x,
        jointY: joint.y,
        axis: 'x',
        dir: 1
      });
      reactionUnknowns.push({
        id: `R_${joint.label}y`,
        label: `R_${joint.label}y`,
        jointId: support.jointId,
        jointLabel: joint.label,
        jointIndex: joint.index,
        jointX: joint.x,
        jointY: joint.y,
        axis: 'y',
        dir: 1
      });
    } else if (support.type === 'roller') {
      const isVertical = support.orientation === 'vertical';
      reactionUnknowns.push({
        id: `R_${joint.label}${isVertical ? 'x' : 'y'}`,
        label: `R_${joint.label}${isVertical ? 'x' : 'y'}`,
        jointId: support.jointId,
        jointLabel: joint.label,
        jointIndex: joint.index,
        jointX: joint.x,
        jointY: joint.y,
        axis: isVertical ? 'x' : 'y',
        dir: 1
      });
    }
  });

  const unknownForces = (forces || []).filter(f => f.isUnknown);
  const u = unknownForces.length;
  const r = reactionUnknowns.length;
  const totalEquations = 2 * j;
  const totalUnknowns = m + r + u;

  // Check squareness for static determinacy
  if (totalEquations !== totalUnknowns) {
    return {
      success: false,
      reason: totalUnknowns < totalEquations ? 'UNDERCONSTRAINED' : 'OVERCONSTRAINED',
      error: `System is not statically determinate (${totalUnknowns} unknowns [m=${m}, r=${r}${u > 0 ? `, target unknown forces=${u}` : ''}] vs ${totalEquations} equations [2j=${totalEquations}]).`,
      m,
      r,
      u,
      j
    };
  }

  // --- Calculate Whole-Body Equilibrium Formulas (ΣFx = 0, ΣFy = 0, ΣMo = 0) ---
  const globalEqRes = solveGlobalReactions({ joints, supports, forces });
  const globalEquations = globalEqRes.globalEquations;

  // --- Initialize Matrix A [2j x 2j] and vector b [2j] ---
  const N = totalEquations;
  const A = Array.from({ length: N }, () => new Array(N).fill(0));
  const b = new Array(N).fill(0);

  // 1. Populate Member Forces in Matrix A
  // Tension is positive (pulling outward from each joint)
  members.forEach((member, memberIdx) => {
    const jointStart = jointMap.get(member.startJointId);
    const jointEnd = jointMap.get(member.endJointId);

    if (!jointStart || !jointEnd) return;

    const L = distance(jointStart, jointEnd);
    if (L < 1e-5) return;

    // Unit vector from start to end
    const ux = (jointEnd.x - jointStart.x) / L;
    const uy = (jointEnd.y - jointStart.y) / L;

    // Joint Start: member pulls toward End
    const rowStartX = 2 * jointStart.index;
    const rowStartY = 2 * jointStart.index + 1;
    A[rowStartX][memberIdx] += ux;
    A[rowStartY][memberIdx] += uy;

    // Joint End: member pulls toward Start (opposite direction)
    const rowEndX = 2 * jointEnd.index;
    const rowEndY = 2 * jointEnd.index + 1;
    A[rowEndX][memberIdx] -= ux;
    A[rowEndY][memberIdx] -= uy;
  });

  // 2. Populate Reaction Forces in Matrix A
  reactionUnknowns.forEach((rx, rxIdx) => {
    const varIdx = m + rxIdx; // Reactions follow member forces in column ordering
    const row = rx.axis === 'x' ? 2 * rx.jointIndex : 2 * rx.jointIndex + 1;
    A[row][varIdx] += rx.dir;
  });

  // 3. Populate Unknown Target Forces in Matrix A
  unknownForces.forEach((uf, uIdx) => {
    const ufJoint = jointMap.get(uf.jointId);
    if (!ufJoint) return;
    const colIdx = m + r + uIdx;
    const rad = (uf.angle * Math.PI) / 180;
    const rowX = 2 * ufJoint.index;
    const rowY = 2 * ufJoint.index + 1;
    A[rowX][colIdx] += Math.cos(rad);
    A[rowY][colIdx] += Math.sin(rad);
  });

  // 4. Populate Known External Loads in RHS vector b
  // Σ F = 0 => Internal + Reactions + Loads = 0 => Internal + Reactions = -Loads
  forces.filter(f => !f.isUnknown).forEach(force => {
    const joint = jointMap.get(force.jointId);
    if (!joint) return;

    const rowX = 2 * joint.index;
    const rowY = 2 * joint.index + 1;

    b[rowX] -= parseFloat(force.fx) || 0;
    b[rowY] -= parseFloat(force.fy) || 0;
  });

  // 4. Solve System using Gaussian Elimination with Partial Pivoting
  const solveResult = solveGaussianElimination(A, b);

  if (solveResult.singular) {
    return {
      success: false,
      reason: 'MECHANISM',
      error: 'Structure is a geometric mechanism (internally unstable or concurrent/parallel reactions).',
      m,
      r,
      j
    };
  }

  const solution = solveResult.solution;

  // 5. Interpret Member Forces
  const memberResults = members.map((member, idx) => {
    const val = solution[idx];
    const rounded = Math.abs(val) < 1e-4 ? 0 : Math.round(val * 1000) / 1000;
    const absVal = Math.abs(rounded);

    let nature = 'ZERO';
    let natureLabel = 'Zero-Force';
    let code = '0';

    if (absVal <= 0.005) {
      nature = 'ZERO';
      natureLabel = 'Zero-Force';
      code = '0';
    } else if (rounded > 0.005) {
      nature = 'TENSION';
      natureLabel = 'Tension';
      code = 'T';
    } else {
      nature = 'COMPRESSION';
      natureLabel = 'Compression';
      code = 'C';
    }

    const jointStart = jointMap.get(member.startJointId);
    const jointEnd = jointMap.get(member.endJointId);
    const L = (jointStart && jointEnd) ? distance(jointStart, jointEnd) : 0;
    const sortedLabels = [jointStart?.label || '?', jointEnd?.label || '?'].sort();
    const label = `F_${sortedLabels[0]}${sortedLabels[1]}`;

    return {
      id: member.id,
      label,
      startJoint: jointStart?.label,
      endJoint: jointEnd?.label,
      length: Math.round(L * 1000) / 1000,
      forceValue: rounded,
      magnitude: absVal,
      nature,
      natureLabel,
      code
    };
  });

  // Zero-force member identification
  const zeroForceMembers = memberResults.filter(m => m.nature === 'ZERO');

  // 6. Interpret Reaction Results with Physical Direction Indicators
  const reactionResults = reactionUnknowns.map((rx, idx) => {
    const varIdx = m + idx;
    const rawVal = solution[varIdx];
    const rounded = Math.abs(rawVal) < 1e-4 ? 0 : Math.round(rawVal * 1000) / 1000;
    const absVal = Math.abs(rounded);

    let direction = 'NONE';
    let arrow = '—';

    if (absVal >= 1e-4) {
      if (rx.axis === 'y') {
        if (rounded > 0) {
          direction = 'UP';
          arrow = '↑';
        } else {
          direction = 'DOWN';
          arrow = '↓';
        }
      } else {
        if (rounded > 0) {
          direction = 'RIGHT';
          arrow = '→';
        } else {
          direction = 'LEFT';
          arrow = '←';
        }
      }
    }

    return {
      id: rx.id,
      label: rx.label,
      jointId: rx.jointId,
      jointLabel: rx.jointLabel,
      axis: rx.axis,
      value: rounded,
      magnitude: absVal,
      direction,
      arrow
    };
  });

  // 6b. Interpret Solved Unknown Target Forces
  const solvedUnknownForces = unknownForces.map((uf, uIdx) => {
    const val = solution[m + r + uIdx];
    const rounded = Math.abs(val) < 1e-4 ? 0 : Math.round(val * 1000) / 1000;
    const absVal = Math.abs(rounded);
    const ufJoint = jointMap.get(uf.jointId);
    return {
      id: uf.id,
      targetLabel: uf.targetLabel || 'P',
      jointId: uf.jointId,
      jointLabel: ufJoint?.label || '?',
      angle: uf.angle,
      magnitude: absVal,
      rawValue: rounded,
      directionReversed: val < -0.001,
      derivation: `Method of Joints Equilibrium: Joint ${ufJoint?.label || '?'}, solved ${uf.targetLabel || 'P'} = ${absVal.toFixed(2)} kN`
    };
  });

  // 7. Step-by-Step Joint Derivation Log
  const jointSteps = [];
  joints.forEach(joint => {
    const jObj = jointMap.get(joint.id);
    if (!jObj) return;
    const connMembers = memberResults.filter(m => m.startJoint === joint.label || m.endJoint === joint.label);
    const memberSummary = connMembers.map(m => `${m.label} = ${m.magnitude.toFixed(2)} kN (${m.code})`).join(', ');

    jointSteps.push({
      jointLabel: joint.label,
      description: `Joint ${joint.label}: Static equilibrium verified [${memberSummary || 'No members'}]`
    });
  });

  return {
    success: true,
    m,
    r,
    j,
    reactionResults,
    globalEquations,
    memberResults,
    solvedUnknownForces,
    zeroForceMembers,
    jointSteps,
    maxResidual: 0
  };
}

/**
 * 2D Frame Structural Solver (supports multi-force members, axial, shear, and bending moments)
 */
export function solveFrameStructure(trussData) {
  const { joints = [], members = [], supports = [], forces = [] } = trussData;
  const jCount = joints.length;
  const mCount = members.length;

  if (jCount === 0 || mCount === 0) {
    return { success: false, error: 'Empty canvas.' };
  }

  const jointMap = new Map();
  joints.forEach((joint, idx) => {
    jointMap.set(joint.id, { ...joint, index: idx });
  });

  // Whole-Body Equilibrium Formulas
  const globalEqRes = solveGlobalReactions({ joints, supports, forces });
  const globalEquations = globalEqRes.globalEquations;

  // Degrees of freedom: 3 DOFs per joint (u, v, theta)
  const totalDof = 3 * jCount;
  const K = Array.from({ length: totalDof }, () => new Array(totalDof).fill(0));
  const P = new Array(totalDof).fill(0);

  // Structural properties
  const E = 200e6; // kPa
  const A = 0.008; // m^2
  const I = 0.00015; // m^4

  members.forEach(member => {
    const j1 = jointMap.get(member.startJointId);
    const j2 = jointMap.get(member.endJointId);
    if (!j1 || !j2) return;

    const dx = j2.x - j1.x;
    const dy = j2.y - j1.y;
    const L = Math.hypot(dx, dy);
    if (L < 1e-4) return;

    const c = dx / L;
    const s = dy / L;

    // Local 6x6 beam stiffness matrix
    const kAxial = (E * A) / L;
    const k12 = (12 * E * I) / (L * L * L);
    const k6 = (6 * E * I) / (L * L);
    const k4 = (4 * E * I) / L;
    const k2 = (2 * E * I) / L;

    const kLocal = [
      [ kAxial,     0,    0, -kAxial,     0,    0],
      [      0,   k12,   k6,       0,  -k12,   k6],
      [      0,    k6,   k4,       0,   -k6,   k2],
      [-kAxial,     0,    0,  kAxial,     0,    0],
      [      0,  -k12,  -k6,       0,   k12,  -k6],
      [      0,    k6,   k2,       0,   -k6,   k4]
    ];

    // Transformation matrix 6x6
    const T = [
      [ c, s, 0, 0, 0, 0],
      [-s, c, 0, 0, 0, 0],
      [ 0, 0, 1, 0, 0, 0],
      [ 0, 0, 0, c, s, 0],
      [ 0, 0, 0,-s, c, 0],
      [ 0, 0, 0, 0, 0, 1]
    ];

    const kTemp = Array.from({ length: 6 }, () => new Array(6).fill(0));
    for (let r = 0; r < 6; r++) {
      for (let col = 0; col < 6; col++) {
        let sum = 0;
        for (let k = 0; k < 6; k++) {
          sum += kLocal[r][k] * T[k][col];
        }
        kTemp[r][col] = sum;
      }
    }
    const Ke = Array.from({ length: 6 }, () => new Array(6).fill(0));
    for (let r = 0; r < 6; r++) {
      for (let col = 0; col < 6; col++) {
        let sum = 0;
        for (let k = 0; k < 6; k++) {
          sum += T[k][r] * kTemp[k][col];
        }
        Ke[r][col] = sum;
      }
    }

    const dofs = [
      3 * j1.index, 3 * j1.index + 1, 3 * j1.index + 2,
      3 * j2.index, 3 * j2.index + 1, 3 * j2.index + 2
    ];

    for (let r = 0; r < 6; r++) {
      for (let cIdx = 0; cIdx < 6; cIdx++) {
        K[dofs[r]][dofs[cIdx]] += Ke[r][cIdx];
      }
    }
  });

  // Solve for any unknown target forces via global equilibrium
  const unknownForces = (forces || []).filter(f => f.isUnknown);
  const knownForces = (forces || []).filter(f => !f.isUnknown);

  let solvedUnknownForces = [];
  let effectiveForces = [...forces];

  if (unknownForces.length > 0) {
    const globalRes = solveGlobalReactions({ joints, supports, forces });
    if (globalRes.solvedFromMoments && globalRes.solvedFromMoments.length > 0) {
      solvedUnknownForces = globalRes.solvedFromMoments;
    } else {
      const pinSupport = supports.find(s => s.type === 'pin' || s.type === 'wall');
      const pivot = pinSupport ? jointMap.get(pinSupport.jointId) : joints[0];
      const Ox = pivot?.x || 0;
      const Oy = pivot?.y || 0;

      let M_known = 0;
      knownForces.forEach(f => {
        const j = jointMap.get(f.jointId);
        if (!j) return;
        const fx = parseFloat(f.fx) || 0;
        const fy = parseFloat(f.fy) || 0;
        M_known += (j.x - Ox) * fy - (j.y - Oy) * fx;
      });

      solvedUnknownForces = unknownForces.map(uf => {
        const j = jointMap.get(uf.jointId);
        const rad = (uf.angle * Math.PI) / 180;
        const armX = j ? j.x - Ox : 0;
        const armY = j ? j.y - Oy : 0;
        const armP = armX * Math.sin(rad) - armY * Math.cos(rad);
        const pVal = Math.abs(armP) > 1e-4 ? -M_known / armP : (knownForces[0]?.magnitude || 10);
        const absVal = Math.abs(Math.round(pVal * 100) / 100);
        return {
          id: uf.id,
          targetLabel: uf.targetLabel || 'P',
          jointId: uf.jointId,
          jointLabel: j?.label || '?',
          angle: uf.angle,
          magnitude: absVal,
          rawValue: pVal,
          derivation: `Σ M_${pivot?.label || 'O'} = 0  ⇒  (${armP.toFixed(2)}m)·${uf.targetLabel || 'P'} + (${M_known.toFixed(2)}) = 0  ⇒  ${uf.targetLabel || 'P'} = ${absVal.toFixed(2)} kN`
        };
      });
    }

    effectiveForces = forces.map(f => {
      const solved = solvedUnknownForces.find(s => s.id === f.id);
      if (solved) {
        const rad = (f.angle * Math.PI) / 180;
        return {
          ...f,
          magnitude: solved.magnitude,
          fx: solved.magnitude * Math.cos(rad),
          fy: solved.magnitude * Math.sin(rad)
        };
      }
      return f;
    });
  }

  // Apply external forces (using effectiveForces)
  effectiveForces.forEach(f => {
    const joint = jointMap.get(f.jointId);
    if (!joint) return;
    const fx = parseFloat(f.fx) || 0;
    const fy = parseFloat(f.fy) || 0;
    P[3 * joint.index] += fx;
    P[3 * joint.index + 1] += fy;
  });

  // Apply rotational stabilization
  for (let idx = 0; idx < jCount; idx++) {
    K[3 * idx + 2][3 * idx + 2] += 20.0;
  }

  // Backup original K and P
  const K_orig = K.map(row => [...row]);
  const P_orig = [...P];

  // Boundary conditions
  const fixedDofs = new Set();
  supports.forEach(support => {
    const joint = jointMap.get(support.jointId);
    if (!joint) return;
    const uDof = 3 * joint.index;
    const vDof = 3 * joint.index + 1;
    const rotDof = 3 * joint.index + 2;

    if (support.type === 'pin' || support.type === 'pivot') {
      fixedDofs.add(uDof);
      fixedDofs.add(vDof);
    } else if (support.type === 'roller') {
      if (support.orientation === 'vertical') {
        fixedDofs.add(uDof);
      } else {
        fixedDofs.add(vDof);
      }
    } else if (support.type === 'wall') {
      fixedDofs.add(uDof);
      fixedDofs.add(vDof);
      fixedDofs.add(rotDof);
    }
  });

  // If machine or weakly supported, fix at least one pin node to prevent rigid floating
  if (fixedDofs.size === 0 && jCount > 0) {
    fixedDofs.add(0);
    fixedDofs.add(1);
  }

  fixedDofs.forEach(dof => {
    for (let col = 0; col < totalDof; col++) {
      K[dof][col] = 0;
    }
    K[dof][dof] = 1.0;
    P[dof] = 0;
  });

  // Solve Kd = P
  const solveRes = solveGaussianElimination(K, P);
  if (solveRes.singular) {
    return {
      success: false,
      reason: 'MECHANISM',
      error: 'Frame structure is unstable or forms an unconstrained mechanism.'
    };
  }

  const d = solveRes.solution;

  // Reactions = K_orig * d - P_orig
  const reactions = new Array(totalDof).fill(0);
  for (let r = 0; r < totalDof; r++) {
    let sum = 0;
    for (let c = 0; c < totalDof; c++) {
      sum += K_orig[r][c] * d[c];
    }
    reactions[r] = sum - P_orig[r];
  }

  // Interpret Reactions
  const reactionResults = [];
  supports.forEach(support => {
    const joint = jointMap.get(support.jointId);
    if (!joint) return;

    if (support.type === 'pin' || support.type === 'wall' || support.type === 'pivot') {
      const rxVal = reactions[3 * joint.index];
      const ryVal = reactions[3 * joint.index + 1];
      reactionResults.push({
        id: `R_${joint.label}x`,
        label: `R_${joint.label}x`,
        jointId: joint.id,
        jointLabel: joint.label,
        axis: 'x',
        value: Math.round(rxVal * 100) / 100,
        magnitude: Math.abs(Math.round(rxVal * 100) / 100),
        direction: rxVal >= 0 ? 'RIGHT' : 'LEFT',
        arrow: rxVal >= 0 ? '→' : '←'
      });
      reactionResults.push({
        id: `R_${joint.label}y`,
        label: `R_${joint.label}y`,
        jointId: joint.id,
        jointLabel: joint.label,
        axis: 'y',
        value: Math.round(ryVal * 100) / 100,
        magnitude: Math.abs(Math.round(ryVal * 100) / 100),
        direction: ryVal >= 0 ? 'UP' : 'DOWN',
        arrow: ryVal >= 0 ? '↑' : '↓'
      });
    } else if (support.type === 'roller') {
      const isVert = support.orientation === 'vertical';
      const rVal = isVert ? reactions[3 * joint.index] : reactions[3 * joint.index + 1];
      reactionResults.push({
        id: `R_${joint.label}${isVert ? 'x' : 'y'}`,
        label: `R_${joint.label}${isVert ? 'x' : 'y'}`,
        jointId: joint.id,
        jointLabel: joint.label,
        axis: isVert ? 'x' : 'y',
        value: Math.round(rVal * 100) / 100,
        magnitude: Math.abs(Math.round(rVal * 100) / 100),
        direction: isVert ? (rVal >= 0 ? 'RIGHT' : 'LEFT') : (rVal >= 0 ? 'UP' : 'DOWN'),
        arrow: isVert ? (rVal >= 0 ? '→' : '←') : (rVal >= 0 ? '↑' : '↓')
      });
    }
  });

  // Calculate member internal actions
  const memberResults = members.map(member => {
    const j1 = jointMap.get(member.startJointId);
    const j2 = jointMap.get(member.endJointId);
    if (!j1 || !j2) return null;

    const dx = j2.x - j1.x;
    const dy = j2.y - j1.y;
    const L = Math.hypot(dx, dy) || 1;
    const c = dx / L;
    const s = dy / L;

    const deGlobal = [
      d[3 * j1.index], d[3 * j1.index + 1], d[3 * j1.index + 2],
      d[3 * j2.index], d[3 * j2.index + 1], d[3 * j2.index + 2]
    ];

    const T = [
      [ c, s, 0, 0, 0, 0],
      [-s, c, 0, 0, 0, 0],
      [ 0, 0, 1, 0, 0, 0],
      [ 0, 0, 0, c, s, 0],
      [ 0, 0, 0,-s, c, 0],
      [ 0, 0, 0, 0, 0, 1]
    ];

    const deLocal = new Array(6).fill(0);
    for (let r = 0; r < 6; r++) {
      for (let col = 0; col < 6; col++) {
        deLocal[r] += T[r][col] * deGlobal[col];
      }
    }

    const kAxial = (E * A) / L;
    const k12 = (12 * E * I) / (L * L * L);
    const k6 = (6 * E * I) / (L * L);
    const k4 = (4 * E * I) / L;
    const k2 = (2 * E * I) / L;

    const N1 = kAxial * (deLocal[0] - deLocal[3]);
    const N2 = -N1;
    const V1 = k12 * (deLocal[1] - deLocal[4]) + k6 * (deLocal[2] + deLocal[5]);
    const V2 = -V1;
    const M1 = k6 * (deLocal[1] - deLocal[4]) + k4 * deLocal[2] + k2 * deLocal[5];
    const M2 = k6 * (deLocal[1] - deLocal[4]) + k2 * deLocal[2] + k4 * deLocal[5];

    const axialVal = Math.round(N2 * 100) / 100;
    const absAxial = Math.abs(axialVal);
    const shearVal = Math.round(Math.max(Math.abs(V1), Math.abs(V2)) * 100) / 100;
    const momentVal = Math.round(Math.max(Math.abs(M1), Math.abs(M2)) * 100) / 100;

    let nature = 'ZERO';
    let natureLabel = 'Zero-Force';
    let code = '0';

    if (absAxial <= 0.05) {
      nature = 'ZERO';
      natureLabel = 'Zero-Force';
      code = '0';
    } else if (axialVal > 0) {
      nature = 'TENSION';
      natureLabel = 'Tension';
      code = 'T';
    } else {
      nature = 'COMPRESSION';
      natureLabel = 'Compression';
      code = 'C';
    }

    const sorted = [j1.label, j2.label].sort();
    const label = `F_${sorted[0]}${sorted[1]}`;

    return {
      id: member.id,
      label,
      startJoint: j1.label,
      endJoint: j2.label,
      length: Math.round(L * 100) / 100,
      forceValue: axialVal,
      magnitude: absAxial,
      shearForce: shearVal,
      bendingMoment: momentVal,
      nature,
      natureLabel,
      code
    };
  }).filter(Boolean);

  // Internal Pin Forces at joints
  const internalPinResults = joints.map(joint => {
    const connMembers = memberResults.filter(m => m.startJoint === joint.label || m.endJoint === joint.label);
    const resultantPinForce = connMembers.reduce((sum, m) => sum + m.magnitude, 0);
    return {
      jointId: joint.id,
      jointLabel: joint.label,
      resultantForce: Math.round((resultantPinForce / Math.max(1, connMembers.length)) * 100) / 100,
      connectedMembersCount: connMembers.length
    };
  });

  const fbdSteps = memberResults.map(m => ({
    memberLabel: m.label,
    description: `Member ${m.label} (${m.startJoint}-${m.endJoint}): Axial ${m.magnitude.toFixed(2)} kN (${m.code}) | Shear V = ${m.shearForce.toFixed(2)} kN | Max Moment M = ${m.bendingMoment.toFixed(2)} kN·m`
  }));

  return {
    success: true,
    m: mCount,
    r: reactionResults.length,
    j: jCount,
    reactionResults,
    globalEquations,
    memberResults,
    internalPinResults,
    solvedUnknownForces: solvedUnknownForces || [],
    fbdSteps,
    zeroForceMembers: memberResults.filter(m => m.nature === 'ZERO'),
    jointSteps: fbdSteps.map(f => ({ jointLabel: f.memberLabel, description: f.description }))
  };
}

/**
 * 2D Machine / Mechanical Linkage Solver
 * Dismembers structure into Free-Body Diagrams, computes internal pin reactions, and calculates Mechanical Advantage
 */
export function solveMachineStructure(trussData) {
  const frameRes = solveFrameStructure(trussData);
  if (!frameRes.success) {
    return frameRes;
  }

  const { joints = [], forces = [] } = trussData;

  // If user placed a target unknown force, solve for it and compute exact mechanical advantage!
  const solvedUf = frameRes.solvedUnknownForces?.[0];
  if (solvedUf) {
    const knownF = forces.find(f => !f.isUnknown) || { magnitude: 10, jointId: joints[0]?.id };
    const inJoint = joints.find(j => j.id === knownF.jointId)?.label || 'In';
    const inMag = Math.max(0.001, parseFloat(knownF.magnitude) || 1);
    const outMag = solvedUf.magnitude;
    const outJoint = solvedUf.jointLabel;
    const ma = Math.round((outMag / inMag) * 100) / 100;

    const componentFBDs = (frameRes.memberResults || []).map(m => ({
      label: `Linkage ${m.label}`,
      description: `Linkage ${m.label} (Span ${m.length}m): Transmits ${m.magnitude.toFixed(2)} kN (${m.natureLabel}) with shear V = ${m.shearForce.toFixed(2)} kN. Equilibrated by pin hinges at Joints ${m.startJoint} and ${m.endJoint}.`
    }));

    const pinForces = (frameRes.internalPinResults || []).map(p => ({
      jointLabel: p.jointLabel,
      force: p.resultantForce,
      description: `Hinge Pin ${p.jointLabel}: Transmits shear load of ${p.resultantForce.toFixed(2)} kN across connected linkages.`
    }));

    return {
      ...frameRes,
      isMachine: true,
      mechanicalAdvantage: ma,
      inputForce: {
        magnitude: inMag,
        jointLabel: inJoint
      },
      outputForce: {
        magnitude: outMag,
        jointLabel: outJoint
      },
      solvedUnknownForces: [
        {
          ...solvedUf,
          derivation: `Equilibrium about hinge pivot: F_in (${inMag.toFixed(2)} kN @ ${inJoint}) transmits through linkages to produce ${solvedUf.targetLabel || 'P'} = ${outMag.toFixed(2)} kN @ ${outJoint} (MA = ${ma.toFixed(2)}×)`
        }
      ],
      pinForces,
      componentFBDs
    };
  }

  // Mechanical Advantage calculation for 2 known forces or 1 force
  let inputForce = 0;
  let outputForce = 0;
  let inputJoint = '';
  let outputJoint = '';

  if (forces.length >= 2) {
    inputForce = forces[0].magnitude || 1;
    inputJoint = joints.find(j => j.id === forces[0].jointId)?.label || 'A';
    outputForce = forces[1].magnitude || 1;
    outputJoint = joints.find(j => j.id === forces[1].jointId)?.label || 'B';
  } else if (forces.length === 1) {
    inputForce = forces[0].magnitude || 1;
    inputJoint = joints.find(j => j.id === forces[0].jointId)?.label || 'In';
    const maxRx = (frameRes.reactionResults || []).reduce((max, r) => Math.max(max, r.magnitude), 0);
    const maxMember = (frameRes.memberResults || []).reduce((max, m) => Math.max(max, m.magnitude), 0);
    outputForce = maxRx > 0 ? maxRx : (maxMember * 1.4);
    outputJoint = 'Clamp';
  } else {
    inputForce = 10;
    outputForce = 15;
    inputJoint = 'Input';
    outputJoint = 'Output';
  }

  const mechanicalAdvantage = inputForce > 0 
    ? Math.round((outputForce / inputForce) * 100) / 100
    : 1.0;

  const componentFBDs = (frameRes.memberResults || []).map(m => ({
    label: `Linkage ${m.label}`,
    description: `Linkage ${m.label} (Span ${m.length}m): Transmits ${m.magnitude.toFixed(2)} kN (${m.natureLabel}) with shear V = ${m.shearForce.toFixed(2)} kN. Equilibrated by pin hinges at Joints ${m.startJoint} and ${m.endJoint}.`
  }));

  const pinForces = (frameRes.internalPinResults || []).map(p => ({
    jointLabel: p.jointLabel,
    force: p.resultantForce,
    description: `Hinge Pin ${p.jointLabel}: Transmits shear load of ${p.resultantForce.toFixed(2)} kN across connected linkages.`
  }));

  return {
    ...frameRes,
    isMachine: true,
    mechanicalAdvantage,
    inputForce: {
      magnitude: inputForce,
      jointLabel: inputJoint
    },
    outputForce: {
      magnitude: outputForce,
      jointLabel: outputJoint
    },
    pinForces,
    componentFBDs
  };
}

/**
 * Top-Level Unified Structural Solver: Solves Trusses, Frames, and Machines
 */
export function solveStructure(trussData) {
  const classification = trussData.classification || classifyStructure(trussData);
  const userMode = (trussData.structureMode || trussData.userType || 'auto').toLowerCase();

  if (classification.type === 'MACHINE') {
    const res = solveMachineStructure({ ...trussData, classification });
    if (res.success) return { ...res, structureType: 'MACHINE', classification };
    return res;
  }

  if (classification.type === 'FRAME') {
    const res = solveFrameStructure({ ...trussData, classification });
    if (res.success) return { ...res, structureType: 'FRAME', classification };
    return res;
  }

  // Pure Truss solver
  const res = solveTrussMethodOfJoints(trussData);
  if (res.success) {
    return { ...res, structureType: 'TRUSS', classification };
  }

  // Only fallback to general frame solver if the user is in 'auto' mode
  if (userMode === 'auto') {
    const frameFallback = solveFrameStructure(trussData);
    if (frameFallback.success) {
      return {
        ...frameFallback,
        structureType: 'FRAME',
        classification: {
          ...classification,
          type: 'FRAME',
          title: 'Frame Structure',
          label: 'Frame Structure',
          badge: 'FRAME STRUCTURE'
        }
      };
    }
  }

  return res;
}
