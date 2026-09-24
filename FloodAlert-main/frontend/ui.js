/* ===================================
   UI/UX Enhancements
   Dark Mode, Toasts, Search History, Favorites
   =================================== */

// Theme State
let uiState = {
    darkMode: localStorage.getItem('darkMode') === 'true',
    searchHistory: JSON.parse(localStorage.getItem('searchHistory')) || [],
    favorites: JSON.parse(localStorage.getItem('favorites')) || []
};

/* ===================================
   DARK MODE TOGGLE
   =================================== */

function initializeDarkMode() {
    if (uiState.darkMode) {
        enableDarkMode();
    }
    
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('darkModeMenuBtn').addEventListener('click', () => {
        toggleDarkMode();
        closeProfileDropdown();
    });
}

function toggleDarkMode() {
    uiState.darkMode = !uiState.darkMode;
    localStorage.setItem('darkMode', uiState.darkMode);
    
    if (uiState.darkMode) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
}

function enableDarkMode() {
    document.documentElement.style.setProperty('--bg-primary', '#1a1a1a');
    document.documentElement.style.setProperty('--bg-secondary', '#2d2d2d');
    document.documentElement.style.setProperty('--text-primary', '#e0e0e0');
    document.documentElement.style.setProperty('--text-secondary', '#b0b0b0');
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeBtn').textContent = '☀️';
    document.getElementById('darkModeMenuBtn').textContent = '☀️ Light Mode';
    showToast('🌙 Dark mode enabled', 'info');
}

function disableDarkMode() {
    document.documentElement.style.setProperty('--bg-primary', '#ffffff');
    document.documentElement.style.setProperty('--bg-secondary', '#f5f5f5');
    document.documentElement.style.setProperty('--text-primary', '#333333');
    document.documentElement.style.setProperty('--text-secondary', '#666666');
    document.body.classList.remove('dark-mode');
    document.getElementById('darkModeBtn').textContent = '🌙';
    document.getElementById('darkModeMenuBtn').textContent = '🌙 Dark Mode';
    showToast('☀️ Light mode enabled', 'info');
}

/* ===================================
   TOAST NOTIFICATIONS
   =================================== */

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set emoji based on type
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '•'}</span>
        <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ===================================
   RESULTS POPUP MODAL
   =================================== */

