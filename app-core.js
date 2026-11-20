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
        const isMob = window.innerWidth <= 768;
        const opts = isMob
            ? { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }
            : { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
        const vnStr = now.toLocaleDateString('vi-VN', opts);
        el.innerText = "📅 " + vnStr.charAt(0).toUpperCase() + vnStr.slice(1);
    } catch (e) { el.innerText = "📅 Hôm nay"; }
}

function checkSharedProductUrl() {
    const params = new URLSearchParams(window.location.search);
    const spIdx = params.get('sp');
    if (spIdx !== null && !isNaN(parseInt(spIdx))) openProductDetail(parseInt(spIdx));
}

function toggleMobileDrawer() {
    document.getElementById('mobileDrawer').classList.toggle('open');
}

function selectMobileDrawer(pageFile, labelText, el) {
    document.querySelectorAll('.drawer-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    const lblEl = document.getElementById('mobileCurrentPageLabel');
    if (lblEl) lblEl.innerText = labelText;
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
        appData.users = [{ username: 'nguyenhoangbach', role: 'admin', status: 'approved' }, ...(data.users || []).map(u => ({ ...u, role: 'user' }))];
        appData.configs = data.configs || [];
        appData.logs = data.logs || [];
        localStorage.setItem('solar_app_cache', JSON.stringify(appData));
        applyBannerFromConfig();
        if (currentUser) {
            const freshUser = appData.users.find(u => u.username === currentUser.username);
            if (freshUser) { currentUser = freshUser; sessionStorage.setItem('current_user', JSON.stringify(currentUser)); }
        }
        updateTopUserBar();
    } catch (e) {}
}

function updateTopUserBar() {
    const statusText = document.getElementById('userStatusText');
    const btnLabel = document.getElementById('userBtnLabel');
    const isMob = window.innerWidth <= 768;
    if (currentUser) {
        if (currentUser.role === 'admin') {
            statusText.innerHTML = isMob ? `😎 <b style="color:var(--primary)">${currentUser.username}</b>` : `😎 Admin: <b style="color:var(--primary)">${currentUser.username}</b>`;
            btnLabel.innerText = "Quản trị";
        } else {
            const st = currentUser.status === 'approved' ? '<span style="color:#4ade80">Vô hạn</span>' : '<span style="color:#fbbf24">Chờ duyệt</span>';
            statusText.innerHTML = isMob ? `👤 <b>${currentUser.username}</b> (${st})` : `👤 Zalo: <b>${currentUser.username}</b> (${st})`;
            btnLabel.innerText = "Tài khoản";
        }
    } else {
        let left = Math.max(0, 3 - guestCount);
        statusText.innerHTML = isMob ? `🔮 Còn <b style="color:#f87171">${left}</b> lượt` : `🔮 Khách vãng lai (Còn <b style="color:#f87171">${left}</b> lượt tính)`;
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
    document.body.style.overflow = 'hidden';
}

function closeGlobalModal() {
    document.getElementById('globalModal').style.display = 'none';
    document.body.style.overflow = '';
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

let currentProdSliderImgs = [];
let currentProdSlideIdx = 0;

function getCombinedProducts() {
    const realItems = appData.configs.filter(c => c.code === 'SAN_PHAM').map(c => {
        const imgList = (c.media || "").split(/\||,/).map(s => s.trim()).filter(Boolean);
        return {
            title: c.title,
            imgs: imgList.length > 0 ? imgList : ["https://unsplash.com"],
            specs: c.content
        };
    });
    const mockFormatted = MOCK_PRODUCTS.map(m => ({
        title: m.title,
        imgs: (m.img || "").split(/\||,/).map(s => s.trim()).filter(Boolean),
        specs: m.specs
    }));
    return realItems.length > 0 ? [...realItems, ...mockFormatted] : mockFormatted;
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
        const coverImg = item.imgs[0];
        return `<div class="item-card" onclick="openProductDetail(${globalIdx})"><img class="card-thumb" src="${coverImg}" alt="${item.title}" loading="lazy"><div class="card-body"><h3 class="card-heading">${item.title}</h3><p class="card-desc-2line">${shortDesc}</p></div></div>`;
    }).join('');
    pag.innerHTML = Array.from({ length: totalPages }, (_, i) => `<button class="page-btn ${i + 1 === page ? 'active' : ''}" onclick="renderProductsPage(${i + 1})">${i + 1}</button>`).join('');
}

