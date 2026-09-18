import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  getJointLabel,
  calculateMemberEndpoint,
  calculateForceComponents,
  distance,
  findSnapTarget,
  projectPointOntoSegment
} from '../engine/trussGeometry';
import { checkDeterminacy, classifyStructure } from '../engine/determinacy';
import { solveTrussMethodOfJoints, solveStructure } from '../engine/physicsSolver';

// Helper to consolidate coincident joints and sanitize members/supports/forces
export function consolidateJoints(currentJoints, currentMembers, currentSupports, currentForces, tolerance = 0.25) {
  let jList = currentJoints.map(j => ({ ...j }));
  let mList = currentMembers.map(m => ({ ...m }));
  let sList = currentSupports.map(s => ({ ...s }));
  let fList = currentForces.map(f => ({ ...f }));

  let mergedAny = false;

  for (let i = 0; i < jList.length; i++) {
    for (let k = i + 1; k < jList.length; k++) {
      const jA = jList[i];
      const jB = jList[k];
      const dist = Math.hypot(jB.x - jA.x, jB.y - jA.y);
      if (dist <= tolerance) {
        // Consolidate jB into jA
        const keepId = jA.id;
        const removeId = jB.id;

        // Update members
        mList = mList.map(m => {
          const newStart = m.startJointId === removeId ? keepId : m.startJointId;
          const newEnd = m.endJointId === removeId ? keepId : m.endJointId;
          return { ...m, startJointId: newStart, endJointId: newEnd };
        }).filter(m => m.startJointId !== m.endJointId);

        // Deduplicate parallel members
        const seenPairs = new Set();
        mList = mList.filter(m => {
          const pair = [m.startJointId, m.endJointId].sort().join('--');
          if (seenPairs.has(pair)) return false;
          seenPairs.add(pair);
          return true;
        });

        // Remap supports
        sList = sList.map(s => (s.jointId === removeId ? { ...s, jointId: keepId } : s));
        const seenSupports = new Set();
        sList = sList.filter(s => {
          const key = `${s.jointId}_${s.type}`;
          if (seenSupports.has(key)) return false;
          seenSupports.add(key);
          return true;
        });

        // Remap forces
        fList = fList.map(f => (f.jointId === removeId ? { ...f, jointId: keepId } : f));

        // Remove jB
        jList.splice(k, 1);
        k--;
        mergedAny = true;
      }
    }
  }

  return { jList, mList, sList, fList, mergedAny };
}

/**
 * Constrains member end position based on member type:
 * - 'horizontal': strictly locks Y to startJoint.y (0° or 180°)
 * - 'vertical': strictly locks X to startJoint.x (90° or 270°)
 * - 'right-leaned': strictly locks to +45° or -135° diagonal (y - y0 = x - x0)
 * - 'left-leaned': strictly locks to +135° or -45° diagonal (y - y0 = -(x - x0))
 * - 'freehand': unconstrained 360°
 */
export function applyMemberAngleConstraint(itemType, startJoint, rawPos) {
  if (!startJoint || itemType === 'freehand') {
    return { ...rawPos };
  }

  const dx = rawPos.x - startJoint.x;
  const dy = rawPos.y - startJoint.y;

  if (itemType === 'horizontal') {
    let constrainedDx = dx;
    if (Math.abs(constrainedDx) < 0.2) constrainedDx = constrainedDx >= 0 ? 0.2 : -0.2;
    return {
      x: startJoint.x + constrainedDx,
      y: startJoint.y
    };
  }

  if (itemType === 'vertical') {
    let constrainedDy = dy;
    if (Math.abs(constrainedDy) < 0.2) constrainedDy = constrainedDy >= 0 ? 0.2 : -0.2;
    return {
      x: startJoint.x,
      y: startJoint.y + constrainedDy
    };
  }

  if (itemType === 'right-leaned') {
    // Exact 45° diagonal line (slope = +1): y - y0 = x - x0
    let s = (dx + dy) / 2;
    if (Math.abs(s) < 0.2) s = s >= 0 ? 0.2 : -0.2;
    return {
      x: startJoint.x + s,
      y: startJoint.y + s
    };
  }

  if (itemType === 'left-leaned') {
    // Exact 135° diagonal line (slope = -1): y - y0 = -(x - x0)
    let s = (-dx + dy) / 2;
    if (Math.abs(s) < 0.2) s = s >= 0 ? 0.2 : -0.2;
    return {
      x: startJoint.x - s,
      y: startJoint.y + s
    };
  }

  return { ...rawPos };
}

const TrussContext = createContext(null);

export function useTruss() {
  const context = useContext(TrussContext);
  if (!context) {
    throw new Error('useTruss must be used within a TrussProvider');
  }
  return context;
}

