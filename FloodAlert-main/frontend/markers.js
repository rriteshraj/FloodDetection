/* ===================================
   Map Styles & Custom Markers Manager
   =================================== */

// Map layer definitions
const mapLayers = {
    street: {
        name: 'Street Map',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        icon: '🗺️'
    },
    satellite: {
        name: 'Satellite View',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri',
        icon: '🛰️'
    },
    dark: {
        name: 'Dark Map',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '© CartoDB',
        icon: '🌙'
    }
};

let currentMapStyle = 'street';
let currentLayer = null;

/* ===================================
   MAP STYLE SWITCHING
   =================================== */

function initializeMapStyle() {
    // Add initial layer
    currentLayer = L.tileLayer(mapLayers[currentMapStyle].url, {
        attribution: mapLayers[currentMapStyle].attribution,
        maxZoom: 19,
        minZoom: 2
    }).addTo(map);

    // Setup style buttons
    document.getElementById('mapStyleBtn').addEventListener('click', () => switchMapStyle('street'));
    document.getElementById('satelliteBtn').addEventListener('click', () => switchMapStyle('satellite'));
    document.getElementById('darkMapBtn').addEventListener('click', () => switchMapStyle('dark'));

    // Setup zoom buttons
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        map.zoomIn();
    });
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        map.zoomOut();
    });

    // Set initial button as active
    document.querySelector(`.control-btn[data-style=\"${currentMapStyle}\"]`).classList.add('active');

    console.log('✓ Map style switcher initialized');
}

function switchMapStyle(style) {
    if (currentMapStyle === style) return;

    // Remove current layer
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }

    // Add new layer
    currentLayer = L.tileLayer(mapLayers[style].url, {
        attribution: mapLayers[style].attribution,
        maxZoom: 19,
        minZoom: 2
    }).addTo(map);

    currentMapStyle = style;

    // Update button styles
    document.querySelectorAll('.control-btn[data-style]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.control-btn[data-style="${style}"]`).classList.add('active');

    showToast(`🗺️ Switched to ${mapLayers[style].name}`, 'info');
    console.log('✓ Map style changed to:', style);
}

/* ===================================
   CUSTOM MARKERS
   =================================== */

// Custom marker icons
const markerIcons = {
    current: createCustomIcon('#1976d2', 'ℹ️'), // Blue - Current location
    search: createCustomIcon('#9c27b0', '📍'), // Purple - Searched location
    flood: createCustomIcon('#d32f2f', '⚠️'),  // Red - Flood zone
    safe: createCustomIcon('#4caf50', '✓')     // Green - Safe zone
};

function createCustomIcon(color, emoji) {
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div class="marker-pin" style="background-color: ${color};">
                <span class="marker-emoji">${emoji}</span>
            </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50]
    });
}

function addCustomMarker(lat, lng, type = 'current', label = 'Location') {
    const marker = L.marker([lat, lng], {
        icon: markerIcons[type] || markerIcons.current
    }).addTo(map);

    marker.bindPopup(`
        <div class="marker-popup">
            <strong>${label}</strong><br>
            <small>${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
        </div>
    `, {
        className: 'custom-popup',
        closeButton: false,
        offset: L.point(0, -10)
    });

    return marker;
}

/* ===================================
   INITIALIZE ON MAP LOAD
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Will be called after map is created in app.js
    console.log('✓ Markers module loaded');
});
