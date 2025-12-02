/*
Copyright (c) 2025 gzqccnu. under Apache, GPL LICENCE
https://github.com/gzqccnu/moniOS
*/

// 启用严格模式提高性能
'use strict';

// 全局变量，用于存储当前应用状态
const appState = {
    isRefreshing: false,
    activeSection: 'dashboard-section',
    lastUpdateTime: 0
};

// 数据将通过API从后端获取
const mockData = {
    systemInfo: {
        hostname: "server-01",
        osName: "Ubuntu 22.04.1 LTS",
        osVersion: "5.15.0-52-generic",
        computerName: "production-server",
        cpuArch: "x86_64",
        cpuModel: "Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz",
        cpuCores: "14 (28 逻辑)",
        uptime: "23天 4小时 17分钟"
    },
    resourceUsage: {
        cpuUsage: 45,
        memoryUsage: 62,
        diskUsage: 78,
        totalMemory: "32GB",
        freeMemory: "12.16GB",
        totalDisk: "512GB",
        freeDisk: "112.64GB"
    },
    networkInfo: {
        primaryIp: "192.168.1.100",
        macAddress: "00:1A:2B:3C:4D:5E",
        dnsServers: "8.8.8.8, 8.8.4.4",
        gateway: "192.168.1.1"
    },
    processes: [
        { pid: 1, name: "systemd", user: "root", cpu: 0.2, memory: 0.5, startTime: "05-16 08:00", state: "S" },
        { pid: 854, name: "sshd", user: "root", cpu: 0.1, memory: 0.3, startTime: "05-16 08:01", state: "S" },
        { pid: 1056, name: "nginx", user: "www-data", cpu: 2.1, memory: 1.2, startTime: "05-16 08:02", state: "S" },
        { pid: 1245, name: "mysqld", user: "mysql", cpu: 5.3, memory: 8.7, startTime: "05-16 08:02", state: "S" },
        { pid: 1345, name: "osqueryd", user: "root", cpu: 0.8, memory: 1.5, startTime: "05-16 08:03", state: "S" },
        { pid: 1567, name: "postgres", user: "postgres", cpu: 3.2, memory: 4.2, startTime: "05-16 08:04", state: "S" },
        { pid: 1789, name: "php-fpm", user: "www-data", cpu: 1.5, memory: 2.8, startTime: "05-16 08:04", state: "S" },
        { pid: 1890, name: "redis-server", user: "redis", cpu: 0.9, memory: 1.3, startTime: "05-16 08:05", state: "S" },
        { pid: 2034, name: "node", user: "nodejs", cpu: 4.7, memory: 5.4, startTime: "05-16 08:06", state: "S" },
        { pid: 2156, name: "python3", user: "ubuntu", cpu: 2.3, memory: 3.1, startTime: "05-16 08:10", state: "R" }
    ],
    htopData: {
        processCount: 125,
        threadCount: 364,
        runningCount: 3,
        loadAvg: "1.25 0.92 0.85",
        cpuUser: 15.7,
        cpuSystem: 3.2,
        cpuIrq: 0.3,
        cpuIdle: 80.8,
        memUsed: "19.84GB",
        memFree: "12.16GB",
        memBuffer: "4.32GB",
        swapUsed: "1.23GB",
        swapFree: "6.77GB",
        cpuCores: 8,
        processes: [
            { pid: 1245, user: "mysql", prio: 20, ni: 0, virt: "1.2G", res: "750M", shr: "12M", state: "S", cpu: 5.3, mem: 8.7, time: "3:42.25", cmd: "mysqld" },
            { pid: 2034, user: "nodejs", prio: 20, ni: 0, virt: "885M", res: "340M", shr: "8M", state: "S", cpu: 4.7, mem: 5.4, time: "2:15.48", cmd: "node /srv/app/server.js" },
            { pid: 1567, user: "postgres", prio: 20, ni: 0, virt: "650M", res: "320M", shr: "14M", state: "S", cpu: 3.2, mem: 4.2, time: "1:54.12", cmd: "postgres" },
            { pid: 1345, user: "root", prio: 20, ni: 0, virt: "500M", res: "200M", shr: "10M", state: "S", cpu: 0.8, mem: 1.5, time: "0:45.12", cmd: "osqueryd" },
            { pid: 2156, user: "ubuntu", prio: 20, ni: 0, virt: "300M", res: "150M", shr: "5M", state: "R", cpu: 2.3, mem: 3.1, time: "0:30.12", cmd: "python3 /srv/app/script.py" }
        ],
        cpuUsage: [10, 20, 30, 40, 50, 60, 70, 80],
        memoryUsage: [5, 10, 15, 20, 25, 30, 35, 40],
        swapUsage: [0, 1, 2, 3, 4, 5, 6, 7]
    },
    users: [
        { username: "root", userId: 0, groupId: 0, homeDir: "/root", shell: "/bin/bash", description: "超级用户" },
        { username: "ubuntu", userId: 1000, groupId: 1000, homeDir: "/home/ubuntu", shell: "/bin/bash", description: "普通用户" },
        { username: "www-data", userId: 33, groupId: 33, homeDir: "/var/www", shell: "/usr/sbin/nologin", description: "Web服务器用户" },
        { username: "mysql", userId: 105, groupId: 109, homeDir: "/var/lib/mysql", shell: "/bin/false", description: "MySQL数据库用户" },
        { username: "postgres", userId: 26, groupId: 26, homeDir: "/var/lib/postgresql", shell: "/bin/bash", description: "PostgreSQL数据库用户" }
    ],
    networkUsage: [
        { time: "00:00", rx: 2.1, tx: 1.8 },
        { time: "01:00", rx: 1.8, tx: 1.5 },
        { time: "02:00", rx: 1.5, tx: 1.2 },
        { time: "03:00", rx: 1.2, tx: 1.0 },
        { time: "04:00", rx: 1.0, tx: 0.8 },
        { time: "05:00", rx: 1.2, tx: 0.9 },
        { time: "06:00", rx: 1.5, tx: 1.1 },
        { time: "07:00", rx: 2.3, tx: 1.7 },
        { time: "08:00", rx: 3.5, tx: 2.8 },
        { time: "09:00", rx: 4.2, tx: 3.6 },
        { time: "10:00", rx: 4.8, tx: 4.1 },
        { time: "11:00", rx: 5.2, tx: 4.5 },
        { time: "12:00", rx: 5.5, tx: 4.8 }
    ]
};

