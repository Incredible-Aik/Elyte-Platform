// Charts JavaScript - Chart functionality for Elyte Platform Admin Dashboard

// Chart state management
let chartState = {
    charts: {},
    chartData: {},
    chartOptions: {},
    activeCharts: new Set(),
    refreshInterval: null
};

// Chart configurations
const CHART_CONFIGS = {
    rides: {
        type: 'line',
        title: 'Rides Over Time',
        color: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
    },
    revenue: {
        type: 'bar',
        title: 'Revenue Trends',
        color: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)'
    },
    drivers: {
        type: 'doughnut',
        title: 'Driver Status',
        colors: ['#10b981', '#f59e0b', '#ef4444']
    },
    users: {
        type: 'area',
        title: 'User Growth',
        color: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)'
    }
};

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.chart-container')) {
        initializeCharts();
    }
});

function initializeCharts() {
    console.log('Initializing charts...');
    
    // Find all chart containers
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        const chartType = container.getAttribute('data-chart-type');
        const chartId = container.getAttribute('id') || `chart-${chartType}`;
        
        if (chartType && CHART_CONFIGS[chartType]) {
            createChart(chartId, chartType);
        }
    });
    
    // Setup chart controls
    setupChartControls();
    
    // Setup real-time updates
    setupChartRealTimeUpdates();
    
    // Setup chart interactions
    setupChartInteractions();
    
    console.log('Charts initialized successfully');
}

function createChart(containerId, chartType) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Chart container not found:', containerId);
        return;
    }
    
    const config = CHART_CONFIGS[chartType];
    const chartData = generateChartData(chartType);
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = `${containerId}-canvas`;
    canvas.style.maxHeight = '400px';
    
    // Clear container and add canvas
    const placeholder = container.querySelector('.chart-placeholder');
    if (placeholder) {
        placeholder.innerHTML = '';
        placeholder.appendChild(canvas);
    } else {
        container.appendChild(canvas);
    }
    
    // Create chart using simulated Chart.js-like API
    const chart = createSimulatedChart(canvas, {
        type: config.type,
        data: chartData,
        options: getChartOptions(chartType)
    });
    
    // Store chart reference
    chartState.charts[containerId] = chart;
    chartState.chartData[containerId] = chartData;
    chartState.activeCharts.add(containerId);
    
    console.log(`Chart created: ${containerId} (${chartType})`);
}

function generateChartData(chartType) {
    const now = new Date();
    const labels = [];
    const data = [];
    
    switch (chartType) {
        case 'rides':
            // Generate last 7 days of ride data
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                data.push(Math.floor(Math.random() * 200) + 100);
            }
            return {
                labels: labels,
                datasets: [{
                    label: 'Rides',
                    data: data,
                    borderColor: CHART_CONFIGS.rides.color,
                    backgroundColor: CHART_CONFIGS.rides.backgroundColor,
                    tension: 0.4
                }]
            };
            
        case 'revenue':
            // Generate last 6 months of revenue data
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
                data.push(Math.floor(Math.random() * 50000) + 30000);
            }
            return {
                labels: labels,
                datasets: [{
                    label: 'Revenue ($)',
                    data: data,
                    backgroundColor: CHART_CONFIGS.revenue.color,
                    borderColor: CHART_CONFIGS.revenue.color,
                    borderWidth: 1
                }]
            };
            
        case 'drivers':
            return {
                labels: ['Online', 'Offline', 'Busy'],
                datasets: [{
                    data: [142, 58, 23],
                    backgroundColor: CHART_CONFIGS.drivers.colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            };
            
        case 'users':
            // Generate last 12 weeks of user growth
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - (i * 7));
                labels.push(`Week ${12 - i}`);
                data.push(Math.floor(Math.random() * 1000) + 500);
            }
            return {
                labels: labels,
                datasets: [{
                    label: 'New Users',
                    data: data,
                    borderColor: CHART_CONFIGS.users.color,
                    backgroundColor: CHART_CONFIGS.users.backgroundColor,
                    fill: true,
                    tension: 0.4
                }]
            };
            
        default:
            return {
                labels: ['No Data'],
                datasets: [{
                    data: [0],
                    backgroundColor: '#e5e7eb'
                }]
            };
    }
}

