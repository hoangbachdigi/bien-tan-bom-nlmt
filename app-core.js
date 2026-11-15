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

// TAB 1: THÔNG TIN SẢN PHẨM (20 SP/TRANG + POPUP 10 DÒNG MÔ TẢ)
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
// TAB 2: XỬ LÝ LỖI BIẾN TẦN (TÌM KIẾM + LỌC HÃNG + 20 DÒNG/TRANG)
function getCombinedErrors() {
    const realErrors = appData.configs.filter(c => c.code === 'MA_LOI').map(c => {
        const bParts = c.title.split('|');
        const cParts = c.content.split('|');
        return {
            brand: (bParts[0] || "PowerS").trim(),
            code: (bParts[1] || "").trim(),
            desc: (cParts[0] || "").trim(),
            fix: (cParts[1] || "").trim()
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

// TAB 4: KIẾN THỨC (DANH SÁCH 1 CỘT + POPUP CHI TIẾT)
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
        const panelOpts = SOLAR_PANELS_DB.map((p, i) => `<option value="${i}" ${p.name.includes('610W (132-cell') ? 'selected' : ''}>${p.name}</option>`).join('');
        const invOpts = SOLAR_INVERTERS_DB.map((inv, i) => `<option value="${i}" ${inv.name.includes('SG800-011GB') ? 'selected' : ''}>${inv.name}</option>`).join('');
        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">☀️ Tính Toán & Phối Ghép Hệ Thống Bơm NLMT</h3>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group"><label>Công suất máy bơm (kW):</label><input type="number" id="spPumpKW" value="7.5" step="0.1"></div>
                <div class="form-group">
                    <label>Loại máy bơm:</label>
                    <select id="spPumpType">
                        <option value="1.4" selected>Bơm hỏa tiễn (Hệ số 1.4)</option>
                        <option value="1.3">Bơm đặt cạn (Hệ số 1.3)</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Chọn mã tấm pin mặt trời (36 mã):</label><select id="spPanelIdx">${panelOpts}</select></div>
            <div class="form-group"><label>Chọn mã biến tần bơm NLMT (47 mã):</label><select id="spInvIdx">${invOpts}</select></div>
            <div class="grid-2" style="gap:10px;">
                <div class="form-group"><label>Chiều dài dây DC từ pin tới tủ (m):</label><input type="number" id="spDcLen" value="25"></div>
                <div class="form-group"><label>Chiều dài dây AC xuống bơm (m):</label><input type="number" id="spAcLen" value="80"></div>
            </div>
            <button class="btn btn-orange" onclick="checkLimitAndRun(execSolarSystemCalc)">TÍNH TOÁN & PHỐI GHÉP HỆ THỐNG</button>
            <div id="toolModalResult" class="result-box"></div>
        `);
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
function execSolarSystemCalc() {
    const pumpKW = parseFloat(document.getElementById('spPumpKW').value) || 0;
    const factor = parseFloat(document.getElementById('spPumpType').value) || 1.4;
    const panel = SOLAR_PANELS_DB[parseInt(document.getElementById('spPanelIdx').value)];
    const inv = SOLAR_INVERTERS_DB[parseInt(document.getElementById('spInvIdx').value)];
    const dcLen = parseFloat(document.getElementById('spDcLen').value) || 0;
    const acLen = parseFloat(document.getElementById('spAcLen').value) || 0;

    if (pumpKW <= 0) return alert("Vui lòng nhập công suất máy bơm!");

    // 1. Tính số tấm pin tối thiểu theo công suất bơm
    const minPanelsByPower = Math.ceil((pumpKW * factor * 1000) / panel.power);
    // 2. Số tấm tối đa & tối thiểu 1 chuỗi (Hệ số an toàn 1.1 lạnh và 0.85 nóng)
    const maxPanelsPerString = Math.floor(inv.vdcMax / (panel.voc * 1.1));
    const minPanelsPerString = Math.ceil(inv.mpptMin / (panel.vmp * 0.85));

    let strings = 1;
    let panelsPerString = minPanelsByPower;
    if (minPanelsByPower > maxPanelsPerString) {
        strings = Math.ceil(minPanelsByPower / maxPanelsPerString);
        panelsPerString = Math.ceil(minPanelsByPower / strings);
    }
    if (panelsPerString < minPanelsPerString) {
        panelsPerString = minPanelsPerString;
    }

    const totalPanels = strings * panelsPerString;
    const totalKWp = (totalPanels * panel.power) / 1000;
    const vocTotal = panelsPerString * panel.voc;
    const vmpTotal = panelsPerString * panel.vmp;
    const impTotal = strings * panel.imp;

    // Đề xuất dây dẫn & cuộn kháng
    const dcCable = impTotal <= 20 ? "Cáp Solar DC 1x4mm²" : (impTotal <= 35 ? "Cáp Solar DC 1x6mm²" : "Cáp Solar DC 1x10mm²");
    const acCable = inv.iOut <= 18 ? "Cáp đồng 3x4mm²" : (inv.iOut <= 28 ? "Cáp đồng 3x6mm²" : (inv.iOut <= 45 ? "Cáp đồng 3x10mm²" : "Cáp đồng 3x16mm²"));
    const reactorNote = (factor === 1.4 && acLen >= 50) ? "Nên lắp thêm Cuộn kháng đầu ra (Output Reactor) bảo vệ bơm thả sâu" : "Không bắt buộc";

    // Kiểm tra cảnh báo an toàn
    let warnings = [];
    if (inv.kw < pumpKW) warnings.push("Công suất biến tần đang nhỏ hơn công suất bơm!");
    if (vocTotal * 1.1 > inv.vdcMax) warnings.push("Điện áp hở mạch buổi sáng lạnh vượt ngưỡng Vdc_max!");
    if (impTotal > inv.idcMax) warnings.push("Tổng dòng DC vượt ngưỡng chịu đựng Idc_max của biến tần!");
    const statusHtml = warnings.length === 0 
        ? `<span style="color:green; font-weight:bold;">✅ PHỐI GHÉP AN TOÀN & TỐI ƯU</span>` 
        : `<span style="color:red; font-weight:bold;">⚠️ CẢNH BÁO: ${warnings.join(' | ')}</span>`;

    // Lưu dữ liệu sang bộ tạo Báo Giá
    lastSolarQuoteData = {
        pumpKW, factor, panel, inv, totalPanels, totalKWp, strings, panelsPerString,
        dcLen, acLen, dcCable, acCable
    };

    const resBox = document.getElementById('toolModalResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <h4 style="margin:0 0 8px; color:var(--secondary);">KẾT QUẢ PHỐI GHÉP KỸ THUẬT</h4>
        <p>- 🧩 <b>Tổng số tấm pin chốt phương án:</b> <span class="highlight">${totalPanels} tấm</span> (<b>${totalKWp.toFixed(2)} kWp</b>)</p>
        <p>- 🔌 <b>Sơ đồ đấu nối:</b> Chia <b>${strings} chuỗi (String)</b> × <b>${panelsPerString} tấm/chuỗi</b></p>
        <p>- ⚡ <b>Thông số điện giàn pin:</b> Voc = <b>${vocTotal.toFixed(1)}V</b> | Vmp = <b>${vmpTotal.toFixed(1)}V</b> | Imp = <b>${impTotal.toFixed(1)}A</b></p>
        <p>- 🧵 <b>Vật tư dây dẫn:</b> ${dcCable} (${dcLen * 2}m) | ${acCable} (${acLen}m)</p>
        <p>- 🛡️ <b>Cuộn kháng đầu ra:</b> ${reactorNote}</p>
        <p>- 📋 <b>Trạng thái hệ thống:</b> ${statusHtml}</p>
        <button class="btn btn-success" style="width:100%; margin-top:10px; font-size:15px;" onclick="openEditableQuoteModal()">📄 LẬP BẢNG BÁO GIÁ (CHO PHÉP SỬA GIÁ)</button>
    `;
}

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
            <td>${i + 1}</td>
            <td><b>${r.name}</b></td>
            <td>${r.unit}</td>
            <td><input type="number" class="quote-qty" id="qQty_${i}" value="${r.qty}" oninput="recalcQuoteTotal()"></td>
            <td><input type="number" class="quote-input" id="qPrice_${i}" value="${r.price}" oninput="recalcQuoteTotal()"></td>
            <td style="text-align:right; font-weight:600;" id="qSub_${i}">${(r.qty * r.price).toLocaleString('vi-VN')}</td>
        </tr>
    `).join('');

    openGlobalModal(`
        <h3 style="margin:0 0 6px; color:var(--primary);">📄 BẢNG BÁO GIÁ HỆ THỐNG BƠM NĂNG LƯỢNG MẶT TRỜI</h3>
        <p style="font-size:12.5px; color:#64748b; margin-top:0;">Cấu hình: Bơm <b>${d.pumpKW}kW</b> | Giàn pin <b>${d.totalKWp.toFixed(2)} kWp</b> (${d.strings} chuỗi × ${d.panelsPerString} tấm). <i>Bạn có thể gõ trực tiếp vào ô Số lượng hoặc Đơn giá để điều chỉnh:</i></p>
        <div class="table-wrap">
            <table class="data-table">
                <thead><tr><th>STT</th><th>Hạng mục thiết bị</th><th>ĐVT</th><th>SL</th><th>Đơn giá (đ)</th><th style="text-align:right;">Thành tiền</th></tr></thead>
                <tbody>${trHtml}</tbody>
            </table>
        </div>
        <div style="margin-top:12px; text-align:right; font-size:14px;">
            <div>Tổng cộng trước chiết khấu: <b id="qTotalRaw">0</b> đ</div>
            <div style="margin:6px 0;">Giảm giá / Chiết khấu (đ): <input type="number" class="quote-input" id="qDiscount" value="0" oninput="recalcQuoteTotal()"></div>
            <div style="font-size:17px; color:var(--danger); margin-top:6px;">TỔNG THANH TOÁN: <b id="qFinalTotal">0</b> VNĐ</div>
        </div>
        <div style="display:flex; gap:10px; margin-top:14px;">
            <button class="btn btn-primary" onclick="window.print()">🖨️ In / Xuất PDF Báo Giá</button>
            <button class="btn btn-outline" onclick="closeGlobalModal()">Đóng</button>
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