// 使用DocumentFragment和批量更新优化DOM操作
function initSystemInfo() {
    document.getElementById('hostname').textContent = mockData.systemInfo.hostname;
    document.getElementById('os-name').textContent = mockData.systemInfo.osName;
    document.getElementById('os-version').textContent = mockData.systemInfo.osVersion;
    document.getElementById('computer-name').textContent = mockData.systemInfo.computerName;
    document.getElementById('cpu-arch').textContent = mockData.systemInfo.cpuArch;
    document.getElementById('cpu-model').textContent = mockData.systemInfo.cpuModel;
    document.getElementById('cpu-cores').textContent = mockData.systemInfo.cpuCores;
    document.getElementById('uptime').textContent = mockData.systemInfo.uptime;
}

// 初始化资源使用率
function initResourceUsage() {
    // 更新性能数据
    updatePerformanceBar('cpu-usage', mockData.resourceUsage.cpuUsage);
    updatePerformanceBar('memory-usage', mockData.resourceUsage.memoryUsage);
    updatePerformanceBar('disk-usage', mockData.resourceUsage.diskUsage);

    // 更新内存和磁盘数据
    document.getElementById('total-memory').textContent = mockData.resourceUsage.totalMemory;
    document.getElementById('free-memory').textContent = mockData.resourceUsage.freeMemory;
    document.getElementById('total-disk').textContent = mockData.resourceUsage.totalDisk;
    document.getElementById('free-disk').textContent = mockData.resourceUsage.freeDisk;
}

// 使用增量更新减少DOM操作
function updatePerformanceBar(id, value) {
    const bar = document.getElementById(`${id}-bar`);
    const text = document.getElementById(`${id}-text`);

    // 验证数据是否为有效数值
    value = parseFloat(value);
    if (isNaN(value) || value < 0) value = 0;
    if (value > 100) value = 100;

    // 根据使用率设置颜色
    let barColor;
    if (value >= 90) {
        barColor = '#e74c3c'; // 危险红色
    } else if (value >= 70) {
        barColor = '#f39c12'; // 警告黄色
    } else {
        barColor = '#3498db'; // 正常蓝色
    }

    // 只有当值发生变化时才更新DOM
    if (bar.style.width !== `${value}%`) {
        bar.style.width = `${value}%`;
        bar.style.backgroundColor = barColor;
        text.textContent = `${value}%`;
    }
}

// 初始化网络信息
function initNetworkInfo() {
    document.getElementById('primary-ip').textContent = mockData.networkInfo.primaryIp;
    document.getElementById('mac-address').textContent = mockData.networkInfo.macAddress;
    document.getElementById('dns-servers').textContent = mockData.networkInfo.dnsServers;
    document.getElementById('gateway').textContent = mockData.networkInfo.gateway;
}

// 使用DocumentFragment优化表格渲染
function initProcesses() {
    const tbody = document.getElementById('processes-body');
    // 使用DocumentFragment减少DOM重绘
    const fragment = document.createDocumentFragment();

    mockData.processes.forEach(process => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${process.pid}</td>
            <td>${process.name}</td>
            <td>${process.user}</td>
            <td>${process.cpu}</td>
            <td>${process.memory}</td>
            <td>${process.startTime}</td>
            <td>${process.state}</td>
        `;
        fragment.appendChild(tr);
    });

    // 清空并一次性添加所有行
    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

// 初始化用户表
function initUsers() {
    const tbody = document.getElementById('users-table');
    const fragment = document.createDocumentFragment();

    mockData.users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>${user.uid}</td>
            <td>${user.gid}</td>
            <td>${user.home}</td>
            <td>${user.shell}</td>
            <td>${user.description}</td>
        `;
        fragment.appendChild(tr);
    });

    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

