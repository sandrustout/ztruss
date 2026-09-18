import React, { useState, useEffect, useMemo } from 'react';
import { useTruss } from '../context/TrussContext';
import { Ruler, Compass, ArrowRight, ArrowDown, ArrowUp, ArrowLeft, Check, X, HelpCircle } from 'lucide-react';

export default function PrecisionModal() {
  const {
    modalState,
    handleModalConfirm,
    handleModalCancel,
    lengthUnit,
    forceUnit,
    toInternalLength,
    toInternalForce,
    fromInternalLength,
    fromInternalForce
  } = useTruss();
  const { isOpen, itemType, startJoint } = modalState;

  // Form field states
  const [length, setLength] = useState('3.0');
  const [direction, setDirection] = useState('up'); // 'up' | 'down' for vertical
  const [horizontalDir, setHorizontalDir] = useState('right'); // 'right' | 'left'
  const [verticalSlope, setVerticalSlope] = useState('up'); // 'up' | 'down' for leaned
  const [angle, setAngle] = useState('45'); // degrees
  const [magnitude, setMagnitude] = useState('10.0');
  const [forceAngle, setForceAngle] = useState('270'); // degrees (270 = downward)
  const [isUnknown, setIsUnknown] = useState(false);
  const [targetLabel, setTargetLabel] = useState('P');

  // Reset defaults whenever modal opens with new item
  useEffect(() => {
    if (isOpen) {
      if (itemType === 'horizontal') {
        setLength(lengthUnit === 'cm' ? '300' : '3.0');
        setHorizontalDir('right');
      } else if (itemType === 'vertical') {
        setLength(lengthUnit === 'cm' ? '300' : '3.0');
        setDirection('up');
      } else if (itemType === 'right-leaned' || itemType === 'left-leaned') {
        setLength(lengthUnit === 'cm' ? '350' : '3.5');
        setAngle('45');
        setVerticalSlope('up');
      } else if (itemType === 'unknown-force' || modalState.isUnknown) {
        setIsUnknown(true);
        setTargetLabel(modalState.targetLabel || 'P');
        setForceAngle(modalState.initialAngle !== undefined ? String(modalState.initialAngle) : '270');
        setMagnitude(forceUnit === 'N' ? '15000' : '15.0');
      } else if (itemType === 'force') {
        setIsUnknown(false);
        const initMag = modalState.initialMagnitude !== undefined
          ? fromInternalForce(modalState.initialMagnitude)
          : (forceUnit === 'N' ? 15000 : 15.0);
        setMagnitude(String(initMag));
        setForceAngle(modalState.initialAngle !== undefined ? String(modalState.initialAngle) : '270');
      }
    }
  }, [isOpen, itemType, modalState.initialMagnitude, modalState.initialAngle, modalState.isUnknown, modalState.targetLabel, lengthUnit, forceUnit, fromInternalForce]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleModalCancel();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!isOpen) return null;

  const onConfirm = () => {
    if (itemType === 'force' || itemType === 'unknown-force') {
      const mag = isUnknown ? 0 : Math.max(0.01, Math.abs(parseFloat(magnitude)) || (forceUnit === 'N' ? 1000 : 10));
      const fa = ((parseFloat(forceAngle) || 270) % 360 + 360) % 360;
      handleModalConfirm({
        magnitude: mag,
        angle: fa,
        isUnknown,
        targetLabel: targetLabel.trim() || 'P'
      });
    } else {
      const minLen = lengthUnit === 'cm' ? 10 : 0.1;
      const len = Math.max(minLen, Math.abs(parseFloat(length)) || (lengthUnit === 'cm' ? 100 : 1));
      const ang = Math.min(89, Math.max(1, Math.abs(parseFloat(angle)) || 45));
      handleModalConfirm({
        length: len,
        direction,
        horizontalDir,
        verticalSlope,
        angle: ang
      });
    }
  };

  const isForceType = itemType === 'force' || itemType === 'unknown-force';

  // Human-readable titles & icons
  const modalInfo = {
    'horizontal': { title: 'Horizontal Truss Member', icon: '—' },
    'vertical': { title: 'Vertical Truss Member', icon: '|' },
    'right-leaned': { title: 'Right-Leaned Truss Member', icon: '/' },
    'left-leaned': { title: 'Left-Leaned Truss Member', icon: '\\' },
    'force': {
      title: isUnknown ? 'Unknown Target Force (?)' : 'External Load Vector',
      icon: isUnknown ? '?' : '↓'
    },
    'unknown-force': {
      title: 'Unknown Target Force (?)',
      icon: '?'
    }
  }[itemType] || { title: 'Truss Element', icon: '•' };

  // Calculate live preview vector for SVG canvas inside modal
  const previewVector = () => {
    const cx = 50;
    const cy = 50;
    const r = 32;

    if (itemType === 'horizontal') {
      const dx = horizontalDir === 'right' ? r : -r;
      return { x1: cx, y1: cy, x2: cx + dx, y2: cy, label: `${length} ${lengthUnit} @ ${horizontalDir === 'right' ? '0°' : '180°'}` };
    }
    if (itemType === 'vertical') {
      const dy = direction === 'up' ? -r : r;
      return { x1: cx, y1: cy, x2: cx, y2: cy + dy, label: `${length} ${lengthUnit} @ ${direction === 'up' ? '90°' : '270°'}` };
    }
    if (itemType === 'right-leaned') {
      const rad = ((parseFloat(angle) || 45) * Math.PI) / 180;
      const ySign = verticalSlope === 'down' ? 1 : -1;
      return { x1: cx, y1: cy, x2: cx + r * Math.cos(rad), y2: cy + ySign * r * Math.sin(rad), label: `${length} ${lengthUnit} @ ${verticalSlope === 'down' ? '-' : '+'}${angle}°` };
    }
    if (itemType === 'left-leaned') {
      const rad = ((parseFloat(angle) || 45) * Math.PI) / 180;
      const ySign = verticalSlope === 'down' ? 1 : -1;
      return { x1: cx, y1: cy, x2: cx - r * Math.cos(rad), y2: cy + ySign * r * Math.sin(rad), label: `${length} ${lengthUnit} @ ${verticalSlope === 'down' ? '-' : '+'}${angle}°` };
    }
    if (isForceType) {
      const rad = ((parseFloat(forceAngle) || 270) * Math.PI) / 180;
      const lbl = isUnknown ? `${targetLabel || 'P'} = ? @ ${forceAngle}°` : `${magnitude} ${forceUnit} @ ${forceAngle}°`;
      return { x1: cx, y1: cy, x2: cx + r * Math.cos(rad), y2: cy - r * Math.sin(rad), label: lbl };
    }
    return { x1: cx, y1: cy, x2: cx + r, y2: cy, label: '' };
  };

  const pv = previewVector();

  return (
    <div className="modal-backdrop">
      <div className="precision-modal">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className={`modal-badge ${isUnknown ? 'badge-unknown-force' : ''}`}>{modalInfo.icon}</span>
            <div>
              <h3 className="modal-title">{modalInfo.title}</h3>
              <p className="modal-subtitle">
                {startJoint 
                  ? `Anchored at Joint ${startJoint.label} (${fromInternalLength(startJoint.x).toFixed(lengthUnit === 'cm' ? 0 : 2)} ${lengthUnit}, ${fromInternalLength(startJoint.y).toFixed(lengthUnit === 'cm' ? 0 : 2)} ${lengthUnit})`
                  : 'Starting at new joint'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleModalCancel} title="Cancel">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Vector Preview Widget */}
          <div className="modal-preview-box">
            <svg viewBox="0 0 100 100" className="modal-preview-svg">
              {/* Polar circular grids */}
              <circle cx="50" cy="50" r="32" stroke="var(--bp-grid-subtle)" strokeWidth="1" strokeDasharray="2 2" fill="none" />
              <circle cx="50" cy="50" r="16" stroke="var(--bp-grid-subtle)" strokeWidth="1" strokeDasharray="2 2" fill="none" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="var(--bp-grid-subtle)" strokeWidth="1" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="var(--bp-grid-subtle)" strokeWidth="1" />

              {/* Origin node */}
              <circle cx="50" cy="50" r="4" fill="var(--bp-cyan)" />

              {/* Vector arrow or line */}
              {isForceType ? (
                <g>
                  <defs>
                    <marker id="preview-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill={isUnknown ? '#c084fc' : '#f87171'} />
                    </marker>
                  </defs>
                  <line
                    x1={pv.x1}
                    y1={pv.y1}
                    x2={pv.x2}
                    y2={pv.y2}
                    stroke={isUnknown ? '#c084fc' : '#f87171'}
                    strokeWidth="3"
                    strokeDasharray={isUnknown ? '4 2' : 'none'}
                    markerEnd="url(#preview-arrow)"
                  />
                </g>
              ) : (
                <line
                  x1={pv.x1}
                  y1={pv.y1}
                  x2={pv.x2}
                  y2={pv.y2}
                  stroke="var(--bp-cyan)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
              {/* Target node */}
              {!isForceType && (
                <circle cx={pv.x2} cy={pv.y2} r="4" fill="var(--bp-amber)" />
              )}
            </svg>
            <div className="modal-preview-caption">{pv.label}</div>
          </div>

          {/* Input Controls */}
          <div className="modal-form">
            {!isForceType ? (
              <>
                <div className="form-group">
                  <label>
                    <Ruler size={14} /> Member Length ({lengthUnit})
                  </label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step={lengthUnit === 'cm' ? '10' : '0.5'}
                      min={lengthUnit === 'cm' ? '10' : '0.1'}
                      max={lengthUnit === 'cm' ? '10000' : '100'}
                      value={length}
                      onChange={e => setLength(e.target.value)}
                      autoFocus
                    />
                    <span className="input-unit">{lengthUnit}</span>
                  </div>
                </div>

                {itemType === 'horizontal' && (
                  <div className="form-group">
                    <label>Direction</label>
                    <div className="segmented-control">
                      <button
                        type="button"
                        className={horizontalDir === 'right' ? 'active' : ''}
                        onClick={() => setHorizontalDir('right')}
                      >
                        <ArrowRight size={14} /> Towards Right (+X)
                      </button>
                      <button
                        type="button"
                        className={horizontalDir === 'left' ? 'active' : ''}
                        onClick={() => setHorizontalDir('left')}
                      >
                        <ArrowLeft size={14} /> Towards Left (-X)
                      </button>
                    </div>
                  </div>
                )}

                {itemType === 'vertical' && (
                  <div className="form-group">
                    <label>Direction</label>
                    <div className="segmented-control">
                      <button
                        type="button"
                        className={direction === 'up' ? 'active' : ''}
                        onClick={() => setDirection('up')}
                      >
                        <ArrowUp size={14} /> Upwards (+Y)
                      </button>
                      <button
                        type="button"
                        className={direction === 'down' ? 'active' : ''}
                        onClick={() => setDirection('down')}
                      >
                        <ArrowDown size={14} /> Downwards (-Y)
                      </button>
                    </div>
                  </div>
                )}

                {(itemType === 'right-leaned' || itemType === 'left-leaned') && (
                  <>
                    <div className="form-group">
                      <label>Vertical Slope Direction</label>
                      <div className="segmented-control">
                        <button
                          type="button"
                          className={verticalSlope === 'up' ? 'active' : ''}
                          onClick={() => setVerticalSlope('up')}
                        >
                          <ArrowUp size={14} /> Sloping Upwards (+Y)
                        </button>
                        <button
                          type="button"
                          className={verticalSlope === 'down' ? 'active' : ''}
                          onClick={() => setVerticalSlope('down')}
                        >
                          <ArrowDown size={14} /> Sloping Downwards (-Y)
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        <Compass size={14} /> Angle of Elevation (°)
                      </label>
                      <div className="input-with-unit">
                        <input
                          type="number"
                          step="5"
                          min="1"
                          max="89"
                          value={angle}
                          onChange={e => setAngle(e.target.value)}
                        />
                        <span className="input-unit">°</span>
                      </div>
                      <div className="preset-chips">
                        {[30, 45, 60].map(deg => (
                          <button
                            key={deg}
                            type="button"
                            className={`chip ${parseFloat(angle) === deg ? 'active' : ''}`}
                            onClick={() => setAngle(deg.toString())}
                          >
                            {deg}°
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Force Classification</label>
                  <div className="segmented-control">
                    <button
                      type="button"
                      className={!isUnknown ? 'active' : ''}
                      onClick={() => setIsUnknown(false)}
                    >
                      Known Load Vector
                    </button>
                    <button
                      type="button"
                      className={isUnknown ? 'active' : ''}
                      onClick={() => setIsUnknown(true)}
                    >
                      Unknown Target Force (?)
                    </button>
                  </div>
                </div>

                {!isUnknown ? (
                  <div className="form-group">
                    <label>Force Magnitude ({forceUnit})</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        step={forceUnit === 'N' ? '1000' : '1'}
                        min="0.1"
                        value={magnitude}
                        onChange={e => setMagnitude(e.target.value)}
                        autoFocus
                      />
                      <span className="input-unit">{forceUnit}</span>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Target Variable Identifier</label>
                    <div className="input-with-unit">
                      <input
                        type="text"
                        maxLength="6"
                        value={targetLabel}
                        onChange={e => setTargetLabel(e.target.value.toUpperCase())}
                        placeholder="P"
                        autoFocus
                      />
                      <span className="input-unit font-mono">TARGET</span>
                    </div>
                    <p className="force-target-hint">
                      This force represents an unknown target variable. The equilibrium solver will determine its magnitude automatically.
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label>
                    <Compass size={14} /> Load Angle (Standard Math Convention)
                  </label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="15"
                      min="0"
                      max="360"
                      value={forceAngle}
                      onChange={e => setForceAngle(e.target.value)}
                    />
                    <span className="input-unit">°</span>
                  </div>
                  <div className="preset-chips">
                    <button
                      type="button"
                      className={`chip ${parseFloat(forceAngle) === 270 ? 'active' : ''}`}
                      onClick={() => setForceAngle('270')}
                    >
                      <ArrowDown size={12} /> 270° Down
                    </button>
                    <button
                      type="button"
                      className={`chip ${parseFloat(forceAngle) === 90 ? 'active' : ''}`}
                      onClick={() => setForceAngle('90')}
                    >
                      <ArrowUp size={12} /> 90° Up
                    </button>
                    <button
                      type="button"
                      className={`chip ${parseFloat(forceAngle) === 0 ? 'active' : ''}`}
                      onClick={() => setForceAngle('0')}
                    >
                      <ArrowRight size={12} /> 0° Right
                    </button>
                    <button
                      type="button"
                      className={`chip ${parseFloat(forceAngle) === 180 ? 'active' : ''}`}
                      onClick={() => setForceAngle('180')}
                    >
                      <ArrowLeft size={12} /> 180° Left
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={handleModalCancel}>
            <X size={15} /> Cancel
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm}>
            <Check size={15} /> Confirm & Render
          </button>
        </div>
      </div>
    </div>
  );
}
