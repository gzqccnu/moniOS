/*
Copyright (c) 2025 lrisguan. under Apache, GPL LICENCE
https://github.com/lrisguan/moniOS
*/

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