// 优化htop视图初始化
function initHtop() {
    // 设置基本信息
    const headerData = {
        'htop-process-count': mockData.htopData.processCount,
        'htop-thread-count': mockData.htopData.threadCount,
        'htop-running-count': mockData.htopData.runningCount,
        'htop-load-avg': mockData.htopData.loadAvg,
        'htop-uptime': mockData.systemInfo.uptime,
        'htop-cpu-user': mockData.htopData.cpuUser + '%',
        'htop-cpu-system': mockData.htopData.cpuSystem + '%',
        'htop-cpu-irq': mockData.htopData.cpuIrq + '%',
        'htop-cpu-idle': mockData.htopData.cpuIdle + '%',
        'htop-mem-used': mockData.htopData.memUsed,
        'htop-mem-free': mockData.htopData.memFree,
        'htop-mem-buff': mockData.htopData.memBuffer,
        'htop-swap-used': mockData.htopData.swapUsed,
        'htop-swap-free': mockData.htopData.swapFree
    };

    // 批量更新文本内容
    for (const [id, value] of Object.entries(headerData)) {
        const element = document.getElementById(id);
        if (element && element.textContent !== value) {
            element.textContent = value;
        }
    }

    // 添加高亮标签
    const htopHeader = document.querySelector('.htop-header');
    htopHeader.innerHTML = `
        <span>进程: <span id="htop-process-count">${mockData.htopData.processCount}</span></span>
        <span>线程: <span id="htop-thread-count">${mockData.htopData.threadCount}</span></span>
        <span class="highlight">正在运行: <span id="htop-running-count">${mockData.htopData.runningCount}</span></span>
        <span class="highlight">负载平均值: <span id="htop-load-avg">${mockData.htopData.loadAvg}</span></span>
        <span>运行时间: <span id="htop-uptime">${mockData.systemInfo.uptime}</span></span>
    `;

    // 更新内存和交换空间使用率
    const memoryUsage = (parseFloat(mockData.htopData.memUsed) /
                        (parseFloat(mockData.htopData.memUsed) + parseFloat(mockData.htopData.memFree))) * 100;
    document.getElementById('htop-memory-fill').style.width = `${isNaN(memoryUsage) ? 0 : memoryUsage}%`;

    const swapTotal = parseFloat(mockData.htopData.swapUsed) + parseFloat(mockData.htopData.swapFree);
    const swapUsage = swapTotal > 0 ? (parseFloat(mockData.htopData.swapUsed) / swapTotal) * 100 : 0;
    document.getElementById('htop-swap-fill').style.width = `${swapUsage}%`;

    // 优化CPU条渲染
    generateCpuBars();

    // 使用DocumentFragment优化进程表渲染
    generateHtopProcessTable();
}

// 分离CPU条生成逻辑
function generateCpuBars() {
    const cpuBarsContainer = document.getElementById('htop-cpu-bars');
    const fragment = document.createDocumentFragment();

    // 仅在CPU条数量变化时重新创建
    if (cpuBarsContainer.children.length !== mockData.htopData.cpuCores) {
        cpuBarsContainer.innerHTML = '';

        for (let i = 0; i < mockData.htopData.cpuCores; i++) {
            const cpuBar = document.createElement('div');
            cpuBar.className = 'cpu-bar';

            const cpuFill = document.createElement('div');
            cpuFill.className = 'cpu-fill';
            cpuFill.id = `cpu-fill-${i}`;

            cpuBar.appendChild(cpuFill);
            fragment.appendChild(cpuBar);
        }

        cpuBarsContainer.appendChild(fragment);
    }

    // 更新CPU使用率
    for (let i = 0; i < mockData.htopData.cpuCores; i++) {
        const usagePercent = mockData.htopData.cpuUsage[i] || 0;
        const cpuFill = document.getElementById(`cpu-fill-${i}`);
        if (cpuFill) {
            cpuFill.style.width = `${usagePercent}%`;
        }
    }
}

// 分离htop进程表生成逻辑
function generateHtopProcessTable() {
    const htopProcesses = document.getElementById('htop-processes');
    const fragment = document.createDocumentFragment();

    htopProcesses.innerHTML = '';

    mockData.htopData.processes.forEach(process => {
        const tr = document.createElement('tr');

        // 获取CSS类
        const cpuClass = getUsageClass(process.cpu);
        const memClass = getUsageClass(process.mem);
        const stateClass = getStateClass(process.state);

        tr.innerHTML = `
            <td>${process.pid}</td>
            <td>${process.user}</td>
            <td>${process.prio}</td>
            <td>${process.ni}</td>
            <td>${process.virt}</td>
            <td>${process.res}</td>
            <td>${process.shr}</td>
            <td class="${stateClass}">${process.state}</td>
            <td class="${cpuClass}">${process.cpu}</td>
            <td class="${memClass}">${process.mem}</td>
            <td>${process.time}</td>
            <td>${process.cmd}</td>
        `;
        fragment.appendChild(tr);
    });

    htopProcesses.appendChild(fragment);
}

