const API_URL = "https://script.google.com/macros/s/AKfycby96Sz0PADdUFFoSpzws8_H61WuoVlfba77otpa1s7gJCwKuOuklqjXAB9FWejCX61MGQ/exec";

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
        const noCacheUrl = API_URL + (API_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
        const res = await fetch(noCacheUrl, { signal: controller.signal, cache: 'no-store' });
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
        if (document.getElementById('productGridArea')) renderProductsPage(1);
        if (document.getElementById('errorTableBody')) renderErrorsPage(1);
        if (document.getElementById('knowledgeListArea')) renderKnowledgePage();
    } catch (e) {}
}

function updateTopUserBar() {
    const statusText = document.getElementById('userStatusText');
    const btnLabel = document.getElementById('userBtnLabel');
    const isMob = window.innerWidth <= 768;
    if (currentUser) {
        if (currentUser.role === 'admin') {
            statusText.innerHTML = isMob ? ` <b style="color:var(--primary)">${currentUser.username}</b>` : `Admin: <b style="color:var(--primary)">${currentUser.username}</b>`;
            btnLabel.innerText = "Quản trị";
        } else {
            let st = '<span style="color:#fbbf24">Chờ duyệt</span>';
            if (currentUser.status === 'approved') {
                const exp = Number(currentUser.expiry) || 0;
                if (exp >= 9000000000000) {
                    st = '<span style="color:#38bdf8">Vĩnh viễn</span>';
                } else if (exp === 0) {
                    st = '<span style="color:#4ade80">Còn 60 ngày</span>';
                } else if (exp > Date.now()) {
                    const daysLeft = Math.ceil((exp - Date.now()) / 86400000);
                    st = `<span style="color:#4ade80">Còn ${daysLeft} ngày</span>`;
                } else {
                    st = '<span style="color:#f87171">Hết hạn</span>';
                }
            }
            statusText.innerHTML = isMob ? `👤 <b>${currentUser.username}</b> (${st})` : `👤 Zalo: <b>${currentUser.username}</b> (${st})`;
            btnLabel.innerText = "Tài khoản";
        }
    } else {
        let left = Math.max(0, 3 - guestCount);
        statusText.innerHTML = isMob ? `🔮 Còn <b style="color:#f87171">${left}</b> lượt` : `🔮 Khách vãng lai (Còn <b style="color:#f87171">${left}</b> lượt tính)`;
        btnLabel.innerText = "Đăng nhập";
    }
    const aiGreetEl = document.getElementById('solarAiGreeting');
    if (aiGreetEl) {
        const displayName = currentUser ? `<b>${currentUser.username}</b>` : "bạn";
        aiGreetEl.innerHTML = `Chào ${displayName}, chúc bạn một ngày bứt phá, chốt được nhiều đơn. Bạn cần hỗ trợ gì không?`;
    }
}

function checkLimitAndRun(callbackFn) {
    if (currentUser) {
        if (currentUser.role === 'admin') return callbackFn();
        if (currentUser.status !== 'approved') {
            alert("Tài khoản Zalo của bạn đang chờ Admin duyệt kích hoạt!");
            return openUserModal();
        }
        const now = Date.now();
        const exp = Number(currentUser.expiry) || 0;
        if (exp > 0 && exp < now) {
            alert("Tài khoản của bạn đã hết thời hạn sử dụng! Vui lòng nhập Mã đơn hàng đã mua để được cộng thêm 10 ngày sử dụng.");
            return openUserModal();
        }
        return callbackFn();
    }
    if (guestCount >= 3) {
        alert("Bạn đã dùng hết 3 lượt tính miễn phí! Vui lòng đăng ký bằng Tên Zalo để nhận ngay 60 ngày sử dụng.");
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
            <h3 style="margin-top:0; color:var(--primary);">👤 Đăng Nhập / Đăng Ký</h3>
            <p style="font-size:13.5px; color:#555;">Đăng ký lần đầu bằng Tên Zalo để được <b>tặng ngay 60 ngày sử dụng</b> công cụ tính toán!</p>
            <div class="form-group"><label>Nhập chính xác Tên tài khoản Zalo:</label><input type="text" id="modalZaloInput" placeholder="Ví dụ: Nguyen Van A"></div>
            <div style="display:flex; gap:10px;">
                <button class="btn btn-primary" onclick="processLogin()">Đăng Nhập</button>
                <button class="btn btn-success" style="width:100%;" onclick="processRegister()">Đăng Ký</button>
            </div>
        `);
    } else if (currentUser.role === 'admin') {
        renderAdminDashboard();
    } else {
        const now = Date.now();
        const exp = Number(currentUser.expiry) || 0;
        const isLifetime = exp >= 9000000000000;
        let daysLeftText = "";
        if (currentUser.status !== 'approved') {
            daysLeftText = `<span style="color:#d97706;">Đang chờ Admin duyệt</span>`;
        } else if (isLifetime) {
            daysLeftText = `<span style="color:#0284c7; font-weight:700;">Vĩnh viễn</span>`;
        } else if (exp === 0) {
            daysLeftText = `<span style="color:#16a34a;">Đang hoạt động (60 ngày ưu đãi)</span>`;
        } else if (exp > now) {
            const daysLeft = Math.ceil((exp - now) / 86400000);
            const expDateStr = new Date(exp).toLocaleDateString('vi-VN');
            daysLeftText = `<span style="color:#16a34a;">Còn <b>${daysLeft} ngày</b> (Hết hạn: ${expDateStr})</span>`;
        } else {
            daysLeftText = `<span style="color:#dc2626;">Đã hết hạn sử dụng!</span>`;
        }

        const pendingList = (currentUser.pendingOrder || "").split(",").map(s => s.trim()).filter(Boolean);
        const pendingNote = pendingList.length > 0
            ? `<div style="padding:8px 10px; background:#fef3c7; border-radius:6px; font-size:12.5px; color:#92400e; margin-bottom:10px;">⏳ Đang chờ duyệt <b>${pendingList.length} đơn</b>: <b>${pendingList.join(', ')}</b> (+${pendingList.length * 10} ngày)</div>`
            : "";

        const renewBlock = isLifetime ? "" : `
            <div style="padding:12px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:14px;">
                <div style="font-weight:700; font-size:13.5px; color:var(--dark); margin-bottom:6px;">🎁 Gia hạn thêm (+10 ngày / 1 đơn hàng)</div>
                ${pendingNote}
                <div class="form-group" style="margin-bottom:8px;">
                    <label style="font-size:12.5px;">Nhập Mã đơn hàng đã mua (có thể nhập nhiều mã cách nhau dấu phẩy):</label>
                    <input type="text" id="userOrderCodeInput" placeholder="Ví dụ: DH1025, DH1026...">
                </div>
                <button class="btn btn-success" style="width:100%;" onclick="submitUserOrderCode()">Gửi</button>
            </div>
        `;

        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary);">Thông Tin Tài Khoản</h3>
            <p style="margin:6px 0;">- Tên Zalo: <b>${currentUser.username}</b></p>
            <p style="margin:6px 0 12px;">- Thời hạn sử dụng: ${daysLeftText}</p>
            ${renewBlock}
            <button class="btn btn-danger" style="width:100%;" onclick="processLogout()">Đăng Xuất</button>
        `);
    }
}

