import React, { useState, useRef, useEffect } from 'react';
import { useTruss } from '../context/TrussContext';
import {
  Minus,
  MoveVertical,
  TrendingUp,
  TrendingDown,
  CircleDot,
  Triangle,
  Layers,
  ArrowDownCircle,
  Trash2,
  HelpCircle,
  MousePointer,
  Eraser,
  Compass,
  Cpu,
  Sparkles,
  Zap,
  Target,
  X,
  Play,
  ChevronDown,
  ChevronRight,
  FolderOpen
} from 'lucide-react';

const ALL_MEMBER_TOOLS = [
  {
    id: 'freehand',
    category: 'member',
    label: 'Free-Hand Member',
    subtext: 'Free angle & length',
    shortcut: 'D',
    icon: <Compass size={15} />,
    badge: '★ Free'
  },
  {
    id: 'horizontal',
    category: 'member',
    label: '0° Horizontal Truss',
    subtext: '0° horizontal bar',
    shortcut: 'H',
    icon: <Minus size={15} />,
    badge: '0°'
  },
  {
    id: 'vertical',
    category: 'member',
    label: '90° Vertical Truss',
    subtext: '90° vertical strut',
    shortcut: 'V',
    icon: <MoveVertical size={15} />,
    badge: '90°'
  },
  {
    id: 'right-leaned',
    category: 'member',
    label: '+θ Right-Leaned',
    subtext: '+θ slope up-right',
    shortcut: '',
    icon: <TrendingUp size={15} />,
    badge: '+θ'
  },
  {
    id: 'left-leaned',
    category: 'member',
    label: '-θ Left-Leaned',
    subtext: '-θ slope up-left',
    shortcut: '',
    icon: <TrendingDown size={15} />,
    badge: '-θ'
  }
];

