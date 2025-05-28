// // 数据将通过API从后端获取
// const mockData = {
//     systemInfo: {
//         hostname: "server-01",
//         osName: "Ubuntu 22.04.1 LTS",
//         osVersion: "5.15.0-52-generic",
//         computerName: "production-server",
//         cpuArch: "x86_64",
//         cpuModel: "Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz",
//         cpuCores: "14 (28 逻辑)",
//         uptime: "23天 4小时 17分钟"
//     },
//     resourceUsage: {
//         cpuUsage: 45,
//         memoryUsage: 62,
//         diskUsage: 78,
//         totalMemory: "32GB",
//         freeMemory: "12.16GB",
//         totalDisk: "512GB",
//         freeDisk: "112.64GB"
//     },
//     networkInfo: {
//         primaryIp: "192.168.1.100",
//         macAddress: "00:1A:2B:3C:4D:5E",
//         dnsServers: "8.8.8.8, 8.8.4.4",
//         gateway: "192.168.1.1"
//     },
//     processes: [
//         { pid: 1, name: "systemd", user: "root", cpu: 0.2, memory: 0.5, startTime: "05-16 08:00", state: "S" },
//         { pid: 854, name: "sshd", user: "root", cpu: 0.1, memory: 0.3, startTime: "05-16 08:01", state: "S" },
//         { pid: 1056, name: "nginx", user: "www-data", cpu: 2.1, memory: 1.2, startTime: "05-16 08:02", state: "S" },
//         { pid: 1245, name: "mysqld", user: "mysql", cpu: 5.3, memory: 8.7, startTime: "05-16 08:02", state: "S" },
//         { pid: 1345, name: "osqueryd", user: "root", cpu: 0.8, memory: 1.5, startTime: "05-16 08:03", state: "S" },
//         { pid: 1567, name: "postgres", user: "postgres", cpu: 3.2, memory: 4.2, startTime: "05-16 08:04", state: "S" },
//         { pid: 1789, name: "php-fpm", user: "www-data", cpu: 1.5, memory: 2.8, startTime: "05-16 08:04", state: "S" },
//         { pid: 1890, name: "redis-server", user: "redis", cpu: 0.9, memory: 1.3, startTime: "05-16 08:05", state: "S" },
//         { pid: 2034, name: "node", user: "nodejs", cpu: 4.7, memory: 5.4, startTime: "05-16 08:06", state: "S" },
//         { pid: 2156, name: "python3", user: "ubuntu", cpu: 2.3, memory: 3.1, startTime: "05-16 08:10", state: "R" }
//     ],
//     htopData: {
//         processCount: 125,
//         threadCount: 364,
//         runningCount: 3,
//         loadAvg: "1.25 0.92 0.85",
//         cpuUser: 15.7,
//         cpuSystem: 3.2,
//         cpuIrq: 0.3,
//         cpuIdle: 80.8,
//         memUsed: "19.84GB",
//         memFree: "12.16GB",
//         memBuffer: "4.32GB",
//         swapUsed: "1.23GB",
//         swapFree: "6.77GB",
//         cpuCores: 8,
//         processes: [
//             { pid: 1245, user: "mysql", prio: 20, ni: 0, virt: "1.2G", res: "750M", shr: "12M", state: "S", cpu: 5.3, mem: 8.7, time: "3:42.25", cmd: "mysqld" },
//             { pid: 2034, user: "nodejs", prio: 20, ni: 0, virt: "885M", res: "340M", shr: "8M", state: "S", cpu: 4.7, mem: 5.4, time: "2:15.48", cmd: "node /srv/app/server.js" },
//             { pid: 1567, user: "postgres", prio: 20, ni: 0, virt: "650M", res: "320M", shr: "14M", state: "S", cpu: 3.2, mem: 4.2, time: "1:54.12", cmd: "postgres" },
//             { pid: 1345, user: "root", prio: 20, ni: 0, virt: "500M", res: "200M", shr: "10M", state: "S", cpu: 0.8, mem: 1.5, time: "0:45.12", cmd: "osqueryd" },
//             { pid: 2156, user: "ubuntu", prio: 20, ni: 0, virt: "300M", res: "150M", shr: "5M", state: "R", cpu: 2.3, mem: 3.1, time: "0:30.12", cmd: "python3 /srv/app/script.py" }
//         ],
//         cpuUsage: [10, 20, 30, 40, 50, 60, 70, 80],
//         memoryUsage: [5, 10, 15, 20, 25, 30, 35, 40],
//         swapUsage: [0, 1, 2, 3, 4, 5, 6, 7]
//     },
//     perfData: {
//         samples: 12548,
//         count: 4582603,
//         data: [
//             { overhead: 23.85, object: "libc-2.33.so", symbol: "[.] __memmove_avx_unaligned_erms" },
//             { overhead: 8.72, object: "mysql", symbol: "[.] row_search_mvcc" },
//             { overhead: 5.64, object: "node", symbol: "[.] v8::internal::Compiler::CompileFunction" },
//             { overhead: 4.21, object: "postgres", symbol: "[.] ExecScan" },
//             { overhead: 3.95, object: "python3.10", symbol: "[.] _PyEval_EvalFrameDefault" },
//             { overhead: 3.52, object: "nginx", symbol: "[.] ngx_http_parse_request_line" },
//             { overhead: 3.41, object: "libc-2.33.so", symbol: "[.] malloc" },
//             { overhead: 2.98, object: "libpthread-2.33.so", symbol: "[.] pthread_mutex_lock" },
//             { overhead: 2.87, object: "kernel", symbol: "[k] copy_user_generic_string" },
//             { overhead: 2.56, object: "redis-server", symbol: "[.] dictFind" },
//             { overhead: 2.34, object: "kernel", symbol: "[k] _raw_spin_lock_irqsave" },
//             { overhead: 1.98, object: "php-fpm", symbol: "[.] zend_execute" }
//         ]
//     },
//     users: [
//         { username: "root", userId: 0, groupId: 0, homeDir: "/root", shell: "/bin/bash", description: "超级用户" },
//         { username: "ubuntu", userId: 1000, groupId: 1000, homeDir: "/home/ubuntu", shell: "/bin/bash", description: "普通用户" },
//         { username: "www-data", userId: 33, groupId: 33, homeDir: "/var/www", shell: "/usr/sbin/nologin", description: "Web服务器用户" },
//         { username: "mysql", userId: 105, groupId: 109, homeDir: "/var/lib/mysql", shell: "/bin/false", description: "MySQL数据库用户" },
//         { username: "postgres", userId: 26, groupId: 26, homeDir: "/var/lib/postgresql", shell: "/bin/bash", description: "PostgreSQL数据库用户" }
//     ],
//     networkUsage: [
//         { time: "00:00", rx: 2.1, tx: 1.8 },
//         { time: "01:00", rx: 1.8, tx: 1.5 },
//         { time: "02:00", rx: 1.5, tx: 1.2 },
//         { time: "03:00", rx: 1.2, tx: 1.0 },
//         { time: "04:00", rx: 1.0, tx: 0.8 },
//         { time: "05:00", rx: 1.2, tx: 0.9 },
//         { time: "06:00", rx: 1.5, tx: 1.1 },
//         { time: "07:00", rx: 2.3, tx: 1.7 },
//         { time: "08:00", rx: 3.5, tx: 2.8 },
//         { time: "09:00", rx: 4.2, tx: 3.6 },
//         { time: "10:00", rx: 4.8, tx: 4.1 },
//         { time: "11:00", rx: 5.2, tx: 4.5 },
//         { time: "12:00", rx: 5.5, tx: 4.8 }
//     ]
// };

