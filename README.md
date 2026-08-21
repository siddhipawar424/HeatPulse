# HeatPulse — Heat Safety Operations Platform

HeatPulse is a production-oriented Heat Safety Operations Platform designed to protect outdoor workforces, vulnerable groups, and site operations from extreme thermal stress. By combining FortyGuard's hyperlocal microclimate data and environmental parameters with a deterministic risk engine and Gemini-powered agentic action planner, HeatPulse transforms raw climate parameters into stateful, dispatchable safety directives.

---

## 1. Project Overview

During extreme heat events, generic city-wide meteorological forecasts fail to capture local microclimate extremes. HeatPulse solves this problem by retrieving hyperlocal thermal analytics (surface temperatures and ambient metrics) for specific Area of Interest (AOI) polygons.

The platform:
* Ingests worksite boundaries (polygons) and retrieves high-resolution spatial temperature distributions.
* Enriches spatial heat data with real-time environmental context (Wet-Bulb temperature, apparent temperature, humidity, AQI, solar GHI).
* Calculates safety risks deterministically to enforce safety guardrails.
* Uses generative AI to synthesize personalized safety guidelines (OSHA, WHO, NIOSH) based on worksite metadata.
* Dispatches and tracks safety actions statefully, giving supervisors operational control and audit logs.
* Provides an AI Heat Safety Operations Copilot agent to analyze fleet telemetry, track unresolved directives, and respond to natural-language safety queries.

---

## 2. Target User / Primary Persona

The platform targets **Health & Safety Officers, Operations Supervisors, and Site Directors** who manage workforces exposed to extreme heat.

* **Construction & Infrastructure Supervisors:** Protect concrete, masonry, and heavy rigging crews working long shifts.
* **Freight & Logistics Managers:** Manage couriers and loading dock crews exposed to open asphalt runways.
* **Plaza & Facilities Operators:** Coordinate maintenance and outdoor public services.

---

## 3. Core Architecture

The HeatPulse pipeline processes data in a clear, sequential chain:

```
[ Worksite / AOI Polygon ]
           │
           ▼
[ FortyGuard Heatmap ] ──► Retrieves spatial maximum and mean temperature stats
           │
           ▼
[ Environmental Params ] ──► Retrieves real-time humidity, Wet-Bulb, AQI, & solar GHI
           │
           ▼
[ Deterministic Risk Engine ] ──► Computes authoritative Risk Score & Risk Level
           │
           ▼
[ Priority Groups ] ──► Identifies vulnerable roles (Outdoor Workers, Heavy Labor)
           │
           ▼
[ Safety Guidelines ] ──► Retrieves regulatory baselines (OSHA, WHO, NIOSH)
           │
           ▼
[ Gemini Action Planner & Copilot Agent ] ──► Generates reasoning, target guidance, copilot verdicts, & custom directives
           │
           ▼
[ Action Dispatch Center & Operations Dashboard ] ──► Manages tracking states (Pending, Acknowledged, Complete, Exception) & Fleet Copilot
           │
           ▼
[ Action History Log ] ──► Persists action events with timestamped audit records
```

### Stage Responsibilities
1. **Worksite/AOI:** Configures the geographic polygon, operating hours, and workforce headcount.
2. **FortyGuard Heatmap:** Submits coordinates to FortyGuard's spatial engine to obtain microclimate analytics.
3. **Environmental Parameters:** Fetches ambient parameters via FortyGuard's env API to enrich the thermal context.
4. **Deterministic Risk Engine:** Calculates the authoritative risk score (0-100) and risk level (LOW to CRITICAL) based on hardcoded meteorological thresholds.
5. **Priority Groups:** Dynamically associates risk severity to roles present at the worksite.
6. **Guidelines:** Fetches relevant regulatory texts corresponding to the calculated risk level.
7. **Gemini Agentic Action Planner & Copilot:** Leverages Gemini to synthesize guidelines and environmental parameters into readable action plans and fleet-wide copilot recommendations.
8. **Action Dispatch Center & History:** Handles user interaction, status updates, and history log rendering.

---

## 4. Safety-Critical Architecture

HeatPulse separates **Risk Determination** from **Action Planning & Fleet Reasoning** to ensure reliability in safety-critical environments:

