/*
Copyright (c) 2025 lrisguan. under Apache, GPL LICENCE
https://github.com/lrisguan/moniOS
*/

/**
 * API client: Communicate with backend API to get system data
 */

// API base URL
const API_BASE_URL = window.location.protocol + '//' + window.location.host;
// Request retry count
const MAX_RETRIES = 2;
// Retry delay (milliseconds)
const RETRY_DELAY = 1000;
// Request cache duration (milliseconds)
const CACHE_DURATION = 5000;

// Request cache
const apiCache = new Map();
// Pending requests
const pendingRequests = new Map();

// fetch wrapper with retry and cache functionality
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
    const cacheKey = url + (options.body ? JSON.stringify(options.body) : '');

    // Check if the same request is in progress
    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey);
    }

    // Check cache
    const now = Date.now();
    if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey);
        if (now - cachedData.timestamp < CACHE_DURATION) {
            return cachedData.data;
        }
    }

    // Create request promise
    const fetchPromise = (async () => {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API response error: ${response.status} - ${errorText || response.statusText}`);
            }

            const data = await response.json();

            // Store in cache
            apiCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            // Remove from pendingRequests after completion
            pendingRequests.delete(cacheKey);

            return data;
        } catch (error) {
            if (retries > 0) {
                console.log(`Request failed, retrying in ${RETRY_DELAY/1000} seconds... Remaining retries: ${retries}`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                pendingRequests.delete(cacheKey);
                return fetchWithRetry(url, options, retries - 1);
            }
            console.error(`Request failed, no more retries: ${error.message}`);
            pendingRequests.delete(cacheKey);
            throw error;
        }
    })();

    // Store pending request
    pendingRequests.set(cacheKey, fetchPromise);

    return fetchPromise;
}

// Clear cache
function clearCache() {
    apiCache.clear();
}

// Refresh all data
async function fetchAllData() {
    try {
        // Clear cache to ensure getting latest data
        clearCache();
        return await fetchWithRetry(`${API_BASE_URL}/api/all_data`);
    } catch (error) {
        console.error('Error while fetching all data:', error);
        return null;
    }
}

// Get system information
async function fetchSystemInfo() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/system_info`);
    } catch (error) {
        console.error('Error while fetching system information:', error);
        return null;
    }
}

// Get resource usage
async function fetchResourceUsage() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/resource_usage`);
    } catch (error) {
        console.error('Error while fetching resource usage:', error);
        return null;
    }
}

// Get process information
async function fetchProcesses() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/processes`);
    } catch (error) {
        console.error('Error while fetching process information:', error);
        return null;
    }
}

// Get htop data
async function fetchHtopData() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/htop`);
    } catch (error) {
        console.error('Error while fetching htop data:', error);
        return null;
    }
}

// Get network information
async function fetchNetworkInfo() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/network_info`);
    } catch (error) {
        console.error('Error while fetching network information:', error);
        return null;
    }
}

// Get network usage
async function fetchNetworkUsage() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/network_usage`);
    } catch (error) {
        console.error('Error while fetching network usage:', error);
        return null;
    }
}

// Get user information
async function fetchUsersInfo() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/users`);
    } catch (error) {
        console.error('Error while fetching user information:', error);
        return null;
    }
}

// Execute osquery query
async function executeOSQuery(query) {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/osquery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });
    } catch (error) {
        console.error('Error while executing osquery query:', error);
        return { error: error.message };
    }
}

// Execute iftop
async function fetchIftopData() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/iftop`);
    } catch (error) {
        console.error('Error while fetching iftop data:', error);
        return null;
    }
}
