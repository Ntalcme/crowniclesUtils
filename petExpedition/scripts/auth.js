const PASSWORD_HASH = '1df62668b2f957738322c28d3b9950893a31f3b011f7c23267a6e5dc0aa3ff75';

// Clé de session pour localStorage
const AUTH_KEY = 'petExpedition_authenticated';
const AUTH_EXPIRY_KEY = 'petExpedition_auth_expiry';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

// Callback à appeler après authentification réussie
let onAuthSuccessCallback = null;

/**
 * Convertit un ArrayBuffer en chaîne hexadécimale
 */
function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Hash un mot de passe avec SHA-256
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer);
}

/**
 * Vérifie si l'utilisateur est déjà authentifié
 */
function isAuthenticated() {
    const authenticated = localStorage.getItem(AUTH_KEY);
    const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
    
    if (authenticated === 'true' && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime) {
            return true;
        }
        // Session expirée, nettoyer
        logout();
    }
    return false;
}

/**
 * Authentifie l'utilisateur
 */
function setAuthenticated() {
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(AUTH_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString());
}

/**
 * Déconnecte l'utilisateur
 */
function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
}

/**
 * Vérifie le mot de passe
 */
async function verifyPassword(password) {
    const hash = await hashPassword(password);
    return hash === PASSWORD_HASH;
}

/**
 * Affiche l'écran de login
 */
function showLoginScreen() {
    const loginHTML = `
        <div id="auth-overlay" class="auth-overlay">
            <div class="auth-container">
                <div class="auth-icon">🔒</div>
                <h2>Accès Protégé</h2>
                <p>Cette section nécessite un mot de passe pour y accéder.</p>
                <form id="auth-form" class="auth-form">
                    <div class="auth-input-group">
                        <input 
                            type="password" 
                            id="auth-password" 
                            placeholder="Entrez le mot de passe"
                            autocomplete="current-password"
                            required
                        >
                    </div>
                    <button type="submit" class="auth-button">
                        Accéder
                    </button>
                    <p id="auth-error" class="auth-error" style="display: none;">
                        Mot de passe incorrect
                    </p>
                </form>
                <a href="../" class="auth-back-link">← Retour à l'accueil</a>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', loginHTML);
    
    // Cacher le contenu principal
    const container = document.querySelector('.container');
    if (container) {
        container.style.display = 'none';
    }
    
    // Gérer la soumission du formulaire
    const form = document.getElementById('auth-form');
    const passwordInput = document.getElementById('auth-password');
    const errorMessage = document.getElementById('auth-error');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';
        
        const password = passwordInput.value;
        const isValid = await verifyPassword(password);
        
        if (isValid) {
            setAuthenticated();
            hideLoginScreen();
            // Appeler le callback si défini
            if (onAuthSuccessCallback) {
                onAuthSuccessCallback();
            }
        } else {
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    });
    
    // Focus sur le champ mot de passe
    passwordInput.focus();
}

/**
 * Cache l'écran de login et affiche le contenu
 */
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

/**
 * Initialise le système d'authentification
 * @param {Function} onSuccess - Callback à appeler après authentification réussie
 */
function initAuth(onSuccess) {
    onAuthSuccessCallback = onSuccess;
    if (!isAuthenticated()) {
        showLoginScreen();
        return false;
    }
    return true;
}

// Exporter les fonctions pour utilisation dans d'autres modules
export { initAuth, isAuthenticated, logout, hashPassword };
