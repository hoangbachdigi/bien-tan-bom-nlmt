const API_URL = "https://google.com";

let cachedData = JSON.parse(localStorage.getItem('solar_app_cache')) || null;
let appData = cachedData || {
    users: [{ username: 'nguyenhoangbach', role: 'admin', status: 'approved' }],
    configs: [],
    logs: []
};
let guestCount = parseInt(localStorage.getItem('guest_visits_count')) || 0;
let currentUser = JSON.parse(sessionStorage.getItem('current_user')) || null;
let currentSortBy = 'day';
let lastSolarQuoteData = null;

document.addEventListener("DOMContentLoaded", () => {
    applyBannerFromConfig();
    updateTopUserBar();
    loadSubPage('page-san-pham.html', document.querySelector('.nav-item.active'));
    syncDataFromGoogleSheet();
});

function toggleMobileDrawer() {
    document.getElementById('mobileDrawer').classList.toggle('open');
}

function selectMobileDrawer(pageFile, labelText, el) {
    document.querySelectorAll('.drawer-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('mobileCurrentPageLabel').innerText = labelText;
    document.getElementById('mobileDrawer').classList.remove('open');
    loadSubPage(pageFile, null);
}
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
        
        if (pageFile === 'page-san-pham.html') renderProductsPage(1);
        if (pageFile === 'page-xu-ly-loi.html') renderErrorsPage(1);
        if (pageFile === 'page-tinh-toan.html') renderToolsPage(1);
        if (pageFile === 'page-kien-thuc.html') renderKnowledgePage();
    } catch (error) {
        container.innerHTML = `<div style="text-align:center; padding:30px; color:#64748b;">Đang cập nhật nội dung chức năng này...</div>`;
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
        console.log("Sử dụng bộ nhớ đệm để tối ưu tốc độ.");
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
        statusText.innerHTML = `🔮 Khách vãng lai (Còn <b style="color:red">${left}</b> lượt tính)`;
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

function openGlobalModal(htmlContent) {
    document.getElementById('globalModalBody').innerHTML = htmlContent;
    document.getElementById('globalModal').style.display = 'flex';
}

function closeGlobalModal() {
    document.getElementById('globalModal').style.display = 'none';
}

function openUserModal() {
    if (!currentUser) {
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">👤 Đăng Nhập / Đăng Ký Thành Viên Zalo</h3>
            <p style="font-size:13.5px; color:#555;">Đăng ký bằng Tên Zalo của bạn để sử dụng công cụ tính toán không giới hạn.</p>
            <div class="form-group">
                <label>Nhập chính xác Tên tài khoản Zalo:</label>
                <input type="text" id="modalZaloInput" placeholder="Ví dụ: Nguyen Van A">
            </div>
            <div style="display:flex; gap:10px;">
                <button class="btn btn-primary" onclick="processLogin()">Đăng Nhập</button>
                <button class="btn btn-success" style="width:100%;" onclick="processRegister()">Đăng Ký Mới</button>
            </div>
        `);
    } else if (currentUser.role === 'admin') {
        renderAdminDashboard();
    } else {
        openGlobalModal(`
            <h3 style="margin-top:0;">👤 Thông Tin Tài Khoản</h3>
            <p>- Tên Zalo: <b>${currentUser.username}</b></p>
            <p>- Trạng thái: <b>${currentUser.status === 'approved' ? 'Đã kích hoạt vô hạn' : 'Đang chờ Admin Quang Nguyen duyệt'}</b></p>
            <button class="btn btn-danger" style="width:100%;" onclick="processLogout()">Đăng Xuất</button>
        `);
    }
}

async function processRegister() {
    const name = document.getElementById('modalZaloInput').value.trim();
    if (!name) return alert("Vui lòng nhập tên Zalo!");
    if (name === 'nguyenhoangbach') return alert("Tên này thuộc quyền quản trị!");

    alert("Đang gửi yêu cầu đăng ký...");
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'register', username: name }) });
    alert("Đăng ký thành công! Vui lòng liên hệ Zalo Quang Nguyen để được duyệt.");
    closeGlobalModal();
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
    closeGlobalModal();

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
    closeGlobalModal();
}
function calculateUserStats() {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    startOfWeek.setDate(now.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek));
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

    return Object.values(statsMap).sort((a, b) => b[currentSortBy] - a[currentSortBy]);
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

    const sorted = calculateUserStats();
    tbody.innerHTML = sorted.length === 0 ? `<tr><td colspan="6" style="text-align:center;">Chưa có dữ liệu thành viên</td></tr>` : sorted.map((u, idx) => `
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

async function renderAdminDashboard() {
    const currentBanner = (appData.configs.find(c => c.code === 'BANNER') || {}).media || '';
    openGlobalModal(`
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:8px; margin-bottom:12px;">
            <h3 style="margin:0; color:var(--primary); font-size:16px;">⚙️ Quản Trị Hệ Thống (nguyenhoangbach)</h3>
            <button class="btn btn-danger" style="padding:4px 10px; font-size:12px;" onclick="processLogout()">Đăng xuất</button>
        </div>
        <div class="card-panel" style="margin-bottom:12px;">
            <label>🖼️ Cập Nhật Banner Quảng Cáo (Link Google Photos):</label>
            <div style="display:flex; gap:6px;">
                <input type="text" id="adminBannerUrl" value="${currentBanner}" placeholder="Dán link ảnh từ Google Photos...">
                <button class="btn btn-success" style="white-space:nowrap;" onclick="saveBannerUrl()">Lưu</button>
            </div>
        </div>
        <div class="card-panel">
            <label>📊 Bảng Thống Kê & Xếp Hạng Đăng Nhập User:</label>
            <div style="margin-bottom:8px; display:flex; gap:5px; flex-wrap:wrap; align-items:center; font-size:12.5px;">
                <span>Sắp xếp:</span>
                <button id="sort_day" class="btn btn-outline sort-btn active-sort" style="padding:4px 8px; font-size:12px;" onclick="sortStatsTable('day')">Hôm nay</button>
                <button id="sort_week" class="btn btn-outline sort-btn" style="padding:4px 8px; font-size:12px;" onclick="sortStatsTable('week')">Tuần này</button>
                <button id="sort_month" class="btn btn-outline sort-btn" style="padding:4px 8px; font-size:12px;" onclick="sortStatsTable('month')">Tháng này</button>
                <button id="sort_year" class="btn btn-outline sort-btn" style="padding:4px 8px; font-size:12px;" onclick="sortStatsTable('year')">Năm nay</button>
            </div>
            <div class="table-wrap">
                <table class="data-table">
                    <thead><tr><th>Hạng & Tên</th><th style="text-align:center;">Ngày</th><th style="text-align:center;">Tuần</th><th style="text-align:center;">Tháng</th><th style="text-align:center;">Năm</th><th>Thao tác</th></tr></thead>
                    <tbody id="statsTableBody"></tbody>
                </table>
            </div>
        </div>
    `);
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
    if (act === 'delete' && !confirm(`Xóa tài khoản ${username}?`)) return;
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: act, username: username }) });
    await syncDataFromGoogleSheet();
    renderStatsTableOnly();
}
function getCombinedProducts() {
    const realItems = appData.configs.filter(c => c.code === 'SAN_PHAM').map(c => ({
        title: c.title,
        img: c.media || "https://unsplash.com",
        specs: c.content
    }));
    return realItems.length > 0 ? [...realItems, ...MOCK_PRODUCTS] : MOCK_PRODUCTS;
}

