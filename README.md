# HeatPulse - Heat Safety Operations Platform

> **HeatPulse - an AI-powered heat safety copilot that turns hyperlocal temperature data into prioritized, actionable guidance for heat-risk operations.**

HeatPulse is a production-oriented Heat Safety Operations Platform designed to protect outdoor workforces, vulnerable groups, and site operations from extreme thermal stress. By combining FortyGuard's hyperlocal microclimate data and environmental parameters with a deterministic risk engine, Gemini-powered agentic action planner, and strict post-Gemini safety validation layer, HeatPulse transforms raw climate parameters into stateful, dispatchable safety directives.

---

## 1. Project Overview

During extreme heat events, generic city-wide meteorological forecasts fail to capture local microclimate extremes. HeatPulse solves this problem by retrieving hyperlocal thermal analytics (surface temperatures and ambient metrics) for specific Area of Interest (AOI) polygons.

The platform:
* **Ingests worksite boundaries (polygons)** and retrieves high-resolution spatial temperature distributions.
* **Enriches spatial heat data** with real-time environmental context (Wet-Bulb temperature, apparent temperature, humidity, AQI, solar GHI).
* **Calculates safety risks deterministically** via a rules-based safety engine to enforce strict safety guardrails.
* **Uses generative AI** to synthesize personalized safety guidelines (OSHA, WHO, NIOSH) based on worksite metadata.
* **Dispatches and statefully tracks safety actions**, giving supervisors operational control, exception logging, and persistent audit records.
* **Provides an AI Heat Safety Operations Copilot agent** to analyze fleet telemetry, track unresolved directives, and respond to natural-language safety queries.

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
           |
           v
[ FortyGuard Heatmap ] -> Retrieves spatial maximum and mean temperature stats
           |
           v
[ Environmental Params ] -> Retrieves real-time humidity, Wet-Bulb, AQI, & solar GHI
           |
           v
[ Deterministic Risk Engine ] -> Computes authoritative Risk Score & Risk Level
           |
           v
[ Priority Groups ] -> Identifies vulnerable roles (Outdoor Workers, Heavy Labor)
           |
           v
[ Safety Guidelines ] -> Retrieves regulatory baselines (OSHA, WHO, NIOSH)
           |
           v
[ Gemini Action Planner ] -> Generates reasoning, target guidance, & custom directives
           |
           v
[ Post-Gemini Safety Validation ] -> Validates structure, priority, safety rules, & citations
           |
           +--> PASSED: Dispatches customized AI Action Plan
           +--> FAILED: Falls back to deterministic guidelines
           |
           v
[ Action Dispatch Center ] -> Manages tracking states (Pending, Acknowledged, Complete, Exception)
           |
           v
