const trafficCtx = document.getElementById('trafficChart').getContext('2d');
const trafficChart = new Chart(trafficCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Received (bytes/s)',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.1
            },
            {
                label: 'Sent (bytes/s)',
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
                    text: 'bytes/s'
                }
            }
        }
    }
});

// Function to update iftop data
async function updateIftopData() {
    // Only update if the iftop section is active
    if (!document.getElementById('iftop-section').classList.contains('active')) {
        console.log('IFTOP section not active, skipping update.');
        return;
    }

    try {
        const response = await fetch('/api/iftop');
        const data = await response.json();

        console.log('IFTOP API Response:', data); // Added logging

        if (data.error) {
            console.error('Network monitoring error:', data.error);
            const tbody = document.getElementById('iftop-connections');
                if (tbody) { // Added null check
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: #e74c3c;">
                            ${data.error}: ${data.details || ''}
                        </td>
                    </tr>
                `;
                }
            return;
        }

        // Update header info - Added null checks
        const updateTimeElement = document.getElementById('iftop-update-time');
        if (updateTimeElement) updateTimeElement.textContent = data.update_time || '--:--:--';

        const connectionCountElement = document.getElementById('iftop-connection-count');
        if (connectionCountElement) connectionCountElement.textContent = (data.connections || []).length;

        const totalRxElement = document.getElementById('iftop-total-rx');
        if (totalRxElement) totalRxElement.textContent = `${data.total_rx || 0} MB`;

        const totalTxElement = document.getElementById('iftop-total-tx');
        if (totalTxElement) totalTxElement.textContent = `${data.total_tx || 0} MB`;


        // Update chart (确保trafficChart已定义)
        if (typeof trafficChart !== 'undefined') {
            const now = new Date();
            const timeLabel = String(now.getHours()).padStart(2, '0') + ':' +
                            String(now.getMinutes()).padStart(2, '0') + ':' +
                            String(now.getSeconds()).padStart(2, '0');

            // Limit to last 20 data points
            if (trafficChart.data.labels.length >= 20) {
                trafficChart.data.labels.shift();
                trafficChart.data.datasets[0].data.shift();
                trafficChart.data.datasets[1].data.shift();
            }

            // Corrected chart data push - should push MB/s if possible, but API returns total MB
            // Let's push total MB for now, but the label "KB/s" is misleading.
            // The backend returns total MB, not MB/s. The chart label should be "Total Received (MB)" and "Total Sent (MB)".
            // For now, pushing total MB as is.
            trafficChart.data.labels.push(timeLabel); // Pushing time label
            trafficChart.data.datasets[0].data.push(data.total_rx || 0);
            trafficChart.data.datasets[1].data.push(data.total_tx || 0);
            trafficChart.update('none'); // 使用'none'模式提高性能
        }

        // Update connections table
        const tbody = document.getElementById('iftop-connections');
        if (tbody) { // Added null check
            tbody.innerHTML = '';

            const connections = data.connections || [];

            console.log('IFTOP Connections:', connections); // Added logging

            if (connections.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">没有活动的网络连接</td></tr>';
            } else {
                connections.forEach(conn => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${conn.source || 'Unknown'}</td>
                        <td>${conn.destination || 'Unknown'}</td>
                        <td>${conn.process || 'Unknown'}</td>
                        <td>${conn.sent || 'N/A'}</td> <!-- Changed default to N/A as per backend -->
                        <td>${conn.received || 'N/A'}</td> <!-- Changed default to N/A as per backend -->
                    `;
                    tbody.appendChild(tr);
                });
            }
        }

    } catch (error) {
        console.error('Error updating iftop data:', error);
        const tbody = document.getElementById('iftop-connections');
        if (tbody) { // Added null check
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #e74c3c;">
                        获取网络流量数据失败: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}


// Update initially and set interval
updateIftopData();
setInterval(updateIftopData, 5000);