function renderProductsPage(page) {
    const grid = document.getElementById('productGridArea');
    const pag = document.getElementById('productPagination');
    if (!grid) return;

    const all = getCombinedProducts();
    const perPage = 20;
    const totalPages = Math.ceil(all.length / perPage);
    const items = all.slice((page - 1) * perPage, page * perPage);

    grid.innerHTML = items.map((item, idx) => {
        const globalIdx = (page - 1) * perPage + idx;
        const shortDesc = item.specs.split('|').slice(0, 2).join(' • ');
        return `
            <div class="item-card" onclick="openProductDetail(${globalIdx})">
                <img class="card-thumb" src="${item.img}" alt="${item.title}" loading="lazy">
                <div class="card-body">
                    <h3 class="card-heading">${item.title}</h3>
                    <p class="card-desc-2line">${shortDesc}</p>
                </div>
            </div>
        `;
    }).join('');

    pag.innerHTML = Array.from({ length: totalPages }, (_, i) => `
        <button class="page-btn ${i + 1 === page ? 'active' : ''}" onclick="renderProductsPage(${i + 1})">${i + 1}</button>
    `).join('');
}

function openProductDetail(idx) {
    const item = getCombinedProducts()[idx];
    if (!item) return;
    const lines = item.specs.split(/\||\n/).map(s => s.trim()).filter(Boolean);
    const specListHtml = lines.map(line => `<li style="margin-bottom:6px; color:#334155;">✅ ${line}</li>`).join('');

    openGlobalModal(`
        <img src="${item.img}" alt="${item.title}" style="width:100%; max-height:280px; object-fit:cover; border-radius:8px; margin-bottom:12px;">
        <h3 style="margin:0 0 12px; color:var(--primary); font-size:18px;">${item.title}</h3>
        <ul style="padding-left:18px; margin:0 0 16px; list-style:none;">${specListHtml}</ul>
        <button class="btn btn-outline" style="width:100%;" onclick="closeGlobalModal()">Đóng cửa sổ</button>
    `);
}

function getCombinedErrors() {
    const realErrors = appData.configs.filter(c => c.code === 'MA_LOI').map(c => {
        const bParts = c.title.split('|');
        const cParts = c.content.split('|');
        return {
            brand: (bParts || "PowerS").trim(),
            code: (bParts || "").trim(),
            desc: (cParts || "").trim(),
            fix: (cParts || "").trim()
        };
    });
    return [...realErrors, ...MOCK_ERRORS];
}

function renderErrorsPage(page) {
    const tbody = document.getElementById('errorTableBody');
    const pag = document.getElementById('errorPagination');
    if (!tbody) return;

    const searchCode = (document.getElementById('errSearchInput')?.value || "").toLowerCase().trim();
    const filterBrand = document.getElementById('errBrandSelect')?.value || "ALL";

    const filtered = getCombinedErrors().filter(err => {
        const matchBrand = (filterBrand === "ALL" || err.brand.toLowerCase() === filterBrand.toLowerCase());
        const matchCode = (!searchCode || err.code.toLowerCase().includes(searchCode) || err.desc.toLowerCase().includes(searchCode));
        return matchBrand && matchCode;
    });

    const perPage = 20;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const items = filtered.slice((page - 1) * perPage, page * perPage);

    tbody.innerHTML = items.length === 0 ? `<tr><td colspan="4" style="text-align:center; padding:20px;">Không tìm thấy mã lỗi phù hợp.</td></tr>` : items.map(e => {
        let badgeCls = 'badge-powers';
        if (e.brand.toLowerCase() === 'voltique') badgeCls = 'badge-voltique';
        if (e.brand.toLowerCase() === 'saj') badgeCls = 'badge-saj';
        return `
            <tr>
                <td><span class="badge ${badgeCls}">${e.brand}</span></td>
                <td><b style="color:var(--danger);">${e.code}</b></td>
                <td>${e.desc}</td>
                <td>${e.fix}</td>
            </tr>
        `;
    }).join('');

    pag.innerHTML = Array.from({ length: totalPages }, (_, i) => `
        <button class="page-btn ${i + 1 === page ? 'active' : ''}" onclick="renderErrorsPage(${i + 1})">${i + 1}</button>
    `).join('');
}

