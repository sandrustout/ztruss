# Z-Truss 📐⚙️

**Interactive 2D Truss, Frame & Machine Structural Analyzer**

Z-Truss is an interactive engineering CAD and statics analysis simulator. It allows engineers, students, and educators to design 2D pin-connected trusses, rigid multi-force frames, and mechanical linkages, computing determinacy, reaction forces, and member internal stresses in real-time.

---

## ✨ Features

- **Interactive Canvas & CAD Tools**:
  - Drag-and-drop or click-to-arm toolbar for drawing 0° horizontal bars, 90° vertical struts, and sloped members (+θ, -θ, freehand).
  - Pin, roller, fulcrum pivot, and wall boundary supports.
  - Point loads, unknown solve-for forces ($P$), and vector direction controls.
  - Dynamic grid snapping with automatic node consolidation.
- **Unified Structural Mechanics Engine**:
  - **Truss Mode**: Method of joints solving pure axial forces (Tension/Compression) and detecting zero-force members.
  - **Frame Mode**: Static equilibrium for multi-force members, calculating pin reactions and internal shear/bending.
  - **Machine Mode**: Mechanical advantage ($MA = F_{\text{out}} / F_{\text{in}}$) and linkage force transmission.
  - **Auto-Classification**: Automatically detects structure type and static determinacy ($2j = m + r$).
- **Engineering Tools**:
  - Dual unit system switching: Length ($\text{m} \leftrightarrow \text{cm}$) and Force ($\text{kN} \leftrightarrow \text{N}$).
  - Full Undo / Redo history stack (`Ctrl+Z` / `Ctrl+Y`).
  - Interactive sweeps and continuous eraser tool.
  - Member aspect editing via right-click or double-click context menu.
  - Project Team page detailing contributors and architectural roles.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- `npm`

### Installation

```bash
# Clone repository
git clone https://github.com/sandrustout/ztruss.git

# Navigate to project directory
cd ztruss

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser to launch the simulator.

---

## 🛠️ Built With

- **React 18**
- **Vite**
- **GSAP**
- **Lucide React Icons**

---

## 👥 Contributors

- **Sandru S (26BMV1087)** — Project Lead & Core Logic
- **Sanjeev S (26BMV1059)** — Solver & Matrix Logic
- **Mohamad Altaf A (26BMV1073)** — Canvas & UI Layout
- **Clement Richard (26BMV1081)** — Toolbar & Interface Design
- **Kavin Nilavan (26BMV1080)** — Mechanisms & Linkages
- **Ponnilavan E G (26BMV1086)** — Frame & Beam Analysis
- **Shadhasivram (26BMV1068)** — Units & Input Controls
- **Kanishk M (26BMV1071)** — Testing & Verification