function getChartOptions(chartType) {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        family: 'Inter, sans-serif'
                    }
                }
            },
            title: {
                display: true,
                text: CHART_CONFIGS[chartType]?.title || 'Chart',
                font: {
                    family: 'Inter, sans-serif',
                    size: 16,
                    weight: '600'
                }
            }
        }
    };
    
    switch (chartType) {
        case 'rides':
        case 'users':
            return {
                ...baseOptions,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            };
            
        case 'revenue':
            return {
                ...baseOptions,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            };
            
        case 'drivers':
            return {
                ...baseOptions,
                cutout: '60%',
                plugins: {
                    ...baseOptions.plugins,
                    legend: {
                        position: 'bottom'
                    }
                }
            };
            
        default:
            return baseOptions;
    }
}

function createSimulatedChart(canvas, config) {
    // This is a simplified chart implementation for demonstration
    // In a real application, you would use Chart.js or similar library
    
    const ctx = canvas.getContext('2d');
    const chart = {
        canvas: canvas,
        ctx: ctx,
        config: config,
        data: config.data,
        options: config.options,
        
        // Chart methods
        update: function() {
            this.render();
        },
        
        render: function() {
            this.clear();
            this.drawChart();
        },
        
        clear: function() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },
        
        drawChart: function() {
            // Set canvas size
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * window.devicePixelRatio;
            this.canvas.height = rect.height * window.devicePixelRatio;
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            
            const width = rect.width;
            const height = rect.height;
            
            // Draw based on chart type
            switch (this.config.type) {
                case 'line':
                    this.drawLineChart(width, height);
                    break;
                case 'bar':
                    this.drawBarChart(width, height);
                    break;
                case 'doughnut':
                    this.drawDoughnutChart(width, height);
                    break;
                case 'area':
                    this.drawAreaChart(width, height);
                    break;
                default:
                    this.drawPlaceholder(width, height);
            }
        },
        
        drawLineChart: function(width, height) {
            const margin = 40;
            const chartWidth = width - margin * 2;
            const chartHeight = height - margin * 2;
            const data = this.data.datasets[0].data;
            const maxValue = Math.max(...data);
            
            this.ctx.strokeStyle = this.data.datasets[0].borderColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            data.forEach((value, index) => {
                const x = margin + (index / (data.length - 1)) * chartWidth;
                const y = height - margin - (value / maxValue) * chartHeight;
                
                if (index === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            
            this.ctx.stroke();
            
            // Draw points
            this.ctx.fillStyle = this.data.datasets[0].borderColor;
            data.forEach((value, index) => {
                const x = margin + (index / (data.length - 1)) * chartWidth;
                const y = height - margin - (value / maxValue) * chartHeight;
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
                this.ctx.fill();
            });
        },
        
        drawBarChart: function(width, height) {
            const margin = 40;
            const chartWidth = width - margin * 2;
            const chartHeight = height - margin * 2;
            const data = this.data.datasets[0].data;
            const maxValue = Math.max(...data);
            const barWidth = chartWidth / data.length * 0.8;
            const barSpacing = chartWidth / data.length * 0.2;
            
            this.ctx.fillStyle = this.data.datasets[0].backgroundColor;
            
            data.forEach((value, index) => {
                const x = margin + index * (barWidth + barSpacing) + barSpacing / 2;
                const barHeight = (value / maxValue) * chartHeight;
                const y = height - margin - barHeight;
                
                this.ctx.fillRect(x, y, barWidth, barHeight);
            });
        },
        
        drawDoughnutChart: function(width, height) {
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2 - 20;
            const innerRadius = radius * 0.6;
            const data = this.data.datasets[0].data;
            const total = data.reduce((sum, value) => sum + value, 0);
            const colors = this.data.datasets[0].backgroundColor;
            
            let currentAngle = -Math.PI / 2;
            
            data.forEach((value, index) => {
                const sliceAngle = (value / total) * 2 * Math.PI;
                
                this.ctx.fillStyle = colors[index];
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                this.ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
                this.ctx.closePath();
                this.ctx.fill();
                
                currentAngle += sliceAngle;
            });
        },
        
        drawAreaChart: function(width, height) {
            const margin = 40;
            const chartWidth = width - margin * 2;
            const chartHeight = height - margin * 2;
            const data = this.data.datasets[0].data;
            const maxValue = Math.max(...data);
            
            // Draw filled area
            this.ctx.fillStyle = this.data.datasets[0].backgroundColor;
            this.ctx.beginPath();
            this.ctx.moveTo(margin, height - margin);
            
            data.forEach((value, index) => {
                const x = margin + (index / (data.length - 1)) * chartWidth;
                const y = height - margin - (value / maxValue) * chartHeight;
                this.ctx.lineTo(x, y);
            });
            
            this.ctx.lineTo(margin + chartWidth, height - margin);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw line
            this.ctx.strokeStyle = this.data.datasets[0].borderColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            data.forEach((value, index) => {
                const x = margin + (index / (data.length - 1)) * chartWidth;
                const y = height - margin - (value / maxValue) * chartHeight;
                
                if (index === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            
            this.ctx.stroke();
        },
        
        drawPlaceholder: function(width, height) {
            this.ctx.fillStyle = '#f3f4f6';
            this.ctx.fillRect(0, 0, width, height);
            
            this.ctx.fillStyle = '#9ca3af';
            this.ctx.font = '16px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Chart will render here', width / 2, height / 2);
        }
    };
    
    // Initial render
    chart.render();
    
    // Handle resize
    window.addEventListener('resize', () => {
        setTimeout(() => chart.render(), 100);
    });
    
    return chart;
}

function setupChartControls() {
    // Time range controls
    const timeRangeButtons = document.querySelectorAll('.chart-time-range');
    timeRangeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const timeRange = this.getAttribute('data-time-range');
            const chartContainer = this.closest('.chart-card').querySelector('.chart-container');
            const chartId = chartContainer?.getAttribute('id');
            
            if (chartId) {
                updateChartTimeRange(chartId, timeRange);
            }
            
            // Update active button
            const parentContainer = this.parentElement;
            parentContainer.querySelectorAll('.chart-time-range').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Chart type toggle
    const chartTypeButtons = document.querySelectorAll('.chart-type-toggle');
    chartTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const chartType = this.getAttribute('data-chart-type');
            const chartContainer = this.closest('.chart-card').querySelector('.chart-container');
            const chartId = chartContainer?.getAttribute('id');
            
            if (chartId) {
                updateChartType(chartId, chartType);
            }
        });
    });
    
    // Chart refresh
    const refreshButtons = document.querySelectorAll('.chart-refresh');
    refreshButtons.forEach(button => {
        button.addEventListener('click', function() {
            const chartContainer = this.closest('.chart-card').querySelector('.chart-container');
            const chartId = chartContainer?.getAttribute('id');
            
            if (chartId) {
                refreshChart(chartId);
            }
            
            // Add spinning animation
            this.classList.add('spinning');
            setTimeout(() => this.classList.remove('spinning'), 1000);
        });
    });
}