function getCombinedKnowledge() {
    const realBlogs = appData.configs.filter(c => c.code === 'KIEN_THUC').map(c => ({
        title: c.title,
        date: "Mới cập nhật",
        content: c.content,
        video: c.media
    }));
    return [...realBlogs, ...MOCK_KNOWLEDGE];
}

function renderKnowledgePage() {
    const listArea = document.getElementById('knowledgeListArea');
    if (!listArea) return;
    const all = getCombinedKnowledge();

    listArea.innerHTML = all.map((b, idx) => `
        <div class="blog-row" onclick="openKnowledgeDetail(${idx})">
            <div style="font-weight:600; color:var(--dark);">📄 ${b.title}</div>
            <span style="font-size:12px; color:#64748b; white-space:nowrap;">${b.date} ➔</span>
        </div>
    `).join('');
}

function openKnowledgeDetail(idx) {
    const b = getCombinedKnowledge()[idx];
    if (!b) return;
    openGlobalModal(`
        <h3 style="margin:0 0 8px; color:var(--primary); font-size:17px;">${b.title}</h3>
        <div style="font-size:12px; color:#64748b; margin-bottom:14px;">📅 ${b.date}</div>
        <div style="line-height:1.65; color:#334155; white-space:pre-line; margin-bottom:16px;">${b.content}</div>
        ${b.video ? `<a href="${b.video}" target="_blank" class="btn btn-danger" style="text-decoration:none; display:inline-block; margin-bottom:12px;">▶ Xem Video Hướng Dẫn</a>` : ''}
        <button class="btn btn-outline" style="width:100%;" onclick="closeGlobalModal()">Đóng bài viết</button>
    `);
}
const CALC_TOOLS_LIST = [
    { id: 'pump', icon: '💧', title: 'Tính công suất bơm', desc: 'Tính cột áp tổng, tổn thất ma sát ống và chọn công suất bơm chuẩn thủy lực.' },
    { id: 'solar', icon: '☀️', title: 'Chọn biến tần và công suất giàn pin', desc: 'Phối ghép 36 mã pin & 47 biến tần, phân chuỗi an toàn và lập báo giá chi tiết.' },
    { id: 'acc', icon: '🔩', title: 'Tính phụ kiện', desc: 'Tính nhanh số lượng chân đế, kẹp biên, kẹp giữa cho hệ thống pin áp mái.' },
    { id: 'vdrop', icon: '⚡', title: 'Tính sụt áp trên đường dây', desc: 'Kiểm tra độ sụt áp dây dẫn DC/AC và khuyến nghị tiết diện cáp an toàn.' },
    { id: 'divider', icon: '🔌', title: 'Tính cầu trở phân áp', desc: 'Tính điện áp đầu ra Vout và dòng tiêu thụ cho mạch cảm biến, đo lường.' }
];

function renderToolsPage(page) {
    const grid = document.getElementById('toolsGridArea');
    const pag = document.getElementById('toolsPagination');
    if (!grid) return;

    const perPage = 9;
    const totalPages = Math.ceil(CALC_TOOLS_LIST.length / perPage);
    const items = CALC_TOOLS_LIST.slice((page - 1) * perPage, page * perPage);

    grid.innerHTML = items.map(t => `
        <div class="item-card" onclick="openCalcToolModal('${t.id}')" style="padding:16px; text-align:center;">
            <div style="font-size:32px; margin-bottom:8px;">${t.icon}</div>
            <h3 class="card-heading" style="color:var(--primary);">${t.title}</h3>
            <p class="card-desc-2line">${t.desc}</p>
        </div>
    `).join('');

    pag.innerHTML = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => `
        <button class="page-btn ${i + 1 === page ? 'active' : ''}" onclick="renderToolsPage(${i + 1})">${i + 1}</button>
    `).join('') : '';
}

