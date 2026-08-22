/**
 * auditStore.test.js
 * Vitest unit tests for the HeatPulse operational audit trail service.
 *
 * Tests verify:
 *   1. ANALYSIS event is created and stored correctly
 *   2. RECOMMENDATION event with GEMINI source stores source correctly
 *   3. DETERMINISTIC_FALLBACK source stored when agent_executed = false
 *   4. ACKNOWLEDGED event records timestamp and source SUPERVISOR
 *   5. COMPLETED event records correctly
 *   6. EXCEPTION event records exceptionReason
 *   7. loadAuditLog returns events sorted newest-first
 *   8. Events survive "reload" — loadAuditLog reads from same key appendAuditEvent wrote to
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  appendAuditEvent,
  loadAuditLog,
  loadAllAuditEvents,
  clearAuditLog,
  AUDIT_EVENT_TYPES,
  AUDIT_SOURCES,
} from './auditStore';

// ---------------------------------------------------------------------------
// localStorage mock — simulate browser storage behaviour
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store = {};
  return {
    getItem:    (key)        => store[key] ?? null,
    setItem:    (key, value) => { store[key] = String(value); },
    removeItem: (key)        => { delete store[key]; },
    clear:      ()           => { store = {}; },
    // expose for test introspection
    _store: () => store,
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WORKSITE_ID   = 'worksite_test_01';
const WORKSITE_NAME = 'Test Worksite Alpha';
const RISK_SCORE    = 80;
const RISK_LEVEL    = 'HIGH';

function makeBaseEvent(overrides = {}) {
  return {
    worksiteName:    WORKSITE_NAME,
    riskScore:       RISK_SCORE,
    riskLevel:       RISK_LEVEL,
    eventType:       AUDIT_EVENT_TYPES.ANALYSIS,
    source:          AUDIT_SOURCES.SYSTEM,
    actionId:        null,
    directive:       null,
    status:          null,
    exceptionReason: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('auditStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  // Test 1 — ANALYSIS event created and stored
  it('Test 1: ANALYSIS event is created and stored correctly', () => {
    const event = appendAuditEvent(WORKSITE_ID, makeBaseEvent({
      eventType: AUDIT_EVENT_TYPES.ANALYSIS,
      source:    AUDIT_SOURCES.SYSTEM,
    }));

    expect(event).toBeTruthy();
    expect(event.eventType).toBe(AUDIT_EVENT_TYPES.ANALYSIS);
    expect(event.source).toBe(AUDIT_SOURCES.SYSTEM);
    expect(event.worksiteId).toBe(WORKSITE_ID);
    expect(event.riskScore).toBe(RISK_SCORE);
    expect(event.riskLevel).toBe(RISK_LEVEL);
    expect(event.timestamp).toBeTruthy();
    expect(event.id).toMatch(/^audit_/);

    // Confirm it was written to storage
    const log = loadAuditLog(WORKSITE_ID);
    expect(log.length).toBe(1);
    expect(log[0].id).toBe(event.id);
  });

  // Test 2 — RECOMMENDATION event with GEMINI source
  it('Test 2: RECOMMENDATION event with GEMINI source stores source correctly', () => {
    const event = appendAuditEvent(WORKSITE_ID, makeBaseEvent({
      eventType: AUDIT_EVENT_TYPES.RECOMMENDATION,
      source:    AUDIT_SOURCES.GEMINI,
      directive: 'Enforce 50% work / 50% rest ratio in shade',
      actionId:  'act_outdoor_workers_0',
      status:    'PENDING',
    }));

    expect(event.eventType).toBe(AUDIT_EVENT_TYPES.RECOMMENDATION);
    expect(event.source).toBe(AUDIT_SOURCES.GEMINI);
    expect(event.directive).toBe('Enforce 50% work / 50% rest ratio in shade');
    expect(event.actionId).toBe('act_outdoor_workers_0');
  });

  // Test 3 — DETERMINISTIC_FALLBACK source when agent_executed = false
  it('Test 3: DETERMINISTIC_FALLBACK source stored when agent_executed = false', () => {
    const event = appendAuditEvent(WORKSITE_ID, makeBaseEvent({
      eventType: AUDIT_EVENT_TYPES.RECOMMENDATION,
      source:    AUDIT_SOURCES.DETERMINISTIC_FALLBACK,
      directive: 'Ensure workers rest in shade every 20 minutes',
    }));

    expect(event.source).toBe(AUDIT_SOURCES.DETERMINISTIC_FALLBACK);
    expect(event.eventType).toBe(AUDIT_EVENT_TYPES.RECOMMENDATION);
  });

  // Test 4 — ACKNOWLEDGED event records SUPERVISOR source
  it('Test 4: ACKNOWLEDGED event records timestamp and source SUPERVISOR', () => {
    const event = appendAuditEvent(WORKSITE_ID, makeBaseEvent({
      eventType: AUDIT_EVENT_TYPES.ACKNOWLEDGED,
      source:    AUDIT_SOURCES.SUPERVISOR,
      actionId:  'act_outdoor_workers_0',
      directive: 'Enforce 50% work / 50% rest ratio',
      status:    'ACKNOWLEDGED',
    }));

    expect(event.eventType).toBe(AUDIT_EVENT_TYPES.ACKNOWLEDGED);
    expect(event.source).toBe(AUDIT_SOURCES.SUPERVISOR);
    expect(event.status).toBe('ACKNOWLEDGED');
    expect(event.timestamp).toBeTruthy();
    // ISO format check
    expect(() => new Date(event.timestamp)).not.toThrow();
    expect(new Date(event.timestamp).getFullYear()).toBeGreaterThanOrEqual(2025);
  });

  // Test 5 — COMPLETED event records correctly
  it('Test 5: COMPLETED event records correctly', () => {
    const event = appendAuditEvent(WORKSITE_ID, makeBaseEvent({
      eventType: AUDIT_EVENT_TYPES.COMPLETED,
      source:    AUDIT_SOURCES.SUPERVISOR,
      actionId:  'act_outdoor_workers_0',
      directive: 'Enforce 50% work / 50% rest ratio',
      status:    'COMPLETED',
    }));

    expect(event.eventType).toBe(AUDIT_EVENT_TYPES.COMPLETED);
    expect(event.source).toBe(AUDIT_SOURCES.SUPERVISOR);
    expect(event.status).toBe('COMPLETED');
    expect(event.exceptionReason).toBeNull();
  });

  // Test 6 — EXCEPTION event records exceptionReason
  it('Test 6: EXCEPTION event records exceptionReason', () => {
    const reason = 'Shade structure collapsed — work suspended by site supervisor';
    const event = appendAuditEvent(WORKSITE_ID, makeBaseEvent({
      eventType:       AUDIT_EVENT_TYPES.EXCEPTION,
      source:          AUDIT_SOURCES.SUPERVISOR,
      actionId:        'act_outdoor_workers_1',
      directive:       'Provide cool hydration every 15 minutes',
      status:          'EXCEPTION',
      exceptionReason: reason,
    }));

    expect(event.eventType).toBe(AUDIT_EVENT_TYPES.EXCEPTION);
    expect(event.exceptionReason).toBe(reason);
    expect(event.source).toBe(AUDIT_SOURCES.SUPERVISOR);
    expect(event.status).toBe('EXCEPTION');
  });

  // Test 7 — loadAuditLog returns events sorted newest-first
  it('Test 7: loadAuditLog returns events sorted newest-first', async () => {
    // Write three events with slight timing differences
    appendAuditEvent(WORKSITE_ID, makeBaseEvent({ eventType: AUDIT_EVENT_TYPES.ANALYSIS }));
    await new Promise(r => setTimeout(r, 5));
    appendAuditEvent(WORKSITE_ID, makeBaseEvent({ eventType: AUDIT_EVENT_TYPES.RECOMMENDATION }));
    await new Promise(r => setTimeout(r, 5));
    appendAuditEvent(WORKSITE_ID, makeBaseEvent({ eventType: AUDIT_EVENT_TYPES.ACKNOWLEDGED }));

    const log = loadAuditLog(WORKSITE_ID);
    expect(log.length).toBe(3);

    // Verify descending order
    for (let i = 0; i < log.length - 1; i++) {
      const a = new Date(log[i].timestamp).getTime();
      const b = new Date(log[i + 1].timestamp).getTime();
      expect(a).toBeGreaterThanOrEqual(b);
    }

    // Most recent event should be ACKNOWLEDGED
    expect(log[0].eventType).toBe(AUDIT_EVENT_TYPES.ACKNOWLEDGED);
    // Oldest should be ANALYSIS
    expect(log[2].eventType).toBe(AUDIT_EVENT_TYPES.ANALYSIS);
  });

  // Test 8 — Events survive "reload" (loadAuditLog reads same key appendAuditEvent wrote)
  it('Test 8: Events survive reload — loadAuditLog reads from same key appendAuditEvent wrote to', () => {
    const written = appendAuditEvent(WORKSITE_ID, makeBaseEvent({
      eventType: AUDIT_EVENT_TYPES.COMPLETED,
      source:    AUDIT_SOURCES.SUPERVISOR,
      directive: 'Hydration stations deployed across all zones',
      status:    'COMPLETED',
    }));

    // Simulate reload: call loadAuditLog fresh — should find the same event
    const loaded = loadAuditLog(WORKSITE_ID);
    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe(written.id);
    expect(loaded[0].eventType).toBe(AUDIT_EVENT_TYPES.COMPLETED);
    expect(loaded[0].source).toBe(AUDIT_SOURCES.SUPERVISOR);
    expect(loaded[0].directive).toBe('Hydration stations deployed across all zones');
    expect(loaded[0].riskScore).toBe(RISK_SCORE);
    expect(loaded[0].riskLevel).toBe(RISK_LEVEL);
  });

  // Bonus — clearAuditLog removes all events for that worksite
  it('Bonus: clearAuditLog removes events for the worksite', () => {
    appendAuditEvent(WORKSITE_ID, makeBaseEvent());
    appendAuditEvent(WORKSITE_ID, makeBaseEvent({ eventType: AUDIT_EVENT_TYPES.ACKNOWLEDGED }));
    expect(loadAuditLog(WORKSITE_ID).length).toBe(2);

    clearAuditLog(WORKSITE_ID);
    expect(loadAuditLog(WORKSITE_ID).length).toBe(0);
  });

  // Test 9 — Regression Test: Multiple persisted events (15 events) remain available after reload/hydration
  it('Test 9: Regression Test — Multiple persisted events survive reload and hydrate completely without data loss', () => {
    const eventsToCreate = [
      { eventType: AUDIT_EVENT_TYPES.ANALYSIS, source: AUDIT_SOURCES.SYSTEM },
      { eventType: AUDIT_EVENT_TYPES.RECOMMENDATION, source: AUDIT_SOURCES.GEMINI, actionId: 'act_1', directive: 'Rest 15m' },
      { eventType: AUDIT_EVENT_TYPES.RECOMMENDATION, source: AUDIT_SOURCES.GEMINI, actionId: 'act_2', directive: 'Hydrate 1' },
      { eventType: AUDIT_EVENT_TYPES.RECOMMENDATION, source: AUDIT_SOURCES.GEMINI, actionId: 'act_3', directive: 'Hydrate 2' },
      { eventType: AUDIT_EVENT_TYPES.RECOMMENDATION, source: AUDIT_SOURCES.GEMINI, actionId: 'act_4', directive: 'Hydrate 3' },
      { eventType: AUDIT_EVENT_TYPES.RECOMMENDATION, source: AUDIT_SOURCES.GEMINI, actionId: 'act_5', directive: 'Cooling 1' },
      { eventType: AUDIT_EVENT_TYPES.RECOMMENDATION, source: AUDIT_SOURCES.GEMINI, actionId: 'act_6', directive: 'Cooling 2' },
      { eventType: AUDIT_EVENT_TYPES.RECOMMENDATION, source: AUDIT_SOURCES.GEMINI, actionId: 'act_7', directive: 'Cooling 3' },
      { eventType: AUDIT_EVENT_TYPES.RECOMMENDATION, source: AUDIT_SOURCES.GEMINI, actionId: 'act_8', directive: 'Shade 1' },
      { eventType: AUDIT_EVENT_TYPES.RECOMMENDATION, source: AUDIT_SOURCES.GEMINI, actionId: 'act_9', directive: 'Shade 2' },
      { eventType: AUDIT_EVENT_TYPES.RECOMMENDATION, source: AUDIT_SOURCES.GEMINI, actionId: 'act_10', directive: 'Shade 3' },
      { eventType: AUDIT_EVENT_TYPES.ACKNOWLEDGED, source: AUDIT_SOURCES.SUPERVISOR, actionId: 'act_1', status: 'ACKNOWLEDGED' },
      { eventType: AUDIT_EVENT_TYPES.ACKNOWLEDGED, source: AUDIT_SOURCES.SUPERVISOR, actionId: 'act_2', status: 'ACKNOWLEDGED' },
      { eventType: AUDIT_EVENT_TYPES.COMPLETED, source: AUDIT_SOURCES.SUPERVISOR, actionId: 'act_1', status: 'COMPLETED' },
      { eventType: AUDIT_EVENT_TYPES.EXCEPTION, source: AUDIT_SOURCES.SUPERVISOR, actionId: 'act_3', status: 'EXCEPTION', exceptionReason: 'Shade structure missing' },
    ];

    eventsToCreate.forEach(evt => appendAuditEvent(WORKSITE_ID, makeBaseEvent(evt)));

    // Verify exactly 15 events are written
    const initialLog = loadAuditLog(WORKSITE_ID);
    expect(initialLog.length).toBe(15);

    // Simulate full browser reload / re-hydration
    const hydratedLog = loadAuditLog(WORKSITE_ID);
    expect(hydratedLog.length).toBe(15);
    expect(hydratedLog.filter(e => e.eventType === AUDIT_EVENT_TYPES.RECOMMENDATION).length).toBe(10);
    expect(hydratedLog.filter(e => e.eventType === AUDIT_EVENT_TYPES.ACKNOWLEDGED).length).toBe(2);
    expect(hydratedLog.filter(e => e.eventType === AUDIT_EVENT_TYPES.COMPLETED).length).toBe(1);
    expect(hydratedLog.filter(e => e.eventType === AUDIT_EVENT_TYPES.EXCEPTION).length).toBe(1);
    expect(hydratedLog.filter(e => e.eventType === AUDIT_EVENT_TYPES.ANALYSIS).length).toBe(1);
  });
});
