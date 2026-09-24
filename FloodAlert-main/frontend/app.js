let map;
let currentLocation = { lat: 20.5937, lng: 78.9629 }; 
let floodOverlay;
let floodRegions = []; 
let floodLayer = L.featureGroup(); 
let currentDetectionData = null; 

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated before initializing map
    const savedAuth = localStorage.getItem('authState');
    if (savedAuth) {
        const auth = JSON.parse(savedAuth);
        if (auth.isAuthenticated) {
            initializeMap();
            addEventListeners();
            updateLastUpdate();
            console.log('✓ Flood Detection System initialized');
        }
    }
});

function initializeMap() {
    // Initialize Leaflet Map
   map = L.map('map', {
    zoomControl: false
}).setView(
    [currentLocation.lat, currentLocation.lng],
    5
);

    // Initialize map styles and controls
    initializeMapStyle();
    
    // Add flood layer to map
    floodLayer.addTo(map);

    // Add Default Marker with custom styling
    addCustomMarker(currentLocation.lat, currentLocation.lng, 'current', 'India Center');

    console.log('✓ Map initialized with coordinates:', currentLocation);
}

function renderFloodRegions(regions, searchLat, searchLon) {
    // Clear previous regions
    floodLayer.clearLayers();
    floodRegions = regions;

    if (!regions || regions.length === 0) {
        showToast('✓ No flood regions detected in this area', 'info');
        return;
    }

    regions.forEach((region, index) => {
        const { center_lat, center_lon, distance_km, severity, color, confidence, area } = region;

        // Color map: red, yellow, green
        const colorMap = {
            'red': { color: '#dc2626', fill: '#ef4444', displayName: '🔴 High Risk' },
            'yellow': { color: '#ea580c', fill: '#f97316', displayName: '🟡 Medium Risk' },
            'green': { color: '#16a34a', fill: '#22c55e', displayName: '🟢 Low Risk' }
        };

        const colorData = colorMap[color] || colorMap['green'];

        // Create a circular marker for the flood region
        const regionMarker = L.circleMarker(
            [center_lat, center_lon],
            {
                radius: Math.sqrt(area) / 100, // Scale based on area
                fillColor: colorData.fill,
                color: colorData.color,
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.6
            }
        ).addTo(floodLayer);

        // Bind popup with detailed info
        const popupContent = `
            <div style="padding: 10px; font-family: Arial, sans-serif;">
                <strong>Flood Region #${index + 1}</strong><br>
                <strong style="color: ${colorData.color};">${colorData.displayName}</strong><br>
                <br>
                <strong>Location:</strong><br>
                ${center_lat.toFixed(4)}°N, ${center_lon.toFixed(4)}°E<br>
                <br>
                <strong>Distance from Search:</strong> ${distance_km.toFixed(1)} km<br>
                <strong>Severity:</strong> ${severity.toUpperCase()}<br>
                <strong>Confidence:</strong> ${(confidence * 100).toFixed(0)}%<br>
                <strong>Area:</strong> ${area} pixels<br>
            </div>
        `;

        regionMarker.bindPopup(popupContent, {
            className: 'flood-region-popup',
            maxWidth: 300
        });

        // Add tooltip on hover
        regionMarker.bindTooltip(
            `Region ${index + 1} - ${distance_km.toFixed(1)}km away`,
            { permanent: false, direction: 'top' }
        );

        console.log(`✓ Rendered flood region ${index + 1}: ${severity} at ${distance_km.toFixed(1)}km`);
    });

    // Fit map to show all regions plus search location
    if (regions.length > 0) {
        const group = L.featureGroup();
        group.addLayer(L.marker([searchLat, searchLon]));
        regions.forEach(r => {
            group.addLayer(L.marker([r.center_lat, r.center_lon]));
        });
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

/* ===================================
   ADD MARKER TO MAP
   =================================== */

function addMarker(lat, lng, title = 'Location') {
    // Remove previous marker if exists
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // Add custom marker
    addCustomMarker(lat, lng, 'search', title);
    map.setView([lat, lng], map.getZoom());

    console.log(`✓ Marker added at ${lat}, ${lng}`);
}

function displayRegionStats(responseData) {
    const { place, latitude, longitude, total_regions, region_summary, flood_regions } = responseData;

    // Show stats card
    document.getElementById('statsCard').classList.remove('hidden');

    // Update the heading to show city name prominently
    const heading = document.querySelector('#statsCard h3');
    if (heading) {
        heading.innerHTML = `<div style="background: linear-gradient(135deg, #0077be 0%, #0095d5 100%); color: white; padding: 12px; border-radius: 8px; margin: -16px -16px 12px -16px; text-align: center; font-size: 1.3rem; letter-spacing: 0.5px;">${place.toUpperCase()}</div>`;
    }

const riskElement = document.getElementById('overallRisk');

if (riskElement) {
    riskElement.textContent = riskText;
    riskElement.style.color = riskColor;
    riskElement.style.fontWeight = 'bold';
}

const statsTimeElement = document.getElementById('statsTime');

if (statsTimeElement) {
    statsTimeElement.textContent = new Date().toLocaleTimeString();
}

    console.log('✓ Region statistics updated:', region_summary);
}

function isPointInPolygon(point, polygon) {
    const [lat, lng] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect =
            (yi > lng) !== (yj > lng) &&
            lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }

    return inside;
}


function updateInfoCard(lat, lng, locationName = 'Selected Location') {
    document.getElementById('infoLocation').textContent = locationName;
    document.getElementById('infoLat').textContent = lat.toFixed(4);
    document.getElementById('infoLon').textContent = lng.toFixed(4);
    document.getElementById('infoRisk').textContent = 'Pending analysis';
    document.getElementById('infoRisk').style.color = '#666';
    document.getElementById('infoRisk').style.fontWeight = 'bold';
}

function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}


function addEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const detectBtn = document.getElementById('detectBtn');
    const mapElement = document.getElementById('map');

    // Search Input - Real-time validation
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value.length > 0) {
            detectBtn.textContent = '🔍 Detect Flood Risk';
        } else {
            detectBtn.textContent = 'Detect Flood Risk';
        }
    });

    // Detect Button - Process search
    detectBtn.addEventListener('click', handleDetectClick);

    // Map Click - Update location and risk stats
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        currentLocation = { lat, lng };
        addCustomMarker(lat, lng, 'search', 'Clicked Location');
        addToSearchHistory(lat.toFixed(2) + ', ' + lng.toFixed(2));
        showToast('✓ Location marked on map', 'info');
        console.log('✓ Map clicked at:', { lat, lng });
    });

    console.log('✓ Event listeners attached');
}
async function handleDetectClick() {
    showLoader();

    const searchInput = document.getElementById('searchInput').value.trim();

    if (searchInput.length === 0) {
        showToast('✕ Please enter a location name', 'error');
        hideLoader();
        return;
    }

    try {
        // Call backend API
        const response = await fetch(`${window.FLOOD_API_BASE_URL || 'http://localhost:5000'}/detect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ place: searchInput })
        });

        console.log('✓ Response status:', response.status, response.statusText);

        if (!response.ok) {
            let errorMsg = 'Detection failed';
            try {
                const error = await response.json();
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = `HTTP ${response.status}`;
            }
            showToast(`✕ ${errorMsg}`, 'error');
            hideLoader();
            return;
        }

        const data = await response.json();
        console.log('✓ Response data received:', data);

        if (!data.success && !data.place) {
            showToast('✕ Invalid response from server', 'error');
            hideLoader();
            return;
        }
        
        // Update map with search location
        currentLocation = { lat: data.latitude, lng: data.longitude };
        addCustomMarker(data.latitude, data.longitude, 'search', data.place);

        // Render flood regions
        renderFloodRegions(data.flood_regions, data.latitude, data.longitude);

        // Store detection data for report generation
        currentDetectionData = data;

        // Display statistics
        displayRegionStats(data);

        // Show results popup with coordinates and regions
        showResultsPopup(data.place, data.latitude, data.longitude, data.flood_regions, data.region_summary, data.search_radius_km, data.weather);

        // Add to search history
        addToSearchHistory(data.place);

        showToast(`✓ Analysis Complete! Found ${data.total_regions} flood regions`, 'success');
        console.log('✓ Flood detection analysis complete');

    } catch (error) {
        console.error('✗ API Error:', error);
        console.error('Error message:', error.message);
        showToast(`✕ Connection error: ${error.message || 'Failed to reach server'}`, 'error');
    } finally {
        hideLoader();
        updateLastUpdate();
    }
}


function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdate').textContent =
        'Last Updated: ' + timeString;
}

// Log app info
console.log('%c🌊 Flood Detection System v2.0', 'font-size: 14px; color: #1976d2; font-weight: bold;');
console.log('%cFeatures: Satellite imagery analysis, water-region segmentation, spatial flood-region visualization', 'font-size: 12px; color: #666;');
console.log('%cTry searching for: Delhi, Mumbai, Bangalore, Kolkata, Chennai', 'font-size: 12px; color: #666;');
console.log('%cColor Code: 🔴 Red (0-20km) | 🟡 Yellow (20-50km) | 🟢 Green (50-100km)', 'font-size: 12px; color: #666;');
