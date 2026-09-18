/**
 * Determinacy calculation & classification for 2D Trusses, Frames, and Machines
 */

import { detectMultiForceMembers } from './trussGeometry.js';

/**
 * Classify whether a structure is a Truss, Frame, or Machine
 */
export function classifyStructure(data) {
  const { joints = [], members = [], supports = [], forces = [] } = data;
  const userMode = (data.structureMode || data.userType || 'auto').toLowerCase();

  // 1. Manual user override if specified
  if (userMode && userMode !== 'auto') {
    if (userMode === 'truss') {
      return {
        type: 'TRUSS',
        title: 'Truss Structure',
        label: 'Truss Structure',
        badge: 'TRUSS STRUCTURE',
        badgeClass: 'classification-truss',
        tagline: 'Two-Force Members • Pure Axial Stress (T/C)',
        reason: 'All members are modeled as two-force straight bars pin-connected at joints, with loads applied only at nodes.',
        explanation: 'All members are modeled as two-force straight bars pin-connected at joints, with loads applied only at nodes.',
        isTruss: true,
        isFrame: false,
        isMachine: false,
        isMultiForce: false,
        multiForceCount: 0,
        multiForceMembers: []
      };
    }
    if (userMode === 'frame') {
      const mf = detectMultiForceMembers(joints, members);
      return {
        type: 'FRAME',
        title: 'Frame Structure',
        label: 'Frame Structure',
        badge: 'FRAME STRUCTURE',
        badgeClass: 'classification-frame',
        tagline: 'Multi-Force Members • Stationary Structural Support',
        reason: 'Stationary rigid frame containing multi-force members. Solves for internal pin reactions, member shear (V), bending moments (M), and axial forces.',
        explanation: 'Stationary rigid frame containing multi-force members. Solves for internal pin reactions, member shear (V), bending moments (M), and axial forces.',
        isTruss: false,
        isFrame: true,
        isMachine: false,
        isMultiForce: mf.length > 0,
        multiForceCount: mf.length,
        multiForceMembers: mf
      };
    }
    if (userMode === 'machine') {
      const mf = detectMultiForceMembers(joints, members);
      return {
        type: 'MACHINE',
        title: 'Machine Mechanism',
        label: 'Machine Mechanism',
        badge: 'MACHINE MECHANISM',
        badgeClass: 'classification-machine',
        tagline: 'Force Transmission • Mechanical Advantage (MA)',
        reason: 'Mechanical assembly containing multi-force linkages designed to transmit and amplify applied loads into output forces.',
        explanation: 'Mechanical assembly containing multi-force linkages designed to transmit and amplify applied loads into output forces.',
        isTruss: false,
        isFrame: false,
        isMachine: true,
        isMultiForce: mf.length > 0,
        multiForceCount: mf.length,
        multiForceMembers: mf
      };
    }
  }

  // 2. Automatic Detection based on Engineering Mechanics
  const multiForceChains = detectMultiForceMembers(joints, members);
  const r = supports.reduce((sum, s) => sum + (s.type === 'roller' ? 1 : 2), 0);

  // If there are multi-force members or moving linkages:
  // - Machine: designed to transmit or modify forces (often has r < 3 with balanced forces, or a single pivot like pliers/clamp/scissor)
  // - Frame: stationary structure with r >= 3 and multi-force members
  const hasOpposingForcePairs = forces.length >= 2;
  const isLikelyMachine = (r < 3 && hasOpposingForcePairs) || (r <= 2 && multiForceChains.length > 0);

  if (multiForceChains.length > 0 || isLikelyMachine) {
    if (r >= 3 && !isLikelyMachine) {
      return {
        type: 'FRAME',
        title: 'Frame Structure',
        label: 'Frame Structure',
        badge: 'FRAME STRUCTURE',
        badgeClass: 'classification-frame',
        tagline: 'Multi-Force Members • Stationary Structural Support',
        reason: `Contains ${multiForceChains.length} multi-force member(s) (${multiForceChains.map(c => c.label).join(', ')}). Fully supported (r = ${r} ≥ 3) against rigid body motion to support static loads.`,
        explanation: `Contains ${multiForceChains.length} multi-force member(s) (${multiForceChains.map(c => c.label).join(', ')}). Fully supported (r = ${r} ≥ 3) against rigid body motion to support static loads.`,
        isTruss: false,
        isFrame: true,
        isMachine: false,
        isMultiForce: true,
        multiForceCount: multiForceChains.length,
        multiForceMembers: multiForceChains
      };
    } else {
      return {
        type: 'MACHINE',
        title: 'Machine Mechanism',
        label: 'Machine Mechanism',
        badge: 'MACHINE MECHANISM',
        badgeClass: 'classification-machine',
        tagline: 'Force Transmission • Mechanical Advantage (MA)',
        reason: `Assembly contains multi-force linkages designed to transmit or amplify applied forces. Solves for internal pin reaction forces and Mechanical Advantage (MA = F_out / F_in).`,
        explanation: `Assembly contains multi-force linkages designed to transmit or amplify applied forces. Solves for internal pin reaction forces and Mechanical Advantage (MA = F_out / F_in).`,
        isTruss: false,
        isFrame: false,
        isMachine: true,
        isMultiForce: multiForceChains.length > 0,
        multiForceCount: multiForceChains.length,
        multiForceMembers: multiForceChains
      };
    }
  }

  // Default: Pure 2-force Truss
  return {
    type: 'TRUSS',
    title: 'Truss Structure',
    label: 'Truss Structure',
    badge: 'TRUSS STRUCTURE',
    badgeClass: 'classification-truss',
    tagline: 'Two-Force Members • Pure Axial Stress (T/C)',
    reason: 'All members are two-force straight bars pin-connected at joints, with loads applied strictly at nodes. Solvable via Method of Joints.',
    explanation: 'All members are two-force straight bars pin-connected at joints, with loads applied strictly at nodes. Solvable via Method of Joints.',
    isTruss: true,
    isFrame: false,
    isMachine: false,
    isMultiForce: false,
    multiForceCount: 0,
    multiForceMembers: []
  };
}