function updateChartTimeRange(chartId, timeRange) {
    console.log('Updating chart time range:', chartId, timeRange);
    
    const chart = chartState.charts[chartId];
    if (!chart) return;
    
    // Generate new data based on time range
    const chartType = chart.config.data.datasets[0].label.toLowerCase().includes('ride') ? 'rides' :
                     chart.config.data.datasets[0].label.toLowerCase().includes('revenue') ? 'revenue' :
                     chart.config.data.datasets[0].label.toLowerCase().includes('user') ? 'users' : 'rides';
    
    const newData = generateTimeRangeData(chartType, timeRange);
    chart.data = newData;
    chart.update();
    
    // Update stored data
    chartState.chartData[chartId] = newData;
}

function generateTimeRangeData(chartType, timeRange) {
    const labels = [];
    const data = [];
    const now = new Date();
    
    switch (timeRange) {
        case '24h':
            for (let i = 23; i >= 0; i--) {
                const hour = new Date(now);
                hour.setHours(hour.getHours() - i);
                labels.push(hour.getHours() + ':00');
                data.push(Math.floor(Math.random() * 50) + 10);
            }
            break;
            
        case '7d':
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                data.push(Math.floor(Math.random() * 200) + 100);
            }
            break;
            
        case '30d':
            for (let i = 29; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                if (i % 5 === 0) { // Show every 5th day
                    labels.push(date.getDate().toString());
                    data.push(Math.floor(Math.random() * 500) + 200);
                }
            }
            break;
            
        case '1y':
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
                data.push(Math.floor(Math.random() * 10000) + 5000);
            }
            break;
    }
    
    const config = CHART_CONFIGS[chartType] || CHART_CONFIGS.rides;
    return {
        labels: labels,
        datasets: [{
            label: config.title,
            data: data,
            borderColor: config.color,
            backgroundColor: config.backgroundColor,
            tension: 0.4,
            fill: chartType === 'users'
        }]
    };
}

