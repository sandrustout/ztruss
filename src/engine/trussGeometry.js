/**
 * Truss Geometry utilities
 * Handles coordinate conversions, snap detection, and auto-naming conventions.
 */

// Converts joint index to alphabetical label (0 -> 'A', 25 -> 'Z', 26 -> 'AA', etc.)
export function getJointLabel(index) {
  let label = '';
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
}

// Generate member identifier from two joint labels, sorted alphabetically
export function getMemberId(labelA, labelB) {
  const sorted = [labelA, labelB].sort();
  return `F_${sorted[0].toLowerCase()}${sorted[1].toLowerCase()}`;
}

export function getMemberDisplayLabel(labelA, labelB) {
  const sorted = [labelA, labelB].sort();
  return `F_${sorted[0]}${sorted[1]}`;
}

// Distance between two points in 2D space
export function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.hypot(dx, dy);
}

// Find closest joint within snap radius
export function findSnapJoint(point, joints, snapThreshold = 0.5, excludeIds = []) {
  let closestJoint = null;
  let minDistance = Infinity;

  for (const joint of joints) {
    if (excludeIds.includes(joint.id)) continue;
    const d = distance(point, joint);
    if (d < minDistance && d <= snapThreshold) {
      minDistance = d;
      closestJoint = joint;
    }
  }

  return closestJoint;
}

/**
 * Projects a point onto a line segment between a and b.
 * Returns projection point, parameter t (0 to 1), and perpendicular distance.
 */
export function projectPointOntoSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) {
    return { x: a.x, y: a.y, t: 0, distance: distance(point, a) };
  }

  const rawT = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq;
  const t = Math.max(0, Math.min(1, rawT));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;

  return {
    x: Math.round(projX * 1000) / 1000,
    y: Math.round(projY * 1000) / 1000,
    t,
    rawT,
    distance: distance(point, { x: projX, y: projY })
  };
}

/**
 * Robust snap detector:
 * 1. Checks joints within jointThreshold (default 0.45m).
 * 2. Checks member line segments within memberThreshold (default 0.35m).
 */
export function findSnapTarget(point, joints, members, options = {}) {
  const {
    excludeJointIds = [],
    excludeMemberIds = [],
    jointThreshold = 0.45,
    memberThreshold = 0.35
  } = options;

  // 1. Prioritize snapping directly to an existing joint
  let closestJoint = null;
  let minJointDist = Infinity;
  for (const j of joints) {
    if (excludeJointIds.includes(j.id)) continue;
    const d = distance(point, j);
    if (d <= jointThreshold && d < minJointDist) {
      minJointDist = d;
      closestJoint = j;
    }
  }

  if (closestJoint) {
    return {
      type: 'joint',
      joint: closestJoint,
      x: closestJoint.x,
      y: closestJoint.y,
      distance: minJointDist
    };
  }

  // 2. Check if point snaps onto any member span
  const jointMap = new Map(joints.map(j => [j.id, j]));
  let closestMember = null;
  let closestProj = null;
  let minMemDist = Infinity;

  for (const m of members) {
    if (excludeMemberIds.includes(m.id)) continue;
    const start = jointMap.get(m.startJointId);
    const end = jointMap.get(m.endJointId);
    if (!start || !end) continue;

    const proj = projectPointOntoSegment(point, start, end);
    // Only snap to interior span (not right at endpoints)
    if (proj.t > 0.08 && proj.t < 0.92 && proj.distance <= memberThreshold && proj.distance < minMemDist) {
      minMemDist = proj.distance;
      closestMember = m;
      closestProj = proj;
    }
  }

  if (closestMember && closestProj) {
    return {
      type: 'member',
      member: closestMember,
      x: closestProj.x,
      y: closestProj.y,
      t: closestProj.t,
      distance: minMemDist
    };
  }

  return null;
}

/**
 * Calculate endpoint coordinates for a member given start point, member type, and precision parameters.
 * Units: meters (physics world coordinate system: +x is right, +y is up)
 */
