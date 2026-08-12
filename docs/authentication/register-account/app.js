document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // Shared Navigation & Mobile Drawer
    // --------------------------------------------------------------------------
    const navTabs = document.getElementById('navTabs');
    const mobileToggle = document.getElementById('mobileToggle');
    const signIn = document.querySelector('.sign-in-link');
    const supportBtn = document.querySelector('.support-btn');
    const registerForm = document.getElementById('registerForm');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');
    const toggleRegPassword = document.getElementById('toggleRegPassword');
    const regPasswordInput = document.getElementById('regPassword');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    const API_BASE = "https://aq-gld-g2-1.onrender.com";

    // Mobile Navigation Toggle
    if (mobileToggle && navTabs) {
        mobileToggle.addEventListener('click', () => {
            navTabs.classList.toggle('mobile-open');
            if (signIn) signIn.classList.toggle('mobile-open');
            if (supportBtn) supportBtn.classList.toggle('mobile-open');
        });
    }

    // Password Visibility Toggle
    if (toggleRegPassword && regPasswordInput) {
        toggleRegPassword.addEventListener('click', () => {
            const isPassword = regPasswordInput.type === 'password';
            regPasswordInput.type = isPassword ? 'text' : 'password';
            toggleRegPassword.textContent = isPassword ? '🙈' : '👁️';
        });
    }

    // --------------------------------------------------------------------------
    // Account Registration Form Logic (register.html)
    // --------------------------------------------------------------------------
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Form submit handler fired");

            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('emailAddress').value;
            const password = regPasswordInput ? regPasswordInput.value : '';
            const deviceId = document.getElementById('deviceId').value;

            // Disable submit button while request is processing
            if (registerSubmitBtn) registerSubmitBtn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, password, deviceId })
                });

                const data = await res.json();

                if (!res.ok) {
                    // ❌ Backend returned error (e.g. email exists / invalid input)
                    toastMsg.textContent = data.error || 'Registration failed';
                    toast.classList.add('show');

                    setTimeout(() => {
                        toast.classList.remove('show');
                    }, 4000);
                } else {
                    // ✅ Registration successful
                    toastMsg.textContent = `Account created for ${fullName}! Device ${deviceId} linked. Redirecting...`;
                    toast.classList.add('show');

                    setTimeout(() => {
                        window.location.href = '../../dashboard/index.html';
                    }, 2000);
                }
            } catch (err) {
                console.error("Registration request failed:", err);
                toastMsg.textContent = 'Error connecting to server. Check internet or server status.';
                toast.classList.add('show');

                setTimeout(() => {
                    toast.classList.remove('show');
                }, 4000);
            } finally {
                if (registerSubmitBtn) registerSubmitBtn.disabled = false;
            }
        });
    }
}); 
