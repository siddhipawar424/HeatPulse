/**
 * ACTION TRACKING & STORAGE ENGINE
 * Manages operational action statuses (PENDING -> ACKNOWLEDGED -> COMPLETED / EXCEPTION)
 * with localStorage persistence per worksite.
 * 
 * Strict Constraint: Keeps action status tracking 100% separate from immutable AI reasoning / backend risk calculations.
 */

const STORAGE_PREFIX = 'heatpulse_actions_v1_';

/**
 * Loads stored action status map for a given worksite from localStorage
 * @param {string} worksiteId 
 * @returns {Object} Map of actionId -> { status, acknowledgedAt, completedAt, exceptionReason }
 */
export function loadStoredActionStates(worksiteId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${worksiteId}`);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Failed to load action states from localStorage:', err);
    return {};
  }
}

/**
 * Saves action status map for a worksite to localStorage
 * @param {string} worksiteId 
 * @param {Object} stateMap 
 */
export function saveStoredActionStates(worksiteId, stateMap) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${worksiteId}`, JSON.stringify(stateMap));
  } catch (err) {
    console.warn('Failed to save action states to localStorage:', err);
  }
}

/**
 * Maps raw backend action objects into operational action objects with tracking state.
 * 
 * @param {Array} rawActions - Array of { group, priority, actions: [string, ...] }
 * @param {string} worksiteId - Target worksite ID for status lookup
 * @returns {Array} List of operational action objects
 */
export function normalizeOperationalActions(rawActions, worksiteId) {
  if (!rawActions || !Array.isArray(rawActions)) return [];

  const storedStates = loadStoredActionStates(worksiteId);

  const operationalActions = [];

  rawActions.forEach((groupItem, gIdx) => {
    const groupName = groupItem.group || 'General Workforce';
    const priority = groupItem.priority || 'HIGH';
    const directiveList = groupItem.actions || [];

    directiveList.forEach((directiveText, dIdx) => {
      // Deterministic unique ID for this directive in this worksite
      const actionId = `act_${groupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${dIdx}`;

      const stored = storedStates[actionId] || {};

      operationalActions.append ? null : null; // sanity check
      operationalActions.push({
        id: actionId,
        group: groupName,
        priority: priority,
        directive: directiveText,
        responsible: getResponsibleRole(groupName),
        status: stored.status || 'PENDING', // 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'EXCEPTION'
        acknowledgedAt: stored.acknowledgedAt || null,
        completedAt: stored.completedAt || null,
        exceptionReason: stored.exceptionReason || null,
      });
    });
  });

  return operationalActions;
}

/**
 * Helper to assign a realistic operational supervisor role based on group
 */
function getResponsibleRole(groupName) {
  const lower = groupName.toLowerCase();
  if (lower.includes('worker') || lower.includes('labor')) return 'Site Safety Supervisor';
  if (lower.includes('elderly') || lower.includes('senior')) return 'Wellness & Health Officer';
  if (lower.includes('child') || lower.includes('youth')) return 'Program / Site Director';
  if (lower.includes('exerciser') || lower.includes('athlete')) return 'Safety Operations Lead';
  if (lower.includes('delivery') || lower.includes('logistics')) return 'Fleet Operations Manager';
  return 'Operations Supervisor';
}

/**
 * Calculates quick action summary statistics for worksite cards
 * @param {Array} actions 
 * @returns {Object} { total, pending, acknowledged, completed, exception, isResolved }
 */
export function getActionSummaryStats(actions) {
  if (!actions || actions.length === 0) {
    return { total: 0, pending: 0, acknowledged: 0, completed: 0, exception: 0, isResolved: true };
  }

  let pending = 0;
  let acknowledged = 0;
  let completed = 0;
  let exception = 0;

  actions.forEach((a) => {
    switch (a.status) {
      case 'ACKNOWLEDGED':
        acknowledged++;
        break;
      case 'COMPLETED':
        completed++;
        break;
      case 'EXCEPTION':
        exception++;
        break;
      case 'PENDING':
      default:
        pending++;
        break;
    }
  });

  const total = actions.length;
  const isResolved = pending === 0;

  return {
    total,
    pending,
    acknowledged,
    completed,
    exception,
    isResolved,
  };
}