function openProductDetail(idx) {
    const item = getCombinedProducts()[idx];
    if (!item) return;
    currentProdSliderImgs = item.imgs;
    currentProdSlideIdx = 0;

    const lines = item.specs.split(/\||\n/).map(s => s.trim()).filter(Boolean);
    const specListHtml = lines.map(line => `<li style="margin-bottom:6px; color:#334155;">✅ ${line}</li>`).join('');
    const hasMulti = currentProdSliderImgs.length > 1;

    const sliderNavHtml = hasMulti ? `
        <button class="slider-nav-btn slider-prev" onclick="changeProdSlide(-1)">&#10094;</button>
        <button class="slider-nav-btn slider-next" onclick="changeProdSlide(1)">&#10095;</button>
    ` : '';

    const thumbsHtml = hasMulti ? `<div class="prod-thumbs-row">${currentProdSliderImgs.map((src, i) => `
        <img src="${src}" class="prod-thumb-item ${i === 0 ? 'active' : ''}" id="pThumb_${i}" onclick="goToProdSlide(${i})">
    `).join('')}</div>` : '';

    openGlobalModal(`
        <div class="prod-slider-wrap">
            <img id="prodSliderMainImg" class="prod-slider-img" src="${currentProdSliderImgs[0]}" alt="${item.title}">
            ${sliderNavHtml}
        </div>
        ${thumbsHtml}
        <h3 style="margin:0 0 12px; color:var(--primary); font-size:18px;">${item.title}</h3>
        <ul style="padding-left:18px; margin:0 0 16px; list-style:none;">${specListHtml}</ul>
        <button class="btn" style="width:100%; background:#0068ff; font-size:15px;" onclick="copyProductShareLink(${idx}, '${item.title.replace(/'/g, "\\'")}')">🔗 Chia Sẻ / Sao Chép Link Sản Phẩm</button>
    `);
}

function changeProdSlide(step) {
    if (currentProdSliderImgs.length <= 1) return;
    currentProdSlideIdx = (currentProdSlideIdx + step + currentProdSliderImgs.length) % currentProdSliderImgs.length;
    goToProdSlide(currentProdSlideIdx);
}