* **Authoritative Risk:** The deterministic safety engine (`risk_engine.py`) owns the risk score and risk level. The Gemini agent and Copilot are strictly prohibited from altering, recalculating, downgrading, or overriding numeric risk scores/levels.
* **Backend-Validated Context:** The Copilot validates client-provided worksite state against backend calculation logic server-side.
* **Contextual Enrichment:** Gemini is used strictly to generate reasoning summaries, time-window guidance, grounded copilot answers, and safety recommendation synthesis.
* **System Fail-Safe:** If the Gemini API key is missing, rate-limited, or fails, the backend triggers deterministic fallbacks (`action_engine.py` for single-site plans, `copilot_engine.py` fleet aggregator for copilot queries).
* **Validation:** Standalone backend verification tests confirm that risk scores remain identical (e.g. 80 / HIGH) before and after Gemini execution.

---

## 5. FortyGuard Integration

HeatPulse integrates directly with FortyGuard's HTTP endpoints:

* **`POST /v1/heatmap`:** Submits the GeoJSON FeatureCollection AOI polygon, target date, and target hour to retrieve a processing `activity_id` at 100m granularity.
* **`POST /v1/env_params`:** Submits the geographic centroid of the polygon, mean temperature, target date, and target hour to obtain processing tracking.
* **`GET /v1/status/{activity_id}`:** Polls the status of the submitted heatmap and environmental parameters jobs. Extracts the maximum and mean temperature stats, clear-sky solar GHI, relative humidity, apparent temperature, Wet-Bulb temperature, and Air Quality Index.

---

## 6. Agentic AI & Heat Safety Operations Copilot

### Single-Site Action Planner
When Gemini is available, `generate_agentic_plan()` returns structured action directives, a 2-sentence reasoning summary, target window guidance, and guideline citations.

### Heat Safety Operations Copilot
The platform includes an AI-powered B2B Operations Copilot assistant (`copilot_engine.py`) that observes multi-worksite telemetry, FortyGuard environmental parameters, deterministic risk baselines, exposed workforce counts, shift operating hours, and live action tracking resolution statuses.

#### Key Copilot Capabilities:
* **Grounded Operational Recommendations:** Evaluates fleet telemetry to deliver executive verdicts for safety managers.
* **Natural-Language Safety Queries & Preset Chips:** Accepts custom natural-language prompts or preset query chips (*"Which sites need immediate attention today?"*, *"Why are specific sites high risk?"*, *"Which risks are unresolved?"*, *"Supervisor escalation guidance"*).
* **Critical Sites Identification:** Identifies HIGH and CRITICAL severity worksites requiring immediate supervisor attention with grounded explanations.
* **Interventions & Guidance:** Recommends immediate prioritized interventions and target time-window advisories grounded in microclimate parameters and shift hours.
* **Unresolved Directives Audit:** Tracks and summarizes pending directives, acknowledged items, completed tasks, and open operational exceptions.
* **Agent Decision Trace (`agent_trace`):** Displays a 6-step operational decision trace logging the actual data ingestion, risk validation, environmental evaluation, action audit, and agent synthesis steps performed during query execution.

### AI Execution & Fallback Architecture
* **SDK:** `google-genai` (Vite / Flask integration).
* **Model:** `gemini-2.5-flash-lite`.
* **API Key Support:** Checked via `GEMINI_API_KEY` or `GOOGLE_API_KEY`.
* **Timeout & Configuration:** Configures a 12-second HTTP timeout (`types.HttpOptions(timeout=12000)`) and enforces structured output (`response_mime_type="application/json"`).
* **Deterministic Fallback:** If Gemini is unavailable or execution fails, HeatPulse automatically falls back to a deterministic fleet aggregator that compiles operational metrics directly from backend risk baselines and guidelines, preserving 100% operational functionality.

---

## 7. Worksite Operations

The frontend converts analysis results into stateful operations:

* **Multiple Worksites:** Monitors several worksites simultaneously.
* **Analyze All Worksites:** Runs sequential, fail-safe analyses across all worksites. If a single worksite analysis fails, it is marked as such, and the process continues to the next.
* **Analysis Hour:** Replaces traditional "Peak Heat" metrics, indicating that the risk calculation corresponds precisely to the selected time picker hour.
* **Operational Action Tracking:** Dispatches actions through four states: `PENDING` → `ACKNOWLEDGED` → `COMPLETED` / `EXCEPTION`.
* **Exception Reporting:** Allows supervisors to record exceptions with custom reasons.
* **Action History & Persistence:** Persists state changes and timestamps locally via `localStorage`, which survive browser refreshes.

---

## 8. Frontend / Backend Architecture