[ Persistent Audit Trail ] -> Stores state changes with timestamped records in browser localStorage
```

### Stage Responsibilities
1. **Worksite/AOI:** Configures the geographic polygon, operating hours, and workforce headcount.
2. **FortyGuard Heatmap:** Submits coordinates to FortyGuard's spatial engine to obtain microclimate analytics.
3. **Environmental Parameters:** Fetches ambient parameters via FortyGuard's env API to enrich the thermal context.
4. **Deterministic Risk Engine:** Calculates the authoritative risk score (0-100) and risk level (LOW to CRITICAL) based on hardcoded meteorological thresholds.
5. **Priority Groups:** Dynamically associates risk severity to roles present at the worksite.
6. **Guidelines:** Fetches relevant regulatory texts corresponding to the calculated risk level.
7. **Gemini Agentic Action Planner:** Leverages Gemini to synthesize guidelines and environmental parameters into structured JSON action plans.
8. **Post-Gemini Safety Validation:** Deterministically audits Gemini outputs before they reach the operations UI.
9. **Action Dispatch Center & Timeline:** Handles supervisor interaction, status updates, and persistent audit logs.

---

## 4. Safety Architecture

HeatPulse separates **Risk Determination** from **Action Planning & Fleet Reasoning** to ensure absolute reliability in safety-critical environments:

* **Authoritative Containment:** The deterministic safety engine (`risk_engine.py`) owns the risk score and risk level. The Gemini agent and Copilot are strictly prohibited from altering, recalculating, downgrading, or overriding numeric risk scores/levels.
* **Safety Validation Layer (`agent_planner.py:validate_agent_output`)**: Every response generated by Gemini is run through a deterministic backend validation block prior to UI dispatch. The validator rejects any plan that violates the following safety properties:
  * **Risk Immutability:** Rejects responses attempting to inject, redefine, or override the risk score or risk level.
  * **Priority Non-Downgrade:** Rejects responses that downgrade priority levels computed by the backend. Enforces rank order: `CRITICAL` > `VERY_HIGH` > `HIGH` > `MODERATE`/`LOW`.
  * **Action Content Safety:** Scans directives and rejects any plan containing instructions to ignore alerts or compromise rest/hydration (e.g. "ignore heat alert", "cancel rest breaks", "skip hydration", "avoid water").
  * **Citation Verification:** Enforces that cited regulatory guidelines belong to standard bodies (`OSHA`, `WHO`, `NIOSH`, `CDC`) and match retrieved guideline details.
  * **Structure Checks:** Ensures all required fields (`reasoning_summary`, `time_window_guidance`, `guideline_citations`, `actions`) are present and valid.
* **Deterministic Fallback:** If the Gemini API key is missing, API calls fail, or the response fails any safety validator check, the system raises a validation exception and falls back to deterministic safety guidelines (`action_engine.py`) to protect workforces.

---

## 5. Persistent Operational Audit Trail

To meet B2B compliance needs, HeatPulse includes a stateful operational audit trail companion service (`auditStore.js`).

* **Operational Events Tracked:**
  * `ANALYSIS`: Recorded automatically when a new worksite analysis is executed.
  * `RECOMMENDATION`: Logged for every directive dispatched to the worksite.
  * `ACKNOWLEDGED`: Appended when a supervisor acknowledges a directive.
  * `COMPLETED`: Logged when a directive is marked as resolved.
  * `EXCEPTION`: Logged when a supervisor reports an operational exception (contains a custom supervisor-supplied reason).
* **Actors / Sources Tracked:**
  * `SYSTEM`: For analysis triggers.
  * `GEMINI`: For AI-synthesized directives.
  * `DETERMINISTIC_FALLBACK`: When the planner fails back to rule-based actions.
  * `SUPERVISOR`: For all manual lifecycle updates.
* **Browser Persistence:** Events are stored in `localStorage` (`heatpulse_audit_v1_<worksiteId>`) on the frontend. Hydration happens automatically during application startup and worksite selection, ensuring the log survives browser refreshes. No backend endpoints or API contracts were changed to support this service.

---

## 6. FortyGuard Integration

HeatPulse integrates directly with FortyGuard's HTTP endpoints:

* **`POST /v1/heatmap`:** Submits the GeoJSON FeatureCollection AOI polygon, target date, and target hour to retrieve a processing `activity_id` at 100m granularity.
* **`POST /v1/env_params`:** Submits the geographic centroid of the polygon, mean temperature, target date, and target hour to obtain processing tracking.
* **`GET /v1/status/{activity_id}`:** Polls the status of the submitted heatmap and environmental parameters jobs. Extracts the maximum and mean temperature stats, clear-sky solar GHI, relative humidity, apparent temperature, Wet-Bulb temperature, and Air Quality Index.

---

## 7. AI Heat Safety Operations Copilot

### Single-Site Action Planner
When Gemini is available and passes validation, `generate_agentic_plan()` returns structured action directives, reasoning summaries, target window guidance, and guideline citations.

### Heat Safety Operations Copilot
The platform includes an AI-powered B2B Operations Copilot assistant (`copilot_engine.py`) that observes multi-worksite telemetry, FortyGuard environmental parameters, deterministic risk baselines, exposed workforce counts, shift operating hours, and live action tracking resolution statuses.

#### Key Copilot Capabilities:
* **Grounded Operational Recommendations:** Evaluates fleet telemetry to deliver executive verdicts for safety managers.
* **Natural-Language Safety Queries & Preset Chips:** Accepts custom natural-language prompts or preset query chips ("Which sites need immediate attention today?", "Why are specific sites high risk?", "Which risks are unresolved?", "Supervisor escalation guidance").
* **Critical Sites Identification:** Identifies HIGH and CRITICAL severity worksites requiring immediate supervisor attention with grounded explanations.
* **Interventions & Guidance:** Recommends immediate prioritized interventions and target time-window advisories grounded in microclimate parameters and shift hours.
* **Unresolved Directives Audit:** Tracks and summarizes pending directives, acknowledged items, completed tasks, and open operational exceptions.
* **Agent Decision Trace (`agent_trace`):** Displays a 6-step operational decision trace logging the actual data ingestion, risk validation, environmental evaluation, action audit, and agent synthesis steps performed during query execution.

---

## 8. Frontend / Backend Architecture

### Directory Structure

```
backend/
  app.py                      # Flask application endpoints
  logic/
    risk_engine.py            # Deterministic risk calculator (authoritative)
    priority_engine.py        # Workforce priority assignments
    guideline_retriever.py    # Regulatory standard fetcher
    action_engine.py          # Rule-based safety action fallbacks
    agent_planner.py          # Gemini Action Planner & Safety Validator
    copilot_engine.py         # Operations Copilot & Fleet reasoning
  services/
    fortyguard.py             # FortyGuard API integrations
  test_agent_fallback.py      # Standalone backend fallback test
  test_agent_enabled.py       # Standalone safety validator & live Gemini test
  test_copilot.py             # Standalone copilot agent verification test