function goToProdSlide(idx) {
    currentProdSlideIdx = idx;
    const mainImg = document.getElementById('prodSliderMainImg');
    if (mainImg) mainImg.src = currentProdSliderImgs[idx];
    document.querySelectorAll('.prod-thumb-item').forEach((el, i) => el.classList.toggle('active', i === idx));
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
    { id: 'solar', icon: '☀️', title: 'Tính Toán Chuỗi Pin & Biến Tần Bơm NLMT', desc: 'Chọn biến tần theo hãng, nhập thông số pin và xuất 3 phương án cấu hình thực chiến.' },
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
            <h3 style="margin-top:0; color:var(--primary); font-size:17px;">⚡ Tính Toán Chuỗi Pin & Biến Tần Bơm NLMT</h3>
            <div class="solar-sec-box" style="margin-bottom:12px;">
                <div class="solar-sec-title">0. Thông số máy bơm</div>
                <div class="grid-2" style="gap:10px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Loại tải máy bơm:</label>
                        <select id="scLoadType" onchange="updateInverterDropdownAll()">
                            <option value="1" selected>Bơm hỏa tiễn / Bơm chìm (Tăng 1 cấp)</option>
                            <option value="0">Bơm đặt cạn / Ly tâm nhẹ (Bằng cấp)</option>
                            <option value="2">Bơm piston / Nén khí / Đẩy cao nặng (Tăng 2 cấp)</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Tổng công suất máy bơm:</label>
                        <div class="input-unit-group">
                            <input type="text" id="spPumpExpr" inputmode="decimal" placeholder="Nhập công suất..." oninput="cleanPumpExprInput()" onkeyup="cleanPumpExprInput()" onblur="evaluatePumpInput()" onkeydown="if(event.key==='Enter'){evaluatePumpInput();}">
                            <select id="spPumpUnit" onchange="updateInverterDropdownAll()">
                                <option value="kW" selected>kW</option>
                                <option value="HP">HP</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div id="pumpSuggestNote" style="margin-top:8px; font-size:12.5px; color:#15803d; font-weight:600; display:none;"></div>
            </div>
            <div class="solar-calc-grid">
                <div class="solar-sec-box">
                    <div class="solar-sec-title">1. Chọn Biến Tần Phù Hợp</div>
                    <div class="form-group">
                        <label>Danh sách biến tần trong kho:</label>
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
                        <div class="form-group"><label>Dòng làm việc Imp (A):</label><input type="number" id="panImpInput" step="0.01" value="15.29"></div>
                        <div class="form-group"><label>Áp làm việc Vmp (V):</label><input type="number" id="panVmpInput" step="0.01" value="40.90"></div>
                        <div class="form-group"><label>Áp hở mạch Voc (V):</label><input type="number" id="panVocInput" step="0.01" value="49.28"></div>
                    </div>
                    <div class="form-group" style="margin-top:4px; margin-bottom:0;">
                        <label>Chiều dài dây Cab Solar DC 1 chiều (m):</label>
                        <input type="number" id="spDcLen" value="25">
                    </div>
                </div>
            </div>
            <button class="btn btn-primary" style="font-size:15px;" onclick="checkLimitAndRun(execRealCombatSolarCalc)">TÍNH TOÁN CẤU HÌNH CHUỖI PIN</button>
            <div id="toolModalResult" style="margin-top:12px;"></div>
        `);
        setTimeout(() => { updateInverterDropdownAll(); fillPanelSpecs(); }, 50);
    }
    else if (toolId === 'acc') {
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
    updateInverterDropdownAll();
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
            updateInverterDropdownAll();
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
    } catch (e) { return 0; }
}
function updateInverterDropdownAll() {
    const stepUp = parseInt(document.getElementById('scLoadType')?.value || "1");
    const pumpKW = parseSafePumpPowerKW();
    const invSelect = document.getElementById('spInvIdx');
    const suggestEl = document.getElementById('pumpSuggestNote');
    if (!invSelect) return;

    const brandsOrder = [
        { key: "Power S", label: "Hãng Power S (Max 900V)" },
        { key: "Voltique", label: "Hãng Voltique (Max 950V)" },
        { key: "Green Nova", label: "Hãng Green Nova (Max 950V)" },
        { key: "SAJ", label: "Hãng SAJ (Max 900V)" }
    ];

    let targetKW = null;
    if (pumpKW > 0) {
        const distinctKWs = [...new Set(SOLAR_INVERTERS_DB.map(i => i.kw))].sort((a, b) => a - b);
        let baseIdx = distinctKWs.findIndex(kw => kw >= pumpKW);
        if (baseIdx === -1) baseIdx = distinctKWs.length - 1;
        targetKW = distinctKWs[Math.min(baseIdx + stepUp, distinctKWs.length - 1)];
        if (suggestEl) {
            const loadNames = { "0": "Bơm đặt cạn", "1": "Bơm hỏa tiễn", "2": "Bơm tải nặng" };
            suggestEl.style.display = 'block';
            suggestEl.innerHTML = `👉 Đề xuất: ${loadNames[stepUp]} <b>${pumpKW.toFixed(1)}kW (${Math.round(pumpKW/0.75)}HP)</b> ➔ Chọn biến tần cấp <b>${targetKW}kW (${Math.round(targetKW/0.75)}HP)</b>.`;
        }
    } else if (suggestEl) {
        suggestEl.style.display = 'none';
    }

    let html = "";
    brandsOrder.forEach(b => {
        const items = SOLAR_INVERTERS_DB.map((inv, idx) => ({ ...inv, origIdx: idx }))
            .filter(inv => inv.brand === b.key && (targetKW === null || inv.kw === targetKW));
        if (items.length > 0) {
            html += `<optgroup label="${b.label}">`;
            items.forEach(inv => {
                html += `<option value="${inv.origIdx}">${inv.name}</option>`;
            });
            html += `</optgroup>`;
        }
    });
    html += `<option value="custom">-- Tự nhập thông số biến tần khác --</option>`;

    invSelect.innerHTML = html;
    fillInverterSpecs();
}

function fillInverterSpecs() {
    const val = document.getElementById('spInvIdx')?.value;
    if (val === 'custom') return;
    const inv = SOLAR_INVERTERS_DB[parseInt(val)];
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
    const invVal = document.getElementById('spInvIdx')?.value;
    const baseInv = invVal !== 'custom' ? SOLAR_INVERTERS_DB[parseInt(invVal)] : { name: "Biến tần tùy chỉnh", phase: "3 pha 380V", price: 10000000 };
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
    const vocColdFactor = 1.05;

    const maxPerStr = Math.floor(vdcMax / (voc * vocColdFactor));
    const minPerStr = Math.max(1, Math.ceil(mpptMin / vmp));
    const optPerStr = Math.min(maxPerStr, Math.max(minPerStr, Math.round(((mpptMin + mpptMax) / 2) / vmp)));

    let recStrings = 1;
    let recPerStr = optPerStr;
    if ((maxPerStr * pMax) >= (refKW * 1.15 * 1000)) {
        recStrings = 1;
        recPerStr = Math.min(maxPerStr, Math.max(optPerStr, Math.ceil((refKW * 1.25 * 1000) / pMax)));
    } else {
        recStrings = Math.max(2, Math.ceil((refKW * 1.2 * 1000) / (optPerStr * pMax)));
        recPerStr = Math.max(minPerStr, Math.min(maxPerStr, Math.ceil((refKW * 1.2 * 1000) / (recStrings * pMax))));
    }

    currentSolarPlans = [
        { label: "PHƯƠNG ÁN TỐI THIỂU", strings: 1, perStr: minPerStr, total: minPerStr },
        { label: "⭐ TỐI ƯU NHẤT / 1 CHUỖI", strings: 1, perStr: optPerStr, total: optPerStr },
        { label: "MỞ RỘNG TỐI ĐA AN TOÀN", strings: 1, perStr: maxPerStr, total: maxPerStr }
    ];

    renderCombatResultBlocks(pMax, vmp, voc, imp, vdcMax, idcMax, invKw, baseInv, recStrings, recPerStr, maxPerStr, vocColdFactor);
}
function renderCombatResultBlocks(pMax, vmp, voc, imp, vdcMax, idcMax, invKw, baseInv, recStrings, recPerStr, maxPerStr, vocColdFactor) {
    const cardsHtml = currentSolarPlans.map((pl, idx) => {
        const voc25 = (pl.perStr * voc).toFixed(1);
        const vocCold = (pl.perStr * voc * vocColdFactor).toFixed(1);
        const vmpStr = (pl.perStr * vmp).toFixed(1);
        const kwpStr = ((pl.perStr * pMax) / 1000).toFixed(2);
        const bestCls = idx === 1 ? 'best-plan active-plan' : '';
        return `
            <div class="plan-card ${bestCls}" id="planCard_${idx}" onclick="selectSingleOrRecPlan(${idx}, ${recStrings}, ${recPerStr})">
                <div class="plan-title">${pl.label}</div>
                <div class="plan-panels">${pl.perStr} tấm / chuỗi</div>
                <div class="plan-sub">
                    Voc (25°C): <b>${voc25}V</b> | Sáng sớm trời lạnh (10°C): <b>${vocCold}V</b><br>
                    Vmp: <b>${vmpStr}V</b> | Công suất: <b>${kwpStr} kWp</b>
                </div>
            </div>
        `;
    }).join('');

    const recTotalPanels = recStrings * recPerStr;
    const recTotalKWp = ((recTotalPanels * pMax) / 1000).toFixed(2);
    const recTotalImp = (recStrings * imp).toFixed(2);

    const forbiddenPanels = maxPerStr + 1;
    const forbiddenVocCold = (forbiddenPanels * voc * vocColdFactor).toFixed(1);
    let warnLines = [
        `<b>Bảo vệ quá áp sáng sớm trời lạnh (10°C):</b> Tuyệt đối không đấu đến <b>${forbiddenPanels} tấm/chuỗi</b> vì điện áp hở mạch lúc sáng sớm trời lạnh có thể vọt lên <b>${forbiddenVocCold}V</b>, vượt ngưỡng chịu đựng <b>${vdcMax}V</b> của biến tần.`
    ];
    if (parseFloat(recTotalImp) > 25) {
        warnLines.push(`<b>Cảnh báo dòng điện cao (${recTotalImp}A):</b> Tổng dòng DC vượt 25A, bắt buộc dùng dây cáp DC trục chính tiết diện từ <b>6mm² - 10mm²</b> và CB DC tối thiểu <b>40A</b>.`);
    }
    const resBox = document.getElementById('toolModalResult');
    resBox.innerHTML = `
        <div class="solar-3cards">${cardsHtml}</div>
        <div style="margin-top:12px; padding:12px; background:#f0fdf4; border:1px solid #bbf7d0; border-left:4px solid #16a34a; border-radius:6px; font-size:13.5px; color:#14532d;">
            <div style="font-weight:700; margin-bottom:4px;">💡 Cấu hình đề xuất cho biến tần ${invKw}kW:</div>
            Ghép <b>${recStrings} chuỗi song song</b>, mỗi chuỗi <b>${recPerStr} tấm</b> (Tổng cộng <b>${recTotalPanels} tấm pin</b> — Tổng công suất dàn pin: <b>${recTotalKWp} kWp</b> | Tổng dòng làm việc: <b>${recTotalImp}A</b>).
        </div>
        <div style="margin-top:10px; padding:12px; background:#fffbeb; border:1px solid #fde68a; border-left:4px solid #f59e0b; border-radius:6px; font-size:13px; color:#92400e; line-height:1.55;">
            • ${warnLines.join('<br>• ')}
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:12px;">
            <button class="btn" style="width:100%; background:#0068ff; font-size:14.5px;" onclick="copySolarConfigForZalo()">💬 Sao chép cấu hình</button>
            <button class="btn btn-success" style="width:100%; font-size:14.5px;" onclick="openEditableQuoteModal()">📄 Lập Bảng Báo Giá</button>
        </div>
    `;
    window.lastCombatConfigSummary = {
        invKw, pMax, recStrings, recPerStr,
        selectedCardIdx: 1
    };
    setQuoteDataFromCombat(recStrings, recPerStr);
}

function selectSingleOrRecPlan(idx, recStrings, recPerStr) {
    document.querySelectorAll('.plan-card').forEach((el, i) => el.classList.toggle('active-plan', i === idx));
    if (window.lastCombatConfigSummary) window.lastCombatConfigSummary.selectedCardIdx = idx;
    setQuoteDataFromCombat(recStrings, currentSolarPlans[idx].perStr);
}

function copySolarConfigForZalo() {
    const cfg = window.lastCombatConfigSummary;
    if (!cfg || !currentSolarPlans.length) return;
    const loadVal = document.getElementById('scLoadType')?.value || "1";
    const loadNames = { "0": "máy bơm đặt cạn", "1": "máy bơm hỏa tiễn", "2": "máy bơm tải nặng" };
    const pumpKW = parseSafePumpPowerKW();
    const line1 = pumpKW > 0
        ? `Cấu hình dành cho ${loadNames[loadVal]} ${pumpKW}kW`
        : `Cấu hình dành cho hệ biến tần ${cfg.invKw}kW`;

    const selPlan = currentSolarPlans[cfg.selectedCardIdx] || currentSolarPlans[1];
    const cleanPlanName = selPlan.label.replace('⭐ ', '').replace('/ 1 CHUỖI', '/ 1 chuỗi').toLowerCase();
    const formattedPlanTitle = cleanPlanName.charAt(0).toUpperCase() + cleanPlanName.slice(1);
    const singleKwp = ((selPlan.perStr * cfg.pMax) / 1000).toFixed(3);
    const line2 = `${formattedPlanTitle}: Biến tần ${cfg.invKw}kW + 1 chuỗi x ${selPlan.perStr} tấm (${cfg.pMax}W) = (${singleKwp} kWp)`;

    const recTotal = cfg.recStrings * cfg.recPerStr;
    const recKwp = ((recTotal * cfg.pMax) / 1000).toFixed(2);
    const line3 = `Đề xuất: Biến tần ${cfg.invKw}kW + ${cfg.recStrings} chuỗi x ${cfg.recPerStr} tấm (${cfg.pMax}W) = ${recTotal} tấm (${recKwp} kWp)`;

    const text = `${line1}\n${line2}\n${line3}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => alert("✅ Đã sao chép cấu hình vào bộ nhớ tạm để gửi Zalo!"))
        .catch(() => prompt("Sao chép nội dung cấu hình dưới đây để gửi Zalo:", text));
    } else {
        prompt("Sao chép nội dung cấu hình dưới đây để gửi Zalo:", text);
    }
}

