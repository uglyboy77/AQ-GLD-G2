document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // Shared Navigation & Mobile Drawer
    // --------------------------------------------------------------------------
    const navTabs = document.getElementById('navTabs');
    const mobileToggle = document.getElementById('mobileToggle');
    const stateBars = document.querySelector('.state-switcher-bar');
    const signIn = document.querySelector('.sign-in-link');
    const supportBtn = document.querySelector('.support-btn');

    const API_BASE = "https://aq-gld-g2-1.onrender.com";

    if (mobileToggle && navTabs) {
        mobileToggle.addEventListener('click', () => {
            navTabs.classList.toggle('mobile-open');
            if (stateBars) stateBars.style.display = navTabs.classList.contains('mobile-open') ? 'none' : 'block';
            if (signIn) signIn.classList.toggle('mobile-open');
            if (supportBtn) supportBtn.classList.toggle('mobile-open');
        });
    }

    // Fetch user profile info on load
    async function fetchUserInfo() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const user = await res.json();

            if (res.ok && user.fullName) {
                const usernameDisplay = document.getElementById('usernameDisplay');
                if (usernameDisplay) usernameDisplay.textContent = user.fullName;
            }
        } catch (err) {
            console.error('Error connecting to authentication server:', err);
        }
    }
    fetchUserInfo();

    // --------------------------------------------------------------------------
    // Threshold Configurations (PPM)
    // --------------------------------------------------------------------------
    const THRESHOLDS = {
        mq2: 200, // Combustible Gas / Smoke threshold
        mq5: 150, // Natural Gas / LPG threshold
        mq7: 50   // Carbon Monoxide threshold
    };

    const OFFLINE_TIMEOUT_SECONDS = 30; // Mark device offline if no data for > 30s

    // --------------------------------------------------------------------------
    // Telemetry Dashboard Elements & Chart Init
    // --------------------------------------------------------------------------
    const ctx = document.getElementById('telemetryChart');
    let telemetryChart = null;

    const bannerNormal = document.getElementById('bannerNormal');
    const bannerDanger = document.getElementById('bannerDanger');
    const bannerOffline = document.getElementById('bannerOffline');
    const activeHardwareView = document.getElementById('activeHardwareView');
    const unpairedView = document.getElementById('unpairedView');

    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    const cardMq2 = document.getElementById('cardMq2');
    const badgeMq2 = document.getElementById('badgeMq2');
    const mq2Val = document.getElementById('mq2Val');

    const cardMq5 = document.getElementById('cardMq5');
    const badgeMq5 = document.getElementById('badgeMq5');
    const mq5Val = document.getElementById('mq5Val');

    const cardMq7 = document.getElementById('cardMq7');
    const badgeMq7 = document.getElementById('badgeMq7');
    const mq7Val = document.getElementById('mq7Val');

    const oledMq2 = document.getElementById('oledMq2');
    const oledMq5 = document.getElementById('oledMq5');
    const oledMq7 = document.getElementById('oledMq7');
    const oledStatus = document.getElementById('oledStatus');

    const relayBadge = document.getElementById('relayBadge');
    const audioBox = document.getElementById('audioBox');
    const audioTitle = document.getElementById('audioTitle');
    const audioSub = document.getElementById('audioSub');
    const audioIconBox = document.getElementById('audioIconBox');

    const pairDeviceBtn = document.getElementById('pairDeviceBtn');
    const scanningStatus = document.getElementById('scanningStatus');
    const lastUpdatedEl = document.getElementById('lastUpdatedSec');

    // Chart Datasets Initialization
    if (ctx && typeof Chart !== 'undefined') {
        telemetryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['--', '--', '--', '--', '--', '--', '--'],
                datasets: [
                    {
                        label: 'MQ-2 (Combustible Gas)',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.05)',
                        borderWidth: 2.5,
                        tension: 0.4,
                        pointBackgroundColor: '#2563eb',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        fill: false
                    },
                    {
                        label: 'MQ-5 (Natural Gas)',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        borderColor: '#16a34a',
                        backgroundColor: 'rgba(22, 163, 74, 0.05)',
                        borderWidth: 2.5,
                        tension: 0.4,
                        pointBackgroundColor: '#16a34a',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        fill: false
                    },
                    {
                        label: 'MQ-7 (Carbon Monoxide)',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(220, 38, 38, 0.05)',
                        borderWidth: 2.5,
                        borderDash: [5, 5],
                        tension: 0.4,
                        pointBackgroundColor: '#dc2626',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#0f172a',
                        titleFont: { family: 'JetBrains Mono', size: 12 },
                        bodyFont: { family: 'JetBrains Mono', size: 12 },
                        padding: 10,
                        cornerRadius: 6
                    }
                },
                scales: {
                    x: {
                        grid: { color: '#f1f5f9', drawBorder: false },
                        ticks: { font: { family: 'JetBrains Mono', size: 10 }, color: '#94a3b8' }
                    },
                    y: {
                        min: 0,
                        max: 140,
                        ticks: { font: { family: 'JetBrains Mono', size: 10 }, color: '#94a3b8' },
                        grid: { color: '#e2e8f0', borderDash: [4, 4], drawBorder: false }
                    }
                }
            }
        });
    }

    // --------------------------------------------------------------------------
    // Real-Time Backend Polling & Automatic State Engine
    // --------------------------------------------------------------------------
    let manualOverrideState = null; // Allows testing with buttons if desired
    let lastReceivedLogTimestamp = null;

    async function pollSensorData() {
        if (manualOverrideState) return; // Skip if user explicitly clicked demo state button

        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        try {
            // Fetch Latest Reading & History concurrently
            const [latestRes, historyRes] = await Promise.all([
                fetch(`${API_BASE}/sensor/latest`, { headers }),
                fetch(`${API_BASE}/sensor/history?limit=7`, { headers })
            ]);

            if (latestRes.status === 404) {
                // No sensor data logged yet
                applyDashboardState('unpaired');
                return;
            }

            if (!latestRes.ok) {
                throw new Error(`Server returned HTTP ${latestRes.status}`);
            }

            const latestLog = await latestRes.json();
            const historyLogs = historyRes.ok ? await historyRes.json() : [];

            // Process sensor readings
            processRealtimeTelemetry(latestLog, historyLogs);
        } catch (err) {
            console.warn('Unable to poll live sensor data (Server or Network issue):', err.message);
            applyDashboardState('offline');
        }
    }

    /**
     * Evaluates real sensor numbers and updates UI to Normal, Danger, or Offline state
     */
    function processRealtimeTelemetry(latestLog, historyLogs) {
        if (!latestLog || latestLog.mq2 === undefined) {
            applyDashboardState('offline');
            return;
        }

        const mq2 = Number(latestLog.mq2);
        const mq5 = Number(latestLog.mq5);
        const mq7 = Number(latestLog.mq7);
        const timestamp = new Date(latestLog.timestamp);
        lastReceivedLogTimestamp = timestamp;

        // Check if device is offline (stale data > 30 seconds)
        const secondsElapsed = Math.floor((Date.now() - timestamp.getTime()) / 1000);
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = `${secondsElapsed}S AGO`;
        }

        if (secondsElapsed > OFFLINE_TIMEOUT_SECONDS) {
            applyDashboardState('offline', latestLog);
            return;
        }

        // Check hazard condition
        const isMq2Danger = mq2 >= THRESHOLDS.mq2;
        const isMq5Danger = mq5 >= THRESHOLDS.mq5;
        const isMq7Danger = mq7 >= THRESHOLDS.mq7;
        const isDanger = isMq2Danger || isMq5Danger || isMq7Danger;

        if (isDanger) {
            applyDashboardState('danger', latestLog, { isMq2Danger, isMq5Danger, isMq7Danger });
        } else {
            applyDashboardState('normal', latestLog);
        }

        // Update Live Chart with real historical readings from database
        if (telemetryChart && Array.isArray(historyLogs) && historyLogs.length > 0) {
            const sortedHistory = [...historyLogs].reverse(); // Oldest to newest
            
            const labels = sortedHistory.map(item => {
                const d = new Date(item.timestamp);
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            });

            const mq2Series = sortedHistory.map(item => Number(item.mq2));
            const mq5Series = sortedHistory.map(item => Number(item.mq5));
            const mq7Series = sortedHistory.map(item => Number(item.mq7));

            // Dynamic Y-axis scale calculation
            const maxVal = Math.max(...mq2Series, ...mq5Series, ...mq7Series, 140);

            telemetryChart.data.labels = labels;
            telemetryChart.data.datasets[0].data = mq2Series;
            telemetryChart.data.datasets[1].data = mq5Series;
            telemetryChart.data.datasets[2].data = mq7Series;
            telemetryChart.options.scales.y.max = Math.ceil((maxVal + 20) / 50) * 50;
            telemetryChart.update();
        }
    }

    /**
     * Master State Renderer Function
     */
    function applyDashboardState(state, data = null, dangerFlags = {}) {
        document.body.setAttribute('data-state', state);

        // Synchronize switcher buttons active state
        document.querySelectorAll('.state-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-set-state') === state);
        });

        // 1. UNPAIRED STATE
        if (state === 'unpaired') {
            if (activeHardwareView) activeHardwareView.style.display = 'none';
            if (unpairedView) unpairedView.style.display = 'flex';
            if (bannerNormal) bannerNormal.style.display = 'none';
            if (bannerDanger) bannerDanger.style.display = 'none';
            if (bannerOffline) bannerOffline.style.display = 'none';

            if (statusIndicator) {
                statusIndicator.className = 'status-indicator offline';
                if (statusText) statusText.textContent = 'NO DEVICE';
            }
            return;
        }

        if (activeHardwareView) activeHardwareView.style.display = 'block';
        if (unpairedView) unpairedView.style.display = 'none';

        const valMq2 = data ? data.mq2 : '--';
        const valMq5 = data ? data.mq5 : '--';
        const valMq7 = data ? data.mq7 : '--';

        // 2. NORMAL / SAFE STATE
        if (state === 'normal') {
            if (bannerNormal) bannerNormal.style.display = 'flex';
            if (bannerDanger) bannerDanger.style.display = 'none';
            if (bannerOffline) bannerOffline.style.display = 'none';

            if (statusIndicator) {
                statusIndicator.className = 'status-indicator online';
                if (statusText) statusText.textContent = 'ONLINE';
            }

            // Cards Normal Reset
            if (cardMq2) cardMq2.className = 'sensor-card';
            if (badgeMq2) { badgeMq2.className = 'status-badge-card'; badgeMq2.textContent = 'SAFE'; }
            if (mq2Val) mq2Val.textContent = valMq2;

            if (cardMq5) cardMq5.className = 'sensor-card';
            if (badgeMq5) { badgeMq5.className = 'status-badge-card'; badgeMq5.textContent = 'SAFE'; }
            if (mq5Val) mq5Val.textContent = valMq5;

            if (cardMq7) cardMq7.className = 'sensor-card';
            if (badgeMq7) { badgeMq7.className = 'status-badge-card'; badgeMq7.textContent = 'SAFE'; }
            if (mq7Val) mq7Val.textContent = valMq7;

            if (oledMq2) oledMq2.textContent = valMq2;
            if (oledMq5) oledMq5.textContent = valMq5;
            if (oledMq7) oledMq7.textContent = valMq7;
            if (oledStatus) { oledStatus.className = 'oled-line safe-text'; oledStatus.textContent = 'AIR QUALITY: SAFE'; }

            if (relayBadge) { relayBadge.className = 'open-badge'; relayBadge.textContent = 'OPEN'; }

            if (audioBox) audioBox.className = 'audio-box';
            if (audioTitle) audioTitle.textContent = 'SILENT';
            if (audioSub) audioSub.textContent = 'NO ALARM CONDITIONS ACTIVE';
            if (audioIconBox) {
                audioIconBox.innerHTML = `
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.75">
                        <polygon points="11 5 L6 9 L2 9 L2 15 L6 15 L11 19 L11 5 Z"></polygon>
                        <line x1="22" y1="9" x2="16" y2="15"></line>
                        <line x1="16" y1="9" x2="22" y2="15"></line>
                    </svg>
                `;
            }
        }

        // 3. DANGER (GAS LEAK DETECTED) STATE
        else if (state === 'danger') {
            if (bannerNormal) bannerNormal.style.display = 'none';
            if (bannerDanger) bannerDanger.style.display = 'flex';
            if (bannerOffline) bannerOffline.style.display = 'none';

            if (statusIndicator) {
                statusIndicator.className = 'status-indicator danger';
                if (statusText) statusText.textContent = 'HAZARD DETECTED';
            }

            // Highlight MQ-2 Card if in danger
            if (cardMq2) cardMq2.className = dangerFlags.isMq2Danger ? 'sensor-card card-danger' : 'sensor-card';
            if (badgeMq2) {
                badgeMq2.className = dangerFlags.isMq2Danger ? 'status-badge-card badge-danger' : 'status-badge-card';
                badgeMq2.textContent = dangerFlags.isMq2Danger ? 'DANGER' : 'SAFE';
            }
            if (mq2Val) mq2Val.textContent = valMq2;

            // Highlight MQ-5 Card if in danger
            if (cardMq5) cardMq5.className = dangerFlags.isMq5Danger ? 'sensor-card card-danger' : 'sensor-card';
            if (badgeMq5) {
                badgeMq5.className = dangerFlags.isMq5Danger ? 'status-badge-card badge-danger' : 'status-badge-card';
                badgeMq5.textContent = dangerFlags.isMq5Danger ? 'DANGER' : 'SAFE';
            }
            if (mq5Val) mq5Val.textContent = valMq5;

            // Highlight MQ-7 Card if in danger
            if (cardMq7) cardMq7.className = dangerFlags.isMq7Danger ? 'sensor-card card-danger' : 'sensor-card';
            if (badgeMq7) {
                badgeMq7.className = dangerFlags.isMq7Danger ? 'status-badge-card badge-danger' : 'status-badge-card';
                badgeMq7.textContent = dangerFlags.isMq7Danger ? 'DANGER' : 'SAFE';
            }
            if (mq7Val) mq7Val.textContent = valMq7;

            if (oledMq2) oledMq2.textContent = valMq2;
            if (oledMq5) oledMq5.textContent = valMq5;
            if (oledMq7) oledMq7.textContent = valMq7;

            // Formulate specific hazard message
            let hazardMsg = 'WARNING: GAS LEAK';
            if (dangerFlags.isMq2Danger) hazardMsg = 'WARNING: SMOKE/GAS LEAK';
            else if (dangerFlags.isMq5Danger) hazardMsg = 'WARNING: NATURAL GAS LEAK';
            else if (dangerFlags.isMq7Danger) hazardMsg = 'WARNING: CARBON MONOXIDE';

            if (oledStatus) { oledStatus.className = 'oled-line danger-text'; oledStatus.textContent = hazardMsg; }

            if (relayBadge) { relayBadge.className = 'open-badge badge-danger'; relayBadge.textContent = 'CLOSED'; }

            if (audioBox) audioBox.className = 'audio-box box-danger';
            if (audioTitle) audioTitle.textContent = 'ALERTING';
            if (audioSub) audioSub.textContent = 'HIGH CONCENTRATION DETECTED';
            if (audioIconBox) {
                audioIconBox.innerHTML = `
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
                        <polygon points="11 5 L6 9 L2 9 L2 15 L6 15 L11 19 L11 5 Z"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                `;
            }
        }

        // 4. DEVICE OFFLINE STATE
        else if (state === 'offline') {
            if (bannerNormal) bannerNormal.style.display = 'none';
            if (bannerDanger) bannerDanger.style.display = 'none';
            if (bannerOffline) bannerOffline.style.display = 'flex';

            if (statusIndicator) {
                statusIndicator.className = 'status-indicator offline';
                if (statusText) statusText.textContent = 'OFFLINE';
            }

            if (cardMq2) cardMq2.className = 'sensor-card card-offline';
            if (badgeMq2) { badgeMq2.className = 'status-badge-card badge-stale'; badgeMq2.textContent = 'STALE DATA'; }

            if (cardMq5) cardMq5.className = 'sensor-card card-offline';
            if (badgeMq5) { badgeMq5.className = 'status-badge-card badge-stale'; badgeMq5.textContent = 'STALE DATA'; }

            if (cardMq7) cardMq7.className = 'sensor-card card-offline';
            if (badgeMq7) { badgeMq7.className = 'status-badge-card badge-stale'; badgeMq7.textContent = 'STALE DATA'; }

            if (oledStatus) { oledStatus.className = 'oled-line muted-text'; oledStatus.textContent = 'DISCONNECTED'; }
        }
    }

    // Attach Event Listeners to Demo Controller Buttons (Manual Override feature)
    document.querySelectorAll('.state-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetState = btn.getAttribute('data-set-state');
            manualOverrideState = targetState;
            applyDashboardState(targetState);
        });
    });

    // Pair Device Button Interaction
    if (pairDeviceBtn) {
        pairDeviceBtn.addEventListener('click', () => {
            pairDeviceBtn.disabled = true;
            pairDeviceBtn.innerHTML = `<span class="radar-spinner"></span> CONNECTING...`;
            if (scanningStatus) scanningStatus.innerHTML = `<span>PAIRING AQ-GLD-G2 HARDWARE VIA BLUETOOTH...</span>`;

            setTimeout(() => {
                pairDeviceBtn.disabled = false;
                pairDeviceBtn.innerHTML = `<span class="plus-icon">+</span> PAIR NEW DEVICE`;
                if (scanningStatus) scanningStatus.innerHTML = `<span class="radar-spinner"></span><span>SCANNING FOR HARDWARE VIA BLUETOOTH...</span>`;
                manualOverrideState = null;
                pollSensorData();
            }, 2000);
        });
    }

    // Operating Uptime Timer
    let seconds = 8, minutes = 12, hours = 4;
    const opTimerEl = document.getElementById('opTimer');
    if (opTimerEl) {
        setInterval(() => {
            seconds++;
            if (seconds >= 60) {
                seconds = 0; minutes++;
                if (minutes >= 60) { minutes = 0; hours++; }
            }
            const pad = (n) => n.toString().padStart(2, '0');
            opTimerEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }, 1000);
    }

    // Start automatic polling loop every 3 seconds
    pollSensorData();
    setInterval(pollSensorData, 3000);
});
