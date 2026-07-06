import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { storeSession } from '../utils/session';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const access_token = params.get('access_token');
    const id_token = params.get('id_token');
    const patient_id = params.get('patient_id');
    const expires_in = params.get('expires_in');

    if (!access_token) {
      navigate('/?auth_error=missing_tokens', { replace: true });
      return;
    }

    // Securely store tokens in sessionStorage only
    storeSession({ access_token, id_token, patient_id, expires_in: expires_in || 3600 });

    // Clean tokens from URL immediately, then navigate to dashboard
    window.history.replaceState({}, '', '/auth-success');
    navigate('/dashboard', { replace: true });
  }, [navigate, search]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      color: '#4b5563',
      fontSize: '15px',
    }}>
      <div style={{
        width: 36, height: 36,
        border: '2.5px solid #e8f4fd',
        borderTopColor: '#1a6fa8',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
