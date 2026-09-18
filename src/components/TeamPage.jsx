import React, { useState } from 'react';
import {
  Users,
  Award,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Cpu,
  ShieldCheck,
  Compass,
  Layers,
  Zap,
  Search,
  BookOpen
} from 'lucide-react';

export const CONTRIBUTORS_DATA = [
  {
    id: 1,
    name: 'Sandru S',
    rollNo: '26BMV1087',
    role: 'Project Lead & Core Logic',
    specialty: 'Engineering Mechanics',
    bio: 'Set up the main project structure, coordinated the overall design, and built the core engineering calculation logic for statics and equilibrium.',
    tags: ['Project Lead', 'Core Logic', 'Statics'],
    color: '#38bdf8'
  },
  {
    id: 2,
    name: 'Sanjeev S',
    rollNo: '26BMV1059',
    role: 'Solver & Matrix Logic',
    specialty: 'Matrix Methods & Determinacy',
    bio: 'Worked on the mathematical calculation methods, joint equation solvers, and finding reactions and determinacy.',
    tags: ['Solver Logic', 'Matrix Calculations', 'Reactions'],
    color: '#818cf8'
  },
  {
    id: 3,
    name: 'Mohamad Altaf A',
    rollNo: '26BMV1073',
    role: 'Canvas & UI Layout',
    specialty: 'Interactive Drawing & Snapping',
    bio: 'Developed the interactive drawing canvas, coordinate grid layout, and click-to-place node features.',
    tags: ['Canvas Engine', 'Grid Layout', 'Click-to-Place'],
    color: '#34d399'
  },
  {
    id: 4,
    name: 'Clement Richard',
    rollNo: '26BMV1081',
    role: 'Toolbar & Interface Design',
    specialty: 'Windows Ribbon UI',
    bio: 'Designed the Windows-style top toolbar, button layouts, and overall clean visual interface.',
    tags: ['Toolbar Design', 'UI/UX Layout', 'Windows Ribbon'],
    color: '#f472b6'
  },
  {
    id: 5,
    name: 'Kavin Nilavan',
    rollNo: '26BMV1080',
    role: 'Mechanisms & Linkages',
    specialty: 'Machine Kinematics',
    bio: 'Implemented logic for moving machine parts, pin joints, and basic mechanical advantage calculations.',
    tags: ['Mechanisms', 'Linkages', 'Mechanical Advantage'],
    color: '#fb923c'
  },
  {
    id: 6,
    name: 'Ponnilavan E G',
    rollNo: '26BMV1086',
    role: 'Frame & Beam Analysis',
    specialty: 'Multi-Force Equilibrium',
    bio: 'Added support for frame structures, internal forces, and simple bending or shear force checks.',
    tags: ['Frame Structures', 'Internal Forces', 'Bending/Shear'],
    color: '#a78bfa'
  },
  {
    id: 7,
    name: 'Shadhasivram',
    rollNo: '26BMV1068',
    role: 'Units & Input Controls',
    specialty: 'Precision Standard Units',
    bio: 'Handled standard engineering unit switching (like kN/m) and clean input fields for forces and angles.',
    tags: ['Unit Switching', 'Input Controls', 'Forces & Angles'],
    color: '#facc15'
  },
  {
    id: 8,
    name: 'Kanishk M',
    rollNo: '26BMV1071',
    role: 'Testing & Verification',
    specialty: 'Benchmark Validation',
    bio: 'Tested the simulator against manual textbook problems, checked for zero-force members, and verified accuracy.',
    tags: ['Testing & QA', 'Zero-Force Verification', 'Accuracy Benchmarks'],
    color: '#2dd4bf'
  }
];