// 根据使用率返回相应的CSS类
function getUsageClass(usage) {
    if (usage >= 70) return 'high-usage';
    if (usage >= 30) return 'medium-usage';
    return 'low-usage';
}

// 根据进程状态返回相应的CSS类
function getStateClass(state) {
    switch(state) {
        case 'R': return 'state-running';
        case 'S': return 'state-sleeping';
        case 'T': return 'state-stopped';
        case 'Z': return 'state-zombie';
        default: return '';
    }
}

// 初始化 iftop 视图
async function initIftop() {
    try {
        const res = await fetch('/api/iftop');
        const data = await res.json();
        console.log('IFTOP init data:', data);

        // 元素引用
        const updateEl = document.getElementById('iftop-update-time');
        const countEl  = document.getElementById('iftop-connection-count');
        const rxEl     = document.getElementById('iftop-total-rx');
        const txEl     = document.getElementById('iftop-total-tx');
        const tbody    = document.getElementById('iftop-connections');

        // 清空旧内容
        tbody.innerHTML = '';

        // 错误处理
        if (data.error) {
        tbody.innerHTML = `
            <tr>
            <td colspan="5" style="text-align:center; color:#e74c3c;">
                ${data.error}: ${data.details || ''}
            </td>
            </tr>`;
        return;
        }

        // 更新头部信息
        if (updateEl) updateEl.textContent = data.update_time || '--:--:--';
        if (countEl)  countEl.textContent  = (data.connections || []).length;
        if (rxEl)     rxEl.textContent     = `${data.total_rx_mb || 0} bytes`;
        if (txEl)     txEl.textContent     = `${data.total_tx_mb || 0} bytes`;

        // 填充连接表格
        const conns = data.connections || [];
        if (conns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">没有活动的网络连接</td></tr>';
        } else {
        const frag = document.createDocumentFragment();
        conns.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td>${c.source  || 'Unknown'}</td>
            <td>${c.destination || 'Unknown'}</td>
            <td>${c.process || 'Unknown'}</td>
            <td>${c.sent != null ? c.sent : 'N/A'}</td>
            <td>${c.received != null ? c.received : 'N/A'}</td>
            `;
            frag.appendChild(tr);
        });
        tbody.appendChild(frag);
        }
    } catch (err) {
        console.error('initIftop error:', err);
        document.getElementById('iftop-connections').innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center; color:#e74c3c;">
            获取网络流量数据失败: ${err.message}
            </td>
        </tr>`;
    }
}

// 初始化 Chart.js
const trafficCtx = document.getElementById('trafficChart').getContext('2d');
const trafficChart = new Chart(trafficCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
        {
            label: 'Total Received (bytes)',
            data: [],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.1
        },
        {
            label: 'Total Sent (bytes)',
            data: [],
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            tension: 0.1
        }
        ]
    },
    options: {
        responsive: true,
        scales: {
        y: {
            beginAtZero: true,
            title: {
            display: true,
            text: 'bytes'
            }
        }
        }
    }
});