export function TrussProvider({ children }) {
  const [joints, setJoints] = useState([]);
  const [members, setMembers] = useState([]);
  const [supports, setSupports] = useState([]);
  const [forces, setForces] = useState([]);

  // Refs to always access synchronously latest state across async & event handlers
  const jointsRef = useRef(joints);
  jointsRef.current = joints;
  const membersRef = useRef(members);
  membersRef.current = members;
  const supportsRef = useRef(supports);
  supportsRef.current = supports;
  const forcesRef = useRef(forces);
  forcesRef.current = forces;

  // Selection & Query State
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [showForceLabels, setShowForceLabels] = useState(true);

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState(null);

  // Active Tool Mode ('select' | 'eraser')
  const [activeTool, setActiveTool] = useState('select');

  // Armed Tool from Toolbox (Click to Select Tool & Click anywhere on Canvas to Draw)
  const [armedTool, setArmedTool] = useState(null);

  // Structure classification mode ('auto' | 'truss' | 'frame' | 'machine')
  const [structureMode, setStructureMode] = useState('auto');

  // Unit System State: Length ('m' | 'cm') and Force ('kN' | 'N')
  const [lengthUnit, setLengthUnit] = useState('m');
  const [forceUnit, setForceUnit] = useState('kN');

  // Format length with current unit
  const formatLength = useCallback((valMeters, decimals = 2) => {
    if (valMeters === undefined || valMeters === null || isNaN(valMeters)) return '0.00 ' + lengthUnit;
    if (lengthUnit === 'cm') {
      const cmVal = Number(valMeters) * 100;
      return `${cmVal.toFixed(decimals > 1 ? decimals - 1 : decimals)} cm`;
    }
    return `${Number(valMeters).toFixed(decimals)} m`;
  }, [lengthUnit]);

  // Format force with current unit
  const formatForce = useCallback((valKN, decimals = 2) => {
    if (valKN === undefined || valKN === null || isNaN(valKN)) return '0.00 ' + forceUnit;
    if (forceUnit === 'N') {
      const nVal = Number(valKN) * 1000;
      return `${Math.round(nVal).toLocaleString()} N`;
    }
    return `${Number(valKN).toFixed(decimals)} kN`;
  }, [forceUnit]);

  // Convert length to internal meters
  const toInternalLength = useCallback((val, unit = lengthUnit) => {
    const num = parseFloat(val) || 0;
    return unit === 'cm' ? num / 100 : num;
  }, [lengthUnit]);

  // Convert force to internal kN
  const toInternalForce = useCallback((val, unit = forceUnit) => {
    const num = parseFloat(val) || 0;
    return unit === 'N' ? num / 1000 : num;
  }, [forceUnit]);

  // Convert internal meters to display length
  const fromInternalLength = useCallback((meters, unit = lengthUnit) => {
    const num = parseFloat(meters) || 0;
    return unit === 'cm' ? num * 100 : num;
  }, [lengthUnit]);

  // Convert internal kN to display force
  const fromInternalForce = useCallback((kN, unit = forceUnit) => {
    const num = parseFloat(kN) || 0;
    return unit === 'N' ? num * 1000 : num;
  }, [forceUnit]);

  // Undo / Redo History Management (synchronized with refs for zero-latency shortcut callbacks)
  const historyRef = useRef([{ joints: [], members: [], supports: [], forces: [] }]);
  const historyIndexRef = useRef(0);
  const [history, setHistory] = useState(historyRef.current);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Push new state snapshot to history
  const pushHistorySnapshot = useCallback((newJoints, newMembers, newSupports, newForces) => {
    const snapshot = {
      joints: JSON.parse(JSON.stringify(newJoints)),
      members: JSON.parse(JSON.stringify(newMembers)),
      supports: JSON.parse(JSON.stringify(newSupports)),
      forces: JSON.parse(JSON.stringify(newForces))
    };
    const nextIdx = historyIndexRef.current + 1;
    const nextHistory = [...historyRef.current.slice(0, nextIdx), snapshot];
    historyRef.current = nextHistory;
    historyIndexRef.current = nextIdx;
    setHistory(nextHistory);
    setHistoryIndex(nextIdx);
  }, []);

  // Undo action
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      const nextIdx = historyIndexRef.current - 1;
      historyIndexRef.current = nextIdx;
      setHistoryIndex(nextIdx);
      const snapshot = historyRef.current[nextIdx];
      if (snapshot) {
        setJoints(JSON.parse(JSON.stringify(snapshot.joints)));
        setMembers(JSON.parse(JSON.stringify(snapshot.members)));
        setSupports(JSON.parse(JSON.stringify(snapshot.supports)));
        setForces(JSON.parse(JSON.stringify(snapshot.forces)));
        setSelectedItem(null);
        setSelectedMemberId(null);
        setAnalysisResult(null);
      }
    }
  }, []);

  // Redo action
  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const nextIdx = historyIndexRef.current + 1;
      historyIndexRef.current = nextIdx;
      setHistoryIndex(nextIdx);
      const snapshot = historyRef.current[nextIdx];
      if (snapshot) {
        setJoints(JSON.parse(JSON.stringify(snapshot.joints)));
        setMembers(JSON.parse(JSON.stringify(snapshot.members)));
        setSupports(JSON.parse(JSON.stringify(snapshot.supports)));
        setForces(JSON.parse(JSON.stringify(snapshot.forces)));
        setSelectedItem(null);
        setSelectedMemberId(null);
        setAnalysisResult(null);
      }
    }
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Global keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Interactive Free-Hand Member Placement State
  const [freeHandState, setFreeHandState] = useState({
    isActive: false,
    startJoint: null, // origin joint object { id, x, y, label }
    currentPoint: null, // { x, y }
    snapTarget: null, // snapped joint or member
    itemType: 'freehand'
  });

  // Currently transforming/rotating member on canvas (direct on-canvas drag/rotate)
  const [transformingMemberId, setTransformingMemberId] = useState(null);

  // Modal State for Precision Input
  const [modalState, setModalState] = useState({
    isOpen: false,
    itemType: null, // 'horizontal', 'vertical', 'right-leaned', 'left-leaned', 'force'
    startJoint: null,
    dropWorldPos: { x: 0, y: 0 }
  });

  // Pan & Zoom
  const [viewTransform, setViewTransform] = useState({
    panX: 450,
    panY: 380,
    zoom: 65 // pixels per meter
  });

  // Synchronize joint labels after additions or deletions
  const recomputeLabels = useCallback((currentJoints, currentMembers) => {
    const updatedJoints = currentJoints.map((j, idx) => ({
      ...j,
      label: getJointLabel(idx)
    }));

    const labelMap = new Map(updatedJoints.map(j => [j.id, j.label]));

    const updatedMembers = currentMembers.map(m => {
      const l1 = labelMap.get(m.startJointId) || '?';
      const l2 = labelMap.get(m.endJointId) || '?';
      const sorted = [l1, l2].sort();
      return {
        ...m,
        label: `F_${sorted[0]}${sorted[1]}`,
        queryId: `F_${sorted[0].toLowerCase()}${sorted[1].toLowerCase()}`
      };
    });

    return { updatedJoints, updatedMembers };
  }, []);

  // Invalidate analysis when geometry changes
  const invalidateAnalysis = useCallback(() => {
    setAnalysisResult(null);
  }, []);

  // Add Joint
  const addJoint = useCallback((x, y) => {
    const newJointId = `j_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newJoint = {
      id: newJointId,
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      label: getJointLabel(jointsRef.current.length)
    };
    const nextJoints = [...jointsRef.current, newJoint];
    setJoints(nextJoints);
    invalidateAnalysis();
    pushHistorySnapshot(nextJoints, membersRef.current, supportsRef.current, forcesRef.current);
    return newJointId;
  }, [invalidateAnalysis, pushHistorySnapshot]);

  // Add Member between two joints
  const addMember = useCallback((startJointId, endJointId, meta = {}) => {
    if (startJointId === endJointId) return null;

    const exists = membersRef.current.some(
      m => (m.startJointId === startJointId && m.endJointId === endJointId) ||
           (m.startJointId === endJointId && m.endJointId === startJointId)
    );
    if (exists) return null;

    const id = `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const addedMember = {
      id,
      startJointId,
      endJointId,
      type: meta.type || 'standard',
      length: meta.length || 0,
      angle: meta.angle || 0,
      label: meta.label || 'F',
      queryId: meta.queryId || ''
    };
    const nextMembers = [...membersRef.current, addedMember];
    setMembers(nextMembers);
    invalidateAnalysis();
    pushHistorySnapshot(jointsRef.current, nextMembers, supportsRef.current, forcesRef.current);
    return addedMember;
  }, [invalidateAnalysis, pushHistorySnapshot]);

  // Add or replace support at joint
  const addSupport = useCallback((jointId, type, orientation = 'horizontal') => {
    const filtered = supportsRef.current.filter(s => s.jointId !== jointId);
    const newSupport = {
      id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      jointId,
      type, // 'pin' | 'roller' | 'wall'
      orientation // 'horizontal' | 'vertical'
    };
    const nextSupports = [...filtered, newSupport];
    setSupports(nextSupports);
    invalidateAnalysis();
    pushHistorySnapshot(jointsRef.current, membersRef.current, nextSupports, forcesRef.current);
  }, [invalidateAnalysis, pushHistorySnapshot]);

  // Update orientation of an existing support (e.g. horizontal vs vertical roller)
  const updateSupportOrientation = useCallback((supportId, orientation) => {
    const nextSupports = supportsRef.current.map(s => s.id === supportId ? { ...s, orientation } : s);
    setSupports(nextSupports);
    invalidateAnalysis();
    pushHistorySnapshot(jointsRef.current, membersRef.current, nextSupports, forcesRef.current);
  }, [invalidateAnalysis, pushHistorySnapshot]);

  // Add external force at joint (supports known and unknown target loads)
  const addForce = useCallback((jointId, magnitude, angle, isUnknown = false, targetLabel = 'P') => {
    const ang = ((parseFloat(angle) || 0) % 360 + 360) % 360;
    const mag = isUnknown ? 0 : (parseFloat(magnitude) || 0);
    const { fx, fy } = calculateForceComponents(isUnknown ? 1 : mag, ang);
    const newForce = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      jointId,
      magnitude: mag,
      angle: ang,
      fx: isUnknown ? 0 : fx,
      fy: isUnknown ? 0 : fy,
      dirX: fx,
      dirY: fy,
      isUnknown: !!isUnknown,
      targetLabel: targetLabel || 'P'
    };
    const nextForces = [...forcesRef.current, newForce];
    setForces(nextForces);
    invalidateAnalysis();
    pushHistorySnapshot(jointsRef.current, membersRef.current, supportsRef.current, nextForces);
    return newForce;
  }, [invalidateAnalysis, pushHistorySnapshot]);

  // Update existing force magnitude, angle, or unknown target status
  const updateForce = useCallback((forceId, { magnitude, angle, isUnknown, targetLabel }) => {
    const nextForces = forcesRef.current.map(f => {
      if (f.id === forceId) {
        const unk = isUnknown !== undefined ? !!isUnknown : !!f.isUnknown;
        const ang = angle !== undefined ? (((parseFloat(angle) || 0) % 360 + 360) % 360) : f.angle;
        const mag = unk ? 0 : (magnitude !== undefined ? (Math.abs(parseFloat(magnitude)) || 0) : f.magnitude);
        const { fx, fy } = calculateForceComponents(unk ? 1 : mag, ang);
        return {
          ...f,
          magnitude: mag,
          angle: ang,
          fx: unk ? 0 : fx,
          fy: unk ? 0 : fy,
          dirX: fx,
          dirY: fy,
          isUnknown: unk,
          targetLabel: targetLabel || f.targetLabel || 'P'
        };
      }
      return f;
    });
    setForces(nextForces);
    invalidateAnalysis();
    pushHistorySnapshot(jointsRef.current, membersRef.current, supportsRef.current, nextForces);
  }, [invalidateAnalysis, pushHistorySnapshot]);

  // Update existing member geometry (length & angle of elevation)
  const updateMember = useCallback((memberId, { length, angle, verticalSlope = 'up' }) => {
    setMembers(prevMembers => {
      const member = prevMembers.find(m => m.id === memberId);
      if (!member) return prevMembers;

      setJoints(prevJoints => {
        const startJoint = prevJoints.find(j => j.id === member.startJointId);
        const endJoint = prevJoints.find(j => j.id === member.endJointId);
        if (!startJoint || !endJoint) return prevJoints;

        const L = Math.max(0.1, Math.abs(parseFloat(length)) || distance(startJoint, endJoint));
        const thetaDeg = Math.min(90, Math.max(0, isNaN(parseFloat(angle)) ? 45 : Math.abs(parseFloat(angle))));
        const rad = (thetaDeg * Math.PI) / 180;
        const ySign = verticalSlope === 'down' ? -1 : 1;

        let newEndX = endJoint.x;
        let newEndY = endJoint.y;

        if (thetaDeg === 0 || member.type === 'horizontal') {
          const sign = endJoint.x < startJoint.x ? -1 : 1;
          newEndX = startJoint.x + sign * L;
          newEndY = startJoint.y;
        } else if (thetaDeg === 90 || member.type === 'vertical') {
          const sign = endJoint.y < startJoint.y ? -1 : 1;
          newEndX = startJoint.x;
          newEndY = startJoint.y + (verticalSlope === 'down' ? -1 : (sign || 1)) * L;
        } else if (member.type === 'left-leaned') {
          newEndX = startJoint.x - L * Math.cos(rad);
          newEndY = startJoint.y + ySign * L * Math.sin(rad);
        } else {
          // right-leaned or standard
          newEndX = startJoint.x + L * Math.cos(rad);
          newEndY = startJoint.y + ySign * L * Math.sin(rad);
        }

        return prevJoints.map(j => {
          if (j.id === endJoint.id) {
            return {
              ...j,
              x: Math.round(newEndX * 1000) / 1000,
              y: Math.round(newEndY * 1000) / 1000
            };
          }
          return j;
        });
      });

      return prevMembers.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            length: parseFloat(length) || m.length,
            angle: parseFloat(angle) || m.angle
          };
        }
        return m;
      });
    });

    invalidateAnalysis();
  }, [invalidateAnalysis]);

  // Update joint coordinates
  const updateJoint = useCallback((jointId, { x, y }) => {
    setJoints(prev => prev.map(j => {
      if (j.id === jointId) {
        return {
          ...j,
          x: Math.round((parseFloat(x) || 0) * 1000) / 1000,
          y: Math.round((parseFloat(y) || 0) * 1000) / 1000
        };
      }
      return j;
    }));
    invalidateAnalysis();
  }, [invalidateAnalysis]);

  // Merge source joint into target joint (remaps all members, supports, forces)
  const mergeJoints = useCallback((sourceJointId, targetJointId) => {
    if (!sourceJointId || !targetJointId || sourceJointId === targetJointId) return;

    setJoints(prevJoints => prevJoints.filter(j => j.id !== sourceJointId));

    setMembers(prevMembers => {
      const updated = prevMembers.map(m => ({
        ...m,
        startJointId: m.startJointId === sourceJointId ? targetJointId : m.startJointId,
        endJointId: m.endJointId === sourceJointId ? targetJointId : m.endJointId
      })).filter(m => m.startJointId !== m.endJointId);

      // Deduplicate members
      const seen = new Set();
      return updated.filter(m => {
        const key = [m.startJointId, m.endJointId].sort().join('--');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    setSupports(prevSupports => {
      const updated = prevSupports.map(s => s.jointId === sourceJointId ? { ...s, jointId: targetJointId } : s);
      const seen = new Set();
      return updated.filter(s => {
        const key = `${s.jointId}_${s.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    setForces(prevForces => prevForces.map(f => f.jointId === sourceJointId ? { ...f, jointId: targetJointId } : f));
    setSelectedItem(prev => (prev?.id === sourceJointId ? { ...prev, id: targetJointId } : prev));
    invalidateAnalysis();
  }, [invalidateAnalysis]);

  // Sweep and consolidate all coincident joints within tolerance (default 0.25m)
  const mergeCoincidentJoints = useCallback((tolerance = 0.25) => {
    setJoints(prevJoints => {
      let curM, curS, curF;
      setMembers(m => { curM = m; return m; });
      setSupports(s => { curS = s; return s; });
      setForces(f => { curF = f; return f; });

      const { jList, mList, sList, fList, mergedAny } = consolidateJoints(
        prevJoints, curM || [], curS || [], curF || [], tolerance
      );

      if (mergedAny) {
        const { updatedJoints, updatedMembers } = recomputeLabels(jList, mList);
        setMembers(updatedMembers);
        setSupports(sList);
        setForces(fList);
        invalidateAnalysis();
        return updatedJoints;
      }
      return prevJoints;
    });
  }, [recomputeLabels, invalidateAnalysis]);

  // Add Member directly from drop onto canvas (enters interactive on-canvas rotate/drag mode)
  const addDirectMember = useCallback((itemType, startJoint, dropWorldPos) => {
    let currentJoints = [...joints];
    let currentMembers = [...members];
    let currentSupports = [...supports];
    let currentForces = [...forces];

    let originJoint = startJoint;

    // 1. Determine origin joint
    if (!originJoint) {
      const snapOrigin = findSnapTarget(dropWorldPos, currentJoints, currentMembers, {
        jointThreshold: 0.45,
        memberThreshold: 0.35
      });

      if (snapOrigin && snapOrigin.type === 'joint') {
        originJoint = snapOrigin.joint;
      } else if (snapOrigin && snapOrigin.type === 'member') {
        const host = snapOrigin.member;
        const newJointId = `j_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        originJoint = {
          id: newJointId,
          x: snapOrigin.x,
          y: snapOrigin.y,
          label: getJointLabel(currentJoints.length)
        };
        currentJoints.push(originJoint);

        const m1 = {
          id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          startJointId: host.startJointId,
          endJointId: newJointId,
          type: host.type || 'standard'
        };
        const m2 = {
          id: `m_${Date.now() + 1}_${Math.random().toString(36).substring(2, 6)}`,
          startJointId: newJointId,
          endJointId: host.endJointId,
          type: host.type || 'standard'
        };
        currentMembers = currentMembers.filter(m => m.id !== host.id).concat([m1, m2]);
      } else {
        const newId = `j_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        originJoint = {
          id: newId,
          x: Math.round(dropWorldPos.x * 10) / 10,
          y: Math.round(dropWorldPos.y * 10) / 10,
          label: getJointLabel(currentJoints.length)
        };
        currentJoints.push(originJoint);
      }
    }

    // 2. Determine end point
    let length = 3.0;
    let angle = 0;
    if (itemType === 'vertical') {
      angle = 90;
    } else if (itemType === 'right-leaned') {
      length = 3.5;
      angle = 45;
    } else if (itemType === 'left-leaned') {
      length = 3.5;
      angle = 135;
    }

    const rad = (angle * Math.PI) / 180;
    const rawEndX = Math.round((originJoint.x + length * Math.cos(rad)) * 100) / 100;
    const rawEndY = Math.round((originJoint.y + length * Math.sin(rad)) * 100) / 100;

    let endJoint = null;
    const snapEnd = findSnapTarget({ x: rawEndX, y: rawEndY }, currentJoints, currentMembers, {
      excludeJointIds: [originJoint.id],
      jointThreshold: 0.45,
      memberThreshold: 0.35
    });

    if (snapEnd && snapEnd.type === 'joint') {
      endJoint = snapEnd.joint;
    } else if (snapEnd && snapEnd.type === 'member') {
      const host = snapEnd.member;
      const newJointId = `j_${Date.now() + 1}_${Math.random().toString(36).substring(2, 6)}`;
      endJoint = {
        id: newJointId,
        x: snapEnd.x,
        y: snapEnd.y,
        label: getJointLabel(currentJoints.length)
      };
      currentJoints.push(endJoint);

      const m1 = {
        id: `m_${Date.now() + 2}_${Math.random().toString(36).substring(2, 6)}`,
        startJointId: host.startJointId,
        endJointId: newJointId,
        type: host.type || 'standard'
      };
      const m2 = {
        id: `m_${Date.now() + 3}_${Math.random().toString(36).substring(2, 6)}`,
        startJointId: newJointId,
        endJointId: host.endJointId,
        type: host.type || 'standard'
      };
      currentMembers = currentMembers.filter(m => m.id !== host.id).concat([m1, m2]);
    } else {
      const endJointId = `j_${Date.now() + 1}_${Math.random().toString(36).substring(2, 6)}`;
      endJoint = {
        id: endJointId,
        x: rawEndX,
        y: rawEndY,
        label: getJointLabel(currentJoints.length)
      };
      currentJoints.push(endJoint);
    }

    const memberId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMember = {
      id: memberId,
      startJointId: originJoint.id,
      endJointId: endJoint.id,
      type: itemType,
      length,
      angle,
      label: 'F',
      queryId: ''
    };
    currentMembers.push(newMember);

    // Consolidate coincident joints and update labels
    const { jList, mList, sList, fList } = consolidateJoints(
      currentJoints, currentMembers, currentSupports, currentForces, 0.25
    );
    const { updatedJoints, updatedMembers } = recomputeLabels(jList, mList);

    setJoints(updatedJoints);
    setMembers(updatedMembers);
    setSupports(sList);
    setForces(fList);

    setTransformingMemberId(memberId);
    setSelectedItem({ type: 'member', id: memberId });
    setSelectedMemberId(memberId);
    invalidateAnalysis();
    pushHistorySnapshot(updatedJoints, updatedMembers, sList, fList);
    return memberId;
  }, [joints, members, supports, forces, recomputeLabels, invalidateAnalysis, pushHistorySnapshot]);

  // Update endpoint coordinates live while dragging handle
  const updateMemberEndpoint = useCallback((memberId, newEndX, newEndY) => {
    setMembers(prevMembers => {
      const member = prevMembers.find(m => m.id === memberId);
      if (!member) return prevMembers;

      setJoints(prevJoints => {
        return prevJoints.map(j => {
          if (j.id === member.endJointId) {
            return {
              ...j,
              x: Math.round(newEndX * 100) / 100,
              y: Math.round(newEndY * 100) / 100
            };
          }
          return j;
        });
      });

      return prevMembers;
    });
    invalidateAnalysis();
  }, [invalidateAnalysis]);

  // Finalize transform/rotation of member (snaps/merges endpoints into existing joints or splits members)
  const commitMemberTransform = useCallback((memberId) => {
    setMembers(prevMembers => {
      const member = prevMembers.find(m => m.id === memberId);
      if (!member) return prevMembers;

      setJoints(prevJoints => {
        const movingJoint = prevJoints.find(j => j.id === member.endJointId);
        if (!movingJoint) return prevJoints;

        // Check if movingJoint is near another existing joint
        const targetJoint = prevJoints.find(
          j => j.id !== movingJoint.id && j.id !== member.startJointId && distance(j, movingJoint) <= 0.45
        );

        let finalJoints = prevJoints;
        let finalMembers = prevMembers;
        let finalSupports = [...supports];
        let finalForces = [...forces];

        if (targetJoint) {
          // Point member directly to targetJoint
          finalMembers = prevMembers.map(m => {
            if (m.id === memberId) {
              return { ...m, endJointId: targetJoint.id };
            }
            return m;
          });

          // Check if movingJoint is used by any other members
          const otherUses = finalMembers.some(m => m.id !== memberId && (m.startJointId === movingJoint.id || m.endJointId === movingJoint.id));
          if (!otherUses) {
            finalJoints = prevJoints.filter(j => j.id !== movingJoint.id);
            finalSupports = finalSupports.map(s => s.jointId === movingJoint.id ? { ...s, jointId: targetJoint.id } : s);
            finalForces = finalForces.map(f => f.jointId === movingJoint.id ? { ...f, jointId: targetJoint.id } : f);
          }
        } else {
          // Check if movingJoint snaps onto any member span
          const snapTarget = findSnapTarget(movingJoint, prevJoints, prevMembers, {
            excludeJointIds: [movingJoint.id, member.startJointId],
            excludeMemberIds: [memberId],
            jointThreshold: 0.45,
            memberThreshold: 0.35
          });

          if (snapTarget && snapTarget.type === 'member') {
            const hostMember = snapTarget.member;
            finalJoints = prevJoints.map(j => j.id === movingJoint.id ? { ...j, x: snapTarget.x, y: snapTarget.y } : j);

            const m1 = {
              id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              startJointId: hostMember.startJointId,
              endJointId: movingJoint.id,
              type: hostMember.type || 'standard'
            };
            const m2 = {
              id: `m_${Date.now() + 1}_${Math.random().toString(36).substring(2, 6)}`,
              startJointId: movingJoint.id,
              endJointId: hostMember.endJointId,
              type: hostMember.type || 'standard'
            };

            finalMembers = prevMembers.filter(m => m.id !== hostMember.id).concat([m1, m2]);
          }
        }

        // Consolidate coincident joints
        const { jList, mList, sList, fList } = consolidateJoints(finalJoints, finalMembers, finalSupports, finalForces, 0.25);
        const { updatedJoints, updatedMembers } = recomputeLabels(jList, mList);

        setSupports(sList);
        setForces(fList);
        setMembers(updatedMembers);
        invalidateAnalysis();
        pushHistorySnapshot(updatedJoints, updatedMembers, sList, fList);
        return updatedJoints;
      });

      return prevMembers;
    });

    setTransformingMemberId(null);
  }, [supports, forces, recomputeLabels, invalidateAnalysis, pushHistorySnapshot]);

  // Start free-hand member placement: fixes start joint, then cursor moves free end
  const startFreeHandPlacement = useCallback((itemType, startJoint, dropWorldPos) => {
    let currentJoints = [...joints];
    let currentMembers = [...members];

    let originJoint = startJoint;

    if (!originJoint) {
      const snapOrigin = findSnapTarget(dropWorldPos, currentJoints, currentMembers, {
        jointThreshold: 0.45,
        memberThreshold: 0.35
      });

      if (snapOrigin && snapOrigin.type === 'joint') {
        originJoint = snapOrigin.joint;
      } else if (snapOrigin && snapOrigin.type === 'member') {
        const host = snapOrigin.member;
        const newJointId = `j_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        originJoint = {
          id: newJointId,
          x: snapOrigin.x,
          y: snapOrigin.y,
          label: getJointLabel(currentJoints.length)
        };
        currentJoints.push(originJoint);

        const m1 = {
          id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          startJointId: host.startJointId,
          endJointId: newJointId,
          type: host.type || 'standard'
        };
        const m2 = {
          id: `m_${Date.now() + 1}_${Math.random().toString(36).substring(2, 6)}`,
          startJointId: newJointId,
          endJointId: host.endJointId,
          type: host.type || 'standard'
        };
        currentMembers = currentMembers.filter(m => m.id !== host.id).concat([m1, m2]);
        const { updatedJoints, updatedMembers } = recomputeLabels(currentJoints, currentMembers);
        setJoints(updatedJoints);
        setMembers(updatedMembers);
        originJoint = updatedJoints.find(j => j.id === newJointId) || originJoint;
      } else {
        const newId = `j_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        originJoint = {
          id: newId,
          x: Math.round(dropWorldPos.x * 10) / 10,
          y: Math.round(dropWorldPos.y * 10) / 10,
          label: getJointLabel(currentJoints.length)
        };
        currentJoints.push(originJoint);
        const { updatedJoints, updatedMembers } = recomputeLabels(currentJoints, currentMembers);
        setJoints(updatedJoints);
        setMembers(updatedMembers);
        originJoint = updatedJoints.find(j => j.id === newId) || originJoint;
      }
    }

    setFreeHandState({
      isActive: true,
      startJoint: originJoint,
      currentPoint: { x: originJoint.x, y: originJoint.y },
      snapTarget: null,
      itemType: itemType || 'freehand'
    });
    setSelectedItem({ type: 'joint', id: originJoint.id });
    invalidateAnalysis();
    return originJoint;
  }, [joints, members, recomputeLabels, invalidateAnalysis]);

  // Update member cursor live during mouse movements (with strict angle constraints for horizontal, vertical, leaned)
  const updateFreeHandCursor = useCallback((mouseWorldPos, snapTarget = null) => {
    setFreeHandState(prev => {
      if (!prev.isActive || !prev.startJoint) return prev;
      const rawPos = snapTarget ? { x: snapTarget.x, y: snapTarget.y } : mouseWorldPos;
      const constrainedPos = applyMemberAngleConstraint(prev.itemType, prev.startJoint, rawPos);
      return {
        ...prev,
        currentPoint: constrainedPos,
        snapTarget
      };
    });
  }, []);

  // Commit member placement: fixes member at current angle and length magnitude
  const commitFreeHandPlacement = useCallback((endWorldPos, snapTarget = null) => {
    setFreeHandState(prev => {
      if (!prev.isActive || !prev.startJoint) {
        return { isActive: false, startJoint: null, currentPoint: null, snapTarget: null, itemType: 'freehand' };
      }

      const originJoint = prev.startJoint;
      const rawEndPos = snapTarget ? { x: snapTarget.x, y: snapTarget.y } : endWorldPos;
      const constrainedPos = applyMemberAngleConstraint(prev.itemType, originJoint, rawEndPos);

      let finalEndX = constrainedPos.x;
      let finalEndY = constrainedPos.y;

      let currentJoints = [...joints];
      let currentMembers = [...members];
      let currentSupports = [...supports];
      let currentForces = [...forces];

      let targetJoint = null;

      if (snapTarget && snapTarget.type === 'joint') {
        targetJoint = currentJoints.find(j => j.id === snapTarget.joint.id) || snapTarget.joint;
      } else if (snapTarget && snapTarget.type === 'member') {
        const host = snapTarget.member;
        const newJointId = `j_${Date.now() + 1}_${Math.random().toString(36).substring(2, 6)}`;
        targetJoint = {
          id: newJointId,
          x: snapTarget.x,
          y: snapTarget.y,
          label: getJointLabel(currentJoints.length)
        };
        currentJoints.push(targetJoint);

        const m1 = {
          id: `m_${Date.now() + 2}_${Math.random().toString(36).substring(2, 6)}`,
          startJointId: host.startJointId,
          endJointId: newJointId,
          type: host.type || 'standard'
        };
        const m2 = {
          id: `m_${Date.now() + 3}_${Math.random().toString(36).substring(2, 6)}`,
          startJointId: newJointId,
          endJointId: host.endJointId,
          type: host.type || 'standard'
        };
        currentMembers = currentMembers.filter(m => m.id !== host.id).concat([m1, m2]);
      } else {
        const newEndId = `j_${Date.now() + 1}_${Math.random().toString(36).substring(2, 6)}`;
        targetJoint = {
          id: newEndId,
          x: Math.round(finalEndX * 10) / 10,
          y: Math.round(finalEndY * 10) / 10,
          label: getJointLabel(currentJoints.length)
        };
        currentJoints.push(targetJoint);
      }

      if (originJoint.id !== targetJoint.id) {
        const memberId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const dx = targetJoint.x - originJoint.x;
        const dy = targetJoint.y - originJoint.y;
        const len = Math.hypot(dx, dy);
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;

        const newMember = {
          id: memberId,
          startJointId: originJoint.id,
          endJointId: targetJoint.id,
          type: prev.itemType || 'freehand',
          length: Math.round(len * 100) / 100,
          angle: Math.round(angle * 10) / 10,
          label: 'F',
          queryId: ''
        };
        currentMembers.push(newMember);

        const { jList, mList, sList, fList } = consolidateJoints(
          currentJoints, currentMembers, currentSupports, currentForces, 0.25
        );
        const { updatedJoints, updatedMembers } = recomputeLabels(jList, mList);

        setJoints(updatedJoints);
        setMembers(updatedMembers);
        setSupports(sList);
        setForces(fList);
        setSelectedItem({ type: 'member', id: memberId });
        setSelectedMemberId(memberId);
        invalidateAnalysis();
        pushHistorySnapshot(updatedJoints, updatedMembers, sList, fList);
      }

      return { isActive: false, startJoint: null, currentPoint: null, snapTarget: null, itemType: 'freehand' };
    });
  }, [joints, members, supports, forces, recomputeLabels, invalidateAnalysis, pushHistorySnapshot]);

  // Cancel free-hand member placement
  const cancelFreeHandPlacement = useCallback(() => {
    setFreeHandState(prev => {
      if (!prev.isActive) return prev;
      if (prev.startJoint) {
        setMembers(curM => {
          const used = curM.some(m => m.startJointId === prev.startJoint.id || m.endJointId === prev.startJoint.id);
          if (!used) {
            setJoints(curJ => curJ.filter(j => j.id !== prev.startJoint.id));
          }
          return curM;
        });
      }
      return { isActive: false, startJoint: null, currentPoint: null, snapTarget: null, itemType: 'freehand' };
    });
  }, []);

  // Delete Entity with History Snapshot
  const deleteItem = useCallback((type, id) => {
    let nextJoints = joints;
    let nextMembers = members;
    let nextSupports = supports;
    let nextForces = forces;

    if (type === 'joint') {
      nextJoints = joints.filter(j => j.id !== id);
      nextMembers = members.filter(m => m.startJointId !== id && m.endJointId !== id);
      nextSupports = supports.filter(s => s.jointId !== id);
      nextForces = forces.filter(f => f.jointId !== id);
    } else if (type === 'member') {
      nextMembers = members.filter(m => m.id !== id);
    } else if (type === 'support') {
      nextSupports = supports.filter(s => s.id !== id);
    } else if (type === 'force') {
      nextForces = forces.filter(f => f.id !== id);
    }

    const { updatedJoints, updatedMembers } = recomputeLabels(nextJoints, nextMembers);
    setJoints(updatedJoints);
    setMembers(updatedMembers);
    setSupports(nextSupports);
    setForces(nextForces);

    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    if (selectedMemberId === id) {
      setSelectedMemberId(null);
    }
    invalidateAnalysis();
    pushHistorySnapshot(updatedJoints, updatedMembers, nextSupports, nextForces);
  }, [joints, members, supports, forces, selectedItem, selectedMemberId, recomputeLabels, invalidateAnalysis, pushHistorySnapshot]);

  // Batch Sweep Erase: Sweep across canvas while holding left click
  const sweepErase = useCallback((jointIdsToDelete = [], memberIdsToDelete = [], supportIdsToDelete = [], forceIdsToDelete = [], recordHistory = true) => {
    if (jointIdsToDelete.length === 0 && memberIdsToDelete.length === 0 && supportIdsToDelete.length === 0 && forceIdsToDelete.length === 0) {
      return;
    }

    const jSet = new Set(jointIdsToDelete);
    const mSet = new Set(memberIdsToDelete);
    const sSet = new Set(supportIdsToDelete);
    const fSet = new Set(forceIdsToDelete);

    let nextJoints = jointsRef.current;
    let nextMembers = membersRef.current;
    let nextSupports = supportsRef.current;
    let nextForces = forcesRef.current;

    if (jSet.size > 0) {
      nextJoints = nextJoints.filter(j => !jSet.has(j.id));
      nextMembers = nextMembers.filter(m => !jSet.has(m.startJointId) && !jSet.has(m.endJointId) && !mSet.has(m.id));
      nextSupports = nextSupports.filter(s => !jSet.has(s.jointId) && !sSet.has(s.id));
      nextForces = nextForces.filter(f => !jSet.has(f.jointId) && !fSet.has(f.id));
    } else {
      if (mSet.size > 0) nextMembers = nextMembers.filter(m => !mSet.has(m.id));
      if (sSet.size > 0) nextSupports = nextSupports.filter(s => !sSet.has(s.id));
      if (fSet.size > 0) nextForces = nextForces.filter(f => !fSet.has(f.id));
    }

    const { updatedJoints, updatedMembers } = recomputeLabels(nextJoints, nextMembers);
    setJoints(updatedJoints);
    setMembers(updatedMembers);
    setSupports(nextSupports);
    setForces(nextForces);
    setSelectedItem(null);
    setSelectedMemberId(null);
    invalidateAnalysis();
    if (recordHistory) {
      pushHistorySnapshot(updatedJoints, updatedMembers, nextSupports, nextForces);
    }
  }, [recomputeLabels, invalidateAnalysis, pushHistorySnapshot]);

  // Commit history snapshot when user finishes an eraser sweep stroke
  const commitSweepStroke = useCallback(() => {
    pushHistorySnapshot(jointsRef.current, membersRef.current, supportsRef.current, forcesRef.current);
  }, [pushHistorySnapshot]);

  // Clear entire canvas
  const clearCanvas = useCallback(() => {
    setJoints([]);
    setMembers([]);
    setSupports([]);
    setForces([]);
    setSelectedItem(null);
    setSelectedMemberId(null);
    setAnalysisResult(null);
    pushHistorySnapshot([], [], [], []);
  }, [pushHistorySnapshot]);

  // Update member/joint labels when structure changes
  useEffect(() => {
    const { updatedJoints, updatedMembers } = recomputeLabels(joints, members);
    // Only update if changed
    const jointsChanged = updatedJoints.some((j, i) => j.label !== joints[i]?.label);
    const membersChanged = updatedMembers.some((m, i) => m.label !== members[i]?.label);

    if (jointsChanged) setJoints(updatedJoints);
    if (membersChanged) setMembers(updatedMembers);
  }, [joints.length, members.length, recomputeLabels]);

  // Execute structural analysis (accepts optional overrideMode to force immediate solve under a specific mode)
  const runAnalysis = useCallback((overrideMode) => {
    const activeMode = (overrideMode !== undefined && typeof overrideMode === 'string')
      ? overrideMode
      : structureMode;

    // 1. Forcefully consolidate any coincident joints before analysis
    const { jList, mList, sList, fList, mergedAny } = consolidateJoints(
      joints, members, supports, forces, 0.25
    );

    let activeJoints = joints;
    let activeMembers = members;
    let activeSupports = supports;
    let activeForces = forces;

    if (mergedAny) {
      const { updatedJoints, updatedMembers } = recomputeLabels(jList, mList);
      activeJoints = updatedJoints;
      activeMembers = updatedMembers;
      activeSupports = sList;
      activeForces = fList;
      setJoints(updatedJoints);
      setMembers(updatedMembers);
      setSupports(sList);
      setForces(fList);
    }

    const det = checkDeterminacy({
      joints: activeJoints,
      members: activeMembers,
      supports: activeSupports,
      forces: activeForces,
      structureMode: activeMode,
      userType: activeMode
    });

    if (!det.isDeterminate) {
      setAnalysisResult({
        determinacy: det,
        classification: det.classification,
        solved: false,
        solverResult: null,
        error: det.message
      });
      return;
    }

    // Solve via unified structural engine (Truss, Frame, Machine)
    const solver = solveStructure({
      joints: activeJoints,
      members: activeMembers,
      supports: activeSupports,
      forces: activeForces,
      structureMode: activeMode,
      userType: activeMode,
      classification: det.classification
    });

    if (!solver.success) {
      setAnalysisResult({
        determinacy: {
          ...det,
          category: 'UNSTABLE',
          status: 'Unstable (Geometric Mechanism)',
          isDeterminate: false,
          message: solver.error || 'System matrix is singular; geometry forms an internal mechanism.'
        },
        classification: det.classification,
        solved: false,
        solverResult: null,
        error: solver.error
      });
      return;
    }

    setAnalysisResult({
      determinacy: det,
      classification: det.classification,
      solved: true,
      solverResult: solver,
      error: null
    });

    if (solver.memberResults?.length > 0 && !selectedMemberId) {
      setSelectedMemberId(solver.memberResults[0].id);
    }
  }, [joints, members, supports, forces, structureMode, selectedMemberId, recomputeLabels]);

  // Update structure mode and immediately re-solve if analysis was active
  const updateStructureMode = useCallback((newMode) => {
    setStructureMode(newMode);
    // If analysis was already executed (or is solved), immediately re-run analysis in the new mode!
    if (analysisResult !== null && joints.length > 0) {
      runAnalysis(newMode);
    }
  }, [analysisResult, joints.length, runAnalysis]);

  // Load Presets
  const loadPreset = useCallback((presetName) => {
    clearCanvas();

    if (presetName === 'triangle') {
      // Simple 3-bar equilateral-ish triangle
      const jA = { id: 'j_A', x: 0, y: 0, label: 'A' };
      const jB = { id: 'j_B', x: 4, y: 0, label: 'B' };
      const jC = { id: 'j_C', x: 2, y: 3.464, label: 'C' };

      const m1 = { id: 'm_AB', startJointId: 'j_A', endJointId: 'j_B', label: 'F_AB', queryId: 'F_ab' };
      const m2 = { id: 'm_BC', startJointId: 'j_B', endJointId: 'j_C', label: 'F_BC', queryId: 'F_bc' };
      const m3 = { id: 'm_CA', startJointId: 'j_C', endJointId: 'j_A', label: 'F_AC', queryId: 'F_ac' };

      const s1 = { id: 's_A', jointId: 'j_A', type: 'pin', orientation: 'horizontal' };
      const s2 = { id: 's_B', jointId: 'j_B', type: 'roller', orientation: 'horizontal' };

      const { fx, fy } = calculateForceComponents(10, 270);
      const f1 = { id: 'f_C', jointId: 'j_C', magnitude: 10, angle: 270, fx, fy };

      setJoints([jA, jB, jC]);
      setMembers([m1, m2, m3]);
      setSupports([s1, s2]);
      setForces([f1]);
      setViewTransform({ panX: 460, panY: 420, zoom: 70 });
    } else if (presetName === 'warren') {
      // 5-Joint Warren Truss
      const jA = { id: 'j_A', x: 0, y: 0, label: 'A' };
      const jB = { id: 'j_B', x: 3, y: 0, label: 'B' };
      const jC = { id: 'j_C', x: 6, y: 0, label: 'C' };
      const jD = { id: 'j_D', x: 1.5, y: 2.598, label: 'D' };
      const jE = { id: 'j_E', x: 4.5, y: 2.598, label: 'E' };

      const mList = [
        { id: 'm_AB', startJointId: 'j_A', endJointId: 'j_B', label: 'F_AB' },
        { id: 'm_BC', startJointId: 'j_B', endJointId: 'j_C', label: 'F_BC' },
        { id: 'm_DE', startJointId: 'j_D', endJointId: 'j_E', label: 'F_DE' },
        { id: 'm_AD', startJointId: 'j_A', endJointId: 'j_D', label: 'F_AD' },
        { id: 'm_DB', startJointId: 'j_D', endJointId: 'j_B', label: 'F_BD' },
        { id: 'm_BE', startJointId: 'j_B', endJointId: 'j_E', label: 'F_BE' },
        { id: 'm_EC', startJointId: 'j_E', endJointId: 'j_C', label: 'F_CE' }
      ];

      const s1 = { id: 's_A', jointId: 'j_A', type: 'pin', orientation: 'horizontal' };
      const s2 = { id: 's_C', jointId: 'j_C', type: 'roller', orientation: 'horizontal' };

      const { fx, fy } = calculateForceComponents(20, 270);
      const f1 = { id: 'f_B', jointId: 'j_B', magnitude: 20, angle: 270, fx, fy };

      setJoints([jA, jB, jC, jD, jE]);
      setMembers(mList);
      setSupports([s1, s2]);
      setForces([f1]);
      setViewTransform({ panX: 380, panY: 420, zoom: 60 });
    } else if (presetName === 'pratt') {
      // Pratt Truss with Zero-Force member demonstration
      const jA = { id: 'j_A', x: 0, y: 0, label: 'A' };
      const jB = { id: 'j_B', x: 3, y: 0, label: 'B' };
      const jC = { id: 'j_C', x: 6, y: 0, label: 'C' };
      const jD = { id: 'j_D', x: 0, y: 3, label: 'D' };
      const jE = { id: 'j_E', x: 3, y: 3, label: 'E' };
      const jF = { id: 'j_F', x: 6, y: 3, label: 'F' };

      const mList = [
        { id: 'm_AB', startJointId: 'j_A', endJointId: 'j_B', label: 'F_AB' },
        { id: 'm_BC', startJointId: 'j_B', endJointId: 'j_C', label: 'F_BC' },
        { id: 'm_DE', startJointId: 'j_D', endJointId: 'j_E', label: 'F_DE' },
        { id: 'm_EF', startJointId: 'j_E', endJointId: 'j_F', label: 'F_EF' },
        { id: 'm_AD', startJointId: 'j_A', endJointId: 'j_D', label: 'F_AD' },
        { id: 'm_BE', startJointId: 'j_B', endJointId: 'j_E', label: 'F_BE' },
        { id: 'm_CF', startJointId: 'j_C', endJointId: 'j_F', label: 'F_CF' },
        { id: 'm_DB', startJointId: 'j_D', endJointId: 'j_B', label: 'F_BD' },
        { id: 'm_BF', startJointId: 'j_B', endJointId: 'j_F', label: 'F_BF' }
      ];

      const s1 = { id: 's_A', jointId: 'j_A', type: 'pin', orientation: 'horizontal' };
      const s2 = { id: 's_C', jointId: 'j_C', type: 'roller', orientation: 'horizontal' };

      const { fx, fy } = calculateForceComponents(15, 270);
      const f1 = { id: 'f_E', jointId: 'j_E', magnitude: 15, angle: 270, fx, fy };

      setJoints([jA, jB, jC, jD, jE, jF]);
      setMembers(mList);
      setSupports([s1, s2]);
      setForces([f1]);
      setStructureMode('truss');
      setViewTransform({ panX: 380, panY: 420, zoom: 55 });
    } else if (presetName === 'a-frame') {
      // A-Frame: Multi-force legs A-C-E and B-D-E, tie bar C-D
      const jA = { id: 'j_A', x: 0, y: 0, label: 'A' };
      const jB = { id: 'j_B', x: 4, y: 0, label: 'B' };
      const jC = { id: 'j_C', x: 1, y: 2, label: 'C' };
      const jD = { id: 'j_D', x: 3, y: 2, label: 'D' };
      const jE = { id: 'j_E', x: 2, y: 4, label: 'E' };

      const mList = [
        { id: 'm_AC', startJointId: 'j_A', endJointId: 'j_C', label: 'F_AC' },
        { id: 'm_CE', startJointId: 'j_C', endJointId: 'j_E', label: 'F_CE' },
        { id: 'm_BD', startJointId: 'j_B', endJointId: 'j_D', label: 'F_BD' },
        { id: 'm_DE', startJointId: 'j_D', endJointId: 'j_E', label: 'F_DE' },
        { id: 'm_CD', startJointId: 'j_C', endJointId: 'j_D', label: 'F_CD' }
      ];

      const s1 = { id: 's_A', jointId: 'j_A', type: 'pin', orientation: 'horizontal' };
      const s2 = { id: 's_B', jointId: 'j_B', type: 'roller', orientation: 'horizontal' };

      const { fx: fx1, fy: fy1 } = calculateForceComponents(25, 270);
      const f1 = { id: 'f_E', jointId: 'j_E', magnitude: 25, angle: 270, fx: fx1, fy: fy1 };
      const { fx: fx2, fy: fy2 } = calculateForceComponents(10, 0);
      const f2 = { id: 'f_C', jointId: 'j_C', magnitude: 10, angle: 0, fx: fx2, fy: fy2 };

      setJoints([jA, jB, jC, jD, jE]);
      setMembers(mList);
      setSupports([s1, s2]);
      setForces([f1, f2]);
      setStructureMode('frame');
      setViewTransform({ panX: 420, panY: 420, zoom: 65 });
    } else if (presetName === 'portal-frame') {
      // Portal Frame with vertical columns and cross-beam
      const jA = { id: 'j_A', x: 0, y: 0, label: 'A' };
      const jB = { id: 'j_B', x: 5, y: 0, label: 'B' };
      const jC = { id: 'j_C', x: 0, y: 3.5, label: 'C' };
      const jD = { id: 'j_D', x: 5, y: 3.5, label: 'D' };
      const jE = { id: 'j_E', x: 2.5, y: 3.5, label: 'E' };

      const mList = [
        { id: 'm_AC', startJointId: 'j_A', endJointId: 'j_C', label: 'F_AC' },
        { id: 'm_BD', startJointId: 'j_B', endJointId: 'j_D', label: 'F_BD' },
        { id: 'm_CE', startJointId: 'j_C', endJointId: 'j_E', label: 'F_CE' },
        { id: 'm_ED', startJointId: 'j_E', endJointId: 'j_D', label: 'F_ED' }
      ];

      const s1 = { id: 's_A', jointId: 'j_A', type: 'pin', orientation: 'horizontal' };
      const s2 = { id: 's_B', jointId: 'j_B', type: 'roller', orientation: 'horizontal' };

      const { fx: fx1, fy: fy1 } = calculateForceComponents(15, 0);
      const f1 = { id: 'f_C', jointId: 'j_C', magnitude: 15, angle: 0, fx: fx1, fy: fy1 };
      const { fx: fx2, fy: fy2 } = calculateForceComponents(20, 270);
      const f2 = { id: 'f_E', jointId: 'j_E', magnitude: 20, angle: 270, fx: fx2, fy: fy2 };

      setJoints([jA, jB, jC, jD, jE]);
      setMembers(mList);
      setSupports([s1, s2]);
      setForces([f1, f2]);
      setStructureMode('frame');
      setViewTransform({ panX: 380, panY: 420, zoom: 55 });
    } else if (presetName === 'toggle-clamp') {
      // Toggle Clamp Machine: High mechanical advantage clamping
      const jA = { id: 'j_A', x: 0, y: 1.5, label: 'A' }; // Base pivot
      const jB = { id: 'j_B', x: 2, y: 2.5, label: 'B' }; // Handle pin
      const jC = { id: 'j_C', x: 3.5, y: 0.5, label: 'C' }; // Clamping tip
      const jD = { id: 'j_D', x: 1, y: 3.5, label: 'D' }; // Handle grip

      const mList = [
        { id: 'm_AB', startJointId: 'j_A', endJointId: 'j_B', label: 'F_AB' },
        { id: 'm_BD', startJointId: 'j_B', endJointId: 'j_D', label: 'F_BD' },
        { id: 'm_BC', startJointId: 'j_B', endJointId: 'j_C', label: 'F_BC' }
      ];

      const s1 = { id: 's_A', jointId: 'j_A', type: 'pin', orientation: 'horizontal' };
      const s2 = { id: 's_C', jointId: 'j_C', type: 'roller', orientation: 'horizontal' };

      const { fx: fx1, fy: fy1 } = calculateForceComponents(10, 270);
      const f1 = { id: 'f_D', jointId: 'j_D', magnitude: 10, angle: 270, fx: fx1, fy: fy1 };

      setJoints([jA, jB, jC, jD]);
      setMembers(mList);
      setSupports([s1, s2]);
      setForces([f1]);
      setStructureMode('machine');
      setViewTransform({ panX: 420, panY: 420, zoom: 65 });
    } else if (presetName === 'pliers') {
      // Pliers: Two crossing levers pinned at central pivot B
      const jA = { id: 'j_A', x: 0, y: 3.2, label: 'A' }; // Upper handle
      const jD = { id: 'j_D', x: 0, y: 0.8, label: 'D' }; // Lower handle
      const jB = { id: 'j_B', x: 2.2, y: 2.0, label: 'B' }; // Central Pivot
      const jC = { id: 'j_C', x: 3.8, y: 1.6, label: 'C' }; // Lower Jaw
      const jE = { id: 'j_E', x: 3.8, y: 2.4, label: 'E' }; // Upper Jaw

      const mList = [
        { id: 'm_AB', startJointId: 'j_A', endJointId: 'j_B', label: 'F_AB' },
        { id: 'm_BC', startJointId: 'j_B', endJointId: 'j_C', label: 'F_BC' },
        { id: 'm_DB', startJointId: 'j_D', endJointId: 'j_B', label: 'F_DB' },
        { id: 'm_BE', startJointId: 'j_B', endJointId: 'j_E', label: 'F_BE' }
      ];

      const s1 = { id: 's_B', jointId: 'j_B', type: 'pin', orientation: 'horizontal' };

      const { fx: fx1, fy: fy1 } = calculateForceComponents(15, 270);
      const f1 = { id: 'f_A', jointId: 'j_A', magnitude: 15, angle: 270, fx: fx1, fy: fy1 };
      const { fx: fx2, fy: fy2 } = calculateForceComponents(15, 90);
      const f2 = { id: 'f_D', jointId: 'j_D', magnitude: 15, angle: 90, fx: fx2, fy: fy2 };

      setJoints([jA, jB, jC, jD, jE]);
      setMembers(mList);
      setSupports([s1]);
      setForces([f1, f2]);
      setStructureMode('machine');
      setViewTransform({ panX: 420, panY: 420, zoom: 65 });
    }
  }, [clearCanvas]);

  // Auto-center & reset view
  const resetView = useCallback((containerWidth = 900, containerHeight = 650) => {
    if (joints.length === 0) {
      setViewTransform({ panX: containerWidth / 2, panY: containerHeight / 2, zoom: 60 });
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    joints.forEach(j => {
      minX = Math.min(minX, j.x);
      maxX = Math.max(maxX, j.x);
      minY = Math.min(minY, j.y);
      maxY = Math.max(maxY, j.y);
    });

    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const padding = 160;
    const zoomX = (containerWidth - padding) / spanX;
    const zoomY = (containerHeight - padding) / spanY;
    const newZoom = Math.min(Math.max(25, Math.min(zoomX, zoomY)), 120);

    // In SVG world coordinate mapping: screenX = panX + x * zoom, screenY = panY - y * zoom
    const newPanX = containerWidth / 2 - midX * newZoom;
    const newPanY = containerHeight / 2 + midY * newZoom;

    setViewTransform({ panX: newPanX, panY: newPanY, zoom: newZoom });
  }, [joints]);

  // Handle precision modal confirmation
  const handleModalConfirm = useCallback((inputData) => {
    const { itemType, startJoint, dropWorldPos } = modalState;

    if (itemType === 'force' || itemType === 'unknown-force') {
      const isTargetUnknown = inputData.isUnknown || itemType === 'unknown-force';
      const targetJoint = startJoint || (joints.length > 0 ? joints[0] : null);
      if (targetJoint) {
        const mag = isTargetUnknown ? 0 : toInternalForce(inputData.magnitude !== undefined ? inputData.magnitude : 15);
        addForce(targetJoint.id, mag, inputData.angle, isTargetUnknown, inputData.targetLabel || 'P');
      } else if (dropWorldPos) {
        const newId = addJoint(dropWorldPos.x, dropWorldPos.y);
        const mag = isTargetUnknown ? 0 : toInternalForce(inputData.magnitude !== undefined ? inputData.magnitude : 15);
        addForce(newId, mag, inputData.angle, isTargetUnknown, inputData.targetLabel || 'P');
      }
    } else {
      let currentJoints = [...joints];
      let currentMembers = [...members];
      let currentSupports = [...supports];
      let currentForces = [...forces];

      let originJoint = startJoint;
      if (!originJoint) {
        const snapOrigin = findSnapTarget(dropWorldPos, currentJoints, currentMembers, {
          jointThreshold: 0.45,
          memberThreshold: 0.35
        });
        if (snapOrigin && snapOrigin.type === 'joint') {
          originJoint = snapOrigin.joint;
        } else {
          const newId = `j_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          originJoint = {
            id: newId,
            x: Math.round(dropWorldPos.x * 1000) / 1000,
            y: Math.round(dropWorldPos.y * 1000) / 1000,
            label: getJointLabel(currentJoints.length)
          };
          currentJoints.push(originJoint);
        }
      }

      // Calculate endpoint using input params with converted internal meters
      const memberInputData = {
        ...inputData,
        length: toInternalLength(inputData.length)
      };
      const endpoint = calculateMemberEndpoint(originJoint, itemType, memberInputData);

      const snapEnd = findSnapTarget(endpoint, currentJoints, currentMembers, {
        excludeJointIds: [originJoint.id],
        jointThreshold: 0.45,
        memberThreshold: 0.35
      });

      let targetJointId;
      if (snapEnd && snapEnd.type === 'joint') {
        targetJointId = snapEnd.joint.id;
      } else {
        targetJointId = `j_${Date.now() + 1}_${Math.random().toString(36).substring(2, 6)}`;
        const newEndJoint = {
          id: targetJointId,
          x: endpoint.x,
          y: endpoint.y,
          label: getJointLabel(currentJoints.length)
        };
        currentJoints.push(newEndJoint);
      }

      const newMember = {
        id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        startJointId: originJoint.id,
        endJointId: targetJointId,
        type: itemType,
        length: memberInputData.length,
        angle: inputData.angle,
        label: 'F',
        queryId: ''
      };
      currentMembers.push(newMember);

      const { jList, mList, sList, fList } = consolidateJoints(
        currentJoints, currentMembers, currentSupports, currentForces, 0.25
      );
      const { updatedJoints, updatedMembers } = recomputeLabels(jList, mList);

      setJoints(updatedJoints);
      setMembers(updatedMembers);
      setSupports(sList);
      setForces(fList);
      invalidateAnalysis();
      pushHistorySnapshot(updatedJoints, updatedMembers, sList, fList);
    }

    setModalState(prev => ({ ...prev, isOpen: false }));
  }, [modalState, joints, members, supports, forces, addForce, addJoint, toInternalForce, toInternalLength, recomputeLabels, invalidateAnalysis, pushHistorySnapshot]);

  const handleModalCancel = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <TrussContext.Provider
      value={{
        joints,
        members,
        supports,
        forces,
        selectedItem,
        setSelectedItem,
        selectedMemberId,
        setSelectedMemberId,
        showForceLabels,
        setShowForceLabels,
        analysisResult,
        runAnalysis,
        modalState,
        setModalState,
        handleModalConfirm,
        handleModalCancel,
        viewTransform,
        setViewTransform,
        addJoint,
        addMember,
        addSupport,
        updateSupportOrientation,
        addForce,
        updateForce,
        updateMember,
        updateJoint,
        deleteItem,
        sweepErase,
        commitSweepStroke,
        clearCanvas,
        loadPreset,
        resetView,
        activeTool,
        setActiveTool,
        armedTool,
        setArmedTool,
        undo,
        redo,
        canUndo,
        canRedo,
        transformingMemberId,
        setTransformingMemberId,
        addDirectMember,
        updateMemberEndpoint,
        commitMemberTransform,
        mergeJoints,
        mergeCoincidentJoints,
        structureMode,
        setStructureMode: updateStructureMode,
        freeHandState,
        setFreeHandState,
        startFreeHandPlacement,
        updateFreeHandCursor,
        commitFreeHandPlacement,
        cancelFreeHandPlacement,
        lengthUnit,
        setLengthUnit,
        forceUnit,
        setForceUnit,
        formatLength,
        formatForce,
        toInternalLength,
        toInternalForce,
        fromInternalLength,
        fromInternalForce
      }}
    >
      {children}
    </TrussContext.Provider>
  );
}
