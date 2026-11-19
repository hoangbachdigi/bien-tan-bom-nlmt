const API_URL = "https://script.google.com/macros/s/AKfycbwXhaoIyrMIJNitAvvlIc9f3dHMc2R4YHU74Tk1KxeJ2iQf2YJiYa2BmYRt87ELQuFSYA/exec";

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
let currentSolarPlans = [];
let selectedPlanIdx = 1;
document.addEventListener("DOMContentLoaded", async () => {
    renderVietnamDate();
    applyBannerFromConfig();
    updateTopUserBar();
    await loadSubPage('page-san-pham.html', document.querySelector('.nav-item.active'));
    checkSharedProductUrl();
    syncDataFromGoogleSheet();
});

function renderVietnamDate() {
    const el = document.getElementById('vnDateDisplay');
    if (!el) return;
    try {
        const now = new Date();
        const vnStr = now.toLocaleDateString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        el.innerText = "📅 " + vnStr.charAt(0).toUpperCase() + vnStr.slice(1);
    } catch (e) {
        el.innerText = "📅 Hôm nay";
    }
}
function checkSharedProductUrl() {
    const params = new URLSearchParams(window.location.search);
    const spIdx = params.get('sp');
    if (spIdx !== null && !isNaN(parseInt(spIdx))) {
        openProductDetail(parseInt(spIdx));
    }
}

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
    } catch (e) {}
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
    if (currentUser && currentUser.status === 'approved') return callbackFn();
    if (guestCount >= 3) {
        alert("Bạn đã dùng hết 3 lượt tính miễn phí! Vui lòng đăng ký bằng Tên Zalo và liên hệ Zalo Quang Nguyen để mở khóa vô hạn.");
        return openUserModal();
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
            <div class="form-group"><label>Nhập chính xác Tên tài khoản Zalo:</label><input type="text" id="modalZaloInput" placeholder="Ví dụ: Nguyen Van A"></div>
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
        return `<div class="item-card" onclick="openProductDetail(${globalIdx})"><img class="card-thumb" src="${item.img}" alt="${item.title}" loading="lazy"><div class="card-body"><h3 class="card-heading">${item.title}</h3><p class="card-desc-2line">${shortDesc}</p></div></div>`;
    }).join('');
    pag.innerHTML = Array.from({ length: totalPages }, (_, i) => `<button class="page-btn ${i + 1 === page ? 'active' : ''}" onclick="renderProductsPage(${i + 1})">${i + 1}</button>`).join('');
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
        <button class="btn" style="width:100%; background:#0068ff; font-size:15px;" onclick="copyProductShareLink(${idx}, '${item.title.replace(/'/g, "\\'")}')">🔗 Chia Sẻ / Sao Chép Link Sản Phẩm</button>
    `);
}

function copyProductShareLink(idx, title) {
    const shareUrl = `${window.location.origin + window.location.pathname}?sp=${idx}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => alert(`✅ Đã sao chép đường dẫn sản phẩm "${title}" vào bộ nhớ tạm!`))
        .catch(() => prompt("Sao chép đường dẫn sản phẩm dưới đây:", shareUrl));
    } else {
        prompt("Sao chép đường dẫn sản phẩm dưới đây:", shareUrl);
    }
}
function getCombinedErrors() {
    const realErrors = appData.configs.filter(c => c.code === 'MA_LOI').map(c => {
        const bParts = c.title.split('|');
        const cParts = c.content.split('|');
        return { brand: (bParts || "PowerS").trim(), code: (bParts || "").trim(), desc: (cParts || "").trim(), fix: (cParts || "").trim() };
    });
    return [...realErrors, ...MOCK_ERRORS];
}

function renderErrorsPage(page) {
    const tbody = document.getElementById('errorTableBody');
    const pag = document.getElementById('errorPagination');
    if (!tbody) return;
    const searchCode = (document.getElementById('errSearchInput')?.value || "").toLowerCase().trim();
    const filterBrand = document.getElementById('errBrandSelect')?.value || "ALL";
    const filtered = getCombinedErrors().filter(err => (filterBrand === "ALL" || err.brand.toLowerCase() === filterBrand.toLowerCase()) && (!searchCode || err.code.toLowerCase().includes(searchCode) || err.desc.toLowerCase().includes(searchCode)));
    const perPage = 20;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const items = filtered.slice((page - 1) * perPage, page * perPage);

    tbody.innerHTML = items.length === 0 ? `<tr><td colspan="4" style="text-align:center; padding:20px;">Không tìm thấy mã lỗi phù hợp.</td></tr>` : items.map(e => {
        let badgeCls = e.brand.toLowerCase() === 'voltique' ? 'badge-voltique' : (e.brand.toLowerCase() === 'saj' ? 'badge-saj' : 'badge-powers');
        return `<tr><td><span class="badge ${badgeCls}">${e.brand}</span></td><td><b style="color:var(--danger);">${e.code}</b></td><td>${e.desc}</td><td>${e.fix}</td></tr>`;
    }).join('');
    pag.innerHTML = Array.from({ length: totalPages }, (_, i) => `<button class="page-btn ${i + 1 === page ? 'active' : ''}" onclick="renderErrorsPage(${i + 1})">${i + 1}</button>`).join('');
}