export default function Toolbox() {
  const {
    loadPreset,
    clearCanvas,
    joints,
    members,
    forces,
    selectedItem,
    updateForce,
    activeTool,
    setActiveTool,
    armedTool,
    setArmedTool,
    structureMode,
    setStructureMode,
    lengthUnit,
    forceUnit,
    toInternalForce,
    fromInternalForce,
    runAnalysis
  } = useTruss();

  const [forceMag, setForceMag] = useState('15');
  const [forceAngle, setForceAngle] = useState(270);
  const [presetsExpanded, setPresetsExpanded] = useState(false);

  // Identify currently selected force or force attached to selected joint
  const selectedForce = selectedItem?.type === 'force'
    ? forces.find(f => f.id === selectedItem.id)
    : (selectedItem?.type === 'joint' ? forces.find(f => f.jointId === selectedItem.id) : null);

  // Sync inputs with selected force whenever selection changes
  useEffect(() => {
    if (selectedForce) {
      const magDisplay = fromInternalForce(selectedForce.magnitude);
      setForceMag(String(Math.round(magDisplay * 100) / 100));
      setForceAngle(selectedForce.angle !== undefined ? selectedForce.angle : 270);
    }
  }, [selectedForce?.id, selectedForce?.magnitude, selectedForce?.angle, fromInternalForce]);

  // Sync forceMag display when forceUnit toggles
  const prevForceUnitRef = useRef(forceUnit);
  useEffect(() => {
    if (prevForceUnitRef.current !== forceUnit) {
      if (forceUnit === 'N' && prevForceUnitRef.current === 'kN') {
        const val = (parseFloat(forceMag) || 15) * 1000;
        setForceMag(String(Math.round(val)));
      } else if (forceUnit === 'kN' && prevForceUnitRef.current === 'N') {
        const val = (parseFloat(forceMag) || 15000) / 1000;
        setForceMag(String(Math.round(val * 100) / 100));
      }
      prevForceUnitRef.current = forceUnit;
    }
  }, [forceUnit, forceMag]);

  // Handler for changing force magnitude with live update to armed tool and selected force
  const handleMagChange = (valStr) => {
    setForceMag(valStr);
    const num = parseFloat(valStr);
    const magInternal = toInternalForce(isNaN(num) ? 0 : num);

    // 1. Live update armed tool if armed
    if (armedTool && (armedTool.id === 'force' || armedTool.category === 'force')) {
      setArmedTool(prev => prev ? { ...prev, magnitude: magInternal } : prev);
    }

    // 2. Live update selected force on canvas
    if (selectedForce) {
      updateForce(selectedForce.id, { magnitude: magInternal });
    }
  };

  // Handler for changing force angle with live update to armed tool and selected force
  const handleAngleChange = (newAngle) => {
    setForceAngle(newAngle);

    // 1. Live update armed tool if armed
    if (armedTool && (armedTool.id === 'force' || armedTool.category === 'force')) {
      setArmedTool(prev => prev ? { ...prev, angle: newAngle } : prev);
    }

    // 2. Live update selected force on canvas
    if (selectedForce) {
      updateForce(selectedForce.id, { angle: newAngle });
    }
  };

  const handleItemClick = (item) => {
    let payload = { ...item };
    if (item.id === 'force') {
      const magInternal = toInternalForce(parseFloat(forceMag) || (forceUnit === 'N' ? 15000 : 15));
      payload.magnitude = magInternal;
      payload.angle = forceAngle;
      payload.isUnknown = false;

      // If a force is selected, immediately apply changes to it
      if (selectedForce) {
        updateForce(selectedForce.id, { magnitude: magInternal, angle: forceAngle, isUnknown: false });
      }
    } else if (item.id === 'unknown-force') {
      payload.magnitude = 0;
      payload.angle = forceAngle;
      payload.isUnknown = true;
      payload.targetLabel = 'P';

      if (selectedForce) {
        updateForce(selectedForce.id, { magnitude: 0, angle: forceAngle, isUnknown: true, targetLabel: 'P' });
      }
    }

    if (armedTool && armedTool.id === item.id) {
      setArmedTool(null);
    } else {
      setArmedTool(payload);
      setActiveTool('select');
    }
  };

  const handleDragStart = (e, item) => {
    let payload = { ...item };
    if (item.id === 'force') {
      const magInternal = toInternalForce(parseFloat(forceMag) || (forceUnit === 'N' ? 15000 : 15));
      payload.magnitude = magInternal;
      payload.angle = forceAngle;
      payload.isUnknown = false;
    } else if (item.id === 'unknown-force') {
      payload.magnitude = 0;
      payload.angle = forceAngle;
      payload.isUnknown = true;
      payload.targetLabel = 'P';
    }

    window.__currentDragItem = payload;
    e.dataTransfer.setData('application/z-truss-item', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';

    try {
      const blankImg = new Image();
      blankImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
      e.dataTransfer.setDragImage(blankImg, 0, 0);
    } catch (err) {}
  };

  const handleDragEnd = () => {
    window.__currentDragItem = null;
  };

  return (
    <aside className="toolbox-sidebar">
      {/* 1. Header with Status & Stats */}
      <div className="toolbox-header-compact">
        <div className="toolbox-header-left">
          <span className="toolbox-header-title">TOOLBOX</span>
          <span className="toolbox-cad-tag">CAD</span>
        </div>
        <div className="toolbox-header-stats">
          <span>{joints.length}J</span>
          <span>•</span>
          <span>{members.length}M</span>
        </div>
      </div>

      {/* 2. ARMED TOOL ALERT BANNER (Active when any tool is armed) */}
      {armedTool && (
        <div className="sidebar-armed-card">
          <div className="sidebar-armed-top">
            <div className="sidebar-armed-label-wrap">
              <span className="armed-pulsing-badge">● ARMED</span>
              <span className="sidebar-armed-name">{armedTool.label}</span>
            </div>
            <button
              type="button"
              className="sidebar-armed-cancel-btn cursor-target"
              onClick={() => setArmedTool(null)}
              title="Disarm tool (Esc)"
            >
              <X size={12} />
              <span>Esc</span>
            </button>
          </div>
          <p className="sidebar-armed-desc">
            {armedTool.category === 'member'
              ? 'Click canvas to set start joint, then click to lock end.'
              : armedTool.category === 'support'
              ? 'Click joint on canvas to attach support.'
              : 'Click joint to apply load vector.'}
          </p>
        </div>
      )}

      {/* 3. Scrollable Tools Content */}
      <div className="toolbox-scrollable-content">
        {/* WORKSPACE TOOLS */}
        <div className="toolbox-section">
          <div className="toolbox-section-label">WORKSPACE</div>
          <div className="toolbox-mini-row">
            <button
              type="button"
              className={`toolbox-action-btn cursor-target ${activeTool === 'select' && !armedTool ? 'active' : ''}`}
              onClick={() => {
                setActiveTool('select');
                setArmedTool(null);
              }}
              title="Select & Move elements"
            >
              <MousePointer size={14} />
              <span>Select</span>
            </button>

            <button
              type="button"
              className={`toolbox-action-btn eraser-btn cursor-target ${activeTool === 'eraser' ? 'active' : ''}`}
              onClick={() => {
                setActiveTool(prev => {
                  const next = prev === 'eraser' ? 'select' : 'eraser';
                  if (next === 'eraser') setArmedTool(null);
                  return next;
                });
              }}
              title="Sweep Eraser [E] — Drag across elements"
            >
              <Eraser size={14} />
              <span>Eraser</span>
              <span className="toolbox-key-badge">E</span>
            </button>

            <button
              type="button"
              className="toolbox-action-btn clear-btn cursor-target"
              onClick={clearCanvas}
              disabled={joints.length === 0 && members.length === 0}
              title="Clear Canvas"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* MEMBERS */}
        <div className="toolbox-section">
          <div className="toolbox-section-label">MEMBERS</div>
          <div className="toolbox-grid-2col">
            {/* Draw Free-Hand [D] (Full width) */}
            <button
              type="button"
              className={`toolbox-card-btn col-span-2 cursor-target ${armedTool?.id === 'freehand' ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, ALL_MEMBER_TOOLS[0])}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick(ALL_MEMBER_TOOLS[0])}
              title="Draw Free-Hand Member [D] — Click to arm or drag onto canvas"
            >
              <div className="toolbox-btn-icon-wrap cyan">
                <Compass size={15} />
              </div>
              <div className="toolbox-btn-info">
                <span className="toolbox-btn-title">Free-Hand Draw</span>
                <span className="toolbox-btn-sub">Any angle & length</span>
              </div>
              <span className="toolbox-key-badge">D</span>
              {armedTool?.id === 'freehand' && <span className="toolbox-armed-dot" />}
            </button>

            {/* Horizontal 0° [H] */}
            <button
              type="button"
              className={`toolbox-card-btn cursor-target ${armedTool?.id === 'horizontal' ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, ALL_MEMBER_TOOLS[1])}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick(ALL_MEMBER_TOOLS[1])}
              title="0° Horizontal Member [H]"
            >
              <div className="toolbox-btn-icon-wrap">
                <Minus size={14} />
              </div>
              <div className="toolbox-btn-info">
                <span className="toolbox-btn-title">0° Horiz</span>
              </div>
              <span className="toolbox-key-badge">H</span>
              {armedTool?.id === 'horizontal' && <span className="toolbox-armed-dot" />}
            </button>

            {/* Vertical 90° [V] */}
            <button
              type="button"
              className={`toolbox-card-btn cursor-target ${armedTool?.id === 'vertical' ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, ALL_MEMBER_TOOLS[2])}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick(ALL_MEMBER_TOOLS[2])}
              title="90° Vertical Strut [V]"
            >
              <div className="toolbox-btn-icon-wrap">
                <MoveVertical size={14} />
              </div>
              <div className="toolbox-btn-info">
                <span className="toolbox-btn-title">90° Vert</span>
              </div>
              <span className="toolbox-key-badge">V</span>
              {armedTool?.id === 'vertical' && <span className="toolbox-armed-dot" />}
            </button>

            {/* Right-Leaned +θ */}
            <button
              type="button"
              className={`toolbox-card-btn cursor-target ${armedTool?.id === 'right-leaned' ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, ALL_MEMBER_TOOLS[3])}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick(ALL_MEMBER_TOOLS[3])}
              title="+θ Slope Up-Right"
            >
              <div className="toolbox-btn-icon-wrap">
                <TrendingUp size={14} />
              </div>
              <div className="toolbox-btn-info">
                <span className="toolbox-btn-title">+θ Up-R</span>
              </div>
              <span className="toolbox-key-badge">+θ</span>
              {armedTool?.id === 'right-leaned' && <span className="toolbox-armed-dot" />}
            </button>

            {/* Left-Leaned -θ */}
            <button
              type="button"
              className={`toolbox-card-btn cursor-target ${armedTool?.id === 'left-leaned' ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, ALL_MEMBER_TOOLS[4])}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick(ALL_MEMBER_TOOLS[4])}
              title="-θ Slope Up-Left"
            >
              <div className="toolbox-btn-icon-wrap">
                <TrendingDown size={14} />
              </div>
              <div className="toolbox-btn-info">
                <span className="toolbox-btn-title">-θ Up-L</span>
              </div>
              <span className="toolbox-key-badge">-θ</span>
              {armedTool?.id === 'left-leaned' && <span className="toolbox-armed-dot" />}
            </button>
          </div>
        </div>

        {/* SUPPORTS */}
        <div className="toolbox-section">
          <div className="toolbox-section-label">SUPPORTS</div>
          <div className="toolbox-grid-2col">
            {/* Pin Support [P] */}
            <button
              type="button"
              className={`toolbox-card-btn support-btn cursor-target ${armedTool?.id === 'pin' ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, { id: 'pin', category: 'support', label: 'Pin Support', subtext: 'Pin support (r=2)', badge: 'r=2' })}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick({ id: 'pin', category: 'support', label: 'Pin Support', subtext: 'Pin support (r=2)', badge: 'r=2' })}
              title="Pin Support [P] (r=2)"
            >
              <div className="toolbox-btn-icon-wrap amber">
                <Triangle size={14} />
              </div>
              <div className="toolbox-btn-info">
                <span className="toolbox-btn-title">Pin</span>
                <span className="toolbox-btn-sub">r=2</span>
              </div>
              <span className="toolbox-key-badge amber">P</span>
              {armedTool?.id === 'pin' && <span className="toolbox-armed-dot" />}
            </button>

            {/* Roller Support [R] */}
            <button
              type="button"
              className={`toolbox-card-btn support-btn cursor-target ${armedTool?.id === 'roller' ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, { id: 'roller', category: 'support', label: 'Roller Support', subtext: 'Roller support (r=1)', badge: 'r=1' })}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick({ id: 'roller', category: 'support', label: 'Roller Support', subtext: 'Roller support (r=1)', badge: 'r=1' })}
              title="Roller Support [R] (r=1)"
            >
              <div className="toolbox-btn-icon-wrap amber">
                <CircleDot size={14} />
              </div>
              <div className="toolbox-btn-info">
                <span className="toolbox-btn-title">Roller</span>
                <span className="toolbox-btn-sub">r=1</span>
              </div>
              <span className="toolbox-key-badge amber">R</span>
              {armedTool?.id === 'roller' && <span className="toolbox-armed-dot" />}
            </button>

            {/* Pivot Support */}
            <button
              type="button"
              className={`toolbox-card-btn support-btn cursor-target ${armedTool?.id === 'pivot' ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, { id: 'pivot', category: 'support', label: 'Pivot Point', subtext: 'Fulcrum pivot (r=2)', badge: 'r=2' })}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick({ id: 'pivot', category: 'support', label: 'Pivot Point', subtext: 'Fulcrum pivot (r=2)', badge: 'r=2' })}
              title="Pivot Fulcrum (r=2)"
            >
              <div className="toolbox-btn-icon-wrap amber">
                <Target size={14} />
              </div>
              <div className="toolbox-btn-info">
                <span className="toolbox-btn-title">Pivot</span>
                <span className="toolbox-btn-sub">Fulcrum</span>
              </div>
              <span className="toolbox-key-badge amber">r=2</span>
              {armedTool?.id === 'pivot' && <span className="toolbox-armed-dot" />}
            </button>

            {/* Wall / Ground */}
            <button
              type="button"
              className={`toolbox-card-btn support-btn cursor-target ${armedTool?.id === 'wall' ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, { id: 'wall', category: 'support', label: 'Wall Surface', subtext: 'Fixed boundary (r=2)', badge: 'r=2' })}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick({ id: 'wall', category: 'support', label: 'Wall Surface', subtext: 'Fixed boundary (r=2)', badge: 'r=2' })}
              title="Fixed Wall/Ground (r=2)"
            >
              <div className="toolbox-btn-icon-wrap amber">
                <Layers size={14} />
              </div>
              <div className="toolbox-btn-info">
                <span className="toolbox-btn-title">Wall</span>
                <span className="toolbox-btn-sub">Ground</span>
              </div>
              <span className="toolbox-key-badge amber">r=2</span>
              {armedTool?.id === 'wall' && <span className="toolbox-armed-dot" />}
            </button>
          </div>
        </div>

        {/* FORCES / LOADS */}
        <div className="toolbox-section">
          <div className="toolbox-section-label">LOADS & FORCES</div>

          {/* Active selection feedback */}
          {selectedForce && (
            <div className="toolbox-force-selected-indicator">
              <span className="dot">●</span>
              <span>Editing Load at Joint {joints.find(j => j.id === selectedForce.jointId)?.label || ''}</span>
            </div>
          )}

          <div className="toolbox-grid-2col">
            {/* Known Point Load [F] */}
            <button
              type="button"
              className={`toolbox-card-btn force-btn cursor-target ${armedTool?.id === 'force' ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, { id: 'force', category: 'force', label: 'Known Force' })}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick({ id: 'force', category: 'force', label: 'Known Force' })}
              title="Known External Load [F] — Click to arm or drag onto joint"
            >
              <div className="toolbox-btn-icon-wrap red">
                <ArrowDownCircle size={14} />
              </div>
              <div className="toolbox-btn-info">
                <span className="toolbox-btn-title">Load [F]</span>
                <span className="toolbox-btn-sub">{forceMag} {forceUnit}</span>
              </div>
              <span className="toolbox-key-badge red">F</span>
              {armedTool?.id === 'force' && <span className="toolbox-armed-dot" />}
            </button>

            {/* Unknown Solve-For Load [?] */}
            <button
              type="button"
              className={`toolbox-card-btn force-btn cursor-target ${armedTool?.id === 'unknown-force' ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, { id: 'unknown-force', category: 'force', label: 'Unknown Force' })}
              onDragEnd={handleDragEnd}
              onClick={() => handleItemClick({ id: 'unknown-force', category: 'force', label: 'Unknown Force' })}
              title="Unknown Force Target (P) — Click to arm or drag onto joint"
            >
              <div className="toolbox-btn-icon-wrap purple">
                <HelpCircle size={14} />
              </div>
              <div className="toolbox-btn-info">
                <span className="toolbox-btn-title">Target P</span>
                <span className="toolbox-btn-sub">Solve-For</span>
              </div>
              <span className="toolbox-key-badge purple">?</span>
              {armedTool?.id === 'unknown-force' && <span className="toolbox-armed-dot" />}
            </button>
          </div>

          {/* Inline Magnitude & Direction Chips */}
          <div className="toolbox-force-adjuster-box">
            <div className="toolbox-force-input-row">
              <span className="toolbox-sub-lbl">MAGNITUDE</span>
              <div className="toolbox-mag-input-wrap">
                <input
                  type="number"
                  min="0.1"
                  step={forceUnit === 'N' ? '1000' : '5'}
                  value={forceMag}
                  onChange={(e) => handleMagChange(e.target.value)}
                  className="toolbox-num-input"
                />
                <span className="toolbox-unit-tag">{forceUnit}</span>
              </div>
            </div>

            <div className="toolbox-dir-row">
              <span className="toolbox-sub-lbl">DIRECTION</span>
              <div className="toolbox-dir-chips">
                <button
                  type="button"
                  className={`toolbox-dir-chip ${forceAngle === 270 ? 'active' : ''}`}
                  onClick={() => handleAngleChange(270)}
                  title="270° Downward"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={`toolbox-dir-chip ${forceAngle === 90 ? 'active' : ''}`}
                  onClick={() => handleAngleChange(90)}
                  title="90° Upward"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={`toolbox-dir-chip ${forceAngle === 0 ? 'active' : ''}`}
                  onClick={() => handleAngleChange(0)}
                  title="0° Rightward"
                >
                  →
                </button>
                <button
                  type="button"
                  className={`toolbox-dir-chip ${forceAngle === 180 ? 'active' : ''}`}
                  onClick={() => handleAngleChange(180)}
                  title="180° Leftward"
                >
                  ←
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* EQUILIBRIUM SOLVER */}
        <div className="toolbox-section">
          <div className="toolbox-section-label">EQUILIBRIUM SOLVER</div>
          {/* Mode Selector 4-Pill */}
          <div className="toolbox-mode-pills">
            <button
              type="button"
              className={`toolbox-mode-pill cursor-target ${structureMode === 'auto' ? 'active' : ''}`}
              onClick={() => setStructureMode('auto')}
              title="Smart Auto-Detect"
            >
              <Sparkles size={11} />
              <span>Auto</span>
            </button>
            <button
              type="button"
              className={`toolbox-mode-pill cursor-target ${structureMode === 'truss' ? 'active' : ''}`}
              onClick={() => setStructureMode('truss')}
              title="Truss Mode (Axial Method of Joints)"
            >
              <Zap size={11} />
              <span>Truss</span>
            </button>
            <button
              type="button"
              className={`toolbox-mode-pill cursor-target ${structureMode === 'frame' ? 'active' : ''}`}
              onClick={() => setStructureMode('frame')}
              title="Frame Mode (Shear & Moment)"
            >
              <Layers size={11} />
              <span>Frame</span>
            </button>
            <button
              type="button"
              className={`toolbox-mode-pill cursor-target ${structureMode === 'machine' ? 'active' : ''}`}
              onClick={() => setStructureMode('machine')}
              title="Machine Mode (Mechanical Adv.)"
            >
              <Cpu size={11} />
              <span>Mach</span>
            </button>
          </div>

          {/* Primary Solve Action Button */}
          <button
            type="button"
            className="toolbox-primary-analyze-btn cursor-target"
            onClick={() => runAnalysis && runAnalysis()}
            title="Solve Structure Equilibrium [Enter]"
          >
            <Play size={14} fill="currentColor" />
            <span>ANALYZE EQUILIBRIUM</span>
            <span className="toolbox-enter-badge">↵</span>
          </button>
        </div>

        {/* BENCHMARK PRESETS (Collapsible Accordion) */}
        <div className="toolbox-section presets-section">
          <button
            type="button"
            className="toolbox-presets-toggle cursor-target"
            onClick={() => setPresetsExpanded(prev => !prev)}
          >
            <div className="toolbox-presets-toggle-left">
              <FolderOpen size={13} className="text-cyan" />
              <span className="toolbox-section-label" style={{ margin: 0 }}>BENCHMARK PRESETS</span>
            </div>
            {presetsExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>

          {presetsExpanded && (
            <div className="toolbox-presets-dropdown">
              <div className="toolbox-preset-category">Trusses</div>
              <button
                type="button"
                className="toolbox-preset-row cursor-target"
                onClick={() => loadPreset('triangle')}
              >
                <span className="preset-name">Simple Triangle</span>
                <span className="preset-sub">3 bars • Determinate</span>
              </button>
              <button
                type="button"
                className="toolbox-preset-row cursor-target"
                onClick={() => loadPreset('warren')}
              >
                <span className="preset-name">Warren Truss</span>
                <span className="preset-sub">7 bars • 5 joints</span>
              </button>
              <button
                type="button"
                className="toolbox-preset-row cursor-target"
                onClick={() => loadPreset('pratt')}
              >
                <span className="preset-name">Pratt Truss</span>
                <span className="preset-sub">9 bars • Zero-force</span>
              </button>

              <div className="toolbox-preset-category">Frames</div>
              <button
                type="button"
                className="toolbox-preset-row cursor-target"
                onClick={() => loadPreset('a-frame')}
              >
                <span className="preset-name">A-Frame Structure</span>
                <span className="preset-sub">Multi-force • Tie-rod</span>
              </button>
              <button
                type="button"
                className="toolbox-preset-row cursor-target"
                onClick={() => loadPreset('portal-frame')}
              >
                <span className="preset-name">Portal Frame</span>
                <span className="preset-sub">Columns & crossbeam</span>
              </button>

              <div className="toolbox-preset-category">Machines</div>
              <button
                type="button"
                className="toolbox-preset-row cursor-target"
                onClick={() => loadPreset('toggle-clamp')}
              >
                <span className="preset-name">Toggle Clamp</span>
                <span className="preset-sub">High Mech. Advantage</span>
              </button>
              <button
                type="button"
                className="toolbox-preset-row cursor-target"
                onClick={() => loadPreset('pliers')}
              >
                <span className="preset-name">Cutting Pliers</span>
                <span className="preset-sub">Pivot pin mechanism</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
