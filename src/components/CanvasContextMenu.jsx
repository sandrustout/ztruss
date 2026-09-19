import React, { useState, useEffect } from 'react';
import { useTruss } from '../context/TrussContext';
import {
  X,
  Trash2,
  Check,
  Compass,
  Ruler,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  CircleDot,
  Triangle,
  ArrowDownCircle,
  Plus,
  Maximize2,
  Target
} from 'lucide-react';

export default function CanvasContextMenu({ menuState, onClose }) {
  const {
    joints,
    members,
    supports,
    forces,
    updateMember,
    updateForce,
    updateJoint,
    deleteItem,
    addSupport,
    setModalState,
    resetView,
    lengthUnit,
    forceUnit,
    toInternalLength,
    toInternalForce,
    fromInternalLength,
    fromInternalForce
  } = useTruss();

  const { isOpen, x, y, targetType, targetId, worldPos } = menuState;

  // Form states for in-place editing
  const [memberLength, setMemberLength] = useState('3.0');
  const [memberAngle, setMemberAngle] = useState('45');
  const [memberSlope, setMemberSlope] = useState('up');

  const [forceMag, setForceMag] = useState('15.0');
  const [forceAng, setForceAng] = useState('270');
  const [isUnknown, setIsUnknown] = useState(false);
  const [targetLabel, setTargetLabel] = useState('P');

  const [jointX, setJointX] = useState('0.0');
  const [jointY, setJointY] = useState('0.0');

  // Initialize form states when menu opens
  useEffect(() => {
    if (!isOpen) return;

    if (targetType === 'member' && targetId) {
      const member = members.find(m => m.id === targetId);
      if (member) {
        const start = joints.find(j => j.id === member.startJointId);
        const end = joints.find(j => j.id === member.endJointId);
        if (start && end) {
          const L = Math.hypot(end.x - start.x, end.y - start.y);
          const dispL = fromInternalLength(L);
          setMemberLength(dispL.toFixed(lengthUnit === 'cm' ? 0 : 2));
          const dy = end.y - start.y;
          const dx = end.x - start.x;
          let deg = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI;
          if (deg < 1) deg = 45;
          setMemberAngle(Math.round(deg).toString());
          setMemberSlope(dy < -0.01 ? 'down' : 'up');
        }
      }
    } else if (targetType === 'force' && targetId) {
      const force = forces.find(f => f.id === targetId);
      if (force) {
        setIsUnknown(!!force.isUnknown);
        setTargetLabel(force.targetLabel || 'P');
        const magDisplay = fromInternalForce(force.magnitude);
        setForceMag(forceUnit === 'N' ? Math.round(magDisplay).toString() : magDisplay.toFixed(2));
        setForceAng(force.angle.toString());
      }
    } else if (targetType === 'joint' && targetId) {
      const joint = joints.find(j => j.id === targetId);
      if (joint) {
        const dispX = fromInternalLength(joint.x);
        const dispY = fromInternalLength(joint.y);
        setJointX(dispX.toFixed(lengthUnit === 'cm' ? 0 : 2));
        setJointY(dispY.toFixed(lengthUnit === 'cm' ? 0 : 2));
      }
    }
  }, [isOpen, targetType, targetId, members, joints, forces, lengthUnit, forceUnit, fromInternalLength, fromInternalForce]);

  // Close on Escape or save on Enter
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (targetType === 'member') {
          const member = members.find(m => m.id === targetId);
          if (member) {
            updateMember(member.id, {
              length: toInternalLength(parseFloat(memberLength) || (lengthUnit === 'cm' ? 300 : 3)),
              angle: parseFloat(memberAngle) || 45,
              verticalSlope: memberSlope
            });
            onClose();
          }
        } else if (targetType === 'force') {
          const force = forces.find(f => f.id === targetId);
          if (force) {
            updateForce(force.id, {
              magnitude: isUnknown ? 0 : toInternalForce(parseFloat(forceMag) || (forceUnit === 'N' ? 10000 : 10)),
              angle: parseFloat(forceAng) || 270,
              isUnknown,
              targetLabel: targetLabel.trim() || 'P'
            });
            onClose();
          }
        } else if (targetType === 'joint') {
          const joint = joints.find(j => j.id === targetId);
          if (joint) {
            updateJoint(joint.id, {
              x: toInternalLength(parseFloat(jointX) || 0),
              y: toInternalLength(parseFloat(jointY) || 0)
            });
            onClose();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, targetType, targetId, memberLength, memberAngle, memberSlope, forceMag, forceAng, isUnknown, targetLabel, jointX, jointY, members, forces, joints, lengthUnit, forceUnit, toInternalLength, toInternalForce, updateMember, updateForce, updateJoint, onClose]);

  if (!isOpen) return null;

  // Clamping position so it stays inside window
  const menuWidth = 310;
  const menuHeight = 320;
  const posX = Math.min(x + 10, window.innerWidth - menuWidth - 20);
  const posY = Math.min(y + 10, window.innerHeight - menuHeight - 20);

  // 1. Double-click or Right-click on Member: Edit Length & Angle of Elevation
  if (targetType === 'member') {
    const member = members.find(m => m.id === targetId);
    if (!member) return null;

    const handleSaveMember = () => {
      updateMember(member.id, {
        length: toInternalLength(parseFloat(memberLength) || (lengthUnit === 'cm' ? 300 : 3)),
        angle: parseFloat(memberAngle) || 45,
        verticalSlope: memberSlope
      });
      onClose();
    };

    return (
      <div
        className="canvas-context-menu"
        style={{ left: posX, top: posY }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleSaveMember();
          }
        }}
      >
        <div className="ctx-header">
          <div className="ctx-title-group">
            <span className="ctx-badge">MEMBER</span>
            <span className="ctx-title">Edit {member.label}</span>
          </div>
          <button className="ctx-close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="ctx-body">
          <div className="ctx-field">
            <label><Ruler size={13} /> Member Length ({lengthUnit})</label>
            <div className="input-with-unit">
              <input
                type="number"
                step={lengthUnit === 'cm' ? '1' : '0.1'}
                min={lengthUnit === 'cm' ? '10' : '0.2'}
                max={lengthUnit === 'cm' ? '5000' : '50'}
                value={memberLength}
                onChange={(e) => setMemberLength(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSaveMember();
                  }
                }}
                autoFocus
              />
              <span className="input-unit">{lengthUnit}</span>
            </div>
          </div>

          <div className="ctx-field">
            <div className="ctx-label-row">
              <label><Compass size={13} /> Angle of Elevation (°)</label>
              <div className="input-with-unit" style={{ width: '80px' }}>
                <input
                  type="number"
                  min="0"
                  max="90"
                  step="1"
                  value={memberAngle}
                  onChange={(e) => setMemberAngle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveMember();
                    }
                  }}
                  style={{ textAlign: 'right', paddingRight: '22px' }}
                />
                <span className="input-unit">°</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              value={memberAngle}
              onChange={(e) => setMemberAngle(e.target.value)}
              className="ctx-range-slider"
            />
            <div className="preset-chips">
              {[0, 30, 45, 60, 90].map(deg => (
                <button
                  key={deg}
                  type="button"
                  className={`chip ${parseFloat(memberAngle) === deg ? 'active' : ''}`}
                  onClick={() => setMemberAngle(deg.toString())}
                >
                  {deg === 0 ? '0° (Horiz)' : deg === 90 ? '90° (Vert)' : `${deg}°`}
                </button>
              ))}
            </div>
          </div>

          <div className="ctx-field">
            <label>Vertical Slope Direction</label>
            <div className="segmented-control">
              <button
                type="button"
                className={memberSlope === 'up' ? 'active' : ''}
                onClick={() => setMemberSlope('up')}
              >
                <ArrowUp size={13} /> Upward (+Y)
              </button>
              <button
                type="button"
                className={memberSlope === 'down' ? 'active' : ''}
                onClick={() => setMemberSlope('down')}
              >
                <ArrowDown size={13} /> Downward (-Y)
              </button>
            </div>
          </div>
        </div>

        <div className="ctx-footer">
          <button
            type="button"
            className="btn-delete-element"
            onClick={() => {
              deleteItem('member', member.id);
              onClose();
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
          <button type="button" className="btn-primary" onClick={handleSaveMember}>
            <Check size={14} /> Apply Angle & Length
          </button>
        </div>
      </div>
    );
  }

  // 2. Double-click on External Force: Edit Magnitude & Direction
  if (targetType === 'force') {
    const force = forces.find(f => f.id === targetId);
    if (!force) return null;

    const handleSaveForce = () => {
      updateForce(force.id, {
        magnitude: isUnknown ? 0 : toInternalForce(parseFloat(forceMag) || (forceUnit === 'N' ? 10000 : 10)),
        angle: parseFloat(forceAng) || 270,
        isUnknown,
        targetLabel: targetLabel.trim() || 'P'
      });
      onClose();
    };

    return (
      <div
        className="canvas-context-menu"
        style={{ left: posX, top: posY }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="ctx-header">
          <div className="ctx-title-group">
            <span className={`ctx-badge ${isUnknown ? 'badge-unknown-force' : 'force-badge'}`}>
              {isUnknown ? 'TARGET (?)' : 'LOAD'}
            </span>
            <span className="ctx-title">
              {isUnknown ? `Edit Target Force (${targetLabel})` : 'Edit External Load'}
            </span>
          </div>
          <button className="ctx-close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="ctx-body">
          <div className="ctx-field">
            <label>Force Nature</label>
            <div className="segmented-control">
              <button
                type="button"
                className={!isUnknown ? 'active' : ''}
                onClick={() => setIsUnknown(false)}
              >
                Known Load
              </button>
              <button
                type="button"
                className={isUnknown ? 'active' : ''}
                onClick={() => setIsUnknown(true)}
              >
                Unknown Target (?)
              </button>
            </div>
          </div>

          {!isUnknown ? (
            <div className="ctx-field">
              <label><ArrowDownCircle size={13} /> Force Magnitude ({forceUnit})</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  step={forceUnit === 'N' ? '1000' : '1'}
                  min="0.1"
                  value={forceMag}
                  onChange={(e) => setForceMag(e.target.value)}
                  autoFocus
                />
                <span className="input-unit">{forceUnit}</span>
              </div>
            </div>
          ) : (
            <div className="ctx-field">
              <label>Target Variable Label</label>
              <div className="input-with-unit">
                <input
                  type="text"
                  maxLength="6"
                  value={targetLabel}
                  onChange={(e) => setTargetLabel(e.target.value.toUpperCase())}
                  placeholder="P"
                  autoFocus
                />
                <span className="input-unit font-mono">TARGET</span>
              </div>
            </div>
          )}

          <div className="ctx-field">
            <div className="ctx-label-row">
              <label><Compass size={13} /> Load Vector Direction</label>
              <span className="ctx-slider-val">{forceAng}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={forceAng}
              onChange={(e) => setForceAng(e.target.value)}
              className="ctx-range-slider"
            />
            <div className="preset-chips">
              <button
                type="button"
                className={`chip ${parseFloat(forceAng) === 270 ? 'active' : ''}`}
                onClick={() => setForceAng('270')}
              >
                <ArrowDown size={12} /> 270° Down
              </button>
              <button
                type="button"
                className={`chip ${parseFloat(forceAng) === 90 ? 'active' : ''}`}
                onClick={() => setForceAng('90')}
              >
                <ArrowUp size={12} /> 90° Up
              </button>
              <button
                type="button"
                className={`chip ${parseFloat(forceAng) === 0 ? 'active' : ''}`}
                onClick={() => setForceAng('0')}
              >
                <ArrowRight size={12} /> 0° Right
              </button>
              <button
                type="button"
                className={`chip ${parseFloat(forceAng) === 180 ? 'active' : ''}`}
                onClick={() => setForceAng('180')}
              >
                <ArrowLeft size={12} /> 180° Left
              </button>
            </div>
          </div>
        </div>

        <div className="ctx-footer">
          <button
            type="button"
            className="btn-delete-element"
            onClick={() => {
              deleteItem('force', force.id);
              onClose();
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
          <button type="button" className="btn-primary" onClick={handleSaveForce}>
            <Check size={14} /> Apply Load
          </button>
        </div>
      </div>
    );
  }

  // 3. Double-click on Joint: Quick Actions & Attachments
  if (targetType === 'joint') {
    const joint = joints.find(j => j.id === targetId);
    if (!joint) return null;

    const handleSaveJointCoords = () => {
      updateJoint(joint.id, {
        x: toInternalLength(parseFloat(jointX) || 0),
        y: toInternalLength(parseFloat(jointY) || 0)
      });
      onClose();
    };

    return (
      <div
        className="canvas-context-menu"
        style={{ left: posX, top: posY }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="ctx-header">
          <div className="ctx-title-group">
            <span className="ctx-badge">JOINT</span>
            <span className="ctx-title">Joint {joint.label}</span>
          </div>
          <button className="ctx-close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="ctx-body">
          <div className="ctx-joint-coords-row">
            <div className="ctx-field half">
              <label>X Position ({lengthUnit})</label>
              <input
                type="number"
                step={lengthUnit === 'cm' ? '10' : '0.5'}
                value={jointX}
                onChange={(e) => setJointX(e.target.value)}
              />
            </div>
            <div className="ctx-field half">
              <label>Y Position ({lengthUnit})</label>
              <input
                type="number"
                step={lengthUnit === 'cm' ? '10' : '0.5'}
                value={jointY}
                onChange={(e) => setJointY(e.target.value)}
              />
            </div>
          </div>

          <div className="ctx-action-list">
            <span className="ctx-section-tag">QUICK ATTACH</span>
            <button
              type="button"
              className="ctx-action-btn"
              onClick={() => {
                addSupport(joint.id, 'pivot');
                onClose();
              }}
            >
              <Target size={14} className="support-pivot text-cyan" /> Attach Pivot Point (r = 2)
            </button>
            <button
              type="button"
              className="ctx-action-btn"
              onClick={() => {
                addSupport(joint.id, 'pin');
                onClose();
              }}
            >
              <Triangle size={14} className="support-pin" /> Attach Pin Support (r = 2)
            </button>
            <button
              type="button"
              className="ctx-action-btn"
              onClick={() => {
                addSupport(joint.id, 'roller');
                onClose();
              }}
            >
              <CircleDot size={14} className="support-roller" /> Attach Roller Support (r = 1)
            </button>
            <button
              type="button"
              className="ctx-action-btn"
              onClick={() => {
                setModalState({
                  isOpen: true,
                  itemType: 'force',
                  startJoint: joint,
                  dropWorldPos: { x: joint.x, y: joint.y }
                });
                onClose();
              }}
            >
              <ArrowDownCircle size={14} className="force-icon" /> Apply External Load Vector
            </button>
            <button
              type="button"
              className="ctx-action-btn"
              onClick={() => {
                setModalState({
                  isOpen: true,
                  itemType: 'unknown-force',
                  isUnknown: true,
                  targetLabel: 'P',
                  startJoint: joint,
                  dropWorldPos: { x: joint.x, y: joint.y }
                });
                onClose();
              }}
            >
              <span className="badge-unknown-icon">?</span> Apply Unknown Target Force (P)
            </button>
            <button
              type="button"
              className="ctx-action-btn"
              onClick={() => {
                setModalState({
                  isOpen: true,
                  itemType: 'horizontal',
                  startJoint: joint,
                  dropWorldPos: { x: joint.x, y: joint.y }
                });
                onClose();
              }}
            >
              <Plus size={14} /> Connect New Member from Joint {joint.label}
            </button>
          </div>
        </div>

        <div className="ctx-footer">
          <button
            type="button"
            className="btn-delete-element"
            onClick={() => {
              deleteItem('joint', joint.id);
              onClose();
            }}
          >
            <Trash2 size={13} /> Delete Joint
          </button>
          <button type="button" className="btn-primary" onClick={handleSaveJointCoords}>
            <Check size={14} /> Save Coords
          </button>
        </div>
      </div>
    );
  }

  // 4. Double-click on Empty Canvas: Custom Quick Action Menu
  return (
    <div
      className="canvas-context-menu"
      style={{ left: posX, top: posY }}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="ctx-header">
        <div className="ctx-title-group">
          <span className="ctx-badge">CANVAS</span>
          <span className="ctx-title">Quick Actions</span>
        </div>
        <button className="ctx-close-btn" onClick={onClose}><X size={15} /></button>
      </div>

      <div className="ctx-body">
        <div className="ctx-action-list">
          <span className="ctx-section-tag">
            ADD AT THIS POINT ({fromInternalLength(worldPos.x).toFixed(1)} {lengthUnit}, {fromInternalLength(worldPos.y).toFixed(1)} {lengthUnit})
          </span>
          <button
            type="button"
            className="ctx-action-btn"
            onClick={() => {
              setModalState({
                isOpen: true,
                itemType: 'horizontal',
                startJoint: null,
                dropWorldPos: worldPos
              });
              onClose();
            }}
          >
            <Plus size={14} /> Add Horizontal Member (0°)
          </button>
          <button
            type="button"
            className="ctx-action-btn"
            onClick={() => {
              setModalState({
                isOpen: true,
                itemType: 'vertical',
                startJoint: null,
                dropWorldPos: worldPos
              });
              onClose();
            }}
          >
            <Plus size={14} /> Add Vertical Member (90°)
          </button>
          <button
            type="button"
            className="ctx-action-btn"
            onClick={() => {
              setModalState({
                isOpen: true,
                itemType: 'right-leaned',
                startJoint: null,
                dropWorldPos: worldPos
              });
              onClose();
            }}
          >
            <Plus size={14} /> Add Right-Leaned Member (+θ)
          </button>
          <button
            type="button"
            className="ctx-action-btn"
            onClick={() => {
              setModalState({
                isOpen: true,
                itemType: 'left-leaned',
                startJoint: null,
                dropWorldPos: worldPos
              });
              onClose();
            }}
          >
            <Plus size={14} /> Add Left-Leaned Member (-θ)
          </button>
          <button
            type="button"
            className="ctx-action-btn"
            onClick={() => {
              setModalState({
                isOpen: true,
                itemType: 'unknown-force',
                isUnknown: true,
                targetLabel: 'P',
                startJoint: null,
                dropWorldPos: worldPos
              });
              onClose();
            }}
          >
            <span className="badge-unknown-icon">?</span> Add Unknown Target Force (?)
          </button>
        </div>

        <div className="ctx-action-list" style={{ marginTop: '8px' }}>
          <span className="ctx-section-tag">VIEW CONTROLS</span>
          <button
            type="button"
            className="ctx-action-btn"
            onClick={() => {
              resetView();
              onClose();
            }}
          >
            <Maximize2 size={14} /> Re-center & Fit View
          </button>
        </div>
      </div>
    </div>
  );
}
