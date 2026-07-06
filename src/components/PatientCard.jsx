import React from 'react';
import { getPatientName, getInitials, getMRN, calcAge, formatDate } from '../utils/fhirFormat';
import styles from './PatientCard.module.css';

export default function PatientCard({ patient, onSignOut }) {
  const name = getPatientName(patient);
  const initials = getInitials(name);
  const mrn = getMRN(patient);
  const dob = patient?.birthDate;
  const age = calcAge(dob);
  const gender = patient?.gender
    ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
    : '—';

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.info}>
          <p className={styles.welcomeLabel}>Welcome back</p>
          <h1 className={styles.name}>{name}</h1>
          <div className={styles.meta}>
            <span className={styles.metaChip}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span className={styles.metaLabel}>DOB</span>
              {formatDate(dob)}{age !== null ? ` · ${age} yrs` : ''}
            </span>
            <span className={styles.metaChip}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/>
              </svg>
              <span className={styles.metaLabel}>Sex</span>
              {gender}
            </span>
            <span className={styles.metaChip}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 10h2M6 10h8"/>
              </svg>
              <span className={styles.metaLabel}>MRN</span>
              {mrn}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.signOutBtn} onClick={onSignOut}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}
