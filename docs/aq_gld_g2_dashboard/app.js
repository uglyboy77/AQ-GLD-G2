const mobileToggle = document.getElementById('mobileToggle');
const navTabs = document.getElementById('navTabs');
const signIn = document.querySelector('.sign-in-link');
const supportBtn = document.querySelector('.support-btn');

const API_BASE = "https://aq-gld-g2-1.onrender.com";

mobileToggle.addEventListener('click', () => {
    navTabs.classList.toggle('mobile-open');
    signIn.classList.toggle('mobile-open');
    supportBtn.classList.toggle('mobile-open');
    
});
document.addEventListener('DOMContentLoaded', fetchProfile);

async function fetchProfile() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const user = await res.json();

    if (res.ok) {
      document.getElementById('displayName').value = user.fullName || '';
      document.getElementById('emailAddress').value = user.email || '';
      document.getElementById('phoneNumber').value = user.phoneNumber || '';
      document.getElementById('whatsappNumber').value = user.whatsappNumber || '';
    } else {
      console.error(user.error || 'Failed to fetch profile');
    }
  } catch (err) {
    console.error('Error connecting to server', err);
  }
}

document.getElementById('btnSaveProfile').addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  const profileData = {
    fullName: document.getElementById('displayName').value,
    email: document.getElementById('emailAddress').value,
    phoneNumber: document.getElementById('phoneNumber').value,
    whatsappNumber: document.getElementById('whatsappNumber').value
  };

  try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const updatedUser = await res.json();
    if (res.ok) {
      alert('Profile updated successfully!');
    } else {
      console.error(updatedUser.error || 'Failed to update profile');
    }
  } catch (err) {
    console.error('Error updating profile', err);
  }
});

