const AUTH_CONFIG = {
    // Salt unique pour cette application (peut être public)
    salt: 'crownicles_petExpedition_2024_salt_v1',
    iterations: 100000,
    passwordHash: 'd0af78b85e0d31762c784168fc445540699af62097a644d5acd55fd2d5bfd4cc',
    // Durée de session en millisecondes (24h)
    sessionDuration: 24 * 60 * 60 * 1000
};

const STORAGE_KEYS = {
    authenticated: 'petExpedition_authenticated',
    expiry: 'petExpedition_auth_expiry'
};

let onAuthSuccessCallback = null;

async function deriveKey(password, salt, iterations) {
    const encoder = new TextEncoder();
    
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: iterations,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );
    
    return Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function hashPassword(password) {
    return deriveKey(password, AUTH_CONFIG.salt, AUTH_CONFIG.iterations);
}

async function verifyPassword(password) {
    const hash = await hashPassword(password);
    return hash === AUTH_CONFIG.passwordHash;
}

function isAuthenticated() {
    const authenticated = localStorage.getItem(STORAGE_KEYS.authenticated);
    const expiry = localStorage.getItem(STORAGE_KEYS.expiry);
    
    if (authenticated === 'true' && expiry) {
        if (Date.now() < parseInt(expiry, 10)) {
            return true;
        }
        // Session expirée
        clearSession();
    }
    return false;
}

function createSession() {
    const expiryTime = Date.now() + AUTH_CONFIG.sessionDuration;
    localStorage.setItem(STORAGE_KEYS.authenticated, 'true');
    localStorage.setItem(STORAGE_KEYS.expiry, expiryTime.toString());
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.authenticated);
    localStorage.removeItem(STORAGE_KEYS.expiry);
}

async function showLoginScreen() {
    try {
        const response = await fetch('views/auth.html');
        if (!response.ok) throw new Error('Impossible de charger le formulaire');
        
        const html = await response.text();
        document.body.insertAdjacentHTML('afterbegin', html);
        
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = 'none';
        }
        
        initLoginForm();
    } catch (error) {
        console.error('Erreur de chargement du formulaire:', error);
        location.reload();
    }
}

function initLoginForm() {
    const form = document.getElementById('auth-form');
    const passwordInput = document.getElementById('auth-password');
    const errorMessage = document.getElementById('auth-error');
    const submitButton = form.querySelector('button[type="submit"]');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitButton.disabled = true;
        submitButton.textContent = '⏳ Vérification...';
        errorMessage.style.display = 'none';
        
        try {
            const isValid = await verifyPassword(passwordInput.value);
            
            if (isValid) {
                createSession();
                hideLoginScreen();
                if (onAuthSuccessCallback) {
                    onAuthSuccessCallback();
                }
            } else {
                errorMessage.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Accéder';
        }
    });
    
    passwordInput.focus();
}

function hideLoginScreen() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    const container = document.querySelector('.container');
    if (container) {
        container.style.display = '';
    }
}

function initAuth(onSuccess) {
    onAuthSuccessCallback = onSuccess;
    
    if (isAuthenticated()) {
        return true;
    }
    
    showLoginScreen();
    return false;
}

function logout() {
    clearSession();
    location.reload();
}

export { initAuth, isAuthenticated, logout, hashPassword };