function showResultsPopup(place, latitude, longitude, floodRegions, regionSummary, searchRadius = 100, weather = null) {
    // Show stats card
    document.getElementById('statsCard').classList.remove('hidden');
    
    // Check if location is in favorites
    const isFavorite = uiState.favorites.some(fav => fav.lat === latitude && fav.lng === longitude);
    const favoriteIndicator = isFavorite ? '❤️ SAVED' : '';
    
    // Calculate overall risk percentage
    let overallRiskPercent = 0;
    if (floodRegions.length > 0) {
        const avgConfidence = floodRegions.reduce((sum, r) => sum + r.confidence, 0) / floodRegions.length;
        overallRiskPercent = Math.round(avgConfidence * 100);
    }
    
    // Get timestamp
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Build weather section HTML
    let weatherHTML = '';
    if (weather) {
        const waterLevelColor = weather.water_level_status === 'Critical' ? '#dc2626' : weather.water_level_status === 'Elevated' ? '#ea580c' : '#16a34a';
        weatherHTML = `
        <!-- Water Level & Temperature -->
        <div style="background: #cffafe; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 5px solid #0284c7; font-size: 0.9rem;">
            <div style="font-weight: 700; margin-bottom: 8px; color: #0284c7; text-transform: uppercase;">💧 Water Level & Temperature</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
                <div style="background: white; padding: 8px; border-radius: 6px; text-align: center; border: 1px solid #cffafe;">
                    <div style="color: #666; font-size: 0.75rem; font-weight: 600;">WATER LEVEL</div>
                    <div style="font-size: 1.4rem; font-weight: 900; color: ${waterLevelColor}; margin: 4px 0;">${weather.water_level_m}m</div>
                    <div style="font-size: 0.7rem; color: #666; font-weight: 600;">${weather.water_level_status}</div>
                </div>
                <div style="background: white; padding: 8px; border-radius: 6px; text-align: center; border: 1px solid #cffafe;">
                    <div style="color: #666; font-size: 0.75rem; font-weight: 600;">MIN TEMP</div>
                    <div style="font-size: 1.4rem; font-weight: 900; color: #3b82f6; margin: 4px 0;">${weather.min_temperature_c}°C</div>
                </div>
                <div style="background: white; padding: 8px; border-radius: 6px; text-align: center; border: 1px solid #cffafe;">
                    <div style="color: #666; font-size: 0.75rem; font-weight: 600;">MAX TEMP</div>
                    <div style="font-size: 1.4rem; font-weight: 900; color: #ef4444; margin: 4px 0;">${weather.max_temperature_c}°C</div>
                </div>
            </div>
        </div>
        `;
    }
    
    // Build flood regions list
    let regionsHTML = '<div class="regions-list" style="max-height: 250px; overflow-y: auto; margin-top: 12px;">';
    if (floodRegions && floodRegions.length > 0) {
        floodRegions.forEach((region, index) => {
            const severityColor = {
                'high': '#dc2626',
                'medium': '#ea580c',
                'low': '#16a34a'
            }[region.severity] || '#666';
            
            regionsHTML += `
                <div style="background: #f5f5f5; padding: 8px; margin-bottom: 6px; border-radius: 6px; border-left: 4px solid ${severityColor}; font-size: 0.85rem;">
                    <div><strong>Region ${index + 1}</strong> • ${region.severity.toUpperCase()}</div>
                    <div style="margin-top: 2px; color: #666;">📍 ${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}</div>
                    <div style="margin-top: 2px;">Confidence: <span style="color: ${severityColor}; font-weight: bold;">${(region.confidence * 100).toFixed(0)}%</span> | Distance: ${region.distance_km.toFixed(1)}km</div>
                </div>
            `;
        });
    } else {
        regionsHTML += '<p style="padding: 10px; color: #16a34a; text-align: center; font-weight: 500;">✓ No flood regions detected - Area is safe!</p>';
    }
    regionsHTML += '</div>';
    
    // Update the stats card content
    const statsCard = document.getElementById('statsCard');
    statsCard.innerHTML = `
        <h3>📊 Risk Analysis</h3>
        
        <!-- City Name (Prominent) with Favorite Indicator -->
        <div style="background: linear-gradient(135deg, #0077be 0%, #0095d5 100%); color: white; padding: 12px; border-radius: 8px; margin-bottom: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0, 119, 190, 0.3);">
            <div style="font-size: 1.4rem; font-weight: 700; letter-spacing: 0.5px;">${place.toUpperCase()}</div>
            ${favoriteIndicator ? `<div style="font-size: 0.85rem; margin-top: 6px; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; display: inline-block; font-weight: 600;">${favoriteIndicator}</div>` : ''}
            <div style="font-size: 0.8rem; margin-top: 4px; opacity: 0.9;">
                ${latitude.toFixed(4)}° N | ${longitude.toFixed(4)}° E
            </div>
        </div>
        
        <!-- Risk Metrics -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; font-size: 0.85rem;">
            <div style="background: #fce4ec; padding: 8px; border-radius: 6px; text-align: center;">
                <div style="color: #666;">Overall Risk</div>
                <div style="font-size: 1.3rem; font-weight: bold; color: #d32f2f;">${overallRiskPercent}%</div>
            </div>
            <div style="background: #e3f2fd; padding: 8px; border-radius: 6px; text-align: center;">
                <div style="color: #666;">Regions Found</div>
                <div style="font-size: 1.3rem; font-weight: bold; color: #1976d2;">${floodRegions.length}</div>
            </div>
        </div>
        
        ${weatherHTML}
        
        <!-- Summary Stats -->
        <div style="background: #fff3e0; padding: 8px; border-radius: 8px; margin-bottom: 10px; font-size: 0.85rem;">
            <div style="font-weight: 600; margin-bottom: 5px;">Risk Distribution:</div>
            <div style="display: flex; justify-content: space-around;">
                <span>🔴 High: <strong>${regionSummary.high_risk}</strong></span>
                <span>🟡 Med: <strong>${regionSummary.medium_risk}</strong></span>
                <span>🟢 Low: <strong>${regionSummary.low_risk}</strong></span>
            </div>
        </div>
        
        <!-- Additional Info -->
        <div style="background: #f3f3f3; padding: 8px; border-radius: 6px; margin-bottom: 10px; font-size: 0.8rem; color: #666;">
            <div style="margin-bottom: 3px;">🔍 Search Radius: ${searchRadius}km</div>
            <div>⏰ Analysis: ${timestamp}</div>
        </div>
        
        <!-- Detected Regions -->
        <div style="margin-bottom: 10px;">
            <h4 style="margin: 8px 0 6px 0; font-size: 0.9rem;">Detected Regions:</h4>
            ${regionsHTML}
        </div>
        
        <button id="addToFavBtn" class="btn-secondary" style="width: 100%; margin-top: 8px; font-size: 0.9rem; padding: 8px;">❤️ Add to Favorites</button>
    `;
    
    // Add event listener to the newly created button
    const addToFavBtn = document.getElementById('addToFavBtn');
    if (addToFavBtn) {
        addToFavBtn.addEventListener('click', () => {
            if (window.currentLocationForFav) {
                addToFavorites(window.currentLocationForFav);
            }
        });
    }
}

