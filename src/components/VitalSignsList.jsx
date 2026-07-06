import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { formatDate } from '../utils/fhirFormat';
import styles from './VitalSigns.module.css';

const VITAL_CONFIG = {
  '8867-4':  { label: 'Heart Rate',        unit: 'bpm',    color: '#ef4444', bg: '#fff1f2', icon: '❤️',  normalMin: 60,  normalMax: 100 },
  '8310-5':  { label: 'Body Temperature',  unit: '°F',     color: '#f59e0b', bg: '#fffbeb', icon: '🌡️',  normalMin: 97,  normalMax: 99  },
  '8480-6':  { label: 'Systolic BP',       unit: 'mmHg',   color: '#3b82f6', bg: '#eff6ff', icon: '🩸',  normalMin: 90,  normalMax: 120 },
  '8462-4':  { label: 'Diastolic BP',      unit: 'mmHg',   color: '#8b5cf6', bg: '#f5f3ff', icon: '🩸',  normalMin: 60,  normalMax: 80  },
  '9279-1':  { label: 'Respiratory Rate',  unit: '/min',   color: '#06b6d4', bg: '#ecfeff', icon: '💨',  normalMin: 12,  normalMax: 20  },
  '59408-5': { label: 'O₂ Saturation',     unit: '%',      color: '#0d9488', bg: '#f0fdfa', icon: '💉',  normalMin: 95,  normalMax: 100 },
  '29463-7': { label: 'Body Weight',       unit: 'kg',     color: '#10b981', bg: '#f0fdf4', icon: '⚖️',  normalMin: null, normalMax: null },
  '8302-2':  { label: 'Height',            unit: 'cm',     color: '#6366f1', bg: '#eef2ff', icon: '📏',  normalMin: null, normalMax: null },
  '39156-5': { label: 'BMI',               unit: 'kg/m²',  color: '#f97316', bg: '#fff7ed', icon: '📊',  normalMin: 18.5, normalMax: 24.9 },
  '55284-4': { label: 'Blood Pressure',    unit: 'mmHg',   color: '#3b82f6', bg: '#eff6ff', icon: '🩸',  normalMin: null, normalMax: null },
};

const DEFAULT_CONFIG = { label: 'Vital Sign', unit: '', color: '#64748b', bg: '#f8fafc', icon: '📋', normalMin: null, normalMax: null };

function getVitalValue(obs) {
  if (obs?.valueQuantity?.value !== undefined) {
    return { value: parseFloat(obs.valueQuantity.value.toFixed(1)), unit: obs.valueQuantity.unit || '' };
  }
  if (obs?.component?.length >= 2) {
    const sys = obs.component[0]?.valueQuantity?.value;
    const dia = obs.component[1]?.valueQuantity?.value;
    if (sys && dia) return { value: sys, value2: dia, unit: 'mmHg', display: `${sys}/${dia}` };
  }
  return { value: null, unit: '' };
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className={styles.tooltipValue} style={{ color: p.color }}>
          {p.value} {unit}
        </p>
      ))}
    </div>
  );
}