// Function to fetch & render iftop data
async function updateIftopData() {
    const section = document.getElementById('iftop-section');
    if (!section.classList.contains('active')) return;

    try {
        const res = await fetch('/api/iftop');
        const data = await res.json();
        console.log('IFTOP API Response:', data);

        // 错误处理
        if (data.error) {
        document.getElementById('iftop-connections').innerHTML = `
            <tr>
            <td colspan="5" style="text-align:center; color:#e74c3c;">
                ${data.error}: ${data.details || ''}
            </td>
            </tr>`;
        return;
        }

        // 更新头部信息
        document.getElementById('iftop-update-time').textContent = data.update_time || '--:--:--';
        document.getElementById('iftop-connection-count').textContent = (data.connections || []).length;
        document.getElementById('iftop-total-rx').textContent = `${data.total_rx_mb || 0} bytes`;
        document.getElementById('iftop-total-tx').textContent = `${data.total_tx_mb || 0} bytes`;

        // 更新 Chart 数据
        const now = new Date();
        const t = now.toTimeString().slice(0,8);
        if (trafficChart.data.labels.length >= 20) {
        trafficChart.data.labels.shift();
        trafficChart.data.datasets[0].data.shift();
        trafficChart.data.datasets[1].data.shift();
        }
        trafficChart.data.labels.push(t);
        trafficChart.data.datasets[0].data.push(data.total_rx_mb || 0);
        trafficChart.data.datasets[1].data.push(data.total_tx_mb || 0);
        trafficChart.update('none');

        // 更新连接表
        const tbody = document.getElementById('iftop-connections');
        tbody.innerHTML = '';
        const conns = data.connections || [];
        if (conns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">没有活动的网络连接</td></tr>';
        } else {
        conns.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td>${c.source || 'Unknown'}</td>
            <td>${c.destination || 'Unknown'}</td>
            <td>${c.process || 'Unknown'}</td>
            <td>${c.sent != null ? c.sent : 'N/A'}</td>
            <td>${c.received != null ? c.received : 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
        }

    } catch (err) {
        console.error('Error updating iftop data:', err);
        document.getElementById('iftop-connections').innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center; color:#e74c3c;">
            获取网络流量数据失败: ${err.message}
            </td>
        </tr>`;
    }
}

// 初始加载 & 定时刷新
updateIftopData();
setInterval(updateIftopData, 5000);


function openSection(sectionId) {
    // 如果已经是当前活动的部分，则不重复处理
    if (appState.activeSection === sectionId) return;

    // 保存当前活动的部分
    appState.activeSection = sectionId;

    // 隐藏所有内容区域
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // 显示选中的内容区域
    document.getElementById(sectionId).classList.add('active');

    // 更新导航菜单激活状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // 找到触发该操作的导航项并激活它
    const navItems = document.querySelectorAll('.nav-item');
    for (let i = 0; i < navItems.length; i++) {
        if (navItems[i].getAttribute('onclick').includes(sectionId)) {
            navItems[i].classList.add('active');
            break;
        }
    }

}

// 进程搜索功能
function searchProcesses() {
    const searchTerm = document.getElementById('process-search').value.toLowerCase();
    const tbody = document.getElementById('processes-body');
    const fragment = document.createDocumentFragment();

    const filteredProcesses = mockData.processes.filter(process =>
        process.name.toLowerCase().includes(searchTerm) ||
        process.pid.toString().includes(searchTerm)
    );

    tbody.innerHTML = '';

    if (filteredProcesses.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" style="text-align: center;">没有找到匹配的进程</td>';
        fragment.appendChild(tr);
    } else {
        filteredProcesses.forEach(process => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${process.pid}</td>
                <td>${process.name}</td>
                <td>${process.user}</td>
                <td>${process.cpu}</td>
                <td>${process.memory}</td>
                <td>${process.startTime}</td>
                <td>${process.state}</td>
            `;
            fragment.appendChild(tr);
        });
    }

    tbody.appendChild(fragment);
}

// 节流函数：限制函数调用频率
function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}