/* ===================================
   SEARCH HISTORY
   =================================== */

function addToSearchHistory(searchTerm) {
    // Avoid duplicates - move to front if exists
    uiState.searchHistory = uiState.searchHistory.filter(item => item !== searchTerm);
    uiState.searchHistory.unshift(searchTerm);
    
    // Keep only last 10
    if (uiState.searchHistory.length > 10) {
        uiState.searchHistory.pop();
    }
    
    localStorage.setItem('searchHistory', JSON.stringify(uiState.searchHistory));
    updateSearchHistoryUI();
}

function updateSearchHistoryUI() {
    const historyList = document.getElementById('searchHistoryList');
    const recentSearchesDiv = document.getElementById('recentSearches');
    
    if (uiState.searchHistory.length === 0) {
        recentSearchesDiv.classList.add('hidden');
        return;
    }
    
    recentSearchesDiv.classList.remove('hidden');
    historyList.innerHTML = '';
    
    uiState.searchHistory.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'history-item';
        btn.textContent = '🕐 ' + item;
        btn.addEventListener('click', () => {
            document.getElementById('searchInput').value = item;
            document.getElementById('detectBtn').click();
        });
        historyList.appendChild(btn);
    });
}

/* ===================================
   FAVORITES/BOOKMARKS
   =================================== */

function addToFavorites(location) {
    // location = { name, lat, lng, risk }
    const exists = uiState.favorites.some(fav => 
        fav.lat === location.lat && fav.lng === location.lng
    );
    
    if (exists) {
        showToast('❤️ Already in favorites!', 'warning');
        return;
    }
    
    uiState.favorites.push({
        ...location,
        savedAt: new Date().toLocaleString()
    });
    
    localStorage.setItem('favorites', JSON.stringify(uiState.favorites));
    updateFavoritesUI();
    showToast('❤️ Added to favorites!', 'success');
}

function removeFromFavorites(lat, lng) {
    uiState.favorites = uiState.favorites.filter(fav => 
        !(fav.lat === lat && fav.lng === lng)
    );
    localStorage.setItem('favorites', JSON.stringify(uiState.favorites));
    updateFavoritesUI();
    showToast('💔 Removed from favorites', 'info');
}

