import React, { useState } from 'react';
import { formatDate } from '../utils/fhirFormat';
import styles from './DataList.module.css';

const STATUS_MAP = {
  final:       { cls: 'completed', label: 'Final' },
  preliminary: { cls: 'amber',     label: 'Preliminary' },
  registered:  { cls: 'default',   label: 'Registered' },
  amended:     { cls: 'active',    label: 'Amended' },
  corrected:   { cls: 'active',    label: 'Corrected' },
};

export default function LabReportsList({ labReports }) {
  const [expanded, setExpanded] = useState(null);

  if (!labReports.length) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🧪</span>
        <p className={styles.emptyTitle}>No lab reports on record</p>
        <p className={styles.emptyDesc}>Your lab results will appear here once available.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {labReports.map((report, i) => {
        const id = report.id || i;
        const isOpen = expanded === id;
        const statusInfo = STATUS_MAP[report.status] || { cls: 'default', label: report.status };
        const name = report.code?.text || report.code?.coding?.[0]?.display || 'Lab Report';
        const issued = report.issued || report.effectiveDateTime;
        const canExpand = !!(report.result?.length || report.conclusion);

        return (
          <div key={id} className={styles.card}>
            <div
              className={styles.cardTop}
              style={{ cursor: canExpand ? 'pointer' : 'default' }}
              onClick={() => canExpand && setExpanded(isOpen ? null : id)}
            >
              <div className={styles.itemIconWrap} style={{ background: '#f0fdf4' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                  <line x1="9" y1="11" x2="15" y2="11"/>
                </svg>
              </div>
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{name}</p>
                <p className={styles.itemDetail}>
                  {issued && formatDate(issued)}
                  {report.performer?.[0]?.display && ` · ${report.performer[0].display}`}
                </p>
              </div>
              <div className={styles.cardRight}>
                <span className={`${styles.badge} ${styles[statusInfo.cls]}`}>{statusInfo.label}</span>
                {canExpand && (
                  <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {isOpen && (
              <div className={styles.expandBody}>
                {report.conclusion && (
                  <div className={styles.conclusion}><strong>Conclusion: </strong>{report.conclusion}</div>
                )}
                {report.result?.length > 0 && (
                  <>
                    <p className={styles.resultLabel}>Results ({report.result.length})</p>
                    {report.result.map((r, j) => (
                      <div key={j} className={styles.resultItem}>{r.display || r.reference}</div>
                    ))}
                  </>
                )}
              </div>
            )}

            <div className={styles.cardMeta}>
              {issued && <span><strong>Date</strong> {formatDate(issued)}</span>}
              {report.category?.[0]?.text && <span><strong>Category</strong> {report.category[0].text}</span>}
              {report.result?.length > 0 && <span><strong>Components</strong> {report.result.length}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
