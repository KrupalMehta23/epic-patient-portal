import React, { useState } from 'react';
import { getMedName, getMedDosage, formatDate } from '../utils/fhirFormat';
import styles from './DataList.module.css';

const STATUS_MAP = {
  active:    { cls: 'active',    label: 'Active' },
  stopped:   { cls: 'stopped',   label: 'Stopped' },
  completed: { cls: 'completed', label: 'Completed' },
  'on-hold': { cls: 'amber',     label: 'On Hold' },
  cancelled: { cls: 'stopped',   label: 'Cancelled' },
};

const FILTERS = ['all', 'active', 'stopped', 'completed'];

export default function MedicationsList({ medications }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? medications : medications.filter((m) => m.status === filter);

  if (!medications.length) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>💊</span>
        <p className={styles.emptyTitle}>No medications on record</p>
        <p className={styles.emptyDesc}>Your medication history will appear here once available.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                className={`${styles.filterBtn} ${isActive ? styles.filterActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'all' && (
                  <span className={`${styles.count} ${!isActive ? styles.countInactive : ''}`}>
                    {medications.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔍</span>
          <p className={styles.emptyTitle}>No {filter} medications</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((med, i) => {
            const statusInfo = STATUS_MAP[med.status] || { cls: 'default', label: med.status };
            const dose = getMedDosage(med);
            const doseInstruction = med.dosageInstruction?.[0];
            const freq = doseInstruction?.timing?.repeat?.frequency
              ? `${doseInstruction.timing.repeat.frequency}× daily` : null;
            const route = doseInstruction?.route?.text || doseInstruction?.route?.coding?.[0]?.display || null;

            return (
              <div key={med.id || i} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.itemIconWrap} style={{ background: '#eff6ff' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.5 20H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H20a2 2 0 012 2v3"/>
                      <circle cx="18" cy="18" r="3"/><path d="M18 15v6M15 18h6"/>
                    </svg>
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{getMedName(med)}</p>
                    {(dose || freq || route) && (
                      <p className={styles.itemDetail}>
                        {[dose, freq, route].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className={`${styles.badge} ${styles[statusInfo.cls]}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <div className={styles.cardMeta}>
                  {med.authoredOn && <span><strong>Started</strong> {formatDate(med.authoredOn)}</span>}
                  {med.requester?.display && <span><strong>Prescriber</strong> {med.requester.display}</span>}
                  {med.reasonCode?.[0]?.text && <span><strong>Reason</strong> {med.reasonCode[0].text}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
