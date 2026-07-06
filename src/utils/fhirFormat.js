export function formatDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return str;
  }
}

export function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  const n = new Date();
  let age = n.getFullYear() - d.getFullYear();
  if (
    n.getMonth() < d.getMonth() ||
    (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())
  )
    age--;
  return age;
}

export function getPatientName(patient) {
  const nameObj = patient?.name?.[0];
  if (!nameObj) return 'Patient';
  return [nameObj.given?.join(' '), nameObj.family].filter(Boolean).join(' ');
}

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
}

export function getMRN(patient) {
  return (
    patient?.identifier?.find(
      (i) => i.type?.coding?.[0]?.code === 'MR'
    )?.value ||
    patient?.identifier?.find((i) => i.use === 'usual')?.value ||
    patient?.id ||
    '—'
  );
}

export function getMedName(med) {
  return (
    med?.medicationCodeableConcept?.text ||
    med?.medicationCodeableConcept?.coding?.[0]?.display ||
    med?.medicationReference?.display ||
    'Unknown Medication'
  );
}

export function getMedDosage(med) {
  const dose = med?.dosageInstruction?.[0];
  if (!dose) return null;
  if (dose.text) return dose.text;
  const amount = dose?.doseAndRate?.[0]?.doseQuantity;
  return amount ? `${amount.value} ${amount.unit}` : null;
}

export function getVitalDisplay(observation) {
  const VITAL_MAP = {
    '8867-4': { label: 'Heart Rate', unit: 'bpm', icon: '❤️' },
    '8310-5': { label: 'Body Temperature', unit: '°F', icon: '🌡️' },
    '8480-6': { label: 'Systolic BP', unit: 'mmHg', icon: '🩸' },
    '8462-4': { label: 'Diastolic BP', unit: 'mmHg', icon: '🩸' },
    '9279-1': { label: 'Respiratory Rate', unit: '/min', icon: '💨' },
    '59408-5': { label: 'O₂ Saturation', unit: '%', icon: '💉' },
    '29463-7': { label: 'Body Weight', unit: 'kg', icon: '⚖️' },
    '8302-2': { label: 'Height', unit: 'cm', icon: '📏' },
    '39156-5': { label: 'BMI', unit: 'kg/m²', icon: '📊' },
    '55284-4': { label: 'Blood Pressure', unit: 'mmHg', icon: '🩸' },
  };
  const code = observation?.code?.coding?.[0]?.code;
  const info = VITAL_MAP[code] || {
    label: observation?.code?.text || 'Vital Sign',
    unit: '',
    icon: '📋',
  };

  let value = '—';
  if (observation?.valueQuantity?.value !== undefined) {
    value = parseFloat(observation.valueQuantity.value.toFixed(1));
    info.unit = observation.valueQuantity.unit || info.unit;
  } else if (observation?.component?.length) {
    // Blood pressure panel (systolic/diastolic pair)
    const parts = observation.component
      .map((c) => c.valueQuantity?.value)
      .filter(Boolean);
    if (parts.length === 2) value = `${parts[0]}/${parts[1]}`;
  }

  return { ...info, value };
}