function updateFavoritesUI() {
    const favoritesList = document.getElementById('favoritesList');
    const favoritesDropdownList = document.getElementById('favoritesDropdownList');
    
    const emptyMsg = '<p class="empty-state">No saved locations yet</p>';
    
    if (uiState.favorites.length === 0) {
        if (favoritesList) favoritesList.innerHTML = emptyMsg;
        if (favoritesDropdownList) favoritesDropdownList.innerHTML = emptyMsg;
        return;
    }
    
    if (favoritesList) favoritesList.innerHTML = '';
    if (favoritesDropdownList) favoritesDropdownList.innerHTML = '';
    
    uiState.favorites.forEach(fav => {
        // Update sidebar favorites list
        const favItem = document.createElement('div');
        favItem.className = 'favorite-item';
        
        const riskColor = getRiskColor(fav.risk);
        
        favItem.innerHTML = `
            <div class="fav-info">
                <strong>${fav.name}</strong><br>
                <small>${fav.lat.toFixed(2)}, ${fav.lng.toFixed(2)}</small>
            </div>
            <div class="fav-risk" style="background-color: ${riskColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                ${fav.risk}
            </div>
            <button class="fav-btn-remove" data-lat="${fav.lat}" data-lng="${fav.lng}">✕</button>
        `;
        
        favItem.querySelector('.fav-btn-remove').addEventListener('click', (e) => {
            removeFromFavorites(parseFloat(e.target.dataset.lat), parseFloat(e.target.dataset.lng));
        });
        
        // Click to navigate
        favItem.querySelector('.fav-info').addEventListener('click', () => {
            document.getElementById('searchInput').value = fav.name;
            document.getElementById('detectBtn').click();
        });
        
        if (favoritesList) favoritesList.appendChild(favItem);
        
        // Also update dropdown favorites list
        if (favoritesDropdownList) {
            const favDropdownItem = document.createElement('div');
            favDropdownItem.className = 'favorites-item';
            
            favDropdownItem.innerHTML = `
                <div style="flex: 1; cursor: pointer;" class="fav-search">
                    <div style="font-weight: 500; color: var(--text-primary);">${fav.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${fav.lat.toFixed(4)}, ${fav.lng.toFixed(4)}</div>
                </div>
                <button class="fav-dropdown-remove" data-lat="${fav.lat}" data-lng="${fav.lng}" style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 1.2rem; padding: 4px;">✕</button>
            `;
            
            favDropdownItem.querySelector('.fav-search').addEventListener('click', () => {
                document.getElementById('searchInput').value = fav.name;
                document.getElementById('detectBtn').click();
                document.getElementById('favoritesDropdown').classList.add('hidden');
            });
            
            favDropdownItem.querySelector('.fav-dropdown-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromFavorites(parseFloat(e.target.dataset.lat), parseFloat(e.target.dataset.lng));
            });
            
            favoritesDropdownList.appendChild(favDropdownItem);
        }
    });
}

/* ===================================
   RISK STATISTICS DASHBOARD
   =================================== */

function updateRiskStats(location, riskData) {
    const statsCard = document.getElementById('statsCard');
    
    // Calculate risk percentage (demo)
    const riskPercent = {
        'HIGH': 85,
        'MEDIUM': 55,
        'LOW': 25,
        'SAFE': 10
    }[riskData.risk] || 0;
    
    // Calculate demo flood height based on risk
    const floodHeight = {
        'HIGH': (5 + Math.random() * 3).toFixed(1),
        'MEDIUM': (2 + Math.random() * 2).toFixed(1),
        'LOW': (0 + Math.random() * 1).toFixed(1),
        'SAFE': 0
    }[riskData.risk] || 0;
    
    // Update stats
    document.getElementById('overallRisk').textContent = riskPercent + '%';
    document.getElementById('overallRisk').style.color = riskData.color;
    document.getElementById('floodHeight').textContent = floodHeight + ' m';
    document.getElementById('statsTime').textContent = new Date().toLocaleTimeString();
    
    // Store current location for favorites button
    window.currentLocationForFav = {
        name: location,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        risk: riskData.risk
    };
    
    statsCard.classList.remove('hidden');
}

function setupFavoritesButton() {
    document.getElementById('addToFavBtn').addEventListener('click', () => {
        if (window.currentLocationForFav) {
            addToFavorites(window.currentLocationForFav);
        }
    });
}

/* ===================================
   UTILITY FUNCTIONS
   =================================== */

function getRiskColor(risk) {
    const colors = {
        'HIGH': '#d32f2f',
        'MEDIUM': '#ff9800',
        'LOW': '#4caf50',
        'SAFE': '#4caf50'
    };
    return colors[risk] || '#666';
}

/* ===================================
   MODAL MANAGEMENT
   =================================== */

function initializeModals() {
    // Modal menu items
    const profileLink = document.getElementById('profileLink');
    const settingsLink = document.getElementById('settingsLink');
    const helpLink = document.getElementById('helpLink');
    const aboutLink = document.getElementById('aboutLink');
    
    // Modals
    const profileModal = document.getElementById('profileModal');
    const settingsModal = document.getElementById('settingsModal');
    const helpModal = document.getElementById('helpModal');
    const aboutModal = document.getElementById('aboutModal');
    
    // Close buttons
    const closeButtons = document.querySelectorAll('.modal-close');
    
    // Open modals
    profileLink.addEventListener('click', () => {
        openModal(profileModal);
        updateProfileModal();
    });
    
    settingsLink.addEventListener('click', () => {
        openModal(settingsModal);
    });
    
    helpLink.addEventListener('click', () => {
        openModal(helpModal);
    });
    
    aboutLink.addEventListener('click', () => {
        openModal(aboutModal);
    });
    
    // Close modals
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal);
        });
    });
    
    // Close on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });
}