frontend/
  src/
    App.jsx                   # Core React state coordinator & localStorage sync
    components/
      OperationsDashboard.jsx # Fleet KPI view & CopilotPanel
      CopilotPanel.jsx        # Copilot prompt & agent trace rendering
      ActionDispatchCenter.jsx# Stateful action supervisor & Audit Trail timeline
      WorksiteDetail.jsx      # Individual worksite details
      MapPanel.jsx            # AOI visualization
    services/
      api.js                  # Fetch requests to Flask backend
      actionStore.js          # Actions state localStorage companion
      auditStore.js           # Persistent Audit Trail service
  package.json
  package-lock.json
```

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

The following verification suites are available in the repository:

### Backend Test Commands
Run these from the virtual environment in the repository root:

1. **Verify Backend Fallback:**
   ```powershell
   python backend/test_agent_fallback.py
   ```
   *Confirms that if `GEMINI_API_KEY` is missing or invalid, the system falls back gracefully to deterministic action lists.*

2. **Verify Backend Gemini Live & Safety Validator:**
   ```powershell
   python backend/test_agent_enabled.py
   ```
   *Runs 7 validator unit tests (verifying structure, risk overrides, priority downgrades, unsafe actions, invalid citations) and tests live Gemini integration using the `gemini-2.5-flash-lite` model.*

3. **Verify Copilot Engine:**
   ```powershell
   python backend/test_copilot.py
   ```
   *Verifies the Copilot response generation, decision trace (`agent_trace`), critical-site identification, directive audits, and deterministic fleet aggregator fallback behavior.*

### Frontend Test Commands
Run these from the `frontend/` directory:

1. **Run Frontend Unit Tests:**
   ```powershell
   npm test
   ```
   *Executes 10 Vitest unit tests verifying that all event types (`ANALYSIS`, `RECOMMENDATION`, `ACKNOWLEDGED`, `COMPLETED`, `EXCEPTION`), sources (`SYSTEM`, `GEMINI`, `DETERMINISTIC_FALLBACK`, `SUPERVISOR`), and multiple persisted log entries reload cleanly.*

2. **Check Formatting & Styles:**
   ```powershell
   git diff --check
   ```
   *Confirms that no stray whitespace characters or syntax warnings are present.*
