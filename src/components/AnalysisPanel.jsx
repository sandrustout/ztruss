import React from 'react';
import { useTruss } from '../context/TrussContext';
import { classifyStructure } from '../engine/determinacy';
import {
  Activity,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ChevronDown,
  Info,
  Trash2,
  Crosshair,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Cpu,
  X
} from 'lucide-react';

export default function AnalysisPanel({ onClose }) {
  const {
    joints,
    members,
    supports,
    forces,
    analysisResult,
    runAnalysis,
    selectedMemberId,
    setSelectedMemberId,
    selectedItem,
    deleteItem,
    updateSupportOrientation,
    structureMode,
    setStructureMode,
    lengthUnit,
    forceUnit,
    formatLength,
    formatForce,
    fromInternalForce,
    fromInternalLength
  } = useTruss();

  const formatMoment = (kNm, decimals = 2) => {
    if (kNm === null || kNm === undefined || isNaN(kNm)) return `0.00 ${forceUnit}·${lengthUnit}`;
    const fFactor = forceUnit === 'N' ? 1000 : 1;
    const lFactor = lengthUnit === 'cm' ? 100 : 1;
    const val = kNm * fFactor * lFactor;
    return `${val.toFixed(decimals)} ${forceUnit}·${lengthUnit}`;
  };

  const determinacy = analysisResult?.determinacy;
  const solver = analysisResult?.solverResult;
  const isSolved = analysisResult?.solved;

  // Real-time classification: use solved classification if available, else live preview
  const liveClassification = classifyStructure({ joints, members, supports, forces, structureMode });
  const classification = (structureMode !== 'auto' && analysisResult?.classification?.type?.toLowerCase() !== structureMode)
    ? liveClassification
    : (analysisResult?.classification || determinacy?.classification || liveClassification);

  const isFrame = classification.type === 'FRAME';
  const isMachine = classification.type === 'MACHINE';
  const isTruss = classification.type === 'TRUSS';

  // Real-time reactions count before and after solve
  const currentR = determinacy
    ? determinacy.r
    : supports.reduce((acc, s) => acc + (s.type === 'roller' ? 1 : 2), 0);

  // Selected member force details (with fallback to first member if ID stale)
  const selectedMemberData =
    solver?.memberResults?.find(m => m.id === selectedMemberId) ||
    solver?.memberResults?.[0];

  // Status badge styling & details
  const getStatusBadge = () => {
    if (!analysisResult) {
      return {
        label: 'Ready for Analysis',
        class: 'status-ready',
        icon: <Activity size={16} />
      };
    }

    if (determinacy?.category === 'DETERMINATE' && isSolved) {
      return {
        label: 'Statically Determinate & Stable',
        class: 'status-determinate',
        icon: <CheckCircle2 size={16} />
      };
    }

    if (determinacy?.category === 'INDETERMINATE') {
      return {
        label: 'Statically Indeterminate',
        class: 'status-indeterminate',
        icon: <AlertOctagon size={16} />
      };
    }

    return {
      label: determinacy?.status || 'Unstable',
      class: 'status-unstable',
      icon: <AlertTriangle size={16} />
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <aside className="analysis-panel">
      {/* Header with Run Button */}
      <div className="analysis-header">
        <div className="panel-title-row">
          <div className="panel-title-tags">
            <span className="panel-tag">STRUCTURAL ENGINE</span>
            <span className="engine-badge">
              {isMachine
                ? 'Linkage & Pin Mechanics'
                : isFrame
                ? 'Beam-Column Stiffness & FBD'
                : 'Method of Joints'}
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              className="mobile-drawer-close-btn cursor-target"
              onClick={onClose}
              title="Close Analysis Panel"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <h2 className="panel-title">Analysis & Query</h2>

        <button
          type="button"
          className={`btn-analyse ${isMachine ? 'btn-analyse-machine' : isFrame ? 'btn-analyse-frame' : ''}`}
          onClick={runAnalysis}
          disabled={joints.length === 0}
        >
          <Calculator size={17} />
          <span>ANALYSE {classification.type || 'STRUCTURE'}</span>
        </button>
      </div>

      <div className="panel-content">
        {/* PROMINENT STRUCTURE CLASSIFICATION CARD (Truss vs Frame vs Machine) */}
        <div className={`analysis-card classification-card classification-${classification.type.toLowerCase()}`}>
          <div className="card-header">
            <span className="card-title">STRUCTURE CLASSIFICATION</span>
            <div className="card-mode-toggle-group">
              <button
                type="button"
                className={`card-mode-btn ${structureMode === 'auto' ? 'active' : ''}`}
                onClick={() => setStructureMode('auto')}
                title="Switch to Auto-Detect Mode"
              >
                AUTO
              </button>
              <button
                type="button"
                className={`card-mode-btn btn-truss ${structureMode === 'truss' ? 'active' : ''}`}
                onClick={() => setStructureMode('truss')}
                title="Switch to Truss Mode"
              >
                TRUSS
              </button>
              <button
                type="button"
                className={`card-mode-btn btn-frame ${structureMode === 'frame' ? 'active' : ''}`}
                onClick={() => setStructureMode('frame')}
                title="Switch to Frame Mode"
              >
                FRAME
              </button>
              <button
                type="button"
                className={`card-mode-btn btn-machine ${structureMode === 'machine' ? 'active' : ''}`}
                onClick={() => setStructureMode('machine')}
                title="Switch to Machine Mode"
              >
                MACHINE
              </button>
            </div>
          </div>

          <div className="classification-hero">
            <div className={`classification-badge-pill badge-${classification.type.toLowerCase()}`}>
              {isTruss && <Zap size={15} />}
              {isFrame && <Layers size={15} />}
              {isMachine && <Cpu size={15} />}
              <span>{classification.badge || classification.type}</span>
            </div>
            <h3 className="classification-title">{classification.title || classification.label}</h3>
            <p className="classification-tagline">{classification.tagline}</p>
          </div>

          <div className="classification-rationale-box">
            <div className="rationale-header">
              <Info size={13} className="rationale-icon" />
              <span>Physical Classification Mechanics:</span>
            </div>
            <p className="rationale-text">{classification.reason}</p>
            {classification.isMultiForce && (
              <div className="rationale-chip">
                <span>{classification.multiForceCount} Multi-Force Member(s) Detected</span>
              </div>
            )}
          </div>
        </div>
        {/* Status & Determinacy Formula Card */}
        <div className="analysis-card determinacy-card">
          <div className="card-header">
            <span className="card-title">
              {isMachine ? 'MECHANISM EQUILIBRIUM' : isFrame ? 'FRAME DETERMINACY (3m + r)' : 'DETERMINACY FORMULA (m + r)'}
            </span>
            <div className={`status-badge-pill ${statusBadge.class}`}>
              {statusBadge.icon}
              <span>{statusBadge.label}</span>
            </div>
          </div>

          <div className="formula-metrics-grid">
            <div className="metric-box">
              <span className="metric-label">{isMachine ? 'Links (m)' : 'Members (m)'}</span>
              <span className="metric-value">{members.length}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">{isMachine ? 'Pin Rx (r)' : 'Reactions (r)'}</span>
              <span className="metric-value">{currentR}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">{isMachine ? 'Hinges (j)' : 'Joints (j)'}</span>
              <span className="metric-value">{joints.length}</span>
            </div>
            <div className="metric-box highlight">
              <span className="metric-label">{isFrame ? 'Equations (3j)' : 'Equations (2j)'}</span>
              <span className="metric-value">{isFrame ? 3 * joints.length : 2 * joints.length}</span>
            </div>
          </div>

          {/* Formula Comparison */}
          <div className="formula-equation-box">
            <div className="equation-math">
              <span className="eq-term">{isFrame ? '3m + r' : isMachine ? 'Unknowns' : 'm + r'}</span>
              <span className="eq-sym">
                {!analysisResult
                  ? 'vs'
                  : determinacy?.unknownCount === determinacy?.eqCount
                  ? '='
                  : determinacy?.unknownCount < determinacy?.eqCount
                  ? '<'
                  : '>'}
              </span>
              <span className="eq-term">{isFrame ? '3j' : isMachine ? 'Equations' : '2j'}</span>
            </div>
            <div className="equation-values">
              <span>{isFrame ? (3 * members.length + currentR) : (members.length + currentR)}</span>
              <span>{analysisResult ? (determinacy?.unknownCount === determinacy?.eqCount ? '=' : determinacy?.unknownCount < determinacy?.eqCount ? '<' : '>') : 'vs'}</span>
              <span>{isFrame ? 3 * joints.length : 2 * joints.length}</span>
            </div>
          </div>

          {analysisResult && (
            <p className="determinacy-explanation">
              {determinacy?.message}
            </p>
          )}
        </div>

        {/* TARGET SOLVED CARD: When an unknown force exists, prominently solve and show it! */}
        {isSolved && solver?.solvedUnknownForces && solver.solvedUnknownForces.length > 0 && (
          <div className="analysis-card solved-target-force-card">
            <div className="card-header">
              <div className="section-title-wrapper">
                <span className="section-stage-tag stage-target">SOLVED TARGET</span>
                <span className="card-title">
                  UNKNOWN FORCE {solver.solvedUnknownForces[0].targetLabel || 'P'} SOLVED
                </span>
              </div>
              <span className="card-hint">Static Equilibrium Solution</span>
            </div>

            <div className="solved-target-body">
              <div className="solved-target-hero-row">
                <div className="solved-target-mag font-mono">
                  {solver.solvedUnknownForces[0].targetLabel || 'P'} = {formatForce(solver.solvedUnknownForces[0].magnitude)}
                </div>
                <div className="solved-target-meta">
                  <span className="target-joint-badge">
                    Joint {solver.solvedUnknownForces[0].jointLabel}
                  </span>
                  <span className="target-angle-badge">
                    @ {solver.solvedUnknownForces[0].angle}°
                  </span>
                </div>
              </div>

              {solver.solvedUnknownForces[0].derivation && (
                <div className="solved-target-equation-box">
                  <span className="target-eq-label">Equilibrium Derivation:</span>
                  <div className="target-eq-text font-mono">
                    {solver.solvedUnknownForces[0].derivation}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STAGE 1: Support Reactions & Global Equilibrium (Dedicated Answer Section) */}
        {isSolved && (
          <div className="analysis-card reactions-section-card">
            <div className="card-header">
              <div className="section-title-wrapper">
                <span className="section-stage-tag">STAGE 1</span>
                <span className="card-title">SUPPORT REACTIONS</span>
              </div>
              <span className="card-hint">Whole Body ΣF = 0, ΣM = 0</span>
            </div>

            {/* Global Equilibrium Equations Box */}
            {solver.globalEquations && (
              <div className="global-equations-box">
                <div className="global-eq-header">
                  <span>Equilibrium of Entire Structure (Moment about Joint {solver.globalEquations.momentJoint}):</span>
                </div>
                <div className="eq-line font-mono">
                  <span className="eq-label">Σ F_x = 0:</span>
                  <span className="eq-expression">{solver.globalEquations.sumFxStr}</span>
                </div>
                <div className="eq-line font-mono">
                  <span className="eq-label">Σ F_y = 0:</span>
                  <span className="eq-expression">{solver.globalEquations.sumFyStr}</span>
                </div>
                <div className="eq-line font-mono">
                  <span className="eq-label">Σ M_{solver.globalEquations.momentJoint} = 0:</span>
                  <span className="eq-expression">{solver.globalEquations.sumMOStr}</span>
                </div>
              </div>
            )}

            {/* Reactions Prominent Cards Grid */}
            <div className="reactions-prominent-grid">
              {solver.reactionResults.map(rx => (
                <div key={rx.id} className="reaction-card-item">
                  <div className="rx-card-top">
                    <span className="rx-symbol font-mono">{rx.label}</span>
                    <span className="rx-joint-tag">Joint {rx.jointLabel}</span>
                  </div>
                  <div className="rx-card-bottom">
                    <span className="rx-value font-mono">
                      {formatForce(rx.magnitude)}
                    </span>
                    <span className={`rx-direction-badge dir-${rx.direction.toLowerCase()}`}>
                      <span className="rx-arrow">{rx.arrow}</span>
                      <span className="rx-dir-text">{rx.direction}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 2: Specialized Mechanics Cards (Machine MA, Frame Actions, or Truss zero-force) */}
        {isSolved && (
          <>
            {/* MACHINE SPECIFIC: Mechanical Advantage & Force Transmission Hero */}
            {isMachine && (
              <div className="analysis-card machine-hero-card">
                <div className="card-header">
                  <div className="section-title-wrapper">
                    <span className="section-stage-tag stage-machine">MECHANISM</span>
                    <span className="card-title">MECHANICAL ADVANTAGE (MA)</span>
                  </div>
                  <span className="card-hint">MA = F_out / F_in</span>
                </div>

                <div className="ma-hero-display">
                  <div className="ma-main-stat">
                    <span className="ma-number font-mono">
                      {(solver.mechanicalAdvantage || 1).toFixed(2)}
                      <span className="ma-times">×</span>
                    </span>
                    <span className="ma-label">FORCE MULTIPLICATION FACTOR</span>
                  </div>

                  <div className="ma-io-grid">
                    <div className="ma-io-box">
                      <span className="ma-io-label">Input Effort (F_in)</span>
                      <span className="ma-io-value font-mono">
                        {formatForce(solver.inputForce?.magnitude || 0)}
                      </span>
                      <span className="ma-io-joint font-mono">Joint {solver.inputForce?.jointLabel || '—'}</span>
                    </div>

                    <div className="ma-io-box highlight">
                      <span className="ma-io-label">Output Resistance (F_out)</span>
                      <span className="ma-io-value font-mono">
                        {formatForce(solver.outputForce?.magnitude || 0)}
                      </span>
                      <span className="ma-io-joint font-mono">Joint {solver.outputForce?.jointLabel || '—'}</span>
                    </div>
                  </div>

                  <p className="ma-mechanics-note">
                    The mechanism transmits the applied input effort of {formatForce(solver.inputForce?.magnitude || 0)} at Joint {solver.inputForce?.jointLabel || '—'} through mechanical linkages to deliver {formatForce(solver.outputForce?.magnitude || 0)} at Joint {solver.outputForce?.jointLabel || '—'}, yielding an amplification factor of {(solver.mechanicalAdvantage || 1).toFixed(2)}×.
                  </p>
                </div>
              </div>
            )}

            {/* MACHINE & FRAME SPECIFIC: Internal Hinge Pin Shear Forces */}
            {(isMachine || isFrame) && (solver.pinForces || solver.internalPinResults) && (
              <div className="analysis-card pin-forces-card">
                <div className="card-header">
                  <div className="section-title-wrapper">
                    <span className="section-stage-tag stage-pin">INTERNAL HINGES</span>
                    <span className="card-title">PIN SHEAR FORCES</span>
                  </div>
                  <span className="card-hint">Transmitted shear loads</span>
                </div>

                <div className="pin-forces-grid">
                  {(solver.pinForces || solver.internalPinResults || []).map((pin, idx) => (
                    <div key={idx} className="pin-force-item">
                      <div className="pin-item-header">
                        <span className="pin-label font-mono">Pin Joint {pin.jointLabel}</span>
                        <span className="pin-val font-mono">
                          {formatForce(pin.force || pin.resultantForce || 0)}
                        </span>
                      </div>
                      <span className="pin-desc">{pin.description || `Pin transmits shear load across connected members`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MEMBER FORCES & QUERY SECTION */}
            <div className="analysis-card query-card">
              <div className="card-header">
                <div className="section-title-wrapper">
                  <span className="section-stage-tag stage-2">STAGE 2</span>
                  <span className="card-title">
                    {isMachine
                      ? 'LINKAGE FORCES & INTERNAL ACTIONS'
                      : isFrame
                      ? 'FRAME MEMBER FORCES & MOMENTS'
                      : 'MEMBER FORCES (METHOD OF JOINTS)'}
                  </span>
                </div>
                <span className="card-hint">Select to inspect</span>
              </div>

              <div className="member-select-wrapper">
                <select
                  value={selectedMemberData?.id || ''}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="member-dropdown"
                >
                  <option value="" disabled>
                    {isMachine
                      ? 'Select a machine link...'
                      : isFrame
                      ? 'Select a frame member...'
                      : 'Select a truss member...'}
                  </option>
                  {(solver.memberResults || []).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.natureLabel}) — {formatForce(m.magnitude)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="dropdown-arrow" />
              </div>

              {selectedMemberData ? (
                <div className="member-force-display">
                  <div className="force-main-row">
                    <div className="force-identity">
                      <span className="force-symbol">{selectedMemberData.label}</span>
                      <span className="force-joints">
                        Between Joint {selectedMemberData.startJoint} and {selectedMemberData.endJoint}
                        {selectedMemberData.length ? ` (Span: ${formatLength(selectedMemberData.length)})` : ''}
                      </span>
                    </div>

                    <div className="force-value-box">
                      <span className="force-number">
                        {fromInternalForce(selectedMemberData.magnitude).toFixed(2)}
                      </span>
                      <span className="force-unit">{forceUnit}</span>
                    </div>
                  </div>

                  {/* Multi-force extra actions (Shear & Moment for Frame/Machine) */}
                  {(isFrame || isMachine || selectedMemberData.shearForce !== undefined) && (
                    <div className="member-actions-grid">
                      <div className="action-sub-box">
                        <span className="action-sub-label">Shear Force (V)</span>
                        <span className="action-sub-value font-mono">
                          {formatForce(selectedMemberData.shearForce || 0)}
                        </span>
                      </div>
                      <div className="action-sub-box">
                        <span className="action-sub-label">Bending Moment (M)</span>
                        <span className="action-sub-value font-mono">
                          {formatMoment(selectedMemberData.bendingMoment || 0)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tension / Compression / Zero Badge */}
                  <div className="force-nature-row">
                    <span className="nature-label">State of Stress:</span>
                    <span className={`nature-badge ${selectedMemberData.nature.toLowerCase()}`}>
                      {selectedMemberData.nature === 'TENSION' && 'TENSION (T)'}
                      {selectedMemberData.nature === 'COMPRESSION' && 'COMPRESSION (C)'}
                      {selectedMemberData.nature === 'ZERO' && 'ZERO-FORCE (0)'}
                    </span>
                  </div>

                  <p className="force-explanation">
                    {selectedMemberData.nature === 'TENSION' &&
                      'Pulls inward on connected joints with tensile axial force (Tension).'}
                    {selectedMemberData.nature === 'COMPRESSION' &&
                      'Pushes outward against connected joints under compressive load (Compression).'}
                    {selectedMemberData.nature === 'ZERO' &&
                      'Carries zero primary axial force under this loading configuration; provides geometric stability.'}
                  </p>
                </div>
              ) : (
                <div className="query-placeholder">
                  Select a member from the dropdown or click directly on any member line on the canvas.
                </div>
              )}

              {/* Complete All-Members Summary Table */}
              <div className="all-members-table-wrapper">
                <div className="table-header-row">
                  <span className="table-title">ALL MEMBERS SUMMARY</span>
                  <span className="table-count">{(solver.memberResults || []).length} members</span>
                </div>
                <div className="table-scroll-container">
                  <table className="blueprint-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Span</th>
                        <th>Length</th>
                        <th>Axial ({forceUnit})</th>
                        {(isFrame || isMachine) && <th>Shear V ({forceUnit})</th>}
                        {(isFrame || isMachine) && <th>Moment M ({forceUnit}·{lengthUnit})</th>}
                        <th>Stress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(solver.memberResults || []).map(m => (
                        <tr
                          key={m.id}
                          className={`table-row-selectable ${selectedMemberData?.id === m.id ? 'selected-row' : ''}`}
                          onClick={() => setSelectedMemberId(m.id)}
                        >
                          <td className="font-mono font-bold text-cyan">{m.label}</td>
                          <td className="font-mono text-dim">{m.startJoint}–{m.endJoint}</td>
                          <td className="font-mono text-muted">{m.length ? formatLength(m.length) : '—'}</td>
                          <td className="font-mono font-bold text-white">{fromInternalForce(m.magnitude).toFixed(2)}</td>
                          {(isFrame || isMachine) && (
                            <td className="font-mono text-cyan">
                              {m.shearForce !== undefined ? formatForce(m.shearForce) : `0.00 ${forceUnit}`}
                            </td>
                          )}
                          {(isFrame || isMachine) && (
                            <td className="font-mono text-amber">
                              {m.bendingMoment !== undefined ? formatMoment(m.bendingMoment) : `0.00 ${forceUnit}·${lengthUnit}`}
                            </td>
                          )}
                          <td>
                            <span className={`mini-nature-badge ${m.nature.toLowerCase()}`}>
                              {m.code}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* TRUSS SPECIFIC: Zero-Force Member Roster */}
            {isTruss && solver.zeroForceMembers && (
              <div className="analysis-card roster-card">
                <div className="card-header">
                  <span className="card-title">ZERO-FORCE MEMBERS</span>
                  <span className="zero-count-pill">
                    {solver.zeroForceMembers.length} detected
                  </span>
                </div>

                {solver.zeroForceMembers.length > 0 ? (
                  <div className="zero-force-list">
                    {solver.zeroForceMembers.map(zm => (
                      <button
                        key={zm.id}
                        type="button"
                        className={`zero-member-row ${selectedMemberData?.id === zm.id ? 'active' : ''}`}
                        onClick={() => setSelectedMemberId(zm.id)}
                      >
                        <div className="zero-info">
                          <span className="zero-symbol">{zm.label}</span>
                          <span className="zero-desc">Joints {zm.startJoint}–{zm.endJoint}</span>
                        </div>
                        <span className="zero-val font-mono">{formatForce(0)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-roster">
                    <ShieldCheck size={18} className="empty-icon" />
                    <span>No zero-force members. All members carry active axial forces.</span>
                  </div>
                )}
              </div>
            )}

            {/* MACHINE SPECIFIC: Linkage FBD Component Breakdown */}
            {isMachine && solver.componentFBDs && solver.componentFBDs.length > 0 && (
              <div className="analysis-card joint-steps-card">
                <div className="card-header">
                  <span className="card-title">LINKAGE FREE-BODY EQUILIBRIUM (FBDs)</span>
                  <span className="steps-count-pill font-mono">{solver.componentFBDs.length} links</span>
                </div>
                <div className="joint-steps-list">
                  {solver.componentFBDs.map((step, idx) => (
                    <div key={idx} className="joint-step-item">
                      <span className="step-number font-mono">{idx + 1}</span>
                      <span className="step-text font-mono">{step.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FRAME SPECIFIC: Beam-Column FBD Derivation Log */}
            {isFrame && solver.fbdSteps && solver.fbdSteps.length > 0 && (
              <div className="analysis-card joint-steps-card">
                <div className="card-header">
                  <span className="card-title">FRAME FREE-BODY EQUILIBRIUM LOG</span>
                  <span className="steps-count-pill font-mono">{solver.fbdSteps.length} members</span>
                </div>
                <div className="joint-steps-list">
                  {solver.fbdSteps.map((step, idx) => (
                    <div key={idx} className="joint-step-item">
                      <span className="step-number font-mono">{idx + 1}</span>
                      <span className="step-text font-mono">{step.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TRUSS SPECIFIC: Method of Joints Step-by-Step Derivation Log */}
            {isTruss && solver.jointSteps && solver.jointSteps.length > 0 && (
              <div className="analysis-card joint-steps-card">
                <div className="card-header">
                  <span className="card-title">METHOD OF JOINTS DERIVATION LOG</span>
                  <span className="steps-count-pill font-mono">{solver.jointSteps.length} joints solved</span>
                </div>
                <div className="joint-steps-list">
                  {solver.jointSteps.map((step, idx) => (
                    <div key={idx} className="joint-step-item">
                      <span className="step-number font-mono">{idx + 1}</span>
                      <span className="step-text font-mono">{step.description}</span>
                    </div>
                  ))}
                  {solver.maxResidual !== undefined && (
                    <div className="residual-verified">
                      <CheckCircle2 size={14} className="text-green flex-shrink-0" />
                      <span>Joint static equilibrium verified (residual &lt; {formatForce(Math.max(solver.maxResidual, 0.001))})</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Selected Entity Inspector & Quick Delete */}
        {selectedItem && (() => {
          let itemDetails = null;
          if (selectedItem.type === 'joint') {
            const joint = joints.find(j => j.id === selectedItem.id);
            if (joint) {
              const connected = members.filter(m => m.startJointId === joint.id || m.endJointId === joint.id);
              itemDetails = (
                <div className="inspector-fields">
                  <div className="inspector-row">
                    <span className="field-name">Joint Label:</span>
                    <span className="field-value font-mono highlight">{joint.label}</span>
                  </div>
                  <div className="inspector-row">
                    <span className="field-name">Coordinates:</span>
                    <span className="field-value font-mono">X = {formatLength(joint.x)}, Y = {formatLength(joint.y)}</span>
                  </div>
                  <div className="inspector-row">
                    <span className="field-name">Connected Members:</span>
                    <span className="field-value">{connected.length} members</span>
                  </div>
                </div>
              );
            }
          } else if (selectedItem.type === 'member') {
            const member = members.find(m => m.id === selectedItem.id);
            if (member) {
              const start = joints.find(j => j.id === member.startJointId);
              const end = joints.find(j => j.id === member.endJointId);
              const L = (start && end) ? Math.hypot(end.x - start.x, end.y - start.y) : 0;
              itemDetails = (
                <div className="inspector-fields">
                  <div className="inspector-row">
                    <span className="field-name">Member:</span>
                    <span className="field-value font-mono highlight">{member.label}</span>
                  </div>
                  <div className="inspector-row">
                    <span className="field-name">Span:</span>
                    <span className="field-value font-mono">Joint {start?.label} to Joint {end?.label}</span>
                  </div>
                  <div className="inspector-row">
                    <span className="field-name">Length:</span>
                    <span className="field-value font-mono">{formatLength(L)}</span>
                  </div>
                </div>
              );
            }
          } else if (selectedItem.type === 'support') {
            const support = supports.find(s => s.id === selectedItem.id);
            if (support) {
              const joint = joints.find(j => j.id === support.jointId);
              itemDetails = (
                <div className="inspector-fields">
                  <div className="inspector-row">
                    <span className="field-name">Support Type:</span>
                    <span className="field-value font-mono highlight">
                      {support.type === 'pin' && 'Pin Support (Rx, Ry)'}
                      {support.type === 'pivot' && 'Pivot Point Fulcrum (Rx, Ry)'}
                      {support.type === 'roller' && 'Roller Support (1 reaction)'}
                      {support.type === 'wall' && 'Fixed Wall/Surface (Rx, Ry)'}
                    </span>
                  </div>
                  <div className="inspector-row">
                    <span className="field-name">Location:</span>
                    <span className="field-value font-mono">Joint {joint?.label}</span>
                  </div>
                  {support.type === 'roller' && (
                    <div className="inspector-row-stack">
                      <span className="field-name">Reaction Axis:</span>
                      <div className="segmented-control" style={{ marginTop: '4px' }}>
                        <button
                          type="button"
                          className={(!support.orientation || support.orientation === 'horizontal') ? 'active' : ''}
                          onClick={() => updateSupportOrientation(support.id, 'horizontal')}
                        >
                          Horizontal Base (Ry)
                        </button>
                        <button
                          type="button"
                          className={support.orientation === 'vertical' ? 'active' : ''}
                          onClick={() => updateSupportOrientation(support.id, 'vertical')}
                        >
                          Vertical Base (Rx)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          } else if (selectedItem.type === 'force') {
            const force = forces.find(f => f.id === selectedItem.id);
            if (force) {
              const joint = joints.find(j => j.id === force.jointId);
              const solvedTarget = solver?.solvedUnknownForces?.find(u => u.id === force.id);
              itemDetails = (
                <div className="inspector-fields">
                  <div className="inspector-row">
                    <span className="field-name">{force.isUnknown ? 'Target Unknown Force:' : 'Load Vector:'}</span>
                    <span className="field-value font-mono highlight">
                      {force.isUnknown
                        ? (solvedTarget
                            ? `${force.targetLabel || 'P'} = ${formatForce(solvedTarget.magnitude)} (Solved)`
                            : `${force.targetLabel || 'P'} = ? (Unknown Target)`)
                        : formatForce(force.magnitude)}
                    </span>
                  </div>
                  <div className="inspector-row">
                    <span className="field-name">Applied At:</span>
                    <span className="field-value font-mono">Joint {joint?.label}</span>
                  </div>
                  <div className="inspector-row">
                    <span className="field-name">Angle:</span>
                    <span className="field-value font-mono">
                      {force.angle}°
                      {!force.isUnknown && ` (Fx = ${formatForce(force.fx)}, Fy = ${formatForce(force.fy)})`}
                    </span>
                  </div>
                </div>
              );
            }
          }

          return (
            <div className="analysis-card inspector-card">
              <div className="card-header">
                <span className="card-title">ELEMENT INSPECTOR</span>
                <button
                  type="button"
                  className="btn-delete-element"
                  onClick={() => deleteItem(selectedItem.type, selectedItem.id)}
                  title="Delete this element (Del or Backspace)"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
              {itemDetails}
            </div>
          );
        })()}
      </div>
    </aside>
  );
}