function VitalCard({ code, observations, config, isSelected, onSelect }) {
  const latest = observations[0];
  const { value, display } = getVitalValue(latest);
  const displayValue = display || (value !== null ? value : '—');

  const isNormal = config.normalMin !== null && value !== null
    ? value >= config.normalMin && value <= config.normalMax
    : null;

  const chartData = [...observations].reverse().map((obs) => {
    const date = obs.effectiveDateTime
      ? new Date(obs.effectiveDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
    const { value: v } = getVitalValue(obs);
    return { date, value: v };
  }).filter(d => d.value !== null);

  return (
    <div
      className={`${styles.vitalCard} ${isSelected ? styles.vitalCardSelected : ''}`}
      style={{ '--vital-color': config.color, '--vital-bg': config.bg }}
      onClick={onSelect}
    >
      <div className={styles.vitalCardInner}>
        <div className={styles.vitalHeader}>
          <span className={styles.vitalIcon}>{config.icon}</span>
          <span className={styles.vitalLabel}>{config.label}</span>
          {isNormal !== null && (
            <span className={`${styles.normalBadge} ${isNormal ? styles.normalOk : styles.normalOff}`}>
              {isNormal ? 'Normal' : 'Review'}
            </span>
          )}
        </div>
        <div className={styles.vitalValueRow}>
          <span className={styles.vitalValue}>{displayValue}</span>
          <span className={styles.vitalUnit}>{config.unit}</span>
        </div>
        <p className={styles.vitalDate}>{latest?.effectiveDateTime ? formatDate(latest.effectiveDateTime) : '—'}</p>

        {chartData.length >= 2 && (
          <div className={styles.sparkline}>
            <ResponsiveContainer width="100%" height={50}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${code}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={1.5}
                  fill={`url(#grad-${code})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function VitalDetailChart({ code, observations, config }) {
  const chartData = [...observations].reverse().map((obs) => {
    const date = obs.effectiveDateTime
      ? new Date(obs.effectiveDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
    const { value: v } = getVitalValue(obs);
    return { date, value: v };
  }).filter(d => d.value !== null);

  if (chartData.length < 2) {
    return (
      <div className={styles.detailPanel}>
        <p className={styles.detailNoData}>Only one reading available — check back after more visits for trend data.</p>
      </div>
    );
  }

  const values = chartData.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.2 || 5;

  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailHeader}>
        <div>
          <h3 className={styles.detailTitle}>{config.icon} {config.label !== 'Vital Sign' ? config.label : (observations[0]?.code?.text || 'Vital Sign')} — Trend</h3>
          <p className={styles.detailSub}>{chartData.length} readings</p>
        </div>
        {config.normalMin !== null && (
          <span className={styles.rangeNote}>Normal: {config.normalMin}–{config.normalMax} {config.unit}</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 16, right: 16, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={`detail-grad-${code}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.color} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={config.color} stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis domain={[min - padding, max + padding]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip unit={config.unit} />} />
          {config.normalMin !== null && (
            <>
              <ReferenceLine y={config.normalMax} stroke={config.color} strokeDasharray="4 4" strokeOpacity={0.4}
                label={{ value: 'High', position: 'right', fontSize: 10, fill: config.color }} />
              <ReferenceLine y={config.normalMin} stroke={config.color} strokeDasharray="4 4" strokeOpacity={0.4}
                label={{ value: 'Low', position: 'right', fontSize: 10, fill: config.color }} />
            </>
          )}
          <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={2.5}
            fill={`url(#detail-grad-${code})`}
            dot={{ fill: config.color, strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function VitalSignsList({ vitals }) {
  const [selectedCode, setSelectedCode] = useState(null);

  // Group all readings by LOINC code
  const grouped = {};
  vitals.forEach((obs) => {
    const code = obs?.code?.coding?.[0]?.code;
    if (!code) return;
    if (!grouped[code]) grouped[code] = [];
    grouped[code].push(obs);
  });

  const codes = Object.keys(grouped);

  if (!codes.length) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📊</span>
        <p className={styles.emptyTitle}>No vital signs on record</p>
        <p className={styles.emptyDesc}>Your vital signs will appear here once available.</p>
      </div>
    );
  }

  const selectedConfig = selectedCode ? (VITAL_CONFIG[selectedCode] || DEFAULT_CONFIG) : null;

  return (
    <div>
      <div className={styles.grid}>
        {codes.map((code) => {
          const config = VITAL_CONFIG[code] || { ...DEFAULT_CONFIG, label: grouped[code][0]?.code?.text || 'Vital' };
          return (
            <VitalCard
              key={code}
              code={code}
              observations={grouped[code]}
              config={config}
              isSelected={selectedCode === code}
              onSelect={() => setSelectedCode(selectedCode === code ? null : code)}
            />
          );
        })}
      </div>

      {selectedCode && selectedConfig && (
        <VitalDetailChart
          key={selectedCode}
          code={selectedCode}
          observations={grouped[selectedCode]}
          config={selectedConfig}
        />
      )}

      <p className={styles.chartHint}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Tap any vital card to expand its full history chart
      </p>
    </div>
  );
}
