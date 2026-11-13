const API_URL = "https://script.google.com/macros/s/AKfycbwXhaoIyrMIJNitAvvlIc9f3dHMc2R4YHU74Tk1KxeJ2iQf2YJiYa2BmYRt87ELQuFSYA/exec";

let cachedData = JSON.parse(localStorage.getItem('solar_app_cache')) || null;
let appData = cachedData || {
    users: [{ username: 'nguyenhoangbach', role: 'admin', status: 'approved' }],
    configs: [],
    logs: []
};
let guestCount = parseInt(localStorage.getItem('guest_visits_count')) || 0;
let currentUser = JSON.parse(sessionStorage.getItem('current_user')) || null;
let computedPumpHP = 0;
let currentSortBy = 'day';

document.addEventListener("DOMContentLoaded", () => {
    applyBannerFromConfig();
    updateTopUserBar();
    loadSubPage('page-tinh-toan.html', document.querySelector('.nav-item.active'));
    syncDataFromGoogleSheet();
});

async function loadSubPage(pageFile, navElement) {
    if (navElement) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navElement.classList.add('active');
    }
    const container = document.getElementById('mainPageContent');
    try {
        const response = await fetch(pageFile);
        if (!response.ok) throw new Error("Not found");
        container.innerHTML = await response.text();
        
        if (pageFile === 'page-tinh-toan.html' && computedPumpHP > 0) {
            const hpInput = document.getElementById('pumpHPInput');
            if (hpInput) hpInput.value = computedPumpHP.toFixed(1);
        }
        if (pageFile === 'page-san-pham.html') renderDynamicList('SAN_PHAM', 'productListArea');
        if (pageFile === 'page-kien-thuc.html') renderDynamicList('KIEN_THUC', 'blogListArea');
    } catch (error) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:#dc3545;">Chưa tìm thấy file <b>${pageFile}</b>.</div>`;
    }
}

function applyBannerFromConfig() {
    const bannerCfg = appData.configs.find(c => c.code === 'BANNER');
    if (bannerCfg && bannerCfg.media) {
        document.getElementById('bannerContainer').innerHTML = `<img src="${bannerCfg.media}" alt="Banner Biến Tần Bơm và Điện Năng Lượng Mặt Trời">`;
        document.getElementById('bannerContainer').style.padding = "0";
    }
}

async function syncDataFromGoogleSheet() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(API_URL, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        appData.users = [
            { username: 'nguyenhoangbach', role: 'admin', status: 'approved' },
            ...(data.users || []).map(u => ({ ...u, role: 'user' }))
        ];
        appData.configs = data.configs || [];
        appData.logs = data.logs || [];
        localStorage.setItem('solar_app_cache', JSON.stringify(appData));

        applyBannerFromConfig();
        if (currentUser) {
            const freshUser = appData.users.find(u => u.username === currentUser.username);
            if (freshUser) {
                currentUser = freshUser;
                sessionStorage.setItem('current_user', JSON.stringify(currentUser));
            }
        }
        updateTopUserBar();
    } catch (e) {
        console.log("Dùng dữ liệu bộ nhớ đệm để đảm bảo tốc độ.");
    }
}

function updateTopUserBar() {
    const statusText = document.getElementById('userStatusText');
    const btnLabel = document.getElementById('userBtnLabel');

    if (currentUser) {
        if (currentUser.role === 'admin') {
            statusText.innerHTML = `😎 Admin: <b style="color:var(--primary)">${currentUser.username}</b>`;
            btnLabel.innerText = "Quản trị";
        } else {
            statusText.innerHTML = `👤 Zalo: <b>${currentUser.username}</b> (${currentUser.status === 'approved' ? '<span style="color:green">Vô hạn</span>' : '<span style="color:orange">Chờ duyệt</span>'})`;
            btnLabel.innerText = "Tài khoản";
        }
    } else {
        let left = Math.max(0, 3 - guestCount);
        statusText.innerHTML = `🔮 Khách vãng lai (Còn <b style="color:red">${left}</b> lượt miễn phí)`;
        btnLabel.innerText = "Đăng nhập";
    }
}

function checkLimitAndRun(callbackFn) {
    if (currentUser && currentUser.status === 'approved') {
        callbackFn();
        return;
    }
    if (guestCount >= 3) {
        alert("Bạn đã dùng hết 3 lượt tính miễn phí! Vui lòng đăng ký bằng Tên Zalo và liên hệ Zalo Quang Nguyen để mở khóa vô hạn.");
        openUserModal();
        return;
    }
    guestCount++;
    localStorage.setItem('guest_visits_count', guestCount);
    updateTopUserBar();
    callbackFn();
}