function openCalcToolModal(toolId) {
    if (toolId === 'pump') {
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">💧 Tính Công Suất Máy Bơm Chuẩn Thủy Lực</h3>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group">
                    <label>Loại bơm:</label>
                    <select id="calcSource">
                        <option value="gieng">Giếng khoan sâu (Bơm hỏa tiễn)</option>
                        <option value="ho" selected>Ao, hồ, sông (Bơm cạn / trục đứng)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Cỡ ống dẫn chính (Phi):</label>
                    <select id="calcPipeDia">
                        <option value="40">Ống Phi 42</option><option value="50">Ống Phi 49</option>
                        <option value="63" selected>Ống Phi 60</option><option value="75">Ống Phi 76</option>
                        <option value="90">Ống Phi 90</option><option value="110">Ống Phi 114</option>
                    </select>
                </div>
            </div>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group"><label>Độ cao đẩy đứng (m):</label><input type="number" id="calcHeight" value="50"></div>
                <div class="form-group"><label>Tổng chiều dài ống (m):</label><input type="number" id="calcLength" value="200"></div>
            </div>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group"><label>Lưu lượng cần bơm (m³/h):</label><input type="number" id="calcFlow" value="15"></div>
                <div class="form-group"><label>Áp lực đầu béc (m):</label><input type="number" id="calcOutletHead" value="15"></div>
            </div>
            <button class="btn btn-primary" onclick="checkLimitAndRun(execPumpCalc)">TÍNH CÔNG SUẤT BƠM</button>
            <div id="toolModalResult" class="result-box"></div>
        `);
    } else if (toolId === 'solar') {
        const panelOpts = SOLAR_PANELS_DB.map((p, i) => `<option value="${i}" ${p.name.includes('610W (132-cell') ? 'selected' : ''}>${p.name} - Imp: ${p.imp}A</option>`).join('');
        const invOpts = SOLAR_INVERTERS_DB.map((inv, i) => `<option value="${i}">${inv.name} (VdcMax: ${inv.vdcMax}V, IdcMax: ${inv.idcMax}A)</option>`).join('');
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">☀️ Tính Toán & Phối Ghép Hệ Thống Bơm NLMT Chuẩn Kỹ Thuật</h3>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group">
                    <label>Công suất máy bơm (kW):</label>
                    <input type="number" id="spPumpKW" value="7.5" step="0.1" oninput="autoSelectBestInverter()">
                </div>
                <div class="form-group">
                    <label>Nguồn điện máy bơm:</label>
                    <select id="spPumpPhase" onchange="autoSelectBestInverter()">
                        <option value="3 pha 380V" selected>3 Pha 380V (Khuyên dùng)</option>
                        <option value="1 pha 220V">1 Pha 220V (Bơm dân dụng)</option>
                    </select>
                </div>
            </div>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group">
                    <label>Loại máy bơm thực tế:</label>
                    <select id="spPumpType" onchange="autoSelectBestInverter()">
                        <option value="gieng" selected>Bơm hỏa tiễn thả giếng sâu (Vượt 1-2 cấp)</option>
                        <option value="can">Bơm ly tâm đặt cạn / trục đứng (Vượt 1 cấp)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Chiều dài dây AC xuống bơm (m):</label>
                    <input type="number" id="spAcLen" value="80" oninput="autoSelectBestInverter()">
                </div>
            </div>
            <div class="form-group">
                <label>Biến tần bơm đề xuất tự động (Có thể chọn lại nếu muốn):</label>
                <select id="spInvIdx">${invOpts}</select>
            </div>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group">
                    <label>Chọn mã tấm pin mặt trời (36 mã):</label>
                    <select id="spPanelIdx">${panelOpts}</select>
                </div>
                <div class="form-group">
                    <label>Chiều dài dây DC từ pin tới tủ (m):</label>
                    <input type="number" id="spDcLen" value="25">
                </div>
            </div>
            <button class="btn btn-orange" onclick="checkLimitAndRun(execSolarSystemCalc)">TÍNH TOÁN & KIỂM TRA AN TOÀN HỆ THỐNG</button>
            <div id="toolModalResult" class="result-box"></div>
        `);
        setTimeout(autoSelectBestInverter, 50);
    } else if (toolId === 'acc') {
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">🔩 Tính Phụ Kiện Lắp Pin Áp Mái</h3>
            <div class="form-group"><label>Tổng số lượng tấm pin (tấm):</label><input type="number" id="accTotalPanels" value="18"></div>
            <div class="form-group"><label>Số dãy pin lắp đặt (dãy):</label><input type="number" id="accRows" value="2"></div>
            <div class="form-group">
                <label>Cấu hình chân đế:</label>
                <select id="accLegType">
                    <option value="2">Loại 2 chân đế (2 thanh ray / dãy)</option>
                    <option value="3">Loại 3 chân đế (3 thanh ray / dãy)</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="checkLimitAndRun(execAccCalc)">TÍNH PHỤ KIỆN</button>
            <div id="toolModalResult" class="result-box"></div>
        `);
    } else if (toolId === 'vdrop') {
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">⚡ Tính Sụt Áp Trên Đường Dây</h3>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group">
                    <label>Hệ thống điện:</label>
                    <select id="vdSystem">
                        <option value="380">3 Pha 380V (AC)</option>
                        <option value="220">1 Pha 220V (AC)</option>
                        <option value="550">Điện mặt trời DC (~550V)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Chất liệu lõi dây:</label>
                    <select id="vdMaterial">
                        <option value="0.0175">Dây Đồng (Cu)</option>
                        <option value="0.0283">Dây Nhôm (Al)</option>
                    </select>
                </div>
            </div>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group"><label>Dòng điện tải (A):</label><input type="number" id="vdCurrent" value="25"></div>
                <div class="form-group"><label>Chiều dài dây 1 chiều (m):</label><input type="number" id="vdLength" value="80"></div>
            </div>
            <div class="form-group">
                <label>Tiết diện dây dẫn (mm²):</label>
                <select id="vdSize">
                    <option value="2.5">2.5 mm²</option><option value="4">4.0 mm²</option>
                    <option value="6" selected>6.0 mm²</option><option value="10">10 mm²</option>
                    <option value="16">16 mm²</option><option value="25">25 mm²</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="checkLimitAndRun(execVdropCalc)">TÍNH ĐỘ SỤT ÁP</button>
            <div id="toolModalResult" class="result-box"></div>
        `);
    } else if (toolId === 'divider') {
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">🔌 Tính Cầu Trở Phân Áp</h3>
            <div class="form-group"><label>Điện áp nguồn đầu vào Vin (V):</label><input type="number" id="divVin" value="24" step="0.1"></div>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group"><label>Điện trở R1 (kΩ):</label><input type="number" id="divR1" value="10" step="0.1"></div>
                <div class="form-group"><label>Điện trở R2 (kΩ):</label><input type="number" id="divR2" value="4.7" step="0.1"></div>
            </div>
            <button class="btn btn-primary" onclick="checkLimitAndRun(execDividerCalc)">TÍNH ĐIỆN ÁP RA VOUT</button>
            <div id="toolModalResult" class="result-box"></div>
        `);
    }
}

function autoSelectBestInverter() {
    const pumpKW = parseFloat(document.getElementById('spPumpKW')?.value) || 0;
    const phase = document.getElementById('spPumpPhase')?.value || "3 pha 380V";
    const pumpType = document.getElementById('spPumpType')?.value || "gieng";
    const acLen = parseFloat(document.getElementById('spAcLen')?.value) || 0;
    const invSelect = document.getElementById('spInvIdx');
    if (!invSelect || pumpKW <= 0) return;

    const validInvs = SOLAR_INVERTERS_DB.map((inv, idx) => ({ ...inv, origIdx: idx }))
                                        .filter(inv => inv.phase === phase);
    if (validInvs.length === 0) return;

    let basePos = validInvs.findIndex(inv => inv.kw > pumpKW);
    if (basePos === -1) basePos = validInvs.length - 1;

    let targetPos = basePos;
    if (phase === "1 pha 220V" || (pumpType === "gieng" && acLen >= 60)) {
        targetPos = Math.min(basePos + 1, validInvs.length - 1);
    }

    invSelect.value = validInvs[targetPos].origIdx;
}
function execSolarSystemCalc() {
    const pumpKW = parseFloat(document.getElementById('spPumpKW').value) || 0;
    const phase = document.getElementById('spPumpPhase').value;
    const pumpType = document.getElementById('spPumpType').value;
    const panel = SOLAR_PANELS_DB[parseInt(document.getElementById('spPanelIdx').value)];
    const inv = SOLAR_INVERTERS_DB[parseInt(document.getElementById('spInvIdx').value)];
    const dcLen = parseFloat(document.getElementById('spDcLen').value) || 0;
    const acLen = parseFloat(document.getElementById('spAcLen').value) || 0;

    if (pumpKW <= 0) return alert("Vui lòng nhập công suất máy bơm!");

    const pumpFactor = (pumpType === 'gieng') ? 1.45 : 1.35;
    const requiredWattsByPump = pumpKW * pumpFactor * 1000;
    const requiredWattsByInv = inv.kw * 1.15 * 1000;
    const targetWatts = Math.max(requiredWattsByPump, requiredWattsByInv);

    let minPanelsByPower = Math.ceil(targetWatts / panel.power);

    const maxPanelsPerString = Math.floor(inv.vdcMax / (panel.voc * 1.1));
    const minPanelsPerString = Math.ceil(inv.mpptMin / (panel.vmp * 0.85));

    if (maxPanelsPerString < minPanelsPerString) {
        alert("⚠️ Mã tấm pin và biến tần này không tương thích dải điện áp MPPT. Vui lòng chọn biến tần có Vdc_max cao hơn (900V-950V)!");
        return;
    }

    let strings = Math.max(1, Math.ceil(minPanelsByPower / maxPanelsPerString));
    let panelsPerString = Math.ceil(minPanelsByPower / strings);

    if (panelsPerString < minPanelsPerString) {
        panelsPerString = minPanelsPerString;
    }
    if (panelsPerString > maxPanelsPerString) {
        strings++;
        panelsPerString = Math.ceil(minPanelsByPower / strings);
    }

    const totalPanels = strings * panelsPerString;
    const totalKWp = (totalPanels * panel.power) / 1000;
    const vocTotal = panelsPerString * panel.voc;
    const vocCold = vocTotal * 1.1;
    const vmpTotal = panelsPerString * panel.vmp;
    const vmpHot = vmpTotal * 0.85;
    const impTotal = strings * panel.imp;

    const dcCable = impTotal <= 20 ? "Cáp Solar DC 1x4mm²" : (impTotal <= 35 ? "Cáp Solar DC 1x6mm²" : "Cáp Solar DC 1x10mm²");
    const wireCores = (phase === "1 pha 220V") ? "2x" : "3x";
    const acCable = inv.iOut <= 18 ? `Cáp đồng ${wireCores}4mm²` : (inv.iOut <= 28 ? `Cáp đồng ${wireCores}6mm²` : (inv.iOut <= 45 ? `Cáp đồng ${wireCores}10mm²` : `Cáp đồng ${wireCores}16mm²`));
    const reactorNote = (pumpType === 'gieng' && acLen >= 50) 
        ? `<b style="color:#d97706;">Khuyến nghị lắp thêm Cuộn kháng đầu ra (Output Reactor)</b> do cáp thả giếng dài ${acLen}m (chống xung áp hại cách điện motor).` 
        : "Không bắt buộc (Chiều dài cáp trong ngưỡng an toàn).";

    let warnings = [];
    if (inv.phase !== phase) warnings.push(`Sai pha điện áp! Bơm dùng ${phase} nhưng biến tần xuất ra ${inv.phase}.`);
    if (inv.kw <= pumpKW) warnings.push(`Biến tần (${inv.kw}kW) chưa vượt cấp so với bơm (${pumpKW}kW), dễ báo lỗi quá dòng khi khởi động!`);
    if (vocCold > inv.vdcMax) warnings.push(`Quá áp buổi sáng lạnh (${vocCold.toFixed(0)}V > ${inv.vdcMax}V)!`);
    if (vmpHot < inv.mpptMin) warnings.push(`Thiếu áp buổi trưa nắng nóng (${vmpHot.toFixed(0)}V < ${inv.mpptMin}V)!`);
    if (impTotal > inv.idcMax) warnings.push(`Nghẽn dòng DC (${impTotal.toFixed(1)}A > ${inv.idcMax}A)! Hãy đổi sang mã pin dòng thấp hơn (loại 13A-15A) hoặc nâng cấp biến tần.`);
    if (phase === "1 pha 220V") warnings.push(`Lưu ý bơm 1 pha: Cần kiểm tra đấu đúng sơ đồ bỏ tụ đề (3 dây) nếu biến tần yêu cầu.`);

    const statusHtml = warnings.length === 0 
        ? `<div style="padding:8px; background:#dcfce7; color:#166534; border-radius:5px; font-weight:bold; margin-top:8px;">✅ PHỐI GHÉP ĐẠT CHUẨN KỸ THUẬT 100% (An toàn cả sáng lạnh lẫn trưa nắng gắt)</div>` 
        : `<div style="padding:8px; background:#fee2e2; color:#991b1b; border-radius:5px; font-weight:bold; margin-top:8px;">⚠️ CẢNH BÁO KỸ THUẬT:<br>• ${warnings.join('<br>• ')}</div>`;

    lastSolarQuoteData = {
        pumpKW, factor: pumpFactor, panel, inv, totalPanels, totalKWp, strings, panelsPerString,
        dcLen, acLen, dcCable, acCable
    };

    const resBox = document.getElementById('toolModalResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <h4 style="margin:0 0 8px; color:var(--secondary);">KẾT QUẢ TÍNH TOÁN & PHỐI GHÉP CHUẨN</h4>
        <p>- ⚙️ <b>Biến tần sử dụng:</b> <b>${inv.name}</b></p>
        <p>- 🧩 <b>Tổng số tấm pin chốt:</b> <span class="highlight">${totalPanels} tấm</span> ${panel.name} (Tổng: <b>${totalKWp.toFixed(2)} kWp</b>)</p>
        <p>- 🔌 <b>Sơ đồ đấu nối giàn pin:</b> Chia thành <b>${strings} chuỗi (String)</b> song song, mỗi chuỗi nối tiếp <span class="highlight">${panelsPerString} tấm</span></p>
        <p>- ⚡ <b>Kiểm soát điện áp chuỗi:</b> Áp danh định Voc = <b>${vocTotal.toFixed(1)}V</b> (Sáng lạnh: <b>${vocCold.toFixed(0)}V</b> / Max ${inv.vdcMax}V) | Áp tải Vmp = <b>${vmpTotal.toFixed(1)}V</b> (Trưa nóng: <b>${vmpHot.toFixed(0)}V</b> / Min ${inv.mpptMin}V)</p>
        <p>- 🔋 <b>Kiểm soát dòng điện DC:</b> Tổng dòng làm việc Imp = <b>${impTotal.toFixed(1)}A</b> (Ngưỡng chịu tải biến tần: <b>${inv.idcMax}A</b>)</p>
        <p>- 🧵 <b>Dây dẫn đề xuất:</b> ${dcCable} (${dcLen * 2}m) | ${acCable} (${acLen}m)</p>
        <p>- 🛡️ <b>Cuộn kháng đầu ra:</b> ${reactorNote}</p>
        ${statusHtml}
        <button class="btn btn-success" style="width:100%; margin-top:12px; font-size:15px;" onclick="openEditableQuoteModal()">📄 LẬP BẢNG BÁO GIÁ (CHO PHÉP SỬA GIÁ)</button>
    `;
}
const QUOTE_ITEM_NAMES = [
    "Tấm pin năng lượng mặt trời",
    "Biến tần bơm năng lượng mặt trời",
    "Hệ khung giá đỡ nhôm & phụ kiện kẹp",
    "Tủ điện bảo vệ DC/AC, CB & Chống sét SPD",
    "Cáp chuyên dụng Solar DC (Đỏ + Đen)",
    "Cáp động lực AC xuống máy bơm",
    "Vật tư phụ, jack MC4 & hệ thống tiếp địa",
    "Nhân công lắp đặt & cài đặt vận hành"
];
const QUOTE_UNITS = ["Tấm", "Bộ", "kWp", "Tủ", "Mét", "Mét", "Gói", "kWp"];

