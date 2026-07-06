import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../utils/session';
import { usePatientData } from '../hooks/usePatientData';
import PatientCard from '../components/PatientCard';
import MedicationsList from '../components/MedicationsList';
import LabReportsList from '../components/LabReportsList';
import VitalSignsList from '../components/VitalSignsList';
import styles from './Dashboard.module.css';

const TABS = [
  {
    id: 'medications', label: 'Medications',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H20a2 2 0 012 2v3"/><circle cx="18" cy="18" r="3"/><path d="M18 15v6M15 18h6"/></svg>,
  },
  {
    id: 'labs', label: 'Lab Reports',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11m0 0H5a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2h-4m-5 0h5"/></svg>,
  },
  {
    id: 'vitals', label: 'Vital Signs',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  },
];

export default function Dashboard({ session }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('medications');
  const { patient, medications, labReports, vitals, loading, error } = usePatientData(session);

  function handleSignOut() {
    clearSession();
    navigate('/', { replace: true });
  }

  const uniqueVitalCount = new Set(
    vitals.map((v) => v?.code?.coding?.[0]?.code).filter(Boolean)
  ).size;

  const tabCounts = {
    medications: medications.length,
    labs: labReports.length,
    vitals: uniqueVitalCount,
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoArea}>
            <div className={styles.logoMark}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <div className={styles.logoText}>MyHealth Portal</div>
              <div className={styles.logoSub}>EPIC FHIR R4</div>
            </div>
          </div>
          <span className={styles.secureTag}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Secure session
          </span>
        </div>
      </header>

      <main className={styles.main}>
        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading your health records…</p>
          </div>
        )}

        {error && (
          <div className={styles.errorBanner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && patient && (
          <>
            <PatientCard patient={patient} onSignOut={handleSignOut} />

            <div className={styles.tabBar}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={styles.tabIcon}>{tab.icon}</span>
                  {tab.label}
                  {tabCounts[tab.id] > 0 && (
                    <span className={`${styles.tabCount} ${activeTab !== tab.id ? styles.tabCountInactive : ''}`}>
                      {tabCounts[tab.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'medications' && <MedicationsList medications={medications} />}
            {activeTab === 'labs' && <LabReportsList labReports={labReports} />}
            {activeTab === 'vitals' && <VitalSignsList vitals={vitals} />}

            <p className={styles.sessionNote}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Read-only · Tokens in sessionStorage only · Cleared on sign out or tab close
            </p>
          </>
        )}
      </main>
    </div>
  );
}