function updateChartType(chartId, newType) {
    console.log('Updating chart type:', chartId, newType);
    
    const container = document.getElementById(chartId);
    if (!container) return;
    
    // Remove old chart
    if (chartState.charts[chartId]) {
        delete chartState.charts[chartId];
    }
    
    // Update container data attribute
    container.setAttribute('data-chart-type', newType);
    
    // Create new chart
    createChart(chartId, newType);
}

function refreshChart(chartId) {
    console.log('Refreshing chart:', chartId);
    
    const chart = chartState.charts[chartId];
    if (!chart) return;
    
    const container = document.getElementById(chartId);
    const chartType = container?.getAttribute('data-chart-type');
    
    if (chartType) {
        const newData = generateChartData(chartType);
        chart.data = newData;
        chart.update();
        
        chartState.chartData[chartId] = newData;
    }
}

function setupChartRealTimeUpdates() {
    // Start real-time updates for active charts
    if (chartState.activeCharts.size > 0) {
        startChartRealTimeUpdates();
    }
}

function startChartRealTimeUpdates() {
    // Clear existing interval
    if (chartState.refreshInterval) {
        clearInterval(chartState.refreshInterval);
    }
    
    // Update charts every 30 seconds
    chartState.refreshInterval = setInterval(() => {
        updateRealTimeCharts();
    }, 30000);
    
    console.log('Chart real-time updates started');
}

function stopChartRealTimeUpdates() {
    if (chartState.refreshInterval) {
        clearInterval(chartState.refreshInterval);
        chartState.refreshInterval = null;
        console.log('Chart real-time updates stopped');
    }
}

function updateRealTimeCharts() {
    chartState.activeCharts.forEach(chartId => {
        const chart = chartState.charts[chartId];
        if (chart && chart.config.type === 'line') {
            // Add new data point for line charts
            addRealTimeDataPoint(chartId);
        }
    });
}

function addRealTimeDataPoint(chartId) {
    const chart = chartState.charts[chartId];
    if (!chart) return;
    
    const data = chart.data.datasets[0].data;
    const labels = chart.data.labels;
    
    // Add new data point
    const newValue = Math.floor(Math.random() * 100) + 50;
    data.push(newValue);
    
    // Add new label
    const now = new Date();
    labels.push(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    }));
    
    // Keep only last 20 data points
    if (data.length > 20) {
        data.shift();
        labels.shift();
    }
    
    chart.update();
}

