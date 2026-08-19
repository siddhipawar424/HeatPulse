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
