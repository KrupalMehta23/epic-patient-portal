# Patient Health Portal — EPIC FHIR Integration

Hello All, please find a short demo video I have recorded for my application **Project 2: Patient Health Portal — EPIC FHIR Integration - Prototype**

For my second build, I put together a patient-facing health portal that connects directly to a real EPIC FHIR R4 server via OAuth 2.0 with PKCE. Its built for the patient - giving them a secure, read-only window into their own health records.

for the authentication: the patient signs in through EPIC's login page, the app exchanges an authorization code for tokens entirely on the backend, and those tokens are stored in sessionStorage only - nothing is ever written to disk or exposed in the browser bundle.

Once signed in, the portal surfaces three core areas of their record. Medications pulls from MedicationRequest resources and shows each drug with dosage, frequency, route, prescriber, and active/stopped status. Lab Reports pulls from DiagnosticReport and displays results with expandable detail views. Vital Signs pulls from Observation and presents the latest reading per vital type in a card grid - each card includes a sparkline trend, and tapping it expands a full historical area chart with normal range reference lines.

The goal is to give patients a clear, approachable view of their health data without requiring them to navigate a full EHR portal.
Built with: React (JavaScript) on the frontend, Node.js/Express as a backend proxy to the EPIC FHIR server, OAuth 2.0 + PKCE for secure authentication.
Built with help from Claude - open to any feedback or ideas for next steps.

## Demo Video
## Demo Video

[![Watch the demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=ZSSt4ieStt8)

## Tech Stack
- **Frontend:** React (JavaScript)
- **Backend:** Node.js / Express
- **Auth:** OAuth 2.0 + PKCE
- **FHIR Server:** EPIC FHIR R4
- **Data:** Patient, MedicationRequest, DiagnosticReport, Observation

## Setup
See README instructions in the `/backend` folder for configuration.