function setupChartInteractions() {
    // Chart hover effects
    document.addEventListener('mouseover', function(e) {
        if (e.target.tagName === 'CANVAS') {
            e.target.style.cursor = 'crosshair';
        }
    });
    
    // Chart click handlers
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'CANVAS') {
            const chartId = e.target.id.replace('-canvas', '');
            handleChartClick(chartId, e);
        }
    });
}

function handleChartClick(chartId, event) {
    console.log('Chart clicked:', chartId);
    
    // Show chart details in modal
    showChartDetailsModal(chartId);
}

function showChartDetailsModal(chartId) {
    const chart = chartState.charts[chartId];
    if (!chart) return;
    
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content" style="max-width: 800px;">
            <div class="admin-modal-header">
                <h3 class="admin-modal-title">Chart Details</h3>
                <button class="admin-modal-close" onclick="this.closest('.admin-modal').remove()">&times;</button>
            </div>
            <div class="admin-modal-body">
                <div class="chart-details">
                    <div class="chart-summary">
                        <h4>Summary</h4>
                        <div class="summary-stats">
                            ${generateChartSummary(chartId)}
                        </div>
                    </div>
                    <div class="chart-data-table">
                        <h4>Data Points</h4>
                        <div class="table-responsive">
                            ${generateChartDataTable(chartId)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function generateChartSummary(chartId) {
    const chart = chartState.charts[chartId];
    if (!chart) return '';
    
    const data = chart.data.datasets[0].data;
    const total = data.reduce((sum, value) => sum + value, 0);
    const average = total / data.length;
    const max = Math.max(...data);
    const min = Math.min(...data);
    
    return `
        <div class="summary-item">
            <span class="summary-label">Total:</span>
            <span class="summary-value">${total.toLocaleString()}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Average:</span>
            <span class="summary-value">${average.toFixed(1)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Maximum:</span>
            <span class="summary-value">${max.toLocaleString()}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Minimum:</span>
            <span class="summary-value">${min.toLocaleString()}</span>
        </div>
    `;
}

function generateChartDataTable(chartId) {
    const chart = chartState.charts[chartId];
    if (!chart) return '';
    
    const labels = chart.data.labels;
    const data = chart.data.datasets[0].data;
    
    let tableRows = '';
    labels.forEach((label, index) => {
        tableRows += `
            <tr>
                <td>${label}</td>
                <td>${data[index]?.toLocaleString() || 'N/A'}</td>
            </tr>
        `;
    });
    
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Period</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
}

// Chart export functionality
function exportChart(chartId, format = 'png') {
    const chart = chartState.charts[chartId];
    if (!chart) return;
    
    const canvas = chart.canvas;
    
    if (format === 'png') {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `chart-${chartId}.png`;
        link.href = dataURL;
        link.click();
    } else if (format === 'svg') {
        // SVG export would require additional implementation
        console.log('SVG export not implemented');
    }
}

// Utility functions
function resizeChart(chartId) {
    const chart = chartState.charts[chartId];
    if (chart) {
        chart.render();
    }
}

// Window resize handler
window.addEventListener('resize', () => {
    Object.keys(chartState.charts).forEach(chartId => {
        resizeChart(chartId);
    });
});

// Export chart functions
window.ElyteAdmin = window.ElyteAdmin || {};
window.ElyteAdmin.Charts = {
    createChart: createChart,
    updateChart: refreshChart,
    exportChart: exportChart,
    updateTimeRange: updateChartTimeRange,
    startRealTime: startChartRealTimeUpdates,
    stopRealTime: stopChartRealTimeUpdates,
    getChartData: (chartId) => chartState.chartData[chartId]
};