function getCombinedKnowledge() {
    const realBlogs = appData.configs.filter(c => c.code === 'KIEN_THUC').map(c => ({ title: c.title, date: "Mới cập nhật", content: c.content, video: c.media }));
    return [...realBlogs, ...MOCK_KNOWLEDGE];
}

function renderKnowledgePage() {
    const listArea = document.getElementById('knowledgeListArea');
    if (!listArea) return;
    listArea.innerHTML = getCombinedKnowledge().map((b, idx) => `<div class="blog-row" onclick="openKnowledgeDetail(${idx})"><div style="font-weight:600; color:var(--dark);">📄 ${b.title}</div><span style="font-size:12px; color:#64748b; white-space:nowrap;">${b.date} ➔</span></div>`).join('');
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
    { id: 'solar', icon: '☀️', title: 'Tính Toán Chuỗi Pin Biến Tần Bơm NLMT', desc: 'Chọn biến tần theo hãng, nhập thông số pin và xuất 3 phương án cấu hình thực chiến.' },
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

    grid.innerHTML = items.map(t => `<div class="item-card" onclick="openCalcToolModal('${t.id}')" style="padding:16px; text-align:center;"><div style="font-size:32px; margin-bottom:8px;">${t.icon}</div><h3 class="card-heading" style="color:var(--primary);">${t.title}</h3><p class="card-desc-2line">${t.desc}</p></div>`).join('');
    pag.innerHTML = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => `<button class="page-btn ${i + 1 === page ? 'active' : ''}" onclick="renderToolsPage(${i + 1})">${i + 1}</button>`).join('') : '';
}

