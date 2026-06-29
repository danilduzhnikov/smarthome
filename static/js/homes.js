/**
 * SmartHome Frontend - Navigation & CRUD + Statistics Panel
 */

// ===== STATE =====
const state = {
    level: 'homes',
    currentHomeId: null,
    currentHomeName: null,
    currentRoomId: null,
    currentRoomName: null,
    // Statistics panel state
    statsDeviceId: null,
    statsPeriod: 'day',
};

// ===== API =====
const API = {
    homes: '/home/api/homes/',
    rooms: (homeId) => `/home/api/homes/${homeId}/rooms/`,
    devices: (roomId) => `/devices/api/rooms/${roomId}/devices/`,
    logout: '/accounts/api/logout/',
    statistics: (deviceId, period) => `/statistics/api/statistics/${deviceId}/?period=${period}`,
};

// ===== DOM CACHE =====
let els = {};
let currentChart = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    try {
        cacheElements();
        attachEvents();
        loadHomes();
        console.log('✅ SmartHome JS loaded successfully');
    } catch (error) {
        console.error('❌ Init error:', error);
    }
});

function cacheElements() {
    els = {
        // Grids
        homesGrid: document.getElementById('homesGrid'),
        roomsGrid: document.getElementById('roomsGrid'),
        devicesGrid: document.getElementById('devicesGrid'),
        
        // UI
        mainContent: document.getElementById('mainContent'),
        contentTitle: document.getElementById('contentTitle'),
        createBtn: document.getElementById('createBtn'),
        breadcrumbs: document.getElementById('breadcrumbs'),
        crumbHome: document.getElementById('crumbHome'),
        crumbRoom: document.getElementById('crumbRoom'),
        crumbSep1: document.getElementById('crumbSep1'),
        crumbSep2: document.getElementById('crumbSep2'),
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        
        // Modals
        homeModal: document.getElementById('homeModal'),
        roomModal: document.getElementById('roomModal'),
        deviceModal: document.getElementById('deviceModal'),
        
        // Forms
        createHomeForm: document.getElementById('createHomeForm'),
        createRoomForm: document.getElementById('createRoomForm'),
        createDeviceForm: document.getElementById('createDeviceForm'),
        
        // Sidebar
        burger: document.getElementById('burger'),
        sidebar: document.getElementById('sidebar'),
        sidebarLogout: document.getElementById('sidebarLogout'),

        // Statistics Panel
        statsPanel: document.getElementById('statsPanel'),
        statsCloseBtn: document.getElementById('statsCloseBtn'),
        statsDeviceName: document.getElementById('statsDeviceName'),
        statsGrid: document.getElementById('statsGrid'),
        periodButtons: document.querySelectorAll('.period-btn'),
    };
}

// ===== EVENT LISTENERS =====
function attachEvents() {
    console.log('🔧 Attaching events...');
    
    // Burger menu
    if (els.burger && els.sidebar) {
        els.burger.addEventListener('click', () => {
            els.sidebar.classList.toggle('open');
        });
    }
    
    // Create button
    if (els.createBtn) {
        els.createBtn.addEventListener('click', handleCreateClick);
    }
    
    // Breadcrumbs
    const homesCrumb = document.querySelector('[data-nav="homes"]');
    if (homesCrumb) {
        homesCrumb.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('homes');
        });
    }
    
    if (els.crumbHome) {
        els.crumbHome.addEventListener('click', (e) => {
            e.preventDefault();
            if (state.currentHomeId) navigateTo('home', state.currentHomeId);
        });
    }
    
    if (els.crumbRoom) {
        els.crumbRoom.addEventListener('click', (e) => {
            e.preventDefault();
            if (state.currentRoomId) navigateTo('room', state.currentRoomId);
        });
    }
    
    // Modal closes
    setupModalClose('home');
    setupModalClose('room');
    setupModalClose('device');
    
    // Form submits
    if (els.createHomeForm) els.createHomeForm.addEventListener('submit', handleCreateHome);
    if (els.createRoomForm) els.createRoomForm.addEventListener('submit', handleCreateRoom);
    if (els.createDeviceForm) els.createDeviceForm.addEventListener('submit', handleCreateDevice);
    
    // Logout
    if (els.sidebarLogout) {
        els.sidebarLogout.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // === STATISTICS PANEL EVENTS ===
    if (els.statsCloseBtn) {
        els.statsCloseBtn.addEventListener('click', closeStatsPanel);
    }

    if (els.periodButtons) {
        els.periodButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const period = btn.dataset.period;
                if (period === state.statsPeriod) return;
                
                state.statsPeriod = period;
                // Update active button state
                els.periodButtons.forEach(b => b.classList.toggle('active', b.dataset.period === period));
                
                // Fetch new data if panel is open
                if (state.statsDeviceId) {
                    fetchAndRenderStatistics(state.statsDeviceId, period);
                }
            });
        });
    }
    
    console.log('✅ Events attached');
}