// 防抖函数：延迟执行，避免频繁调用
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// 按钮刷新
const refreshData = throttle(async function() {
    // 如果已经在刷新中，则返回
    if (appState.isRefreshing) return;

    appState.isRefreshing = true;
    const refreshBtn = document.querySelector('.refresh-btn');
    const originalText = refreshBtn.textContent;
    refreshBtn.textContent = '刷新中...';
    refreshBtn.disabled = true;

    // 确定所有需要调用的端点
    let endpoints;
    if (Array.isArray(appState.refreshEndpoints)) {
        // 如果配置了自定义数组端点
        endpoints = appState.refreshEndpoints;
    } else {
        // 否则根据当前活动部分自动决定
        switch (appState.activeSection) {
            case 'dashboard-section':
                endpoints = ['/api/system_info', '/api/resource_usage', '/api/network_info', '/api/network_usage'];
                break;
            case 'processes-section':
                endpoints = ['/api/processes'];
                break;
            case 'htop-section':
                endpoints = ['/api/htop'];
                break;
            case 'users-section':
                endpoints = ['/api/users'];
                break;
            case 'iftop-section':
                endpoints = ['/api/iftop'];
                break;
            default:
                endpoints = ['/api/all_data'];
        }
    }

    try {
        // 并行请求所有端点
        const responses = await Promise.all(endpoints.map(ep =>
            fetch(ep).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status} from ${ep}`);
                return r.json().then(data => ({ ep, data }));
            })
        ));

        // 合并返回值
        const combined = responses.reduce((acc, { ep, data }) => {
            if (ep === '/api/all_data') return { ...acc, ...data };
            switch (ep) {
                case '/api/system_info': acc.systemInfo = data; break;
                case '/api/resource_usage': acc.resourceUsage = data; break;
                case '/api/network_info': acc.networkInfo = data; break;
                case '/api/network_usage': acc.networkUsage = data; break;
                case '/api/processes': acc.processes = data; break;
                case '/api/htop': acc.htopData = data; break;
                case '/api/users': acc.users = data; break;
                case '/api/iftop': acc.networkUsage = data; break;
                default: Object.assign(acc, data);
            }
            return acc;
        }, {});

        console.log(`刷新数据成功 from ${endpoints.join(', ')}`, combined);
        // 更新数据对象
        updateDataBySection(endpoints, combined);
        updateActiveSection();

        appState.lastUpdateTime = Date.now();
        updateLastUpdateTime();
    } catch (err) {
        console.error('刷新数据出错:', err);
        // 即使失败也刷新UI
        updateActiveSection();
    } finally {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
        appState.isRefreshing = false;
    }
}, 1000);


// 智能UI更新：只更新当前活动Section
function updateActiveSection() {
    const activeSection = appState.activeSection;

    // 通用数据：始终更新系统基本信息
    initSystemInfo();

    // 更新lastUpdateTime
    appState.lastUpdateTime = Date.now();

    // 增加更新时间显示
    if (document.getElementById('last-update-time')) {
        const date = new Date(appState.lastUpdateTime);
        document.getElementById('last-update-time').textContent =
            `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    }

    // 根据当前活动页面选择性更新
    switch (activeSection) {
        case 'dashboard-section':
            // 仪表盘显示所有概览数据
            initResourceUsage();
            initNetworkInfo();
            updateNetworkChart();
            break;
        case 'processes-section':
            // 进程监控页面
            initProcesses();
            break;
        case 'htop-section':
            // htop进程视图
            initHtop();
            break;
        case 'users-section':
            // 用户账户视图
            initUsers();
            break;
        case 'iftop-section':
            // 网络流量监控
            initIftop();
            break;
        // osquery部分是按需查询，不需要自动更新
    }
}

// 优化网络图表更新
function updateNetworkChart() {
    if (networkChart) {
        // 只更新数据，不重新创建图表
        networkChart.data.labels = mockData.networkUsage.map(item => item.time);
        networkChart.data.datasets[0].data = mockData.networkUsage.map(item => item.rx);
        networkChart.data.datasets[1].data = mockData.networkUsage.map(item => item.tx);
        networkChart.update('normal'); // 使用更快的更新模式
    }
}

// 初始化iftop数据


// 自动刷新相关变量和函数
let autoRefreshInterval = null;
let countdownInterval = null;
const AUTO_REFRESH_INTERVAL = 5000; // 5秒刷新一次
let remainingTime = AUTO_REFRESH_INTERVAL / 1000;

// 切换自动刷新
function toggleAutoRefresh() {
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    const countdownElement = document.getElementById('refresh-countdown');

    // 保存用户偏好
    localStorage.setItem('autoRefreshEnabled', autoRefreshToggle.checked);

    if (autoRefreshToggle.checked) {
        // 启用自动刷新
        remainingTime = AUTO_REFRESH_INTERVAL / 1000;
        countdownElement.textContent = remainingTime + '秒';

        // 创建自动刷新计时器
        autoRefreshInterval = setInterval(() => {
            refreshData();
            remainingTime = AUTO_REFRESH_INTERVAL / 1000;
        }, AUTO_REFRESH_INTERVAL);

        // 创建倒计时更新计时器
        countdownInterval = setInterval(() => {
            remainingTime--;
            countdownElement.textContent = remainingTime + '秒';

            // 更新倒计时颜色
            if (remainingTime <= 2) {
                countdownElement.style.color = '#e74c3c';
            } else if (remainingTime <= 5) {
                countdownElement.style.color = '#f39c12';
            } else {
                countdownElement.style.color = '#3498db';
            }
        }, 1000);

        // 立即刷新一次
        refreshData();
    } else {
        // 停用自动刷新
        clearInterval(autoRefreshInterval);
        clearInterval(countdownInterval);
        countdownElement.textContent = '--';
        countdownElement.style.color = '#3498db';
    }
}

// 自动刷新
async function smartRefresh() {
    if (appState.isRefreshing) return;

    appState.isRefreshing = true;

    // 为刷新按钮添加视觉反馈
    const refreshBtn = document.querySelector('.refresh-btn');
    const originalText = refreshBtn.textContent;
    refreshBtn.textContent = '刷新中...';
    refreshBtn.disabled = true;

    // 确定当前活动部分的API端点
    let endpointConfig;
    switch (appState.activeSection) {
        case 'dashboard-section':
            // 下钻到多个端点
            endpointConfig = ['/api/system_info', '/api/resource_usage', '/api/network_info', '/api/network_usage'];
            break;
        case 'processes-section':
            endpointConfig = ['/api/processes'];
            break;
        case 'htop-section':
            endpointConfig = ['/api/htop'];
            break;
        case 'users-section':
            endpointConfig = ['/api/users'];
            break;
        case 'iftop-section':
            endpointConfig = ['/api/iftop'];
            break;
        default:
            endpointConfig = ['/api/all_data'];
    }

    try {
        // 处理单个或多个端点
        const endpoints = Array.isArray(endpointConfig) ? endpointConfig : [endpointConfig];
        // 并行请求所有端点
        const responses = await Promise.all(endpoints.map(ep =>
            fetch(ep).then(r => {
                if (!r.ok) throw new Error(`HTTP error ${r.status} from ${ep}`);
                return r.json().then(data => ({ ep, data }));
            })
        ));

        // 合并多个响应数据为单一对象
        const combinedData = responses.reduce((acc, { ep, data }) => {
            if (ep === '/api/all_data') {
                return { ...acc, ...data };
            }
            // 根据端点为不同数据字段赋值
            switch (ep) {
                case '/api/system_info':
                    acc.systemInfo = data;
                    break;
                case '/api/resource_usage':
                    acc.resourceUsage = data;
                    break;
                case '/api/network_info':
                    acc.networkInfo = data;
                    break;
                case '/api/network_usage':
                    acc.networkUsage = data;
                    break;
                case '/api/processes':
                    acc.processes = data;
                    break;
                case '/api/htop':
                    acc.htopData = data;
                    break;
                case '/api/users':
                    acc.users = data;
                    break;
                case '/api/iftop':
                    acc.networkUsage = data; // 如果 iftop 返回网络使用详情
                    break;
                default:
                    Object.assign(acc, data);
            }
            return acc;
        }, {});

        console.log(`从端点 ${endpoints.join(', ')} 获取数据成功`, combinedData);

        // 更新模型并刷新UI
        updateDataBySection(endpoints, combinedData);
        updateActiveSection();

        // 记录更新时间
        appState.lastUpdateTime = Date.now();
                updateLastUpdateTime();
            } catch (error) {
                console.error(`智能刷新出错:`, error);
            } finally {
                // 恢复刷新按钮状态
                refreshBtn.textContent = originalText;
                refreshBtn.disabled = false;
                appState.isRefreshing = false;
            }
}

// 根据端点和数据更新对应的数据模型
function updateDataBySection(endpoints, data) {
    // 当原始调用为单一字符串时，endpoints 也会是数组
    if (endpoints.includes('/api/all_data')) {
        // 全量更新
        if (data.systemInfo) mockData.systemInfo = data.systemInfo;
        if (data.resourceUsage) mockData.resourceUsage = data.resourceUsage;
        if (data.networkInfo) mockData.networkInfo = data.networkInfo;
        if (data.processes) mockData.processes = data.processes;
        if (data.htopData) mockData.htopData = data.htopData;
        if (data.users) mockData.users = data.users;
        if (data.networkUsage) mockData.networkUsage = data.networkUsage;
    } else {
        // 针对多个细分端点更新
        if (endpoints.includes('/api/system_info')) mockData.systemInfo = data.systemInfo;
        if (endpoints.includes('/api/resource_usage')) mockData.resourceUsage = data.resourceUsage;
        if (endpoints.includes('/api/network_info')) mockData.networkInfo = data.networkInfo;
        if (endpoints.includes('/api/network_usage')) mockData.networkUsage = data.networkUsage;
        if (endpoints.includes('/api/processes')) mockData.processes = data.processes;
        if (endpoints.includes('/api/htop')) mockData.htopData = data.htopData;
        if (endpoints.includes('/api/users')) mockData.users = data.users;
    }
}


// 更新最后刷新时间显示
function updateLastUpdateTime() {
    const timeElement = document.getElementById('last-update-time');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    }
}

// 初始化网络图表
function initNetworkChart() {
    const ctx = document.getElementById('network-chart').getContext('2d');

    // 准备图表数据
    const chartData = {
        labels: mockData.networkUsage.map(item => item.time),
        datasets: [
            {
                label: '接收 (MB/s)',
                data: mockData.networkUsage.map(item => item.rx),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: '发送 (MB/s)',
                data: mockData.networkUsage.map(item => item.tx),
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    };

    // 使用预设配置创建图表
    networkChartConfig.data = chartData;
    networkChart = new Chart(ctx, networkChartConfig);
}

// 更新网络图表
function updateNetworkChart() {
    if (networkChart) {
        // 只更新数据，不重新创建图表
        networkChart.data.labels = mockData.networkUsage.map(item => item.time);
        networkChart.data.datasets[0].data = mockData.networkUsage.map(item => item.rx);
        networkChart.data.datasets[1].data = mockData.networkUsage.map(item => item.tx);
        networkChart.update('normal'); // 使用更快的更新模式
    }
}

// 自动刷新变量
const autoRefresh = {
    enabled: false,
    interval: 5000, // 默认 5 秒
    smartMode: true, // 智能模式：仅刷新当前面板
    pageVisible: true, // 页面可见性状态
    timerId: null,
    countdownId: null,
    remainingTime: 5000,
    maxRetryCount: 3, // 最大重试次数
    retryCount: 0, // 当前重试次数

    // 启动自动刷新
    start() {
        this.stop(); // 确保先停止之前的计时器

        // 设置初始倒计时
        this.remainingTime = Math.floor(this.interval / 1000);
        this.updateCountdown();

        // 创建刷新计时器
        this.timerId = setInterval(() => {
            // 仅在页面可见时刷新
            if (this.pageVisible) {
                this.performRefresh();
            }
        }, this.interval);

        // 创建倒计时更新计时器
        this.countdownId = setInterval(() => {
            if (this.pageVisible) {
                this.remainingTime--;
                if (this.remainingTime <= 0) {
                    this.remainingTime = Math.floor(this.interval / 1000);
                }
                this.updateCountdown();
            }
        }, 1000);

        // 立即执行一次刷新
        this.performRefresh();

        // 保存设置
        this.saveSettings();
    },

    // 停止自动刷新
    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        if (this.countdownId) {
            clearInterval(this.countdownId);
            this.countdownId = null;
        }

        // 重置倒计时显示
        document.getElementById('refresh-countdown').textContent = '--';

        // 保存设置
        this.saveSettings();
    },

    // 执行刷新操作
    performRefresh() {
        try {
            if (this.smartMode) {
                smartRefresh();
            } else {
                refreshData();
            }
            // 成功后重置重试计数
            this.retryCount = 0;
        } catch (error) {
            console.error("自动刷新出错:", error);
            this.retryCount++;

            // 如果超过最大重试次数，暂停刷新一段时间
            if (this.retryCount >= this.maxRetryCount) {
                console.warn(`已达到最大重试次数(${this.maxRetryCount})，暂停自动刷新60秒`);
                this.stop();

                // 60秒后重新启动
                setTimeout(() => {
                    this.retryCount = 0;
                    if (this.enabled) {
                        this.start();
                    }
                }, 60000);
            }
        }
    },

    // 更新倒计时显示
    updateCountdown() {
        const countdownElement = document.getElementById('refresh-countdown');

        // 根据剩余时间设置颜色
        if (this.remainingTime <= 5) {
            countdownElement.style.color = '#e74c3c'; // 红色
        } else if (this.remainingTime <= 10) {
            countdownElement.style.color = '#f39c12'; // 黄色
        } else {
            countdownElement.style.color = '#3498db'; // 蓝色
        }

        countdownElement.textContent = `${this.remainingTime}秒`;
    },

    // 切换自动刷新状态
    toggle() {
        this.enabled = !this.enabled;

        if (this.enabled) {
            this.start();
        } else {
            this.stop();
        }

        return this.enabled;
    },

    // 设置刷新间隔
    setInterval(ms) {
        if (typeof ms !== 'number' || ms <= 5000) {
            ms = 5000; // 最小5秒
        }

        this.interval = ms;

        // 如果当前已启用，重启计时器使新间隔生效
        if (this.enabled) {
            this.start();
        }

        this.saveSettings();
        return this.interval;
    },

    // 切换智能模式
    toggleSmartMode() {
        this.smartMode = !this.smartMode;
        this.saveSettings();
        return this.smartMode;
    },

    // 处理页面可见性变化
    handleVisibilityChange() {
        this.pageVisible = document.visibilityState === 'visible';
        console.log(`页面可见性: ${this.pageVisible ? '可见' : '不可见'}`);
    },

    // 保存设置到localStorage
    saveSettings() {
        const settings = {
            enabled: this.enabled,
            interval: 5000,
            smartMode: this.smartMode
        };

        localStorage.setItem('autoRefreshSettings', JSON.stringify(settings));
    },

    // 从localStorage加载设置
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('autoRefreshSettings'));
            if (settings) {
                this.interval = settings.interval || 5000;
                this.smartMode = settings.smartMode !== undefined ? settings.smartMode : true;
                this.enabled = settings.enabled || false;

                // 更新UI
                document.getElementById('auto-refresh-toggle').checked = this.enabled;

                // 如果设置为启用，则启动自动刷新
                if (this.enabled) {
                    this.start();
                }
            }
        } catch (error) {
            console.error("加载自动刷新设置出错:", error);
        }
    }
};