function openCalcToolModal(toolId) {
    if (toolId === 'pump') {
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">💧 Tính Công Suất Máy Bơm Chuẩn Thủy Lực</h3>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group"><label>Loại bơm:</label><select id="calcSource"><option value="gieng">Giếng khoan sâu (Bơm hỏa tiễn)</option><option value="ho" selected>Ao, hồ, sông (Bơm cạn / trục đứng)</option></select></div>
                <div class="form-group"><label>Cỡ ống dẫn chính (Phi):</label><select id="calcPipeDia"><option value="40">Ống Phi 42</option><option value="50">Ống Phi 49</option><option value="63" selected>Ống Phi 60</option><option value="75">Ống Phi 76</option><option value="90">Ống Phi 90</option><option value="110">Ống Phi 114</option></select></div>
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
        const panelOpts = SOLAR_PANELS_DB.map((p, i) => `<option value="${i}" ${p.power === 625 ? 'selected' : ''}>${p.name}</option>`).join('') + `<option value="custom">-- Tự nhập thông số tấm pin khác --</option>`;
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary); font-size:17px;">⚡ Tính Toán Chuỗi Pin Biến Tần Bơm NLMT (Bản Thực Chiến)</h3>
            <div class="solar-sec-box" style="margin-bottom:12px;">
                <div class="solar-sec-title">0. Thông Số Máy Bơm Thực Tế (Để trống nếu muốn xem toàn bộ Biến Tần)</div>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap:10px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Loại tải máy bơm:</label>
                        <select id="scLoadType" onchange="updateInverterDropdownByBrand()">
                            <option value="1" selected>Bơm hỏa tiễn / Bơm chìm (Tăng 1 cấp)</option>
                            <option value="0">Bơm đặt cạn / Ly tâm nhẹ (Bằng cấp)</option>
                            <option value="2">Bơm piston / Nén khí / Đẩy cao nặng (Tăng 2 cấp)</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Công suất máy bơm (Hỗ trợ + - * /):</label>
                        <div class="input-unit-group">
                            <input type="text" id="spPumpExpr" inputmode="decimal" placeholder="Để trống = xem hết" oninput="cleanPumpExprInput()" onkeyup="cleanPumpExprInput()" onblur="evaluatePumpInput()" onkeydown="if(event.key==='Enter'){evaluatePumpInput();}">
                            <select id="spPumpUnit" onchange="updateInverterDropdownByBrand()">
                                <option value="kW" selected>kW</option>
                                <option value="HP">HP</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Hãng biến tần ưu tiên:</label>
                        <select id="scBrandSelect" onchange="updateInverterDropdownByBrand()">
                            <option value="Power S" selected>Power S (Max 900V)</option>
                            <option value="SAJ">SAJ (Max 900V)</option>
                            <option value="Green Nova">Green Nova (Max 950V)</option>
                            <option value="Voltique">Voltique (Max 950V)</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="solar-calc-grid">
                <div class="solar-sec-box">
                    <div class="solar-sec-title">1. Chọn Biến Tần Phù Hợp</div>
                    <div class="form-group">
                        <label>Danh sách biến tần theo hãng:</label>
                        <select id="spInvIdx" onchange="fillInverterSpecs()"></select>
                    </div>
                    <div class="solar-mini-grid">
                        <div class="form-group"><label>Công suất (kW):</label><input type="number" id="invKwInput" step="0.1" value="15"></div>
                        <div class="form-group"><label>Áp DC Max (V):</label><input type="number" id="invVdcMaxInput" value="900"></div>
                        <div class="form-group"><label>Dòng DC Max (A):</label><input type="number" id="invIdcMaxInput" value="40"></div>
                        <div class="form-group"><label>Áp MPPT tối ưu từ (V):</label><input type="number" id="invMpptMinInput" value="550"></div>
                    </div>
                    <div class="form-group" style="margin-bottom:0;"><label>Áp MPPT tối ưu đến (V):</label><input type="number" id="invMpptMaxInput" value="680"></div>
                </div>
                <div class="solar-sec-box">
                    <div class="solar-sec-title">2. Chọn / Nhập Tấm Pin (STC)</div>
                    <div class="form-group">
                        <label>Chọn mẫu tấm pin có sẵn:</label>
                        <select id="spPanelIdx" onchange="fillPanelSpecs()">${panelOpts}</select>
                    </div>
                    <div class="solar-mini-grid">
                        <div class="form-group"><label>Công suất Pmax (W):</label><input type="number" id="panPmaxInput" value="625"></div>
                        <div class="form-group"><label>Dòng làm việc Imp (A):</label><input type="number" id="panImpInput" step="0.01" value="15.28"></div>
                        <div class="form-group"><label>Áp làm việc Vmp (V):</label><input type="number" id="panVmpInput" step="0.01" value="40.90"></div>
                        <div class="form-group"><label>Áp hở mạch Voc (V):</label><input type="number" id="panVocInput" step="0.01" value="49.02"></div>
                    </div>
                    <div class="solar-mini-grid" style="margin-top:4px;">
                        <div class="form-group" style="margin-bottom:0;"><label>Dây DC 1 chiều (m):</label><input type="number" id="spDcLen" value="25"></div>
                        <div class="form-group" style="margin-bottom:0;"><label>Dây AC xuống bơm (m):</label><input type="number" id="spAcLen" value="60"></div>
                    </div>
                </div>
            </div>
            <button class="btn btn-orange" style="font-size:15px;" onclick="checkLimitAndRun(execRealCombatSolarCalc)">TÍNH TOÁN CẤU HÌNH CHUỖI PIN</button>
            <div id="toolModalResult" style="margin-top:12px;"></div>
        `);
        setTimeout(() => { updateInverterDropdownByBrand(); fillPanelSpecs(); }, 50);
    } else if (toolId === 'acc') {
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">🔩 Tính Phụ Kiện Lắp Pin Áp Mái</h3>
            <div class="form-group"><label>Tổng số lượng tấm pin (tấm):</label><input type="number" id="accTotalPanels" value="18"></div>
            <div class="form-group"><label>Số dãy pin lắp đặt (dãy):</label><input type="number" id="accRows" value="2"></div>
            <div class="form-group"><label>Cấu hình chân đế:</label><select id="accLegType"><option value="2">Loại 2 chân đế (2 thanh ray / dãy)</option><option value="3">Loại 3 chân đế (3 thanh ray / dãy)</option></select></div>
            <button class="btn btn-primary" onclick="checkLimitAndRun(execAccCalc)">TÍNH PHỤ KIỆN</button>
            <div id="toolModalResult" class="result-box"></div>
        `);
    } else if (toolId === 'vdrop') {
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">⚡ Tính Sụt Áp Trên Đường Dây</h3>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group"><label>Hệ thống điện:</label><select id="vdSystem"><option value="380">3 Pha 380V (AC)</option><option value="220">1 Pha 220V (AC)</option><option value="550">Điện mặt trời DC (~550V)</option></select></div>
                <div class="form-group"><label>Chất liệu lõi dây:</label><select id="vdMaterial"><option value="0.0175">Dây Đồng (Cu)</option><option value="0.0283">Dây Nhôm (Al)</option></select></div>
            </div>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group"><label>Dòng điện tải (A):</label><input type="number" id="vdCurrent" value="25"></div>
                <div class="form-group"><label>Chiều dài dây 1 chiều (m):</label><input type="number" id="vdLength" value="80"></div>
            </div>
            <div class="form-group"><label>Tiết diện dây dẫn (mm²):</label><select id="vdSize"><option value="2.5">2.5 mm²</option><option value="4">4.0 mm²</option><option value="6" selected>6.0 mm²</option><option value="10">10 mm²</option><option value="16">16 mm²</option><option value="25">25 mm²</option></select></div>
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
function cleanPumpExprInput() {
    const inputEl = document.getElementById('spPumpExpr');
    if (!inputEl) return;
    const cleaned = inputEl.value.replace(/[^0-9+\-*/().,\s]/g, '');
    if (inputEl.value !== cleaned) inputEl.value = cleaned;
    updateInverterDropdownByBrand();
}

function evaluatePumpInput() {
    const inputEl = document.getElementById('spPumpExpr');
    if (!inputEl) return;
    const rawExpr = inputEl.value.replace(/,/g, '.').trim();
    if (!rawExpr) return;
    const cleanExpr = rawExpr.replace(/[^0-9+\-*/().\s]/g, '');
    try {
        const val = Function('"use strict";return (' + cleanExpr + ')')();
        if (typeof val === 'number' && !isNaN(val) && val > 0) {
            inputEl.value = Number(val.toFixed(2));
            updateInverterDropdownByBrand();
        }
    } catch (e) {}
}

function parseSafePumpPowerKW() {
    const rawExpr = (document.getElementById('spPumpExpr')?.value || "").replace(/,/g, '.').trim();
    const unit = document.getElementById('spPumpUnit')?.value || "kW";
    if (!rawExpr) return 0;
    const cleanExpr = rawExpr.replace(/[^0-9+\-*/().\s]/g, '');
    try {
        const val = Function('"use strict";return (' + cleanExpr + ')')();
        if (typeof val !== 'number' || isNaN(val) || val <= 0) return 0;
        return unit === "HP" ? (val * 0.75) : val;
    } catch (e) {
        return 0;
    }
}
function updateInverterDropdownByBrand() {
    const brand = document.getElementById('scBrandSelect')?.value || "Power S";
    const stepUp = parseInt(document.getElementById('scLoadType')?.value || "1");
    const pumpKW = parseSafePumpPowerKW();
    const invSelect = document.getElementById('spInvIdx');
    if (!invSelect) return;

    const brandInvs = SOLAR_INVERTERS_DB.map((inv, idx) => ({ ...inv, origIdx: idx }))
                                        .filter(inv => inv.brand === brand);
    if (brandInvs.length === 0) return;

    let displayInvs = brandInvs;
    if (pumpKW > 0) {
        const distinctKWs = [...new Set(brandInvs.map(i => i.kw))].sort((a, b) => a - b);
        let baseIdx = distinctKWs.findIndex(kw => kw >= pumpKW);
        if (baseIdx === -1) baseIdx = distinctKWs.length - 1;
        const targetIdx = Math.min(baseIdx + stepUp, distinctKWs.length - 1);
        const targetKW = distinctKWs[targetIdx];
        const exactMatches = brandInvs.filter(inv => inv.kw === targetKW);
        if (exactMatches.length > 0) displayInvs = exactMatches;
    }

    invSelect.innerHTML = displayInvs.map(inv => `<option value="${inv.origIdx}">${inv.name}</option>`).join('');
    fillInverterSpecs();
}

function fillInverterSpecs() {
    const invIdx = parseInt(document.getElementById('spInvIdx')?.value);
    const inv = SOLAR_INVERTERS_DB[invIdx];
    if (!inv) return;
    document.getElementById('invKwInput').value = inv.kw;
    document.getElementById('invVdcMaxInput').value = inv.vdcMax;
    document.getElementById('invIdcMaxInput').value = inv.idcMax;
    document.getElementById('invMpptMinInput').value = inv.mpptMin;
    document.getElementById('invMpptMaxInput').value = inv.mpptMax;
}

function fillPanelSpecs() {
    const val = document.getElementById('spPanelIdx')?.value;
    if (val === 'custom') return;
    const pan = SOLAR_PANELS_DB[parseInt(val)];
    if (!pan) return;
    document.getElementById('panPmaxInput').value = pan.power;
    document.getElementById('panImpInput').value = pan.imp;
    document.getElementById('panVmpInput').value = pan.vmp;
    document.getElementById('panVocInput').value = pan.voc;
}
function execRealCombatSolarCalc() {
    const invIdx = parseInt(document.getElementById('spInvIdx')?.value);
    const baseInv = SOLAR_INVERTERS_DB[invIdx] || { name: "Biến tần tùy chỉnh", phase: "3 pha 380V", price: 10000000 };
    const invKw = parseFloat(document.getElementById('invKwInput').value) || 0;
    const vdcMax = parseFloat(document.getElementById('invVdcMaxInput').value) || 900;
    const idcMax = parseFloat(document.getElementById('invIdcMaxInput').value) || 40;
    const mpptMin = parseFloat(document.getElementById('invMpptMinInput').value) || 550;
    const mpptMax = parseFloat(document.getElementById('invMpptMaxInput').value) || 680;

    const pMax = parseFloat(document.getElementById('panPmaxInput').value) || 0;
    const imp = parseFloat(document.getElementById('panImpInput').value) || 0;
    const vmp = parseFloat(document.getElementById('panVmpInput').value) || 0;
    const voc = parseFloat(document.getElementById('panVocInput').value) || 0;
    if (invKw <= 0 || pMax <= 0 || vmp <= 0 || voc <= 0) return alert("Vui lòng kiểm tra lại thông số biến tần và tấm pin!");

    const pumpKW = parseSafePumpPowerKW();
    const refKW = pumpKW > 0 ? pumpKW : invKw;
    const is1Phase = (baseInv.phase === "1 pha 220V" || vdcMax <= 500);

    const maxPerStr = Math.floor((vdcMax * 0.95) / voc);
    const minPerStr = Math.max(1, Math.ceil(mpptMin / (vmp * 0.92)));
    const optPerStr = Math.min(maxPerStr, Math.max(minPerStr, Math.round(((mpptMin + mpptMax) / 2) / vmp)));

    let minStrings = Math.max(1, Math.ceil((refKW * 1.25 * 1000) / (minPerStr * pMax)));
    let minPanels = minStrings * minPerStr;

    let optStrings = 1;
    let optPanelsPerStr = optPerStr;
    if ((maxPerStr * pMax) >= (refKW * 1.35 * 1000)) {
        optStrings = 1;
        optPanelsPerStr = Math.min(maxPerStr, Math.max(optPerStr, Math.ceil((refKW * 1.45 * 1000) / pMax)));
    } else {
        optStrings = Math.max(2, Math.ceil((refKW * 1.45 * 1000) / (optPerStr * pMax)));
        optPanelsPerStr = Math.max(minPerStr, Math.ceil((refKW * 1.45 * 1000) / (optStrings * pMax)));
    }
    let optPanels = optStrings * optPanelsPerStr;

    let maxStrings = Math.max(optStrings, Math.floor(idcMax / imp) || 1);
    if (maxStrings > 3) maxStrings = 3;
    let maxPanels = maxStrings * maxPerStr;
    if (maxPanels <= optPanels) {
        maxStrings = optStrings + 1;
        maxPanels = maxStrings * optPanelsPerStr;
    }

    currentSolarPlans = [
        { label: "Phương án tối thiểu", strings: minStrings, perStr: minPerStr, total: minPanels },
        { label: optStrings === 1 ? "⭐ Tối ưu nhất / 1 Chuỗi" : "⭐ Tối ưu nhất (Khuyên dùng)", strings: optStrings, perStr: optPanelsPerStr, total: optPanels },
        { label: "Mở rộng tối đa an toàn", strings: maxStrings, perStr: Math.round(maxPanels / maxStrings), total: maxPanels }
    ];

    renderThreePlanCards(pMax, vmp, voc, imp, vdcMax, idcMax, is1Phase, refKW, baseInv);
}
function renderThreePlanCards(pMax, vmp, voc, imp, vdcMax, idcMax, is1Phase, refKW, baseInv) {
    selectedPlanIdx = 1;
    const cardsHtml = currentSolarPlans.map((pl, idx) => {
        const kwp = ((pl.total * pMax) / 1000).toFixed(2);
        const vmpSum = Math.round(pl.perStr * vmp);
        const vocSum = Math.round(pl.perStr * voc);
        const impSum = (pl.strings * imp).toFixed(1);
        const bestCls = idx === 1 ? 'best-plan active-plan' : '';
        return `
            <div class="plan-card ${bestCls}" id="planCard_${idx}" onclick="selectSolarPlan(${idx})">
                <div class="plan-title">${pl.label}</div>
                <div class="plan-panels">${pl.total} tấm</div>
                <div class="plan-sub">
                    <b>${kwp} kWp</b> (${pl.strings} chuỗi × ${pl.perStr} tấm)<br>
                    Vmp: <b>${vmpSum}V</b> | Voc: <b>${vocSum}V</b><br>
                    Dòng DC: <b>${impSum}A</b> / ${idcMax}A
                </div>
            </div>
        `;
    }).join('');

    const resBox = document.getElementById('toolModalResult');
    resBox.innerHTML = `
        <div style="font-size:13px; color:#334155; margin-bottom:6px;"><i>👆 Chạm vào 1 trong 3 thẻ phương án dưới đây để chọn cấu hình lập báo giá:</i></div>
        <div class="solar-3cards">${cardsHtml}</div>
        <div id="planDetailNote" style="margin-top:10px; padding:10px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; font-size:13px;"></div>
        <button class="btn btn-success" style="width:100%; margin-top:10px; font-size:15px;" onclick="openEditableQuoteModal()">📄 LẬP BẢNG BÁO GIÁ THEO PHƯƠNG ÁN ĐÃ CHỌN</button>
    `;
    selectSolarPlan(1);
}

function selectSolarPlan(idx) {
    selectedPlanIdx = idx;
    document.querySelectorAll('.plan-card').forEach((el, i) => {
        el.classList.toggle('active-plan', i === idx);
    });

    const pl = currentSolarPlans[idx];
    const pMax = parseFloat(document.getElementById('panPmaxInput').value) || 625;
    const imp = parseFloat(document.getElementById('panImpInput').value) || 15.28;
    const invKw = parseFloat(document.getElementById('invKwInput').value) || 15;
    const dcLen = parseFloat(document.getElementById('spDcLen')?.value) || 25;
    const acLen = parseFloat(document.getElementById('spAcLen')?.value) || 60;
    const invIdx = parseInt(document.getElementById('spInvIdx')?.value);
    const invObj = SOLAR_INVERTERS_DB[invIdx] || { name: `Biến tần bơm ${invKw}kW`, phase: "3 pha 380V", price: invKw * 950000 };
    const panVal = document.getElementById('spPanelIdx')?.value;
    const panObj = panVal !== 'custom' ? SOLAR_PANELS_DB[parseInt(panVal)] : { name: `Tấm pin NLMT ${pMax}W`, power: pMax, priceWp: 2950 };

    const totalKWp = (pl.total * pMax) / 1000;
    const impTotal = pl.strings * imp;
    const dcCable = impTotal <= 20 ? "Cáp Solar DC 1x4mm²" : (impTotal <= 35 ? "Cáp Solar DC 1x6mm²" : "Cáp Solar DC 1x10mm²");
    const is1Phase = invObj.phase === "1 pha 220V";
    const wireCores = is1Phase ? "3x" : "4x";
    const acCable = invKw <= 4 ? `Cáp đồng ${wireCores}4mm² (Có PE)` : (invKw <= 11 ? `Cáp đồng ${wireCores}6mm² (Có PE)` : `Cáp đồng ${wireCores}10mm² (Có PE)`);

    const pumpKW = parseSafePumpPowerKW();
    const pumpSummary = pumpKW > 0 ? `${pumpKW} kW` : `Hệ biến tần ${invKw} kW`;
    lastSolarQuoteData = {
        pumpKW: pumpKW || invKw,
        pumpSummary,
        panel: panObj,
        inv: invObj,
        totalPanels: pl.total,
        totalKWp,
        strings: pl.strings,
        panelsPerString: pl.perStr,
        dcLen,
        acLen,
        dcCable,
        acCable
    };

    const noteEl = document.getElementById('planDetailNote');
    if (noteEl) {
        noteEl.innerHTML = `✅ Đang chọn: <b>${pl.label}</b> — <b>${pl.total} tấm</b> (${totalKWp.toFixed(2)} kWp) | Dây dẫn: <b>${dcCable}</b> & <b>${acCable}</b>.`;
    }
}
const QUOTE_ITEM_NAMES = [
    "Tấm pin năng lượng mặt trời", "Biến tần bơm năng lượng mặt trời",
    "Hệ khung giá đỡ nhôm & phụ kiện kẹp", "Tủ điện bảo vệ DC/AC, CB & Chống sét SPD",
    "Cáp chuyên dụng Solar DC (Đỏ + Đen)", "Cáp động lực AC xuống máy bơm",
    "Vật tư phụ, jack MC4 & hệ thống tiếp địa", "Nhân công lắp đặt & cài đặt vận hành"
];
const QUOTE_UNITS = ["Tấm", "Bộ", "kWp", "Tủ", "Mét", "Mét", "Gói", "kWp"];

function openEditableQuoteModal() {
    const d = lastSolarQuoteData;
    if (!d) return;
    const rows = [
        { name: `Tấm pin NLMT ${d.panel.name}`, unit: "Tấm", qty: d.totalPanels, price: d.panel.power * d.panel.priceWp },
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
        <p style="font-size:12px; color:#64748b; margin-top:0;">Cấu hình: Bơm <b>${d.pumpSummary}</b> | Giàn pin <b>${d.totalKWp.toFixed(2)} kWp</b> (${d.strings} chuỗi × ${d.panelsPerString} tấm). <i>Chạm vào ô SL hoặc Đơn giá để sửa:</i></p>
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
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:14px;">
            <button class="btn" style="background:#0068ff; padding:10px; font-size:14px;" onclick="copyQuoteForZalo()">💬 Sao chép gửi Zalo</button>
            <button class="btn btn-primary" style="padding:10px; font-size:14px;" onclick="printFinalQuote()">🖨️ In / Lưu PDF</button>
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
    document.getElementById('qTotalRaw').innerText = rawTotal.toLocaleString('vi-VN');
    document.getElementById('qFinalTotal').innerText = Math.max(0, rawTotal - discount).toLocaleString('vi-VN');
}

function buildFinalQuotePrintHtml() {
    const d = lastSolarQuoteData;
    let rowsHtml = '';
    for (let i = 0; i < 8; i++) {
        const name = document.getElementById(`qName_${i}`)?.innerText || QUOTE_ITEM_NAMES[i];
        const qty = parseFloat(document.getElementById(`qQty_${i}`)?.value) || 0;
        const price = parseFloat(document.getElementById(`qPrice_${i}`)?.value) || 0;
        const sub = Math.round(qty * price);
        if (qty > 0) {
            rowsHtml += `<tr>
                <td style="text-align:center; border:1px solid #cbd5e1; padding:6px;">${i + 1}</td>
                <td style="border:1px solid #cbd5e1; padding:6px;">${name}</td>
                <td style="text-align:center; border:1px solid #cbd5e1; padding:6px;">${QUOTE_UNITS[i]}</td>
                <td style="text-align:center; border:1px solid #cbd5e1; padding:6px;">${qty}</td>
                <td style="text-align:right; border:1px solid #cbd5e1; padding:6px;">${price.toLocaleString('vi-VN')}</td>
                <td style="text-align:right; border:1px solid #cbd5e1; padding:6px; font-weight:bold;">${sub.toLocaleString('vi-VN')}</td>
            </tr>`;
        }
    }
    const rawTotal = document.getElementById('qTotalRaw').innerText;
    const discount = parseFloat(document.getElementById('qDiscount')?.value) || 0;
    const finalTotal = document.getElementById('qFinalTotal').innerText;

    return `<div style="font-family: Arial, sans-serif; color: #1e293b; padding: 15px;">
        <h2 style="text-align:center; color:#0066cc; margin:0 0 6px;">BẢNG BÁO GIÁ HỆ THỐNG BƠM NĂNG LƯỢNG MẶT TRỜI</h2>
        <p style="text-align:center; font-size:13px; margin:0 0 14px;">Cấu hình: Bơm <b>${d.pumpSummary}</b> | Giàn pin <b>${d.totalKWp.toFixed(2)} kWp</b> (${d.strings} chuỗi × ${d.panelsPerString} tấm)</p>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead><tr style="background:#f1f5f9;"><th style="border:1px solid #cbd5e1; padding:7px;">STT</th><th style="border:1px solid #cbd5e1; padding:7px; text-align:left;">Hạng mục thiết bị</th><th style="border:1px solid #cbd5e1; padding:7px;">ĐVT</th><th style="border:1px solid #cbd5e1; padding:7px;">SL</th><th style="border:1px solid #cbd5e1; padding:7px; text-align:right;">Đơn giá (đ)</th><th style="border:1px solid #cbd5e1; padding:7px; text-align:right;">Thành tiền (đ)</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        <div style="margin-top:14px; text-align:right; font-size:14px; line-height:1.7;">
            <div>Tổng cộng: <b>${rawTotal} VNĐ</b></div>
            <div>Giảm giá / Chiết khấu: <b>${discount.toLocaleString('vi-VN')} VNĐ</b></div>
            <div style="font-size:17px; color:#dc2626;">TỔNG THANH TOÁN: <b>${finalTotal} VNĐ</b></div>
        </div>
    </div>`;
}
function copyQuoteForZalo() {
    const d = lastSolarQuoteData;
    if (!d) return;
    let text = `☀️ BÁO GIÁ HỆ THỐNG BƠM NĂNG LƯỢNG MẶT TRỜI\n• Cấu hình: Bơm ${d.pumpSummary} | Giàn pin ${d.totalKWp.toFixed(2)} kWp (${d.strings} chuỗi x ${d.panelsPerString} tấm)\n--------------------------------\n`;
    for (let i = 0; i < 8; i++) {
        const name = document.getElementById(`qName_${i}`)?.innerText || QUOTE_ITEM_NAMES[i];
        const qty = parseFloat(document.getElementById(`qQty_${i}`)?.value) || 0;
        const price = parseFloat(document.getElementById(`qPrice_${i}`)?.value) || 0;
        const sub = document.getElementById(`qSub_${i}`)?.innerText || "0";
        if (qty > 0) text += `${i + 1}. ${name} (SL: ${qty} ${QUOTE_UNITS[i]} × ${price.toLocaleString('vi-VN')}đ): ${sub}đ\n`;
    }
    const discount = parseFloat(document.getElementById('qDiscount')?.value) || 0;
    const finalTotal = document.getElementById('qFinalTotal').innerText;
    text += `--------------------------------\n`;
    if (discount > 0) text += `🎁 Giảm giá: -${discount.toLocaleString('vi-VN')} VNĐ\n`;
    text += `💰 TỔNG THANH TOÁN: ${finalTotal} VNĐ`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => alert("✅ Đã sao chép toàn bộ nội dung Báo Giá vào bộ nhớ tạm!"))
        .catch(() => prompt("Sao chép nội dung báo giá dưới đây để dán vào Zalo:", text));
    } else {
        prompt("Sao chép nội dung báo giá dưới đây để dán vào Zalo:", text);
    }
}