function openEditableQuoteModal() {
    const d = lastSolarQuoteData;
    if (!d) return;
    const panelUnitPrice = d.panel.power * d.panel.priceWp;
    const rows = [
        { name: `Tấm pin NLMT ${d.panel.name}`, unit: "Tấm", qty: d.totalPanels, price: panelUnitPrice },
        { name: `Biến tần bơm ${d.inv.name}`, unit: "Bộ", qty: 1, price: d.inv.price },
        { name: `Hệ khung giá đỡ nhôm & phụ kiện kẹp`, unit: "kWp", qty: Number(d.totalKWp.toFixed(2)), price: 1100000 },
        { name: `Tủ điện bảo vệ DC/AC, CB & Chống sét SPD`, unit: "Tủ", qty: 1, price: 2500000 },
        { name: `${d.dcCable} (Đỏ + Đen)`, unit: "Mét", qty: d.dcLen * 2, price: 22000 },
        { name: `${d.acCable} xuống máy bơm`, unit: "Mét", qty: d.acLen, price: 45000 },
        { name: `Vật tư phụ, jack MC4 & hệ thống tiếp địa`, unit: "Gói", qty: 1, price: 1500000 },
        { name: `Nhân công lắp đặt & cài đặt vận hành`, unit: "kWp", qty: Number(d.totalKWp.toFixed(2)), price: 900000 }
    ];

    const trHtml = rows.map((r, i) => `
        <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td id="qName_${i}" style="min-width:130px;"><b>${r.name}</b></td>
            <td style="text-align:center;">${r.unit}</td>
            <td><input type="number" class="quote-qty" id="qQty_${i}" value="${r.qty}" oninput="recalcQuoteTotal()"></td>
            <td><input type="number" class="quote-input" id="qPrice_${i}" value="${r.price}" oninput="recalcQuoteTotal()"></td>
            <td style="text-align:right; font-weight:600; white-space:nowrap;" id="qSub_${i}">${(r.qty * r.price).toLocaleString('vi-VN')}</td>
        </tr>
    `).join('');

    openGlobalModal(`
        <h3 style="margin:0 0 6px; color:var(--primary); font-size:16px;">📄 BẢNG BÁO GIÁ BƠM NĂNG LƯỢNG MẶT TRỜI</h3>
        <p style="font-size:12px; color:#64748b; margin-top:0;">Cấu hình: Bơm <b>${d.pumpKW}kW</b> | Giàn pin <b>${d.totalKWp.toFixed(2)} kWp</b> (${d.strings} chuỗi × ${d.panelsPerString} tấm). <i>Chạm vào ô SL hoặc Đơn giá để sửa trực tiếp:</i></p>
        <div class="table-wrap">
            <table class="data-table">
                <thead><tr><th>STT</th><th>Hạng mục thiết bị</th><th>ĐVT</th><th>SL</th><th>Đơn giá (đ)</th><th style="text-align:right;">Thành tiền</th></tr></thead>
                <tbody>${trHtml}</tbody>
            </table>
        </div>
        <div style="margin-top:12px; text-align:right; font-size:13.5px;">
            <div>Tổng cộng: <b id="qTotalRaw">0</b> đ</div>
            <div style="margin:6px 0;">Giảm giá (đ): <input type="number" class="quote-input" id="qDiscount" value="0" oninput="recalcQuoteTotal()"></div>
            <div style="font-size:16px; color:var(--danger); margin-top:6px;">TỔNG THANH TOÁN: <b id="qFinalTotal">0</b> VNĐ</div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-top:14px;">
            <button class="btn btn-success" onclick="exportQuoteToExcel()">📊 Xuất Excel (.xls)</button>
            <button class="btn btn-primary" onclick="window.print()">🖨️ Xuất PDF / In</button>
            <button class="btn" style="background:#0068ff; grid-column: span 2;" onclick="shareQuoteToZalo()">💬 Copy & Gửi Báo Giá Qua Zalo</button>
        </div>
    `);
    recalcQuoteTotal();
}