function openModal(modal) {
    if (modal) {
        modal.classList.remove('hidden');
        // Close profile dropdown when opening modal
        closeProfileDropdown();
    }
}

function closeModal(modal) {
    if (modal) modal.classList.add('hidden');
}

function updateProfileModal() {
    const user = JSON.parse(localStorage.getItem('authState') || '{}');
    document.getElementById('modalProfileName').textContent = user.name || 'User';
    document.getElementById('modalProfileEmail').textContent = user.email || 'user@email.com';
    
    // Calculate member since date (demo)
    const joinDate = new Date(user.createdAt || Date.now() - 90 * 24 * 60 * 60 * 1000);
    document.getElementById('memberSince').textContent = joinDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
    });
    
    const searches = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    document.getElementById('totalSearches').textContent = searches.length;
}

/* ===================================
   EMERGENCY SOS BUTTON & DROPDOWN
   =================================== */

function initializeEmergencyButton() {
    const emergencyBtn = document.getElementById('emergencyBtn');
    const emergencyDropdown = document.getElementById('emergencyDropdown');
    const safetyBtn = document.getElementById('safetyBtn');
    const safetyDropdown = document.getElementById('safetyDropdown');
    const profileDropdown = document.getElementById('profileDropdown');
    const favoritesBtn = document.getElementById('favoritesBtn');
    const favoritesDropdown = document.getElementById('favoritesDropdown');
    
    // Toggle favorites dropdown on button click
    if (favoritesBtn && favoritesDropdown) {
        favoritesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = favoritesDropdown.classList.contains('hidden');
            
            // Close other dropdowns
            emergencyDropdown.classList.add('hidden');
            profileDropdown.classList.add('hidden');
            safetyDropdown.classList.add('hidden');
            
            // Toggle favorites dropdown
            if (isHidden) {
                favoritesDropdown.classList.remove('hidden');
            } else {
                favoritesDropdown.classList.add('hidden');
            }
        });
    }
    
    // Toggle safety dropdown on button click
    safetyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = safetyDropdown.classList.contains('hidden');
        
        // Close other dropdowns
        emergencyDropdown.classList.add('hidden');
        profileDropdown.classList.add('hidden');
        if (favoritesDropdown) favoritesDropdown.classList.add('hidden');
        
        // Toggle safety dropdown
        if (isHidden) {
            safetyDropdown.classList.remove('hidden');
        } else {
            safetyDropdown.classList.add('hidden');
        }
    });
    
    // Toggle emergency dropdown on button click
    emergencyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = emergencyDropdown.classList.contains('hidden');
        
        // Close profile dropdown
        profileDropdown.classList.add('hidden');
        safetyDropdown.classList.add('hidden');
        if (favoritesDropdown) favoritesDropdown.classList.add('hidden');
        
        // Toggle emergency dropdown
        if (isHidden) {
            emergencyDropdown.classList.remove('hidden');
        } else {
            emergencyDropdown.classList.add('hidden');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!emergencyBtn.contains(e.target) && !emergencyDropdown.contains(e.target)) {
            emergencyDropdown.classList.add('hidden');
        }
        if (!safetyBtn.contains(e.target) && !safetyDropdown.contains(e.target)) {
            safetyDropdown.classList.add('hidden');
        }
        if (favoritesBtn && !favoritesBtn.contains(e.target) && !favoritesDropdown.contains(e.target)) {
            favoritesDropdown.classList.add('hidden');
        }
    });
    
    // Close dropdown when item is clicked (for tel: links)
    document.querySelectorAll('.emergency-item').forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(() => {
                emergencyDropdown.classList.add('hidden');
            }, 500);
        });
    });
}

function closeProfileDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) profileDropdown.classList.add('hidden');
}

/* ===================================
   REPORT GENERATION
   =================================== */