function openUserModal() {
    const modal = document.getElementById('userModal');
    const area = document.getElementById('modalContentArea');
    modal.style.display = 'flex';

    if (!currentUser) {
        area.innerHTML = `
            <h3 style="margin-top:0; color:var(--primary); font-size:16px;">👤 Đăng Nhập / Đăng Ký Thành Viên Zalo</h3>
            <p style="font-size:13px; color:#555;">Đăng ký bằng Tên Zalo của bạn để mở khóa tính toán không giới hạn.</p>
            <div class="form-group">
                <label>Nhập chính xác Tên tài khoản Zalo:</label>
                <input type="text" id="modalZaloInput" placeholder="Ví dụ: Nguyen Van A">
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-primary" onclick="processLogin()">Đăng Nhập</button>
                <button class="btn btn-success" style="width:100%;" onclick="processRegister()">Đăng Ký Mới</button>
            </div>
        `;
    } else if (currentUser.role === 'admin') {
        renderAdminDashboard(area);
    } else {
        area.innerHTML = `
            <h3 style="margin-top:0; font-size:16px;">👤 Thông Tin Tài Khoản</h3>
            <p>- Tên Zalo: <b>${currentUser.username}</b></p>
            <p>- Trạng thái: <b>${currentUser.status === 'approved' ? 'Đã kích hoạt vô hạn' : 'Đang chờ Admin Quang Nguyen duyệt'}</b></p>
            <button class="btn btn-danger" style="width:100%;" onclick="processLogout()">Đăng Xuất</button>
        `;
    }
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function processRegister() {
    const name = document.getElementById('modalZaloInput').value.trim();
    if (!name) return alert("Vui lòng nhập tên Zalo!");
    if (name === 'nguyenhoangbach') return alert("Tên này thuộc quyền quản trị!");

    alert("Đang gửi yêu cầu đăng ký...");
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'register', username: name }) });
    alert("Đăng ký thành công! Vui lòng liên hệ Zalo Quang Nguyen để được duyệt.");
    closeUserModal();
    syncDataFromGoogleSheet();
}

async function processLogin() {
    const name = document.getElementById('modalZaloInput').value.trim();
    if (!name) return alert("Vui lòng nhập tên Zalo!");

    const user = appData.users.find(u => u.username === name);
    if (!user) return alert("Tên Zalo này chưa đăng ký!");
    if (user.status === 'pending') return alert("Tài khoản của bạn đang chờ duyệt. Liên hệ Zalo Quang Nguyen!");

    currentUser = user;
    sessionStorage.setItem('current_user', JSON.stringify(currentUser));
    updateTopUserBar();
    closeUserModal();

    if (user.role !== 'admin') {
        fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'log_login', username: name }) });
    } else {
        openUserModal();
    }
}

function processLogout() {
    currentUser = null;
    sessionStorage.removeItem('current_user');
    updateTopUserBar();
    closeUserModal();
}

function calculateUserStats() {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diffToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    startOfWeek.setDate(now.getDate() + diffToMon);
    startOfWeek.setHours(0, 0, 0, 0);

    const statsMap = {};
    appData.users.filter(u => u.role !== 'admin').forEach(u => {
        statsMap[u.username] = { username: u.username, status: u.status, day: 0, week: 0, month: 0, year: 0 };
    });

    appData.logs.forEach(l => {
        const uName = l.username;
        if (!statsMap[uName]) return;
        const d = new Date(Number(l.time));
        if (isNaN(d.getTime())) return;

        if (d.toDateString() === now.toDateString()) statsMap[uName].day++;
        if (d >= startOfWeek && d <= now) statsMap[uName].week++;
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) statsMap[uName].month++;
        if (d.getFullYear() === now.getFullYear()) statsMap[uName].year++;
    });

    const list = Object.values(statsMap);
    list.sort((a, b) => b[currentSortBy] - a[currentSortBy]);
    return list;
}

function sortStatsTable(criteria) {
    currentSortBy = criteria;
    renderStatsTableOnly();
}

