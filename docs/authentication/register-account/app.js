document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // Shared Navigation & Mobile Drawer
    // --------------------------------------------------------------------------
    const navTabs = document.getElementById('navTabs');
    const mobileToggle = document.getElementById('mobileToggle');
    const signIn = document.querySelector('.sign-in-link');
    const supportBtn = document.querySelector('.support-btn');
    const registerForm = document.getElementById('registerForm');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');


    const API_BASE = "https://aq-gld-g2-1.onrender.com";

    if (mobileToggle && navTabs) {
        mobileToggle.addEventListener('click', () => {
            navTabs.classList.toggle('mobile-open');
            signIn.classList.toggle('mobile-open');
            supportBtn.classList.toggle('mobile-open');
        });
    }

// --------------------------------------------------------------------------
// Account Registration Form Logic (register.html)
// --------------------------------------------------------------------------
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('emailAddress').value;
        const password = document.getElementById('regPassword').value;
        const deviceId = document.getElementById('deviceId').value;

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password, deviceId })
            });

            const data = await res.json();

            if (!res.ok) {
                // ❌ Backend returned an error (e.g. user already exists)
                toastMsg.textContent = data.error || 'Registration failed';
                toast.classList.add('show');
            } else {
                // ✅ Registration successful
                toastMsg.textContent = `Account created for ${fullName}! Device ${deviceId} linked. Redirecting...`;
                toast.classList.add('show');

                setTimeout(() => {
                    window.location.href = '../../dashboard/index.html';
                }, 2000);
            }
        } catch (err) {
            toastMsg.textContent = 'Error connecting to server';
            toast.classList.add('show');

            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }
    });
});