function setQuoteDataFromCombat(strings, perStr) {
    const pMax = parseFloat(document.getElementById('panPmaxInput').value) || 625;
    const invKw = parseFloat(document.getElementById('invKwInput').value) || 15;
    const dcLen = parseFloat(document.getElementById('spDcLen')?.value) || 25;
    const invVal = document.getElementById('spInvIdx')?.value;
    const invObj = invVal !== 'custom' ? SOLAR_INVERTERS_DB[parseInt(invVal)] : { name: `Biến tần bơm ${invKw}kW`, price: invKw * 950000 };
    const panVal = document.getElementById('spPanelIdx')?.value;
    const panObj = panVal !== 'custom' ? SOLAR_PANELS_DB[parseInt(panVal)] : { name: `Tấm pin NLMT ${pMax}W`, power: pMax, priceWp: 2950 };
    const totalPanels = strings * perStr;
    const totalKWp = (totalPanels * pMax) / 1000;
    const pumpKW = parseSafePumpPowerKW();
    const pumpSummary = pumpKW > 0 ? `${pumpKW} kW` : `Hệ biến tần ${invKw} kW`;
    lastSolarQuoteData = { pumpKW: pumpKW || invKw, pumpSummary, panel: panObj, inv: invObj, totalPanels, totalKWp, strings, panelsPerString: perStr, dcLen };
}