// 智能选择性地更新UI
function updateActiveSection() {
    const activeSection = appState.activeSection;

    // 始终更新系统基本信息
    initSystemInfo();

    // 根据当前活动页面选择性更新
    switch (activeSection) {
        case 'dashboard-section':
            // 仪表盘显示所有概览数据
            initResourceUsage();
            initNetworkInfo();
            updateNetworkChart();
            break;
        case 'processes-section':
            // 进程监控页面
            initProcesses();
            break;
        case 'htop-section':
            // htop进程视图
            initHtop();
            break;
        case 'users-section':
            // 用户账户视图
            initUsers();
            break;
        // osquery部分是按需查询，不需要自动更新
    }
}

// 切换自动刷新
function toggleAutoRefresh() {
    const isEnabled = autoRefresh.toggle();
    document.getElementById('auto-refresh-toggle').checked = isEnabled;
}

// 页面加载时初始化所有数据和图表
window.onload = function() {
    // 添加更新时间显示
    const statusIndicator = document.querySelector('.status-indicator');
    const timeIndicator = document.createElement('div');
    statusIndicator.appendChild(timeIndicator);

    // 初始化UI
    initSystemInfo();
    initResourceUsage();
    initNetworkInfo();
    initNetworkChart();
    initProcesses();
    initUsers();
    initHtop();
    initIftop();

    // 添加键盘快捷键支持
    document.addEventListener('keydown', function(e) {
        // 按F5刷新数据
        if (e.key === 'F5') {
            e.preventDefault();
            refreshData();
        }
    });

    // 添加页面可见性监听
    document.addEventListener('visibilitychange', function() {
        autoRefresh.handleVisibilityChange();
    });

    // 定期更新状态点闪烁以表示系统在线
    setInterval(() => {
        const statusDot = document.querySelector('.status-dot');
        statusDot.style.opacity = statusDot.style.opacity === '0.5' ? '1' : '0.5';
    }, 1000);

    // 加载自动刷新设置
    autoRefresh.loadSettings();
};
