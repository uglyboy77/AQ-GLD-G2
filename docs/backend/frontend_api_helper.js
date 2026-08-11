/**
 * AQ-GLD-G2 Frontend API & LocalStorage Helper
 * Handles User Login, Token Storage in localStorage, and fetching /latest and /history sensor data.
 */

const API_BASE_URL = 'https://aq-gld-g2-1.onrender.com
'; // Change to match server IP/domain

const Auth = {
  /**
   * Logs in user and stores auth token & user profile in localStorage
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store JWT token and user info in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log('User logged in successfully:', data.user);
      return { success: true, data };
    } catch (err) {
      console.error('Login error:', err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Retrieves stored token from localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Retrieves stored user profile from localStorage
   */
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Checks if user is currently logged in
   */
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  /**
   * Logs out user by clearing localStorage
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  },

  /**
   * Gets authorization headers with Bearer token for requests
   */
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }
};

const SensorData = {
  /**
   * Fetches the single latest sensor log from GET /sensor/latest
   */
  async getLatest() {
    try {
      const response = await fetch(`${API_BASE_URL}/sensor/latest`, {
        method: 'GET',
        headers: Auth.getAuthHeaders()
      });

      if (response.status === 401) {
        Auth.logout();
        throw new Error('Session expired, please log in again.');
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to fetch latest data');

      return data;
    } catch (err) {
      console.error('Error fetching latest sensor data:', err.message);
      throw err;
    }
  },

  /**
   * Fetches historical sensor logs from GET /sensor/history?limit=50
   */
  async getHistory(limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/sensor/history?limit=${limit}`, {
        method: 'GET',
        headers: Auth.getAuthHeaders()
      });

      if (response.status === 401) {
        Auth.logout();
        throw new Error('Session expired, please log in again.');
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch sensor history');

      return data;
    } catch (err) {
      console.error('Error fetching sensor history:', err.message);
      throw err;
    }
  }
};

// Example Usage in Dashboard:
/*
document.addEventListener('DOMContentLoaded', async () => {
  if (Auth.isLoggedIn()) {
    console.log('Logged in as:', Auth.getUser());
    
    // Fetch latest reading
    const latest = await SensorData.getLatest();
    console.log('Latest Sensor Reading:', latest);

    // Fetch history (e.g. 20 items)
    const history = await SensorData.getHistory(20);
    console.log('Sensor History:', history);
  }
});
*/
