import { useState, useEffect } from 'react';
import {
  fetchPatient,
  fetchMedications,
  fetchLabReports,
  fetchVitals,
} from '../utils/fhirClient';

export function usePatientData(session) {
  const [state, setState] = useState({
    patient: null,
    medications: [],
    labReports: [],
    vitals: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!session?.access_token || !session?.patient_id) return;

    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const [patient, medications, labReports, vitals] = await Promise.all([
          fetchPatient(session.patient_id, session.access_token),
          fetchMedications(session.patient_id, session.access_token),
          fetchLabReports(session.patient_id, session.access_token),
          fetchVitals(session.patient_id, session.access_token),
        ]);
        if (!cancelled) {
          setState({ patient, medications, labReports, vitals, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false, error: err.message }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [session]);

  return state;
}