export function calculateMemberEndpoint(startPoint, memberType, params) {
  const { length, angle = 45, direction = 'up', horizontalDir = 'right', verticalSlope = 'up' } = params;
  const L = Math.max(0.1, Math.abs(parseFloat(length)) || 1.0);

  let endX = startPoint.x;
  let endY = startPoint.y;

  switch (memberType) {
    case 'horizontal': {
      const sign = horizontalDir === 'left' ? -1 : 1;
      endX = startPoint.x + sign * L;
      endY = startPoint.y;
      break;
    }

    case 'vertical': {
      const sign = direction === 'down' ? -1 : 1;
      endX = startPoint.x;
      endY = startPoint.y + sign * L;
      break;
    }

    case 'right-leaned': {
      // Sloping right: angle of elevation from horizontal
      const rad = ((Math.min(89, Math.max(1, parseFloat(angle) || 45))) * Math.PI) / 180;
      const ySign = verticalSlope === 'down' ? -1 : 1;
      endX = startPoint.x + L * Math.cos(rad);
      endY = startPoint.y + ySign * L * Math.sin(rad);
      break;
    }

    case 'left-leaned': {
      // Sloping left: angle of elevation from horizontal
      const rad = ((Math.min(89, Math.max(1, parseFloat(angle) || 45))) * Math.PI) / 180;
      const ySign = verticalSlope === 'down' ? -1 : 1;
      endX = startPoint.x - L * Math.cos(rad);
      endY = startPoint.y + ySign * L * Math.sin(rad);
      break;
    }

    default:
      endX = startPoint.x + L;
      endY = startPoint.y;
  }

  // Round to 4 decimal places for clean floating point representations
  return {
    x: Math.round(endX * 10000) / 10000,
    y: Math.round(endY * 10000) / 10000
  };
}

/**
 * Calculate external force components (in kN)
 * Math convention: 0° = +x, 90° = +y, 180° = -x, 270° = -y
 */
export function calculateForceComponents(magnitude, angleDeg) {
  const mag = parseFloat(magnitude) || 0;
  const rad = ((parseFloat(angleDeg) || 0) * Math.PI) / 180;
  return {
    fx: Math.round(mag * Math.cos(rad) * 10000) / 10000,
    fy: Math.round(mag * Math.sin(rad) * 10000) / 10000
  };
}

/**
 * Calculate angle in degrees from p1 to p2 (0° is +X, 90° is +Y)
 */
export function getAngleBetweenPoints(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return Math.round(deg * 10) / 10;
}

/**
 * Detect collinear member chains that constitute multi-force continuous members (e.g. in Frames and Machines)
 */
export function detectMultiForceMembers(joints, members) {
  const jointMap = new Map(joints.map(j => [j.id, j]));
  const memberMap = new Map(members.map(m => [m.id, m]));

  // Adjacency: jointId -> list of memberIds
  const jointMembers = new Map();
  joints.forEach(j => jointMembers.set(j.id, []));
  members.forEach(m => {
    if (jointMembers.has(m.startJointId)) jointMembers.get(m.startJointId).push(m.id);
    if (jointMembers.has(m.endJointId)) jointMembers.get(m.endJointId).push(m.id);
  });

  const multiForceChains = [];
  const processedPairs = new Set();

  // Find collinear pairs sharing a joint where the joint has other connections
  joints.forEach(j => {
    const connected = jointMembers.get(j.id) || [];
    if (connected.length >= 3) {
      // Check all pairs of connected members at this joint for collinearity
      for (let i = 0; i < connected.length; i++) {
        for (let k = i + 1; k < connected.length; k++) {
          const m1 = memberMap.get(connected[i]);
          const m2 = memberMap.get(connected[k]);
          if (!m1 || !m2) continue;

          const other1 = m1.startJointId === j.id ? jointMap.get(m1.endJointId) : jointMap.get(m1.startJointId);
          const other2 = m2.startJointId === j.id ? jointMap.get(m2.endJointId) : jointMap.get(m2.startJointId);
          if (!other1 || !other2) continue;

          // Check collinearity
          const v1x = other1.x - j.x;
          const v1y = other1.y - j.y;
          const v2x = other2.x - j.x;
          const v2y = other2.y - j.y;
          const l1 = Math.hypot(v1x, v1y);
          const l2 = Math.hypot(v2x, v2y);
          if (l1 < 1e-4 || l2 < 1e-4) continue;

          // Cross product of normalized vectors
          const cross = Math.abs((v1x * v2y - v1y * v2x) / (l1 * l2));
          // Dot product to ensure they extend in opposite directions (approx -1)
          const dot = (v1x * v2x + v1y * v2y) / (l1 * l2);

          if (cross < 0.12 && dot < -0.85) {
            // Collinear continuous member passing through joint j!
            const pairKey = [m1.id, m2.id].sort().join('--');
            if (!processedPairs.has(pairKey)) {
              processedPairs.add(pairKey);
              multiForceChains.push({
                throughJoint: j,
                member1: m1,
                member2: m2,
                joint1: other1,
                joint2: other2,
                label: `Member ${other1.label}-${j.label}-${other2.label}`
              });
            }
          }
        }
      }
    }
  });

  return multiForceChains;
}
