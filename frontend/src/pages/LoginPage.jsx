import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';
import '../styles/login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFillDemo = (e) => {
    e.preventDefault();
    setIsSignUp(false);
    setEmail('test@clinora.com');
    setPassword('Test1234!');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Registration flow
        await registerUser({
          full_name: fullName,
          email,
          password,
          role,
        });

        // Automatically sign in after successful registration
        const loginRes = await loginUser(email, password);
        if (loginRes.access_token) {
          localStorage.setItem('clinora_token', loginRes.access_token);
          navigate('/dashboard');
        }
      } else {
        // Login flow
        const result = await loginUser(email, password);
        if (result.access_token) {
          localStorage.setItem('clinora_token', result.access_token);
          navigate('/dashboard');
        } else {
          setError(result.detail || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Branding Panel */}
      <div className="login-branding">
        <div className="login-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); alert('Clinora Clinical Document Intelligence System.\nUse Demo button for test credentials.'); }}>
            &#9432; Help
          </a>
          <a href="#" onClick={handleFillDemo} style={{ color: 'var(--accent-coral)', fontWeight: 600 }}>
            ⚡ Demo Fill
          </a>
        </div>

        <div className="login-logo">
          <div className="login-logo-icon">C</div>
          <span className="login-logo-text">CLINORA</span>
        </div>

        <div className="login-headline">
          <h1>Turn Clinical Documents Into Intelligent Insights</h1>
          <p>Secure. Searchable. Intelligent.</p>
        </div>

        {/* Decorative network nodes */}
        <div className="login-nodes">
          <div className="node">&#128196;</div>
          <div className="node">&#129516;</div>
          <div className="node">&#128300;</div>
          <div className="node">&#128202;</div>
          <div className="node">&#128273;</div>
          <div className="node">&#128203;</div>
          <div className="node">&#128194;</div>
          <div className="node">&#128193;</div>
          <div className="node">&#128269;</div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="login-form-panel">
        <form className="login-form-card" onSubmit={handleSubmit}>
          <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>

          {error && <div className="login-error">{error}</div>}
          {successMsg && <div className="badge-mint" style={{ padding: '0.6rem', textAlign: 'center', marginBottom: '1rem' }}>{successMsg}</div>}

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">&#128100;</span>
                <input
                  id="fullName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">&#9993;</span>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">&#128274;</span>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder={isSignUp ? 'Minimum 8 characters' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                className="form-input"
                style={{ paddingLeft: '0.9rem' }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="staff">Healthcare Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          {!isSignUp && (
            <div className="form-row">
              <label className="form-checkbox">
                <input type="checkbox" defaultChecked />
                Remember me
              </label>
              <a href="#" className="form-forgot" onClick={(e) => { e.preventDefault(); alert('Password reset will be sent to your registered email.'); }}>
                Forgot Password?
              </a>
            </div>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading
              ? isSignUp ? 'Creating Account...' : 'Signing in...'
              : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <div className="form-divider">Or sign in with</div>

          <div className="form-social">
            <button type="button" className="btn-social" onClick={handleFillDemo}>
              ⚡ Auto-fill Demo
            </button>
          </div>

          <p className="form-footer">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(false); setError(''); }}>
                  Sign In
                </a>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(true); setError(''); }}>
                  Sign Up
                </a>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
