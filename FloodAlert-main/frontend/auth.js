/* ===================================
   Authentication System
   JWT-based Auth with Email & Google Login
   =================================== */

// Auth State
let authState = {
    isAuthenticated: false,
    user: null,
    token: null,
    googleClientId: 'YOUR_GOOGLE_CLIENT_ID' // TODO: Add your Google Client ID
};

// Load auth state from localStorage
function loadAuthState() {
    const saved = localStorage.getItem('authState');
    if (saved) {
        authState = JSON.parse(saved);
        if (authState.isAuthenticated) {
            initializeApp();
        }
    } else {
        showAuthModal();
    }
}

// Save auth state to localStorage
function saveAuthState() {
    localStorage.setItem('authState', JSON.stringify(authState));
}

// Initialize app after auth
function initializeApp() {
    hideAuthModal();
    updateProfileUI();
    console.log('✓ App initialized for user:', authState.user.name);
}

/* ===================================
   AUTH MODAL FUNCTIONS
   =================================== */

function showAuthModal() {
    document.getElementById('authModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideAuthModal() {
    document.getElementById('authModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

/* ===================================
   EMAIL LOGIN
   =================================== */

function handleEmailLogin(email, password) {
    // Simulate JWT token generation
    // In production: Send credentials to backend /api/auth/login
    
    console.log('🔐 Email Login attempt:', email);
    
    // Demo: Create a JWT-like token
    const demoToken = generateDemoJWT(email);
    
    // Mock user object
    const user = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        email: email,
        authMethod: 'email',
        avatar: getInitials(email),
        joinDate: new Date().toLocaleDateString()
    };

    // Update auth state
    authState.isAuthenticated = true;
    authState.user = user;
    authState.token = demoToken;
    
    saveAuthState();
    initializeApp();
    
    console.log('✓ Email login successful');
}

/* ===================================
   GOOGLE SIGN-IN CALLBACK
   =================================== */

function handleGoogleSignIn(response) {
    console.log('🔐 Google Sign-In attempt');
    
    try {
        // Decode JWT from Google
        const payload = parseJwt(response.credential);
        
        const user = {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            authMethod: 'google',
            avatar: getInitials(payload.name),
            picture: payload.picture,
            joinDate: new Date().toLocaleDateString()
        };

        // In production: Send response.credential to backend for verification
        // Backend validates Google JWT and returns your own JWT token
        const demoToken = generateDemoJWT(payload.email);

        // Update auth state
        authState.isAuthenticated = true;
        authState.user = user;
        authState.token = demoToken;
        
        saveAuthState();
        initializeApp();
        
        console.log('✓ Google login successful');
    } catch (error) {
        console.error('✗ Google Sign-In error:', error);
        alert('Google Sign-In failed. Please try again.');
    }
}

/* ===================================
   LOGOUT
   =================================== */

function handleLogout() {
    authState.isAuthenticated = false;
    authState.user = null;
    authState.token = null;
    
    localStorage.removeItem('authState');
    console.log('✓ User logged out');
    
    // Reload to show auth modal
    location.reload();
}

/* ===================================
   UPDATE PROFILE UI
   =================================== */

function updateProfileUI() {
    if (!authState.user) return;

    const user = authState.user;

    // Update header profile button
    document.getElementById('userInitial').textContent = user.avatar;
    document.getElementById('userName').textContent = user.name;

    // Update profile dropdown
    document.getElementById('profileAvatar').textContent = user.avatar;
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;

    console.log('✓ Profile UI updated');
}

/* ===================================
   PROFILE UI INTERACTIONS
   =================================== */

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const favoritesDropdown = document.getElementById('favoritesDropdown');
    const emergencyDropdown = document.getElementById('emergencyDropdown');
    const safetyDropdown = document.getElementById('safetyDropdown');
    
    // Close other dropdowns
    if (favoritesDropdown && !dropdown.classList.contains('hidden')) {
        favoritesDropdown.classList.add('hidden');
    }
    if (!emergencyDropdown.classList.contains('hidden')) {
        emergencyDropdown.classList.add('hidden');
    }
    if (!safetyDropdown.classList.contains('hidden')) {
        safetyDropdown.classList.add('hidden');
    }
    
    dropdown.classList.toggle('hidden');
}

function closeProfileDropdown() {
    document.getElementById('profileDropdown').classList.add('hidden');
}

/* ===================================
   UTILITY FUNCTIONS
   =================================== */

// Generate JWT-like demo token
function generateDemoJWT(email) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        sub: 'user_' + Math.random().toString(36).substr(2, 9),
        email: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (86400 * 7) // 7 days
    }));
    const signature = btoa('DEMO_SECRET').substr(0, 32); // Mock signature
    
    return `${header}.${payload}.${signature}`;
}

// Decode JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Token parse error:', e);
        return null;
    }
}

// Get initials from name/email
function getInitials(str) {
    return str
        .split(' ')
        .map(word => word[0].toUpperCase())
        .slice(0, 2)
        .join('');
}

// Verify JWT token validity
function isTokenValid(token) {
    try {
        const payload = parseJwt(token);
        const now = Math.floor(Date.now() / 1000);
        return payload && payload.exp > now;
    } catch {
        return false;
    }
}

// Get Authorization header for API calls
function getAuthHeader() {
    if (authState.token && isTokenValid(authState.token)) {
        return {
            'Authorization': `Bearer ${authState.token}`,
            'Content-Type': 'application/json'
        };
    }
    return null;
}

/* ===================================
   EVENT LISTENERS
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Load authentication state immediately (shows modal or initializes app)
    loadAuthState();
    
    // Email login form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        
        if (email && password) {
            handleEmailLogin(email, password);
        }
    });

    // Close auth modal button
    document.getElementById('closeAuthBtn').addEventListener('click', () => {
        if (authState.isAuthenticated) {
            hideAuthModal();
        } else {
            alert('Please login to continue');
        }
    });

    // Profile button
    document.getElementById('profileBtn').addEventListener('click', () => {
        toggleProfileDropdown();
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Profile and Settings links (placeholder)
    document.getElementById('profileLink').addEventListener('click', () => {
        alert('Profile page - Coming soon!');
        closeProfileDropdown();
    });

    document.getElementById('settingsLink').addEventListener('click', () => {
        alert('Settings page - Coming soon!');
        closeProfileDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-btn') && !e.target.closest('.profile-dropdown')) {
            closeProfileDropdown();
        }
    });

    // Initialize Google Sign-In (if Client ID is set)
    if (typeof window.google !== 'undefined') {
        try {
            google.accounts.id.initialize({
                client_id: authState.googleClientId,
                callback: handleGoogleSignIn
            });
            google.accounts.id.renderButton(
                document.getElementById('googleSignInBtn'),
                {
                    type: 'standard',
                    size: 'large',
                    text: 'center'
                }
            );
        } catch (error) {
            console.warn('Google Sign-In not configured. Add your Client ID to continue.');
        }
    }

    // Load auth state
    loadAuthState();

    console.log('%c🔐 Authentication System v1.0', 'font-size: 14px; color: #1976d2; font-weight: bold;');
    console.log('%cDemo: Login with any email/password', 'font-size: 12px; color: #666;');
    console.log('%cTokens stored in localStorage for demo purposes only', 'font-size: 12px; color: #999;');
});