export default function TeamPage({ onBack }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContributors = CONTRIBUTORS_DATA.filter(member => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      member.name.toLowerCase().includes(term) ||
      member.rollNo.toLowerCase().includes(term) ||
      member.role.toLowerCase().includes(term) ||
      member.specialty.toLowerCase().includes(term) ||
      member.tags.some(t => t.toLowerCase().includes(term))
    );
  });

  return (
    <div className="team-page-wrapper">
      {/* Top Header Navigation Strip */}
      <div className="team-page-topbar">
        <button
          type="button"
          className="team-back-btn cursor-target"
          onClick={onBack}
          title="Return to Truss Studio Canvas"
        >
          <ArrowLeft size={16} />
          <span>Back to Truss Studio</span>
        </button>

        <div className="team-topbar-center">
          <span className="team-badge-pill">
            <Users size={14} /> 8 CONTRIBUTORS
          </span>
          <span className="team-topbar-title">Z-Truss Engineering Project Team</span>
        </div>

        <div className="team-search-box">
          <Search size={14} className="team-search-icon" />
          <input
            type="text"
            className="team-search-input"
            placeholder="Search by name, roll no, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="team-search-clear"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Team Content Body */}
      <div className="team-page-content">
        {/* Hero Section */}
        <div className="team-hero-card">
          <div className="team-hero-header">
            <div className="team-hero-logo">
              <img src="/favicon.svg" alt="Z-Truss Logo" className="team-hero-logo-img" />
            </div>
            <div className="team-hero-info">
              <h1 className="team-hero-title">Z-TRUSS PROJECT CONTRIBUTORS</h1>
              <p className="team-hero-subtitle">
                Interactive 2D Statics, Determinacy &amp; Finite Element Truss, Frame, and Machine Solver
              </p>
            </div>
          </div>

          <div className="team-stats-strip">
            <div className="team-stat-item">
              <span className="team-stat-val">8</span>
              <span className="team-stat-lbl">Core Members</span>
            </div>
            <div className="team-stat-divider" />
            <div className="team-stat-item" style={{ flex: 1.6 }}>
              <span className="team-stat-val" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Mechanical Engineering</span>
              <span className="team-stat-lbl">(Electric Vehicles)</span>
            </div>
            <div className="team-stat-divider" />
            <div className="team-stat-item">
              <span className="team-stat-val">100%</span>
              <span className="team-stat-lbl">Interactive Simulation</span>
            </div>
            <div className="team-stat-divider" />
            <div className="team-stat-item">
              <span className="team-stat-val">3-in-1</span>
              <span className="team-stat-lbl">Truss • Frame • Machine</span>
            </div>
          </div>
        </div>

        {/* Contributors Grid */}
        <div className="contributors-section-header">
          <h2 className="contributors-section-title">
            <Award size={18} className="text-cyan" />
            TEAM MEMBERS &amp; REGISTRATION NUMBERS
          </h2>
          <span className="contributors-count">
            Showing {filteredContributors.length} of {CONTRIBUTORS_DATA.length} Contributors
          </span>
        </div>

        <div className="contributors-grid">
          {filteredContributors.map((member, index) => {
            return (
              <div
                key={member.id}
                className="contributor-card cursor-target"
                style={{ '--accent-color': member.color }}
              >
                <div className="contributor-card-top">
                  <div
                    className="contributor-avatar"
                    style={{ backgroundColor: `${member.color}20`, borderColor: member.color, color: member.color }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="contributor-identity">
                    <h3 className="contributor-name">{member.name}</h3>
                    <div className="contributor-roll-badge">
                      <span className="roll-label">REG NO:</span>
                      <span className="roll-number">{member.rollNo}</span>
                    </div>
                  </div>
                  <span className="contributor-num-tag">#{index + 1}</span>
                </div>

                <div className="contributor-role-section">
                  <span className="contributor-role" style={{ color: member.color }}>
                    {member.role}
                  </span>
                  <span className="contributor-specialty">{member.specialty}</span>
                </div>

                <p className="contributor-bio">{member.bio}</p>

                <div className="contributor-tags">
                  {member.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="contributor-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="contributor-status-footer">
                  <span className="status-live-dot" />
                  <span className="status-live-text">Active Contributor • Z-Truss</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredContributors.length === 0 && (
          <div className="team-empty-state">
            <p>No contributors found matching "{searchTerm}".</p>
            <button
              type="button"
              className="team-reset-search-btn cursor-target"
              onClick={() => setSearchTerm('')}
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