function printFinalQuote() {
    const d = lastSolarQuoteData;
    const cleanPump = d ? d.pumpSummary.replace(/\(.*?\)/g, '').trim() : '';
    const docTitle = d ? `Báo Giá Hệ Bơm ${cleanPump} - Giàn Pin ${d.totalKWp.toFixed(2)} kWp` : 'Báo Giá Hệ Bơm NLMT';
    const printWin = window.open('', '_blank', 'width=850,height=650');
    printWin.document.write(`<html><head><title>${docTitle}</title></head><body>${buildFinalQuotePrintHtml()}</body></html>`);
    printWin.document.close();
    printWin.document.title = docTitle;
    printWin.focus();
    setTimeout(() => { printWin.print(); printWin.close(); }, 300);
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
    const estHP = Math.max(0.5, ((qM3s * totalHead * 9.81) / eff) / 0.7457);
    const stdHPs = [0.5, 1, 1.5, 2, 3, 4, 5.5, 7.5, 10, 12.5, 15, 20, 25, 30];
    const finalHP = stdHPs.find(h => h >= estHP) || Math.ceil(estHP);

    const resBox = document.getElementById('toolModalResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `<p>- Tổng cột áp thực tế: <span class="highlight">${totalHead.toFixed(1)} m</span></p><p>- 🔋 <b>Công suất bơm chọn lựa:</b> <span class="highlight">${finalHP} HP</span> (~<b>${(finalHP * 0.7457).toFixed(2)} kW</b>)</p>`;
}

function execAccCalc() {
    const panels = parseFloat(document.getElementById('accTotalPanels').value) || 0;
    const rows = parseFloat(document.getElementById('accRows').value) || 0;
    const legType = parseInt(document.getElementById('accLegType').value) || 2;
    if (panels <= 0 || rows <= 0 || rows > panels) return alert("Thông số không hợp lệ!");

    const resBox = document.getElementById('toolModalResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `<p>- 📐 <b>Số tấm/dãy:</b> <span class="highlight">${(panels / rows).toFixed(1)}</span> tấm | 🔩 <b>Chân đế:</b> <span class="highlight">${(panels + rows) * legType}</span> cái | 📎 <b>Kẹp biên:</b> <span class="highlight">${rows * 2 * legType}</span> cái | 🔗 <b>Kẹp giữa:</b> <span class="highlight">${(panels - rows) * legType}</span> cái</p>`;
}
function execVdropCalc() {
    const volt = parseFloat(document.getElementById('vdSystem').value) || 380;
    const rho = parseFloat(document.getElementById('vdMaterial').value) || 0.0175;
    const current = parseFloat(document.getElementById('vdCurrent').value) || 0;
    const len = parseFloat(document.getElementById('vdLength').value) || 0;
    const area = parseFloat(document.getElementById('vdSize').value) || 6;

    const vDrop = (((volt === 380) ? Math.sqrt(3) : 2) * rho * len * current) / area;
    const pct = (vDrop / volt) * 100;
    const status = pct <= 3 ? `<span style="color:green; font-weight:bold;">✅ Đạt chuẩn (&le; 3%)</span>` : `<span style="color:red; font-weight:bold;">⚠️ Sụt áp cao (&gt; 3%)!</span>`;

    const resBox = document.getElementById('toolModalResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `<p>- ⚡ <b>Độ sụt áp:</b> <span class="highlight">${vDrop.toFixed(2)} V</span> (<b>${pct.toFixed(2)}%</b>) — ${status}</p>`;
}

function execDividerCalc() {
    const vin = parseFloat(document.getElementById('divVin').value) || 0;
    const r1 = parseFloat(document.getElementById('divR1').value) || 0;
    const r2 = parseFloat(document.getElementById('divR2').value) || 0;
    if (r1 + r2 <= 0) return alert("Giá trị điện trở phải lớn hơn 0!");

    const resBox = document.getElementById('toolModalResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `<p>- 🔌 <b>Điện áp ra Vout:</b> <span class="highlight">${(vin * (r2 / (r1 + r2))).toFixed(2)} V</span> | 🔋 <b>Dòng tiêu thụ:</b> <b>${(vin / (r1 + r2)).toFixed(2)} mA</b></p>`;
}