function initializeReportButton() {
    const reportBtn = document.getElementById('reportBtn');
    if (!reportBtn) return;
    
    reportBtn.addEventListener('click', generateFloodReport);
}

function generateFloodReport() {
    // Check if detection data is available
    if (!currentDetectionData) {
        showToast('⚠️ No flood detection data available. Search for a location first.', 'warning');
        return;
    }
    
    const data = currentDetectionData;
    const {
        place,
        latitude,
        longitude,
        total_regions,
        region_summary,
        flood_regions,
        search_radius_km
    } = data;
    
    // Calculate overall risk percentage
    let overallRiskPercent = 0;
    let riskLevel = 'Low';
    
    if (region_summary.high_risk > 0) {
        riskLevel = 'High';
        overallRiskPercent = Math.min(100, (region_summary.high_risk / total_regions) * 100);
    } else if (region_summary.medium_risk > 0) {
        riskLevel = 'Medium';
        overallRiskPercent = Math.min(75, (region_summary.medium_risk / total_regions) * 50);
    } else if (region_summary.low_risk > 0) {
        riskLevel = 'Low';
        overallRiskPercent = (region_summary.low_risk / total_regions) * 25;
    }
    
    // Build risk distribution details
    let riskDistHTML = '';
    if (region_summary.high_risk > 0) {
        riskDistHTML += `<div style="margin: 8px 0; padding: 8px; background: rgba(220, 38, 38, 0.1); border-left: 3px solid #dc2626; border-radius: 4px;">
            <strong style="color: #dc2626;">🔴 High Risk:</strong> ${region_summary.high_risk} region(s)
        </div>`;
    }
    if (region_summary.medium_risk > 0) {
        riskDistHTML += `<div style="margin: 8px 0; padding: 8px; background: rgba(234, 88, 12, 0.1); border-left: 3px solid #ea580c; border-radius: 4px;">
            <strong style="color: #ea580c;">🟡 Medium Risk:</strong> ${region_summary.medium_risk} region(s)
        </div>`;
    }
    if (region_summary.low_risk > 0) {
        riskDistHTML += `<div style="margin: 8px 0; padding: 8px; background: rgba(22, 163, 74, 0.1); border-left: 3px solid #16a34a; border-radius: 4px;">
            <strong style="color: #16a34a;">🟢 Low Risk:</strong> ${region_summary.low_risk} region(s)
        </div>`;
    }
    if (!riskDistHTML) {
        riskDistHTML = `<div style="margin: 8px 0; padding: 8px; background: rgba(22, 163, 74, 0.1); border-left: 3px solid #16a34a; border-radius: 4px;">
            <strong style="color: #16a34a;">✓ Safe:</strong> No flood-prone regions detected
        </div>`;
    }
    
    // Get top affected regions
    let regionsHTML = '';
    if (flood_regions && flood_regions.length > 0) {
        const topRegions = flood_regions.slice(0, 5);
        regionsHTML = topRegions.map((region, idx) => `
            <div style="margin: 8px 0; padding: 10px; background: var(--bg-secondary); border-radius: 6px;">
                <strong>${idx + 1}. ${region.name || 'Unnamed Region'}</strong>
                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px;">
                    Severity: <span style="color: ${region.severity > 0.7 ? '#dc2626' : region.severity > 0.4 ? '#ea580c' : '#16a34a'}; font-weight: 600;">${(region.severity * 100).toFixed(1)}%</span>
                    | Confidence: ${(region.confidence * 100).toFixed(1)}%
                    | Distance: ${(region.distance || 0).toFixed(1)} km
                </div>
            </div>
        `).join('');
    }
    
    const timestamp = new Date().toLocaleString();
    
    // Build weather section for report
    let weatherReportHTML = '';
    if (data.weather) {
        const w = data.weather;
        const waterLevelColor = w.water_level_status === 'Critical' ? '#dc2626' : w.water_level_status === 'Elevated' ? '#ea580c' : '#16a34a';
        weatherReportHTML = `
            <div class="report-section">
                <h4>💧 Water Level & Temperature</h4>
                <div style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; font-size: 0.95rem;">
                    <div style="margin: 6px 0; padding: 8px; background: rgba(2, 132, 199, 0.1); border-radius: 6px; border-left: 3px solid #0284c7;">
                        <div style="color: #666;"><strong>Water Level:</strong> <span style="color: ${waterLevelColor}; font-weight: 600; font-size: 1.1rem;">${w.water_level_m}m</span></div>
                        <div style="margin-top: 4px; font-size: 0.9rem;">Status: <span style="font-weight: 600; color: ${waterLevelColor};">${w.water_level_status}</span></div>
                    </div>
                    <div style="margin: 8px 0; padding: 8px; background: rgba(234, 88, 12, 0.1); border-radius: 6px; border-left: 3px solid #ea580c;">
                        <div style="color: #666;"><strong>Temperature Range:</strong></div>
                        <div style="margin-top: 4px;">Min: <span style="font-weight: 600;">${w.min_temperature_c}°C</span> | Max: <span style="font-weight: 600;">${w.max_temperature_c}°C</span></div>
                        <div style="margin-top: 4px; font-size: 0.9rem;">Current: <span style="font-weight: 600;">${w.current_temperature_c}°C</span></div>
                    </div>
                    <div style="margin: 8px 0; padding: 8px; background: rgba(99, 102, 241, 0.1); border-radius: 6px; border-left: 3px solid #6366f1;">
                        <div style="color: #666;"><strong>Humidity:</strong> <span style="font-weight: 600;">${w.humidity_percent}%</span></div>
                        <div style="margin-top: 4px;"><strong>Rainfall:</strong> <span style="font-weight: 600;">${w.rainfall_mm}mm</span></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Create comprehensive report HTML
    const reportHTML = `
        <div class="report-modal-content">
            <h2>📋 Flood Detection Report</h2>
            <div class="report-header">
                <h3>${place}</h3>
                <p class="report-timestamp">Generated: ${timestamp}</p>
            </div>
            
            <div class="report-section">
                <h4>📍 Location Details</h4>
                <div style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; font-size: 0.95rem;">
                    <div style="margin: 6px 0;"><strong>Place:</strong> ${place}</div>
                    <div style="margin: 6px 0;"><strong>Coordinates:</strong> ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E</div>
                    <div style="margin: 6px 0;"><strong>Search Radius:</strong> ${(search_radius_km || 50).toFixed(1)} km</div>
                </div>
            </div>
            
            <div class="report-section">
                <h4>⚠️ Risk Assessment</h4>
                <div class="report-risk-card">
                    <div style="text-align: center; padding: 12px;">
                        <div style="font-size: 2.2rem; font-weight: 700; color: ${riskLevel === 'High' ? '#dc2626' : riskLevel === 'Medium' ? '#ea580c' : '#16a34a'};">
                            ${overallRiskPercent.toFixed(1)}%
                        </div>
                        <div style="color: var(--text-secondary); margin-top: 6px; font-weight: 600;">
                            Overall Risk Level: <span style="color: ${riskLevel === 'High' ? '#dc2626' : riskLevel === 'Medium' ? '#ea580c' : '#16a34a'};">${riskLevel}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${weatherReportHTML}
            
            <div class="report-section">
                <h4>🔍 Detection Summary</h4>
                <div style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; font-size: 0.95rem;">
                    <div style="margin: 6px 0;"><strong>Total Regions Found:</strong> ${total_regions}</div>
                    <div style="margin: 6px 0;"><strong>Analysis Status:</strong> ✓ Complete</div>
                    ${total_regions > 0 ? `<div style="margin: 6px 0;"><strong>Reliability:</strong> High confidence detection based on satellite imagery</div>` : '<div style="margin: 6px 0;"><strong>Status:</strong> No flood-prone areas detected in this region</div>'}
                </div>
            </div>
            
            <div class="report-section">
                <h4>📊 Risk Distribution</h4>
                <div>${riskDistHTML}</div>
            </div>
            
            ${regionsHTML ? `
            <div class="report-section">
                <h4>🌊 Top Affected Regions</h4>
                <div>${regionsHTML}</div>
            </div>
            ` : ''}
            
            <div class="report-section">
                <h4>💡 Recommendations</h4>
                <ul style="margin-left: 20px; line-height: 1.8;">
                    <li>Monitor weather forecasts for this region</li>
                    <li>${riskLevel === 'High' ? 'Stay alert and prepare emergency supplies' : 'Keep updated with local flood warnings'}</li>
                    <li>Maintain emergency contact numbers</li>
                    <li>Check this location periodically for updated analysis</li>
                </ul>
            </div>
            
            <div class="report-actions">
                <button class="report-export-btn" onclick="downloadReport()">
                    📥 Download Report
                </button>
                <button class="report-share-btn" onclick="shareReport()">
                    📤 Share Report
                </button>
                <button class="report-close-btn" onclick="closeReportModal()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    // Show report in modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'reportModalOverlay';
    modalOverlay.innerHTML = reportHTML;
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeReportModal();
        }
    });
    
    document.body.appendChild(modalOverlay);
    showToast('✓ Report generated successfully', 'success');
}

