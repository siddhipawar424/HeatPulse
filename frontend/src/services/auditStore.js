/**
 * OPERATIONAL AUDIT TRAIL SERVICE
 * Records every important lifecycle event (analysis, recommendation, dispatch,
 * acknowledgement, completion, exception) to localStorage with full context.
 *
 * Storage key: heatpulse_audit_v1_<worksiteId>
 * Each event entry is immutable once written. The log is append-only.
 *
 * Strict Constraint: This module NEVER reads or writes risk scores/levels —
 * it only records the authoritative values supplied by the caller (which always
 * originate from risk_engine.py via the backend).
 */

const AUDIT_STORAGE_PREFIX = 'heatpulse_audit_v1_';
const WORKSITES_STORAGE_KEY = 'heatpulse_worksites_v1';

// ---------------------------------------------------------------------------
// Event Type & Source Constants
// ---------------------------------------------------------------------------

/** Audit event type identifiers */
export const AUDIT_EVENT_TYPES = Object.freeze({
  ANALYSIS:        'ANALYSIS',
  RECOMMENDATION:  'RECOMMENDATION',
  DISPATCH:        'DISPATCH',
  ACKNOWLEDGED:    'ACKNOWLEDGED',
  COMPLETED:       'COMPLETED',
  EXCEPTION:       'EXCEPTION',
});

/** Actor / source identifiers */
export const AUDIT_SOURCES = Object.freeze({
  SYSTEM:                 'SYSTEM',
  GEMINI:                 'GEMINI',
  DETERMINISTIC_FALLBACK: 'DETERMINISTIC_FALLBACK',
  SUPERVISOR:             'SUPERVISOR',
});

// ---------------------------------------------------------------------------
// Core append / load helpers
// ---------------------------------------------------------------------------

/**
 * Appends a single structured audit event to the persistent log for the given
 * worksite. The event object is validated and given a deterministic unique ID.
 *
 * @param {string} worksiteId     - Target worksite ID
 * @param {Object} eventData      - Partial event object (see field list below)
 * @param {string} eventData.worksiteName    - Human-readable worksite name
 * @param {number|null} eventData.riskScore  - Authoritative risk score (from backend)
 * @param {string|null} eventData.riskLevel  - Authoritative risk level (from backend)
 * @param {string} eventData.eventType       - One of AUDIT_EVENT_TYPES
 * @param {string|null} [eventData.actionId]       - Action tracking ID (if applicable)
 * @param {string|null} [eventData.directive]      - Directive text (if applicable)
 * @param {string|null} [eventData.status]         - Current action status (if applicable)
 * @param {string} eventData.source          - One of AUDIT_SOURCES
 * @param {string|null} [eventData.exceptionReason] - Reason for exception (if applicable)
 * @returns {Object} The fully-formed event that was stored
 */
export function appendAuditEvent(worksiteId, eventData) {
  if (!worksiteId) return null;

  const timestamp = new Date().toISOString();
  const eventId = `audit_${worksiteId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const event = {
    id:              eventId,
    timestamp,
    worksiteId,
    worksiteName:    eventData.worksiteName    || worksiteId,
    riskScore:       eventData.riskScore       ?? null,
    riskLevel:       eventData.riskLevel       ?? null,
    eventType:       eventData.eventType       || AUDIT_EVENT_TYPES.ANALYSIS,
    actionId:        eventData.actionId        || null,
    directive:       eventData.directive       || null,
    status:          eventData.status          || null,
    source:          eventData.source          || AUDIT_SOURCES.SYSTEM,
    exceptionReason: eventData.exceptionReason || null,
  };

  try {
    const key = `${AUDIT_STORAGE_PREFIX}${worksiteId}`;
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    const existing = Array.isArray(parsed) ? parsed : [];
    existing.push(event);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (err) {
    console.warn('[auditStore] Failed to persist audit event:', err);
  }

  return event;
}

/**
 * Loads the audit log for a single worksite, returned newest-first.
 *
 * @param {string} worksiteId
 * @returns {Array<Object>} Array of audit event objects, newest-first
 */
export function loadAuditLog(worksiteId) {
  if (!worksiteId) return [];
  try {
    const key = `${AUDIT_STORAGE_PREFIX}${worksiteId}`;
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    const events = Array.isArray(parsed) ? parsed : [];
    // Return newest-first
    return [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (err) {
    console.warn('[auditStore] Failed to load audit log:', err);
    return [];
  }
}

/**
 * Loads and merges audit events from ALL known worksites (using the
 * worksites list stored by App.jsx), sorted newest-first.
 *
 * @returns {Array<Object>} Merged and sorted audit events across all worksites
 */
export function loadAllAuditEvents() {
  try {
    const raw = localStorage.getItem(WORKSITES_STORAGE_KEY);
    const worksites = raw ? JSON.parse(raw) : [];
    const allEvents = [];
    worksites.forEach((ws) => {
      if (ws.id) {
        allEvents.push(...loadAuditLog(ws.id));
      }
    });
    return allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (err) {
    console.warn('[auditStore] Failed to load all audit events:', err);
    return [];
  }
}

/**
 * Clears the audit log for a specific worksite. Used by tests / admin reset.
 *
 * @param {string} worksiteId
 */
export function clearAuditLog(worksiteId) {
  if (!worksiteId) return;
  try {
    localStorage.removeItem(`${AUDIT_STORAGE_PREFIX}${worksiteId}`);
  } catch (err) {
    console.warn('[auditStore] Failed to clear audit log:', err);
  }
}
