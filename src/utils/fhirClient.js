/**
 * FHIR API client.
 * All requests are routed through the Express backend proxy at /fhir/*
 * so the FHIR base URL and token never need to be exposed to third-party scripts.
 */

async function fhirGet(path, accessToken, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `/fhir/${path}${qs ? '?' + qs : ''}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/fhir+json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `FHIR error ${res.status} on ${path}`);
  }

  return res.json();
}

export async function fetchPatient(patientId, accessToken) {
  return fhirGet(`Patient/${patientId}`, accessToken);
}

export async function fetchMedications(patientId, accessToken) {
  const bundle = await fhirGet('MedicationRequest', accessToken, {
    patient: patientId,
    _count: 100,
    _sort: '-authoredon',
  });
  return bundle?.entry?.map((e) => e.resource) || [];
}

export async function fetchLabReports(patientId, accessToken) {
  const bundle = await fhirGet('DiagnosticReport', accessToken, {
    patient: patientId,
    category: 'LAB',
    _count: 100,
    _sort: '-date',
  });
  return bundle?.entry?.map((e) => e.resource) || [];
}

export async function fetchVitals(patientId, accessToken) {
  const bundle = await fhirGet('Observation', accessToken, {
    patient: patientId,
    category: 'vital-signs',
    _count: 100,
    _sort: '-date',
  });
  return bundle?.entry?.map((e) => e.resource) || [];
}