function closeReportModal() {
    const overlay = document.getElementById('reportModalOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => overlay.remove(), 300);
    }
}

function downloadReport() {
    if (!currentDetectionData) {
        showToast('⚠️ No report data available', 'warning');
        return;
    }
    
    const data = currentDetectionData;
    const { place, latitude, longitude, total_regions, region_summary, search_radius_km } = data;
    
    // Calculate overall risk
    let riskLevel = 'Low';
    if (region_summary.high_risk > 0) riskLevel = 'High';
    else if (region_summary.medium_risk > 0) riskLevel = 'Medium';
    
    // Create detailed text report
    const reportText = `
FLOOD DETECTION REPORT
${'='.repeat(60)}

GENERATED: ${new Date().toLocaleString()}
LOCATION: ${place}

LOCATION DETAILS:
  Latitude: ${latitude.toFixed(4)}°N
  Longitude: ${longitude.toFixed(4)}°E
  Search Radius: ${(search_radius_km || 50).toFixed(1)} km

RISK ASSESSMENT:
  Overall Risk Level: ${riskLevel}
  High Risk Regions: ${region_summary.high_risk}
  Medium Risk Regions: ${region_summary.medium_risk}
  Low Risk Regions: ${region_summary.low_risk}
  Total Regions Found: ${total_regions}

ANALYSIS STATUS:
  ✓ Detection completed successfully
  ✓ Based on satellite imagery analysis

RECOMMENDATIONS:
  1. Monitor weather forecasts for this region
  2. ${riskLevel === 'High' ? 'ALERT: Stay alert and prepare emergency supplies' : 'Keep updated with local flood warnings'}
  3. Maintain emergency contact numbers
  4. Check this location periodically for updates

${'='.repeat(60)}
Report Generated by FloodAlert - Flood Detection System
For more information, visit the application
    `.trim();
    
    // Create download link
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText));
    element.setAttribute('download', `FloodReport_${place.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    showToast('✓ Report downloaded successfully', 'success');
}

function shareReport() {
    if (!currentDetectionData) {
        showToast('⚠️ No report data available', 'warning');
        return;
    }
    
    const data = currentDetectionData;
    const { place, total_regions, region_summary } = data;
    
    let riskLevel = 'Low';
    if (region_summary.high_risk > 0) riskLevel = 'High';
    else if (region_summary.medium_risk > 0) riskLevel = 'Medium';
    
    const shareText = `Flood Detection Report for ${place}
    
Risk Level: ${riskLevel}
Total Regions: ${total_regions}
High Risk: ${region_summary.high_risk} | Medium Risk: ${region_summary.medium_risk} | Low Risk: ${region_summary.low_risk}

Generated by FloodAlert - Stay Safe! 🌊`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Flood Detection Report',
            text: shareText
        }).then(() => {
            showToast('✓ Report shared successfully', 'success');
        }).catch(err => {
            // Fallback to clipboard
            fallbackCopyToClipboard(shareText);
        });
    } else {
        fallbackCopyToClipboard(shareText);
    }
}

function fallbackCopyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('✓ Report copied to clipboard', 'success');
    }).catch(() => {
        showToast('Could not share report', 'error');
    });
}

/* ===================================
   INITIALIZE ALL UI FEATURES
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    initializeEmergencyButton();
    initializeReportButton();
    initializeModals();
    updateSearchHistoryUI();
    updateFavoritesUI();
    setupFavoritesButton();
    
    console.log('✓ UI features initialized (Dark Mode, Emergency SOS, Report, Toasts, History, Favorites, Modals)');
});
