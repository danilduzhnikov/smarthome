/**
 * SmartHome Frontend - Navigation & CRUD
 */

// ===== STATE =====
const state = {
    level: 'homes',
    currentHomeId: null,
    currentHomeName: null,
    currentRoomId: null,
    currentRoomName: null,
};

// ===== API =====
const API = {
    homes: '/home/api/homes/',
    rooms: (homeId) => `/home/api/homes/${homeId}/rooms/`,
    devices: (roomId) => `/devices/api/rooms/${roomId}/devices/`,
    logout: '/accounts/api/logout/',
};

// ===== DOM CACHE =====
let els = {};

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
    };
}

// ===== EVENT LISTENERS =====
function attachEvents() {
    console.log('🔧 Attaching events...');
    
    // Burger menu
    if (els.burger && els.sidebar) {
        els.burger.addEventListener('click', () => {
            console.log('🍔 Burger clicked');
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
    if (els.createHomeForm) {
        els.createHomeForm.addEventListener('submit', handleCreateHome);
    }
    if (els.createRoomForm) {
        els.createRoomForm.addEventListener('submit', handleCreateRoom);
    }
    if (els.createDeviceForm) {
        els.createDeviceForm.addEventListener('submit', handleCreateDevice);
    }
    
    // Logout
    if (els.sidebarLogout) {
        els.sidebarLogout.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
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
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// ===== NAVIGATION =====
function navigateTo(level, id = null, name = null) {
    console.log(`🧭 Navigate to: ${level}`, { id, name });
    
    state.level = level;
    
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
    
    // Update breadcrumbs
    updateBreadcrumbs();
    
    // Load data
    if (level === 'homes') loadHomes();
    else if (level === 'home' && id) loadRooms(id);
    else if (level === 'room' && id) loadDevices(id);
    
    // Auto-refresh control
    if (level === 'room') {
        startAutoRefresh();
    } else if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

function updateBreadcrumbs() {
    if (!els.breadcrumbs) return;
    
    els.breadcrumbs.style.display = 'flex';
    
    if (els.crumbHome) {
        els.crumbHome.style.display = state.currentHomeId ? 'inline' : 'none';
    }
    if (els.crumbSep1) {
        els.crumbSep1.style.display = state.currentHomeId ? 'inline' : 'none';
    }
    if (els.crumbRoom) {
        els.crumbRoom.style.display = state.currentRoomId ? 'inline' : 'none';
    }
    if (els.crumbSep2) {
        els.crumbSep2.style.display = state.currentRoomId ? 'inline' : 'none';
    }
    
    if (state.currentHomeId && els.crumbHome) {
        els.crumbHome.textContent = escapeHtml(state.currentHomeName || `Home #${state.currentHomeId}`);
    }
    if (state.currentRoomId && els.crumbRoom) {
        els.crumbRoom.textContent = escapeHtml(state.currentRoomName || `Room #${state.currentRoomId}`);
    }
    
    // Title
    const titles = { 'homes': 'My Homes', 'home': 'Rooms', 'room': 'Devices' };
    if (els.contentTitle) {
        els.contentTitle.textContent = titles[state.level];
    }
}

// ===== API CALLS =====
async function loadHomes() {
    toggleLoading(true);
    showError(null);
    
    try {
        const token = localStorage.getItem('access');
        const res = await fetch(API.homes, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load homes');
        const homes = await res.json();
        renderHomes(homes);
    } catch (e) {
        console.error('Load homes error:', e);
        showError(e.message);
    } finally {
        toggleLoading(false);
    }
}

async function loadRooms(homeId) {
    toggleLoading(true);
    showError(null);
    
    try {
        const token = localStorage.getItem('access');
        const res = await fetch(API.rooms(homeId), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load rooms');
        const rooms = await res.json();
        renderRooms(rooms);
    } catch (e) {
        console.error('Load rooms error:', e);
        showError(e.message);
    } finally {
        toggleLoading(false);
    }
}

async function loadDevices(roomId) {
    toggleLoading(true);
    showError(null);
    
    try {
        const token = localStorage.getItem('access');
        const res = await fetch(API.devices(roomId), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load devices');
        const devices = await res.json();
        renderDevices(devices);
    } catch (e) {
        console.error('Load devices error:', e);
        showError(e.message);
    } finally {
        toggleLoading(false);
    }
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
        card.addEventListener('click', () => {
            navigateTo('home', card.dataset.homeId, card.dataset.homeName);
        });
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
        card.addEventListener('click', () => {
            navigateTo('room', card.dataset.roomId, card.dataset.roomName);
        });
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
        if (readings.temp) {
            readingsList.push(`temp: ${parseFloat(readings.temp.value).toFixed(1)}°C`);
        }
        if (readings.hum) {
            readingsList.push(`hum: ${parseFloat(readings.hum.value).toFixed(1)}%`);
        }
        
        const isOnline = device.is_online === true;
        
        // Формируем lastSeenText для отображения в блоке readings
        let lastSeenText = '';
        if (!isOnline && device.last_seen) {
            const lastSeen = new Date(device.last_seen);
            const diff = Math.floor((Date.now() - lastSeen.getTime()) / 1000);
            
            if (diff < 60) {
                lastSeenText = `${diff}s ago`;
            } else if (diff < 3600) {
                lastSeenText = `${Math.floor(diff / 60)}m ago`;
            } else {
                lastSeenText = `${Math.floor(diff / 3600)}h ago`;
            }
        }
        
        const readingsHtml = readingsList.length > 0 && isOnline
    ? readingsList.map(r => `<div style="font-size:13px;color:#2c2c2c;margin:4px 0">${r}</div>`).join('')
    : `<div style="color:#aaa;font-size:13px">
          No data${!isOnline && lastSeenText ? `<br><small>• Last seen: ${lastSeenText}</small>` : ''}
       </div>`;
        const statusText = isOnline ? 'Online' : 'Offline';
        const statusClass = isOnline ? '' : 'inactive';
        
        // В статусе оставляем только базовую информацию, чтобы не дублировать lastSeen
        const statusHtml = `<div class="device-status">
            <span class="status-dot ${statusClass}"></span>
            <span>${statusText}</span>
        </div>`;
        
        const icons = { light:'💡', sensor:'🌡️', switch:'🔌', camera:'📷', other:'📦' };
        
        return `
            <div class="device-card">
                <div class="device-header">
                    <span class="device-name">${escapeHtml(device.name)}</span>
                    <span class="device-type">${icons[device.device_type] || '📦'} ${device.device_type}</span>
                </div>
                <div class="device-uuid" title="${device.id}">ID: ${device.id.slice(0,8)}...</div>
                <div style="margin:10px 0;padding:10px;background:#f8f9fa;border-radius:8px;min-height:50px;">
                    ${readingsHtml}
                </div>
                ${statusHtml}
            </div>
        `;
    }).join('');
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
    if (els.loading) {
        els.loading.style.display = show ? 'block' : 'none';
    }
    [els.homesGrid, els.roomsGrid, els.devicesGrid].forEach(g => {
        if (g && g.style.display !== 'none') {
            g.style.opacity = show ? '0.5' : '1';
        }
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