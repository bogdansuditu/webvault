import React, { useEffect, useState } from 'react';
import { ShieldIcon } from '../../assets/icons';

interface ShareRecipientPageProps {
  slug: string;
  apiBase: string;
}

type ShareStatus = 'checking' | 'active' | 'password_required' | 'banned' | 'expired' | 'not_found' | 'error';

export const ShareRecipientPage: React.FC<ShareRecipientPageProps> = ({ slug, apiBase }) => {
  const [status, setStatus] = useState<ShareStatus>('checking');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [hasPasswordProtected, setHasPasswordProtected] = useState<boolean>(false);

  const checkMetadata = async () => {
    try {
      const res = await fetch(`${apiBase}/api/share/metadata/${slug}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setHasPasswordProtected(data.isPasswordProtected);
        setStatus(data.isPasswordProtected ? 'password_required' : 'active');
      } else {
        if (data.status === 'banned') {
          setStatus('banned');
        } else if (data.status === 'expired') {
          setStatus('expired');
        } else if (data.status === 'not_found') {
          setStatus('not_found');
        } else {
          setStatus('error');
        }
        setErrorMessage(data.error || 'Failed to resolve sharing link.');
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
      setStatus('error');
      setErrorMessage('Could not connect to WebVault secure server.');
    }
  };

  useEffect(() => {
    checkMetadata();
  }, [slug]);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setDownloading(true);

    try {
      const res = await fetch(`${apiBase}/api/share/download/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Successful download stream! Retrieve blob
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `webvault_share_${slug}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        setDownloading(false);
        setPassword('');
        // Re-check metadata in case this download caused the link to hit its max usage limit and expire!
        checkMetadata();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to download shared items.');
        setDownloading(false);
        
        if (data.status === 'banned') {
          setStatus('banned');
        }
      }
    } catch (err) {
      console.error('Download trigger failed:', err);
      setErrorMessage('Network connection lost during download.');
      setDownloading(false);
    }
  };

  return (
    <div 
      className="login-overlay" 
      style={{
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundSize: 'cover',
        userSelect: 'none'
      }}
    >
      <div 
        className="login-card" 
        style={{
          width: '400px',
          padding: '40px 30px',
          gap: '24px'
        }}
      >
        <div className="avatar-container" style={{ background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' }}>
          📦
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Shared Archive Preview
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Link Slug: <code style={{ padding: '2px 6px', background: 'var(--sidebar-active)', borderRadius: '4px' }}>{slug}</code>
          </span>
        </div>

        {status === 'checking' && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '20px 0' }}>
            🔄 Connecting to secure sandbox...
          </div>
        )}

        {(status === 'active' || status === 'password_required') && (
          <form onSubmit={handleDownload} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {status === 'password_required' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Enter Share Password
                </label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Password required to decrypt payload"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={downloading}
                  required
                  autoFocus
                />
              </div>
            )}

            {errorMessage && (
              <div 
                className="login-error" 
                style={{ 
                  background: 'rgba(255, 69, 58, 0.1)', 
                  border: '1px solid rgba(255, 69, 58, 0.2)', 
                  padding: '8px 12px', 
                  borderRadius: '6px', 
                  fontSize: '12px', 
                  color: '#ff453a',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                {errorMessage}
              </div>
            )}

            <button 
              type="submit" 
              className="login-button" 
              disabled={downloading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '42px',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              {downloading ? 'Processing Shared Vault...' : 'Download Shared Archive (ZIP)'}
            </button>
          </form>
        )}

        {(status === 'banned' || status === 'expired' || status === 'not_found' || status === 'error') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <div 
              style={{ 
                background: 'rgba(255, 69, 58, 0.08)', 
                border: '1px solid rgba(255, 69, 58, 0.2)', 
                padding: '16px 20px', 
                borderRadius: '10px', 
                fontSize: '13px', 
                color: '#ff453a',
                lineHeight: '1.5'
              }}
            >
              <strong>
                {status === 'banned' && '🔒 Link Banned'}
                {status === 'expired' && '⌛ Link Expired'}
                {status === 'not_found' && '❓ Link Not Found'}
                {status === 'error' && '⚠️ Connection Error'}
              </strong>
              <div style={{ marginTop: '6px', opacity: 0.85 }}>{errorMessage}</div>
            </div>

            <button 
              onClick={() => window.location.pathname = '/'}
              className="login-button"
              style={{
                background: 'var(--sidebar-active)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-inner)',
                height: '40px'
              }}
            >
              Go to WebVault Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