/**
 * Determinacy calculation & classification
 */
export function checkDeterminacy(trussData) {
  const { joints = [], members = [], supports = [], forces = [] } = trussData;
  const userMode = trussData.structureMode || trussData.userType || 'auto';

  const classification = classifyStructure({ joints, members, supports, forces, structureMode: userMode, userType: userMode });

  const j = joints.length;
  const m = members.length;

  if (j === 0) {
    return {
      m: 0,
      r: 0,
      j: 0,
      eqCount: 0,
      unknownCount: 0,
      category: 'EMPTY',
      status: 'Empty Canvas',
      isDeterminate: false,
      message: 'Add joints, members, and supports to analyze.',
      classification
    };
  }

  // Count reaction components:
  let r = 0;
  const reactionBreakdown = [];

  supports.forEach(support => {
    let count = 0;
    let typeName = support.type;
    if (support.type === 'pin') {
      count = 2;
      typeName = 'Pin Support (Rx, Ry)';
    } else if (support.type === 'pivot') {
      count = 2;
      typeName = 'Pivot Point (Rx, Ry)';
    } else if (support.type === 'roller') {
      count = 1;
      const orientation = support.orientation || 'horizontal';
      typeName = `Roller Support (${orientation === 'vertical' ? 'Rx' : 'Ry'})`;
    } else if (support.type === 'wall') {
      count = 2;
      typeName = 'Fixed Wall/Surface (Rx, Ry)';
    }

    r += count;
    reactionBreakdown.push({
      jointId: support.jointId,
      type: support.type,
      typeName,
      reactions: count
    });
  });

  const unknownForcesCount = (forces || []).filter(f => f.isUnknown).length;

  // For Machines:
  // A machine is often supported by a single pin (r = 2) or no external supports, because it is in internal equilibrium under input and output loads!
  if (classification.isMachine) {
    const isDeterminateMachine = (m >= 2 && forces.length >= 1);
    return {
      m,
      r,
      u: unknownForcesCount,
      j,
      eqCount: 3 * Math.max(1, Math.floor(m / 2)),
      unknownCount: m + r + unknownForcesCount,
      category: isDeterminateMachine ? 'DETERMINATE' : 'UNSTABLE',
      status: isDeterminateMachine ? 'Determinate Machine' : 'Incomplete Machine',
      isDeterminate: isDeterminateMachine,
      message: isDeterminateMachine
        ? `Machine assembly with ${m} member linkages. Solvable via component Free-Body Diagrams (FBDs).`
        : `Machine requires external input forces and connected linkages.`,
      reactionBreakdown,
      classification
    };
  }

  // For Frames:
  if (classification.isFrame) {
    const isStableFrame = (r >= 3 || (r >= 2 && unknownForcesCount > 0)) && m >= 2;
    return {
      m,
      r,
      u: unknownForcesCount,
      j,
      eqCount: 2 * j,
      unknownCount: m + r + unknownForcesCount,
      category: isStableFrame ? 'DETERMINATE' : 'UNSTABLE',
      status: isStableFrame ? 'Determinate Rigid Frame' : 'Unstable Frame',
      isDeterminate: isStableFrame,
      message: isStableFrame
        ? `Rigid frame with ${m} members, r = ${r} reactions${unknownForcesCount > 0 ? `, and ${unknownForcesCount} target unknown force(s)` : ''}. Multi-force members carry axial force, shear, and bending moment.`
        : `Frame requires adequate supports (r ≥ 3) to prevent rigid-body motion.`,
      reactionBreakdown,
      classification
    };
  }

  // Standard 2D Truss determinacy formula: (m + r + u) vs (2j)
  const eqCount = 2 * j;
  const unknownCount = m + r + unknownForcesCount;

  let category = 'UNSTABLE';
  let status = 'Unstable';
  let isDeterminate = false;
  let message = '';

  if (j < 3 && m > 0) {
    category = 'UNSTABLE';
    status = 'Unstable (Degenerate)';
    message = 'A stable 2D truss requires at least 3 non-collinear joints and 3 members.';
  } else if (r < 3 && unknownForcesCount === 0) {
    category = 'UNSTABLE';
    status = 'Unstable (Rigid Body Motion)';
    message = `Insufficient supports (r = ${r} < 3). The truss can move as a rigid body under loads.`;
  } else if (unknownCount < eqCount) {
    category = 'UNSTABLE';
    status = 'Unstable (Mechanism)';
    message = `Unknowns (${unknownCount}) < 2j (${eqCount}): Truss has degrees of freedom and forms a mechanism.`;
  } else if (unknownCount > eqCount) {
    category = 'INDETERMINATE';
    status = 'Statically Indeterminate';
    message = `Unknowns (${unknownCount}) > 2j (${eqCount}): Truss has ${unknownCount - eqCount} redundant member(s) or reaction(s).`;
  } else {
    // unknownCount === eqCount (m + r + u === 2j)
    category = 'DETERMINATE';
    status = 'Statically Determinate';
    isDeterminate = true;
    message = unknownForcesCount > 0
      ? `m + r + u (${unknownCount}) = 2j (${eqCount}): Statically determinate with target unknown force. Solvable via Method of Joints.`
      : `m + r (${unknownCount}) = 2j (${eqCount}): Statically determinate. Solvable via the Method of Joints.`;
  }

  return {
    m,
    r,
    u: unknownForcesCount,
    j,
    eqCount,
    unknownCount,
    category,
    status,
    isDeterminate,
    message,
    reactionBreakdown,
    classification
  };
}

