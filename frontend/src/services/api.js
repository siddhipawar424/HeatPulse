import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 65000, // 65 seconds max for backend response
});

/**
 * Analyzes hyperlocal heat risk for a target polygon AOI, date, and time.
 * @param {Object} polygon - GeoJSON FeatureCollection object representing the AOI polygon
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {string} time - Time string in HH:MM format
 * @returns {Promise<Object>} Backend analysis result object
 */
export async function analyzeHeatRisk(polygon, date, time) {
  try {
    const response = await apiClient.post('/analyze', {
      polygon,
      date,
      time,
    });

    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Analysis failed to return successful results');
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || 'Unable to connect to HeatPulse analysis service');
  }
}

/**
 * Queries the AI Heat Safety Operations Copilot agent with fleet state context.
 * @param {Array} fleetState - List of worksite objects with analysis results and stored action states
 * @param {string} query - Optional natural language query
 * @returns {Promise<Object>} Copilot response object
 */
export async function querySafetyCopilot(fleetState, query = null) {
  try {
    const response = await apiClient.post('/copilot/query', {
      fleet_state: fleetState,
      query: query,
    });

    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Copilot query failed');
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || 'Unable to communicate with HeatPulse Copilot Service');
  }
}