import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Welcome({ onLogin }) {
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'quick_login' | 'credentials' | 'architecture'
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [modalOpen, setModalOpen] = useState(false); // Quick full-screen login modal

  // Interactive Live AI Simulator State
  const [simRating, setSimRating] = useState(3.8);
  const [simOnTime, setSimOnTime] = useState(82);
  const [simCategory, setSimCategory] = useState('ICU Equipment');
  const [simColdChain, setSimColdChain] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Authentication State
  const [f, setF] = useState({ email: '', password: '', name: '' });
  const [reg, setReg] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // Mouse tracker for interactive spotlight
  const handleMouseMove = e => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth) * 100;
    const y = (clientY / window.innerHeight) * 100;
    setMousePos({ x, y });
  };

  // Run initial simulator calculation
  useEffect(() => {
    runSimulation();
  }, [simRating, simOnTime, simCategory, simColdChain]);

  const runSimulation = () => {
    const ratingScore = (5.0 - simRating) * 18.5;
    const onTimeScore = (100.0 - simOnTime) * 0.6;
    const coldPenalty = simColdChain ? 15.0 : 0;
    const rawProb = Math.min(95, Math.max(5, Math.round(ratingScore + onTimeScore + coldPenalty)));
    const defectProb = Math.min(60, Math.max(2, Math.round((5.0 - simRating) * 9.5 + (simColdChain ? 6 : 0))));

    let tier = 'Low Risk';
    let badgeClass = 'text-success border-success';
    let recommendation = 'Optimal procurement terms. Fast-track PO approval.';

    if (rawProb >= 48 || defectProb >= 25) {
      tier = 'High Clinical Risk';
      badgeClass = 'text-danger border-danger';
      recommendation = 'Critical delivery bottleneck detected. Mandatory secondary vendor backup.';
    } else if (rawProb >= 22 || defectProb >= 10) {
      tier = 'Moderate Risk';
      badgeClass = 'text-warning border-warning';
      recommendation = 'Proceed with milestone delivery tracking & goods inspection.';
    }

    setSimResult({
      delayProb: rawProb,
      defectProb,
      tier,
      badgeClass,
      recommendation
    });
  };

  const submit = async e => {
    e.preventDefault();
    setErr('');
    if (!/^\S+@\S+\.\S+$/.test(f.email) || f.password.length < 8) {
      return setErr('Enter a valid email and a password of 8+ characters');
    }
    setLoading(true);
    try {
      const d = await api(reg ? '/auth/register' : '/auth/login', 'POST', f);
      localStorage.setItem('token', d.token);
      onLogin(d.user);
    } catch (x) {
      setErr(x.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email, password = 'Password@123') => {
    setErr('');
    setLoading(true);
    try {
      const d = await api('/auth/login', 'POST', { email, password });
      localStorage.setItem('token', d.token);
      onLogin(d.user);
    } catch (x) {
      setErr(x.message);
    } finally {
      setLoading(false);
    }
  };

  // Flowing ribbon wave paths
  const wavePaths = Array.from({ length: 22 }, (_, i) => {
    const yOffset = i * 9.5;
    const c1y = 310 + i * 7.5;
    const c2y = 580 - i * 6.5;
    const c3y = 340 + i * 8.5;
    const c4y = 510 - i * 7.2;
    return `M -100 ${390 + yOffset} C 220 ${c1y} 410 ${c2y} 620 ${400 + yOffset} C 840 ${c3y} 980 ${c4y} 1220 ${410 + yOffset}`;
  });

  const orbitalCircles = [40, 75, 115, 160, 210, 265, 325];

  return (
    <div
      className="welcome-edge-root min-vh-100 text-white position-relative d-flex flex-column justify-content-between overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        background: 'radial-gradient(circle at 50% 15%, #180601 0%, #100400 45%, #070200 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* ========================================================
          BACKGROUND GLOWING AURORAS & INTERACTIVE SPOTLIGHT
          ======================================================== */}
      {/* Top Center Radiant Sun Nebula */}
      <div
        className="position-absolute pointer-events-none"
        style={{
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '750px',
          background: 'radial-gradient(ellipse at center, rgba(255, 87, 34, 0.35) 0%, rgba(255, 109, 0, 0.12) 45%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(75px)',
          animation: 'edgeAuraPulse1 12s ease-in-out infinite alternate',
          zIndex: 1
        }}
      />

      {/* Bottom Right Amber Glow Nebula */}
      <div
        className="position-absolute pointer-events-none"
        style={{
          bottom: '-25%',
          right: '-10%',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(255, 152, 0, 0.25) 0%, rgba(255, 61, 0, 0.08) 55%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'edgeAuraPulse2 16s ease-in-out infinite alternate',
          zIndex: 1
        }}
      />

      {/* Interactive Cursor Spotlight Follower */}
      <div
        className="position-absolute pointer-events-none"
        style={{
          top: `${mousePos.y}%`,
          left: `${mousePos.x}%`,
          transform: 'translate(-50%, -50%)',
          width: '560px',
          height: '560px',
          background: 'radial-gradient(circle, rgba(255, 109, 0, 0.16) 0%, rgba(255, 87, 34, 0.05) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          transition: 'top 0.12s ease-out, left 0.12s ease-out',
          zIndex: 2
        }}
      />

      {/* Background SVG Wave Ribbons & Laser Orbits */}
      <svg
        className="position-absolute top-0 start-0 w-100 h-100 pe-none"
        viewBox="0 0 1100 650"
        preserveAspectRatio="none"
        style={{ opacity: 0.7, zIndex: 2 }}
      >
        <defs>
          <linearGradient id="edgeFireLaser" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3d00" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#ff9100" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffb74d" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="edgeRingLaser" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6d00" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffa000" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Concentric Orbital Rings */}
        <g stroke="url(#edgeRingLaser)" strokeWidth="0.85" fill="none">
          {orbitalCircles.map((r, idx) => (
            <circle key={`ring-${idx}`} cx="160" cy="480" r={r} />
          ))}
          {orbitalCircles.map((r, idx) => (
            <circle key={`ring2-${idx}`} cx="940" cy="480" r={r} />
          ))}
        </g>

        {/* Fiery Flowing Waves */}
        <g stroke="url(#edgeFireLaser)" strokeWidth="0.95" fill="none">
          {wavePaths.map((d, idx) => (
            <path key={`wave-${idx}`} d={d} />
          ))}
        </g>
      </svg>

      {/* ========================================================
          TOP NAVIGATION BAR (Glassmorphism & Neon Brand)
          ======================================================== */}
      <header
        className="d-flex justify-content-between align-items-center px-4 px-lg-5 py-4 position-relative"
        style={{ zIndex: 20 }}
      >
        {/* Brand */}
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{
              width: 38,
              height: 38,
              background: 'linear-gradient(135deg, #ff3d00 0%, #ff8f00 100%)',
              boxShadow: '0 0 20px rgba(255, 87, 34, 0.7)'
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 900 }}>⚡</span>
          </div>
          <div>
            <div
              className="fw-bold tracking-wider text-uppercase"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.25rem',
                letterSpacing: '2px',
                lineHeight: 1
              }}
            >
              MEDIPROCURE<span style={{ color: '#ff7043' }}>IQ</span>
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                letterSpacing: '1.5px',
                color: '#b08d7d',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600
              }}
            >
              HEALTHCARE INTELLIGENCE &middot; GCP CLOUD
            </div>
          </div>
        </div>

        {/* Center Pill Navigation */}
        <nav className="d-none d-md-flex align-items-center gap-1 p-1 rounded-pill" style={{ backgroundColor: 'rgba(25, 10, 4, 0.75)', border: '1px solid rgba(255, 109, 0, 0.25)', backdropFilter: 'blur(12px)' }}>
          {[
            ['simulator', '⚡ Live AI Simulator'],
            ['quick_login', '👤 Quick Personas'],
            ['credentials', '🔒 Sign In'],
            ['architecture', '☁️ Cloud Architecture']
          ].map(([id, label]) => (
            <button
              key={id}
              className={`btn btn-sm px-3 py-1 rounded-pill text-uppercase fw-semibold ${activeTab === id ? 'text-white' : 'text-muted'}`}
              style={{
                fontSize: '0.72rem',
                letterSpacing: '1px',
                backgroundColor: activeTab === id ? '#ff5722' : 'transparent',
                boxShadow: activeTab === id ? '0 0 15px rgba(255, 87, 34, 0.6)' : 'none',
                transition: 'all 0.2s ease',
                border: 'none'
              }}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right Action Button */}
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-sm px-4 py-2 rounded-pill fw-bold text-uppercase d-flex align-items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #ff5722 0%, #ff8f00 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.75rem',
              letterSpacing: '1.5px',
              boxShadow: '0 0 25px rgba(255, 87, 34, 0.65)'
            }}
            onClick={() => setModalOpen(true)}
          >
            <span>ACCESS PORTAL &rarr;</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          HERO SECTION & THE EDGE TERMINAL SHOWCASE
          ======================================================== */}
      <main className="container-fluid px-4 px-lg-5 position-relative my-auto py-4" style={{ zIndex: 15 }}>
        <div className="row g-5 align-items-center">
          {/* Left Column: Bold Kinetic Typography & Pitch */}
          <div className="col-lg-6 text-start">
            {/* Pulsing Eyebrow Badge */}
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3 edge-badge">
              <span className="edge-live-dot" />
              <span>EXPERIENCE AT THE EDGE &middot; GCP CLOUD PLATFORM</span>
            </div>

            {/* Giant Hero Title */}
            <h1
              className="display-2 fw-extrabold mb-3 edge-title-gradient"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-1.5px',
                lineHeight: 1.05
              }}
            >
              EXPERIENCE <br />
              AT THE EDGE
            </h1>

            {/* Sub-headline */}
            <div
              className="fs-3 mb-3 edge-subtitle-text"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
            >
              Healthcare Supply Chain &amp; Supplier Risk Intelligence
            </div>

            {/* Body Description */}
            <p className="edge-body-text mb-4" style={{ maxWidth: '540px', fontSize: '1rem', lineHeight: 1.8 }}>
              Engineered for mission-critical hospital procurement. Orchestrates automated
              Google Cloud Storage ETL pipelines, in-database BigQuery ML delivery delay prediction,
              and strict zero-trust segregation of duties across clinical hospital departments.
            </p>

            {/* Dual Actions */}
            <div className="d-flex align-items-center gap-3 flex-wrap mb-4">
              <button
                className="btn-edge-primary"
                onClick={() => setModalOpen(true)}
              >
                ENTER PROCUREMENT PORTAL &rarr;
              </button>

              <button
                className="btn btn-outline-light rounded-pill px-4 py-3 fw-bold text-uppercase"
                style={{
                  fontSize: '0.8rem',
                  letterSpacing: '1px',
                  borderColor: 'rgba(255, 109, 0, 0.4)',
                  backgroundColor: 'rgba(255, 87, 34, 0.08)',
                  color: '#ffccbc'
                }}
                onClick={() => setActiveTab('simulator')}
              >
                TEST RISK SIMULATOR ⚡
              </button>
            </div>

            {/* Real-time Platform Metrics Ticker */}
            <div className="row g-3 pt-3 border-top border-secondary-subtle" style={{ borderColor: 'rgba(255, 109, 0, 0.2) !important' }}>
              <div className="col-4">
                <div className="fs-4 fw-bold text-white font-monospace">1,200+</div>
                <div className="text-muted small text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
                  Clinical Records
                </div>
              </div>
              <div className="col-4">
                <div className="fs-4 fw-bold font-monospace" style={{ color: '#ff9800' }}>84.4%</div>
                <div className="text-muted small text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
                  Delivery Fidelity
                </div>
              </div>
              <div className="col-4">
                <div className="fs-4 fw-bold font-monospace" style={{ color: '#4caf50' }}>57 / 57</div>
                <div className="text-muted small text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
                  Unit Tests Passed
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: "The Edge Terminal" Interactive Showcase Card */}
          <div className="col-lg-6">
            <div
              className="edge-canvas-wrapper p-4 p-md-5"
              style={{
                backgroundColor: 'rgba(18, 7, 3, 0.88)',
                minHeight: 520,
                border: '1px solid rgba(255, 109, 0, 0.35)',
                boxShadow: '0 30px 100px rgba(0, 0, 0, 0.95), 0 0 60px rgba(255, 87, 34, 0.22)'
              }}
            >
              {/* Terminal Window Header */}
              <div className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom" style={{ borderColor: 'rgba(255, 109, 0, 0.2)' }}>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5252', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffb142', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2ed573', display: 'inline-block' }} />
                  <span className="ms-2 font-monospace small" style={{ color: '#ffb74d', fontSize: '0.75rem', letterSpacing: '1px' }}>
                    TERMINAL // MEDIPROCURE-EDGE-AI
                  </span>
                </div>

                <div className="d-flex gap-1">
                  {['simulator', 'quick_login', 'credentials'].map(tab => (
                    <button
                      key={tab}
                      className={`btn btn-sm px-2 py-0 rounded ${activeTab === tab ? 'bg-danger text-white' : 'text-muted'}`}
                      style={{
                        fontSize: '0.68rem',
                        backgroundColor: activeTab === tab ? 'rgba(255, 87, 34, 0.3)' : 'transparent',
                        borderColor: activeTab === tab ? '#ff5722' : 'transparent'
                      }}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'simulator' ? 'Simulate' : tab === 'quick_login' ? 'Personas' : 'Sign In'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ========================================================
                  TAB 1: LIVE INTERACTIVE BIGQUERY ML SIMULATOR
                  ======================================================== */}
              {activeTab === 'simulator' && (
                <div className="fade-in-content text-start">
                  <div className="d-flex justify-content-between align-items-baseline mb-3">
                    <div>
                      <div className="text-uppercase tracking-wider fw-bold text-white small" style={{ letterSpacing: '1.5px' }}>
                        BigQuery ML Delivery Delay Predictor
                      </div>
                      <small className="text-muted">Interactive in-database inference simulation</small>
                    </div>
                    <span className={`badge border px-2 py-1 ${simResult?.badgeClass || 'text-warning'}`}>
                      {simResult?.tier}
                    </span>
                  </div>

                  {/* Simulator Sliders & Inputs */}
                  <div className="space-y-16 mb-4">
                    {/* Supplier Rating Slider */}
                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-muted">Supplier Historical Quality Rating:</span>
                        <span className="fw-bold font-monospace" style={{ color: '#ff9800' }}>{simRating} / 5.0</span>
                      </div>
                      <input
                        type="range"
                        className="form-range"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        value={simRating}
                        onChange={e => setSimRating(parseFloat(e.target.value))}
                        style={{ accentColor: '#ff5722' }}
                      />
                    </div>

                    {/* On-Time Delivery % Slider */}
                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-muted">Fulfillment On-Time Rate:</span>
                        <span className="fw-bold font-monospace" style={{ color: '#ff9800' }}>{simOnTime}%</span>
                      </div>
                      <input
                        type="range"
                        className="form-range"
                        min="40"
                        max="100"
                        step="1"
                        value={simOnTime}
                        onChange={e => setSimOnTime(parseInt(e.target.value, 10))}
                        style={{ accentColor: '#ff5722' }}
                      />
                    </div>

                    {/* Category & Cold Chain Checkbox */}
                    <div className="row g-2 align-items-center">
                      <div className="col-7">
                        <select
                          className="form-select form-select-sm input-edge text-white"
                          value={simCategory}
                          onChange={e => setSimCategory(e.target.value)}
                        >
                          <option value="ICU Equipment">ICU Equipment</option>
                          <option value="Pharmaceuticals">Pharmaceuticals</option>
                          <option value="Surgical Supplies">Surgical Supplies</option>
                          <option value="PPE & Sanitization">PPE &amp; Sanitization</option>
                          <option value="Diagnostic Devices">Diagnostic Devices</option>
                        </select>
                      </div>
                      <div className="col-5">
                        <div className="form-check small text-start">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="coldCheck"
                            checked={simColdChain}
                            onChange={e => setSimColdChain(e.target.checked)}
                            style={{ accentColor: '#ff5722' }}
                          />
                          <label className="form-check-label text-muted" htmlFor="coldCheck">
                            Cold Chain Req.
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Calculated Probabilities Output Box */}
                  <div
                    className="p-3 rounded-3 mb-4"
                    style={{
                      backgroundColor: 'rgba(255, 87, 34, 0.08)',
                      border: '1px solid rgba(255, 109, 0, 0.3)'
                    }}
                  >
                    <div className="row g-2 text-center">
                      <div className="col-6 border-end" style={{ borderColor: 'rgba(255, 109, 0, 0.2)' }}>
                        <div className="text-muted small text-uppercase" style={{ fontSize: '0.65rem' }}>Delay Probability</div>
                        <div className="fs-3 fw-bold font-monospace" style={{ color: simResult?.delayProb > 40 ? '#ff5252' : '#ff9800' }}>
                          {simResult?.delayProb}%
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-muted small text-uppercase" style={{ fontSize: '0.65rem' }}>Defect Batch Risk</div>
                        <div className="fs-3 fw-bold font-monospace" style={{ color: simResult?.defectProb > 20 ? '#ff5252' : '#4caf50' }}>
                          {simResult?.defectProb}%
                        </div>
                      </div>
                    </div>
                    <div className="text-muted small mt-2 pt-2 border-top border-secondary-subtle" style={{ fontSize: '0.78rem' }}>
                      ⚡ <strong>Recommendation:</strong> {simResult?.recommendation}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    className="btn btn-edge-primary w-100 py-2"
                    onClick={() => setModalOpen(true)}
                  >
                    OPEN FULL PLATFORM WORKFLOW &rarr;
                  </button>
                </div>
              )}

              {/* ========================================================
                  TAB 2: 1-CLICK PERSONA LOGIN (INSTANT ROLE DEMOS)
                  ======================================================== */}
              {activeTab === 'quick_login' && (
                <div className="fade-in-content text-start">
                  <div className="text-uppercase tracking-wider fw-bold text-white small mb-1" style={{ letterSpacing: '1.5px' }}>
                    Select Demo Persona
                  </div>
                  <p className="text-muted small mb-3">
                    Click any role to log in instantly with Role-Based Access Control:
                  </p>

                  <div className="d-flex flex-column gap-2 mb-3">
                    <button
                      className="btn role-card-edge text-start p-2 p-md-3"
                      disabled={loading}
                      onClick={() => quickLogin('requester@procureiq.com')}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-white">Ravi Requester</span>
                        <span className="badge role-badge">REQUESTER</span>
                      </div>
                      <small className="text-muted d-block mt-1">Raises requisitions &amp; monitors status</small>
                    </button>

                    <button
                      className="btn role-card-edge text-start p-2 p-md-3"
                      disabled={loading}
                      onClick={() => quickLogin('officer@procureiq.com')}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-white">Olivia Officer</span>
                        <span className="badge role-badge">OFFICER</span>
                      </div>
                      <small className="text-muted d-block mt-1">Evaluates bids, awards contracts &amp; issues POs</small>
                    </button>

                    <button
                      className="btn role-card-edge text-start p-2 p-md-3"
                      disabled={loading}
                      onClick={() => quickLogin('approver@procureiq.com')}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-white">Manu Manager</span>
                        <span className="badge role-badge">APPROVER</span>
                      </div>
                      <small className="text-muted d-block mt-1">Executive approvals &amp; no-self-approval rule</small>
                    </button>

                    <button
                      className="btn role-card-edge text-start p-2 p-md-3"
                      disabled={loading}
                      onClick={() => quickLogin('admin@procureiq.com')}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-white">Alice Admin</span>
                        <span className="badge role-badge">ADMIN</span>
                      </div>
                      <small className="text-muted d-block mt-1">Global administration &amp; user provisioning</small>
                    </button>
                  </div>

                  <div className="text-muted small pt-2 border-top border-secondary-subtle">
                    Default demo password: <code>Password@123</code>
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 3: STANDARD LOGIN / REGISTER FORM
                  ======================================================== */}
              {activeTab === 'credentials' && (
                <div className="fade-in-content text-start">
                  <div className="text-uppercase tracking-wider fw-bold text-white small mb-1" style={{ letterSpacing: '1.5px' }}>
                    {reg ? 'Create Hospital Account' : 'Authenticate Credentials'}
                  </div>
                  <p className="text-muted small mb-3">
                    Enter your authorized enterprise credentials to continue:
                  </p>

                  <form onSubmit={submit}>
                    {reg && (
                      <div className="mb-3">
                        <label className="form-label text-muted small text-uppercase">Full Name</label>
                        <input
                          className="form-control input-edge"
                          placeholder="e.g. Dr. John Doe"
                          value={f.name}
                          onChange={e => setF({ ...f, name: e.target.value })}
                          required
                        />
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label text-muted small text-uppercase">Email Address</label>
                      <input
                        type="email"
                        className="form-control input-edge"
                        placeholder="e.g. officer@procureiq.com"
                        value={f.email}
                        onChange={e => setF({ ...f, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-muted small text-uppercase">Password</label>
                      <input
                        type="password"
                        className="form-control input-edge"
                        placeholder="••••••••"
                        value={f.password}
                        onChange={e => setF({ ...f, password: e.target.value })}
                        required
                      />
                    </div>

                    {err && <div className="alert alert-danger py-2 mb-3 small">{err}</div>}

                    <button
                      className="btn w-100 py-2 text-uppercase tracking-wider fw-bold mb-3"
                      style={{
                        background: 'linear-gradient(135deg, #ff5722 0%, #ff8f00 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 0 20px rgba(255, 87, 34, 0.5)'
                      }}
                      disabled={loading}
                    >
                      {loading ? 'Authenticating…' : reg ? 'Create Account' : 'Sign In To Portal'}
                    </button>
                  </form>

                  <div className="text-center">
                    <button
                      className="btn btn-link text-muted small text-decoration-none"
                      onClick={() => setReg(!reg)}
                    >
                      {reg ? 'Already have an account? Sign In' : 'New hospital user? Register as Requester'}
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 4: CLOUD ARCHITECTURE OVERVIEW
                  ======================================================== */}
              {activeTab === 'architecture' && (
                <div className="fade-in-content text-start">
                  <div className="text-uppercase tracking-wider fw-bold text-white small mb-2" style={{ letterSpacing: '1.5px' }}>
                    Google Cloud Platform Architecture
                  </div>
                  <div className="space-y-12 small text-muted">
                    <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255, 87, 34, 0.08)', border: '1px solid rgba(255, 109, 0, 0.2)' }}>
                      <strong className="text-white d-block">1. Google Cloud Storage (GCS)</strong>
                      Raw procurement dataset ingested into <code>gs://mediprocureiq-raw-data</code>.
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255, 87, 34, 0.08)', border: '1px solid rgba(255, 109, 0, 0.2)' }}>
                      <strong className="text-white d-block">2. Serverless Cloud ETL (Cloud Functions/Run)</strong>
                      Automated cleaning, cold-chain checks, and BigQuery warehouse ingestion.
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255, 87, 34, 0.08)', border: '1px solid rgba(255, 109, 0, 0.2)' }}>
                      <strong className="text-white d-block">3. BigQuery ML &amp; Looker Studio</strong>
                      In-database Logistic Regression and Gradient Boosted Tree models with BI dashboards.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================
          FULL-SCREEN AUTHENTICATION MODAL DRAWER
          ======================================================== */}
      {modalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor: 'rgba(7, 2, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            zIndex: 100
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="edge-canvas-wrapper p-4 p-md-5 w-100"
            style={{
              maxWidth: 820,
              backgroundColor: 'rgba(18, 7, 3, 0.96)',
              border: '1px solid rgba(255, 109, 0, 0.45)',
              boxShadow: '0 30px 100px rgba(0, 0, 0, 0.95), 0 0 60px rgba(255, 87, 34, 0.35)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom" style={{ borderColor: 'rgba(255, 109, 0, 0.2)' }}>
              <div>
                <span className="badge edge-badge text-uppercase mb-1">ENTERPRISE GATEWAY</span>
                <h4 className="fw-bold mb-0 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Sign In to MediProcureIQ
                </h4>
              </div>
              <button
                className="btn btn-outline-light btn-sm rounded-circle"
                style={{ width: 34, height: 34, padding: 0 }}
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="row g-4 text-start">
              {/* 1-Click Persona Login */}
              <div className="col-md-6 border-end" style={{ borderColor: 'rgba(255, 109, 0, 0.2)' }}>
                <div className="eyebrow mb-2" style={{ color: '#ff9800' }}>1-CLICK DEMO ACCESS</div>
                <p className="text-muted small mb-3">Choose any role to inspect workflow governance:</p>
                <div className="d-flex flex-column gap-2">
                  <button className="btn role-card-edge text-start p-2" onClick={() => quickLogin('requester@procureiq.com')}>
                    <div className="d-flex justify-content-between"><span className="fw-bold">Ravi Requester</span><span className="badge role-badge">REQUESTER</span></div>
                    <small className="text-muted">Drafts orders</small>
                  </button>
                  <button className="btn role-card-edge text-start p-2" onClick={() => quickLogin('officer@procureiq.com')}>
                    <div className="d-flex justify-content-between"><span className="fw-bold">Olivia Officer</span><span className="badge role-badge">OFFICER</span></div>
                    <small className="text-muted">Issues POs &amp; delivery</small>
                  </button>
                  <button className="btn role-card-edge text-start p-2" onClick={() => quickLogin('approver@procureiq.com')}>
                    <div className="d-flex justify-content-between"><span className="fw-bold">Manu Manager</span><span className="badge role-badge">APPROVER</span></div>
                    <small className="text-muted">Signs off approvals</small>
                  </button>
                  <button className="btn role-card-edge text-start p-2" onClick={() => quickLogin('admin@procureiq.com')}>
                    <div className="d-flex justify-content-between"><span className="fw-bold">Alice Admin</span><span className="badge role-badge">ADMIN</span></div>
                    <small className="text-muted">Global governance</small>
                  </button>
                </div>
              </div>

              {/* Standard Email/Password Form */}
              <div className="col-md-6">
                <div className="eyebrow mb-2" style={{ color: '#ff9800' }}>AUTHORIZED LOGIN</div>
                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label className="form-label text-muted small text-uppercase">Email</label>
                    <input
                      type="email"
                      className="form-control input-edge"
                      placeholder="e.g. approver@procureiq.com"
                      value={f.email}
                      onChange={e => setF({ ...f, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small text-uppercase">Password</label>
                    <input
                      type="password"
                      className="form-control input-edge"
                      placeholder="••••••••"
                      value={f.password}
                      onChange={e => setF({ ...f, password: e.target.value })}
                      required
                    />
                  </div>
                  {err && <div className="alert alert-danger py-2 small">{err}</div>}
                  <button
                    className="btn w-100 py-2 fw-bold text-uppercase"
                    style={{ background: 'linear-gradient(135deg, #ff5722 0%, #ff8f00 100%)', color: '#fff', border: 'none', borderRadius: 8 }}
                    disabled={loading}
                  >
                    {loading ? 'Verifying…' : 'Authenticate'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM MINIMALIST FOOTER
          ======================================================== */}
      <footer
        className="d-flex justify-content-between align-items-center px-4 px-lg-5 py-3 position-relative"
        style={{
          zIndex: 20,
          borderTop: '1px solid rgba(255, 109, 0, 0.18)',
          fontSize: '0.75rem',
          color: '#b08d7d'
        }}
      >
        <div>MediProcureIQ Platform &copy; 2026 &middot; Healthcare Supply Chain Governance</div>
        <div className="d-flex gap-3">
          <span>GCP BigQuery ML</span>
          <span>Google Cloud Storage</span>
          <span>Looker Studio BI</span>
        </div>
      </footer>
    </div>
  );
}