function renderStatsTableOnly() {
    const tbody = document.getElementById('statsTableBody');
    if (!tbody) return;

    document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active-sort'));
    const activeBtn = document.getElementById('sort_' + currentSortBy);
    if (activeBtn) activeBtn.classList.add('active-sort');

    const sortedUsers = calculateUserStats();
    if (sortedUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Chưa có dữ liệu thành viên</td></tr>`;
        return;
    }

    tbody.innerHTML = sortedUsers.map((u, idx) => `
        <tr>
            <td><b>#${idx + 1} ${u.username}</b></td>
            <td style="text-align:center; font-weight:bold; color:var(--primary);">${u.day}</td>
            <td style="text-align:center; font-weight:bold;">${u.week}</td>
            <td style="text-align:center; font-weight:bold;">${u.month}</td>
            <td style="text-align:center; font-weight:bold; color:var(--secondary);">${u.year}</td>
            <td>
                ${u.status === 'pending' ? `<button class="btn btn-success" style="padding:3px 6px; font-size:11px;" onclick="adminAction('approve', '${u.username}')">Duyệt</button>` : ''}
                <button class="btn btn-danger" style="padding:3px 6px; font-size:11px;" onclick="adminAction('delete', '${u.username}')">Xóa</button>
            </td>
        </tr>
    `).join('');
}

async function renderAdminDashboard(container) {
    const currentBanner = (appData.configs.find(c => c.code === 'BANNER') || {}).media || '';
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:8px; margin-bottom:12px;">
            <h3 style="margin:0; color:var(--primary); font-size:15.5px;">⚙️ Quản Trị Hệ Thống (nguyenhoangbach)</h3>
            <button class="btn btn-danger" style="padding:4px 10px; font-size:12px;" onclick="processLogout()">Đăng xuất</button>
        </div>

        <div class="card" style="margin-bottom:12px;">
            <div class="card-title">🖼️ Cập Nhật Banner Quảng Cáo (Google Photos)</div>
            <div style="display:flex; gap:6px;">
                <input type="text" id="adminBannerUrl" value="${currentBanner}" placeholder="Dán link ảnh từ Google Photos...">
                <button class="btn btn-success" style="white-space:nowrap;" onclick="saveBannerUrl()">Lưu</button>
            </div>
        </div>

        <div class="card">
            <div class="card-title">📊 Bảng Thống Kê & Xếp Hạng Đăng Nhập User</div>
            <div style="margin-bottom:8px; display:flex; gap:5px; flex-wrap:wrap; align-items:center; font-size:12.5px;">
                <span>Sắp xếp nhiều nhất:</span>
                <button id="sort_day" class="btn btn-outline sort-btn active-sort" style="padding:4px 8px; font-size:12px;" onclick="sortStatsTable('day')">Hôm nay</button>
                <button id="sort_week" class="btn btn-outline sort-btn" style="padding:4px 8px; font-size:12px;" onclick="sortStatsTable('week')">Tuần này</button>
                <button id="sort_month" class="btn btn-outline sort-btn" style="padding:4px 8px; font-size:12px;" onclick="sortStatsTable('month')">Tháng này</button>
                <button id="sort_year" class="btn btn-outline sort-btn" style="padding:4px 8px; font-size:12px;" onclick="sortStatsTable('year')">Năm nay</button>
            </div>
            <div class="table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Hạng & Tên Zalo</th>
                            <th style="text-align:center;">Ngày</th>
                            <th style="text-align:center;">Tuần</th>
                            <th style="text-align:center;">Tháng</th>
                            <th style="text-align:center;">Năm</th>
                            <th>Quản lý</th>
                        </tr>
                    </thead>
                    <tbody id="statsTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    renderStatsTableOnly();
    await syncDataFromGoogleSheet();
    renderStatsTableOnly();
}

async function saveBannerUrl() {
    const url = document.getElementById('adminBannerUrl').value.trim();
    alert("Đang lưu Banner...");
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'update_banner', bannerUrl: url }) });
    await syncDataFromGoogleSheet();
    alert("Đã cập nhật Banner!");
}

async function adminAction(act, username) {
    if (act === 'delete' && !confirm(`Xóa vĩnh viễn tài khoản ${username}?`)) return;
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: act, username: username }) });
    await syncDataFromGoogleSheet();
    renderStatsTableOnly();
}

function renderDynamicList(typeCode, targetElementId) {
    const container = document.getElementById(targetElementId);
    if (!container) return;
    const items = appData.configs.filter(c => c.code === typeCode);
    if (items.length === 0) {
        container.innerHTML = `<p style="color:#6c757d; text-align:center; padding: 20px 0;">Nội dung mục này đang được cập nhật. Vui lòng quay lại sau!</p>`;
        return;
    }
    container.innerHTML = items.map(item => `
        <article class="card" style="margin-bottom:12px;">
            <h3 style="margin-top:0; color:var(--primary); font-size:15.5px;">${item.title}</h3>
            <p style="margin-bottom:8px;">${item.content}</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${item.media ? `<a href="${item.media}" target="_blank" class="btn btn-danger" style="text-decoration:none; font-size:12.5px;">▶ Xem Video Hướng Dẫn</a>` : ''}
                ${item.affiliate ? `<a href="${item.affiliate}" target="_blank" class="btn btn-success" style="text-decoration:none; font-size:12.5px;">🛒 Xem Giá & Đặt Mua</a>` : ''}
            </div>
        </article>
    `).join('');
}

function switchSubCalcTab(subTabId, el) {
    document.querySelectorAll('.sub-tab-btn').forEach(b => {
        b.style.borderBottom = 'none';
        b.style.color = '#495057';
    });
    el.style.borderBottom = '3px solid var(--primary)';
    el.style.color = 'var(--primary)';

    document.querySelectorAll('.sub-calc-content').forEach(c => c.style.display = 'none');
    document.getElementById(subTabId).style.display = 'block';
    document.getElementById('calcResultArea').style.display = 'none';
}

function runPumpCalc() {
    const source = document.getElementById('calcSource').value;
    const pipeDiaMm = parseFloat(document.getElementById('calcPipeDia').value) || 63;
    const height = parseFloat(document.getElementById('calcHeight').value) || 0;
    const length = parseFloat(document.getElementById('calcLength').value) || 0;
    const flowM3h = parseFloat(document.getElementById('calcFlow').value) || 0;
    const outletHead = parseFloat(document.getElementById('calcOutletHead').value) || 0;

    if (flowM3h <= 0) return alert("Vui lòng nhập lưu lượng nước cần bơm!");

    // 1. Tính tổn thất ma sát đường ống theo công thức Hazen-Williams (Ống nhựa HDPE/uPVC, C = 140)
    // Đường kính trong ước tính theo ống nhựa thông dụng (m)
    const innerDiaMap = {
        32: 0.028,
        40: 0.036,
        50: 0.044,
        63: 0.055,
        75: 0.066,
        90: 0.080,
        110: 0.098,
        140: 0.125
    };
    const dMeter = innerDiaMap[pipeDiaMm] || (pipeDiaMm * 0.88 / 1000);
    const qM3s = flowM3h / 3600;
    const C = 140;

    // Tổn thất dọc đường (m) + 10% tổn thất cục bộ qua co, cút, van
    const headLossPerMeter = 10.67 * Math.pow(qM3s, 1.852) / (Math.pow(C, 1.852) * Math.pow(dMeter, 4.87));
    const frictionLoss = headLossPerMeter * length * 1.1;

    // 2. Tổng cột áp thực tế (H tổng = Cao độ đứng + Tổn thất ma sát + Áp lực đầu ra)
    const totalHead = height + frictionLoss + outletHead;

    // 3. Hiệu suất tổ hợp bơm + động cơ theo từng dòng bơm thực tế
    let efficiency = 0.58; // Bơm đặt cạn / trục đứng
    let pumpTypeName = "Bơm ly tâm đặt cạn / trục đứng đa tầng cánh";
    if (source === 'gieng') {
        efficiency = 0.52; // Bơm hỏa tiễn thả giếng sâu
        pumpTypeName = "Bơm hỏa tiễn đa tầng cánh chuyên dụng giếng khoan";
    } else if (source === 'be') {
        efficiency = 0.62;
        pumpTypeName = "Bơm ly tâm trục ngang / bơm chìm nước sạch";
    }

    // Công suất thủy lực (kW) = (Q(m3/s) * H(m) * 9.81) / Hiệu suất
    const requiredKW = (qM3s * totalHead * 9.81) / efficiency;
    let estHP = requiredKW / 0.7457;
    if (estHP < 0.5) estHP = 0.5;

    // Làm tròn theo dải công suất motor thực tế ngoài thị trường
    const standardHPs = [0.5, 1, 1.5, 2, 3, 4, 5.5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50];
    computedPumpHP = standardHPs.find(hp => hp >= estHP) || Math.ceil(estHP);

    // Kiểm tra vận tốc nước trong ống để cảnh báo nếu chọn ống quá nhỏ
    const area = Math.PI * Math.pow(dMeter / 2, 2);
    const velocity = qM3s / area;
    let pipeWarning = "";
    if (velocity > 2.2) {
        pipeWarning = `<p style="color:#d9534f; font-weight:bold; margin:6px 0;">⚠️ Cảnh báo đường ống: Vận tốc nước đạt ${velocity.toFixed(2)} m/s gây tổn thất ma sát rất lớn (${frictionLoss.toFixed(1)}m). Bạn nên tăng lên cỡ ống lớn hơn để giảm công suất bơm!</p>`;
    } else {
        pipeWarning = `<p style="color:green; margin:6px 0;">✅ Cỡ ống phù hợp (Vận tốc dòng chảy: ${velocity.toFixed(2)} m/s, tổn thất ma sát thấp).</p>`;
    }

    // Tự động điền công suất HP sang tab Chọn Biến Tần
    const hpInput = document.getElementById('pumpHPInput');
    if (hpInput) hpInput.value = computedPumpHP;

    const resBox = document.getElementById('calcResultArea');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <h3 style="margin-top:0; color:var(--secondary); font-size:15.5px;">KẾT QUẢ TÍNH THỦY LỰC & CÔNG SUẤT BƠM</h3>
        <p>- Lưu lượng yêu cầu (Q): <b>${flowM3h.toFixed(1)} m³/giờ</b></p>
        <p>- Phân tích cột áp: Đẩy cao <b>${height}m</b> + Ma sát ống <b>${frictionLoss.toFixed(1)}m</b> + Áp đầu ra <b>${outletHead}m</b></p>
        <p>- 🎯 <b>Tổng cột áp cần thiết (H tổng):</b> <span class="highlight">${totalHead.toFixed(1)} mét</span></p>
        <p>- 🔋 <b>Công suất máy bơm chọn lựa:</b> <span class="highlight">${computedPumpHP} HP</span> (~${(computedPumpHP * 0.7457).toFixed(2)} kW)</p>
        ${pipeWarning}
        <p style="background:#fff; padding:8px; border-radius:4px; border:1px solid #dee2e6; margin-bottom:0; font-size:13px;">
            💡 <b>Đề xuất thiết bị:</b> Sử dụng <b>${pumpTypeName}</b> đạt cột áp làm việc tối ưu quanh mức <b>${totalHead.toFixed(0)}m</b>. Bạn có thể chuyển sang tab bên cạnh để chọn biến tần và giàn pin NLMT cho bơm <b>${computedPumpHP} HP</b> này!
        </p>
    `;
}

function runSolarInverterCalc() {
    const pumpHP = parseFloat(document.getElementById('pumpHPInput').value) || 0;
    if (pumpHP === 0) return alert("Vui lòng nhập công suất máy bơm (HP)!");

    const panelKey = document.getElementById('solarPanelSelect').value;
    const panelDb = {
        jinko580: { name: "Jinko 580W", power: 580, voc: 52.50 },
        astro595: { name: "ASTRONERGY 595W", power: 595, voc: 52.83 },
        jinko625: { name: "Jinko 625W", power: 625, voc: 49.26 },
        jinko630: { name: "Jinko 630W", power: 630, voc: 49.48 }
    };
    const selectedPanel = panelDb[panelKey];
    const pumpKW = pumpHP * 0.7457;

    const invList = [7.5, 11, 15, 22, 30];
    let matchedIndex = invList.findIndex(kw => kw > pumpKW);
    let finalInvKW = 30;
    if (matchedIndex !== -1) {
        let targetIdx = Math.min(matchedIndex + 1, invList.length - 1);
        finalInvKW = invList[targetIdx];
    }

    const minSolarKW = finalInvKW * 1.3;
    let totalPanels = Math.ceil((minSolarKW * 1000) / selectedPanel.power);

    let stringCount = Math.ceil(totalPanels / 17);
    let panelsPerString = Math.ceil(totalPanels / stringCount);
    if (panelsPerString < 11) {
        panelsPerString = 11;
        totalPanels = panelsPerString * stringCount;
    }

    const actualSolarKW = (totalPanels * selectedPanel.power) / 1000;
    const totalVoc = panelsPerString * selectedPanel.voc;
    let vocAlert = totalVoc > 900 
        ? `<span style="color:red; font-weight:bold;">⚠️ Vượt 900V! Cần giảm số tấm/chuỗi.</span>` 
        : `<span style="color:green; font-weight:bold;">✅ An toàn (&lt; 900V)</span>`;

    // Tự động điền sẵn số lượng tấm pin sang tab Tính Phụ Kiện
    const accInput = document.getElementById('accTotalPanels');
    if (accInput) accInput.value = totalPanels;

    const resBox = document.getElementById('calcResultArea');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <h3 style="margin-top:0; color:var(--secondary); font-size:15.5px;">CẤU HÌNH BIẾN TẦN & GIÀN PIN ĐỀ XUẤT</h3>
        <p>- Công suất bơm: <b>${pumpHP.toFixed(1)} HP</b> (~<b>${pumpKW.toFixed(2)} kW</b>)</p>
        <p>- ⚙️ <b>Biến tần chọn lựa:</b> <span class="highlight">${finalInvKW} kW</span> (Vượt 2 cấp bảo vệ)</p>
        <p>- ☀️ <b>Tổng công suất giàn pin:</b> <span class="highlight" style="color:#e65100;">${actualSolarKW.toFixed(2)} kWp</span></p>
        <p>- 📦 <b>Số lượng tấm pin:</b> <b>${totalPanels} tấm</b> (${selectedPanel.name})</p>
        <p>- 🧩 <b>Chia chuỗi (String):</b> <b>${stringCount} chuỗi</b>, mỗi chuỗi <span class="highlight">${panelsPerString} tấm</span> nối tiếp</p>
        <p>- ⚡ <b>Điện áp hở mạch (Voc):</b> <b>${totalVoc.toFixed(2)} V</b> — ${vocAlert}</p>
        <p style="background:#fff; padding:8px; border-radius:4px; border:1px solid #dee2e6; margin-bottom:0; font-size:13px;">
            💡 <b>Lưu ý:</b> Bơm nước dốc tự dừng nhanh, <b>không cần lắp thêm điện trở hãm ngoài</b>. Bạn có thể chuyển sang tab <b>"TÍNH PHỤ KIỆN"</b> để lên đơn vật tư cho <b>${totalPanels} tấm pin</b> này!
        </p>
    `;
}

function runAccessoryCalc() {
    const totalPanels = parseFloat(document.getElementById('accTotalPanels').value) || 0;
    const rows = parseFloat(document.getElementById('accRows').value) || 0;
    const legType = parseInt(document.getElementById('accLegType').value) || 2;

    if (totalPanels <= 0 || rows <= 0) return alert("Vui lòng nhập đầy đủ số lượng tấm pin và số dãy pin!");
    if (rows > totalPanels) return alert("Số dãy pin không thể lớn hơn tổng số tấm pin!");

    const panelsPerRow = totalPanels / rows;
    const legCount = (totalPanels + rows) * legType;
    const endClampCount = rows * 2 * legType;
    const midClampCount = (totalPanels - rows) * legType;

    const resBox = document.getElementById('calcResultArea');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <h3 style="margin-top:0; color:var(--secondary); font-size:15.5px;">BẢNG THỐNG KÊ VẬT TƯ PHỤ KIỆN LẮP ĐẶT (${legType} CHÂN ĐẾ)</h3>
        <p>- 📐 <b>Số tấm trên mỗi dãy:</b> <span class="highlight">${Number.isInteger(panelsPerRow) ? panelsPerRow : panelsPerRow.toFixed(1)}</span> tấm / dãy</p>
        <p>- 🔩 <b>Số lượng chân đế (Pad L / Chân chữ Z):</b> <span class="highlight">${legCount}</span> cái</p>
        <p>- 📎 <b>Số lượng kẹp biên:</b> <span class="highlight">${endClampCount}</span> cái</p>
        <p>- 🔗 <b>Số lượng kẹp giữa:</b> <span class="highlight">${midClampCount}</span> cái</p>
        <p style="background:#fff; padding:8px; border-radius:4px; border:1px solid #dee2e6; margin-bottom:0; font-size:13px;">
            💡 <b>Ghi chú kỹ thuật:</b> Định mức trên được tính theo tiêu chuẩn <b>${legType} thanh ray nhôm / dãy</b> cho tổng cộng <b>${totalPanels} tấm pin</b> chia làm <b>${rows} dãy</b>.
        </p>
    `;
}