### Backend Files (`/backend`)
* `app.py`: Sets up Flask routes, coordinates FortyGuard API calls, risk calculations, action planning, and Copilot queries.
  * **Endpoints:**
    * `GET /`: Health check route.
    * `POST /api/analyze`: Accepts polygon, date, and time to run FortyGuard spatial heat & env parameters analysis.
    * `POST /api/copilot/query`: Accepts `fleet_state` (worksite telemetry & stored action states) and an optional `query` string to execute the AI Operations Copilot agent.
* `services/fortyguard.py`: Manages endpoints and polling logic for FortyGuard.
* `logic/risk_engine.py`: Holds deterministic risk score calculations.
* `logic/copilot_engine.py`: Implements the AI Heat Safety Operations Copilot agent and deterministic fleet aggregator fallback.
* `logic/agent_planner.py`: Integrates the `google-genai` client and prompt schemas for single-site action planning.
* `logic/action_engine.py`: Defines deterministic safety action fallbacks.
* `logic/priority_engine.py` & `guideline_retriever.py`: Manage group priorities and guidelines lookup.

### Frontend Files (`/frontend/src`)
* `App.jsx`: Manages reactive states, active tab, worksite collections, and batch triggers.
* `services/api.js`: Handles API fetch wrappers (`analyzeHeatRisk`, `querySafetyCopilot`) to communicate with Flask.
* `services/actionStore.js`: Manages `localStorage` reads, writes, and status normalization.
* `components/OperationsDashboard.jsx`: Renders the B2B Command Dashboard, Executive Fleet KPI bar, embedded Copilot Panel, worksite grid, batch progress, and filtering.
* `components/CopilotPanel.jsx`: Renders the AI Safety Copilot interface with preset query chips, natural language input, grounded verdicts, critical site callouts, interventions, and expandable Agent Decision Trace.
* `components/ActionDispatchCenter.jsx`: Dispatches active actions, tab switcher, and history timeline.
* `components/WorksiteDetail.jsx` & `WorksiteCard.jsx`: Layout components for detail panels.

---

## 9. Tech Stack

* **Frontend:** React, Vite, Lucide Icons, Vanilla CSS (harmonious dark/orange HSL palette).
* **Backend:** Python 3.11+, Flask, requests, python-dotenv, google-genai.

---

## 10. Running Locally

### Backend Setup

1. Navigate to the root directory:
   ```powershell
   cd D:\HeatPulse
   ```
2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the root directory:
   ```env
   FORTYGUARD_API_KEY=your_fortyguard_key
   GEMINI_API_KEY=your_gemini_key
   # Alternatively: GOOGLE_API_KEY=your_gemini_key
   ```
5. Run the Flask development server:
   ```powershell
   python backend/app.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```powershell
   cd D:\HeatPulse\frontend
   ```
2. Install npm dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
4. Build the application for production:
   ```powershell
   npm run build
   ```

---

## 11. Verification / Testing

The following verification scripts are included in the repository and run as standalone scripts:

1. **Verify Backend (Fallback):**
   ```powershell
   python backend/test_agent_fallback.py
   ```
   *Confirms that if `GEMINI_API_KEY` is missing or invalid, the system falls back gracefully to deterministic action lists.*

2. **Verify Backend (Gemini Live):**
   ```powershell
   python backend/test_agent_enabled.py
   ```
   *Invokes Gemini live to test the schema, verify response time, and confirm that the risk score remains unchanged before and after the Gemini call.*

3. **Verify Copilot Engine (Gemini & Fallback):**
   ```powershell
   python backend/test_copilot.py
   ```
   *Verifies the Copilot response generation, decision trace (`agent_trace`), critical-site identification, directive audits, and deterministic fleet aggregator fallback behavior.*

---

## 12. Security

* **Secrets Management:** Environment variables are managed strictly via `.env` (excluded from tracking in `.gitignore`). Recognized key names include `GEMINI_API_KEY`, `GOOGLE_API_KEY`, and `FORTYGUARD_API_KEY`.
* **Authoritative Containment:** The deterministic risk engine runs entirely in memory on the backend and cannot be bypassed.

---

## 13. Hackathon Value & Differentiator

By separating **authoritative safety calculations** from **generative text synthesis and fleet copilot reasoning**, HeatPulse introduces a reliable architecture for climate safety. Organizations receive the best of both worlds: the safety guarantees of a rules-based system, and the contextual clarity of generative AI, without exposing safety-critical decisions to LLM hallucinations or API downtime.