function setupModalClose(type) {
    const modal = els[`${type}Modal`];
    const closeBtn = document.getElementById(`${type}ModalClose`);
    const cancelBtn = document.getElementById(`${type}ModalCancel`);
    
    [closeBtn, cancelBtn].forEach(btn => {
        if (btn && modal) {
            btn.addEventListener('click', () => {
                modal.classList.remove('active');
                const form = els[`create${type.charAt(0).toUpperCase() + type.slice(1)}Form`];
                if (form) form.reset();
                const err = document.getElementById(`${type}FormError`);
                if (err) err.textContent = '';
            });
        }
    });
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }
}

// ===== NAVIGATION =====
function navigateTo(level, id = null, name = null) {
    console.log(`🧭 Navigate to: ${level}`, { id, name });
    
    state.level = level;
    
    // Close stats panel when navigating away from devices
    closeStatsPanel();
    
    if (level === 'homes') {
        state.currentHomeId = state.currentHomeName = state.currentRoomId = state.currentRoomName = null;
    } else if (level === 'home') {
        state.currentHomeId = id;
        state.currentHomeName = name;
        state.currentRoomId = state.currentRoomName = null;
    } else if (level === 'room') {
        state.currentRoomId = id;
        state.currentRoomName = name;
    }
    
    // Toggle grids
    if (els.homesGrid) els.homesGrid.style.display = level === 'homes' ? 'grid' : 'none';
    if (els.roomsGrid) els.roomsGrid.style.display = level === 'home' ? 'grid' : 'none';
    if (els.devicesGrid) els.devicesGrid.style.display = level === 'room' ? 'grid' : 'none';
    
    updateBreadcrumbs();
    
    // Load data
    if (level === 'homes') loadHomes();
    else if (level === 'home' && id) loadRooms(id);
    else if (level === 'room' && id) loadDevices(id);
    
    // Auto-refresh control
    if (level === 'room') startAutoRefresh();
    else if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

function updateBreadcrumbs() {
    if (!els.breadcrumbs) return;
    
    els.breadcrumbs.style.display = 'flex';
    
    if (els.crumbHome) els.crumbHome.style.display = state.currentHomeId ? 'inline' : 'none';
    if (els.crumbSep1) els.crumbSep1.style.display = state.currentHomeId ? 'inline' : 'none';
    if (els.crumbRoom) els.crumbRoom.style.display = state.currentRoomId ? 'inline' : 'none';
    if (els.crumbSep2) els.crumbSep2.style.display = state.currentRoomId ? 'inline' : 'none';
    
    if (state.currentHomeId && els.crumbHome) {
        els.crumbHome.textContent = escapeHtml(state.currentHomeName || `Home #${state.currentHomeId}`);
    }
    if (state.currentRoomId && els.crumbRoom) {
        els.crumbRoom.textContent = escapeHtml(state.currentRoomName || `Room #${state.currentRoomId}`);
    }
    
    const titles = { 'homes': 'My Homes', 'home': 'Rooms', 'room': 'Devices' };
    if (els.contentTitle) els.contentTitle.textContent = titles[state.level];
}

// ===== API CALLS =====
async function loadHomes() {
    toggleLoading(true);
    showError(null);
    try {
        const token = localStorage.getItem('access');
        const res = await fetch(API.homes, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load homes');
        renderHomes(await res.json());
    } catch (e) {
        console.error('Load homes error:', e);
        showError(e.message);
    } finally { toggleLoading(false); }
}

async function loadRooms(homeId) {
    toggleLoading(true);
    showError(null);
    try {
        const token = localStorage.getItem('access');
        const res = await fetch(API.rooms(homeId), { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load rooms');
        renderRooms(await res.json());
    } catch (e) {
        console.error('Load rooms error:', e);
        showError(e.message);
    } finally { toggleLoading(false); }
}

async function loadDevices(roomId) {
    toggleLoading(true);
    showError(null);
    try {
        const token = localStorage.getItem('access');
        const res = await fetch(API.devices(roomId), { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load devices');
        renderDevices(await res.json());
    } catch (e) {
        console.error('Load devices error:', e);
        showError(e.message);
    } finally { toggleLoading(false); }
}

// ===== RENDERING =====
function renderHomes(homes) {
    if (!els.homesGrid) return;
    if (!homes?.length) {
        els.homesGrid.innerHTML = '<div class="empty-homes">No homes yet. Click + to create.</div>';
        return;
    }
    els.homesGrid.innerHTML = homes.map(home => `
        <div class="home-card" data-home-id="${home.id}" data-home-name="${escapeHtml(home.name)}">
            <div class="home-name">${escapeHtml(home.name)}</div>
            <div class="home-meta">${escapeHtml(home.address || 'No address')}</div>
            <div class="home-meta">🏠 ${home.rooms_count || 0} rooms</div>
        </div>
    `).join('');
    
    els.homesGrid.querySelectorAll('.home-card').forEach(card => {
        card.addEventListener('click', () => navigateTo('home', card.dataset.homeId, card.dataset.homeName));
    });
}

function renderRooms(rooms) {
    if (!els.roomsGrid) return;
    if (!rooms?.length) {
        els.roomsGrid.innerHTML = '<div class="empty-homes">No rooms yet. Click + to create.</div>';
        return;
    }
    els.roomsGrid.innerHTML = rooms.map(room => `
        <div class="home-card room-card" data-room-id="${room.id}" data-room-name="${escapeHtml(room.name)}">
            <div class="home-name">${escapeHtml(room.name)}</div>
            <div class="home-meta">${escapeHtml(room.description || 'No description')}</div>
            <div class="home-meta">🔌 ${room.devices_count || 0} devices</div>
        </div>
    `).join('');
    
    els.roomsGrid.querySelectorAll('.room-card').forEach(card => {
        card.addEventListener('click', () => navigateTo('room', card.dataset.roomId, card.dataset.roomName));
    });
}

function renderDevices(devices) {
    if (!els.devicesGrid) return;
    if (!devices?.length) {
        els.devicesGrid.innerHTML = '<div class="empty-homes">No devices yet. Click + to add.</div>';
        return;
    }
    
    els.devicesGrid.innerHTML = devices.map(device => {
        const readings = device.latest_readings || {};
        const readingsList = [];
        if (readings.temp) readingsList.push(`temp: ${parseFloat(readings.temp.value).toFixed(1)}°C`);
        if (readings.hum) readingsList.push(`hum: ${parseFloat(readings.hum.value).toFixed(1)}%`);
        
        const isOnline = device.is_online === true;
        let lastSeenText = '';
        if (!isOnline && device.last_seen) {
            const diff = Math.floor((Date.now() - new Date(device.last_seen).getTime()) / 1000);
            if (diff < 60) lastSeenText = `${diff}s ago`;
            else if (diff < 3600) lastSeenText = `${Math.floor(diff / 60)}m ago`;
            else lastSeenText = `${Math.floor(diff / 3600)}h ago`;
        }
        
        const readingsHtml = readingsList.length > 0 && isOnline
            ? readingsList.map(r => `<div style="font-size:13px;color:#2c2c2c;margin:4px 0">${r}</div>`).join('')
            : `<div style="color:#aaa;font-size:13px">No data${!isOnline && lastSeenText ? `<br><small>• Last seen: ${lastSeenText}</small>` : ''}</div>`;
        
        const statusClass = isOnline ? '' : 'inactive';
        const statusText = isOnline ? 'Online' : 'Offline';
        const icons = { light:'💡', sensor:'🌡️', switch:'🔌', camera:'📷', other:'📦' };
        
        return `
            <div class="device-card" data-device-id="${device.id}" data-device-name="${escapeHtml(device.name)}">
                <div class="device-header">
                    <span class="device-name">${escapeHtml(device.name)}</span>
                    <span class="device-type">${icons[device.device_type] || '📦'} ${device.device_type}</span>
                </div>
                <div class="device-uuid" title="${device.id}">ID: ${device.id.slice(0,8)}...</div>
                <div style="margin:10px 0;padding:10px;background:#f8f9fa;border-radius:8px;min-height:50px;">
                    ${readingsHtml}
                </div>
                <div class="device-status">
                    <span class="status-dot ${statusClass}"></span>
                    <span>${statusText}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Attach click handler to open statistics panel
    els.devicesGrid.querySelectorAll('.device-card').forEach(card => {
        card.addEventListener('click', () => {
            const deviceId = card.dataset.deviceId;
            const deviceName = card.dataset.deviceName;
            openStatsPanel(deviceId, deviceName);
        });
    });
}

// ===== STATISTICS PANEL LOGIC =====

/**
 * Opens the right-side statistics panel and loads default (day) data
 */
function openStatsPanel(deviceId, deviceName) {
    state.statsDeviceId = deviceId;
    state.statsPeriod = 'day';
    
    if (els.statsDeviceName) els.statsDeviceName.textContent = `${deviceName} Statistics`;
    if (els.statsPanel) els.statsPanel.classList.add('open');
    if (els.mainContent) els.mainContent.classList.add('panel-open');
    
    // Reset period buttons
    if (els.periodButtons) {
        els.periodButtons.forEach(b => b.classList.toggle('active', b.dataset.period === 'day'));
    }
    
    fetchAndRenderStatistics(deviceId, 'day');
}

/**
 * Closes the statistics panel and cleans up chart
 */
function closeStatsPanel() {
    if (els.statsPanel) els.statsPanel.classList.remove('open');
    if (els.mainContent) els.mainContent.classList.remove('panel-open');
    
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    state.statsDeviceId = null;
}

/**
 * Fetches statistics from API and renders chart + summary
 */
async function fetchAndRenderStatistics(deviceId, period) {
    if (!deviceId) return;
    
    try {
        const token = localStorage.getItem('access');
        const url = API.statistics(deviceId, period);
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (!res.ok) throw new Error(`Statistics API error: ${res.status}`);
        
        const data = await res.json();
        console.log('📊 Received data:', data); // ← Добавь это для отладки
        
        renderChart(data.data_points || [], period);
        renderStatsSummary(data.statistics || []);
    } catch (error) {
        console.error('Failed to fetch statistics:', error);
        if (els.statsGrid) {
            els.statsGrid.innerHTML = '<div class="no-stats">Failed to load statistics</div>';
        }
    }
}

/**
 * Renders Chart.js line chart with gradient fill matching site theme
 */
/**
 * Renders Chart.js line chart with multiple metrics
 */
function renderChart(dataPoints, period) {
    const canvas = document.getElementById('deviceChart');
    if (!canvas) return;
    
    // Гарантируем высоту canvas, иначе createLinearGradient может упасть с ошибкой
    if (!canvas.height) canvas.height = 280;
    
    const ctx = canvas.getContext('2d');
    
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    
    if (!dataPoints.length) {
        currentChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: { responsive: true, maintainAspectRatio: false }
        });
        return;
    }
    
    // Извлекаем уникальные типы метрик (temperature, humidity и т.д.)
    const metricTypes = [];
    const firstPoint = dataPoints[0];
    Object.keys(firstPoint).forEach(key => {
        if (key !== 'timestamp') metricTypes.push(key);
    });
    
    // Форматируем подписи для оси X
    const labels = dataPoints.map(p => formatTimestamp(p.timestamp, period));
    
    const colors = {
        temperature: { border: '#ff6384', bg: 'rgba(255, 99, 132, 0.1)', point: '#ff6384' },
        humidity: { border: '#36a2eb', bg: 'rgba(54, 162, 235, 0.1)', point: '#36a2eb' },
        power: { border: '#ffce56', bg: 'rgba(255, 206, 86, 0.1)', point: '#ffce56' },
        default: { border: '#6b7cff', bg: 'rgba(107, 124, 255, 0.1)', point: '#6b7cff' }
    };
    
    // Создаем датасеты для каждой метрики
    const datasets = metricTypes.map(metricType => {
        const color = colors[metricType] || colors.default;
        
        // Создаем градиент (безопасно, так как мы задали высоту canvas выше)
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, color.bg.replace('0.1', '0.3'));
        gradient.addColorStop(1, color.bg.replace('0.1', '0.01'));
        
        return {
            label: formatMetricName(metricType),
            data: dataPoints.map(p => p[metricType] ?? null),
            borderColor: color.border,
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: color.point,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            fill: true,
            tension: 0.3,
            // Влажность отправляем на правую ось (y1), остальное на левую (y)
            yAxisID: metricType.includes('hum') ? 'y1' : 'y', 
        };
    });
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: '#777', font: { size: 11 }, usePointStyle: true }
                },
                tooltip: {
                    backgroundColor: '#2c2c2c',
                    titleColor: '#e9ecff',
                    bodyColor: '#e9ecff',
                    borderColor: '#6b7cff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(0, 0, 0, 0.04)' },
                    ticks: {
                        color: '#777',
                        maxTicksLimit: 25, // Гарантируем, что все 24-25 точек точно отобразятся
                        font: { size: 11 }
                    }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Температура', color: '#ff6384' },
                    grid: { color: 'rgba(0, 0, 0, 0.04)' },
                    ticks: { color: '#ff6384', font: { size: 11 } }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Влажность', color: '#36a2eb' },
                    grid: { drawOnChartArea: false }, // Отключаем сетку для правой оси, чтобы не мешала
                    ticks: { color: '#36a2eb', font: { size: 11 } }
                }
            },
            animation: { duration: 500, easing: 'easeOutQuart' }
        }
    });
}

/**
 * Formats timestamp for chart X-axis based on period
 */
function formatTimestamp(isoString, period) {
    const date = new Date(isoString);
    switch (period) {
        case 'day':
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        case 'week':
            return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
        case 'month':
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        default:
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
}

/**
 * Renders average/min/max/count statistics in the summary block
 */
function renderStatsSummary(statistics) {
    if (!els.statsGrid) return;
    
    if (!statistics || !statistics.length) {
        els.statsGrid.innerHTML = '<div class="no-stats">No statistics available for this period</div>';
        return;
    }
    
    els.statsGrid.innerHTML = statistics.map(stat => `
        <div class="stat-item">
            <div class="stat-metric-name">${formatMetricName(stat.metric_type)}</div>
            <div class="stat-value-row">
                <span class="stat-label">Avg:</span>
                <span class="stat-value">${Number(stat.avg_value).toFixed(2)}</span>
            </div>
            <div class="stat-value-row">
                <span class="stat-label">Min:</span>
                <span class="stat-value min">${Number(stat.min_value).toFixed(2)}</span>
            </div>
            <div class="stat-value-row">
                <span class="stat-label">Max:</span>
                <span class="stat-value max">${Number(stat.max_value).toFixed(2)}</span>
            </div>
            <div class="stat-value-row">
                <span class="stat-label">Points:</span>
                <span class="stat-value count">${stat.count}</span>
            </div>
        </div>
    `).join('');
}

/**
 * Capitalizes metric type for display
 */
function formatMetricName(metricType) {
    if (!metricType) return 'Unknown';
    return metricType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ===== CREATE HANDLERS =====
function handleCreateClick() {
    if (state.level === 'homes') openModal('home');
    else if (state.level === 'home') openModal('room');
    else if (state.level === 'room') openModal('device');
}

async function handleCreateHome(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(els.createHomeForm).entries());
    try {
        const token = localStorage.getItem('access');
        const res = await fetch(API.homes, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.name?.[0] || err.address?.[0] || 'Failed');
        }
        closeModal('home');
        els.createHomeForm.reset();
        loadHomes();
    } catch (err) {
        document.getElementById('homeFormError').textContent = err.message;
    }
}

async function handleCreateRoom(e) {
    e.preventDefault();
    if (!state.currentHomeId) return;
    const data = Object.fromEntries(new FormData(els.createRoomForm).entries());
    try {
        const token = localStorage.getItem('access');
        const res = await fetch(API.rooms(state.currentHomeId), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.name?.[0] || 'Failed');
        }
        closeModal('room');
        els.createRoomForm.reset();
        loadRooms(state.currentHomeId);
    } catch (err) {
        document.getElementById('roomFormError').textContent = err.message;
    }
}

async function handleCreateDevice(e) {
    e.preventDefault();
    if (!state.currentRoomId) return;
    const data = Object.fromEntries(new FormData(els.createDeviceForm).entries());
    if (data.metadata) {
        try { data.metadata = JSON.parse(data.metadata); } catch { data.metadata = {}; }
    }
    try {
        const token = localStorage.getItem('access');
        const res = await fetch(API.devices(state.currentRoomId), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.name?.[0] || err.device_type?.[0] || 'Failed');
        }
        closeModal('device');
        els.createDeviceForm.reset();
        loadDevices(state.currentRoomId);
    } catch (err) {
        document.getElementById('deviceFormError').textContent = err.message;
    }
}

// ===== UI HELPERS =====
function openModal(type) {
    const modal = els[`${type}Modal`];
    if (modal) {
        modal.classList.add('active');
        const err = document.getElementById(`${type}FormError`);
        if (err) err.textContent = '';
    }
}

function closeModal(type) {
    const modal = els[`${type}Modal`];
    if (modal) {
        modal.classList.remove('active');
        const form = els[`create${type.charAt(0).toUpperCase() + type.slice(1)}Form`];
        if (form) form.reset();
    }
}

function toggleLoading(show) {
    if (els.loading) els.loading.style.display = show ? 'block' : 'none';
    [els.homesGrid, els.roomsGrid, els.devicesGrid].forEach(g => {
        if (g && g.style.display !== 'none') g.style.opacity = show ? '0.5' : '1';
    });
}

function showError(msg) {
    if (els.error) {
        els.error.style.display = msg ? 'block' : 'none';
        els.error.textContent = msg || '';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

async function handleLogout() {
    try {
        const token = localStorage.getItem('access');
        await fetch(API.logout, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (e) { console.warn(e); }
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    window.location.href = '/login/';
}

// Auto-refresh
let refreshInterval = null;

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        if (state.level === 'room' && state.currentRoomId) {
            loadDevices(state.currentRoomId);
        }
    }, 10000);
}