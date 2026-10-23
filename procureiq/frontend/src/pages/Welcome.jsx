import { useState } from 'react';
import { api } from '../api';

export default function Welcome({ onLogin }) {
  const [view, setView] = useState('welcome'); // 'welcome' | 'login' | 'services' | 'about' | 'contact'
  const [themeMode, setThemeMode] = useState('dark'); // 'dark' (existing theme colour) | 'light' (reference mockup colour)
  const [f, setF] = useState({ email: '', password: '', name: '' });
  const [reg, setReg] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Generate ribbon wave paths matching the reference image's flowing guilloche waves
  const wavePaths = Array.from({ length: 18 }, (_, i) => {
    const yOffset = i * 7.5;
    const c1y = 350 + i * 5.5;
    const c2y = 540 - i * 4.5;
    const c3y = 380 + i * 6.5;
    const c4y = 480 - i * 5.2;
    return `M -60 ${420 + yOffset} C 210 ${c1y} 390 ${c2y} 570 ${430 + yOffset} C 770 ${c3y} 890 ${c4y} 1060 ${440 + yOffset}`;
  });

  const leftCircles = [55, 85, 115, 145, 175, 205, 235, 265];
  const rightCircles = [55, 85, 115, 145, 175, 205, 235, 265];

  const isDark = themeMode === 'dark';

  return (
    <div
      className={`welcome-page-wrapper d-flex align-items-center justify-content-center min-vh-100 p-2 p-md-4 ${
        isDark ? 'theme-carbon-dark' : 'theme-paper-light'
      }`}
      style={{
        backgroundColor: isDark ? '#08090d' : '#e6e6e6',
        transition: 'background-color 0.3s ease'
      }}
    >
      {/* Central Screen Canvas (Faithful to Reference Mockup Frame) */}
      <div
        className="welcome-card-canvas position-relative d-flex flex-column justify-content-between overflow-hidden shadow-lg"
        style={{
          width: '100%',
          maxWidth: 1140,
          minHeight: 640,
          borderRadius: 16,
          backgroundColor: isDark ? '#12141c' : '#f5f5f5',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #dfdfdf',
          color: isDark ? '#ffffff' : '#222222',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Decorative Geometric Wireframe Wave Lines & Concentric Rings (From Reference Image) */}
        <svg
          className="position-absolute top-0 start-0 w-100 h-100 pe-none"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          style={{ opacity: isDark ? 0.35 : 0.45, zIndex: 1 }}
        >
          {/* Left concentric circles */}
          <g
            stroke={isDark ? '#ffffff' : '#333333'}
            strokeWidth="0.85"
            fill="none"
            opacity={isDark ? '0.3' : '0.4'}
          >
            {leftCircles.map((r, idx) => (
              <circle key={`lc-${idx}`} cx="180" cy="460" r={r} />
            ))}
          </g>

          {/* Right concentric circles */}
          <g
            stroke={isDark ? '#ffffff' : '#333333'}
            strokeWidth="0.85"
            fill="none"
            opacity={isDark ? '0.3' : '0.4'}
          >
            {rightCircles.map((r, idx) => (
              <circle key={`rc-${idx}`} cx="820" cy="460" r={r} />
            ))}
          </g>

          {/* Flowing ribbon waves */}
          <g
            stroke={isDark ? '#ffffff' : '#444444'}
            strokeWidth="0.75"
            fill="none"
            opacity={isDark ? '0.4' : '0.55'}
          >
            {wavePaths.map((d, idx) => (
              <path key={`wave-${idx}`} d={d} />
            ))}
          </g>
        </svg>

        {/* Top Navigation Bar */}
        <header
          className="d-flex justify-content-between align-items-center px-4 px-md-5 py-4 position-relative"
          style={{ zIndex: 10 }}
        >
          {/* Logo / Brand */}
          <div
            className="d-flex align-items-center gap-2 cursor-pointer"
            onClick={() => setView('welcome')}
            style={{ cursor: 'pointer' }}
          >
            <span
              className="fw-bold tracking-wider text-uppercase"
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '1.25rem',
                letterSpacing: 2,
                color: isDark ? '#ffffff' : '#111111'
              }}
            >
              MEDIPROCURE<span style={{ color: isDark ? '#949ab0' : '#666666' }}>IQ</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="d-flex align-items-center gap-3 gap-md-4">
            <button
              className={`btn btn-link p-0 text-decoration-none text-uppercase fw-semibold ${
                view === 'welcome' ? 'active-link' : ''
              }`}
              style={{
                fontSize: '0.8rem',
                letterSpacing: 1.5,
                color: isDark ? (view === 'welcome' ? '#ffffff' : '#888ea8') : view === 'welcome' ? '#000000' : '#666666'
              }}
              onClick={() => setView('welcome')}
            >
              HOME
            </button>

            <button
              className="btn btn-link p-0 text-decoration-none text-uppercase fw-semibold"
              style={{
                fontSize: '0.8rem',
                letterSpacing: 1.5,
                color: isDark ? '#888ea8' : '#666666'
              }}
              onClick={() => setView('services')}
            >
              SERVICES
            </button>

            <button
              className="btn btn-link p-0 text-decoration-none text-uppercase fw-semibold"
              style={{
                fontSize: '0.8rem',
                letterSpacing: 1.5,
                color: isDark ? '#888ea8' : '#666666'
              }}
              onClick={() => setView('about')}
            >
              ABOUT
            </button>

            <button
              className="btn btn-link p-0 text-decoration-none text-uppercase fw-semibold"
              style={{
                fontSize: '0.8rem',
                letterSpacing: 1.5,
                color: isDark ? '#888ea8' : '#666666'
              }}
              onClick={() => setView('contact')}
            >
              CONTACT
            </button>

            {/* Mode Switcher (Dark / Light) */}
            <button
              className="btn btn-sm px-2 py-1 text-uppercase"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
              style={{
                fontSize: '0.68rem',
                letterSpacing: 1,
                border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #ccc',
                color: isDark ? '#ffffff' : '#333333',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderRadius: 20
              }}
              onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
            >
              {isDark ? '☀ Light' : '☾ Dark'}
            </button>

            {/* Distinct Login Action */}
            <button
              className={`btn btn-sm px-3 py-1 text-uppercase fw-bold rounded-pill ${
                view === 'login' ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              style={{
                fontSize: '0.78rem',
                letterSpacing: 1.5,
                backgroundColor: isDark ? (view === 'login' ? '#ffffff' : 'transparent') : view === 'login' ? '#111111' : 'transparent',
                color: isDark ? (view === 'login' ? '#0b0c10' : '#ffffff') : view === 'login' ? '#ffffff' : '#111111',
                borderColor: isDark ? '#ffffff' : '#111111'
              }}
              onClick={() => setView(view === 'login' ? 'welcome' : 'login')}
            >
              {view === 'login' ? 'Close' : 'LOG IN'}
            </button>
          </nav>
        </header>

        {/* Center Main Stage */}
        <div
          className="position-relative d-flex flex-column align-items-center justify-content-center text-center px-4 my-auto py-5"
          style={{ zIndex: 10, minHeight: 440 }}
        >
          {view === 'welcome' && (
            <div className="fade-in-content" style={{ maxWidth: 740 }}>
              <h1
                className="display-3 fw-bold mb-1"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  letterSpacing: -1,
                  color: isDark ? '#ffffff' : '#222222'
                }}
              >
                Welcome
              </h1>

              <div
                className="fs-4 fw-semibold mb-4"
                style={{
                  color: isDark ? '#c8ccd8' : '#444444',
                  letterSpacing: -0.2
                }}
              >
                To MediProcureIQ
              </div>

              <p
                className="mx-auto mb-4"
                style={{
                  maxWidth: 620,
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  color: isDark ? '#82889e' : '#777777'
                }}
              >
                Cloud-based hospital procurement and supplier risk intelligence platform powered by Google Cloud Platform (GCP).
                Featuring automated GCS ETL pipelines, BigQuery ML delay prediction, multi-criteria vendor optimization, and strict clinical governance.
              </p>

              <div>
                <button
                  className="btn px-5 py-3 rounded-pill fw-bold text-uppercase tracking-wider shadow"
                  style={{
                    backgroundColor: isDark ? '#ffffff' : '#2b2b2b',
                    color: isDark ? '#0b0c10' : '#ffffff',
                    fontSize: '0.82rem',
                    letterSpacing: 1.5,
                    border: 'none',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '';
                  }}
                  onClick={() => setView('login')}
                >
                  LOG IN &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Login View ("Then Click Log In Then Yeah Normal Way") */}
          {view === 'login' && (
            <div
              className="fade-in-content w-100 text-start"
              style={{ maxWidth: 840 }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <button
                  className="btn btn-link p-0 text-decoration-none text-muted small"
                  onClick={() => setView('welcome')}
                >
                  &larr; Back to Welcome
                </button>
                <span className="badge role-badge text-uppercase">AUTHENTICATION PORTAL</span>
              </div>

              <div className="row g-4 align-items-stretch">
                {/* 1-Click Role Login */}
                <div className="col-md-6">
                  <div
                    className="p-4 h-100 rounded-3 d-flex flex-column justify-content-between"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e0e0e0'
                    }}
                  >
                    <div>
                      <div className="eyebrow mb-2">QUICK DEMONSTRATION ACCESS</div>
                      <h5 className="fw-bold mb-3 text-uppercase">Select Persona</h5>
                      <p className="text-muted small mb-3">
                        Test different roles and Segregation of Duties instantly:
                      </p>

                      <div className="d-flex flex-column gap-2 mb-3">
                        <button
                          className="btn btn-role-select text-start p-2 p-md-3"
                          disabled={loading}
                          onClick={() => quickLogin('requester@procureiq.com')}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Ravi Requester</span>
                            <span className="badge role-badge">REQUESTER</span>
                          </div>
                          <small className="text-muted d-block mt-1">Raises requisitions &amp; tracks delivery</small>
                        </button>

                        <button
                          className="btn btn-role-select text-start p-2 p-md-3"
                          disabled={loading}
                          onClick={() => quickLogin('officer@procureiq.com')}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Olivia Officer</span>
                            <span className="badge role-badge">OFFICER</span>
                          </div>
                          <small className="text-muted d-block mt-1">Evaluates bids, awards contracts &amp; issues POs</small>
                        </button>

                        <button
                          className="btn btn-role-select text-start p-2 p-md-3"
                          disabled={loading}
                          onClick={() => quickLogin('approver@procureiq.com')}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Manu Manager</span>
                            <span className="badge role-badge">APPROVER</span>
                          </div>
                          <small className="text-muted d-block mt-1">Budget evaluation &amp; financial approval</small>
                        </button>

                        <button
                          className="btn btn-role-select text-start p-2 p-md-3"
                          disabled={loading}
                          onClick={() => quickLogin('admin@procureiq.com')}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Alice Admin</span>
                            <span className="badge role-badge">ADMIN</span>
                          </div>
                          <small className="text-muted d-block mt-1">Full system administration &amp; user management</small>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-top border-secondary-subtle text-muted small">
                      Demo password: <code>Password@123</code>
                    </div>
                  </div>
                </div>

                {/* Email / Password Sign In or Register */}
                <div className="col-md-6">
                  <div
                    className="p-4 h-100 rounded-3 d-flex flex-column justify-content-between"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e0e0e0'
                    }}
                  >
                    <div>
                      <div className="eyebrow mb-2">{reg ? 'REGISTRATION' : 'NORMAL LOGIN'}</div>
                      <h5 className="fw-bold mb-3 text-uppercase">{reg ? 'Create Account' : 'Sign In'}</h5>

                      <form onSubmit={submit}>
                        {reg && (
                          <div className="mb-3">
                            <label className="form-label text-muted small text-uppercase tracking-wider">
                              Full Name
                            </label>
                            <input
                              className="form-control"
                              placeholder="e.g. John Doe"
                              value={f.name}
                              onChange={e => setF({ ...f, name: e.target.value })}
                              required
                            />
                          </div>
                        )}

                        <div className="mb-3">
                          <label className="form-label text-muted small text-uppercase tracking-wider">
                            Email Address
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            placeholder="e.g. user@procureiq.com"
                            value={f.email}
                            onChange={e => setF({ ...f, email: e.target.value })}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label text-muted small text-uppercase tracking-wider">
                            Password
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={f.password}
                            onChange={e => setF({ ...f, password: e.target.value })}
                            required
                          />
                        </div>

                        {err && <div className="alert alert-danger py-2 mb-3 small">{err}</div>}

                        <button
                          className="btn btn-theme-white w-100 py-2 text-uppercase tracking-wider fw-bold mb-3"
                          disabled={loading}
                        >
                          {loading ? 'Authenticating…' : reg ? 'Register' : 'Sign In'}
                        </button>
                      </form>
                    </div>

                    <div className="text-center">
                      <button
                        className="btn btn-link text-muted small text-decoration-none"
                        onClick={() => setReg(!reg)}
                      >
                        {reg ? 'Already have an account? Sign In' : 'New user? Register as Requester'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Services Modal / View */}
          {view === 'services' && (
            <div className="fade-in-content text-start w-100" style={{ maxWidth: 880 }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <button
                  className="btn btn-link p-0 text-decoration-none text-muted small"
                  onClick={() => setView('welcome')}
                >
                  &larr; Back to Welcome
                </button>
                <div className="eyebrow">ENTERPRISE CAPABILITIES</div>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <div className="feature-card p-3 h-100">
                    <div className="feature-index mb-2">01 // ALGORITHM</div>
                    <h6 className="fw-bold mb-2">Fit &amp; Risk Engine</h6>
                    <div className="formula-badge mb-2">S = 0.35P + 0.30D + 0.25Q + 0.10C</div>
                    <p className="text-muted small mb-0">
                      Transparent multi-criteria ranking evaluating price competitiveness, on-time delivery %, quality ratings, and compliance.
                    </p>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="feature-card p-3 h-100">
                    <div className="feature-index mb-2">02 // COMPLIANCE</div>
                    <h6 className="fw-bold mb-2">Workflow Governance</h6>
                    <div className="formula-badge mb-2">STRICT NO-SELF-APPROVAL</div>
                    <p className="text-muted small mb-0">
                      End-to-end requisition states with Segregation of Duties. Rejection reasons, purchase orders, and partial deliveries.
                    </p>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="feature-card p-3 h-100">
                    <div className="feature-index mb-2">03 // INTELLIGENCE</div>
                    <h6 className="fw-bold mb-2">Spend Intelligence</h6>
                    <div className="formula-badge mb-2">REAL-TIME RISK RADAR</div>
                    <p className="text-muted small mb-0">
                      Realized savings calculation, department budget tracking, duplicate requisition alerts, and supplier risk level scoring.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* About View */}
          {view === 'about' && (
            <div className="fade-in-content text-start w-100" style={{ maxWidth: 740 }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <button
                  className="btn btn-link p-0 text-decoration-none text-muted small"
                  onClick={() => setView('welcome')}
                >
                  &larr; Back to Welcome
                </button>
                <div className="eyebrow">ABOUT PROCUREIQ</div>
              </div>

              <div className="card p-4">
                <h5 className="fw-bold text-uppercase mb-3">Enterprise Intelligent Procurement</h5>
                <p className="text-muted small mb-3">
                  ProcureIQ addresses the core inefficiencies in enterprise supply chains: fragmented purchase requests,
                  opaque supplier selection, compliance blind spots, and lack of spend visibility.
                </p>
                <div className="row g-3 text-muted small">
                  <div className="col-6">
                    <strong className="text-white d-block mb-1">Architecture:</strong>
                    Vite React frontend, Express.js REST API, MongoDB persistent engine.
                  </div>
                  <div className="col-6">
                    <strong className="text-white d-block mb-1">Security &amp; Standards:</strong>
                    JWT Bearer authentication, BCrypt password hashing, RBAC &amp; SoD enforcement.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact View */}
          {view === 'contact' && (
            <div className="fade-in-content text-start w-100" style={{ maxWidth: 740 }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <button
                  className="btn btn-link p-0 text-decoration-none text-muted small"
                  onClick={() => setView('welcome')}
                >
                  &larr; Back to Welcome
                </button>
                <div className="eyebrow">COMMUNICATION CHANNELS</div>
              </div>

              <div className="card p-4">
                <h5 className="fw-bold text-uppercase mb-3">Enterprise Support &amp; Deployment</h5>
                <div className="row g-3 small">
                  <div className="col-md-6">
                    <div className="text-muted mb-1 text-uppercase">Procurement Operations</div>
                    <div className="text-white fw-bold">support@procureiq.internal</div>
                    <div className="text-muted">+91 (800) 473-2873</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted mb-1 text-uppercase">Platform Administration</div>
                    <div className="text-white fw-bold">admin@procureiq.com</div>
                    <div className="text-muted">Global Operations &amp; Supply Chain Risk Unit</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Minimalist Footer (Clean & Subtle) */}
        <footer
          className="d-flex justify-content-between align-items-center px-4 px-md-5 py-3 position-relative"
          style={{
            zIndex: 10,
            borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e0e0e0',
            fontSize: '0.75rem',
            color: isDark ? '#6b7280' : '#888888'
          }}
        >
          <div>ProcureIQ Platform &copy; 2026</div>
          <div>Intelligent Procurement &amp; Supplier Risk Platform</div>
        </footer>
      </div>
    </div>
  );
}
