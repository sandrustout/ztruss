import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useTruss, snapEngineeringAngle, snapEngineeringLength } from '../context/TrussContext';
import { distance, findSnapTarget, projectPointOntoSegment } from '../engine/trussGeometry';
import { Maximize2, ZoomIn, ZoomOut, Eye, EyeOff, Layers, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import CanvasContextMenu from './CanvasContextMenu';

export default function Canvas() {
  const {
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
    viewTransform,
    setViewTransform,
    addJoint,
    addSupport,
    addForce,
    setModalState,
    deleteItem,
    resetView,
    loadPreset,
    activeTool,
    setActiveTool,
    armedTool,
    setArmedTool,
    undo,
    redo,
    canUndo,
    canRedo,
    sweepErase,
    commitSweepStroke,
    transformingMemberId,
    setTransformingMemberId,
    addDirectMember,
    updateMemberEndpoint,
    commitMemberTransform,
    freeHandState,
    startFreeHandPlacement,
    updateFreeHandCursor,
    commitFreeHandPlacement,
    cancelFreeHandPlacement,
    lengthUnit,
    forceUnit,
    formatLength,
    formatForce,
    updateForce,
    runAnalysis
  } = useTruss();

  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Pan interaction state
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Snap indicator during drag-over
  const [snapTarget, setSnapTarget] = useState(null); // { joint, screenX, screenY } or null

  // Continuous Sweep Eraser State
  const isErasingRef = useRef(false);
  const hasErasedInStrokeRef = useRef(false);
  const [eraserPos, setEraserPos] = useState(null);
  const [isErasingActive, setIsErasingActive] = useState(false);

  // Custom double-click floating context menu state
  const [menuState, setMenuState] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    targetType: null,
    targetId: null,
    worldPos: { x: 0, y: 0 }
  });

  // Ghost drag preview state
  const [dragGhost, setDragGhost] = useState(null);

  // Active on-canvas rotate & stretch handle dragging state
  const [draggingHandle, setDraggingHandle] = useState(null);

  // Active on-canvas force vector rotation dragging state
  const [rotatingForce, setRotatingForce] = useState(null); // { forceId, jointId, startAngle, isUnknown }

  const selectedItemRef = useRef(selectedItem);
  selectedItemRef.current = selectedItem;
  const forcesRef = useRef(forces);
  forcesRef.current = forces;

  // Keyboard listener: Space (pan), Delete/Backspace (delete), Esc (cancel), D (draw), E (erase), R (rotate force)
  useEffect(() => {
    const onKeyDown = (e) => {
      // Guard against typing in form inputs, textareas, contentEditable, precision modals, etc.
      const activeEl = document.activeElement;
      const target = e.target;
      const isInput = (
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        activeEl?.isContentEditable ||
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable ||
        target?.closest?.('.precision-modal') ||
        target?.closest?.('.canvas-context-menu') ||
        target?.closest?.('.toolbox-force-controls')
      );
      if (isInput) return;

      // Ignore if modifier keys (Ctrl, Alt, Meta) are held (e.g. Ctrl+D browser bookmark, Ctrl+Z undo)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.code === 'Space' && !e.repeat) {
        setSpacePressed(true);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemRef.current) {
          deleteItem(selectedItemRef.current.type, selectedItemRef.current.id);
        }
      }
      if (e.key === 'Escape') {
        cancelFreeHandPlacement();
        setRotatingForce(null);
        setSnapTarget(null);
        setDragGhost(null);
        if (setArmedTool) setArmedTool(null);
      }

      // Shortcut 'E' or 'e' => Eraser Mode
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setActiveTool('eraser');
        if (setArmedTool) setArmedTool(null);
        cancelFreeHandPlacement();
        setRotatingForce(null);
        return;
      }

      // Shortcut 'D' or 'd' => Drawing Mode (Freehand Member)
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setActiveTool('select');
        if (setArmedTool) {
          setArmedTool({ id: 'freehand', category: 'member', label: 'Free-Hand Member', subtext: 'Free angle & length', badge: '★ Free' });
        }
        cancelFreeHandPlacement();
        setRotatingForce(null);
        return;
      }

      // Shortcut 'H' or 'h' => Horizontal Member
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setActiveTool('select');
        if (setArmedTool) {
          setArmedTool({ id: 'horizontal', category: 'member', label: 'Horizontal Truss', subtext: '0° horizontal bar', badge: '0°' });
        }
        cancelFreeHandPlacement();
        setRotatingForce(null);
        return;
      }

      // Shortcut 'V' or 'v' => Vertical Member
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setActiveTool('select');
        if (setArmedTool) {
          setArmedTool({ id: 'vertical', category: 'member', label: 'Vertical Truss', subtext: '90° vertical strut', badge: '90°' });
        }
        cancelFreeHandPlacement();
        setRotatingForce(null);
        return;
      }

      // Shortcut 'P' or 'p' => Pin Support / Joint
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setActiveTool('select');
        if (setArmedTool) {
          setArmedTool({ id: 'pin', category: 'support', label: 'Pin Support', subtext: 'Pin support (r=2)', badge: 'r=2' });
        }
        cancelFreeHandPlacement();
        setRotatingForce(null);
        return;
      }

      // Shortcut 'R' or 'r' => Roller Support (or rotate force if a force is selected)
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (selectedItemRef.current?.type === 'force') {
          const fId = selectedItemRef.current.id;
          const currentForce = forcesRef.current.find(f => f.id === fId);
          if (currentForce) {
            const step = e.shiftKey ? -45 : 45;
            const nextAngle = ((currentForce.angle + step) % 360 + 360) % 360;
            updateForce(currentForce.id, { angle: nextAngle });
          }
        } else {
          setActiveTool('select');
          if (setArmedTool) {
            setArmedTool({ id: 'roller', category: 'support', label: 'Roller Support', subtext: 'Roller support (r=1)', badge: 'r=1' });
          }
          cancelFreeHandPlacement();
          setRotatingForce(null);
        }
        return;
      }

      // Shortcut 'F' or 'f' => Force Vector Tool (toggle between known and unknown)
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setActiveTool('select');
        if (setArmedTool) {
          setArmedTool(prev => {
            if (prev?.id === 'force') {
              return { id: 'unknown-force', category: 'force', label: 'Unknown Force (?)', subtext: 'Solve-For Target (P)', isUnknown: true, targetLabel: 'P', badge: 'P = ?' };
            } else if (prev?.id === 'unknown-force') {
              return null;
            } else {
              return { id: 'force', category: 'force', label: 'Known External Force', subtext: 'Point load vector', isUnknown: false, magnitude: 15, angle: 270, badge: 'kN' };
            }
          });
        }
        cancelFreeHandPlacement();
        setRotatingForce(null);
        return;
      }

      // Shortcut 'Enter' => Run Analysis on structure
      if (e.key === 'Enter') {
        e.preventDefault();
        setSnapTarget(null);
        setDragGhost(null);
        if (runAnalysis) {
          runAnalysis();
        }
        return;
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };
    const onGlobalMouseUp = () => {
      setIsPanning(false);
      setRotatingForce(null);
      setDragGhost(null);
      if (!freeHandState?.isActive) {
        setSnapTarget(null);
      }
      if (isErasingRef.current) {
        isErasingRef.current = false;
        setIsErasingActive(false);
        if (hasErasedInStrokeRef.current) {
          commitSweepStroke();
          hasErasedInStrokeRef.current = false;
        }
      }
    };
    const onGlobalDragEnd = () => {
      setSnapTarget(null);
      setDragGhost(null);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('dragend', onGlobalDragEnd);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('dragend', onGlobalDragEnd);
    };
  }, [deleteItem, cancelFreeHandPlacement, setArmedTool, commitSweepStroke, setActiveTool, updateForce]);

  // Coordinate transforms:
  // World (m) -> Screen (px):
  // screenX = panX + worldX * zoom
  // screenY = panY - worldY * zoom  (Physics +Y is Up, SVG +Y is Down)
  const worldToScreen = useCallback((wx, wy) => {
    return {
      x: viewTransform.panX + wx * viewTransform.zoom,
      y: viewTransform.panY - wy * viewTransform.zoom
    };
  }, [viewTransform]);

  // Screen (px) -> World (m):
  const screenToWorld = useCallback((sx, sy) => {
    return {
      x: (sx - viewTransform.panX) / viewTransform.zoom,
      y: (viewTransform.panY - sy) / viewTransform.zoom
    };
  }, [viewTransform]);

  const viewTransformRef = useRef(viewTransform);
  viewTransformRef.current = viewTransform;

  // Native non-passive Wheel listener on canvas container to forcefully block browser page zoom/scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e) => {
      // Forcefully block default browser scrolling and browser page zooming
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const cursorScreenX = e.clientX - rect.left;
      const cursorScreenY = e.clientY - rect.top;
      const cur = viewTransformRef.current;

      const worldBeforeX = (cursorScreenX - cur.panX) / cur.zoom;
      const worldBeforeY = (cur.panY - cursorScreenY) / cur.zoom;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const nextZoom = Math.min(Math.max(15, cur.zoom * zoomFactor), 250);

      const nextPanX = cursorScreenX - worldBeforeX * nextZoom;
      const nextPanY = cursorScreenY + worldBeforeY * nextZoom;

      setViewTransform({
        panX: nextPanX,
        panY: nextPanY,
        zoom: nextZoom
      });
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [setViewTransform]);

  // Continuous Sweep Eraser Engine
  const checkAndPerformSweepErase = useCallback((worldPos) => {
    // Eraser brush radius: approx 24 screen pixels converted to world units
    const radius = Math.max(0.35, 24 / viewTransformRef.current.zoom);

    const jointsToErase = [];
    const membersToErase = [];
    const supportsToErase = [];
    const forcesToErase = [];

    // Check joints
    for (const j of joints) {
      if (distance(worldPos, j) <= radius) {
        jointsToErase.push(j.id);
      }
    }

    // Check members
    const jointMap = new Map(joints.map(j => [j.id, j]));
    for (const m of members) {
      const jA = jointMap.get(m.startJointId);
      const jB = jointMap.get(m.endJointId);
      if (jA && jB) {
        const proj = projectPointOntoSegment(worldPos, jA, jB);
        if (proj.distance <= radius) {
          membersToErase.push(m.id);
        }
      }
    }

    // Check supports
    for (const s of supports) {
      const j = jointMap.get(s.jointId);
      if (j && distance(worldPos, j) <= radius) {
        supportsToErase.push(s.id);
      }
    }

    // Check forces
    for (const f of forces) {
      const j = jointMap.get(f.jointId);
      if (j && distance(worldPos, j) <= radius) {
        forcesToErase.push(f.id);
      }
    }

    if (jointsToErase.length > 0 || membersToErase.length > 0 || supportsToErase.length > 0 || forcesToErase.length > 0) {
      hasErasedInStrokeRef.current = true;
      sweepErase(jointsToErase, membersToErase, supportsToErase, forcesToErase, false);
    }
  }, [joints, members, supports, forces, sweepErase]);

  const handleMouseDown = (e) => {
    // 1. Eraser sweep mode (hold left click and sweep across elements to erase)
    if (activeTool === 'eraser') {
      if (e.button === 0) {
        e.stopPropagation();
        isErasingRef.current = true;
        setIsErasingActive(true);
        hasErasedInStrokeRef.current = false;
        const rect = svgRef.current.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const mouseWorld = screenToWorld(sx, sy);
        checkAndPerformSweepErase(mouseWorld);
      }
      return;
    }

    // 2. Armed tool placement (click to draw members or place supports/loads)
    if (armedTool && e.button === 0) {
      e.stopPropagation();
      const rect = svgRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const mouseWorld = screenToWorld(sx, sy);

      // Check snap joint
      let snapJoint = null;
      let minPixDist = 28;
      for (const joint of joints) {
        const jScreen = worldToScreen(joint.x, joint.y);
        const pixDist = Math.hypot(sx - jScreen.x, sy - jScreen.y);
        if (pixDist < minPixDist) {
          minPixDist = pixDist;
          snapJoint = joint;
        }
      }

      if (armedTool.category === 'member') {
        if (!freeHandState.isActive) {
          // First click: sets start joint/pivot and enters live constrained drawing!
          startFreeHandPlacement(armedTool.id, snapJoint, mouseWorld);
        } else {
          // Second click: locks and commits member!
          commitFreeHandPlacement(mouseWorld, freeHandState.snapTarget);
        }
      } else if (armedTool.category === 'support') {
        const targetJointId = snapJoint ? snapJoint.id : addJoint(mouseWorld.x, mouseWorld.y);
        addSupport(targetJointId, armedTool.id);
      } else if (armedTool.category === 'force') {
        const targetJoint = snapJoint || (joints.length > 0 ? joints.reduce((closest, j) => {
          const d = distance(mouseWorld, j);
          return (!closest || d < closest.dist) ? { joint: j, dist: d } : closest;
        }, null)?.joint : null);

        const targetJointId = targetJoint ? targetJoint.id : addJoint(mouseWorld.x, mouseWorld.y);
        const initAngle = armedTool.angle !== undefined ? armedTool.angle : 270;
        const mag = armedTool.isUnknown ? 0 : (armedTool.magnitude !== undefined ? armedTool.magnitude : 15);

        let targetForce;
        if (armedTool.isUnknown) {
          targetForce = addForce(targetJointId, 0, initAngle, true, armedTool.targetLabel || 'P');
        } else {
          targetForce = addForce(targetJointId, mag, initAngle, false, 'F');
        }

        if (targetForce?.id) {
          setSelectedItem({ type: 'force', id: targetForce.id });
          setRotatingForce({
            forceId: targetForce.id,
            jointId: targetJointId,
            startAngle: initAngle,
            isUnknown: !!armedTool.isUnknown
          });
        }
        setArmedTool(null);
        return;
      }
      return;
    }

    // 3. If placing a free-hand member from drag-drop, click firmly fixes and commits it!
    if (freeHandState.isActive && e.button === 0) {
      e.stopPropagation();
      const rect = svgRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const mouseWorld = screenToWorld(sx, sy);
      commitFreeHandPlacement(mouseWorld, freeHandState.snapTarget);
      return;
    }

    // 4. Default: selection or pan on empty canvas
    if (e.button === 0) {
      if (e.target === svgRef.current || e.target.tagName === 'rect') {
        setSelectedItem(null);
        setTransformingMemberId(null);
      }
      setIsPanning(true);
      setStartPan({ x: e.clientX - viewTransform.panX, y: e.clientY - viewTransform.panY });
    }
  };

  const handleMouseMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const mouseWorld = screenToWorld(sx, sy);

    // Eraser position update and continuous sweep while left button held
    if (activeTool === 'eraser') {
      setEraserPos({ x: sx, y: sy });
      if (isErasingRef.current || e.buttons === 1) {
        checkAndPerformSweepErase(mouseWorld);
      }
      return;
    } else if (eraserPos !== null) {
      setEraserPos(null);
    }

    // If active free-hand placement is in progress, track mouse cursor live
    if (freeHandState.isActive) {
      // Snap detection for moving endpoint
      const snap = findSnapTarget(mouseWorld, joints, members, {
        excludeJointIds: freeHandState.startJoint ? [freeHandState.startJoint.id] : [],
        jointThreshold: 0.45,
        memberThreshold: 0.35,
        startJoint: freeHandState.startJoint,
        itemType: freeHandState.itemType
      });

      if (snap) {
        const snapScreen = worldToScreen(snap.x, snap.y);
        setSnapTarget({
          id: snap.type === 'joint' ? snap.joint.id : snap.member.id,
          label: snap.type === 'joint' ? snap.joint.label : (snap.member.label || 'Member'),
          screenX: snapScreen.x,
          screenY: snapScreen.y,
          type: snap.type,
          ...snap
        });
      } else {
        setSnapTarget(null);
      }

      updateFreeHandCursor(mouseWorld, snap);
      return;
    }

    // Hover snap preview when a member tool is armed before first click
    if (armedTool && armedTool.category === 'member') {
      const snap = findSnapTarget(mouseWorld, joints, members, {
        jointThreshold: 0.45,
        memberThreshold: 0.35
      });
      if (snap) {
        const snapScreen = worldToScreen(snap.x, snap.y);
        setSnapTarget({
          id: snap.type === 'joint' ? snap.joint.id : snap.member.id,
          label: snap.type === 'joint' ? snap.joint.label : (snap.member.label || 'Member'),
          screenX: snapScreen.x,
          screenY: snapScreen.y,
          type: snap.type,
          ...snap
        });
      } else {
        setSnapTarget(null);
      }
    }

    // If actively dragging the rotate & stretch handle of a member
    if (draggingHandle) {
      const pivot = joints.find(j => j.id === draggingHandle.pivotJointId);
      if (pivot) {
        let dx = mouseWorld.x - pivot.x;
        let dy = mouseWorld.y - pivot.y;
        let dist = Math.hypot(dx, dy);
        dist = Math.max(0.5, dist); // Minimum length 0.5m

        let rawAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (rawAngleDeg < 0) rawAngleDeg += 360;

        const snappedAngle = snapEngineeringAngle(rawAngleDeg);
        const snappedDist = snapEngineeringLength(dist);

        const rad = (snappedAngle * Math.PI) / 180;
        let finalEndX = Math.round((pivot.x + snappedDist * Math.cos(rad)) * 10000) / 10000;
        let finalEndY = Math.round((pivot.y + snappedDist * Math.sin(rad)) * 10000) / 10000;

        // Magnetic snap to other existing joints or members
        const snap = findSnapTarget({ x: finalEndX, y: finalEndY }, joints, members, {
          excludeJointIds: [pivot.id, draggingHandle.endJointId],
          excludeMemberIds: [draggingHandle.memberId],
          jointThreshold: 0.45,
          memberThreshold: 0.35
        });

        if (snap) {
          finalEndX = snap.x;
          finalEndY = snap.y;
          const snapScreen = worldToScreen(snap.x, snap.y);
          setSnapTarget({
            id: snap.type === 'joint' ? snap.joint.id : snap.member.id,
            label: snap.type === 'joint' ? snap.joint.label : (snap.member.label || 'Member'),
            screenX: snapScreen.x,
            screenY: snapScreen.y,
            type: snap.type
          });
        } else {
          setSnapTarget(null);
        }

        updateMemberEndpoint(draggingHandle.memberId, finalEndX, finalEndY);
      }
      return;
    }

    // If actively dragging the rotation handle of a force vector
    if (rotatingForce) {
      const joint = joints.find(j => j.id === rotatingForce.jointId);
      if (joint) {
        const jScreen = worldToScreen(joint.x, joint.y);
        const dx = sx - jScreen.x;
        const dy = sy - jScreen.y;
        if (Math.hypot(dx, dy) > 6) {
          // Formula atan2(dy, -dx) maps mouse position at arrow tail directly to physics angle degrees
          const rawAngleRad = Math.atan2(dy, -dx);
          let deg = (rawAngleRad * 180) / Math.PI;
          deg = ((deg % 360) + 360) % 360;

          // Snap to standard cardinal angles if within 5°, otherwise nearest 15°
          const snapCardinals = [0, 45, 90, 135, 180, 225, 270, 315];
          let snapped = Math.round(deg / 15) * 15;
          for (const card of snapCardinals) {
            if (Math.abs(deg - card) < 5 || Math.abs(deg - (card + 360)) < 5) {
              snapped = card;
              break;
            }
          }
          snapped = ((snapped % 360) + 360) % 360;
          updateForce(rotatingForce.forceId, { angle: snapped });
        }
      }
      return;
    }

    if (isPanning) {
      setViewTransform(prev => ({
        ...prev,
        panX: e.clientX - startPan.x,
        panY: e.clientY - startPan.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    if (rotatingForce) {
      setRotatingForce(null);
    }

    if (activeTool === 'eraser' || isErasingRef.current) {
      isErasingRef.current = false;
      setIsErasingActive(false);
      if (hasErasedInStrokeRef.current) {
        commitSweepStroke();
        hasErasedInStrokeRef.current = false;
      }
    }

    if (draggingHandle) {
      // Forcefully unify joints on handle release!
      commitMemberTransform(draggingHandle.memberId);
      setDraggingHandle(null);
      setSnapTarget(null);
    }

    if (!freeHandState?.isActive) {
      setSnapTarget(null);
    }
  };

  // Drag and Drop from Toolbox
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldPos = screenToWorld(sx, sy);

    // Find nearest joint in screen pixels (snap threshold = 28px)
    let closest = null;
    let minPixDist = 28;

    for (const joint of joints) {
      const jScreen = worldToScreen(joint.x, joint.y);
      const pixDist = Math.hypot(sx - jScreen.x, sy - jScreen.y);
      if (pixDist < minPixDist) {
        minPixDist = pixDist;
        closest = { ...joint, screenX: jScreen.x, screenY: jScreen.y };
      }
    }

    setSnapTarget(closest);

    // Update live ghost preview
    const dragItem = window.__currentDragItem;
    if (dragItem) {
      setDragGhost({
        active: true,
        item: dragItem,
        screenX: closest ? closest.screenX : sx,
        screenY: closest ? closest.screenY : sy,
        worldX: closest ? closest.x : worldPos.x,
        worldY: closest ? closest.y : worldPos.y,
        isSnapped: !!closest,
        snapJoint: closest
      });
    }
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    setSnapTarget(null);
    setDragGhost(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setSnapTarget(null);
    setDragGhost(null);

    const dataStr = e.dataTransfer.getData('application/z-truss-item') || (window.__currentDragItem ? JSON.stringify(window.__currentDragItem) : null);
    if (!dataStr) return;

    const item = JSON.parse(dataStr);
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const dropWorldPos = screenToWorld(sx, sy);

    // Determine snap joint
    let snapJoint = null;
    let minPixDist = 28;

    for (const joint of joints) {
      const jScreen = worldToScreen(joint.x, joint.y);
      const pixDist = Math.hypot(sx - jScreen.x, sy - jScreen.y);
      if (pixDist < minPixDist) {
        minPixDist = pixDist;
        snapJoint = joint;
      }
    }

    // Process Drop
    if (item.category === 'support') {
      // Supports MUST attach to an existing joint
      if (snapJoint) {
        addSupport(snapJoint.id, item.id);
      } else if (joints.length > 0) {
        // Snap to nearest existing joint
        let nearestJoint = null;
        let minDist = Infinity;
        for (const j of joints) {
          const d = distance(dropWorldPos, j);
          if (d < minDist) {
            minDist = d;
            nearestJoint = j;
          }
        }
        if (nearestJoint) {
          addSupport(nearestJoint.id, item.id);
        }
      }
    } else if (item.category === 'force') {
      // External force attaches to joint (snap joint or nearest within 0.6m)
      let targetJoint = snapJoint;
      if (!targetJoint && joints.length > 0) {
        let closest = null;
        for (const j of joints) {
          const d = distance(dropWorldPos, j);
          if (!closest || d < closest.dist) {
            closest = { joint: j, dist: d };
          }
        }
        if (closest && closest.dist < 0.6) {
          targetJoint = closest.joint;
        }
      }

      const targetJointId = targetJoint ? targetJoint.id : addJoint(dropWorldPos.x, dropWorldPos.y);
      const angle = item.angle !== undefined ? item.angle : 270;
      const mag = item.isUnknown ? 0 : (item.magnitude !== undefined ? item.magnitude : 15);

      const createdF = addForce(targetJointId, mag, angle, !!item.isUnknown, item.targetLabel || 'P');
      if (createdF?.id) {
        setSelectedItem({ type: 'force', id: createdF.id });
      }
    } else if (item.category === 'member') {
      if (item.id === 'freehand') {
        // Fix start point immediately and enter interactive free-hand angle & length mode!
        startFreeHandPlacement('freehand', snapJoint, dropWorldPos);
      } else {
        // Directly drop constrained member with exact angle (horizontal 0°, vertical 90°, right-leaned 45°, left-leaned 135°)
        addDirectMember(item.id, snapJoint, dropWorldPos);
      }
    }
  };

  const handleCanvasDoubleClick = (e) => {
    if (e.target === svgRef.current || e.target.tagName === 'rect') {
      const rect = svgRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const worldPos = screenToWorld(sx, sy);
      setMenuState({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        targetType: 'canvas',
        targetId: null,
        worldPos
      });
    }
  };

  // Build lookup map for joint coordinates
  const jointCoordMap = new Map();
  joints.forEach(j => {
    jointCoordMap.set(j.id, { ...j, ...worldToScreen(j.x, j.y) });
  });

  // Solved member forces map
  const memberForceMap = new Map();
  if (analysisResult?.solved && analysisResult?.solverResult?.memberResults) {
    analysisResult.solverResult.memberResults.forEach(r => {
      memberForceMap.set(r.id, r);
    });
  }

  // Grid background calculations
  const gridStep = Math.max(20, viewTransform.zoom); // 1 meter grid
  const subGridStep = gridStep / 5; // 0.2 meter grid

  // Snapping indicator is only active during dragging operations
  const isActivelySnapping = !!(dragGhost?.active || draggingHandle || freeHandState?.isActive);

  return (
    <div className="canvas-wrapper" ref={containerRef}>
      {/* Canvas Toolbar overlay */}
      <div className="canvas-controls-overlay">
        <div className="canvas-stats-pill">
          <span className="stat-label">Grid:</span> {formatLength(1.0)}
          <span className="stat-sep">•</span>
          <span className="stat-label">Zoom:</span> {(viewTransform.zoom / 50 * 100).toFixed(0)}%
        </div>

        <div className="canvas-btn-group">
          <button
            type="button"
            className={`canvas-icon-btn ${!canUndo ? 'disabled' : ''}`}
            title="Undo last action (Ctrl+Z)"
            onClick={undo}
            disabled={!canUndo}
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            className={`canvas-icon-btn ${!canRedo ? 'disabled' : ''}`}
            title="Redo next action (Ctrl+Y)"
            onClick={redo}
            disabled={!canRedo}
          >
            <Redo2 size={15} />
          </button>
          <span className="canvas-btn-sep" />
          <button
            type="button"
            className="canvas-icon-btn"
            title="Zoom In"
            onClick={() => setViewTransform(v => ({ ...v, zoom: Math.min(250, v.zoom * 1.2) }))}
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            className="canvas-icon-btn"
            title="Zoom Out"
            onClick={() => setViewTransform(v => ({ ...v, zoom: Math.max(15, v.zoom * 0.8) }))}
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            className="canvas-icon-btn"
            title="Reset View Fit"
            onClick={() => resetView(containerRef.current?.clientWidth || (window.innerWidth - 380), containerRef.current?.clientHeight || (window.innerHeight - 140))}
          >
            <RotateCcw size={15} />
          </button>
          <span className="canvas-btn-sep" />
          <button
            type="button"
            className={`canvas-icon-btn ${showForceLabels ? 'active' : ''}`}
            title="Toggle Member Force Labels"
            onClick={() => setShowForceLabels(prev => !prev)}
          >
            {showForceLabels ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>

      {/* Empty Canvas Landing / Hero State */}
      {joints.length === 0 && (
        <div className="canvas-empty-hero">
          <div className="empty-hero-card">
            <span className="empty-hero-tag">INTERACTIVE STRUCTURAL CANVAS</span>
            <h3 className="empty-hero-title">Start Building Your Truss</h3>
            <p className="empty-hero-desc">
              Drag members, supports, or forces from the toolbox on the left and drop them anywhere on the grid. Drop near joints to snap.
            </p>
            <div className="empty-hero-actions">
              <span className="empty-quick-label">Or load a sample structure:</span>
              <div className="empty-quick-buttons">
                <button
                  type="button"
                  className="empty-preset-btn"
                  onClick={() => loadPreset('triangle')}
                >
                  Simple Triangle (3-Bar)
                </button>
                <button
                  type="button"
                  className="empty-preset-btn"
                  onClick={() => loadPreset('warren')}
                >
                  Warren Truss (7-Bar)
                </button>
                <button
                  type="button"
                  className="empty-preset-btn"
                  onClick={() => loadPreset('pratt')}
                >
                  Pratt Truss (9-Bar)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        className={`truss-svg-canvas ${activeTool === 'eraser' ? 'cursor-eraser' : spacePressed ? 'cursor-grab' : isPanning ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (!freeHandState?.isActive) {
            setSnapTarget(null);
          }
          setDragGhost(null);
        }}
        onDoubleClick={handleCanvasDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <defs>
          {/* Engineering Ground Hatch Pattern */}
          <pattern id="ground-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--bp-cyan)" strokeWidth="1.5" opacity="0.6" />
          </pattern>

          {/* Simple Minor Grid (0.2m) - Low Transparency */}
          <pattern
            id="sub-grid"
            width={subGridStep}
            height={subGridStep}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${viewTransform.panX % subGridStep}, ${viewTransform.panY % subGridStep})`}
          >
            <path d={`M ${subGridStep} 0 L 0 0 0 ${subGridStep}`} fill="none" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="0.6" />
          </pattern>

          {/* Clean, Prominent Engineering Grid Pattern (1.0m) - Low Transparency */}
          <pattern
            id="major-grid"
            width={gridStep}
            height={gridStep}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${viewTransform.panX % gridStep}, ${viewTransform.panY % gridStep})`}
          >
            <rect width={gridStep} height={gridStep} fill="url(#sub-grid)" />
            <path d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`} fill="none" stroke="rgba(56, 189, 248, 0.42)" strokeWidth="1.1" />
          </pattern>

          {/* Force Arrow Marker */}
          <marker id="force-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <polygon points="0 1, 8 4, 0 7" fill="#f87171" />
          </marker>
          <marker id="force-arrow-purple" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <polygon points="0 1, 8 4, 0 7" fill="#c084fc" />
          </marker>
          <marker id="force-arrow-cyan" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <polygon points="0 1, 8 4, 0 7" fill="#38bdf8" />
          </marker>
          <marker id="rx-arrow-green" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <polygon points="0 1, 8 4, 0 7" fill="#34d399" />
          </marker>
        </defs>

        {/* Scalable Grid Background */}
        <rect width="100%" height="100%" fill="url(#major-grid)" />

        {/* Global World Origin (0,0) Axis crosshair */}
        <g className="origin-marker" transform={`translate(${viewTransform.panX}, ${viewTransform.panY})`}>
          <line x1="-15" y1="0" x2="15" y2="0" stroke="var(--bp-cyan)" strokeWidth="1" opacity="0.4" />
          <line x1="0" y1="-15" x2="0" y2="15" stroke="var(--bp-cyan)" strokeWidth="1" opacity="0.4" />
          <circle cx="0" cy="0" r="2" fill="var(--bp-cyan)" opacity="0.6" />
        </g>

        {/* LAYER 1: Truss Members */}
        <g className="truss-members-layer">
          {members.map(member => {
            const start = jointCoordMap.get(member.startJointId);
            const end = jointCoordMap.get(member.endJointId);
            if (!start || !end) return null;

            const isSelected = selectedMemberId === member.id || selectedItem?.id === member.id;
            const forceInfo = memberForceMap.get(member.id);
            const isTransforming = transformingMemberId === member.id;
            const startJointObj = joints.find(j => j.id === member.startJointId);
            const endJointObj = joints.find(j => j.id === member.endJointId);
            const curLen = startJointObj && endJointObj ? distance(startJointObj, endJointObj) : 0;
            const curAngleDeg = startJointObj && endJointObj ? Math.round((Math.atan2(endJointObj.y - startJointObj.y, endJointObj.x - startJointObj.x) * 180) / Math.PI) : 0;

            // Determine member stroke style based on solved status or active transform mode
            let strokeColor = isTransforming ? '#facc15' : 'var(--bp-cyan)';
            let strokeWidth = isTransforming ? 4 : isSelected ? 3.5 : 2.5;
            let strokeDasharray = isTransforming ? '6 4' : 'none';

            if (!isTransforming && forceInfo) {
              if (forceInfo.nature === 'TENSION') {
                strokeColor = '#60a5fa'; // Blue for tension
              } else if (forceInfo.nature === 'COMPRESSION') {
                strokeColor = '#f87171'; // Red for compression
              } else if (forceInfo.nature === 'ZERO') {
                strokeColor = '#facc15'; // Yellow/gold for zero-force
                strokeDasharray = '5 4';
              }
            }

            // Member midpoint for label positioning
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            // Offset label slightly perpendicular to member line
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const len = Math.hypot(dx, dy) || 1;
            const perpX = -dy / len;
            const perpY = dx / len;
            const labelX = midX + perpX * 14;
            const labelY = midY + perpY * 14;

            return (
              <g
                key={member.id}
                className={`member-group cursor-target ${isTransforming ? 'transforming-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === 'eraser') {
                    deleteItem('member', member.id);
                    return;
                  }
                  setSelectedMemberId(member.id);
                  setSelectedItem({ type: 'member', id: member.id });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === 'eraser') {
                    deleteItem('member', member.id);
                    return;
                  }
                  const rect = svgRef.current.getBoundingClientRect();
                  const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                  setMenuState({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY,
                    targetType: 'member',
                    targetId: member.id,
                    worldPos
                  });
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (activeTool === 'eraser') return;
                  const rect = svgRef.current.getBoundingClientRect();
                  const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                  setSelectedMemberId(member.id);
                  setSelectedItem({ type: 'member', id: member.id });
                  setMenuState({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY,
                    targetType: 'member',
                    targetId: member.id,
                    worldPos
                  });
                }}
              >
                {/* Outer glowing aura when in transform or selected mode */}
                {(isTransforming || isSelected) && (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={isTransforming ? "rgba(250, 204, 21, 0.28)" : "rgba(56, 189, 248, 0.25)"}
                    strokeWidth={isTransforming ? "14" : "10"}
                    strokeLinecap="round"
                  />
                )}

                {/* Thick invisible hover target for easy clicking / erasing */}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="transparent"
                  strokeWidth="24"
                  className="member-hitbox cursor-target"
                />

                {/* Visible Member Line */}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  className={`member-line ${isSelected ? 'selected' : ''}`}
                />

                {/* Member Label & Force Badge (hidden when in live transform mode) */}
                {!isTransforming && (
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect
                      x="-24"
                      y="-10"
                      width={forceInfo && showForceLabels ? "72" : "32"}
                      height="18"
                      rx="4"
                      fill="var(--bp-bg-dark)"
                      stroke={isSelected ? '#38bdf8' : 'var(--bp-border)'}
                      strokeWidth="1"
                      opacity="0.9"
                    />
                    <text
                      x={forceInfo && showForceLabels ? "-20" : "-19"}
                      y="3"
                      className="member-svg-label"
                      fill={strokeColor}
                    >
                      {member.label || 'F'}
                      {forceInfo && showForceLabels && (
                        <tspan fill="#ffffff" fontWeight="bold">
                          {` ${formatForce(forceInfo.magnitude)} ${forceInfo.code}`}
                        </tspan>
                      )}
                    </text>
                  </g>
                )}

                {/* Interactive On-Canvas Drag/Rotate & Stretch Mode */}
                {isTransforming && (
                  <g className="on-canvas-transform-controls">
                    {/* Fixed Pivot Indicator at Start Joint */}
                    <circle cx={start.x} cy={start.y} r="14" fill="none" stroke="#facc15" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx={start.x} cy={start.y} r="4" fill="#facc15" />
                    <g transform={`translate(${start.x}, ${start.y - 18})`}>
                      <rect x="-36" y="-9" width="72" height="18" rx="3" fill="rgba(9, 14, 26, 0.95)" stroke="#facc15" strokeWidth="1" />
                      <text x="0" y="3" fill="#facc15" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">
                        FIXED PIVOT
                      </text>
                    </g>

                    {/* Live Dimension HUD Badge */}
                    <g transform={`translate(${midX}, ${midY - 20})`}>
                      <rect x="-56" y="-12" width="112" height="24" rx="4" fill="rgba(9, 14, 26, 0.96)" stroke="#facc15" strokeWidth="1.2" />
                      <text x="0" y="4" textAnchor="middle" fill="#facc15" fontSize="10" fontFamily="var(--font-mono)" fontWeight="bold">
                        {formatLength(curLen)} ({curAngleDeg}°)
                      </text>
                    </g>

                    {/* Focused Precision Movable Handle at End Joint (Stationary Focus) */}
                    <g className="end-joint-focus-reticle">
                      <circle
                        cx={end.x}
                        cy={end.y}
                        r="18"
                        fill="rgba(250, 204, 21, 0.12)"
                        stroke="#facc15"
                        strokeWidth="1.8"
                        strokeDasharray="6 3"
                      />
                      {/* Crosshair focus brackets indicating 2D movement */}
                      <line x1={end.x} y1={end.y - 24} x2={end.x} y2={end.y - 12} stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
                      <line x1={end.x} y1={end.y + 12} x2={end.x} y2={end.y + 24} stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
                      <line x1={end.x - 24} y1={end.y} x2={end.x - 12} y2={end.y} stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
                      <line x1={end.x + 12} y1={end.y} x2={end.x + 24} y2={end.y} stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
                      {/* Inner joint node */}
                      <circle cx={end.x} cy={end.y} r="10" fill="#090e1a" stroke="#facc15" strokeWidth="2.5" />
                      <circle cx={end.x} cy={end.y} r="4" fill="#facc15" />
                    </g>

                    {/* Large drag hitbox for rotating & stretching */}
                    <circle
                      cx={end.x}
                      cy={end.y}
                      r="30"
                      fill="transparent"
                      cursor="grab"
                      className="cursor-target"
                      title="Drag to rotate around fixed pivot or pull to stretch length"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingHandle({
                          memberId: member.id,
                          pivotJointId: member.startJointId,
                          endJointId: member.endJointId
                        });
                      }}
                    />

                    {/* Done / Confirm Button */}
                    <g
                      transform={`translate(${end.x + 32}, ${end.y - 12})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        commitMemberTransform(member.id);
                        setTransformingMemberId(null);
                        setSnapTarget(null);
                      }}
                      cursor="pointer"
                      className="cursor-target"
                      title="Confirm member placement"
                    >
                      <rect x="-26" y="-11" width="52" height="22" rx="4" fill="#22c55e" stroke="#ffffff" strokeWidth="1" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.5))" />
                      <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="var(--font-mono)">
                        DONE ✓
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* LAYER 2: Supports */}
        <g className="supports-layer">
          {supports.map(support => {
            const joint = jointCoordMap.get(support.jointId);
            if (!joint) return null;

            const isSelected = selectedItem?.id === support.id;
            const size = 18;

            return (
              <g
                key={support.id}
                transform={`translate(${joint.x}, ${joint.y})`}
                className="support-group cursor-target"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === 'eraser') {
                    deleteItem('support', support.id);
                    return;
                  }
                  setSelectedItem({ type: 'support', id: support.id });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === 'eraser') {
                    deleteItem('support', support.id);
                    return;
                  }
                  const rect = svgRef.current.getBoundingClientRect();
                  const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                  setMenuState({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY,
                    targetType: 'joint',
                    targetId: support.jointId,
                    worldPos
                  });
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (activeTool === 'eraser') return;
                  const rect = svgRef.current.getBoundingClientRect();
                  const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                  setSelectedItem({ type: 'support', id: support.id });
                  setMenuState({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY,
                    targetType: 'joint',
                    targetId: support.jointId,
                    worldPos
                  });
                }}
              >
                {support.type === 'pivot' && (
                  // Pivot Point Support: Concentric Pivot Bearing + Fulcrum Stand + Ground Line + Hatching + Rotation freedom arc
                  <g className="pivot-support">
                    {/* Fulcrum stand */}
                    <polygon
                      points={`0,0 ${-size * 0.95},${size * 1.3} ${size * 0.95},${size * 1.3}`}
                      fill="var(--bp-bg-dark)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    {/* Ground line */}
                    <line x1={-size - 8} y1={size * 1.3} x2={size + 8} y2={size * 1.3} stroke="#38bdf8" strokeWidth="2" />
                    {/* Hatching box */}
                    <rect
                      x={-size - 8}
                      y={size * 1.3}
                      width={(size + 8) * 2}
                      height="8"
                      fill="url(#ground-hatch)"
                    />
                    {/* Pivot outer bearing ring */}
                    <circle cx="0" cy="0" r="6" fill="var(--bp-bg-dark)" stroke="#38bdf8" strokeWidth="2" />
                    {/* Pivot inner pin core */}
                    <circle cx="0" cy="0" r="2.5" fill="#38bdf8" />
                    {/* Reticle alignment crosshairs */}
                    <line x1="-8" y1="0" x2="8" y2="0" stroke="#38bdf8" strokeWidth="1" strokeDasharray="1.5 1.5" />
                    <line x1="0" y1="-8" x2="0" y2="8" stroke="#38bdf8" strokeWidth="1" strokeDasharray="1.5 1.5" />
                    {/* Free rotation arc indicator */}
                    <path d="M -9,-6 A 11 11 0 0 1 9,-6" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2.5 2" />
                  </g>
                )}

                {support.type === 'pin' && (
                  // Pin Support: Triangle + Ground Line + Hatching
                  <g className="pin-support">
                    {/* Triangle body */}
                    <polygon
                      points={`0,0 ${-size},${size * 1.3} ${size},${size * 1.3}`}
                      fill="var(--bp-bg-dark)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    <circle cx="0" cy="0" r="3.5" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" />
                    {/* Ground line */}
                    <line x1={-size - 8} y1={size * 1.3} x2={size + 8} y2={size * 1.3} stroke="#38bdf8" strokeWidth="2" />
                    {/* Hatching box */}
                    <rect
                      x={-size - 8}
                      y={size * 1.3}
                      width={(size + 8) * 2}
                      height="8"
                      fill="url(#ground-hatch)"
                    />
                  </g>
                )}

                {support.type === 'roller' && (
                  // Roller Support: Triangle + Roller balls + Ground Line + Hatching
                  <g className="roller-support">
                    {/* Triangle body */}
                    <polygon
                      points={`0,0 ${-size * 0.9},${size} ${size * 0.9},${size}`}
                      fill="var(--bp-bg-dark)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    <circle cx="0" cy="0" r="3" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" />
                    {/* Rollers */}
                    <circle cx={-size * 0.5} cy={size + 5} r="4" fill="var(--bp-bg-dark)" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle cx={size * 0.5} cy={size + 5} r="4" fill="var(--bp-bg-dark)" stroke="#38bdf8" strokeWidth="1.5" />
                    {/* Ground line */}
                    <line x1={-size - 8} y1={size + 9} x2={size + 8} y2={size + 9} stroke="#38bdf8" strokeWidth="2" />
                    {/* Hatching box */}
                    <rect
                      x={-size - 8}
                      y={size + 9}
                      width={(size + 8) * 2}
                      height="8"
                      fill="url(#ground-hatch)"
                    />
                  </g>
                )}

                {support.type === 'wall' && (
                  // Fixed Wall / Surface backing
                  <g className="wall-support">
                    <line x1="-12" y1="-18" x2="-12" y2="18" stroke="#38bdf8" strokeWidth="2.5" />
                    <line x1="-12" y1="0" x2="0" y2="0" stroke="#38bdf8" strokeWidth="2" />
                    <rect x="-24" y="-18" width="12" height="36" fill="url(#ground-hatch)" />
                    <circle cx="0" cy="0" r="3.5" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" />
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* LAYER 2.5: Solved Support Reactions */}
        {analysisResult?.solved && analysisResult?.solverResult?.reactionResults && (
          <g className="reactions-layer">
            {analysisResult.solverResult.reactionResults.map(rx => {
              const joint = jointCoordMap.get(rx.jointId);
              if (!joint || rx.magnitude < 0.001) return null;

              const arrowLen = 42;
              let x1 = joint.x;
              let y1 = joint.y;
              let x2 = joint.x;
              let y2 = joint.y;
              let badgeX = joint.x;
              let badgeY = joint.y;

              if (rx.axis === 'y') {
                if (rx.value >= 0) {
                  // Upwards reaction force (+y world = -y screen)
                  x1 = joint.x;
                  y1 = joint.y + arrowLen + 14;
                  x2 = joint.x;
                  y2 = joint.y + 12;
                  badgeX = joint.x + 30;
                  badgeY = joint.y + arrowLen / 2 + 14;
                } else {
                  // Downwards reaction force (-y world = +y screen)
                  x1 = joint.x;
                  y1 = joint.y - (arrowLen + 14);
                  x2 = joint.x;
                  y2 = joint.y - 12;
                  badgeX = joint.x + 30;
                  badgeY = joint.y - (arrowLen / 2 + 14);
                }
              } else {
                if (rx.value >= 0) {
                  // Rightwards reaction force (+x world = +x screen)
                  x1 = joint.x - (arrowLen + 14);
                  y1 = joint.y;
                  x2 = joint.x - 12;
                  y2 = joint.y;
                  badgeX = joint.x - (arrowLen / 2 + 14);
                  badgeY = joint.y - 16;
                } else {
                  // Leftwards reaction force (-x world = -x screen)
                  x1 = joint.x + (arrowLen + 14);
                  y1 = joint.y;
                  x2 = joint.x + 12;
                  y2 = joint.y;
                  badgeX = joint.x + (arrowLen / 2 + 14);
                  badgeY = joint.y - 16;
                }
              }

              return (
                <g key={`canvas_rx_${rx.id}`} className="canvas-reaction-vector" style={{ pointerEvents: 'none' }}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#34d399"
                    strokeWidth="2.5"
                    markerEnd="url(#rx-arrow-green)"
                  />
                  <g transform={`translate(${badgeX}, ${badgeY})`}>
                    <rect
                      x="-28"
                      y="-9"
                      width="56"
                      height="18"
                      rx="4"
                      fill="#06121f"
                      stroke="#34d399"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="3.5"
                      fill="#34d399"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {rx.label}={formatForce(rx.magnitude)}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        )}

        {/* LAYER 3: External Force Vectors */}
        <g className="forces-layer">
          {forces.map(force => {
            const joint = jointCoordMap.get(force.jointId);
            if (!joint) return null;

            const isSelected = selectedItem?.id === force.id;

            // In physics world, angle is measured CCW from +x axis.
            // Screen coordinates have Y flipped: screenAngle = -angle
            const rad = (force.angle * Math.PI) / 180;

            // If multiple forces on the same joint share the same angle, stagger their lengths so both are visible
            const sameJointSameAngle = forces.filter(
              f => f.jointId === force.jointId && Math.abs(((f.angle - force.angle) % 360 + 360) % 360) < 5
            );
            const dupIndex = sameJointSameAngle.findIndex(f => f.id === force.id);
            const arrowLen = 50 + (dupIndex > 0 ? dupIndex * 26 : 0);

            // Force vector originates away and points TOWARD joint, or vice versa.
            const jointRadius = 7;
            const headX = joint.x - jointRadius * Math.cos(rad);
            const headY = joint.y + jointRadius * Math.sin(rad);
            const tailX = joint.x - (arrowLen + jointRadius) * Math.cos(rad);
            const tailY = joint.y + (arrowLen + jointRadius) * Math.sin(rad);

            const isUnk = !!force.isUnknown;
            const solvedUf = analysisResult?.solverResult?.solvedUnknownForces?.find(
              s => s.id === force.id || s.jointId === force.jointId
            );
            const badgeColor = isUnk ? '#c084fc' : '#f87171';
            let labelStr = '';
            if (isUnk) {
              labelStr = solvedUf 
                ? `${force.targetLabel || 'P'} = ${formatForce(solvedUf.magnitude)} (Solved)`
                : `${force.targetLabel || 'P'} = ? (Target)`;
            } else {
              labelStr = formatForce(force.magnitude);
            }
            const badgeWidth = Math.max(54, labelStr.length * 7 + 16);

            return (
              <g
                key={force.id}
                className="force-group cursor-target"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === 'eraser') {
                    deleteItem('force', force.id);
                    return;
                  }
                  if (armedTool?.category === 'force') {
                    const initAngle = armedTool.angle !== undefined ? armedTool.angle : 270;
                    const mag = armedTool.isUnknown ? 0 : (armedTool.magnitude !== undefined ? armedTool.magnitude : 15);
                    updateForce(force.id, {
                      magnitude: mag,
                      angle: initAngle,
                      isUnknown: !!armedTool.isUnknown,
                      targetLabel: armedTool.targetLabel || 'P'
                    });
                    setSelectedItem({ type: 'force', id: force.id });
                    setArmedTool(null);
                    return;
                  }
                  setSelectedItem({ type: 'force', id: force.id });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === 'eraser') {
                    deleteItem('force', force.id);
                    return;
                  }
                  const rect = svgRef.current.getBoundingClientRect();
                  const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                  setMenuState({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY,
                    targetType: 'force',
                    targetId: force.id,
                    worldPos
                  });
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (activeTool === 'eraser') return;
                  const rect = svgRef.current.getBoundingClientRect();
                  const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                  setSelectedItem({ type: 'force', id: force.id });
                  setMenuState({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY,
                    targetType: 'force',
                    targetId: force.id,
                    worldPos
                  });
                }}
              >
                {/* Hitbox */}
                <line
                  x1={tailX}
                  y1={tailY}
                  x2={headX}
                  y2={headY}
                  stroke="transparent"
                  strokeWidth="16"
                />

                {/* Force Vector Arrow */}
                <line
                  x1={tailX}
                  y1={tailY}
                  x2={headX}
                  y2={headY}
                  stroke={badgeColor}
                  strokeWidth={isSelected ? 3.5 : 2.5}
                  strokeDasharray={isUnk ? '6 3' : 'none'}
                  markerEnd={isUnk ? 'url(#force-arrow-purple)' : 'url(#force-arrow)'}
                />

                {/* Magnitude / Target Label */}
                <g transform={`translate(${(tailX + joint.x) / 2}, ${(tailY + joint.y) / 2 - 8})`}>
                  <rect
                    x={-badgeWidth / 2}
                    y="-11"
                    width={badgeWidth}
                    height="18"
                    rx="3"
                    fill="var(--bp-bg-dark)"
                    stroke={badgeColor}
                    strokeWidth="1.2"
                  />
                  <text x="0" y="2" className="force-svg-label" fill={badgeColor} textAnchor="middle" fontWeight="bold">
                    {labelStr}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* LAYER 4: Joints (Nodes) */}
        <g className="joints-layer">
          {joints.map(joint => {
            const coords = jointCoordMap.get(joint.id);
            if (!coords) return null;

            const isSelected = selectedItem?.id === joint.id;
            const isSnapHighlight = isActivelySnapping && snapTarget?.id === joint.id;

            return (
              <g
                key={joint.id}
                transform={`translate(${coords.x}, ${coords.y})`}
                className="joint-group cursor-target"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === 'eraser') {
                    deleteItem('joint', joint.id);
                    return;
                  }
                  if (armedTool?.category === 'force') {
                    const initAngle = armedTool.angle !== undefined ? armedTool.angle : 270;
                    const mag = armedTool.isUnknown ? 0 : (armedTool.magnitude !== undefined ? armedTool.magnitude : 15);
                    const createdF = addForce(joint.id, mag, initAngle, !!armedTool.isUnknown, armedTool.targetLabel || 'P');
                    if (createdF?.id) {
                      setSelectedItem({ type: 'force', id: createdF.id });
                    }
                    setArmedTool(null);
                    return;
                  }
                  if (armedTool?.category === 'support') {
                    addSupport(joint.id, armedTool.id);
                    setArmedTool(null);
                    return;
                  }
                  setSelectedItem({ type: 'joint', id: joint.id });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === 'eraser') {
                    deleteItem('joint', joint.id);
                    return;
                  }
                  const rect = svgRef.current.getBoundingClientRect();
                  const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                  setMenuState({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY,
                    targetType: 'joint',
                    targetId: joint.id,
                    worldPos
                  });
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (activeTool === 'eraser') return;
                  const rect = svgRef.current.getBoundingClientRect();
                  const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                  setSelectedItem({ type: 'joint', id: joint.id });
                  setMenuState({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY,
                    targetType: 'joint',
                    targetId: joint.id,
                    worldPos
                  });
                }}
              >
                {/* Outer ring for selected or snap highlight */}
                {(isSelected || isSnapHighlight) && (
                  <circle
                    cx="0"
                    cy="0"
                    r={isSnapHighlight ? 16 : 12}
                    fill="none"
                    stroke={isSnapHighlight ? 'var(--bp-amber)' : 'var(--bp-cyan)'}
                    strokeWidth="2"
                    strokeDasharray={isSnapHighlight ? '3 3' : 'none'}
                    className={isSnapHighlight ? 'snap-pulsing-ring' : ''}
                  />
                )}

                {/* Joint pin circle */}
                <circle
                  cx="0"
                  cy="0"
                  r="6"
                  fill="var(--bp-bg-dark)"
                  stroke={isSelected ? '#ffffff' : 'var(--bp-cyan)'}
                  strokeWidth="2.5"
                  className="joint-circle"
                />
                <circle cx="0" cy="0" r="2" fill="var(--bp-cyan)" />

                {/* Joint Label Badge */}
                <g transform="translate(9, -9)">
                  <circle cx="0" cy="0" r="8" fill="var(--bp-cyan)" />
                  <text
                    x="0"
                    y="3"
                    className="joint-name-text"
                    textAnchor="middle"
                    fill="#0b132b"
                    fontWeight="bold"
                    fontSize="10"
                  >
                    {joint.label}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* Snap Halo Reticle when dragging */}
        {isActivelySnapping && snapTarget && (
          <g transform={`translate(${snapTarget.screenX}, ${snapTarget.screenY})`}>
            <circle cx="0" cy="0" r="20" fill="none" stroke="var(--bp-amber)" strokeWidth="2" strokeDasharray="4 2" />
            <circle cx="0" cy="0" r="8" fill="var(--bp-amber)" opacity="0.3" />
            <text x="0" y="32" className="snap-label" textAnchor="middle" fill="var(--bp-amber)">
              Snap to {snapTarget.type === 'member' ? `Member ${snapTarget.label}` : `Joint ${snapTarget.label}`}
            </text>
          </g>
        )}

        {/* LIVE SHADOWED GHOST DRAG PREVIEW */}
        {dragGhost?.active && dragGhost.item && (() => {
          const item = dragGhost.item;
          const ax = dragGhost.screenX;
          const ay = dragGhost.screenY;
          const z = viewTransform.zoom;

          // Member drag ghost (horizontal rod, vertical, sloped)
          if (item.category === 'member') {
            let lengthM = 3.0;
            let angleDeg = 0;
            let endX = ax;
            let endY = ay;

            if (item.id === 'horizontal') {
              lengthM = 3.0;
              angleDeg = 0;
              endX = ax + lengthM * z;
              endY = ay;
            } else if (item.id === 'vertical') {
              lengthM = 3.0;
              angleDeg = 90;
              endX = ax;
              endY = ay - lengthM * z; // Upwards in screen coordinates
            } else if (item.id === 'right-leaned') {
              lengthM = 3.5;
              angleDeg = 45;
              const rad = (45 * Math.PI) / 180;
              endX = ax + lengthM * Math.cos(rad) * z;
              endY = ay - lengthM * Math.sin(rad) * z;
            } else if (item.id === 'left-leaned') {
              lengthM = 3.5;
              angleDeg = 135;
              const rad = (135 * Math.PI) / 180;
              endX = ax + lengthM * Math.cos(rad) * z;
              endY = ay - lengthM * Math.sin(rad) * z;
            }

            const midX = (ax + endX) / 2;
            const midY = (ay + endY) / 2;

            return (
              <g className="ghost-drag-preview">
                {/* Outer shadow aura */}
                <line
                  x1={ax}
                  y1={ay}
                  x2={endX}
                  y2={endY}
                  stroke="rgba(56, 189, 248, 0.25)"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                {/* Dotted translucent rod */}
                <line
                  x1={ax}
                  y1={ay}
                  x2={endX}
                  y2={endY}
                  className="ghost-rod-line"
                />
                {/* Anchor node */}
                <circle
                  cx={ax}
                  cy={ay}
                  r="7"
                  className="ghost-node-circle"
                />
                {/* Endpoint node */}
                <circle
                  cx={endX}
                  cy={endY}
                  r="6"
                  className="ghost-node-circle"
                  opacity="0.8"
                />
                {/* Dimension & angle indicator badge */}
                <g transform={`translate(${midX}, ${midY - 14})`}>
                  <rect
                    x="-48"
                    y="-11"
                    width="96"
                    height="20"
                    rx="4"
                    fill="rgba(9, 14, 26, 0.92)"
                    stroke="var(--bp-cyan)"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="var(--bp-cyan)"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fontWeight="bold"
                  >
                    {formatLength(lengthM)} ({angleDeg}°)
                  </text>
                </g>
              </g>
            );
          }

          // Force drag ghost
          if (item.category === 'force') {
            const isUnk = !!item.isUnknown;
            const mag = item.magnitude !== undefined ? item.magnitude : 15;
            const fa = item.angle !== undefined ? item.angle : 270;
            const rad = (fa * Math.PI) / 180;
            const arrowLen = 55;
            const tailX = ax - arrowLen * Math.cos(rad);
            const tailY = ay + arrowLen * Math.sin(rad);
            const badgeColor = isUnk ? '#c084fc' : '#f87171';
            const markerUrl = isUnk ? 'url(#force-arrow-purple)' : 'url(#force-arrow)';
            const labelText = isUnk ? `${item.targetLabel || 'P'} = ? (${fa}°)` : `${formatForce(mag)} (${fa}°)`;
            const badgeWidth = Math.max(76, labelText.length * 7 + 16);

            return (
              <g className="ghost-drag-preview">
                {/* Outer glowing aura */}
                <line
                  x1={tailX}
                  y1={tailY}
                  x2={ax}
                  y2={ay}
                  stroke={isUnk ? 'rgba(192, 132, 252, 0.3)' : 'rgba(248, 113, 113, 0.3)'}
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Dashed force arrow line */}
                <line
                  x1={tailX}
                  y1={tailY}
                  x2={ax}
                  y2={ay}
                  stroke={badgeColor}
                  strokeWidth="3.5"
                  strokeDasharray="6 3"
                  markerEnd={markerUrl}
                />
                {/* Anchor halo */}
                <circle cx={ax} cy={ay} r="8" fill="none" stroke={badgeColor} strokeWidth="2" strokeDasharray="3 3" />
                {/* Value badge */}
                <g transform={`translate(${(tailX + ax) / 2}, ${(tailY + ay) / 2 - 14})`}>
                  <rect
                    x={-badgeWidth / 2}
                    y="-11"
                    width={badgeWidth}
                    height="20"
                    rx="4"
                    fill="rgba(9, 14, 26, 0.92)"
                    stroke={badgeColor}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={badgeColor}
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fontWeight="bold"
                  >
                    {labelText}
                  </text>
                </g>
              </g>
            );
          }

          // Support drag ghost
          if (item.category === 'support') {
            const size = 18;
            return (
              <g className="ghost-drag-preview" transform={`translate(${ax}, ${ay})`} opacity="0.85">
                <circle cx="0" cy="0" r="14" fill="none" stroke="var(--bp-cyan)" strokeWidth="1.5" strokeDasharray="3 3" />
                {item.id === 'pivot' && (
                  <g className="pivot-support">
                    <polygon points={`0,0 ${-size * 0.95},${size * 1.3} ${size * 0.95},${size * 1.3}`} fill="rgba(13,25,48,0.8)" stroke="#38bdf8" strokeWidth="2" />
                    <line x1={-size - 8} y1={size * 1.3} x2={size + 8} y2={size * 1.3} stroke="#38bdf8" strokeWidth="2" />
                    <circle cx="0" cy="0" r="6" fill="var(--bp-bg-dark)" stroke="#38bdf8" strokeWidth="2" />
                    <circle cx="0" cy="0" r="2.5" fill="#38bdf8" />
                    <line x1="-8" y1="0" x2="8" y2="0" stroke="#38bdf8" strokeWidth="1" strokeDasharray="1.5 1.5" />
                    <line x1="0" y1="-8" x2="0" y2="8" stroke="#38bdf8" strokeWidth="1" strokeDasharray="1.5 1.5" />
                    <path d="M -9,-6 A 11 11 0 0 1 9,-6" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2.5 2" />
                  </g>
                )}
                {item.id === 'pin' && (
                  <g className="pin-support">
                    <polygon points={`0,0 ${-size},${size * 1.3} ${size},${size * 1.3}`} fill="rgba(13,25,48,0.8)" stroke="#38bdf8" strokeWidth="2" />
                    <circle cx="0" cy="0" r="3.5" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1={-size - 8} y1={size * 1.3} x2={size + 8} y2={size * 1.3} stroke="#38bdf8" strokeWidth="2" />
                  </g>
                )}
                {item.id === 'roller' && (
                  <g className="roller-support">
                    <polygon points={`0,0 ${-size * 0.9},${size} ${size * 0.9},${size}`} fill="rgba(13,25,48,0.8)" stroke="#38bdf8" strokeWidth="2" />
                    <circle cx="0" cy="0" r="3" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle cx={-size * 0.5} cy={size + 5} r="3.5" fill="var(--bp-bg-dark)" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle cx={size * 0.5} cy={size + 5} r="3.5" fill="var(--bp-bg-dark)" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1={-size - 8} y1={size + 9} x2={size + 8} y2={size + 9} stroke="#38bdf8" strokeWidth="2" />
                  </g>
                )}
                {item.id === 'wall' && (
                  <g className="wall-support">
                    <line x1="-12" y1="-18" x2="-12" y2="18" stroke="#38bdf8" strokeWidth="2.5" />
                    <line x1="-12" y1="0" x2="0" y2="0" stroke="#38bdf8" strokeWidth="2" />
                    <circle cx="0" cy="0" r="3.5" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" />
                  </g>
                )}
                <g transform="translate(0, 36)">
                  <rect x="-42" y="-10" width="84" height="18" rx="3" fill="rgba(9, 14, 26, 0.92)" stroke="var(--bp-cyan)" strokeWidth="1" />
                  <text x="0" y="3" textAnchor="middle" fill="var(--bp-cyan)" fontSize="9" fontFamily="var(--font-mono)" fontWeight="bold">
                    {item.label || 'Support'}
                  </text>
                </g>
              </g>
            );
          }

          return null;
        })()}

        {/* LAYER 5: Active Free-Hand Interactive Placement */}
        {freeHandState.isActive && freeHandState.startJoint && freeHandState.currentPoint && (() => {
          const p1 = worldToScreen(freeHandState.startJoint.x, freeHandState.startJoint.y);
          const p2 = worldToScreen(freeHandState.currentPoint.x, freeHandState.currentPoint.y);
          const dx = freeHandState.currentPoint.x - freeHandState.startJoint.x;
          const dy = freeHandState.currentPoint.y - freeHandState.startJoint.y;
          const len = Math.hypot(dx, dy);
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          if (angle < 0) angle += 360;

          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const isSnapped = !!freeHandState.snapTarget;

          return (
            <g className="freehand-active-layer" style={{ pointerEvents: 'none' }}>
              {/* Outer pulsating aura */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isSnapped ? "rgba(52, 211, 153, 0.3)" : "rgba(56, 189, 248, 0.3)"}
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Dynamic Member Elastic Line */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isSnapped ? "#34d399" : "#38bdf8"}
                strokeWidth="3.5"
                strokeDasharray="6 3"
                strokeLinecap="round"
              />

              {/* Fixed Start Pivot Node */}
              <circle cx={p1.x} cy={p1.y} r="14" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx={p1.x} cy={p1.y} r="5" fill="#facc15" />
              <g transform={`translate(${p1.x}, ${p1.y - 18})`}>
                <rect x="-38" y="-9" width="76" height="18" rx="3" fill="rgba(9, 14, 26, 0.95)" stroke="#facc15" strokeWidth="1" />
                <text x="0" y="3.5" fill="#facc15" fontSize="8.5" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">
                  FIXED PIVOT
                </text>
              </g>

              {/* Moving / Snapping Endpoint Reticle (Stationary Focus) */}
              <circle
                cx={p2.x}
                cy={p2.y}
                r={isSnapped ? 16 : 12}
                fill="none"
                stroke={isSnapped ? '#34d399' : '#38bdf8'}
                strokeWidth="2"
                strokeDasharray={isSnapped ? '4 2' : 'none'}
              />
              <circle cx={p2.x} cy={p2.y} r="4" fill={isSnapped ? '#34d399' : '#38bdf8'} />

              {/* Real-time Dimension HUD */}
              <g transform={`translate(${midX}, ${midY - 18})`}>
                <rect
                  x="-62"
                  y="-14"
                  width="124"
                  height="28"
                  rx="6"
                  fill="rgba(9, 14, 26, 0.96)"
                  stroke={isSnapped ? '#34d399' : 'var(--bp-cyan)'}
                  strokeWidth="1.5"
                  filter="drop-shadow(0 4px 10px rgba(0,0,0,0.6))"
                />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold">
                  {len.toFixed(2)} m ({angle.toFixed(1)}°)
                </text>
              </g>

              {/* Action Prompt Banner */}
              <g transform={`translate(${p2.x}, ${p2.y + 26})`}>
                <rect x="-76" y="-9" width="152" height="18" rx="3" fill="rgba(15, 25, 46, 0.95)" stroke={isSnapped ? '#34d399' : 'var(--bp-border)'} strokeWidth="1" />
                <text x="0" y="3.5" textAnchor="middle" fill={isSnapped ? '#34d399' : 'var(--bp-cyan)'} fontSize="8.5" fontFamily="var(--font-mono)">
                  {isSnapped ? `✓ Snap to ${freeHandState.snapTarget.label || freeHandState.snapTarget.type} • Click to Lock` : 'Click to Lock • Esc to Cancel'}
                </text>
              </g>
            </g>
          );
        })()}

        {/* Animated Sweep Eraser Brush Cursor */}
        {activeTool === 'eraser' && eraserPos && (
          <g
            className="eraser-brush-cursor"
            transform={`translate(${eraserPos.x}, ${eraserPos.y})`}
            style={{ pointerEvents: 'none' }}
          >
            <circle
              r={isErasingActive ? 22 : 18}
              fill={isErasingActive ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.12)'}
              stroke="#ef4444"
              strokeWidth={isErasingActive ? 2.5 : 1.5}
              strokeDasharray={isErasingActive ? 'none' : '4 3'}
              className={isErasingActive ? 'eraser-ring-active' : 'eraser-ring-idle'}
            />
            <circle r={2.5} fill="#ef4444" />
            {isErasingActive && (
              <g transform="translate(24, 4)">
                <rect x="-4" y="-10" width="62" height="15" rx="3" fill="rgba(15, 23, 42, 0.95)" stroke="#ef4444" strokeWidth="1" />
                <text x="2" y="2" fill="#fca5a5" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  ERASING
                </text>
              </g>
            )}
          </g>
        )}
      </svg>

      {/* Custom Double-Click In-Place Context Menu */}
      <CanvasContextMenu
        menuState={menuState}
        onClose={() => setMenuState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
