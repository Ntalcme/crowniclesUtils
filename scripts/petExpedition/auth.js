const AUTH_CONFIG = {
    salt: 'crownicles_petExpedition_2024_salt_v1',
    iterations: 100000,
    passwordHash: 'd0af78b85e0d31762c784168fc445540699af62097a644d5acd55fd2d5bfd4cc',
    sessionDuration: 24 * 60 * 60 * 1000
};

const STORAGE_KEYS = {
    authenticated: 'petExpedition_authenticated',
    expiry: 'petExpedition_auth_expiry'
};

export function createSession() {
    const expiryTime = Date.now() + AUTH_CONFIG.sessionDuration;
    localStorage.setItem(STORAGE_KEYS.authenticated, 'true');
    localStorage.setItem(STORAGE_KEYS.expiry, expiryTime.toString());
}

export function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.authenticated);
    localStorage.removeItem(STORAGE_KEYS.expiry);
}

export function isAuthenticated() {
    const auth = localStorage.getItem(STORAGE_KEYS.authenticated);
    const expiry = localStorage.getItem(STORAGE_KEYS.expiry);
    if (auth === 'true' && expiry && Date.now() < parseInt(expiry, 10)) {
        return true;
    }
    clearSession();
    return false;
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: encoder.encode(AUTH_CONFIG.salt), iterations: AUTH_CONFIG.iterations, hash: 'SHA-256' },
        keyMaterial,
        256
    );
    return Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password) {
    return (await hashPassword(password)) === AUTH_CONFIG.passwordHash;
}
