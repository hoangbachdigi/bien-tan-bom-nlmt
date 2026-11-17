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
        <button class="btn" style="width:100%; background:#0068ff; font-size:15px;" onclick="copyProductShareLink(${idx}, '${item.title.replace(/'/g, "\\'")}')">🔗 Chia Sẻ / Sao Chép Link Sản Phẩm</button>
    `);
}

function copyProductShareLink(idx, title) {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?sp=${idx}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert(`✅ Đã sao chép đường dẫn sản phẩm "${title}" vào bộ nhớ tạm! Bạn có thể dán gửi ngay cho khách hàng.`);
        }).catch(() => prompt("Sao chép đường dẫn sản phẩm dưới đây:", shareUrl));
    } else {
        prompt("Sao chép đường dẫn sản phẩm dưới đây:", shareUrl);
    }
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
        return `<tr><td><span class="badge ${badgeCls}">${e.brand}</span></td><td><b style="color:var(--danger);">${e.code}</b></td><td>${e.desc}</td><td>${e.fix}</td></tr>`;
    }).join('');

    pag.innerHTML = Array.from({ length: totalPages }, (_, i) => `
        <button class="page-btn ${i + 1 === page ? 'active' : ''}" onclick="renderErrorsPage(${i + 1})">${i + 1}</button>
    `).join('');
}
function getCombinedKnowledge() {
    const realBlogs = appData.configs.filter(c => c.code === 'KIEN_THUC').map(c => ({
        title: c.title, date: "Mới cập nhật", content: c.content, video: c.media
    }));
    return [...realBlogs, ...MOCK_KNOWLEDGE];
}

function renderKnowledgePage() {
    const listArea = document.getElementById('knowledgeListArea');
    if (!listArea) return;
    listArea.innerHTML = getCombinedKnowledge().map((b, idx) => `
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
    { id: 'solar', icon: '☀️', title: 'Chọn biến tần và công suất giàn pin', desc: 'Phối ghép 28 mã pin & 47 biến tần, phân chuỗi an toàn và lập báo giá chi tiết.' },
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
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">☀️ Tính Toán & Phối Ghép Hệ Thống Bơm NLMT</h3>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group">
                    <label>Công suất bơm (Nhập số hoặc phép tính VD: 7.5+2.2):</label>
                    <div class="input-unit-group">
                        <input type="text" id="spPumpExpr" inputmode="decimal" value="7.5" placeholder="VD: 7.5 + 2.2" oninput="cleanPumpExprInput()" onkeyup="cleanPumpExprInput()" onblur="evaluatePumpInput()" onkeydown="if(event.key==='Enter'){evaluatePumpInput();}">
                        <select id="spPumpUnit" onchange="filterAndSelectInverters()">
                            <option value="kW" selected>kW</option>
                            <option value="HP">HP</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Nguồn điện máy bơm:</label>
                    <select id="spPumpPhase" onchange="filterAndSelectInverters()">
                        <option value="3 pha 380V" selected>3 Pha 380V (Khuyên dùng)</option>
                        <option value="1 pha 220V">1 Pha 220V (Bơm dân dụng)</option>
                    </select>
                </div>
            </div>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group">
                    <label>Loại máy bơm thực tế:</label>
                    <select id="spPumpType" onchange="filterAndSelectInverters()">
                        <option value="gieng" selected>Bơm hỏa tiễn thả giếng sâu (Vượt tối đa 1 cấp)</option>
                        <option value="can">Bơm ly tâm đặt cạn / trục đứng (Vượt tối đa 1 cấp)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Chiều dài dây AC xuống bơm (m):</label>
                    <input type="number" id="spAcLen" value="80" oninput="filterAndSelectInverters()">
                </div>
            </div>
            <div class="form-group">
                <label id="invFilterLabel">Chọn mã biến tần (Chỉ hiển thị đúng cấp công suất đề xuất):</label>
                <select id="spInvIdx" onchange="filterOptimalPanels()"></select>
            </div>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group">
                    <label id="panelFilterLabel">Chọn mã tấm pin phù hợp (Đã ẩn mã dư thừa):</label>
                    <select id="spPanelIdx"></select>
                </div>
                <div class="form-group">
                    <label>Chiều dài dây DC từ pin tới tủ (m):</label>
                    <input type="number" id="spDcLen" value="25">
                </div>
            </div>
            <button class="btn btn-orange" onclick="checkLimitAndRun(execSolarSystemCalc)">TÍNH TOÁN & KIỂM TRA AN TOÀN HỆ THỐNG</button>
            <div id="toolModalResult" class="result-box"></div>
        `);
        setTimeout(filterAndSelectInverters, 50);
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
    filterAndSelectInverters();
}

function evaluatePumpInput() {
    const inputEl = document.getElementById('spPumpExpr');
    if (!inputEl) return;
    const rawExpr = inputEl.value.replace(/,/g, '.').trim();
    const cleanExpr = rawExpr.replace(/[^0-9+\-*/().\s]/g, '');
    try {
        const val = Function('"use strict";return (' + cleanExpr + ')')();
        if (typeof val === 'number' && !isNaN(val) && val > 0) {
            inputEl.value = Number(val.toFixed(2));
            filterAndSelectInverters();
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
function filterAndSelectInverters() {
    const pumpKW = parseSafePumpPowerKW();
    const phase = document.getElementById('spPumpPhase')?.value || "3 pha 380V";
    const pumpType = document.getElementById('spPumpType')?.value || "gieng";
    const acLen = parseFloat(document.getElementById('spAcLen')?.value) || 0;
    const invSelect = document.getElementById('spInvIdx');
    const lbl = document.getElementById('invFilterLabel');
    if (!invSelect) return;

    const validInvs = SOLAR_INVERTERS_DB.map((inv, idx) => ({ ...inv, origIdx: idx }))
                                        .filter(inv => inv.phase === phase);
    if (validInvs.length === 0) return;

    const distinctKWs = [...new Set(validInvs.map(i => i.kw))].sort((a, b) => a - b);
    const activePumpKW = pumpKW > 0 ? pumpKW : 0.1;

    let loadFactor = 1.05;
    if (phase === "1 pha 220V") {
        loadFactor = 1.35;
    } else if (pumpType === "gieng") {
        loadFactor = (acLen > 60) ? 1.35 : 1.2;
    }

    const reqKW = activePumpKW * loadFactor;
    let baseIdx = distinctKWs.findIndex(kw => kw >= activePumpKW);
    if (baseIdx === -1) baseIdx = distinctKWs.length - 1;
    const maxAllowedIdx = Math.min(baseIdx + 1, distinctKWs.length - 1);

    let targetIdx = distinctKWs.findIndex(kw => kw >= reqKW);
    if (targetIdx === -1 || targetIdx > maxAllowedIdx) targetIdx = maxAllowedIdx;

    const recommendedKW = distinctKWs[targetIdx];
    const matchedInvs = validInvs.filter(inv => inv.kw === recommendedKW);

    if (lbl) lbl.innerHTML = `Chọn mã biến tần cấp <b style="color:var(--danger);">${recommendedKW} kW</b> (Đã ẩn các cấp khác):`;
    invSelect.innerHTML = matchedInvs.map(inv => 
        `<option value="${inv.origIdx}">${inv.name} (VdcMax: ${inv.vdcMax}V, IdcMax: ${inv.idcMax}A)</option>`
    ).join('');

    filterOptimalPanels();
}
function filterOptimalPanels() {
    const pumpKW = parseSafePumpPowerKW();
    const pumpType = document.getElementById('spPumpType')?.value || "gieng";
    const acLen = parseFloat(document.getElementById('spAcLen')?.value) || 0;
    const invIdx = parseInt(document.getElementById('spInvIdx')?.value);
    const panelSelect = document.getElementById('spPanelIdx');
    const panelLbl = document.getElementById('panelFilterLabel');
    if (!panelSelect || isNaN(invIdx)) return;

    const inv = SOLAR_INVERTERS_DB[invIdx];
    const activePumpKW = pumpKW > 0 ? pumpKW : 0.1;
    let pumpFactor = 1.45;
    if (pumpType === 'gieng') pumpFactor = (acLen >= 80) ? 1.65 : 1.55;
    const targetWatts = activePumpKW * pumpFactor * 1000;
    const effectiveMpptMin = (inv.phase === "3 pha 380V") ? Math.max(inv.mpptMin, 485) : inv.mpptMin;

    const evaluated = SOLAR_PANELS_DB.map((p, idx) => {
        const minByPower = Math.ceil(targetWatts / p.power);
        const maxStr = Math.floor((inv.vdcMax * 0.96) / (p.voc * 1.06));
        const minStr = Math.ceil(effectiveMpptMin / (p.vmp * 0.86));
        if (maxStr < minStr) return null;

        let strings = 1;
        let perStr = minByPower;
        const max1StrKWp = (maxStr * p.power) / 1000;
        if (minByPower <= maxStr) {
            strings = 1;
            perStr = Math.max(minByPower, minStr);
        } else if ((minByPower - maxStr) <= 3 && max1StrKWp >= (activePumpKW * 1.4)) {
            strings = 1;
            perStr = maxStr;
        } else {
            strings = Math.ceil(minByPower / maxStr);
            perStr = Math.max(Math.ceil(minByPower / strings), minStr);
        }
        const totalPanels = strings * perStr;
        const totalKWp = (totalPanels * p.power) / 1000;
        if ((strings * p.imp) > inv.idcMax) return null;

        return { ...p, origIdx: idx, totalPanels, totalKWp, strings, perStr };
    }).filter(Boolean);

    evaluated.sort((a, b) => a.totalKWp - b.totalKWp);
    const minKWp = evaluated.length > 0 ? evaluated[0].totalKWp : 0;
    const optimalPanels = evaluated.filter(e => e.totalKWp <= minKWp + 1.0);
    const finalPanels = optimalPanels.length > 0 ? optimalPanels : evaluated;

    if (panelLbl) panelLbl.innerHTML = `Chọn mã tấm pin tối ưu (Hiện <b>${finalPanels.length}/${SOLAR_PANELS_DB.length}</b> mã tiết kiệm nhất):`;
    panelSelect.innerHTML = finalPanels.map(p => 
        `<option value="${p.origIdx}">${p.name} ➔ ${p.totalPanels} tấm (${p.strings} chuỗi × ${p.perStr} tấm = ${p.totalKWp.toFixed(2)} kWp)</option>`
    ).join('');
}


function execSolarSystemCalc() {
    const pumpKW = parseSafePumpPowerKW();
    const unit = document.getElementById('spPumpUnit').value;
    const rawExpr = document.getElementById('spPumpExpr').value.trim();
    const phase = document.getElementById('spPumpPhase').value;
    const pumpType = document.getElementById('spPumpType').value;
    const panel = SOLAR_PANELS_DB[parseInt(document.getElementById('spPanelIdx').value)];
    const inv = SOLAR_INVERTERS_DB[parseInt(document.getElementById('spInvIdx').value)];
    const dcLen = parseFloat(document.getElementById('spDcLen').value) || 0;
    const acLen = parseFloat(document.getElementById('spAcLen').value) || 0;

    if (pumpKW <= 0 || !inv || !panel) return alert("Vui lòng nhập công suất máy bơm hợp lệ!");

    let pumpFactor = 1.45;
    if (pumpType === 'gieng') {
        pumpFactor = (acLen >= 80) ? 1.65 : 1.55;
    }
    const targetWatts = pumpKW * pumpFactor * 1000;
    const minPanelsByPower = Math.ceil(targetWatts / panel.power);

    const vocColdUnit = panel.voc * 1.06;
    const vmpHotUnit = panel.vmp * 0.86;
    const effectiveMpptMin = (inv.phase === "3 pha 380V") ? Math.max(inv.mpptMin, 485) : inv.mpptMin;
    const maxPanelsPerString = Math.floor((inv.vdcMax * 0.96) / vocColdUnit);
    const minPanelsPerString = Math.ceil(effectiveMpptMin / vmpHotUnit);

    if (maxPanelsPerString < minPanelsPerString) {
        return alert("⚠️ Mã tấm pin và biến tần này không tương thích dải điện áp MPPT. Vui lòng chọn biến tần có Vdc_max cao hơn!");
    }
    let strings = 1;
    let panelsPerString = minPanelsByPower;
    const max1StringKWp = (maxPanelsPerString * panel.power) / 1000;

    if (minPanelsByPower <= maxPanelsPerString) {
        strings = 1;
        panelsPerString = Math.max(minPanelsByPower, minPanelsPerString);
    } else if ((minPanelsByPower - maxPanelsPerString) <= 2 && max1StringKWp >= (pumpKW * 1.45)) {
        strings = 1;
        panelsPerString = maxPanelsPerString;
    } else {
        strings = Math.ceil(minPanelsByPower / maxPanelsPerString);
        panelsPerString = Math.max(Math.ceil(minPanelsByPower / strings), minPanelsPerString);
    }

    const totalPanels = strings * panelsPerString;
    const totalKWp = (totalPanels * panel.power) / 1000;
    const vocColdTotal = panelsPerString * vocColdUnit;
    const vmpHotTotal = panelsPerString * vmpHotUnit;
    const impTotal = strings * panel.imp;

    const dcCable = impTotal <= 20 ? "Cáp Solar DC 1x4mm²" : (impTotal <= 35 ? "Cáp Solar DC 1x6mm²" : "Cáp Solar DC 1x10mm²");
    const is1Phase = (phase === "1 pha 220V");
    const wireCores = is1Phase ? "3x" : "4x";
    const maxVdrop = is1Phase ? 6.6 : 11.4;
    const cosPhi = (pumpType === 'gieng') ? 0.78 : 0.85;
    const iMotor = is1Phase ? (pumpKW * 1000) / (220 * cosPhi) : (pumpKW * 1000) / (Math.sqrt(3) * 380 * cosPhi);
    const dropFactor = is1Phase ? 2 : Math.sqrt(3);

    const stdSizes = [2.5, 4, 6, 10, 16, 25, 35, 50, 70];
    let chosenAcSize = stdSizes.find(s => ((dropFactor * 0.0175 * acLen * iMotor) / s) <= maxVdrop) || 70;
    if (iMotor > 11 && chosenAcSize < 4) chosenAcSize = 4;
    if (iMotor > 18 && chosenAcSize < 6) chosenAcSize = 6;
    if (iMotor > 28 && chosenAcSize < 10) chosenAcSize = 10;
    const acCable = `Cáp đồng ${wireCores}${chosenAcSize}mm² (Có dây tiếp địa PE)`;
    let reactorNote = "Không bắt buộc.";
    if (pumpType === 'gieng') {
        if (acLen >= 100) {
            reactorNote = `<span style="color:#dc2626; font-weight:bold;">⚠️ Bắt buộc lắp thêm Cuộn kháng đầu ra (Output Reactor) để chống sóng phản xạ cháy motor (cáp dài ${acLen}m)</span>`;
        } else if (acLen >= 50) {
            reactorNote = `<span style="color:#d97706; font-weight:bold;">Khuyến nghị lắp thêm Cuộn kháng đầu ra (cáp dài ${acLen}m)</span>`;
        }
    }

    let warnings = [];
    if (inv.phase !== phase) warnings.push(`Sai pha điện áp! Bơm dùng ${phase} nhưng biến tần xuất ra ${inv.phase}.`);
    if (inv.kw < pumpKW) warnings.push(`Biến tần (${inv.kw}kW) nhỏ hơn công suất thực của bơm (${pumpKW.toFixed(2)}kW)!`);
    if (vocColdTotal > inv.vdcMax) warnings.push(`Quá áp buổi sáng lạnh (${vocColdTotal.toFixed(0)}V > ${inv.vdcMax}V)!`);
    if (vmpHotTotal < effectiveMpptMin) warnings.push(`Thiếu áp buổi trưa nắng nóng (${vmpHotTotal.toFixed(0)}V < ${effectiveMpptMin}V)!`);
    if (impTotal > inv.idcMax) warnings.push(`Nghẽn dòng DC (${impTotal.toFixed(1)}A > ${inv.idcMax}A)! Hãy đổi sang mã pin dòng thấp hơn hoặc chọn biến tần có Idc_max lớn hơn.`);
    if (is1Phase) warnings.push(`Lưu ý bơm 1 pha: Cần kiểm tra đấu đúng sơ đồ bỏ tụ đề (3 dây) nếu biến tần yêu cầu.`);

    const statusHtml = warnings.length === 0 
        ? `<div style="padding:8px; background:#dcfce7; color:#166534; border-radius:5px; font-weight:bold; margin-top:8px;">✅ PHỐI GHÉP ĐẠT CHUẨN KỸ THUẬT 100%</div>` 
        : `<div style="padding:8px; background:#fee2e2; color:#991b1b; border-radius:5px; font-weight:bold; margin-top:8px;">⚠️ CẢNH BÁO KỸ THUẬT:<br>• ${warnings.join('<br>• ')}</div>`;

    const pumpSummary = unit === "HP" ? `${rawExpr} HP (Quy đổi: ${pumpKW.toFixed(2)} kW)` : `${pumpKW.toFixed(2)} kW`;
    lastSolarQuoteData = { pumpKW: Number(pumpKW.toFixed(2)), pumpSummary, factor: pumpFactor, panel, inv, totalPanels, totalKWp, strings, panelsPerString, dcLen, acLen, dcCable, acCable };

    const resBox = document.getElementById('toolModalResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <h4 style="margin:0 0 8px; color:var(--secondary);">KẾT QUẢ TÍNH TOÁN & PHỐI GHÉP CHUẨN</h4>
        <p>- 🔋 <b>Tổng tải bơm thực:</b> <b>${pumpSummary}</b> (Hệ số pin: <b>${pumpFactor}</b>) | ⚙️ <b>Biến tần:</b> <b>${inv.name}</b></p>
        <p>- 🧩 <b>Tổng số tấm pin:</b> <span class="highlight">${totalPanels} tấm</span> ${panel.name} (<b>${totalKWp.toFixed(2)} kWp</b>)</p>
        <p>- 🔌 <b>Sơ đồ đấu nối:</b> Chia <b>${strings} chuỗi (String)</b> × <span class="highlight">${panelsPerString} tấm/chuỗi</span></p>
        <p>- ⚡ <b>Điện áp & Dòng DC:</b> Voc lạnh (+6%) = <b>${vocColdTotal.toFixed(0)}V</b> (Max ${inv.vdcMax}V) | Vmp nóng (-14%) = <b>${vmpHotTotal.toFixed(0)}V</b> (Min ${effectiveMpptMin}V) | Imp = <b>${impTotal.toFixed(1)}A</b> (Max ${inv.idcMax}A)</p>
        <p>- 🧵 <b>Dây dẫn chuẩn sụt áp ≤ 3%:</b> ${dcCable} (${dcLen * 2}m) | ${acCable} (${acLen}m)</p>
        <p>- 🛡️ <b>Cuộn kháng đầu ra:</b> ${reactorNote}</p>
        ${statusHtml}
        <button class="btn btn-success" style="width:100%; margin-top:12px; font-size:15px;" onclick="openEditableQuoteModal()">📄 LẬP BẢNG BÁO GIÁ (CHO PHÉP SỬA GIÁ)</button>
    `;
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
        navigator.clipboard.writeText(text).then(() => alert("✅ Đã sao chép toàn bộ nội dung Báo Giá vào bộ nhớ tạm! Bạn chỉ cần mở Zalo và bấm Dán để gửi cho khách."))
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