function recalcQuoteTotal() {
    let rawTotal = 0;
    for (let i = 0; i < 8; i++) {
        const q = parseFloat(document.getElementById(`qQty_${i}`)?.value) || 0;
        const p = parseFloat(document.getElementById(`qPrice_${i}`)?.value) || 0;
        const sub = Math.round(q * p);
        rawTotal += sub;
        const subEl = document.getElementById(`qSub_${i}`);
        if (subEl) subEl.innerText = sub.toLocaleString('vi-VN');
    }
    const discount = parseFloat(document.getElementById('qDiscount')?.value) || 0;
    const finalTotal = Math.max(0, rawTotal - discount);
    document.getElementById('qTotalRaw').innerText = rawTotal.toLocaleString('vi-VN');
    document.getElementById('qFinalTotal').innerText = finalTotal.toLocaleString('vi-VN');
}

function exportQuoteToExcel() {
    const d = lastSolarQuoteData;
    if (!d) return;
    let rowsHtml = '';
    for (let i = 0; i < 8; i++) {
        const name = document.getElementById(`qName_${i}`)?.innerText || QUOTE_ITEM_NAMES[i];
        const qty = parseFloat(document.getElementById(`qQty_${i}`)?.value) || 0;
        const price = parseFloat(document.getElementById(`qPrice_${i}`)?.value) || 0;
        const sub = Math.round(qty * price);
        rowsHtml += `<tr>
            <td style="text-align:center;">${i + 1}</td>
            <td>${name}</td>
            <td style="text-align:center;">${QUOTE_UNITS[i]}</td>
            <td style="text-align:center;">${qty}</td>
            <td style="text-align:right;">${price}</td>
            <td style="text-align:right;">${sub}</td>
        </tr>`;
    }
    const rawTotal = document.getElementById('qTotalRaw').innerText;
    const discount = parseFloat(document.getElementById('qDiscount')?.value) || 0;
    const finalTotal = document.getElementById('qFinalTotal').innerText;

    const excelContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://w3.org">
        <head><meta charset="UTF-8"></head>
        <body>
            <table border="1" style="border-collapse:collapse; font-family:Arial, sans-serif;">
                <tr><th colspan="6" style="font-size:16px; background:#0066cc; color:#ffffff; height:35px;">BẢNG BÁO GIÁ HỆ THỐNG BƠM NĂNG LƯỢNG MẶT TRỜI</th></tr>
                <tr><td colspan="6"><b>Cấu hình:</b> Bơm ${d.pumpKW}kW | Giàn pin ${d.totalKWp.toFixed(2)} kWp (${d.strings} chuỗi x ${d.panelsPerString} tấm)</td></tr>
                <tr style="background:#f1f5f9; font-weight:bold;">
                    <th>STT</th><th>Hạng mục thiết bị</th><th>ĐVT</th><th>Số lượng</th><th>Đơn giá (VNĐ)</th><th>Thành tiền (VNĐ)</th>
                </tr>
                ${rowsHtml}
                <tr><td colspan="5" style="text-align:right;"><b>Tổng cộng:</b></td><td style="text-align:right;"><b>${rawTotal}</b></td></tr>
                <tr><td colspan="5" style="text-align:right;">Chiết khấu / Giảm giá:</td><td style="text-align:right;">${discount.toLocaleString('vi-VN')}</td></tr>
                <tr><td colspan="5" style="text-align:right; color:red;"><b>TỔNG THANH TOÁN (VNĐ):</b></td><td style="text-align:right; color:red;"><b>${finalTotal}</b></td></tr>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Gia_Bom_NLMT_${d.pumpKW}kW.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function shareQuoteToZalo() {
    const d = lastSolarQuoteData;
    if (!d) return;
    let text = `☀️ BÁO GIÁ HỆ THỐNG BƠM NĂNG LƯỢNG MẶT TRỜI\n`;
    text += `• Cấu hình: Bơm ${d.pumpKW}kW | Giàn pin ${d.totalKWp.toFixed(2)} kWp (${d.strings} chuỗi x ${d.panelsPerString} tấm)\n`;
    text += `--------------------------------\n`;
    for (let i = 0; i < 8; i++) {
        const name = document.getElementById(`qName_${i}`)?.innerText || QUOTE_ITEM_NAMES[i];
        const qty = parseFloat(document.getElementById(`qQty_${i}`)?.value) || 0;
        const sub = document.getElementById(`qSub_${i}`)?.innerText || "0";
        if (qty > 0) {
            text += `${i + 1}. ${name} (SL: ${qty} ${QUOTE_UNITS[i]}): ${sub}đ\n`;
        }
    }
    const finalTotal = document.getElementById('qFinalTotal').innerText;
    text += `--------------------------------\n`;
    text += `💰 TỔNG THANH TOÁN: ${finalTotal} VNĐ\n`;
    text += `📞 Tư vấn & Hỗ trợ kỹ thuật: Zalo Quang Nguyen`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert("✅ Đã sao chép toàn bộ nội dung Báo Giá vào bộ nhớ tạm! Hệ thống sẽ mở Zalo để bạn dán (Ctrl+V / Dán) gửi ngay cho khách hàng.");
            window.open("https://zalo.me", "_blank");
        }).catch(() => {
            prompt("Hãy sao chép nội dung báo giá dưới đây để gửi Zalo:", text);
        });
    } else {
        prompt("Hãy sao chép nội dung báo giá dưới đây để gửi Zalo:", text);
    }
}
function execPumpCalc() {
    const source = document.getElementById('calcSource').value;
    const pipeDiaMm = parseFloat(document.getElementById('calcPipeDia').value) || 63;
    const height = parseFloat(document.getElementById('calcHeight').value) || 0;
    const length = parseFloat(document.getElementById('calcLength').value) || 0;
    const flowM3h = parseFloat(document.getElementById('calcFlow').value) || 0;
    const outletHead = parseFloat(document.getElementById('calcOutletHead').value) || 0;
    if (flowM3h <= 0) return alert("Vui lòng nhập lưu lượng nước!");

    const innerDiaMap = { 40: 0.036, 50: 0.044, 63: 0.055, 75: 0.066, 90: 0.080, 110: 0.098 };
    const dMeter = innerDiaMap[pipeDiaMm] || 0.055;
    const qM3s = flowM3h / 3600;
    const frictionLoss = (10.67 * Math.pow(qM3s, 1.852) / (Math.pow(140, 1.852) * Math.pow(dMeter, 4.87))) * length * 1.1;
    const totalHead = height + frictionLoss + outletHead;
    const eff = source === 'gieng' ? 0.52 : 0.58;
    const reqKW = (qM3s * totalHead * 9.81) / eff;
    const estHP = Math.max(0.5, reqKW / 0.7457);
    const stdHPs = [0.5, 1, 1.5, 2, 3, 4, 5.5, 7.5, 10, 12.5, 15, 20, 25, 30];
    const finalHP = stdHPs.find(h => h >= estHP) || Math.ceil(estHP);

    const resBox = document.getElementById('toolModalResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <p>- Tổng cột áp thực tế (H tổng): <span class="highlight">${totalHead.toFixed(1)} m</span> (Cao ${height}m + Ma sát ${frictionLoss.toFixed(1)}m + Béc ${outletHead}m)</p>
        <p>- 🔋 <b>Công suất bơm chọn lựa:</b> <span class="highlight">${finalHP} HP</span> (~<b>${(finalHP * 0.7457).toFixed(2)} kW</b>)</p>
    `;
}

function execAccCalc() {
    const panels = parseFloat(document.getElementById('accTotalPanels').value) || 0;
    const rows = parseFloat(document.getElementById('accRows').value) || 0;
    const legType = parseInt(document.getElementById('accLegType').value) || 2;
    if (panels <= 0 || rows <= 0 || rows > panels) return alert("Thông số không hợp lệ!");

    const resBox = document.getElementById('toolModalResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <p>- 📐 <b>Số tấm trên mỗi dãy:</b> <span class="highlight">${(panels / rows).toFixed(1)}</span> tấm</p>
        <p>- 🔩 <b>Số chân đế:</b> <span class="highlight">${(panels + rows) * legType}</span> cái</p>
        <p>- 📎 <b>Số kẹp biên:</b> <span class="highlight">${rows * 2 * legType}</span> cái</p>
        <p>- 🔗 <b>Số kẹp giữa:</b> <span class="highlight">${(panels - rows) * legType}</span> cái</p>
    `;
}

function execVdropCalc() {
    const volt = parseFloat(document.getElementById('vdSystem').value) || 380;
    const rho = parseFloat(document.getElementById('vdMaterial').value) || 0.0175;
    const current = parseFloat(document.getElementById('vdCurrent').value) || 0;
    const len = parseFloat(document.getElementById('vdLength').value) || 0;
    const area = parseFloat(document.getElementById('vdSize').value) || 6;

    const factor = (volt === 380) ? Math.sqrt(3) : 2;
    const vDrop = (factor * rho * len * current) / area;
    const pct = (vDrop / volt) * 100;
    const status = pct <= 3 ? `<span style="color:green; font-weight:bold;">✅ Đạt chuẩn an toàn (&le; 3%)</span>` : `<span style="color:red; font-weight:bold;">⚠️ Sụt áp cao (&gt; 3%), nên tăng tiết diện dây!</span>`;

    const resBox = document.getElementById('toolModalResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <p>- ⚡ <b>Độ sụt áp trên dây:</b> <span class="highlight">${vDrop.toFixed(2)} V</span> (Tương đương <b>${pct.toFixed(2)}%</b>)</p>
        <p>- 📋 <b>Đánh giá kỹ thuật:</b> ${status}</p>
    `;
}

function execDividerCalc() {
    const vin = parseFloat(document.getElementById('divVin').value) || 0;
    const r1 = parseFloat(document.getElementById('divR1').value) || 0;
    const r2 = parseFloat(document.getElementById('divR2').value) || 0;
    if (r1 + r2 <= 0) return alert("Giá trị điện trở phải lớn hơn 0!");

    const vout = vin * (r2 / (r1 + r2));
    const currentMa = vin / (r1 + r2);

    const resBox = document.getElementById('toolModalResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <p>- 🔌 <b>Điện áp đầu ra Vout:</b> <span class="highlight">${vout.toFixed(2)} V</span></p>
        <p>- 🔋 <b>Dòng điện qua cầu phân áp:</b> <b>${currentMa.toFixed(2)} mA</b></p>
    `;
}
