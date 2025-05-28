/**
 * API客户端：与后端API通信获取系统数据
 */

// API基础URL
const API_BASE_URL = window.location.protocol + '//' + window.location.host;
// 请求重试次数
const MAX_RETRIES = 2;
// 重试延迟（毫秒）
const RETRY_DELAY = 1000;
// 请求缓存时间（毫秒）
const CACHE_DURATION = 5000;

// 请求缓存
const apiCache = new Map();
// 进行中的请求
const pendingRequests = new Map();

// 带重试和缓存的fetch封装
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
    const cacheKey = url + (options.body ? JSON.stringify(options.body) : '');
    
    // 检查是否有相同请求正在进行中
    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey);
    }
    
    // 检查缓存
    const now = Date.now();
    if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey);
        if (now - cachedData.timestamp < CACHE_DURATION) {
            return cachedData.data;
        }
    }
    
    // 创建请求promise
    const fetchPromise = (async () => {
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API响应错误: ${response.status} - ${errorText || response.statusText}`);
            }
            
            const data = await response.json();
            
            // 存入缓存
            apiCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            // 完成后从pendingRequests中移除
            pendingRequests.delete(cacheKey);
            
            return data;
        } catch (error) {
            if (retries > 0) {
                console.log(`请求失败，${RETRY_DELAY/1000}秒后重试... 剩余重试次数: ${retries}`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                pendingRequests.delete(cacheKey);
                return fetchWithRetry(url, options, retries - 1);
            }
            console.error(`请求失败，无更多重试: ${error.message}`);
            pendingRequests.delete(cacheKey);
            throw error;
        }
    })();
    
    // 存储进行中的请求
    pendingRequests.set(cacheKey, fetchPromise);
    
    return fetchPromise;
}

// 清除缓存
function clearCache() {
    apiCache.clear();
}

// 刷新所有数据
async function fetchAllData() {
    try {
        // 清除缓存以确保获取最新数据
        clearCache();
        return await fetchWithRetry(`${API_BASE_URL}/api/all_data`);
    } catch (error) {
        console.error('获取所有数据时出错:', error);
        return null;
    }
}

// 获取系统信息
async function fetchSystemInfo() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/system_info`);
    } catch (error) {
        console.error('获取系统信息时出错:', error);
        return null;
    }
}

// 获取资源使用情况
async function fetchResourceUsage() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/resource_usage`);
    } catch (error) {
        console.error('获取资源使用情况时出错:', error);
        return null;
    }
}

// 获取进程信息
async function fetchProcesses() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/processes`);
    } catch (error) {
        console.error('获取进程信息时出错:', error);
        return null;
    }
}

// 获取htop数据
async function fetchHtopData() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/htop`);
    } catch (error) {
        console.error('获取htop数据时出错:', error);
        return null;
    }
}

// 获取网络信息
async function fetchNetworkInfo() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/network_info`);
    } catch (error) {
        console.error('获取网络信息时出错:', error);
        return null;
    }
}

// 获取网络使用情况
async function fetchNetworkUsage() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/network_usage`);
    } catch (error) {
        console.error('获取网络使用情况时出错:', error);
        return null;
    }
}

// 获取用户信息
async function fetchUsersInfo() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/users`);
    } catch (error) {
        console.error('获取用户信息时出错:', error);
        return null;
    }
}

// 执行osquery查询
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
        console.error('执行osquery查询时出错:', error);
        return { error: error.message };
    }
} 

// 执行 iftop
async function fetchIftopData() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/iftop`);
    } catch (error) {
        console.error('获取 iftop 数据出错:', error);
        return null;
    }
}