function openEditableQuoteModal() {
    const d = lastSolarQuoteData;
    if (!d) return;
    const rows = [
        { name: `Tấm pin NLMT ${d.panel.name}`, unit: "Tấm", qty: d.totalPanels, price: d.panel.power * d.panel.priceWp },
        { name: `Biến tần bơm ${d.inv.name}`, unit: "Bộ", qty: 1, price: d.inv.price },
        { name: `Bát Z`, unit: "Cái", qty: (d.totalPanels + d.strings) * 2, price: 15000 },
        { name: `Tủ điện`, unit: "Tủ", qty: 1, price: 2500000 },
        { name: `Cab Solar DC`, unit: "Mét", qty: d.dcLen * 2 * d.strings, price: 22000 },
        { name: `Kẹp biên`, unit: "Cái", qty: d.strings * 4, price: 12000 },
        { name: `Kẹp giữa`, unit: "Cái", qty: Math.max(0, (d.totalPanels - d.strings) * 2), price: 12000 },
        { name: `Kẹp U`, unit: "Cái", qty: (d.totalPanels + d.strings) * 2, price: 10000 },
        { name: `Jack MC4`, unit: "Cái", qty: d.strings * 4, price: 25000 },
        { name: `Nhân công lắp đặt & cài đặt vận hành`, unit: "NC", qty: 1, price: Math.round(d.totalKWp * 800000) },
        { name: `Khác`, unit: "", qty: 0, price: 0 }
    ];

    const trHtml = rows.map((r, i) => `
        <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td><input type="text" id="qName_${i}" value="${r.name}" style="min-width:140px; padding:5px; font-size:13px; font-weight:600;"></td>
            <td><input type="text" id="qUnit_${i}" value="${r.unit}" style="width:55px; text-align:center; padding:5px; font-size:13px;"></td>
            <td><input type="number" class="quote-qty" id="qQty_${i}" value="${r.qty}" oninput="recalcQuoteTotal()"></td>
            <td><input type="number" class="quote-input" id="qPrice_${i}" value="${r.price}" oninput="recalcQuoteTotal()"></td>
            <td style="text-align:right; font-weight:600; white-space:nowrap;" id="qSub_${i}">${(r.qty * r.price).toLocaleString('vi-VN')}</td>
        </tr>
    `).join('');

    openGlobalModal(`
        <h3 style="margin:0 0 6px; color:var(--primary); font-size:16px;">📄 BẢNG BÁO GIÁ BƠM NĂNG LƯỢNG MẶT TRỜI</h3>
        <p style="font-size:12px; color:#64748b; margin-top:0;">Cấu hình: Bơm <b>${d.pumpSummary}</b> | Giàn pin <b>${d.totalKWp.toFixed(2)} kWp</b> (${d.strings} chuỗi × ${d.panelsPerString} tấm). <i>Chạm vào ô bất kỳ để sửa tên, ĐVT, SL hoặc Đơn giá:</i></p>
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
    for (let i = 0; i < 11; i++) {
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
    let stt = 1;
    for (let i = 0; i < 11; i++) {
        const name = document.getElementById(`qName_${i}`)?.value || "";
        const unit = document.getElementById(`qUnit_${i}`)?.value || "";
        const qty = parseFloat(document.getElementById(`qQty_${i}`)?.value) || 0;
        const price = parseFloat(document.getElementById(`qPrice_${i}`)?.value) || 0;
        const sub = Math.round(qty * price);
        if (qty > 0) {
            rowsHtml += `<tr>
                <td style="text-align:center; border:1px solid #cbd5e1; padding:6px;">${stt++}</td>
                <td style="border:1px solid #cbd5e1; padding:6px;">${name}</td>
                <td style="text-align:center; border:1px solid #cbd5e1; padding:6px;">${unit}</td>
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
    let stt = 1;
    for (let i = 0; i < 11; i++) {
        const name = document.getElementById(`qName_${i}`)?.value || "";
        const unit = document.getElementById(`qUnit_${i}`)?.value || "";
        const qty = parseFloat(document.getElementById(`qQty_${i}`)?.value) || 0;
        const price = parseFloat(document.getElementById(`qPrice_${i}`)?.value) || 0;
        const sub = document.getElementById(`qSub_${i}`)?.innerText || "0";
        if (qty > 0) text += `${stt++}. ${name} (SL: ${qty} ${unit} × ${price.toLocaleString('vi-VN')}đ): ${sub}đ\n`;
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