document.addEventListener('DOMContentLoaded', () => {
    
    // -------------------------------------------------------------------------
    // 1. SCREEN SWITCHER & NAVIGATION LOGIC
    // -------------------------------------------------------------------------
    const switchButtons = document.querySelectorAll('.switch-btn[data-target]');
    const screenViews = document.querySelectorAll('.screen-view');
    const moduleNavItems = document.querySelectorAll('[data-switch-view]');
    const footerShellTitle = document.getElementById('footerShellTitle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.getElementById('mainNav');

    // Title mappings for footer breadcrumb
    const footerTitles = {
        'screen-profile': 'AQ-GLD-G2 PROFILE CONFIGURATION',
        'screen-notifications': 'AQ-GLD-G2 ALERT INFRASTRUCTURE',
        'screen-hardware': 'AQ-GLD-G2 HARDWARE SHELL',
        'screen-devices': 'AQ-GLD-G2 HARDWARE REGISTRY',
        'screen-alert-history-log': 'AQ-GLD-G2 DATA INTELLIGENCE SHELL',
        'screen-alert-history-empty': 'AQ-GLD-G2 DATA INTELLIGENCE SHELL',
        'screen-404': 'AQ-GLD-G2 SYSTEM ERROR 404',
        'screen-500': 'AQ-GLD-G2 SOCKET TELEMETRY ERROR'
    };

    function setActiveScreen(targetId) {
        // Hide all screens
        screenViews.forEach(view => view.classList.remove('active'));

        // Target screen
        const targetScreen = document.getElementById(targetId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Update Quick Switcher Buttons active state
        switchButtons.forEach(btn => {
            if (btn.getAttribute('data-target') === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update Sidebar active state
        moduleNavItems.forEach(item => {
            if (item.getAttribute('data-switch-view') === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update Footer Title
        if (footerShellTitle && footerTitles[targetId]) {
            footerShellTitle.textContent = footerTitles[targetId];
        }

        // Trigger Canvas resize if switching to chart screens
        if (targetId === 'screen-alert-history-log') {
            setTimeout(renderTelemetryChart, 50);
        } else if (targetId === 'screen-alert-history-empty') {
            setTimeout(renderEmptyTelemetryChart, 50);
        }
    }

    // Bind Quick Switcher Buttons
    switchButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target) setActiveScreen(target);
        });
    });

    // Bind Sidebar Nav Items across views
    moduleNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-switch-view');
            if (target) setActiveScreen(target);
        });
    });

    // Mobile menu toggle
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('show');
        });
    }

    // Nav Links click demo
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const navName = link.getAttribute('data-nav');
            showToast(`Navigated to ${navName.toUpperCase()}`);
        });
    });

    // -------------------------------------------------------------------------
    // 2. HARDWARE SLIDERS REAL-TIME INTERACTIVITY (v.14)
    // -------------------------------------------------------------------------
    const rangeMq2 = document.getElementById('rangeMq2');
    const valMq2 = document.getElementById('valMq2');
    const rangeMq5 = document.getElementById('rangeMq5');
    const valMq5 = document.getElementById('valMq5');
    const rangeMq7 = document.getElementById('rangeMq7');
    const valMq7 = document.getElementById('valMq7');

    function bindSlider(rangeEl, valEl) {
        if (!rangeEl || !valEl) return;
        rangeEl.addEventListener('input', () => {
            valEl.textContent = rangeEl.value;
        });
    }

    bindSlider(rangeMq2, valMq2);
    bindSlider(rangeMq5, valMq5);
    bindSlider(rangeMq7, valMq7);

    // Radio card selection for Buzzer shutoff
    const radioCards = document.querySelectorAll('.radio-card');
    radioCards.forEach(card => {
        card.addEventListener('click', () => {
            radioCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const radioInput = card.querySelector('input[type="radio"]');
            if (radioInput) radioInput.checked = true;
        });
    });

    // -------------------------------------------------------------------------
    // 3. TABLE FILTERING & SEARCH (v.10 Alert History)
    // -------------------------------------------------------------------------
    const alertSearchInput = document.getElementById('alertSearchInput');
    const filterSensor = document.getElementById('filterSensor');
    const filterSeverity = document.getElementById('filterSeverity');
    const alertsTable = document.getElementById('alertsTable');

    function filterTable() {
        if (!alertsTable) return;
        const query = (alertSearchInput ? alertSearchInput.value : '').toLowerCase();
        const sensorVal = filterSensor ? filterSensor.value : 'ALL';
        const severityVal = filterSeverity ? filterSeverity.value : 'ALL';

        const rows = alertsTable.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            const rowSensor = row.getAttribute('data-sensor') || '';
            const rowSeverity = row.getAttribute('data-severity') || '';

            const matchesQuery = rowText.includes(query);
            const matchesSensor = (sensorVal === 'ALL' || rowSensor === sensorVal);
            const matchesSeverity = (severityVal === 'ALL' || rowSeverity === severityVal);

            if (matchesQuery && matchesSensor && matchesSeverity) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
    }

    if (alertSearchInput) alertSearchInput.addEventListener('input', filterTable);
    if (filterSensor) filterSensor.addEventListener('change', filterTable);
    if (filterSeverity) filterSeverity.addEventListener('change', filterTable);

    // -------------------------------------------------------------------------
    // 4. TELEMETRY CANVAS CHARTS (HTML Canvas rendering smooth curve)
    // -------------------------------------------------------------------------
    function renderTelemetryChart() {
        const canvas = document.getElementById('telemetryChart');
        if (!canvas) return;
        
        // Handle pixel density & dynamic width
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 240;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        const gridSteps = 4;
        for (let i = 0; i <= gridSteps; i++) {
            const y = (height / gridSteps) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw Critical Threshold Line (300 PPM at y level)
        const thresholdY = height * 0.35;
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, thresholdY);
        ctx.lineTo(width, thresholdY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label for threshold
        ctx.fillStyle = '#ef4444';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('CRITICAL THRESHOLD (300 PPM)', 10, thresholdY - 6);

        // Wave Points for telemetry
        const points = [
            { x: 0, y: height * 0.8 },
            { x: width * 0.15, y: height * 0.78 },
            { x: width * 0.3, y: height * 0.7 },
            { x: width * 0.45, y: height * 0.2 },  // Peak 450 PPM
            { x: width * 0.6, y: height * 0.65 },
            { x: width * 0.75, y: height * 0.75 },
            { x: width * 0.9, y: height * 0.79 },
            { x: width, y: height * 0.8 }
        ];

        // Draw Gradient Fill under curve
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(2, 132, 199, 0.4)');
        gradient.addColorStop(1, 'rgba(2, 132, 199, 0.0)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const xc = (points[i].x + points[i - 1].x) / 2;
            const yc = (points[i].y + points[i - 1].y) / 2;
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw Telemetry Line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const xc = (points[i].x + points[i - 1].x) / 2;
            const yc = (points[i].y + points[i - 1].y) / 2;
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Peak Point Dot
        const peakPoint = points[3];
        ctx.beginPath();
        ctx.arc(peakPoint.x, peakPoint.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label Peak
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px "Chakra Petch", sans-serif';
        ctx.fillText('PEAK: 450 PPM', peakPoint.x - 35, peakPoint.y - 12);
    }

    function renderEmptyTelemetryChart() {
        const canvas = document.getElementById('telemetryChartEmpty');
        if (!canvas) return;

        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 200;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Baseline steady low line (22 PPM)
        const baselineY = height * 0.75;
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(22, 163, 74, 0.2)');
        gradient.addColorStop(1, 'rgba(22, 163, 74, 0.0)');

        ctx.beginPath();
        ctx.moveTo(0, baselineY);
        ctx.lineTo(width, baselineY);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, baselineY);
        ctx.lineTo(width, baselineY);
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#16a34a';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('NOMINAL BASELINE (22.4 PPM)', 10, baselineY - 8);
    }

    // Initial chart render
    renderTelemetryChart();

    // Resize listener for responsive charts
    window.addEventListener('resize', () => {
        renderTelemetryChart();
        renderEmptyTelemetryChart();
    });

    // -------------------------------------------------------------------------
    // 5. MODAL POPUPS & INTERACTION (v.22 Session Expired & Add Device)
    // -------------------------------------------------------------------------
    const sessionExpiredModal = document.getElementById('sessionExpiredModal');
    const triggerSessionExpired = document.getElementById('triggerSessionExpired');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnTogglePw = document.getElementById('btnTogglePw');
    const reauthPassword = document.getElementById('reauthPassword');
    const sessionReauthForm = document.getElementById('sessionReauthForm');

    function openModal(modal) {
        if (modal) modal.classList.add('active');
    }

    function closeModal(modal) {
        if (modal) modal.classList.remove('active');
    }

    if (triggerSessionExpired) {
        triggerSessionExpired.addEventListener('click', () => openModal(sessionExpiredModal));
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => closeModal(sessionExpiredModal));
    }

    // Password show/hide
    if (btnTogglePw && reauthPassword) {
        btnTogglePw.addEventListener('click', () => {
            const isPw = reauthPassword.type === 'password';
            reauthPassword.type = isPw ? 'text' : 'password';
            btnTogglePw.innerHTML = isPw ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
        });
    }

    if (sessionReauthForm) {
        sessionReauthForm.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.type === 'submit') {
                e.preventDefault();
                showToast('Re-authentication successful! Session restored.', 'success');
                closeModal(sessionExpiredModal);
            }
        });
    }

    // Add Device Modal
    const addDeviceModal = document.getElementById('addDeviceModal');
    const btnAddDeviceModalTrigger = document.getElementById('btnAddDeviceModalTrigger');
    const btnCloseAddDeviceModal = document.getElementById('btnCloseAddDeviceModal');
    const addDeviceForm = document.getElementById('addDeviceForm');

    if (btnAddDeviceModalTrigger) {
        btnAddDeviceModalTrigger.addEventListener('click', () => openModal(addDeviceModal));
    }
    if (btnCloseAddDeviceModal) {
        btnCloseAddDeviceModal.addEventListener('click', () => closeModal(addDeviceModal));
    }
    if (addDeviceForm) {
        addDeviceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nickname = document.getElementById('newDeviceNickname').value;
            showToast(`New hardware unit "${nickname}" paired successfully!`, 'success');
            closeModal(addDeviceModal);
        });
    }

    // -------------------------------------------------------------------------
    // 6. ACTION BUTTON TOAST NOTIFICATIONS
    // -------------------------------------------------------------------------
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        
        let icon = '<i class="fa-solid fa-circle-check"></i>';
        if (type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
        if (type === 'danger') icon = '<i class="fa-solid fa-circle-exclamation"></i>';

        toast.innerHTML = `${icon} <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Action buttons listeners
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', () => {
            showToast('Profile parameters saved and logged to audit trail.', 'success');
        });
    }

    const btnUpdateProtocols = document.getElementById('btnUpdateProtocols');
    if (btnUpdateProtocols) {
        btnUpdateProtocols.addEventListener('click', () => {
            showToast('Communication protocols updated & propagating to nodes.', 'info');
        });
    }

    const btnResetDefaults = document.getElementById('btnResetDefaults');
    if (btnResetDefaults) {
        btnResetDefaults.addEventListener('click', () => {
            showToast('Notification channels reset to factory defaults.', 'warning');
        });
    }

    const btnPushConfig = document.getElementById('btnPushConfig');
    if (btnPushConfig) {
        btnPushConfig.addEventListener('click', () => {
            showToast('Configuration flashed to MCU via MQTT bridge.', 'success');
        });
    }

    const btnDiscardHardware = document.getElementById('btnDiscardHardware');
    if (btnDiscardHardware) {
        btnDiscardHardware.addEventListener('click', () => {
            showToast('Hardware threshold edits discarded.', 'warning');
        });
    }

    const btnExportCsv = document.getElementById('btnExportCsv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            showToast('Exporting 1,542 alert log entries to CSV...', 'info');
        });
    }

    const btnManualReconnect = document.getElementById('btnManualReconnect');
    if (btnManualReconnect) {
        btnManualReconnect.addEventListener('click', () => {
            showToast('Attempting socket handshake with AQ-GLD-G2 node...', 'info');
        });
    }

    const btnPreviousState = document.getElementById('btnPreviousState');
    if (btnPreviousState) {
        btnPreviousState.addEventListener('click', () => {
            setActiveScreen('screen-profile');
        });
    }

});
