import React, { useState, useEffect } from 'react';
import { KeyIcon, ShieldIcon } from '../assets/icons';

interface LoginProps {
  onLoginSuccess: (username: string) => void;
  apiBase: string;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, apiBase }) => {
  const [step, setStep] = useState<1 | 2>(1); // 1 = Creds, 2 = 2FA
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  
  // 2FA state
  const [setupRequired, setSetupRequired] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Focus on password input at mount
  useEffect(() => {
    const pwInput = document.getElementById('password') as HTMLInputElement;
    if (pwInput) pwInput.focus();
  }, []);

  const handleCredsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSetupRequired(data.setup_required);
      
      if (data.setup_required) {
        // Fetch the QR code
        const qrRes = await fetch(`${apiBase}/api/auth/setup-2fa`);
        const qrData = await qrRes.json();
        if (!qrRes.ok) {
          throw new Error(qrData.error || 'Failed to initialize 2FA setup');
        }
        setQrCode(qrData.qrCode);
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim().length !== 6) {
      setError('Enter a valid 6-digit code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid 2FA code');
      }

      onLoginSuccess(data.user || username);
    } catch (err: any) {
      setError(err.message || 'TOTP validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="avatar-container">
          {step === 1 ? '👤' : '🔒'}
        </div>
        
        <h2>{step === 1 ? 'Sign In to WebVault' : '2FA Verification'}</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
          {step === 1 
            ? 'Enter your administrator credentials' 
            : setupRequired 
              ? 'Scan the QR code and input your 6-digit TOTP code' 
              : 'Open your Authenticator app and input your 6-digit TOTP code'
          }
        </p>

        {step === 1 ? (
          <form onSubmit={handleCredsSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              className="login-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
            <input
              id="password"
              type="password"
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            
            {error && <div className="login-error">{error}</div>}
            
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2faSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            
            {setupRequired && qrCode && (
              <div className="qr-container">
                <img src={qrCode} alt="Scan to enroll TOTP" style={{ width: '160px', height: '160px', display: 'block' }} />
              </div>
            )}

            <input
              type="text"
              className="login-input"
              placeholder="6-Digit Code"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
              required
              autoFocus
            />

            {error && <div className="login-error">{error}</div>}

            <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
              <button 
                type="button" 
                className="login-button" 
                style={{ background: 'var(--sidebar-active)', color: 'var(--text-primary)' }} 
                onClick={() => {
                  setStep(1);
                  setPassword('');
                  setError('');
                }}
                disabled={loading}
              >
                Back
              </button>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
