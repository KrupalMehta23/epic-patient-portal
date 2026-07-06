import React, { useState } from 'react';
import styles from './SignIn.module.css';

export default function SignIn({ error }) {
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  async function handleSignIn() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('http://localhost:3001/auth/initiate');
      if (!res.ok) throw new Error('Could not start authorization');
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (err) {
      setFetchError(err.message);
      setLoading(false);
    }
  }

  const displayError = error || fetchError;

  return (
    <div className={styles.wrapper}>
      {/* Left brand panel */}
      <div className={styles.left}>
        <div className={styles.brandMark}>
          <div className={styles.brandIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div>
            <div className={styles.brandName}>MyHealth Portal</div>
            <div className={styles.brandSub}>Powered by EPIC FHIR R4</div>
          </div>
        </div>

        <h1 className={styles.heroHeadline}>
          Your health records,<br />
          <span>beautifully clear.</span>
        </h1>

        <p className={styles.heroDesc}>
          A secure, read-only view of your EPIC health data —
          medications, lab results, and vital trends all in one place.
        </p>

        <div className={styles.featureList}>
          {[
            'Real-time data from your EPIC account',
            'Medications with dosage & prescriber info',
            'Lab reports with results breakdown',
            'Vital signs with historical trend charts',
            'Session-only storage — nothing saved to disk',
          ].map((f) => (
            <div key={f} className={styles.featureItem}>
              <span className={styles.featureDot} />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right sign-in panel */}
      <div className={styles.right}>
        <div className={styles.card}>
          <p className={styles.cardEyebrow}>Patient Portal</p>
          <h2 className={styles.cardTitle}>Sign in to continue</h2>
          <p className={styles.cardDesc}>
            Connect your EPIC account to view your personal health records.
          </p>

          <div className={styles.divider} />

          {displayError && (
            <div className={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0, marginTop:1}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {displayError.replace(/_/g, ' ')}
            </div>
          )}

          <button className={styles.epicBtn} onClick={handleSignIn} disabled={loading}>
            {loading ? (
              <><span className={styles.spinner} />Connecting to EPIC…</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Sign in with EPIC
              </>
            )}
          </button>

          <p className={styles.privacyNote}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Read-only · OAuth 2.0 + PKCE · No data stored on our servers
          </p>
        </div>
      </div>
    </div>
  );
}