async function submitUserOrderCode() {
    const raw = (document.getElementById('userOrderCodeInput')?.value || "").trim();
    if (!raw) return alert("Vui lòng nhập mã đơn hàng đã mua!");
    alert("Đang gửi mã đơn hàng lên hệ thống...");
    await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'submit_order', username: currentUser.username, orderCode: raw })
    });
    const oldList = (currentUser.pendingOrder || "").split(",").map(s => s.trim()).filter(Boolean);
    raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean).forEach(c => {
        if (!oldList.includes(c)) oldList.push(c);
    });
    currentUser.pendingOrder = oldList.join(", ");
    sessionStorage.setItem('current_user', JSON.stringify(currentUser));
    alert("✅ Đã gửi mã đơn hàng! Sau khi Admin duyệt, tài khoản của bạn sẽ tự động cộng thêm ngày sử dụng");
    openUserModal();
    syncDataFromGoogleSheet();
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
    tbody.innerHTML = sorted.length === 0 ? `<tr><td colspan="6" style="text-align:center;">Chưa có dữ liệu thành viên</td></tr>` : sorted.map((u, idx) => {
        const fullU = appData.users.find(x => x.username === u.username) || {};
        const exp = Number(fullU.expiry) || 0;
        const isLifetime = exp >= 9000000000000;
        const daysLeft = exp > Date.now() ? Math.ceil((exp - Date.now()) / 86400000) : (exp === 0 ? 60 : 0);
        const timeBadge = isLifetime
            ? `<span style="font-size:11px;color:#0284c7;font-weight:700;">(Vĩnh viễn)</span>`
            : `<span style="font-size:11px;color:#16a34a;">(Còn ${daysLeft}d)</span>`;

        const orderCodes = (fullU.pendingOrder || "").split(",").map(s => s.trim()).filter(Boolean);
        const orderListHtml = orderCodes.length > 0
            ? `<div style="margin-top:4px; display:flex; flex-direction:column; gap:3px;">` + orderCodes.map(c => `
                <div style="display:flex; align-items:center; gap:4px;">
                    <span style="background:#fef3c7;color:#b45309;padding:2px 5px;border-radius:4px;font-size:11px;font-weight:700;">📦 ${c}</span>
                    <button class="btn btn-primary" style="padding:2px 6px;font-size:10.5px;" onclick="adminOrderAction('approve_order', '${u.username}', '${c.replace(/'/g, "\\'")}')">+10d</button>
                    <button class="btn btn-outline" style="padding:1px 5px;font-size:10.5px;color:#dc2626;border-color:#fca5a5;" onclick="adminOrderAction('reject_order', '${u.username}', '${c.replace(/'/g, "\\'")}')" title="Xóa mã sai">&times;</button>
                </div>
            `).join('') + `</div>`
            : "";

        return `
        <tr>
            <td><b>#${idx + 1} ${u.username}</b> ${timeBadge}${orderListHtml}</td>
            <td style="text-align:center; font-weight:bold; color:var(--primary);">${u.day}</td>
            <td style="text-align:center; font-weight:bold;">${u.week}</td>
            <td style="text-align:center; font-weight:bold;">${u.month}</td>
            <td style="text-align:center; font-weight:bold; color:var(--secondary);">${u.year}</td>
            <td style="white-space:nowrap;">
                ${u.status === 'pending' ? `<button class="btn btn-success" style="padding:3px 6px; font-size:11px;" onclick="adminAction('approve', '${u.username}')">Duyệt</button>` : ''}
                ${!isLifetime ? `<button class="btn" style="padding:3px 6px; font-size:11px; background:#0284c7;" onclick="adminAction('set_lifetime', '${u.username}')" title="Cấp quyền vĩnh viễn">Vĩnh viễn</button>` : ''}
                <button class="btn btn-danger" style="padding:3px 6px; font-size:11px;" onclick="adminAction('delete', '${u.username}')">Xóa</button>
            </td>
        </tr>`;
    }).join('');
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
async function adminOrderAction(act, username, orderCode) {
    if (act === 'reject_order' && !confirm(`Xóa mã đơn "${orderCode}" của ${username}?`)) return;
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: act, username: username, orderCode: orderCode }) });
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
        const bLow = e.brand.toLowerCase();
        let badgeCls = bLow === 'saj' ? 'badge-saj' : (bLow === 'green nova' ? 'badge-greennova' : (bLow === 'lumentree' ? 'badge-lumentree' : 'badge-powers'));
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
    { id: 'health', icon: '🩺', title: 'Khám sức khỏe hệ bơm NLMT', desc: 'Chẩn đoán cấu hình bơm, biến tần, giàn pin có sẵn của khách và đề xuất nâng cấp.' },
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
function buildGroupedPanelOptions(defaultPower, addCustomSelected) {
    const brands = ["Jinko Solar", "Astronergy", "Trina Solar", "TCL Solar"];
    let html = "";
    brands.forEach(br => {
        const items = SOLAR_PANELS_DB.map((p, idx) => ({ ...p, origIdx: idx }))
            .filter(p => (p.brand || (p.name.includes("Astronergy") ? "Astronergy" : "Jinko Solar")) === br)
            .sort((a, b) => a.power - b.power);
        if (items.length > 0) {
            html += `<optgroup label="Hãng ${br}">`;
            items.forEach(p => {
                const isSel = (!addCustomSelected && defaultPower && br === "Jinko Solar" && p.power === defaultPower) ? "selected" : "";
                html += `<option value="${p.origIdx}" ${isSel}>${p.name}</option>`;
            });
            html += `</optgroup>`;
        }
    });
    html += `<option value="custom" ${addCustomSelected ? 'selected' : ''}>-- Tự nhập thông số tấm pin khác --</option>`;
    return html;
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
        const panelOpts = buildGroupedPanelOptions(580, false);
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
                    <div style="font-size:12px; font-weight:700; color:#0284c7; margin:6px 0 4px;">📥 Thông số đầu vào DC (Từ giàn pin):</div>
                    <div class="solar-mini-grid">
                        <div class="form-group"><label>Áp DC Max (V):</label><input type="number" id="invVdcMaxInput" value="900"></div>
                        <div class="form-group"><label>Dòng DC Max (A):</label><input type="number" id="invIdcMaxInput" value="30"></div>
                        <div class="form-group"><label>MPPT Min (V):</label><input type="number" id="invMpptMinInput" value="486" oninput="updateMpptOptField()"></div>
                        <div class="form-group"><label>MPPT Max (V):</label><input type="number" id="invMpptMaxInput" value="750" oninput="updateMpptOptField()"></div>
                    </div>
                    <div class="form-group" style="margin-bottom:8px;">
                        <label>Áp MPPT tối ưu (Trung bình) (V):</label>
                        <input type="number" id="invMpptOptInput" value="618" readonly style="background:#f0f9ff; font-weight:700; color:#0369a1;">
                    </div>
                    <div style="font-size:12px; font-weight:700; color:#15803d; margin:6px 0 4px; border-top:1px dashed #cbd5e1; padding-top:6px;">📤 Thông số đầu ra AC (Ra máy bơm):</div>
                    <div class="solar-mini-grid" style="margin-bottom:0;">
                        <div class="form-group" style="margin-bottom:0;"><label>Công suất (kW):</label><input type="number" id="invKwInput" step="0.1" value="7.5"></div>
                        <div class="form-group" style="margin-bottom:0;"><label>Điện áp AC ra:</label><input type="text" id="invPhaseInput" value="3 pha 380V"></div>
                    </div>
                    <div class="form-group" style="margin-top:6px; margin-bottom:0;">
                        <label>Dòng đầu ra định mức (A):</label>
                        <input type="number" id="invOutAInput" step="0.1" value="17" style="font-weight:700; color:#15803d;">
                    </div>
                </div>
                <div class="solar-sec-box">
                    <div class="solar-sec-title">2. Chọn / Nhập Tấm Pin (STC)</div>
                    <div class="form-group">
                        <label>Chọn mẫu tấm pin có sẵn:</label>
                        <select id="spPanelIdx" onchange="fillPanelSpecs()">${panelOpts}</select>
                    </div>
                    <div class="solar-mini-grid">
                        <div class="form-group"><label>Công suất Pmax (W):</label><input type="number" id="panPmaxInput" value="580"></div>
                        <div class="form-group"><label>Dòng làm việc Imp (A):</label><input type="number" id="panImpInput" step="0.01" value="13.22"></div>
                        <div class="form-group"><label>Áp làm việc Vmp (V):</label><input type="number" id="panVmpInput" step="0.01" value="43.88"></div>
                        <div class="form-group"><label>Áp hở mạch Voc (V):</label><input type="number" id="panVocInput" step="0.01" value="52.50"></div>
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
    else if (toolId === 'health') {
        const panelOpts = buildGroupedPanelOptions(null, true);
        let invOpts = '';
        ["Power S", "Voltique", "Green Nova", "SAJ"].forEach(br => {
            const list = SOLAR_INVERTERS_DB.map((inv, idx) => ({ ...inv, idx })).filter(x => x.brand === br);
            if (list.length) invOpts += `<optgroup label="Hãng ${br}">${list.map(x => `<option value="${x.idx}">${x.name}</option>`).join('')}</optgroup>`;
        });
        invOpts += `<option value="custom" selected>-- Tự nhập thông số biến tần của khách --</option>`;

        openGlobalModal(`
            <h3 style="margin-top:0; color:var(--primary); font-size:17px;">🩺 Khám sức khỏe hệ bơm NLMT</h3>
            <div class="solar-sec-box" style="margin-bottom:12px;">
                <div class="solar-sec-title">1. Thông số Máy bơm hiện tại</div>
                <div class="grid-2" style="gap:10px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Loại máy bơm:</label>
                        <select id="hlLoadType">
                            <option value="1" selected>Bơm hỏa tiễn / Bơm chìm (Cần +1 cấp)</option>
                            <option value="0">Bơm đặt cạn / Ly tâm nhẹ (Bằng cấp)</option>
                            <option value="2">Bơm piston / Đẩy cao nặng (Cần +2 cấp)</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Công suất máy bơm:</label>
                        <div class="input-unit-group">
                            <input type="number" id="hlPumpVal" step="0.1" value="7.5">
                            <select id="hlPumpUnit"><option value="kW" selected>kW</option><option value="HP">HP</option></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="solar-calc-grid">
                <div class="solar-sec-box">
                    <div class="solar-sec-title">2. Biến tần hiện tại của khách</div>
                    <div class="form-group"><label>Chọn mẫu kho hoặc tự nhập:</label><select id="hlInvSel" onchange="fillHealthInv()">${invOpts}</select></div>
                    <div class="solar-mini-grid">
                        <div class="form-group"><label>Công suất (kW):</label><input type="number" id="hlInvKw" step="0.1" value="11"></div>
                        <div class="form-group"><label>Áp DC Max (V):</label><input type="number" id="hlInvVdcMax" value="900"></div>
                        <div class="form-group"><label>Dòng DC Max (A):</label><input type="number" id="hlInvIdcMax" value="40"></div>
                        <div class="form-group"><label>MPPT Min (V):</label><input type="number" id="hlInvMpptMin" value="486"></div>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label>MPPT Max (V):</label>
                        <input type="number" id="hlInvMpptMax" value="750">
                    </div>
                </div>
                <div class="solar-sec-box">
                    <div class="solar-sec-title">3. Giàn pin hiện tại của khách</div>
                    <div class="form-group"><label>Chọn mẫu kho hoặc tự nhập:</label><select id="hlPanSel" onchange="fillHealthPan()">${panelOpts}</select></div>
                    <div class="solar-mini-grid">
                        <div class="form-group"><label>Công suất Pmax (W):</label><input type="number" id="hlPanPmax" value="550"></div>
                        <div class="form-group"><label>Dòng Imp (A):</label><input type="number" id="hlPanImp" step="0.01" value="13.20"></div>
                        <div class="form-group"><label>Áp Vmp (V):</label><input type="number" id="hlPanVmp" step="0.01" value="41.70"></div>
                        <div class="form-group"><label>Áp hở mạch Voc (V):</label><input type="number" id="hlPanVoc" step="0.01" value="49.80"></div>
                    </div>
                    <div class="solar-mini-grid" style="margin-top:4px;">
                        <div class="form-group" style="margin-bottom:0;"><label>Số chuỗi song song:</label><input type="number" id="hlStrings" value="1" min="1"></div>
                        <div class="form-group" style="margin-bottom:0;"><label>Số tấm / 1 chuỗi:</label><input type="number" id="hlPerStr" value="14" min="1"></div>
                    </div>
                </div>
            </div>
            <button class="btn btn-primary" style="font-size:15px;" onclick="checkLimitAndRun(execSolarHealthCheck)">🔍 KHÁM SỨC KHỎE HỆ THỐNG</button>
            <div id="toolModalResult" style="margin-top:12px;"></div>
        `);
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
    let isOverMax = false;
    const distinctKWs = [...new Set(SOLAR_INVERTERS_DB.map(i => i.kw))].sort((a, b) => a - b);
    const maxKhoKW = distinctKWs[distinctKWs.length - 1] || 22;

    if (pumpKW > 0) {
        let baseIdx = distinctKWs.findIndex(kw => kw >= pumpKW);
        if (baseIdx === -1 || (baseIdx + stepUp) >= distinctKWs.length) {
            isOverMax = true;
            if (suggestEl) {
                suggestEl.style.display = 'block';
                suggestEl.style.color = '#dc2626';
                suggestEl.innerHTML = `⚠️ Bơm <b>${pumpKW.toFixed(1)}kW (${Math.round(pumpKW/0.75)}HP)</b> hiện tại không có sẵn trong kho. Hãy liên hệ bộ phận kinh doanh để được tư vấn đặt hàng!`;
            }
        } else {
            targetKW = distinctKWs[baseIdx + stepUp];
            if (suggestEl) {
                const loadNames = { "0": "Bơm đặt cạn", "1": "Bơm hỏa tiễn", "2": "Bơm tải nặng" };
                suggestEl.style.display = 'block';
                suggestEl.style.color = '#15803d';
                suggestEl.innerHTML = `👉 Đề xuất: ${loadNames[stepUp]} <b>${pumpKW.toFixed(1)}kW (${Math.round(pumpKW/0.75)}HP)</b> ➔ Chọn biến tần cấp <b>${targetKW}kW (${Math.round(targetKW/0.75)}HP)</b>.`;
            }
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
    html += `<option value="custom" ${isOverMax ? 'selected' : ''}>-- Tự nhập thông số biến tần khác --</option>`;

    invSelect.innerHTML = html;
    if (!isOverMax) fillInverterSpecs();
}

function updateMpptOptField() {
    const mMin = parseFloat(document.getElementById('invMpptMinInput')?.value) || 0;
    const mMax = parseFloat(document.getElementById('invMpptMaxInput')?.value) || 0;
    const optEl = document.getElementById('invMpptOptInput');
    if (optEl) optEl.value = Math.round((mMin + mMax) / 2);
}

function fillInverterSpecs() {
    const val = document.getElementById('spInvIdx')?.value;
    if (val === 'custom') return;
    const inv = SOLAR_INVERTERS_DB[parseInt(val)];
    if (!inv) return;
    document.getElementById('invKwInput').value = inv.kw;
    const phaseEl = document.getElementById('invPhaseInput');
    if (phaseEl) phaseEl.value = inv.phase || "3 pha 380V";
    const outAEl = document.getElementById('invOutAInput');
    if (outAEl) outAEl.value = inv.iOut || "";
    document.getElementById('invVdcMaxInput').value = inv.vdcMax;
    document.getElementById('invIdcMaxInput').value = inv.idcMax;
    document.getElementById('invMpptMinInput').value = inv.mpptMin;
    document.getElementById('invMpptMaxInput').value = inv.mpptMax;
    updateMpptOptField();
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
    const mpptMin = parseFloat(document.getElementById('invMpptMinInput').value) || 486;
    const mpptMax = parseFloat(document.getElementById('invMpptMaxInput').value) || 750;

    const pMax = parseFloat(document.getElementById('panPmaxInput').value) || 0;
    const imp = parseFloat(document.getElementById('panImpInput').value) || 0;
    const vmp = parseFloat(document.getElementById('panVmpInput').value) || 0;
    const voc = parseFloat(document.getElementById('panVocInput').value) || 0;
    if (invKw <= 0 || pMax <= 0 || vmp <= 0 || voc <= 0) return alert("Vui lòng kiểm tra lại thông số biến tần và tấm pin!");

    const pumpKW = parseSafePumpPowerKW();
    if (pumpKW <= 0) {
        document.getElementById('spPumpExpr')?.focus();
        return alert("⚠️ Vui lòng nhập công suất máy bơm trước khi tính toán!");
    }
    if (pumpKW > invKw) {
        return alert(`⚠️ Công suất máy bơm (${pumpKW}kW) đang lớn hơn công suất biến tần (${invKw}kW)! Vui lòng nhập công suất biến tần tối thiểu ${Math.ceil(pumpKW * 1.3)}kW trước khi tính.`);
    }

     const vocColdFactor = 1.05;
     const maxSafePerStr = Math.floor((vdcMax - 0.1) / (voc * vocColdFactor));
     const midMpptVolt = (mpptMin + mpptMax) / 2;
     const minOptPerStr = Math.min(maxSafePerStr, Math.max(1, Math.round(midMpptVolt / vmp)));
    
     // 1. PHƯƠNG ÁN TỐI ƯU (Ít chuỗi dây nhất, áp >= trung bình MPPT & công suất >= 1.3x tải bơm)
     const minRequiredPanels = Math.ceil((pumpKW * 1.3 * 1000) / pMax);
     const optStrings = Math.max(1, Math.ceil(minRequiredPanels / maxSafePerStr));
     const optPerStr = Math.min(maxSafePerStr, Math.max(minOptPerStr, Math.ceil(minRequiredPanels / optStrings)));
    
     // 2. PHƯƠNG ÁN LÝ TƯỞNG (Điện áp vùng ngọt nửa trên MPPT, công suất chạy cực khỏe ~1.55x tải bơm)
     const targetIdealVolt = mpptMin + (mpptMax - mpptMin) * 0.62;
     let idealPerStr = Math.min(maxSafePerStr, Math.max(minOptPerStr, Math.round(targetIdealVolt / vmp)));

    const idealTargetPanels = Math.ceil((pumpKW * 1.55 * 1000) / pMax);
    let idealStrings = Math.max(optStrings, Math.ceil(idealTargetPanels / idealPerStr));

    if (idealStrings === optStrings && (idealStrings * idealPerStr) <= (optStrings * optPerStr)) {
        if (optPerStr < maxSafePerStr) {
            idealPerStr = maxSafePerStr;
        } else {
            idealStrings = optStrings + 1;
        }
    }

    currentSolarPlans = [
        { label: `💡 PHƯƠNG ÁN TỐI ƯU (TIẾT KIỆM DÂY)`, strings: optStrings, perStr: optPerStr, total: optStrings * optPerStr },
        { label: `⭐ PHƯƠNG ÁN LÝ TƯỞNG (KHUYÊN DÙNG)`, strings: idealStrings, perStr: idealPerStr, total: idealStrings * idealPerStr }
    ];

    renderCombatResultBlocks(pMax, vmp, voc, imp, vdcMax, idcMax, invKw, baseInv, idealStrings, idealPerStr, maxSafePerStr, vocColdFactor);
}

function renderCombatResultBlocks(pMax, vmp, voc, imp, vdcMax, idcMax, invKw, baseInv, recStrings, recPerStr, maxPerStr, vocColdFactor) {
    const cardsHtml = currentSolarPlans.map((pl, idx) => {
        const voc25 = (pl.perStr * voc).toFixed(1);
        const vocCold = (pl.perStr * voc * vocColdFactor).toFixed(1);
        const vmpStr = (pl.perStr * vmp).toFixed(1);
        const kwpStr = ((pl.total * pMax) / 1000).toFixed(2);
        const panelHeadText = pl.strings === 1
            ? `${pl.perStr} tấm / chuỗi`
            : `${pl.strings} chuỗi × ${pl.perStr} tấm = ${pl.total} tấm`;
        const bestCls = idx === 1 ? 'best-plan active-plan' : '';
        return `
            <div class="plan-card ${bestCls}" id="planCard_${idx}" onclick="selectSingleOrRecPlan(${idx})">
                <div class="plan-title">${pl.label}</div>
                <div class="plan-panels">${panelHeadText}</div>
                <div class="plan-sub">
                    Voc (25°C): <b>${voc25}V</b> | Sáng sớm trời lạnh (10°C): <b>${vocCold}V</b><br>
                    Vmp: <b>${vmpStr}V</b> | Tổng công suất: <b>${kwpStr} kWp</b>
                </div>
            </div>
        `;
    }).join('');

    const optPlan = currentSolarPlans[0];
    const idealPlan = currentSolarPlans[1];
    const idealTotalKWp = ((idealPlan.total * pMax) / 1000).toFixed(2);
    const idealTotalImp = (idealPlan.strings * imp).toFixed(2);
    const optTotalKWp = ((optPlan.total * pMax) / 1000).toFixed(2);

    const forbiddenPanels = maxPerStr + 1;
    const forbiddenVocCold = (forbiddenPanels * voc * vocColdFactor).toFixed(1);
    let warnLines = [
        `<b>Bảo vệ quá áp sáng sớm trời lạnh (10°C):</b> Tuyệt đối không đấu đến <b>${forbiddenPanels} tấm/chuỗi</b> vì điện áp hở mạch lúc sáng sớm trời lạnh có thể vọt lên <b>${forbiddenVocCold}V</b>, vượt ngưỡng chịu đựng <b>${vdcMax}V</b> của biến tần.`
    ];
    if (parseFloat(idealTotalImp) > 25) {
        warnLines.push(`<b>Cảnh báo dòng điện cao (${idealTotalImp}A):</b> Tổng dòng DC vượt 25A, bắt buộc dùng dây cáp DC trục chính tiết diện từ <b>6mm² - 10mm²</b> và CB DC tối thiểu <b>40A</b>.`);
    }

    const idealText = idealPlan.strings === 1
        ? `Đấu nối tiếp <b>1 chuỗi duy nhất</b> gồm <b>${idealPlan.perStr} tấm</b>`
        : `Ghép <b>${idealPlan.strings} chuỗi song song</b>, mỗi chuỗi <b>${idealPlan.perStr} tấm</b>`;

    const resBox = document.getElementById('toolModalResult');
    resBox.innerHTML = `
        <div class="solar-3cards" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">${cardsHtml}</div>
        <div style="margin-top:12px; padding:12px; background:#f0fdf4; border:1px solid #bbf7d0; border-left:4px solid #16a34a; border-radius:6px; font-size:13.5px; color:#14532d; line-height:1.55;">
            <div style="font-weight:700; margin-bottom:4px;">⭐ Khuyến nghị chọn cấu hình lý tưởng cho biến tần ${invKw}kW:</div>
            • <b>Cấu hình lý tưởng:</b> ${idealText} = <b>${idealPlan.total} tấm (${idealTotalKWp} kWp)</b> | Dòng làm việc: <b>${idealTotalImp}A</b> (Bơm chạy cực khỏe từ sáng sớm đến chiều muộn).<br>
            <span style="font-size:12.5px; color:#166534;">• <i>Ghi chú:</i> Nếu muốn tiết kiệm dây dẫn DC, có thể chọn phương án tối ưu <b>${optPlan.strings} chuỗi × ${optPlan.perStr} tấm = ${optPlan.total} tấm (${optTotalKWp} kWp)</b> (bấm vào thẻ bên trái để lập báo giá theo phương án này).</span>
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
        invKw, pMax,
        recStrings: idealPlan.strings,
        recPerStr: idealPlan.perStr,
        selectedCardIdx: 1
    };
    setQuoteDataFromCombat(idealPlan.strings, idealPlan.perStr);
}

function selectSingleOrRecPlan(idx) {
    const plan = currentSolarPlans[idx];
    if (!plan) return;
    document.querySelectorAll('.plan-card').forEach((el, i) => el.classList.toggle('active-plan', i === idx));
    if (window.lastCombatConfigSummary) {
        window.lastCombatConfigSummary.selectedCardIdx = idx;
        window.lastCombatConfigSummary.recStrings = plan.strings;
        window.lastCombatConfigSummary.recPerStr = plan.perStr;
    }
    setQuoteDataFromCombat(plan.strings, plan.perStr);
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
    const cleanPlanName = selPlan.label.replace('💡 ', '').replace('⭐ ', '').toLowerCase();
    const formattedPlanTitle = cleanPlanName.charAt(0).toUpperCase() + cleanPlanName.slice(1);
    const totalKwp = ((selPlan.total * cfg.pMax) / 1000).toFixed(2);
    const line2 = `${formattedPlanTitle}: Biến tần ${cfg.invKw}kW + ${selPlan.strings} chuỗi x ${selPlan.perStr} tấm (${cfg.pMax}W) = ${selPlan.total} tấm (${totalKwp} kWp)`;

    const text = `${line1}\n${line2}`;
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
function fillHealthInv() {
    const val = document.getElementById('hlInvSel')?.value;
    if (val === 'custom') return;
    const inv = SOLAR_INVERTERS_DB[parseInt(val)];
    if (!inv) return;
    document.getElementById('hlInvKw').value = inv.kw;
    document.getElementById('hlInvVdcMax').value = inv.vdcMax;
    document.getElementById('hlInvIdcMax').value = inv.idcMax;
    document.getElementById('hlInvMpptMin').value = inv.mpptMin;
    const mMaxEl = document.getElementById('hlInvMpptMax');
    if (mMaxEl) mMaxEl.value = inv.mpptMax;
}

function fillHealthPan() {
    const val = document.getElementById('hlPanSel')?.value;
    if (val === 'custom') return;
    const pan = SOLAR_PANELS_DB[parseInt(val)];
    if (!pan) return;
    document.getElementById('hlPanPmax').value = pan.power;
    document.getElementById('hlPanImp').value = pan.imp;
    document.getElementById('hlPanVmp').value = pan.vmp;
    document.getElementById('hlPanVoc').value = pan.voc;
}

function execSolarHealthCheck() {
    const stepUp = parseInt(document.getElementById('hlLoadType').value || "1");
    const rawPump = parseFloat(document.getElementById('hlPumpVal').value) || 0;
    const unit = document.getElementById('hlPumpUnit').value;
    const pumpKW = unit === 'HP' ? rawPump * 0.75 : rawPump;

    const invKw = parseFloat(document.getElementById('hlInvKw').value) || 0;
    const vdcMax = parseFloat(document.getElementById('hlInvVdcMax').value) || 900;
    const idcMax = parseFloat(document.getElementById('hlInvIdcMax').value) || 40;
    const mpptMin = parseFloat(document.getElementById('hlInvMpptMin').value) || 486;
    const mpptMax = parseFloat(document.getElementById('hlInvMpptMax')?.value) || 750;
    const midMppt = (mpptMin + mpptMax) / 2;

    const pMax = parseFloat(document.getElementById('hlPanPmax').value) || 0;
    const imp = parseFloat(document.getElementById('hlPanImp').value) || 0;
    const vmp = parseFloat(document.getElementById('hlPanVmp').value) || 0;
    const voc = parseFloat(document.getElementById('hlPanVoc').value) || 0;
    const strings = parseInt(document.getElementById('hlStrings').value) || 1;
    const perStr = parseInt(document.getElementById('hlPerStr').value) || 1;
    if (pumpKW <= 0 || invKw <= 0 || pMax <= 0) return alert("Vui lòng nhập đầy đủ thông số hệ thống!");

    const totalPanels = strings * perStr;
    const totalKWp = (totalPanels * pMax) / 1000;
    const vocCold = perStr * voc * 1.05;
    const vmpTotal = perStr * vmp;
    const impTotal = strings * imp;
    const reqInvKw = stepUp === 0 ? pumpKW : (stepUp === 1 ? pumpKW * 1.3 : pumpKW * 1.6);
    const minReqKwp = pumpKW * 1.3;
    const idealReqKwp = pumpKW * 1.55;

    let score = 100;
    let issues = [];
    let upgrades = [];

    if (vocCold > vdcMax) {
        score -= 35;
        const safeMax = Math.floor((vdcMax - 0.1) / (voc * 1.05));
        issues.push(`🔴 <b>Nguy hiểm quá áp sáng sớm trời lạnh (10°C):</b> Voc đạt <b>${vocCold.toFixed(1)}V</b> vượt ngưỡng <b>${vdcMax}V</b> của biến tần.`);
        upgrades.push(`Giảm ngay số tấm mỗi chuỗi từ ${perStr} tấm xuống tối đa <b>${safeMax} tấm/chuỗi</b> để tránh nổ tụ/báo lỗi quá áp.`);
    }
    if (vmpTotal < midMppt - 15) {
        score -= 20;
        const needPerStr = Math.round(midMppt / vmp);
        issues.push(`🟡 <b>Áp làm việc thấp hơn vùng trung bình MPPT (${midMppt.toFixed(0)}V):</b> Vmp hiện tại <b>${vmpTotal.toFixed(1)}V</b> dễ bị tụt áp trưa nắng nóng khiến bơm chạy yếu.`);
        upgrades.push(`Đấu nối tiếp thêm <b>${Math.max(1, needPerStr - perStr)} tấm/chuỗi</b> (nâng lên <b>${needPerStr} tấm/chuỗi</b>) để đưa áp vào vùng ngọt MPPT.`);
    }
    if (impTotal > idcMax) {
        score -= 25;
        issues.push(`🔴 <b>Quá dòng DC đầu vào:</b> Tổng dòng <b>${impTotal.toFixed(1)}A</b> vượt mức chịu đựng <b>${idcMax}A</b> của biến tần.`);
        upgrades.push(`Tách bớt chuỗi song song hoặc nâng cấp biến tần dòng DC lớn hơn.`);
    }
    if (invKw < reqInvKw - 0.5) {
        score -= 20;
        issues.push(`🟡 <b>Biến tần yếu so với tải bơm:</b> Bơm ${pumpKW.toFixed(1)}kW đang kéo biến tần ${invKw}kW dễ báo lỗi quá dòng (OC) khi khởi động.`);
        upgrades.push(`Nâng cấp biến tần lên cấp <b>${Math.ceil(reqInvKw)}kW</b> (1–2 cấp trên tải bơm) để khởi động khỏe và bền máy.`);
    }
    if (totalKWp < minReqKwp) {
        score -= 20;
        const missMin = Math.ceil(((minReqKwp - totalKWp) * 1000) / pMax);
        const missIdeal = Math.ceil(((idealReqKwp - totalKWp) * 1000) / pMax);
        issues.push(`🟡 <b>Thiếu công suất giàn pin (Chưa đạt chuẩn ≥ 1.3x tải bơm):</b> Giàn pin hiện có <b>${totalKWp.toFixed(2)} kWp</b>, mức tối thiểu cần đạt <b>${minReqKwp.toFixed(2)} kWp</b>.`);
        upgrades.push(`Lắp bổ sung tối thiểu <b>${missMin} tấm pin (${pMax}W)</b> (hoặc <b>${missIdeal} tấm</b> để đạt mức lý tưởng <b>${idealReqKwp.toFixed(2)} kWp</b>) giúp bơm chạy khỏe cả ngày.`);
    }

    score = Math.max(10, score);
    const badgeColor = score >= 85 ? '#16a34a' : (score >= 60 ? '#ea580c' : '#dc2626');
    const statusLabel = score >= 85 ? 'HỆ THỐNG HOẠT ĐỘNG TỐT' : (score >= 60 ? 'CẦN TỐI ƯU ĐỂ ĐẠT HIỆU SUẤT CAO' : 'CẢNH BÁO LỖI KỸ THUẬT - CẦN XỬ LÝ');
    if (issues.length === 0) issues.push(`🟢 <b>Cấu hình phối ghép chuẩn xác:</b> Điện áp (≥ trung bình MPPT), dòng điện và công suất pin (≥ 1.3x tải bơm) đều nằm trong vùng tối ưu của biến tần.`);
    if (upgrades.length === 0) upgrades.push(`Giữ nguyên cấu hình hiện tại. Chỉ cần vệ sinh bề mặt tấm pin định kỳ và kiểm tra siết chặt các đầu cốt tủ điện.`);

    window.lastHealthZaloText = `🩺 KẾT QUẢ KHÁM SỨC KHỎE HỆ BƠM NLMT\n• Hệ hiện tại: Bơm ${pumpKW.toFixed(1)}kW | Biến tần ${invKw}kW | ${strings} chuỗi x ${perStr} tấm ${pMax}W (${totalKWp.toFixed(2)} kWp)\n• Đánh giá: ${score}/100 điểm (${statusLabel})\n--------------------------------\n📋 Chẩn đoán:\n${issues.map(x => x.replace(/<[^>]+>/g, '')).join('\n')}\n--------------------------------\n💡 Phương án nâng cấp:\n${upgrades.map(x => '- ' + x.replace(/<[^>]+>/g, '')).join('\n')}`;

    document.getElementById('toolModalResult').innerHTML = `
        <div style="padding:12px; border-radius:8px; background:#f8fafc; border:1px solid #cbd5e1; border-left:5px solid ${badgeColor}; margin-bottom:10px;">
            <div style="font-size:15px; font-weight:800; color:${badgeColor};">📊 SỨC KHỎE HỆ THỐNG: ${score}/100 ĐIỂM — ${statusLabel}</div>
            <div style="font-size:12.5px; color:#475569; margin-top:4px;">Tổng giàn pin: <b>${totalPanels} tấm (${totalKWp.toFixed(2)} kWp)</b> | Vmp: <b>${vmpTotal.toFixed(1)}V</b> | Voc (10°C): <b>${vocCold.toFixed(1)}V</b> | Dòng Imp: <b>${impTotal.toFixed(1)}A</b></div>
        </div>
        <div style="padding:12px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; font-size:13px; line-height:1.6; margin-bottom:10px;">
            <div style="font-weight:700; color:var(--dark); margin-bottom:4px;">📋 Chi tiết chẩn đoán kỹ thuật:</div>
            ${issues.join('<br>')}
        </div>
        <div style="padding:12px; background:#f0fdf4; border:1px solid #bbf7d0; border-left:4px solid #16a34a; border-radius:8px; font-size:13px; color:#14532d; line-height:1.6;">
            <div style="font-weight:700; margin-bottom:4px;">💡 Phương án nâng cấp & tối ưu:</div>
            • ${upgrades.join('<br>• ')}
        </div>
        <button class="btn" style="width:100%; background:#0068ff; margin-top:12px; font-size:14.5px;" onclick="navigator.clipboard.writeText(window.lastHealthZaloText).then(()=>alert('✅ Đã sao chép kết quả khám bệnh gửi Zalo!'))">💬 Sao chép kết quả gửi Zalo khách hàng</button>
    `;
}

/* === ĐIỀU KHIỂN TRỢ LÝ KỸ THUẬT SOLAR AI === */
let aiTypingTimer = null;

function toggleSolarAiBox() {
    const box = document.getElementById('solarAiBox');
    if (!box) return;
    const isOpening = !box.classList.contains('open');
    box.classList.toggle('open');
    if (isOpening) {
        playSolarAiIntro();
    } else if (aiTypingTimer) {
        clearInterval(aiTypingTimer);
    }
}

function playSolarAiIntro() {
    const greetEl = document.getElementById('solarAiGreeting');
    const btns = document.querySelectorAll('#solarAiMenu .seq-item');
    if (!greetEl) return;

    if (aiTypingTimer) clearInterval(aiTypingTimer);
    btns.forEach(b => b.classList.remove('show'));
    greetEl.innerHTML = "";

    const userName = currentUser ? currentUser.username : "bạn";
    const fullText = `Chào ${userName} mình là Nắng - Trợ lý Solar AI, chúc bạn một ngày bứt phá, chốt được nhiều đơn. Bạn cần hỗ trợ gì không?`;
    let idx = 0;

    aiTypingTimer = setInterval(() => {
        idx++;
        const currentSlice = fullText.slice(0, idx);
        greetEl.innerHTML = currentUser
            ? currentSlice.replace(`Chào ${userName}`, `Chào <b>${userName}</b>`)
            : currentSlice;

        if (idx >= fullText.length) {
            clearInterval(aiTypingTimer);
            btns.forEach((btn, bIdx) => {
                setTimeout(() => {
                    btn.classList.add('show');
                }, bIdx * 160);
            });
        }
    }, 24);
}

function aiQuickAction(type) {
    toggleSolarAiBox();
    if (type === 'solar') openCalcToolModal('solar');
    else if (type === 'health') openCalcToolModal('health');
    else if (type === 'error') {
        const navItems = document.querySelectorAll('.nav-item');
        const errTab = navItems.length > 1 ? navItems[1] : null;
        const lblEl = document.getElementById('mobileCurrentPageLabel');
        if (lblEl) lblEl.innerText = 'Xử lý lỗi';
        loadSubPage('page-xu-ly-loi.html', errTab);
    }
}



