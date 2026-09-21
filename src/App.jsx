import React, { useState, useEffect } from 'react';
import { TrussProvider, useTruss } from './context/TrussContext';
import Toolbox from './components/Toolbox';
import Canvas from './components/Canvas';
import AnalysisPanel from './components/AnalysisPanel';
import PrecisionModal from './components/PrecisionModal';
import TeamPage from './components/TeamPage';
import TargetCursor from './components/TargetCursor';
import {
  RotateCcw,
  Compass,
  Users,
  Undo2,
  Redo2,
  Layers,
  Activity,
  Minus,
  CircleDot,
  ArrowDownCircle,
  Eraser,
  Play,
  Sliders,
  Menu,
  X
} from 'lucide-react';
import './styles/blueprint.css';

function MainLayout() {
  const {
    joints,
    members,
    supports,
    forces,
    resetView,
    undo,
    redo,
    canUndo,
    canRedo,
    lengthUnit,
    setLengthUnit,
    forceUnit,
    setForceUnit,
    armedTool,
    setArmedTool,
    activeTool,
    setActiveTool,
    runAnalysis,
    freeHandState
  } = useTruss();

  const [currentPage, setCurrentPage] = useState('studio');
  const [mobileDrawer, setMobileDrawer] = useState(null); // 'toolbox' | 'analysis' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent browser-level pinch/Ctrl+wheel page zooming globally
  useEffect(() => {
    const handleGlobalWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const handleGesture = (e) => {
      e.preventDefault();
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    window.addEventListener('gesturestart', handleGesture, { passive: false });
    window.addEventListener('gesturechange', handleGesture, { passive: false });
    window.addEventListener('gestureend', handleGesture, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('gesturestart', handleGesture);
      window.removeEventListener('gesturechange', handleGesture);
      window.removeEventListener('gestureend', handleGesture);
    };
  }, []);

  return (
    <div className="app-container">
      {/* Top Engineering Nav Header */}
      <header className="app-header">
        <div
          className="brand-section cursor-target"
          onClick={() => setCurrentPage('studio')}
          title="Return to Z-Truss Studio Simulator"
          style={{ cursor: 'pointer' }}
        >
          <img
            src="/favicon.svg"
            alt="Z-Truss Logo"
            className="brand-logo-img"
            style={{ width: 34, height: 34, borderRadius: 6, display: 'block' }}
          />
          <div className="brand-title-wrap">
            <h1 className="brand-name">Z-TRUSS</h1>
            <span className="brand-tag">v1.0 • STATICS &amp; TRUSS SOLVER</span>
          </div>
        </div>

        {/* View Switcher: Studio vs Contributors Team */}
        <div className="header-nav-tabs">
          <button
            type="button"
            className={`header-nav-tab cursor-target ${currentPage === 'studio' ? 'active' : ''}`}
            onClick={() => setCurrentPage('studio')}
            title="Open Interactive Structural Studio"
          >
            <Compass size={14} />
            <span>Truss Studio</span>
          </button>
          <button
            type="button"
            className={`header-nav-tab cursor-target ${currentPage === 'team' ? 'active' : ''}`}
            onClick={() => setCurrentPage('team')}
            title="View Project Contributors & Engineering Team"
          >
            <Users size={14} />
            <span>Project Team</span>
            <span className="header-tab-badge">8</span>
          </button>
        </div>

        {currentPage === 'studio' && (
          <div className="header-center-info">
            <div className="info-stat">
              <span>Joints (j):</span>
              <span className="info-stat-num">{joints.length}</span>
            </div>
            <span>|</span>
            <div className="info-stat">
              <span>Members (m):</span>
              <span className="info-stat-num">{members.length}</span>
            </div>
            <span>|</span>
            <div className="info-stat">
              <span>Supports (r):</span>
              <span className="info-stat-num">
                {supports.reduce((acc, s) => acc + (s.type === 'roller' ? 1 : 2), 0)}
              </span>
            </div>
            <span>|</span>
            <div className="info-stat">
              <span>Loads:</span>
              <span className="info-stat-num">{forces.length}</span>
            </div>
          </div>
        )}

        <div className="header-actions">
          {currentPage === 'studio' && (
            <>
              {/* Engineering Units Quick Switcher */}
              <div className="header-units-control">
                <div className="header-unit-group" title="Length Unit: Meters vs Centimeters">
                  <span className="header-unit-label">LEN</span>
                  <div className="header-segmented-pill">
                    <button
                      type="button"
                      className={`header-pill-chip cursor-target ${lengthUnit === 'm' ? 'active' : ''}`}
                      onClick={() => setLengthUnit('m')}
                    >
                      m
                    </button>
                    <button
                      type="button"
                      className={`header-pill-chip cursor-target ${lengthUnit === 'cm' ? 'active' : ''}`}
                      onClick={() => setLengthUnit('cm')}
                    >
                      cm
                    </button>
                  </div>
                </div>

                <div className="header-unit-group" title="Force Unit: Kilonewtons vs Newtons">
                  <span className="header-unit-label">FORCE</span>
                  <div className="header-segmented-pill">
                    <button
                      type="button"
                      className={`header-pill-chip cursor-target ${forceUnit === 'kN' ? 'active' : ''}`}
                      onClick={() => setForceUnit('kN')}
                    >
                      kN
                    </button>
                    <button
                      type="button"
                      className={`header-pill-chip cursor-target ${forceUnit === 'N' ? 'active' : ''}`}
                      onClick={() => setForceUnit('N')}
                    >
                      N
                    </button>
                  </div>
                </div>
              </div>

              <div className="header-action-divider" />

              <div className="header-history-btns">
                <button
                  type="button"
                  className={`header-tool-btn undo-btn cursor-target ${!canUndo ? 'disabled' : ''}`}
                  title="Undo last action (Ctrl+Z)"
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <Undo2 size={15} />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  className={`header-tool-btn redo-btn cursor-target ${!canRedo ? 'disabled' : ''}`}
                  title="Redo next action (Ctrl+Y)"
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <Redo2 size={15} />
                  <span>Redo</span>
                </button>
              </div>

              {/* Mobile Header Menu Toggle Button (Visible < 1024px) */}
              <button
                type="button"
                className={`mobile-header-toggle-btn cursor-target ${mobileMenuOpen ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(prev => !prev)}
                title="Toggle Mobile Header Menu"
                aria-label="Toggle Mobile Header Menu"
              >
                {mobileMenuOpen ? <X size={17} /> : <Sliders size={17} />}
                <span>Menu</span>
              </button>

              <button
                type="button"
                className="canvas-icon-btn cursor-target"
                title="Reset Canvas View"
                onClick={() => resetView(window.innerWidth - 630, window.innerHeight - 70)}
              >
                <RotateCcw size={16} />
              </button>
            </>
          )}

          {currentPage === 'team' && (
            <div className="header-team-actions">
              <button
                type="button"
                className="header-tool-btn cursor-target"
                onClick={() => setCurrentPage('studio')}
              >
                <Compass size={15} />
                <span>Truss Studio</span>
              </button>
              <button
                type="button"
                className={`mobile-header-toggle-btn cursor-target ${mobileMenuOpen ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(prev => !prev)}
                title="Toggle Mobile Header Menu"
              >
                {mobileMenuOpen ? <X size={17} /> : <Sliders size={17} />}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Collapsible Sub-Header Toggle Bar (< 1024px) */}
      {mobileMenuOpen && (
        <div className="mobile-header-dropdown-bar">
          {/* View Page Selector */}
          <div className="mobile-dropdown-section">
            <span className="dropdown-section-tag">VIEW MODE</span>
            <div className="dropdown-nav-row">
              <button
                type="button"
                className={`dropdown-nav-chip ${currentPage === 'studio' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage('studio');
                  setMobileMenuOpen(false);
                }}
              >
                <Compass size={14} />
                <span>Truss Studio</span>
              </button>
              <button
                type="button"
                className={`dropdown-nav-chip ${currentPage === 'team' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage('team');
                  setMobileMenuOpen(false);
                }}
              >
                <Users size={14} />
                <span>Project Team (8)</span>
              </button>
            </div>
          </div>

          {/* Unit Switchers */}
          {currentPage === 'studio' && (
            <div className="mobile-dropdown-section">
              <span className="dropdown-section-tag">ENGINEERING UNITS</span>
              <div className="dropdown-units-row">
                <div className="dropdown-unit-group">
                  <span className="dropdown-unit-lbl">LENGTH</span>
                  <div className="dropdown-pills">
                    <button
                      type="button"
                      className={`dropdown-pill-btn ${lengthUnit === 'm' ? 'active' : ''}`}
                      onClick={() => setLengthUnit('m')}
                    >
                      Meters (m)
                    </button>
                    <button
                      type="button"
                      className={`dropdown-pill-btn ${lengthUnit === 'cm' ? 'active' : ''}`}
                      onClick={() => setLengthUnit('cm')}
                    >
                      Centimeters (cm)
                    </button>
                  </div>
                </div>

                <div className="dropdown-unit-group">
                  <span className="dropdown-unit-lbl">FORCE</span>
                  <div className="dropdown-pills">
                    <button
                      type="button"
                      className={`dropdown-pill-btn ${forceUnit === 'kN' ? 'active' : ''}`}
                      onClick={() => setForceUnit('kN')}
                    >
                      Kilonewtons (kN)
                    </button>
                    <button
                      type="button"
                      className={`dropdown-pill-btn ${forceUnit === 'N' ? 'active' : ''}`}
                      onClick={() => setForceUnit('N')}
                    >
                      Newtons (N)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Drawers & Stats */}
          {currentPage === 'studio' && (
            <div className="mobile-dropdown-section">
              <span className="dropdown-section-tag">PANELS &amp; STATS</span>
              <div className="dropdown-panels-row">
                <button
                  type="button"
                  className={`dropdown-panel-btn ${mobileDrawer === 'toolbox' ? 'active' : ''}`}
                  onClick={() => {
                    setMobileDrawer(d => d === 'toolbox' ? null : 'toolbox');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Layers size={14} />
                  <span>Toolbox ({joints.length}J, {members.length}M)</span>
                </button>
                <button
                  type="button"
                  className={`dropdown-panel-btn ${mobileDrawer === 'analysis' ? 'active' : ''}`}
                  onClick={() => {
                    setMobileDrawer(d => d === 'analysis' ? null : 'analysis');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Activity size={14} />
                  <span>Analysis Answers &amp; Reactions</span>
                </button>
              </div>
            </div>
          )}

          {/* History Undo / Redo & Fit */}
          {currentPage === 'studio' && (
            <div className="mobile-dropdown-section">
              <span className="dropdown-section-tag">WORKSPACE ACTIONS</span>
              <div className="dropdown-actions-row">
                <button
                  type="button"
                  className={`dropdown-action-btn ${!canUndo ? 'disabled' : ''}`}
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <Undo2 size={14} />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  className={`dropdown-action-btn ${!canRedo ? 'disabled' : ''}`}
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <Redo2 size={14} />
                  <span>Redo</span>
                </button>
                <button
                  type="button"
                  className="dropdown-action-btn"
                  onClick={() => {
                    resetView(window.innerWidth, window.innerHeight - 70);
                    setMobileMenuOpen(false);
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Reset Fit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View router */}
      {currentPage === 'studio' ? (
        <>
          {/* Left Sidebar Toolbox + Canvas + Analysis Studio */}
          <main className="app-main">
            {/* Left Sidebar Toolbox (Drawer on mobile) */}
            <div className={`toolbox-drawer-wrapper ${mobileDrawer === 'toolbox' ? 'open' : ''}`}>
              <Toolbox
                onClose={() => setMobileDrawer(null)}
                onShowAnalysis={() => setMobileDrawer('analysis')}
              />
            </div>

            {/* Interactive Canvas */}
            <Canvas />

            {/* Right Analysis Studio (Drawer on mobile) */}
            <div className={`analysis-drawer-wrapper ${mobileDrawer === 'analysis' ? 'open' : ''}`}>
              <AnalysisPanel onClose={() => setMobileDrawer(null)} />
            </div>

            {/* Mobile Drawer Backdrop Overlay */}
            {mobileDrawer && (
              <div
                className="mobile-drawer-backdrop"
                onClick={() => setMobileDrawer(null)}
              />
            )}

            {/* Mobile Quick Floating Command Ribbon (Only visible on screens < 1024px) */}
            <nav className="mobile-quick-toolbar" aria-label="Mobile Quick Drawing Ribbon">
              <button
                type="button"
                className={`mobile-tool-chip cursor-target ${mobileDrawer === 'toolbox' ? 'active' : ''}`}
                onClick={() => setMobileDrawer(prev => prev === 'toolbox' ? null : 'toolbox')}
                title="Open Complete Toolbox"
              >
                <Layers size={15} />
                <span>Tools</span>
              </button>

              <button
                type="button"
                className={`mobile-tool-chip cursor-target ${armedTool?.id === 'freehand' || freeHandState?.isActive ? 'active' : ''}`}
                onClick={() => {
                  if (armedTool?.id === 'freehand') {
                    setArmedTool(null);
                  } else {
                    setArmedTool({
                      id: 'freehand',
                      category: 'member',
                      label: 'Free-Hand Member',
                      badge: '★ Free'
                    });
                    setActiveTool('select');
                    setMobileDrawer(null);
                  }
                }}
                title="Draw Member"
              >
                <Compass size={15} />
                <span>Draw</span>
              </button>

              <button
                type="button"
                className={`mobile-tool-chip cursor-target ${armedTool?.id === 'horizontal' ? 'active' : ''}`}
                onClick={() => {
                  if (armedTool?.id === 'horizontal') {
                    setArmedTool(null);
                  } else {
                    setArmedTool({
                      id: 'horizontal',
                      category: 'member',
                      label: '0° Horizontal Truss',
                      badge: '0°'
                    });
                    setActiveTool('select');
                    setMobileDrawer(null);
                  }
                }}
                title="0° Horizontal Member"
              >
                <Minus size={15} />
                <span>0° Bar</span>
              </button>

              <button
                type="button"
                className={`mobile-tool-chip cursor-target ${armedTool?.category === 'support' ? 'active' : ''}`}
                onClick={() => {
                  if (armedTool?.category === 'support') {
                    setArmedTool(null);
                  } else {
                    setArmedTool({
                      id: 'pin',
                      category: 'support',
                      label: 'Pin Support (Rx, Ry)'
                    });
                    setActiveTool('select');
                    setMobileDrawer(null);
                  }
                }}
                title="Attach Pin Support"
              >
                <CircleDot size={15} />
                <span>Support</span>
              </button>

              <button
                type="button"
                className={`mobile-tool-chip cursor-target ${armedTool?.category === 'force' ? 'active' : ''}`}
                onClick={() => {
                  if (armedTool?.category === 'force') {
                    setArmedTool(null);
                  } else {
                    setArmedTool({
                      id: 'force',
                      category: 'force',
                      label: 'Downward Point Load',
                      magnitude: forceUnit === 'N' ? 15000 : 15,
                      angle: 270
                    });
                    setActiveTool('select');
                    setMobileDrawer(null);
                  }
                }}
                title="Add Point Load"
              >
                <ArrowDownCircle size={15} />
                <span>Load</span>
              </button>

              <button
                type="button"
                className={`mobile-tool-chip cursor-target ${activeTool === 'eraser' ? 'active' : ''}`}
                onClick={() => {
                  setArmedTool(null);
                  setActiveTool(prev => prev === 'eraser' ? 'select' : 'eraser');
                  setMobileDrawer(null);
                }}
                title="Sweep Eraser"
              >
                <Eraser size={15} />
                <span>Erase</span>
              </button>

              <button
                type="button"
                className="mobile-tool-chip btn-mobile-analyse cursor-target"
                onClick={() => {
                  runAnalysis();
                  setMobileDrawer('analysis');
                }}
                title="Solve & View Analysis Results"
              >
                <Play size={15} />
                <span>Solve</span>
              </button>
            </nav>
          </main>

          {/* Precision Input Modal */}
          <PrecisionModal />
        </>
      ) : (
        <TeamPage onBack={() => setCurrentPage('studio')} />
      )}

      {/* React Bits Target Cursor */}
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor={true}
        parallaxOn={true}
        cursorColor="#ffffff"
        cursorColorOnTarget="#38bdf8"
      />
    </div>
  );
}

export default function App() {
  return (
    <TrussProvider>
      <MainLayout />
    </TrussProvider>
  );
}
