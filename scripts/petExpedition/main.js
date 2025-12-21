import { isAuthenticated, verifyPassword, createSession } from './auth.js';

const { createApp, ref } = Vue;

createApp({
    setup() {
        const loggedIn = ref(isAuthenticated());
        const password = ref('');
        const error = ref('');

        async function login() {
            const valid = await verifyPassword(password.value);
            if (valid) {
                createSession();
                loggedIn.value = true;
                error.value = '';
            } else {
                error.value = 'Mot de passe incorrect';
                password.value = '';

                const box = document.querySelector('.login-box');
                box.classList.remove('shake');
                void box.offsetWidth;
                box.classList.add('shake');
            }
        }

        return { loggedIn, password, error, login };
    }
}).mount('#app');