// // 绘制网络图表，添加图表配置优化
// let networkChart;
// const networkChartConfig = {
//     type: 'line',
//     options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         animation: {
//             duration: 300 // 减少动画时间提高性能
//         },
//         plugins: {
//             legend: {
//                 position: 'top',
//             }
//         },
//         scales: {
//             y: {
//                 beginAtZero: true,
//                 title: {
//                     display: true,
//                     text: 'MB/s'
//                 }
//             },
//             x: {
//                 title: {
//                     display: true,
//                     text: '时间'
//                 }
//             }
//         }
//     }
// };

// function initNetworkChart() {
//     const ctx = document.getElementById('network-chart').getContext('2d');
    
//     // 准备图表数据
//     const chartData = {
//         labels: mockData.networkUsage.map(item => item.time),
//         datasets: [
//             {
//                 label: '接收 (MB/s)',
//                 data: mockData.networkUsage.map(item => item.rx),
//                 borderColor: '#3498db',
//                 backgroundColor: 'rgba(52, 152, 219, 0.1)',
//                 tension: 0.4,
//                 fill: true
//             },
//             {
//                 label: '发送 (MB/s)',
//                 data: mockData.networkUsage.map(item => item.tx),
//                 borderColor: '#2ecc71',
//                 backgroundColor: 'rgba(46, 204, 113, 0.1)',
//                 tension: 0.4,
//                 fill: true
//             }
//         ]
//     };
    
//     // 使用预设配置创建图表
//     networkChartConfig.data = chartData;
//     networkChart = new Chart(ctx, networkChartConfig);
// }


// this is new
// 网络图表配置
let networkChart;
const networkChartConfig = {
  type: 'line',
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300
    },
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'MB/s'
        }
      },
      x: {
        title: {
          display: true,
          text: '时间'
        }
      }
    }
  }
};

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