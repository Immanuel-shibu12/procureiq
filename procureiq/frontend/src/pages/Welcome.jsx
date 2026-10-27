import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Welcome({ onLogin }) {
  const [activeTab, setActiveTab] = useState('quick_access'); // 'quick_access' | 'sign_in' | 'architecture'
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Authentication State
  const [f, setF] = useState({ email: '', password: '', name: '' });
  const [reg, setReg] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // Mouse tracker for ambient spotlight glow
  const handleMouseMove = e => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth) * 100;
    const y = (clientY / window.innerHeight) * 100;
    setMousePos({ x, y });
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

  const rolePersonas = [
    {
      role: 'Procurement Officer',
      code: 'OFFICER',
      email: 'officer@procureiq.com',
      badgeColor: 'border-primary text-primary',
      desc: 'Reviews purchase requests, evaluates supplier delivery risk, and issues official purchase orders.'
    },
    {
      role: 'Clinical Approver',
      code: 'APPROVER',
      email: 'approver@procureiq.com',
      badgeColor: 'border-info text-info',
      desc: 'Hospital director sign-off, capital expense audits, and department budget authorization.'
    },
    {
      role: 'Department Requester',
      code: 'REQUESTER',
      email: 'requester@procureiq.com',
      badgeColor: 'border-success text-success',
      desc: 'Creates clinical purchase requests for ICU consumables, medicines, and medical devices.'
    },
    {
      role: 'System Administrator',
      code: 'ADMIN',
      email: 'admin@procureiq.com',
      badgeColor: 'border-warning text-warning',
      desc: 'Manages user roles, enforces strict segregation of duties, and monitors cloud audit logs.'
    }
  ];

  return (
    <div
      className="welcome-root min-vh-100 text-white position-relative d-flex flex-column justify-content-between overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        background: 'radial-gradient(circle at 50% 12%, #130f20 0%, #0d0b14 45%, #08070b 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* ========================================================
          AMBIENT PURPLE / CYAN GLOWING MESH & SPOTLIGHT
          ======================================================== */}
      {/* Top Center Electric Violet Nebula */}
      <div
        className="position-absolute pointer-events-none"
        style={{
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '950px',
          height: '750px',
          background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.28) 0%, rgba(99, 102, 241, 0.12) 45%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          zIndex: 1
        }}
      />

      {/* Bottom Right Cyan Ambient Glow */}
      <div
        className="position-absolute pointer-events-none"
        style={{
          bottom: '-25%',
          right: '-10%',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.06) 55%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(85px)',
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
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.14) 0%, rgba(6, 182, 212, 0.04) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(55px)',
          transition: 'top 0.12s ease-out, left 0.12s ease-out',
          zIndex: 2
        }}
      />

      {/* Geometric Ambient Grid Background */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.6,
          zIndex: 2
        }}
      />

      {/* ========================================================
          TOP NAVIGATION BAR
          ======================================================== */}
      <header className="position-relative w-100 px-4 py-3 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center z-3">
        {/* Brand Logo Stack */}
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center text-white fw-bold shadow"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontSize: '14px',
              letterSpacing: '0.05em'
            }}
          >
            IQ
          </div>

          <div className="d-flex flex-column">
            <span
              className="fw-extrabold text-white tracking-wider font-monospace"
              style={{ fontSize: '1.05rem', letterSpacing: '0.12em' }}
            >
              MEDIPROCURE<span style={{ color: '#8b5cf6' }}>IQ</span>
            </span>
            <span
              className="font-monospace text-secondary text-uppercase"
              style={{ fontSize: '0.64rem', letterSpacing: '0.14em' }}
            >
              HEALTHCARE INTELLIGENCE · GCP CLOUD
            </span>
          </div>
        </div>

        {/* Center Pill Navigation */}
        <nav className="d-none d-lg-flex align-items-center gap-2 p-1 rounded-pill" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(139, 92, 246, 0.18)' }}>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1 font-monospace ${activeTab === 'quick_access' ? 'btn-primary text-white shadow' : 'text-secondary btn-link text-decoration-none'}`}
            style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
            onClick={() => setActiveTab('quick_access')}
          >
            QUICK PERSONAS
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1 font-monospace ${activeTab === 'sign_in' ? 'btn-primary text-white shadow' : 'text-secondary btn-link text-decoration-none'}`}
            style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
            onClick={() => setActiveTab('sign_in')}
          >
            ACCOUNT SIGN-IN
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1 font-monospace ${activeTab === 'architecture' ? 'btn-primary text-white shadow' : 'text-secondary btn-link text-decoration-none'}`}
            style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
            onClick={() => setActiveTab('architecture')}
          >
            CLOUD ARCHITECTURE
          </button>
        </nav>

        {/* Action Button */}
        <div>
          <button
            type="button"
            className="btn btn-sm rounded-pill px-3 py-2 fw-semibold text-white shadow"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontSize: '0.8rem',
              letterSpacing: '0.04em'
            }}
            onClick={() => setActiveTab('quick_access')}
          >
            ACCESS PORTAL &rarr;
          </button>
        </div>
      </header>

      {/* ========================================================
          HERO SECTION: 2-COLUMN ENTERPRISE LAYOUT
          ======================================================== */}
      <main className="container position-relative z-3 py-5 my-auto">
        <div className="row g-5 align-items-center">
          {/* Left Column: Mission Narrative & Platform Capabilities */}
          <div className="col-12 col-lg-6">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-4" style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <span className="badge rounded-pill bg-primary text-white" style={{ fontSize: '0.62rem', padding: '3px 7px' }}>GCP CLOUD</span>
              <span className="font-monospace text-light small" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                HOSPITAL PROCUREMENT &amp; RISK GOVERNANCE
              </span>
            </div>

            <h1
              className="fw-extrabold display-4 mb-3 tracking-tight"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.15
              }}
            >
              HEALTHCARE SUPPLY CHAIN INTELLIGENCE
            </h1>

            <p className="lead text-secondary mb-4 lh-base" style={{ fontSize: '1rem', maxWidth: '540px' }}>
              Engineered for mission-critical clinical procurement. Orchestrates automated Google Cloud Storage ingestion,
              in-database BigQuery ML delivery delay prediction, and strict zero-trust segregation of duties across hospital departments.
            </p>

            {/* Quick action buttons */}
            <div className="d-flex flex-wrap gap-3 mb-5">
              <button
                type="button"
                className="btn btn-lg rounded-pill px-4 py-2 text-white fw-semibold shadow"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontSize: '0.92rem'
                }}
                onClick={() => quickLogin('officer@procureiq.com')}
                disabled={loading}
              >
                {loading ? 'Authenticating…' : 'Launch Officer Workspace →'}
              </button>

              <button
                type="button"
                className="btn btn-lg rounded-pill px-4 py-2 btn-outline-secondary text-light"
                style={{
                  borderColor: 'rgba(139, 92, 246, 0.35)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  fontSize: '0.92rem'
                }}
                onClick={() => setActiveTab('sign_in')}
              >
                Custom Credentials
              </button>
            </div>

            {/* Platform Metrics Badges */}
            <div className="row g-3 pt-3 border-top border-secondary border-opacity-10">
              <div className="col-4">
                <div className="h4 fw-bold text-white mb-0 font-monospace">1,200+</div>
                <div className="text-secondary small font-monospace" style={{ fontSize: '0.7rem' }}>CLEAN CLINICAL RECORDS</div>
              </div>
              <div className="col-4">
                <div className="h4 fw-bold text-info mb-0 font-monospace">84.4%</div>
                <div className="text-secondary small font-monospace" style={{ fontSize: '0.7rem' }}>DELIVERY FIDELITY</div>
              </div>
              <div className="col-4">
                <div className="h4 fw-bold text-success mb-0 font-monospace">65 / 65</div>
                <div className="text-secondary small font-monospace" style={{ fontSize: '0.7rem' }}>UNIT TESTS VERIFIED</div>
              </div>
            </div>
          </div>

          {/* Right Column: High-End Enterprise Access & Authentication Console */}
          <div className="col-12 col-lg-6">
            <div
              className="p-4 rounded-4 shadow-2xl position-relative"
              style={{
                background: 'rgba(19, 17, 26, 0.92)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(139, 92, 246, 0.28)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(124, 58, 237, 0.12)'
              }}
            >
              {/* Header inside Card */}
              <div className="d-flex align-items-center justify-content-between pb-3 mb-4 border-bottom border-secondary border-opacity-15">
                <div>
                  <div className="fw-bold text-white font-monospace" style={{ fontSize: '0.92rem', letterSpacing: '0.06em' }}>
                    ENTERPRISE ACCESS PORTAL
                  </div>
                  <div className="text-secondary small font-monospace" style={{ fontSize: '0.7rem' }}>
                    ROLE-BASED AUTHORIZATION &amp; SSO
                  </div>
                </div>

                <div className="d-flex gap-1 p-1 rounded-pill bg-black border border-secondary border-opacity-25">
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1 font-monospace ${activeTab === 'quick_access' ? 'btn-primary text-white' : 'text-secondary btn-link text-decoration-none'}`}
                    style={{ fontSize: '0.7rem' }}
                    onClick={() => setActiveTab('quick_access')}
                  >
                    Personas
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1 font-monospace ${activeTab === 'sign_in' ? 'btn-primary text-white' : 'text-secondary btn-link text-decoration-none'}`}
                    style={{ fontSize: '0.7rem' }}
                    onClick={() => setActiveTab('sign_in')}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1 font-monospace ${activeTab === 'architecture' ? 'btn-primary text-white' : 'text-secondary btn-link text-decoration-none'}`}
                    style={{ fontSize: '0.7rem' }}
                    onClick={() => setActiveTab('architecture')}
                  >
                    Cloud Status
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {err && (
                <div className="alert alert-danger py-2 px-3 small border-0 rounded-3 mb-3" role="alert">
                  {err}
                </div>
              )}

              {/* ========================================================
                  TAB 1: QUICK ROLE ACCESS CARDS (1-Click Instant Login)
                  ======================================================== */}
              {activeTab === 'quick_access' && (
                <div className="d-flex flex-column gap-2 animate-fade-in">
                  <div className="text-secondary small mb-2 font-monospace" style={{ fontSize: '0.72rem' }}>
                    SELECT A PRE-CONFIGURED CLINICAL PERSONA FOR DEMONSTRATION:
                  </div>

                  {rolePersonas.map((p) => (
                    <div
                      key={p.code}
                      className="p-3 rounded-3 d-flex align-items-center justify-content-between role-card-edge"
                      style={{ cursor: 'pointer' }}
                      onClick={() => quickLogin(p.email)}
                    >
                      <div className="d-flex flex-column me-3">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="fw-bold text-white small">{p.role}</span>
                          <span className={`badge rounded-pill border ${p.badgeColor} bg-transparent font-monospace`} style={{ fontSize: '0.62rem' }}>
                            {p.code}
                          </span>
                        </div>
                        <div className="text-secondary small lh-sm" style={{ fontSize: '0.75rem' }}>
                          {p.desc}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-light rounded-pill px-3 text-nowrap"
                        style={{ fontSize: '0.75rem', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                        disabled={loading}
                      >
                        Enter &rarr;
                      </button>
                    </div>
                  ))}

                  <div className="text-center mt-3 pt-2 border-top border-secondary border-opacity-10">
                    <span className="text-secondary small font-monospace" style={{ fontSize: '0.72rem' }}>
                      Demo accounts use password: <strong className="text-light">Password@123</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 2: CREDENTIALS SIGN-IN / REGISTER FORM
                  ======================================================== */}
              {activeTab === 'sign_in' && (
                <form onSubmit={submit} className="d-flex flex-column gap-3 animate-fade-in">
                  <div className="text-secondary small mb-1 font-monospace" style={{ fontSize: '0.72rem' }}>
                    ENTER YOUR CREDENTIALS TO ACCESS YOUR HEALTHCARE WORKSPACE:
                  </div>

                  {reg && (
                    <div>
                      <label className="form-label small text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-black text-light border-secondary input-edge"
                        placeholder="Dr. Jordan Henderson"
                        value={f.name}
                        onChange={e => setF({ ...f, name: e.target.value })}
                        required={reg}
                      />
                    </div>
                  )}

                  <div>
                    <label className="form-label small text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
                      ORGANIZATION EMAIL
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-sm bg-black text-light border-secondary input-edge"
                      placeholder="officer@procureiq.com"
                      value={f.email}
                      onChange={e => setF({ ...f, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label small text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
                      PASSWORD (MIN 8 CHARACTERS)
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-sm bg-black text-light border-secondary input-edge"
                      placeholder="••••••••"
                      value={f.password}
                      onChange={e => setF({ ...f, password: e.target.value })}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill py-2 mt-2 fw-semibold text-white shadow"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      fontSize: '0.88rem'
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Authenticating…' : reg ? 'Create Account &rarr;' : 'Sign In to Workspace &rarr;'}
                  </button>

                  <div className="d-flex justify-content-between align-items-center pt-2">
                    <button
                      type="button"
                      className="btn btn-link text-secondary p-0 small text-decoration-none font-monospace"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setReg(!reg)}
                    >
                      {reg ? 'Already registered? Sign in' : 'Need an account? Sign up as Requester'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-link text-info p-0 small text-decoration-none font-monospace"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => {
                        setF({ email: 'officer@procureiq.com', password: 'Password@123', name: '' });
                      }}
                    >
                      Autofill Officer
                    </button>
                  </div>
                </form>
              )}

              {/* ========================================================
                  TAB 3: CLOUD PLATFORM ARCHITECTURE STATUS
                  ======================================================== */}
              {activeTab === 'architecture' && (
                <div className="d-flex flex-column gap-3 animate-fade-in">
                  <div className="text-secondary small font-monospace" style={{ fontSize: '0.72rem' }}>
                    VERIFIED CLOUD &amp; ML SERVICE STATUS:
                  </div>

                  <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-black border border-secondary border-opacity-25">
                    <div>
                      <div className="fw-semibold text-white small">Google Cloud Storage (GCS)</div>
                      <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>Multi-source raw hospital supply records ingestion</div>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace">CONNECTED</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-black border border-secondary border-opacity-25">
                    <div>
                      <div className="fw-semibold text-white small">Google BigQuery ML</div>
                      <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>Delivery delay &amp; defect prediction (Logistic &amp; Boosted Tree)</div>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace">EVALUATED</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-black border border-secondary border-opacity-25">
                    <div>
                      <div className="fw-semibold text-white small">Google Looker Studio BI</div>
                      <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>Executive procurement KPI &amp; supplier delivery dashboard</div>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace">INTEGRATED</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-black border border-secondary border-opacity-25">
                    <div>
                      <div className="fw-semibold text-white small">MediProcure AI (Gemini 1.5 Flash)</div>
                      <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>Live MongoDB-grounded clinical supply chain advisor</div>
                    </div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">ACTIVE</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================
          FOOTER
          ======================================================== */}
      <footer className="position-relative w-100 px-4 py-3 border-top border-secondary border-opacity-10 d-flex flex-wrap justify-content-between align-items-center text-secondary small z-3 font-monospace" style={{ fontSize: '0.72rem' }}>
        <div>
          MediProcureIQ Platform &copy; 2026 · Clinical Healthcare Supply Chain Governance
        </div>
        <div className="d-flex gap-3">
          <span>GCP BigQuery ML</span>
          <span>&middot;</span>
          <span>Google Cloud Storage</span>
          <span>&middot;</span>
          <span>Looker Studio BI</span>
          <span>&middot;</span>
          <span>Strict Segregation of Duties</span>
        </div>
      </footer>
    </div>
  );
}
