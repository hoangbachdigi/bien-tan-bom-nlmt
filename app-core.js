const API_URL = "https://script.google.com/macros/s/AKfycbyISpPrfmR33J18XzEJ55h2PVmCAqOaNr_5d0UMWlkMsxf0ydVGcUtBqCOBq7f6KAgrgg/exec";

let cachedData = JSON.parse(localStorage.getItem('solar_app_cache')) || null;
let appData = cachedData || {
    users: [{ username: 'nguyenhoangbach', role: 'admin', status: 'approved' }],
    configs: [],
    logs: [],
    bookings: []
};
let guestCount = parseInt(localStorage.getItem('guest_visits_count')) || 0;
let currentUser = JSON.parse(sessionStorage.getItem('current_user')) || null;
let lastSolarQuoteData = null;
let currentSolarPlans = [];
let activeCalcToolId = 'solar';
let srvState = { step: 1, year: new Date().getFullYear(), month: new Date().getMonth(), date: "", time: "", form: {} };

document.addEventListener("DOMContentLoaded", () => {
    renderVietnamDate();
    updateTopUserBar();
    navigateApp('home');
    checkSharedProductUrl();
    syncDataFromGoogleSheet();
});

function renderVietnamDate() {
    const el = document.getElementById('vnDateDisplay');
    if (!el) return;
    try {
        const now = new Date();
        const str = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
        el.innerText = "📅 " + str;
    } catch (e) { el.innerText = "📅 Hôm nay"; }
}

function toggleSideMenu(open) {
    document.getElementById('sideMenuDrawer')?.classList.toggle('open', open);
    document.getElementById('sideMenuOverlay')?.classList.toggle('open', open);
}

function setBottomNavActive(tabKey) {
    document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
    document.getElementById('bnav_' + tabKey)?.classList.add('active');
}

function navigateApp(route) {
    toggleSideMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (route === 'home') { setBottomNavActive('home'); renderHomePage(); }
    else if (route === 'products') { setBottomNavActive('products'); renderProductsFullPage(1); }
    else if (route.startsWith('tool-')) {
        setBottomNavActive('tools');
        activeCalcToolId = route.replace('tool-', '');
        renderToolsWorkspace();
    }
    else if (route === 'errors') { setBottomNavActive('home'); renderErrorsFullPage(1); }
    else if (route === 'service') { setBottomNavActive('home'); renderServiceFullPage(); }
    else if (route === 'knowledge') { setBottomNavActive('home'); renderKnowledgeFullPage(); }
}

function handleGlobalSearch() {
    const q = (document.getElementById('globalSearchInput')?.value || "").trim();
    if (!q) return showToast("Nhập từ khóa sản phẩm hoặc mã lỗi cần tìm!", "warn");
    if (/^(e\.|err|ol|oc|ou|lu|oh|ef|pf)/i.test(q)) renderErrorsFullPage(1, q);
    else renderProductsFullPage(1, q);
}
async function syncDataFromGoogleSheet() {
    try {
        const url = API_URL + (API_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        appData.users = [{ username: 'nguyenhoangbach', role: 'admin', status: 'approved' }, ...(data.users || []).map(u => ({ ...u, role: 'user' }))];
        appData.configs = data.configs || [];
        appData.logs = data.logs || [];
        appData.bookings = data.bookings || [];
        const visitEl = document.getElementById('todayVisitCounter');
        if (visitEl && data.todayVisits) visitEl.innerText = Number(data.todayVisits).toLocaleString('vi-VN');
        localStorage.setItem('solar_app_cache', JSON.stringify(appData));

        if (currentUser) {
            const fresh = appData.users.find(u => u.username === currentUser.username);
            if (fresh) { currentUser = fresh; sessionStorage.setItem('current_user', JSON.stringify(currentUser)); }
        }
        updateTopUserBar();
        if (document.getElementById('homeBannerSlot')) renderHomePage();
        if (document.getElementById('phoneScreenBody') && srvState.step === 4) renderSrvStep4();
    } catch (e) {}
}

function showToast(msg, type = 'info', duration = 3000) {
    let box = document.getElementById('globalToastContainer');
    if (!box) {
        box = document.createElement('div');
        box.id = 'globalToastContainer';
        box.className = 'toast-container';
        document.body.appendChild(box);
    }
    const item = document.createElement('div');
    item.className = `toast-item ${type}`;
    item.innerHTML = msg;
    box.appendChild(item);
    setTimeout(() => {
        item.style.opacity = '0';
        item.style.transition = '0.25s';
        setTimeout(() => item.remove(), 260);
    }, duration);
}

function clearInputError(id) {
    document.getElementById(id)?.classList.remove('input-error-ring');
    document.getElementById(id + '_err')?.remove();
}

function markInputError(id, msg) {
    clearInputError(id);
    const el = document.getElementById(id);
    if (!el) return showToast(msg, 'warn');
    el.classList.add('input-error-ring');
    el.focus();
    const div = document.createElement('div');
    div.id = id + '_err';
    div.className = 'inline-err-text';
    div.innerText = msg;
    el.parentNode.appendChild(div);
}

function openGlobalModal(html) {
    document.getElementById('globalModalBody').innerHTML = html;
    document.getElementById('globalModal').style.display = 'flex';
}
function closeGlobalModal() { document.getElementById('globalModal').style.display = 'none'; }
function updateTopUserBar() {
    const topTxt = document.getElementById('userStatusText');
    const drawerBox = document.getElementById('drawerAccountBox');
    if (currentUser) {
        if (topTxt) topTxt.innerText = currentUser.username;
        if (drawerBox) {
            drawerBox.innerHTML = `
                <div style="font-size:13px; margin-bottom:8px;">👤 Xin chào <b>${currentUser.username}</b></div>
                <div class="drawer-auth-btns">
                    <button class="btn btn-primary" onclick="toggleSideMenu(false); openAccountPanel()">Tài khoản</button>
                    <button class="btn btn-danger" onclick="toggleSideMenu(false); processLogout()">Đăng xuất</button>
                </div>
            `;
        }
    } else {
        const left = Math.max(0, 3 - guestCount);
        if (topTxt) topTxt.innerText = `Đăng nhập (${left} lượt)`;
        if (drawerBox) {
            drawerBox.innerHTML = `
                <div class="drawer-auth-btns">
                    <button class="btn btn-primary" onclick="toggleSideMenu(false); openAuthModal('login')">Đăng nhập</button>
                    <button class="btn btn-outline" onclick="toggleSideMenu(false); openAuthModal('register')">Đăng ký</button>
                </div>
            `;
        }
    }
}

function openAuthModal(mode) {
    const isReg = mode === 'register';
    openGlobalModal(`
        <h3 style="margin-top:0; color:var(--primary);">${isReg ? '📝 Đăng Ký Tài Khoản Zalo' : '👤 Đăng Nhập Hệ Thống'}</h3>
        <p style="font-size:13px; color:#475569;">${isReg ? 'Đăng ký bằng Tên Zalo để nhận ngay <b>60 ngày sử dụng miễn phí</b>!' : 'Nhập chính xác Tên tài khoản Zalo đã đăng ký của bạn.'}</p>
        <div class="form-group">
            <label>Tên tài khoản Zalo:</label>
            <input type="text" id="modalZaloInput" placeholder="Ví dụ: Nguyen Van A" oninput="clearInputError('modalZaloInput')" onkeydown="if(event.key==='Enter') ${isReg ? 'processRegister()' : 'processLogin()'}">
        </div>
        <div class="grid-2" style="gap:8px;">
            <button class="btn btn-primary" onclick="processLogin()">Đăng nhập</button>
            <button class="btn btn-success" onclick="processRegister()">Đăng ký mới</button>
        </div>
    `);
    setTimeout(() => document.getElementById('modalZaloInput')?.focus(), 80);
}

function openAccountPanel() {
    if (!currentUser) return openAuthModal('login');
    if (currentUser.role === 'admin') return renderAdminDashboard();

    const now = Date.now();
    const exp = Number(currentUser.expiry) || 0;
    const isLife = exp >= 9000000000000;
    let statusStr = isLife ? '<b style="color:#0284c7;">Vĩnh viễn</b>'
        : (exp === 0 ? '<b style="color:#16a34a;">Còn 60 ngày ưu đãi</b>'
        : (exp > now ? `<b style="color:#16a34a;">Còn ${Math.ceil((exp - now)/86400000)} ngày</b>` : '<b style="color:#dc2626;">Đã hết hạn</b>'));

    const pendingList = (currentUser.pendingOrder || "").split(",").map(s => s.trim()).filter(Boolean);
    const pendingHtml = pendingList.length ? `<div style="padding:8px; background:#fef3c7; border-radius:6px; font-size:12px; color:#92400e; margin-bottom:8px;">⏳ Chờ duyệt ${pendingList.length} đơn: <b>${pendingList.join(', ')}</b></div>` : '';

    openGlobalModal(`
        <h3 style="margin-top:0; color:var(--primary);">👤 Thông Tin Tài Khoản</h3>
        <p style="margin:4px 0;">• Tên Zalo: <b>${currentUser.username}</b></p>
        <p style="margin:4px 0 12px;">• Thời hạn: ${statusStr}</p>
        ${isLife ? '' : `
            <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:10px; margin-bottom:12px;">
                <div style="font-weight:700; font-size:13px; margin-bottom:6px;">🎁 Nhập mã đơn hàng để cộng thêm +10 ngày/đơn:</div>
                ${pendingHtml}
                <input type="text" id="userOrderCodeInput" placeholder="Nhập mã đơn hàng (VD: DH101, DH102)..." style="margin-bottom:8px;" oninput="clearInputError('userOrderCodeInput')">
                <button class="btn btn-success" style="width:100%;" onclick="submitUserOrderCode()">Gửi mã đơn hàng</button>
            </div>
        `}
        <button class="btn btn-danger" style="width:100%;" onclick="processLogout()">Đăng xuất</button>
    `);
}
async function processRegister() {
    const name = (document.getElementById('modalZaloInput')?.value || "").trim();
    if (!name) return markInputError('modalZaloInput', "Vui lòng nhập tên Zalo!");
    if (name === 'nguyenhoangbach') return markInputError('modalZaloInput', "Tên này thuộc quyền quản trị!");
    showToast("⏳ Đang đăng ký tài khoản...", "info", 2000);
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'register', username: name }) });
    showToast("✅ Đăng ký thành công! Liên hệ Admin Zalo để được duyệt kích hoạt.", "success", 4000);
    closeGlobalModal();
    syncDataFromGoogleSheet();
}

async function processLogin() {
    const name = (document.getElementById('modalZaloInput')?.value || "").trim();
    if (!name) return markInputError('modalZaloInput', "Vui lòng nhập tên Zalo!");
    const user = appData.users.find(u => u.username === name);
    if (!user) return markInputError('modalZaloInput', "Tên Zalo chưa đăng ký! Hãy bấm nút Đăng ký mới.");
    if (user.status === 'pending') return markInputError('modalZaloInput', "Tài khoản đang chờ Admin duyệt!");
    currentUser = user;
    sessionStorage.setItem('current_user', JSON.stringify(currentUser));
    updateTopUserBar();
    closeGlobalModal();
    showToast(`👋 Xin chào <b>${user.username}</b>!`, "success", 2500);
    if (user.role !== 'admin') fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'log_login', username: name }) });
    else renderAdminDashboard();
}

function processLogout() {
    currentUser = null;
    sessionStorage.removeItem('current_user');
    updateTopUserBar();
    closeGlobalModal();
    showToast("Đã đăng xuất tài khoản.", "info", 2000);
}

async function submitUserOrderCode() {
    const raw = (document.getElementById('userOrderCodeInput')?.value || "").trim();
    if (!raw) return markInputError('userOrderCodeInput', "Vui lòng nhập mã đơn hàng!");
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'submit_order', username: currentUser.username, orderCode: raw }) });
    showToast("✅ Đã gửi mã đơn hàng thành công!", "success", 3000);
    closeGlobalModal();
    syncDataFromGoogleSheet();
}

function checkLimitAndRun(fn) {
    if (currentUser) {
        if (currentUser.role === 'admin') return fn();
        if (currentUser.status !== 'approved') { showToast("Tài khoản đang chờ duyệt!", "warn"); return openAccountPanel(); }
        const exp = Number(currentUser.expiry) || 0;
        if (exp > 0 && exp < Date.now()) { showToast("Tài khoản đã hết hạn! Hãy nhập mã đơn hàng để gia hạn.", "warn"); return openAccountPanel(); }
        return fn();
    }
    if (guestCount >= 3) { showToast("Bạn đã hết 3 lượt tính miễn phí! Đăng ký Zalo để nhận 60 ngày dùng miễn phí.", "warn"); return openAuthModal('register'); }
    guestCount++;
    localStorage.setItem('guest_visits_count', guestCount);
    updateTopUserBar();
    fn();
}
async function renderAdminDashboard() {
    const curBanner = (appData.configs.find(c => c.code === 'BANNER') || {}).media || '';
    const rowsHtml = appData.users.filter(u => u.role !== 'admin').map((u, i) => {
        const exp = Number(u.expiry) || 0;
        const isLife = exp >= 9000000000000;
        const dLeft = exp > Date.now() ? Math.ceil((exp - Date.now()) / 86400000) : (exp === 0 ? 60 : 0);
        const badge = isLife ? '<span style="color:#0284c7;font-weight:700;">(Vĩnh viễn)</span>' : `<span style="color:#16a34a;">(Còn ${dLeft}d)</span>`;
        const orders = (u.pendingOrder || '').split(',').map(s => s.trim()).filter(Boolean);
        const orderBtns = orders.map(c => `
            <div style="margin-top:3px;">
                <span style="background:#fef3c7;color:#b45309;padding:1px 5px;border-radius:4px;font-size:11px;">📦 ${c}</span>
                <button class="btn btn-primary" style="padding:2px 6px;font-size:11px;width:auto;" onclick="adminOrderAct('approve_order','${u.username}','${c}')">+10d</button>
                <button class="btn btn-outline" style="padding:1px 5px;font-size:11px;color:#dc2626;" onclick="adminOrderAct('reject_order','${u.username}','${c}')">&times;</button>
            </div>
        `).join('');
        return `
            <tr>
                <td><b>#${i + 1} ${u.username}</b> ${badge}${orderBtns}</td>
                <td style="white-space:nowrap;">
                    ${u.status === 'pending' ? `<button class="btn btn-success" style="padding:3px 7px;font-size:11px;" onclick="adminUserAct('approve','${u.username}')">Duyệt</button>` : ''}
                    ${!isLife ? `<button class="btn" style="padding:3px 7px;font-size:11px;background:#0284c7;" onclick="adminUserAct('set_lifetime','${u.username}')">Vĩnh viễn</button>` : ''}
                    <button class="btn btn-danger" style="padding:3px 7px;font-size:11px;" onclick="adminUserAct('delete','${u.username}')">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');

    openGlobalModal(`
        <h3 style="margin-top:0; color:var(--primary);">⚙️ Quản Trị Hệ Thống</h3>
        <div class="form-group">
            <label>🖼️ Link Banner Trang Chủ (Google Photos):</label>
            <div style="display:flex; gap:6px;">
                <input type="text" id="adminBannerUrl" value="${curBanner}" placeholder="Dán link ảnh banner...">
                <button class="btn btn-success" onclick="saveBannerUrl()">Lưu</button>
            </div>
        </div>
        <div class="table-wrap" style="max-height:320px; overflow-y:auto;">
            <table class="data-table">
                <thead><tr><th>Tài khoản Zalo</th><th>Thao tác</th></tr></thead>
                <tbody>${rowsHtml || '<tr><td colspan="2" style="text-align:center;">Chưa có thành viên</td></tr>'}</tbody>
            </table>
        </div>
        <button class="btn btn-danger" style="width:100%; margin-top:10px;" onclick="processLogout()">Đăng xuất Admin</button>
    `);
}

async function saveBannerUrl() {
    const url = (document.getElementById('adminBannerUrl')?.value || '').trim();
    showToast("⏳ Đang lưu Banner...", "info", 1500);
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'update_banner', bannerUrl: url }) });
    await syncDataFromGoogleSheet();
    showToast("✅ Đã cập nhật Banner!", "success");
}

async function adminUserAct(act, username) {
    if (act === 'delete' && !confirm(`Xóa tài khoản ${username}?`)) return;
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: act, username }) });
    await syncDataFromGoogleSheet();
    renderAdminDashboard();
}

async function adminOrderAct(act, username, orderCode) {
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: act, username, orderCode }) });
    await syncDataFromGoogleSheet();
    renderAdminDashboard();
}
/* === TRANG CHỦ CHUẨN APP & DANH SÁCH SẢN PHẨM === */
function getCombinedProducts() {
    const real = appData.configs.filter(c => c.code === 'SAN_PHAM').map(c => {
        const imgs = (c.media || '').split(/\||,/).map(s => s.trim()).filter(Boolean);
        return { title: c.title, imgs: imgs.length ? imgs : ['https://unsplash.com'], specs: c.content };
    });
    const mock = (typeof MOCK_PRODUCTS !== 'undefined' ? MOCK_PRODUCTS : []).map(m => ({
        title: m.title, imgs: (m.img || '').split(/\||,/).map(s => s.trim()).filter(Boolean), specs: m.specs
    }));
    return real.length ? [...real, ...mock] : mock;
}

function renderHomePage() {
    const main = document.getElementById('mainPageContent');
    if (!main) return;
    const bannerCfg = appData.configs.find(c => c.code === 'BANNER');
    const bannerHtml = (bannerCfg && bannerCfg.media)
        ? `<img src="${bannerCfg.media}" alt="Banner Solar">`
        : `<div style="padding:26px 18px; text-align:center;">
               <div style="font-size:18px; font-weight:900; margin-bottom:4px;">⚡ GIẢI PHÁP BIẾN TẦN BƠM & ĐIỆN MẶT TRỜI 3 PHA 380V</div>
               <div style="font-size:12.5px; opacity:0.9;">Phối ghép chuẩn kỹ thuật SG600 • Lập báo giá nhanh • Hỗ trợ 1:1</div>
           </div>`;

    const prods = getCombinedProducts().slice(0, 8);
    const prodCards = prods.map((p, idx) => `
        <div class="prod-card" onclick="openProductDetail(${idx})">
            <img class="prod-thumb" src="${p.imgs[0]}" alt="${p.title}" loading="lazy">
            <div class="prod-info">
                <h4 class="prod-name">${p.title}</h4>
                <div class="prod-spec">${(p.specs || '').split('|').slice(0, 2).join(' • ')}</div>
            </div>
        </div>
    `).join('');

    main.innerHTML = `
        <div class="hero-banner" id="homeBannerSlot">${bannerHtml}</div>
        <div class="quick-4-grid">
            <div class="q4-card" onclick="navigateApp('tool-solar')">
                <div class="q4-ico">☀️</div>
                <div class="q4-lbl">Tính chuỗi pin</div>
            </div>
            <div class="q4-card" onclick="navigateApp('tool-health')">
                <div class="q4-ico">🩺</div>
                <div class="q4-lbl">Khám sức khỏe</div>
            </div>
            <div class="q4-card" onclick="navigateApp('service')">
                <div class="q4-ico">📹</div>
                <div class="q4-lbl">Đặt lịch hỗ trợ</div>
            </div>
            <div class="q4-card" onclick="navigateApp('errors')">
                <div class="q4-ico">⚠️</div>
                <div class="q4-lbl">Tra mã lỗi</div>
            </div>
        </div>
        <div class="sec-ribbon">
            <span class="ribbon-tag">🔥 Thiết Bị Nổi Bật Trong Kho</span>
            <button class="btn btn-outline" style="padding:4px 10px; font-size:12px;" onclick="navigateApp('products')">Xem tất cả ➔</button>
        </div>
        <div class="prod-grid">${prodCards}</div>
    `;
}
function checkSharedProductUrl() {
    const spIdx = new URLSearchParams(window.location.search).get('sp');
    if (spIdx !== null && !isNaN(parseInt(spIdx))) openProductDetail(parseInt(spIdx));
}

function renderProductsFullPage(page = 1, keyword = "") {
    const main = document.getElementById('mainPageContent');
    if (!main) return;
    const all = getCombinedProducts().filter(p => !keyword || p.title.toLowerCase().includes(keyword.toLowerCase()) || p.specs.toLowerCase().includes(keyword.toLowerCase()));
    const perPage = 20;
    const totalPages = Math.max(1, Math.ceil(all.length / perPage));
    const items = all.slice((page - 1) * perPage, page * perPage);

    const cards = items.length === 0
        ? `<div style="grid-column:1/-1; text-align:center; padding:30px; color:#64748b;">Không tìm thấy thiết bị phù hợp.</div>`
        : items.map((p, i) => {
            const realIdx = getCombinedProducts().indexOf(p);
            return `
                <div class="prod-card" onclick="openProductDetail(${realIdx})">
                    <img class="prod-thumb" src="${p.imgs[0]}" alt="${p.title}" loading="lazy">
                    <div class="prod-info">
                        <h4 class="prod-name">${p.title}</h4>
                        <div class="prod-spec">${(p.specs || '').split('|').slice(0, 2).join(' • ')}</div>
                    </div>
                </div>
            `;
        }).join('');

    const pagBtns = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => `
        <button class="btn ${i + 1 === page ? 'btn-primary' : 'btn-outline'}" style="width:auto; padding:5px 11px;" onclick="renderProductsFullPage(${i + 1}, '${keyword.replace(/'/g, "\\'")}')">${i + 1}</button>
    `).join('') : '';

    main.innerHTML = `
        <div class="sec-ribbon" style="margin-top:0;">
            <span class="ribbon-tag">📦 Danh Mục Thiết Bị (${all.length})</span>
            ${keyword ? `<button class="btn btn-outline" style="padding:4px 10px; font-size:12px;" onclick="document.getElementById('globalSearchInput').value=''; renderProductsFullPage(1)">Xóa lọc</button>` : ''}
        </div>
        <div class="prod-grid">${cards}</div>
        <div style="display:flex; justify-content:center; gap:6px; margin-top:14px;">${pagBtns}</div>
    `;
}

function openProductDetail(idx) {
    const item = getCombinedProducts()[idx];
    if (!item) return;
    const lines = (item.specs || '').split(/\||\n/).map(s => s.trim()).filter(Boolean);
    const specList = lines.map(l => `<li style="margin-bottom:5px;">✅ ${l}</li>`).join('');
    const thumbs = item.imgs.length > 1 ? `<div style="display:flex; gap:6px; overflow-x:auto; margin:8px 0;">${item.imgs.map(src => `<img src="${src}" style="width:56px; height:56px; object-fit:cover; border-radius:6px; cursor:pointer; border:1px solid #cbd5e1;" onclick="document.getElementById('modalMainProdImg').src='${src}'">`).join('')}</div>` : '';

    openGlobalModal(`
        <img id="modalMainProdImg" src="${item.imgs[0]}" style="width:100%; max-height:260px; object-fit:contain; background:#f8fafc; border-radius:8px;">
        ${thumbs}
        <h3 style="margin:10px 0 8px; color:var(--primary); font-size:17px;">${item.title}</h3>
        <ul style="padding-left:0; list-style:none; font-size:13.5px; color:#334155; margin-bottom:14px;">${specList}</ul>
        <button class="btn" style="width:100%; background:#0068ff;" onclick="copyProductLink(${idx}, '${item.title.replace(/'/g, "\\'")}')">🔗 Sao chép link chia sẻ sản phẩm</button>
    `);
}

function copyProductLink(idx, title) {
    const url = `${window.location.origin + window.location.pathname}?sp=${idx}`;
    navigator.clipboard?.writeText(url).then(() => showToast(`✅ Đã sao chép link "${title}"!`, "success"));
}
/* === TRA CỨU MÃ LỖI & KIẾN THỨC KINH NGHIỆM === */
function getCombinedErrors() {
    const real = appData.configs.filter(c => c.code === 'MA_LOI').map(c => {
        const b = (c.title || '').split('|');
        const d = (c.content || '').split('|');
        return { brand: (b || 'PowerS').trim(), code: (b || '').trim(), desc: (d || '').trim(), fix: (d || '').trim() };
    });
    return [...real, ...(typeof MOCK_ERRORS !== 'undefined' ? MOCK_ERRORS : [])];
}

function renderErrorsFullPage(page = 1, presetQuery = null) {
    const main = document.getElementById('mainPageContent');
    if (!main) return;
    if (!document.getElementById('errSearchInput')) {
        main.innerHTML = `
            <div class="card-panel">
                <h3 style="margin:0 0 10px; color:var(--primary); font-size:16.5px;">⚠️ Tra Cứu Mã Lỗi Biến Tần</h3>
                <div class="grid-2" style="gap:8px; margin-bottom:10px;">
                    <select id="errBrandSelect" onchange="renderErrorsFullPage(1)">
                        <option value="ALL">Tất cả các hãng biến tần</option>
                        <option value="PowerS">Power S</option>
                        <option value="Voltique">Voltique</option>
                        <option value="Green Nova">Green Nova</option>
                        <option value="SAJ">SAJ</option>
                    </select>
                    <input type="text" id="errSearchInput" value="${presetQuery || ''}" placeholder="Nhập mã lỗi (VD: E.OC1, LU, OL)..." oninput="renderErrorsFullPage(1)">
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>Hãng</th><th>Mã lỗi</th><th>Nguyên nhân</th><th>Cách khắc phục</th></tr></thead>
                        <tbody id="errTableBody"></tbody>
                    </table>
                </div>
                <div id="errPagBox" style="display:flex; justify-content:center; gap:6px; margin-top:10px;"></div>
            </div>
        `;
    }
    const q = (document.getElementById('errSearchInput')?.value || '').toLowerCase().trim();
    const br = document.getElementById('errBrandSelect')?.value || 'ALL';
    const list = getCombinedErrors().filter(e => (br === 'ALL' || e.brand.toLowerCase() === br.toLowerCase()) && (!q || e.code.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q)));
    const perPage = 20;
    const totalPages = Math.max(1, Math.ceil(list.length / perPage));
    const items = list.slice((page - 1) * perPage, page * perPage);

    document.getElementById('errTableBody').innerHTML = items.length === 0
        ? `<tr><td colspan="4" style="text-align:center; padding:18px;">Không tìm thấy mã lỗi phù hợp.</td></tr>`
        : items.map(e => `<tr><td><b>${e.brand}</b></td><td style="color:var(--danger); font-weight:800;">${e.code}</td><td>${e.desc}</td><td>${e.fix}</td></tr>`).join('');

    document.getElementById('errPagBox').innerHTML = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => `
        <button class="btn ${i + 1 === page ? 'btn-primary' : 'btn-outline'}" style="width:auto; padding:4px 10px;" onclick="renderErrorsFullPage(${i + 1})">${i + 1}</button>
    `).join('') : '';
}

function renderKnowledgeFullPage() {
    const main = document.getElementById('mainPageContent');
    if (!main) return;
    const real = appData.configs.filter(c => c.code === 'KIEN_THUC').map(c => ({ title: c.title, date: 'Mới cập nhật', content: c.content, video: c.media }));
    const blogs = [...real, ...(typeof MOCK_KNOWLEDGE !== 'undefined' ? MOCK_KNOWLEDGE : [])];
    window._cachedBlogs = blogs;

    main.innerHTML = `
        <div class="card-panel">
            <h3 style="margin:0 0 10px; color:var(--primary); font-size:16.5px;">📖 Kiến Thức & Kinh Nghiệm Lắp Đặt</h3>
            ${blogs.map((b, i) => `
                <div style="padding:11px; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="openBlogDetail(${i})">
                    <span style="font-weight:700; font-size:13.5px;">📄 ${b.title}</span>
                    <span style="font-size:11.5px; color:#64748b; white-space:nowrap;">${b.date} ➔</span>
                </div>
            `).join('')}
        </div>
    `;
}

function openBlogDetail(idx) {
    const b = (window._cachedBlogs || [])[idx];
    if (!b) return;
    openGlobalModal(`
        <h3 style="margin:0 0 6px; color:var(--primary); font-size:17px;">${b.title}</h3>
        <div style="font-size:12px; color:#64748b; margin-bottom:10px;">📅 ${b.date}</div>
        <div style="line-height:1.65; font-size:13.5px; color:#334155; white-space:pre-line; margin-bottom:14px;">${b.content}</div>
        ${b.video ? `<a href="${b.video}" target="_blank" class="btn btn-danger" style="display:inline-block; text-decoration:none; margin-bottom:10px;">▶ Xem Video Hướng Dẫn</a>` : ''}
        <button class="btn btn-outline" style="width:100%;" onclick="closeGlobalModal()">Đóng bài viết</button>
    `);
}
/* === KHÔNG GIAN 6 CÔNG CỤ TÍNH TOÁN TRỰC TIẾP TRÊN TRANG === */
const CALC_TOOLS_LIST = [
    { id: 'solar', icon: '☀️', title: 'Tính chuỗi pin & biến tần' },
    { id: 'health', icon: '🩺', title: 'Khám sức khỏe hệ bơm' },
    { id: 'pump', icon: '💧', title: 'Tính công suất bơm' },
    { id: 'vdrop', icon: '⚡', title: 'Tính sụt áp dây' },
    { id: 'acc', icon: '🔩', title: 'Tính phụ kiện' },
    { id: 'divider', icon: '🔌', title: 'Cầu trở phân áp' }
];

function renderToolsWorkspace() {
    const main = document.getElementById('mainPageContent');
    if (!main) return;
    const tabsHtml = CALC_TOOLS_LIST.map(t => `
        <button type="button" class="tool-tab-pill ${t.id === activeCalcToolId ? 'active' : ''}" onclick="activeCalcToolId='${t.id}'; renderToolsWorkspace()">
            ${t.icon} ${t.title}
        </button>
    `).join('');

    main.innerHTML = `
        <div class="card-panel">
            <div class="tool-tabs-bar">${tabsHtml}</div>
            <div id="toolWorkspaceArea"></div>
        </div>
    `;

    const ws = document.getElementById('toolWorkspaceArea');
    if (activeCalcToolId === 'solar') {
        const panelOpts = buildGroupedPanelOptions(580, false);
        ws.innerHTML = `
            <h3 style="margin-top:0; color:var(--primary); font-size:16px;">⚡ Tính Toán Chuỗi Pin & Biến Tần Bơm 3 Pha</h3>
            <div class="solar-sec-box" style="margin-bottom:10px;">
                <div class="solar-sec-title">0. Thông số máy bơm</div>
                <div class="grid-2" style="gap:8px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Loại tải máy bơm:</label>
                        <select id="scLoadType" onchange="updateInverterDropdownAll()">
                            <option value="1" selected>Bơm hỏa tiễn / Bơm chìm (+1 cấp)</option>
                            <option value="0">Bơm đặt cạn / Ly tâm nhẹ (Bằng cấp)</option>
                            <option value="2">Bơm piston / Đẩy cao nặng (+2 cấp)</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label>Tổng công suất máy bơm:</label>
                        <div class="input-unit-group">
                            <input type="text" id="spPumpExpr" inputmode="decimal" placeholder="Nhập công suất..." oninput="clearInputError('spPumpExpr'); cleanPumpExprInput()" onblur="evaluatePumpInput()">
                            <select id="spPumpUnit" onchange="updateInverterDropdownAll()"><option value="kW" selected>kW</option><option value="HP">HP</option></select>
                        </div>
                    </div>
                </div>
                <div id="pumpSuggestNote" style="margin-top:6px; font-size:12px; color:#15803d; font-weight:700; display:none;"></div>
            </div>
            <div class="solar-calc-grid">
                <div class="solar-sec-box">
                    <div class="solar-sec-title">1. Chọn Biến Tần Phù Hợp</div>
                    <div class="form-group"><label>Danh sách biến tần trong kho:</label><select id="spInvIdx" onchange="fillInverterSpecs()"></select></div>
                    <div style="font-size:11.5px; font-weight:700; color:#0284c7; margin:4px 0;">📥 Đầu vào DC (Từ giàn pin):</div>
                    <div class="solar-mini-grid">
                        <div class="form-group"><label>Áp DC Max (V):</label><input type="number" id="invVdcMaxInput" value="900"></div>
                        <div class="form-group"><label>Dòng DC Max (A):</label><input type="number" id="invIdcMaxInput" value="30"></div>
                        <div class="form-group"><label>MPPT Min (V):</label><input type="number" id="invMpptMinInput" value="486" oninput="updateMpptOptField()"></div>
                        <div class="form-group"><label>MPPT Max (V):</label><input type="number" id="invMpptMaxInput" value="750" oninput="updateMpptOptField()"></div>
                    </div>
                    <div class="form-group"><label>Áp MPPT trung bình (V):</label><input type="number" id="invMpptOptInput" value="618" readonly style="background:#f0f9ff; font-weight:700;"></div>
                    <div style="font-size:11.5px; font-weight:700; color:#15803d; margin:4px 0;">📤 Đầu ra AC (Ra máy bơm):</div>
                    <div class="solar-mini-grid">
                        <div class="form-group" style="margin-bottom:0;"><label>Công suất (kW):</label><input type="number" id="invKwInput" step="0.1" value="7.5"></div>
                        <div class="form-group" style="margin-bottom:0;"><label>Dòng định mức (A):</label><input type="number" id="invOutAInput" step="0.1" value="17"></div>
                    </div>
                </div>
                <div class="solar-sec-box">
                    <div class="solar-sec-title">2. Chọn / Nhập Tấm Pin (STC)</div>
                    <div class="form-group"><label>Mẫu tấm pin trong kho:</label><select id="spPanelIdx" onchange="fillPanelSpecs()">${panelOpts}</select></div>
                    <div class="solar-mini-grid">
                        <div class="form-group"><label>Pmax (W):</label><input type="number" id="panPmaxInput" value="580"></div>
                        <div class="form-group"><label>Imp (A):</label><input type="number" id="panImpInput" step="0.01" value="13.22"></div>
                        <div class="form-group"><label>Vmp (V):</label><input type="number" id="panVmpInput" step="0.01" value="43.88"></div>
                        <div class="form-group"><label>Voc (V):</label><input type="number" id="panVocInput" step="0.01" value="52.50"></div>
                    </div>
                    <div class="form-group" style="margin-bottom:0;"><label>Chiều dài dây DC 1 chiều (m):</label><input type="number" id="spDcLen" value="25"></div>
                </div>
            </div>
            <button class="btn btn-primary" onclick="checkLimitAndRun(execRealCombatSolarCalc)">TÍNH TOÁN CẤU HÌNH CHUỖI PIN</button>
            <div id="toolModalResult" style="margin-top:12px;"></div>
        `;
        setTimeout(() => { updateInverterDropdownAll(); fillPanelSpecs(); }, 30);
    } else {
        renderOtherCalcTools(ws, activeCalcToolId);
    }
}
function renderOtherCalcTools(ws, toolId) {
    if (toolId === 'health') {
        const panelOpts = buildGroupedPanelOptions(null, true);
        let invOpts = '';
        ["Power S", "Voltique", "Green Nova", "SAJ"].forEach(br => {
            const list = SOLAR_INVERTERS_DB.map((inv, idx) => ({ ...inv, idx })).filter(x => x.brand === br);
            if (list.length) invOpts += `<optgroup label="Hãng ${br}">${list.map(x => `<option value="${x.idx}">${x.name}</option>`).join('')}</optgroup>`;
        });
        invOpts += `<option value="custom" selected>-- Tự nhập biến tần của khách --</option>`;

        ws.innerHTML = `
            <h3 style="margin-top:0; color:var(--primary); font-size:16px;">🩺 Khám Sức Khỏe Hệ Bơm NLMT</h3>
            <div class="solar-sec-box" style="margin-bottom:10px;">
                <div class="solar-sec-title">1. Thông số Máy bơm hiện tại</div>
                <div class="grid-2" style="gap:8px;">
                    <div class="form-group" style="margin-bottom:0;"><label>Loại bơm:</label><select id="hlLoadType"><option value="1" selected>Bơm hỏa tiễn / Bơm chìm (+1 cấp)</option><option value="0">Bơm đặt cạn (Bằng cấp)</option><option value="2">Bơm tải nặng (+2 cấp)</option></select></div>
                    <div class="form-group" style="margin-bottom:0;"><label>Công suất bơm:</label><div class="input-unit-group"><input type="number" id="hlPumpVal" step="0.1" value="7.5"><select id="hlPumpUnit"><option value="kW" selected>kW</option><option value="HP">HP</option></select></div></div>
                </div>
            </div>
            <div class="solar-calc-grid">
                <div class="solar-sec-box">
                    <div class="solar-sec-title">2. Biến tần của khách</div>
                    <div class="form-group"><label>Chọn mẫu kho hoặc tự nhập:</label><select id="hlInvSel" onchange="fillHealthInv()">${invOpts}</select></div>
                    <div class="solar-mini-grid">
                        <div class="form-group"><label>Công suất (kW):</label><input type="number" id="hlInvKw" step="0.1" value="11"></div>
                        <div class="form-group"><label>Áp DC Max (V):</label><input type="number" id="hlInvVdcMax" value="900"></div>
                        <div class="form-group"><label>Dòng DC Max (A):</label><input type="number" id="hlInvIdcMax" value="40"></div>
                        <div class="form-group"><label>MPPT Min (V):</label><input type="number" id="hlInvMpptMin" value="486"></div>
                    </div>
                    <div class="form-group" style="margin-bottom:0;"><label>MPPT Max (V):</label><input type="number" id="hlInvMpptMax" value="750"></div>
                </div>
                <div class="solar-sec-box">
                    <div class="solar-sec-title">3. Giàn pin của khách</div>
                    <div class="form-group"><label>Chọn mẫu kho hoặc tự nhập:</label><select id="hlPanSel" onchange="fillHealthPan()">${panelOpts}</select></div>
                    <div class="solar-mini-grid">
                        <div class="form-group"><label>Pmax (W):</label><input type="number" id="hlPanPmax" value="580"></div>
                        <div class="form-group"><label>Imp (A):</label><input type="number" id="hlPanImp" step="0.01" value="13.22"></div>
                        <div class="form-group"><label>Vmp (V):</label><input type="number" id="hlPanVmp" step="0.01" value="43.88"></div>
                        <div class="form-group"><label>Voc (V):</label><input type="number" id="hlPanVoc" step="0.01" value="52.50"></div>
                    </div>
                    <div class="solar-mini-grid" style="margin-top:4px;">
                        <div class="form-group" style="margin-bottom:0;"><label>Số chuỗi song song:</label><input type="number" id="hlStrings" value="1" min="1"></div>
                        <div class="form-group" style="margin-bottom:0;"><label>Số tấm / chuỗi:</label><input type="number" id="hlPerStr" value="14" min="1"></div>
                    </div>
                </div>
            </div>
            <button class="btn btn-primary" onclick="checkLimitAndRun(execSolarHealthCheck)">🔍 KHÁM SỨC KHỎE HỆ THỐNG</button>
            <div id="toolModalResult" style="margin-top:12px;"></div>
        `;
    } else if (toolId === 'pump') {
        ws.innerHTML = `
            <h3 style="margin-top:0; color:var(--primary); font-size:16px;">💧 Tính Công Suất Bơm Thủy Lực</h3>
            <div class="grid-2"><div class="form-group"><label>Loại bơm:</label><select id="calcSource"><option value="gieng">Giếng khoan (Hỏa tiễn)</option><option value="ho" selected>Ao, hồ, sông</option></select></div><div class="form-group"><label>Cỡ ống chính:</label><select id="calcPipeDia"><option value="40">Phi 42</option><option value="50">Phi 49</option><option value="63" selected>Phi 60</option><option value="75">Phi 76</option><option value="90">Phi 90</option><option value="110">Phi 114</option></select></div></div>
            <div class="grid-2"><div class="form-group"><label>Độ cao đẩy đứng (m):</label><input type="number" id="calcHeight" value="50"></div><div class="form-group"><label>Tổng chiều dài ống (m):</label><input type="number" id="calcLength" value="200"></div></div>
            <div class="grid-2"><div class="form-group"><label>Lưu lượng cần bơm (m³/h):</label><input type="number" id="calcFlow" value="15"></div><div class="form-group"><label>Áp lực đầu béc (m):</label><input type="number" id="calcOutletHead" value="15"></div></div>
            <button class="btn btn-primary" onclick="checkLimitAndRun(execPumpCalc)">TÍNH CÔNG SUẤT BƠM</button>
            <div id="toolModalResult" style="margin-top:10px;"></div>
        `;
    } else if (toolId === 'vdrop') {
        ws.innerHTML = `
            <h3 style="margin-top:0; color:var(--primary); font-size:16px;">⚡ Tính Sụt Áp Đường Dây</h3>
            <div class="grid-2"><div class="form-group"><label>Hệ thống điện:</label><select id="vdSystem"><option value="380">3 Pha 380V (AC)</option><option value="550">Điện mặt trời DC (~550V)</option></select></div><div class="form-group"><label>Lõi dây:</label><select id="vdMaterial"><option value="0.0175">Đồng (Cu)</option><option value="0.0283">Nhôm (Al)</option></select></div></div>
            <div class="grid-2"><div class="form-group"><label>Dòng tải (A):</label><input type="number" id="vdCurrent" value="25"></div><div class="form-group"><label>Chiều dài 1 chiều (m):</label><input type="number" id="vdLength" value="80"></div></div>
            <div class="form-group"><label>Tiết diện dây (mm²):</label><select id="vdSize"><option value="4">4.0 mm²</option><option value="6" selected>6.0 mm²</option><option value="10">10 mm²</option><option value="16">16 mm²</option><option value="25">25 mm²</option></select></div>
            <button class="btn btn-primary" onclick="checkLimitAndRun(execVdropCalc)">TÍNH SỤT ÁP</button>
            <div id="toolModalResult" style="margin-top:10px;"></div>
        `;
    } else if (toolId === 'acc') {
        ws.innerHTML = `
            <h3 style="margin-top:0; color:var(--primary); font-size:16px;">🔩 Tính Phụ Kiện Áp Mái</h3>
            <div class="form-group"><label>Tổng số tấm pin:</label><input type="number" id="accTotalPanels" value="18"></div>
            <div class="form-group"><label>Số dãy pin:</label><input type="number" id="accRows" value="2"></div>
            <div class="form-group"><label>Loại chân đế:</label><select id="accLegType"><option value="2">2 chân đế / dãy</option><option value="3">3 chân đế / dãy</option></select></div>
            <button class="btn btn-primary" onclick="checkLimitAndRun(execAccCalc)">TÍNH PHỤ KIỆN</button>
            <div id="toolModalResult" style="margin-top:10px;"></div>
        `;
    } else if (toolId === 'divider') {
        ws.innerHTML = `
            <h3 style="margin-top:0; color:var(--primary); font-size:16px;">🔌 Tính Cầu Trở Phân Áp</h3>
            <div class="form-group"><label>Điện áp vào Vin (V):</label><input type="number" id="divVin" value="24"></div>
            <div class="grid-2"><div class="form-group"><label>R1 (kΩ):</label><input type="number" id="divR1" value="10"></div><div class="form-group"><label>R2 (kΩ):</label><input type="number" id="divR2" value="4.7"></div></div>
            <button class="btn btn-primary" onclick="checkLimitAndRun(execDividerCalc)">TÍNH VOUT</button>
            <div id="toolModalResult" style="margin-top:10px;"></div>
        `;
    }
}
/* === HÀM HỖ TRỢ NHẬP LIỆU TÍNH CHUỖI PIN === */
function cleanPumpExprInput() {
    const el = document.getElementById('spPumpExpr');
    if (!el) return;
    el.value = el.value.replace(/[^0-9+\-*/().,\s]/g, '');
    updateInverterDropdownAll();
}

function evaluatePumpInput() {
    const el = document.getElementById('spPumpExpr');
    if (!el) return;
    const raw = el.value.replace(/,/g, '.').trim();
    if (!raw) return;
    try {
        const val = Function('"use strict";return (' + raw.replace(/[^0-9+\-*/().\s]/g, '') + ')')();
        if (typeof val === 'number' && !isNaN(val) && val > 0) {
            el.value = Number(val.toFixed(2));
            updateInverterDropdownAll();
        }
    } catch (e) {}
}

function parseSafePumpPowerKW() {
    const raw = (document.getElementById('spPumpExpr')?.value || "").replace(/,/g, '.').trim();
    const unit = document.getElementById('spPumpUnit')?.value || "kW";
    if (!raw) return 0;
    try {
        const val = Function('"use strict";return (' + raw.replace(/[^0-9+\-*/().\s]/g, '') + ')')();
        if (typeof val !== 'number' || isNaN(val) || val <= 0) return 0;
        return unit === "HP" ? (val * 0.75) : val;
    } catch (e) { return 0; }
}

function updateInverterDropdownAll() {
    const stepUp = parseInt(document.getElementById('scLoadType')?.value || "1");
    const pumpKW = parseSafePumpPowerKW();
    const invSel = document.getElementById('spInvIdx');
    const noteEl = document.getElementById('pumpSuggestNote');
    if (!invSel) return;

    const kws = [...new Set(SOLAR_INVERTERS_DB.map(i => i.kw))].sort((a, b) => a - b);
    let targetKW = null;
    let overMax = false;

    if (pumpKW > 0) {
        const baseIdx = kws.findIndex(k => k >= pumpKW);
        if (baseIdx === -1 || (baseIdx + stepUp) >= kws.length) {
            overMax = true;
            if (noteEl) { noteEl.style.display = 'block'; noteEl.style.color = '#dc2626'; noteEl.innerHTML = `⚠️ Bơm ${pumpKW.toFixed(1)}kW vượt dải kho sẵn có. Liên hệ kinh doanh đặt hàng!`; }
        } else {
            targetKW = kws[baseIdx + stepUp];
            if (noteEl) { noteEl.style.display = 'block'; noteEl.style.color = '#15803d'; noteEl.innerHTML = `👉 Đề xuất: Bơm <b>${pumpKW.toFixed(1)}kW</b> ➔ Chọn biến tần cấp <b>${targetKW}kW (${Math.round(targetKW/0.75)}HP)</b>.`; }
        }
    } else if (noteEl) noteEl.style.display = 'none';

    let html = "";
    ["Power S", "Voltique", "Green Nova", "SAJ"].forEach(br => {
        const list = SOLAR_INVERTERS_DB.map((inv, idx) => ({ ...inv, idx }))
            .filter(x => x.brand === br && (targetKW === null || x.kw === targetKW));
        if (list.length) html += `<optgroup label="Hãng ${br}">${list.map(x => `<option value="${x.idx}">${x.name}</option>`).join('')}</optgroup>`;
    });
    html += `<option value="custom" ${overMax ? 'selected' : ''}>-- Tự nhập thông số biến tần --</option>`;
    invSel.innerHTML = html;
    if (!overMax) fillInverterSpecs();
}

function updateMpptOptField() {
    const mMin = parseFloat(document.getElementById('invMpptMinInput')?.value) || 0;
    const mMax = parseFloat(document.getElementById('invMpptMaxInput')?.value) || 0;
    const opt = document.getElementById('invMpptOptInput');
    if (opt) opt.value = Math.round((mMin + mMax) / 2);
}

function fillInverterSpecs() {
    const val = document.getElementById('spInvIdx')?.value;
    if (val === 'custom') return;
    const inv = SOLAR_INVERTERS_DB[parseInt(val)];
    if (!inv) return;
    document.getElementById('invKwInput').value = inv.kw;
    const outA = document.getElementById('invOutAInput');
    if (outA) outA.value = inv.iOut || "";
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
/* === CÔNG THỨC TÍNH CHUỖI PIN CHUẨN SG600 & MẸO CHỐT ĐƠN === */
function execRealCombatSolarCalc() {
    const invVal = document.getElementById('spInvIdx')?.value;
    const baseInv = invVal !== 'custom' ? SOLAR_INVERTERS_DB[parseInt(invVal)] : { name: "Biến tần tùy chỉnh", price: 10000000 };
    const invKw = parseFloat(document.getElementById('invKwInput').value) || 0;
    const vdcMax = parseFloat(document.getElementById('invVdcMaxInput').value) || 900;
    const idcMax = parseFloat(document.getElementById('invIdcMaxInput').value) || 40;
    const mpptMin = parseFloat(document.getElementById('invMpptMinInput').value) || 486;
    const mpptMax = parseFloat(document.getElementById('invMpptMaxInput').value) || 750;

    const pMax = parseFloat(document.getElementById('panPmaxInput').value) || 0;
    const imp = parseFloat(document.getElementById('panImpInput').value) || 0;
    const vmp = parseFloat(document.getElementById('panVmpInput').value) || 0;
    const voc = parseFloat(document.getElementById('panVocInput').value) || 0;
    if (invKw <= 0 || pMax <= 0 || vmp <= 0 || voc <= 0) return showToast("Kiểm tra lại thông số biến tần và tấm pin!", "warn");

    const pumpKW = parseSafePumpPowerKW();
    if (pumpKW <= 0) return markInputError('spPumpExpr', "⚠️ Vui lòng nhập công suất máy bơm trước khi tính!");
    if (pumpKW > invKw) return showToast(`⚠️ Công suất bơm (${pumpKW}kW) lớn hơn biến tần (${invKw}kW)!`, "warn", 4000);

    const vocColdFactor = 1.05;
    const maxSafePerStr = Math.floor((vdcMax - 0.1) / (voc * vocColdFactor));
    const min3PhaseVolt = Math.max(mpptMin, 540);
    const minVoltPerStr = Math.min(maxSafePerStr, Math.max(1, Math.ceil(min3PhaseVolt / vmp)));
    const midMpptVolt = (mpptMin + mpptMax) / 2;
    const midPerStr = Math.min(maxSafePerStr, Math.max(minVoltPerStr, Math.round(midMpptVolt / vmp)));

    const minReqPanels = Math.ceil((pumpKW * 1.3 * 1000) / pMax);
    const optStrings = Math.max(1, Math.ceil(minReqPanels / maxSafePerStr));
    const optPerStr = Math.min(maxSafePerStr, Math.max(minVoltPerStr, Math.ceil(minReqPanels / optStrings)));

    const idealTargetPanels = Math.ceil((pumpKW * 1.5 * 1000) / pMax);
    let idealStrings = Math.max(optStrings, Math.ceil(idealTargetPanels / maxSafePerStr));
    let idealPerStr = Math.min(maxSafePerStr, Math.max(midPerStr, Math.ceil(idealTargetPanels / idealStrings)));

    if (idealStrings === optStrings && (idealStrings * idealPerStr) <= (optStrings * optPerStr)) {
        if (optPerStr < maxSafePerStr) idealPerStr = maxSafePerStr;
        else { idealStrings = optStrings + 1; idealPerStr = Math.max(minVoltPerStr, Math.ceil(idealTargetPanels / idealStrings)); }
    }

    currentSolarPlans = [
        { label: "💡 PHƯƠNG ÁN TỐI ƯU (TIẾT KIỆM DÂY)", strings: optStrings, perStr: optPerStr, total: optStrings * optPerStr },
        { label: "⭐ PHƯƠNG ÁN LÝ TƯỞNG (KHUYÊN DÙNG)", strings: idealStrings, perStr: idealPerStr, total: idealStrings * idealPerStr }
    ];

    renderCombatResultBlocks(pMax, vmp, voc, imp, vdcMax, idcMax, invKw, baseInv, maxSafePerStr, vocColdFactor, pumpKW);
}

function applySingleStringSalesTip(maxPerStr, pMax) {
    document.querySelectorAll('.plan-card').forEach(el => el.classList.remove('active-plan'));
    if (window.lastCombatConfigSummary) {
        window.lastCombatConfigSummary.recStrings = 1;
        window.lastCombatConfigSummary.recPerStr = maxPerStr;
    }
    setQuoteDataFromCombat(1, maxPerStr);
    showToast(`✅ Đã chọn gói tiết kiệm 1 chuỗi × ${maxPerStr} tấm (${((maxPerStr * pMax)/1000).toFixed(2)} kWp)!`, "success", 3500);
}
function renderCombatResultBlocks(pMax, vmp, voc, imp, vdcMax, idcMax, invKw, baseInv, maxPerStr, vocColdFactor, pumpKW) {
    const cardsHtml = currentSolarPlans.map((pl, idx) => {
        const voc25 = (pl.perStr * voc).toFixed(1);
        const vocCold = (pl.perStr * voc * vocColdFactor).toFixed(1);
        const vmpStr = (pl.perStr * vmp).toFixed(1);
        const kwpStr = ((pl.total * pMax) / 1000).toFixed(2);
        const headTxt = pl.strings === 1 ? `${pl.perStr} tấm / chuỗi` : `${pl.strings} chuỗi × ${pl.perStr} tấm = ${pl.total} tấm`;
        return `
            <div class="plan-card ${idx === 1 ? 'active-plan' : ''}" id="planCard_${idx}" onclick="selectSingleOrRecPlan(${idx})">
                <div class="plan-title">${pl.label}</div>
                <div class="plan-panels">${headTxt}</div>
                <div class="plan-sub">
                    Voc (25°C): <b>${voc25}V</b> | Lạnh (10°C): <b>${vocCold}V</b><br>
                    Vmp: <b>${vmpStr}V</b> | Công suất: <b>${kwpStr} kWp</b>
                </div>
            </div>
        `;
    }).join('');

    const optPlan = currentSolarPlans[0];
    const idealPlan = currentSolarPlans[1];
    const idealKWp = ((idealPlan.total * pMax) / 1000).toFixed(2);
    const idealImp = (idealPlan.strings * imp).toFixed(2);

    const singleMaxKWp = (maxPerStr * pMax) / 1000;
    const singleRatio = pumpKW > 0 ? (singleMaxKWp / pumpKW) : 0;
    let salesTipHtml = "";
    if (optPlan.strings >= 2 && singleRatio >= 1.15 && singleRatio < 1.3) {
        const minWatt = Math.ceil((pumpKW * 1.3 * 1000) / maxPerStr);
        salesTipHtml = `
            <div style="margin-top:10px; padding:10px; background:#eff6ff; border-left:4px solid #0284c7; border-radius:6px; font-size:12.5px; color:#1e3a8a; line-height:1.5;">
                <b>🤝 Mẹo tư vấn chốt đơn (Gói tiết kiệm 1 chuỗi):</b><br>
                • Với bơm <b>${pumpKW}kW</b>, khách muốn tiết kiệm tối đa có thể đi <b>1 chuỗi × ${maxPerStr} tấm = ${singleMaxKWp.toFixed(2)} kWp</b> (${singleRatio.toFixed(2)}x tải bơm — giảm <b>${optPlan.total - maxPerStr} tấm</b>). Hoặc đổi sang pin <b>≥ ${minWatt}W</b> để giữ 1 chuỗi gọn nhẹ mà vẫn đạt chuẩn ≥ 1.3x!<br>
                <button type="button" class="btn" style="margin-top:6px; padding:5px 10px; font-size:12px; background:#0284c7; width:auto;" onclick="applySingleStringSalesTip(${maxPerStr}, ${pMax})">⚡ Áp dụng gói 1 chuỗi (${maxPerStr} tấm) báo giá</button>
            </div>
        `;
    }

    const forbPanels = maxPerStr + 1;
    const forbVoc = (forbPanels * voc * vocColdFactor).toFixed(1);
    document.getElementById('toolModalResult').innerHTML = `
        <div class="solar-2cards">${cardsHtml}</div>
        <div style="margin-top:10px; padding:10px; background:#f0fdf4; border-left:4px solid #16a34a; border-radius:6px; font-size:13px; color:#14532d; line-height:1.5;">
            <b>⭐ Khuyến nghị lý tưởng (${invKw}kW):</b> <b>${idealPlan.strings} chuỗi × ${idealPlan.perStr} tấm = ${idealPlan.total} tấm (${idealKWp} kWp)</b> | Dòng: <b>${idealImp}A</b>.
        </div>
        ${salesTipHtml}
        <div style="margin-top:8px; padding:10px; background:#fffbeb; border-left:4px solid #f59e0b; border-radius:6px; font-size:12.5px; color:#92400e;">
            ⚠️ <b>Cảnh báo quá áp (10°C):</b> Không đấu đến <b>${forbPanels} tấm/chuỗi</b> vì Voc trời lạnh đạt <b>${forbVoc}V > ${vdcMax}V</b>.
        </div>
        <div class="grid-2" style="gap:8px; margin-top:10px;">
            <button class="btn" style="background:#0068ff;" onclick="copySolarConfigForZalo()">💬 Sao chép cấu hình</button>
            <button class="btn btn-success" onclick="openEditableQuoteModal()">📄 Lập Bảng Báo Giá</button>
        </div>
    `;
    window.lastCombatConfigSummary = { invKw, pMax, recStrings: idealPlan.strings, recPerStr: idealPlan.perStr, selectedCardIdx: 1 };
    setQuoteDataFromCombat(idealPlan.strings, idealPlan.perStr);
}

function selectSingleOrRecPlan(idx) {
    const pl = currentSolarPlans[idx];
    if (!pl) return;
    document.querySelectorAll('.plan-card').forEach((el, i) => el.classList.toggle('active-plan', i === idx));
    if (window.lastCombatConfigSummary) window.lastCombatConfigSummary.selectedCardIdx = idx;
    setQuoteDataFromCombat(pl.strings, pl.perStr);
}

function copySolarConfigForZalo() {
    const cfg = window.lastCombatConfigSummary;
    if (!cfg || !currentSolarPlans.length) return;
    const pumpKW = parseSafePumpPowerKW();
    const sel = currentSolarPlans[cfg.selectedCardIdx] || currentSolarPlans[1];
    const kwp = ((sel.total * cfg.pMax) / 1000).toFixed(2);
    const txt = `Cấu hình hệ bơm NLMT${pumpKW > 0 ? ' ' + pumpKW + 'kW' : ''}: Biến tần ${cfg.invKw}kW + ${sel.strings} chuỗi x ${sel.perStr} tấm (${cfg.pMax}W) = ${sel.total} tấm (${kwp} kWp)`;
    navigator.clipboard?.writeText(txt).then(() => showToast("✅ Đã sao chép cấu hình gửi Zalo!", "success"));
}
/* === BẢNG BÁO GIÁ HỆ BƠM NLMT === */
function setQuoteDataFromCombat(strings, perStr) {
    const pMax = parseFloat(document.getElementById('panPmaxInput')?.value) || 580;
    const invKw = parseFloat(document.getElementById('invKwInput')?.value) || 7.5;
    const dcLen = parseFloat(document.getElementById('spDcLen')?.value) || 25;
    const invVal = document.getElementById('spInvIdx')?.value;
    const invObj = invVal !== 'custom' ? SOLAR_INVERTERS_DB[parseInt(invVal)] : { name: `Biến tần bơm ${invKw}kW`, price: invKw * 950000 };
    const panVal = document.getElementById('spPanelIdx')?.value;
    const panObj = panVal !== 'custom' ? SOLAR_PANELS_DB[parseInt(panVal)] : { name: `Tấm pin NLMT ${pMax}W`, power: pMax, priceWp: 2950 };
    const totalPanels = strings * perStr;
    const totalKWp = (totalPanels * pMax) / 1000;
    const pumpKW = parseSafePumpPowerKW();
    const pumpSummary = pumpKW > 0 ? `${pumpKW} kW` : `Hệ biến tần ${invKw} kW`;
    lastSolarQuoteData = { pumpSummary, panel: panObj, inv: invObj, totalPanels, totalKWp, strings, panelsPerString: perStr, dcLen };
}

function openEditableQuoteModal() {
    const d = lastSolarQuoteData;
    if (!d) return;
    const rows = [
        { name: `Tấm pin NLMT ${d.panel.name}`, unit: "Tấm", qty: d.totalPanels, price: d.panel.power * d.panel.priceWp },
        { name: `Biến tần bơm ${d.inv.name}`, unit: "Bộ", qty: 1, price: d.inv.price },
        { name: "Bát Z", unit: "Cái", qty: (d.totalPanels + d.strings) * 2, price: 15000 },
        { name: "Tủ điện AC/DC", unit: "Tủ", qty: 1, price: 2500000 },
        { name: "Cab Solar DC", unit: "Mét", qty: d.dcLen * 2 * d.strings, price: 22000 },
        { name: "Kẹp biên", unit: "Cái", qty: d.strings * 4, price: 12000 },
        { name: "Kẹp giữa", unit: "Cái", qty: Math.max(0, (d.totalPanels - d.strings) * 2), price: 12000 },
        { name: "Kẹp U", unit: "Cái", qty: (d.totalPanels + d.strings) * 2, price: 10000 },
        { name: "Jack MC4", unit: "Cái", qty: d.strings * 4, price: 25000 },
        { name: "Nhân công lắp đặt & cài đặt", unit: "NC", qty: 1, price: Math.round(d.totalKWp * 800000) }
    ];
    window._quoteRowCount = rows.length;

    const trHtml = rows.map((r, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><input type="text" id="qName_${i}" value="${r.name}" style="min-width:130px; padding:4px; font-size:12.5px;"></td>
            <td><input type="text" id="qUnit_${i}" value="${r.unit}" style="width:48px; text-align:center; padding:4px; font-size:12.5px;"></td>
            <td><input type="number" id="qQty_${i}" value="${r.qty}" style="width:55px; padding:4px;" oninput="recalcQuoteTotal()"></td>
            <td><input type="number" id="qPrice_${i}" value="${r.price}" style="width:95px; padding:4px;" oninput="recalcQuoteTotal()"></td>
            <td style="text-align:right; font-weight:700;" id="qSub_${i}">${(r.qty * r.price).toLocaleString('vi-VN')}</td>
        </tr>
    `).join('');

    openGlobalModal(`
        <h3 style="margin:0 0 6px; color:var(--primary); font-size:16px;">📄 BẢNG BÁO GIÁ HỆ BƠM NLMT</h3>
        <p style="font-size:12px; color:#64748b; margin-top:0;">Bơm <b>${d.pumpSummary}</b> | Giàn pin <b>${d.totalKWp.toFixed(2)} kWp</b> (${d.strings} chuỗi × ${d.panelsPerString} tấm)</p>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>STT</th><th>Hạng mục</th><th>ĐVT</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${trHtml}</tbody></table></div>
        <div style="margin-top:10px; text-align:right; font-size:13px;">
            <div>Tổng cộng: <b id="qTotalRaw">0</b> đ</div>
            <div style="margin:5px 0;">Giảm giá: <input type="number" id="qDiscount" value="0" style="width:110px; padding:4px;" oninput="recalcQuoteTotal()"> đ</div>
            <div style="font-size:15.5px; color:var(--danger);">TỔNG THANH TOÁN: <b id="qFinalTotal">0</b> VNĐ</div>
        </div>
        <div class="grid-2" style="gap:8px; margin-top:12px;">
            <button class="btn" style="background:#0068ff;" onclick="copyQuoteForZalo()">💬 Sao chép gửi Zalo</button>
            <button class="btn btn-primary" onclick="printFinalQuote()">🖨️ In / Lưu PDF</button>
        </div>
    `);
    recalcQuoteTotal();
}

function recalcQuoteTotal() {
    let raw = 0;
    const count = window._quoteRowCount || 10;
    for (let i = 0; i < count; i++) {
        const q = parseFloat(document.getElementById(`qQty_${i}`)?.value) || 0;
        const p = parseFloat(document.getElementById(`qPrice_${i}`)?.value) || 0;
        const sub = Math.round(q * p);
        raw += sub;
        const el = document.getElementById(`qSub_${i}`);
        if (el) el.innerText = sub.toLocaleString('vi-VN');
    }
    const disc = parseFloat(document.getElementById('qDiscount')?.value) || 0;
    document.getElementById('qTotalRaw').innerText = raw.toLocaleString('vi-VN');
    document.getElementById('qFinalTotal').innerText = Math.max(0, raw - disc).toLocaleString('vi-VN');
}

function copyQuoteForZalo() {
    const d = lastSolarQuoteData;
    if (!d) return;
    let txt = `☀️ BÁO GIÁ HỆ BƠM NLMT (${d.pumpSummary} - Giàn pin ${d.totalKWp.toFixed(2)} kWp)\n`;
    const count = window._quoteRowCount || 10;
    for (let i = 0; i < count; i++) {
        const n = document.getElementById(`qName_${i}`)?.value || "";
        const u = document.getElementById(`qUnit_${i}`)?.value || "";
        const q = parseFloat(document.getElementById(`qQty_${i}`)?.value) || 0;
        const s = document.getElementById(`qSub_${i}`)?.innerText || "0";
        if (q > 0) txt += `- ${n} (${q} ${u}): ${s}đ\n`;
    }
    txt += `💰 TỔNG THANH TOÁN: ${document.getElementById('qFinalTotal').innerText} VNĐ`;
    navigator.clipboard?.writeText(txt).then(() => showToast("✅ Đã sao chép bảng báo giá gửi Zalo!", "success"));
}

function printFinalQuote() { window.print(); }
/* === TÍNH TOÁN CHO 5 CÔNG CỤ CÒN LẠI === */
function fillHealthInv() {
    const val = document.getElementById('hlInvSel')?.value;
    if (val === 'custom') return;
    const inv = SOLAR_INVERTERS_DB[parseInt(val)];
    if (!inv) return;
    document.getElementById('hlInvKw').value = inv.kw;
    document.getElementById('hlInvVdcMax').value = inv.vdcMax;
    document.getElementById('hlInvIdcMax').value = inv.idcMax;
    document.getElementById('hlInvMpptMin').value = inv.mpptMin;
    document.getElementById('hlInvMpptMax').value = inv.mpptMax;
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
    const stepUp = parseInt(document.getElementById('hlLoadType')?.value || "1");
    const rawPump = parseFloat(document.getElementById('hlPumpVal')?.value) || 0;
    const pumpKW = document.getElementById('hlPumpUnit')?.value === 'HP' ? rawPump * 0.75 : rawPump;
    const invKw = parseFloat(document.getElementById('hlInvKw')?.value) || 0;
    const vdcMax = parseFloat(document.getElementById('hlInvVdcMax')?.value) || 900;
    const idcMax = parseFloat(document.getElementById('hlInvIdcMax')?.value) || 40;
    const pMax = parseFloat(document.getElementById('hlPanPmax')?.value) || 0;
    const imp = parseFloat(document.getElementById('hlPanImp')?.value) || 0;
    const vmp = parseFloat(document.getElementById('hlPanVmp')?.value) || 0;
    const voc = parseFloat(document.getElementById('hlPanVoc')?.value) || 0;
    const strings = parseInt(document.getElementById('hlStrings')?.value) || 1;
    const perStr = parseInt(document.getElementById('hlPerStr')?.value) || 1;
    if (pumpKW <= 0 || invKw <= 0 || pMax <= 0) return showToast("Nhập đầy đủ thông số hệ thống!", "warn");

    const totalPanels = strings * perStr;
    const totalKWp = (totalPanels * pMax) / 1000;
    const vocCold = perStr * voc * 1.05;
    const vmpTotal = perStr * vmp;
    const impTotal = strings * imp;
    const reqInvKw = stepUp === 0 ? pumpKW : (stepUp === 1 ? pumpKW * 1.3 : pumpKW * 1.6);
    const minReqKwp = pumpKW * 1.3;

    let score = 100, issues = [], upgrades = [];
    if (vocCold > vdcMax) {
        score -= 35;
        const safeMax = Math.floor((vdcMax - 0.1) / (voc * 1.05));
        issues.push(`🔴 <b>Quá áp trời lạnh (10°C):</b> Voc đạt <b>${vocCold.toFixed(1)}V > ${vdcMax}V</b>.`);
        upgrades.push(`Giảm còn tối đa <b>${safeMax} tấm/chuỗi</b> để bảo vệ biến tần.`);
    }
    if (vmpTotal < 540) {
        score -= 20;
        const needPerStr = Math.ceil(540 / vmp);
        issues.push(`🟡 <b>Điện áp Vmp (${vmpTotal.toFixed(1)}V) thấp hơn chuẩn 540VDC (SG600).</b>`);
        upgrades.push(`Tăng lên tối thiểu <b>${needPerStr} tấm/chuỗi</b> để bơm đạt đủ 50Hz.`);
    }
    if (impTotal > idcMax) { score -= 25; issues.push(`🔴 <b>Quá dòng DC (${impTotal.toFixed(1)}A > ${idcMax}A).</b>`); }
    if (invKw < reqInvKw - 0.5) { score -= 20; issues.push(`🟡 <b>Biến tần (${invKw}kW) yếu so với tải bơm ${pumpKW.toFixed(1)}kW.</b>`); upgrades.push(`Nâng biến tần lên cấp <b>${Math.ceil(reqInvKw)}kW</b>.`); }
    if (totalKWp < minReqKwp) {
        score -= 20;
        const miss = Math.ceil(((minReqKwp - totalKWp) * 1000) / pMax);
        issues.push(`🟡 <b>Thiếu công suất pin (${totalKWp.toFixed(2)} kWp < chuẩn ${minReqKwp.toFixed(2)} kWp).</b>`);
        upgrades.push(`Bổ sung thêm tối thiểu <b>${miss} tấm (${pMax}W)</b>.`);
    }
    score = Math.max(10, score);
    if (!issues.length) issues.push("🟢 Cấu hình phối ghép đạt chuẩn kỹ thuật SG600!");
    if (!upgrades.length) upgrades.push("Giữ nguyên cấu hình hiện tại.");

    document.getElementById('toolModalResult').innerHTML = `
        <div class="card-panel" style="border-left:4px solid ${score >= 85 ? '#16a34a' : '#dc2626'};">
            <b>📊 SỨC KHỎE HỆ THỐNG: ${score}/100 ĐIỂM</b> (${totalPanels} tấm = ${totalKWp.toFixed(2)} kWp | Vmp: ${vmpTotal.toFixed(1)}V)<br>
            <div style="margin-top:6px; font-size:13px;">${issues.join('<br>')}</div>
            <div style="margin-top:6px; font-size:13px; color:#15803d;">💡 <b>Đề xuất:</b> ${upgrades.join(' ')}</div>
        </div>
    `;
}

function execPumpCalc() {
    const h = parseFloat(document.getElementById('calcHeight')?.value) || 0;
    const len = parseFloat(document.getElementById('calcLength')?.value) || 0;
    const q = parseFloat(document.getElementById('calcFlow')?.value) || 0;
    const out = parseFloat(document.getElementById('calcOutletHead')?.value) || 0;
    const dMap = { 40: 0.036, 50: 0.044, 63: 0.055, 75: 0.066, 90: 0.080, 110: 0.098 };
    const d = dMap[parseFloat(document.getElementById('calcPipeDia')?.value)] || 0.055;
    if (q <= 0) return showToast("Nhập lưu lượng nước!", "warn");
    const qS = q / 3600;
    const loss = (10.67 * Math.pow(qS, 1.852) / (Math.pow(140, 1.852) * Math.pow(d, 4.87))) * len * 1.1;
    const totH = h + loss + out;
    const eff = document.getElementById('calcSource')?.value === 'gieng' ? 0.52 : 0.58;
    const estHP = Math.max(0.5, ((qS * totH * 9.81) / eff) / 0.7457);
    const hp = [0.5, 1, 1.5, 2, 3, 4, 5.5, 7.5, 10, 12.5, 15, 20, 25, 30].find(x => x >= estHP) || Math.ceil(estHP);
    document.getElementById('toolModalResult').innerHTML = `<div class="card-panel" style="background:#f0fdf4;">• Cột áp tổng: <b>${totH.toFixed(1)} m</b> | • Chọn bơm: <b>${hp} HP (~${(hp * 0.7457).toFixed(2)} kW)</b></div>`;
}

function execVdropCalc() {
    const v = parseFloat(document.getElementById('vdSystem')?.value) || 380;
    const rho = parseFloat(document.getElementById('vdMaterial')?.value) || 0.0175;
    const i = parseFloat(document.getElementById('vdCurrent')?.value) || 0;
    const l = parseFloat(document.getElementById('vdLength')?.value) || 0;
    const s = parseFloat(document.getElementById('vdSize')?.value) || 6;
    const drop = (((v === 380) ? Math.sqrt(3) : 2) * rho * l * i) / s;
    const pct = (drop / v) * 100;
    document.getElementById('toolModalResult').innerHTML = `<div class="card-panel">⚡ Độ sụt áp: <b>${drop.toFixed(2)} V (${pct.toFixed(2)}%)</b> ${pct <= 3 ? '✅ Đạt chuẩn' : '⚠️ Sụt áp cao!'}</div>`;
}

function execAccCalc() {
    const p = parseFloat(document.getElementById('accTotalPanels')?.value) || 0;
    const r = parseFloat(document.getElementById('accRows')?.value) || 0;
    const leg = parseInt(document.getElementById('accLegType')?.value) || 2;
    document.getElementById('toolModalResult').innerHTML = `<div class="card-panel">🔩 Chân đế: <b>${(p + r) * leg}</b> | Kẹp biên: <b>${r * 2 * leg}</b> | Kẹp giữa: <b>${Math.max(0, p - r) * leg}</b></div>`;
}

function execDividerCalc() {
    const vin = parseFloat(document.getElementById('divVin')?.value) || 0;
    const r1 = parseFloat(document.getElementById('divR1')?.value) || 0;
    const r2 = parseFloat(document.getElementById('divR2')?.value) || 0;
    if (r1 + r2 <= 0) return;
    document.getElementById('toolModalResult').innerHTML = `<div class="card-panel">🔌 Vout: <b>${(vin * (r2 / (r1 + r2))).toFixed(2)} V</b> | Dòng: <b>${(vin / (r1 + r2)).toFixed(2)} mA</b></div>`;
}
/* === TRANG ĐẶT LỊCH HỖ TRỢ (4 BƯỚC & KHÓA CHỦ NHẬT + NGÀY LỄ VN) === */
const VN_PUBLIC_HOLIDAYS = [
    "01-01", "30-04", "01-05", "02-09", "03-09",
    "2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-20", "2026-04-26",
    "2027-02-05", "2027-02-06", "2027-02-07", "2027-02-08", "2027-02-09", "2027-04-16"
];

function isVnHolidayOrSunday(y, m, d) {
    if (new Date(y, m, d).getDay() === 0) return "Chủ Nhật (Nghỉ)";
    const mm = String(m + 1).padStart(2, '0'), dd = String(d).padStart(2, '0');
    if (VN_PUBLIC_HOLIDAYS.includes(`${y}-${mm}-${dd}`) || VN_PUBLIC_HOLIDAYS.includes(`${dd}-${mm}`)) return "Ngày Lễ VN (Nghỉ)";
    return "";
}

function renderServiceFullPage() {
    const main = document.getElementById('mainPageContent');
    if (!main) return;
    main.innerHTML = `
        <div class="srv-layout">
            <div class="card-panel">
                <h3 style="margin:0 0 8px; color:var(--primary); font-size:17px;">📹 Đặt Lịch Hỗ Trợ</h3>
                <p style="margin:0 0 12px; font-size:13px; color:#475569;">Hỗ trợ kỹ thuật từ xa 1:1 qua Video Call chuyên sâu cho từng công trình.</p>
                <div class="srv-benefit-item"><div class="srv-benefit-num">1</div><div>Ưu tiên tiếp nhận hỗ trợ</div></div>
                <div class="srv-benefit-item"><div class="srv-benefit-num">2</div><div>Kỹ thuật hỗ trợ 1:1</div></div>
                <div class="srv-benefit-item"><div class="srv-benefit-num">3</div><div>Khách hàng chủ động từng dự án</div></div>
                <div class="srv-benefit-item"><div class="srv-benefit-num">4</div><div>Kỹ thuật nắm bắt lịch trình làm việc ít bị động và áp lực</div></div>
                <div style="margin-top:10px; padding:10px; background:#f8fafc; border-radius:8px; font-size:12.5px; line-height:1.6;">
                    <b>🔄 Quy trình 6 bước:</b> Khách gửi yêu cầu ➔ Tele sale gọi lại xác nhận ➔ Chờ khách thanh toán phí ➔ Xác nhận đã thanh toán ➔ Kỹ thuật viên gọi lại hỗ trợ ➔ Kết thúc.<br>
                    <span style="color:#dc2626; font-weight:700;">⏰ Giờ làm việc: Sáng 08:00–11:00 | Chiều 13:30–15:00 (Thứ 2 – Thứ 7).</span>
                </div>
            </div>

            <div class="card-panel" style="padding:0; overflow:hidden;">
                <div style="background:var(--primary); color:#fff; padding:12px; text-align:center; font-weight:800;">Đặt lịch hỗ trợ</div>
                <div class="stepper-4">
                    <div class="step-node active" id="srvStepNode_1" onclick="goSrvStep(1)"><div class="step-dot">1</div><div class="step-label">Chọn<br>thời gian</div></div>
                    <div class="step-node" id="srvStepNode_2" onclick="goSrvStep(2)"><div class="step-dot">2</div><div class="step-label">Chọn<br>dịch vụ</div></div>
                    <div class="step-node" id="srvStepNode_3" onclick="goSrvStep(3)"><div class="step-dot">3</div><div class="step-label">Xem lại</div></div>
                    <div class="step-node" id="srvStepNode_4" onclick="goSrvStep(4)"><div class="step-dot">4</div><div class="step-label">Trạng thái</div></div>
                </div>
                <div id="phoneScreenBody" style="padding:14px;"></div>
            </div>
        </div>
    `;
    const now = new Date();
    srvState.year = now.getFullYear();
    srvState.month = now.getMonth();
    const myActive = (appData.bookings || []).filter(b => currentUser && b.username === currentUser.username && b.status !== 'Kết thúc' && b.status !== 'Đã hủy');
    if (myActive.length > 0 && !srvState.forceNew) goSrvStep(4);
    else { srvState.forceNew = false; goSrvStep(1); }
}

function goSrvStep(step) {
    if (step === 2 && (!srvState.date || !srvState.time)) return showToast("⚠️ Chọn Ngày và Khung giờ hỗ trợ trước!", "warn");
    if (step === 3 && (!srvState.form || !srvState.form.field)) return showToast("⚠️ Điền thông tin yêu cầu trước!", "warn");
    srvState.step = step;
    for (let i = 1; i <= 4; i++) {
        const n = document.getElementById(`srvStepNode_${i}`);
        if (!n) continue;
        n.classList.remove('active', 'done');
        if (i < step) n.classList.add('done');
        else if (i === step) n.classList.add('active');
    }
    if (step === 1) renderSrvStep1();
    else if (step === 2) renderSrvStep2();
    else if (step === 3) renderSrvStep3();
    else if (step === 4) renderSrvStep4();
}

function renderSrvStep1() {
    const body = document.getElementById('phoneScreenBody');
    if (!body) return;
    const y = srvState.year, m = srvState.month;
    const firstDow = new Date(y, m, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const days = new Date(y, m + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    let cells = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => `<div class="cal-dow">${d}</div>`).join('');
    for (let e = 0; e < offset; e++) cells += `<div></div>`;
    for (let d = 1; d <= days; d++) {
        const dt = new Date(y, m, d);
        const dStr = `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`;
        const hol = isVnHolidayOrSunday(y, m, d);
        if (dt < today || hol) cells += `<div class="cal-day disabled" title="${hol || 'Đã qua'}">${d}</div>`;
        else cells += `<div class="cal-day ${srvState.date === dStr ? 'selected' : ''}" onclick="srvState.date='${dStr}'; srvState.time=''; renderSrvStep1()">${d}</div>`;
    }

    const booked = (appData.bookings || []).filter(b => b.date === srvState.date && b.status !== 'Kết thúc' && b.status !== 'Đã hủy').map(b => b.time);
    const slotBox = (lbl, arr) => `<div style="font-size:12px; font-weight:700;">${lbl}</div><div class="slot-grid">${arr.map(t => booked.includes(t) ? `<div class="slot-btn booked">${t}</div>` : `<div class="slot-btn ${srvState.time === t ? 'selected' : ''}" onclick="srvState.time='${t}'; renderSrvStep1()">${t}</div>`).join('')}</div>`;

    body.innerHTML = `
        <div class="cal-nav">
            <button onclick="srvState.month--; if(srvState.month<0){srvState.month=11;srvState.year--;} renderSrvStep1()">&#10094;</button>
            <span>Tháng ${m + 1} / ${y}</span>
            <button onclick="srvState.month++; if(srvState.month>11){srvState.month=0;srvState.year++;} renderSrvStep1()">&#10095;</button>
        </div>
        <div class="cal-grid">${cells}</div>
        ${srvState.date ? `${slotBox('☀️ Sáng (08:00 - 11:00):', ['08:00','08:30','09:00','09:30','10:00','10:30','11:00'])}${slotBox('🌤️ Chiều (13:30 - 15:00):', ['13:30','14:00','14:30','15:00'])}` : '<div style="text-align:center; padding:12px; color:#64748b; font-size:12.5px;">👆 Chọn ngày trên lịch để chọn khung giờ</div>'}
        <button class="btn btn-primary" style="margin-top:8px;" onclick="goSrvStep(2)">Tiếp ➔</button>
    `;
}
/* === ĐẶT LỊCH HỖ TRỢ: BƯỚC 2 & BƯỚC 3 === */
function getNowVnStr() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} - ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function renderSrvStep2() {
    const body = document.getElementById('phoneScreenBody');
    if (!body) return;
    if (!currentUser) {
        body.innerHTML = `<div style="text-align:center; padding:20px;"><p>Vui lòng đăng nhập Zalo để tạo phiếu đặt lịch hỗ trợ.</p><button class="btn btn-primary" onclick="openAuthModal('login')">Đăng nhập ngay</button></div>`;
        return;
    }
    const f = srvState.form || {};
    body.innerHTML = `
        <div style="background:#f0f9ff; padding:6px 10px; border-radius:6px; font-size:12px; color:#0369a1; font-weight:700; margin-bottom:8px;">📅 ${srvState.date} | ⏰ ${srvState.time}</div>
        <div class="form-group"><label>Tên khách hàng (Tài khoản):</label><input type="text" value="${currentUser.username}" readonly style="background:#f1f5f9; font-weight:700;"></div>
        <div class="grid-2">
            <div class="form-group"><label>Lĩnh vực:</label><select id="srvField"><option value="Biến tần bơm NLMT" ${f.field==='Biến tần bơm NLMT'?'selected':''}>Biến tần bơm NLMT</option><option value="Điện NLMT" ${f.field==='Điện NLMT'?'selected':''}>Điện NLMT</option></select></div>
            <div class="form-group"><label>Yêu cầu:</label><select id="srvReqType"><option value="Xử lý sự cố" ${f.reqType==='Xử lý sự cố'?'selected':''}>Xử lý sự cố</option><option value="Tư vấn lắp mới" ${f.reqType==='Tư vấn lắp mới'?'selected':''}>Tư vấn lắp mới</option></select></div>
        </div>
        <div class="form-group"><label>Số tiền điện mỗi tháng:</label><input type="text" id="srvBill" value="${f.bill || ''}" placeholder="VD: 3.500.000đ..."></div>
        <div class="form-group"><label>Công suất máy bơm:</label><div style="display:flex; gap:6px; align-items:center;"><input type="text" id="srvPumpVal" value="${f.pumpVal || ''}" placeholder="Nhập công suất..."><label style="margin:0; display:flex; gap:3px;"><input type="radio" name="srvPumpUnit" value="kW" ${(f.pumpUnit||'kW')==='kW'?'checked':''} style="width:auto;">kW</label><label style="margin:0; display:flex; gap:3px;"><input type="radio" name="srvPumpUnit" value="HP" ${f.pumpUnit==='HP'?'checked':''} style="width:auto;">HP</label></div></div>
        <div class="form-group"><label>Công suất biến tần:</label><div style="display:flex; gap:6px; align-items:center;"><input type="text" id="srvInvVal" value="${f.invVal || ''}" placeholder="Nhập công suất..."><label style="margin:0; display:flex; gap:3px;"><input type="radio" name="srvInvUnit" value="kW" ${(f.invUnit||'kW')==='kW'?'checked':''} style="width:auto;">kW</label><label style="margin:0; display:flex; gap:3px;"><input type="radio" name="srvInvUnit" value="HP" ${f.invUnit==='HP'?'checked':''} style="width:auto;">HP</label></div></div>
        <div class="form-group"><label>Công suất giàn PIN:</label><input type="text" id="srvPvKw" value="${f.pvKw || ''}" placeholder="VD: 14 tấm 580W..."></div>
        <div class="form-group"><label>Tình trạng lỗi:</label><textarea id="srvIssue" rows="2" placeholder="Mô tả chi tiết tình trạng..." oninput="clearInputError('srvIssue')">${f.issue || ''}</textarea></div>
        <div class="form-group"><label>Màn hình hiển thị lỗi:</label><input type="text" id="srvScreenErr" value="${f.screenErr || ''}" placeholder="VD: E.OC1, E.LU..."></div>
        <div class="form-group"><label>Yêu cầu khác:</label><input type="text" id="srvNote" value="${f.note || ''}" placeholder="Ghi chú thêm..."></div>
        <div class="form-group"><label>Thời gian tạo:</label><input type="text" id="srvCreatedAt" value="${getNowVnStr()}" readonly style="background:#f1f5f9;"></div>
        <div class="grid-2"><button class="btn btn-outline" onclick="goSrvStep(1)">⬅ Quay lại</button><button class="btn btn-primary" onclick="saveSrvStep2AndReview()">Xem lại ➔</button></div>
    `;
}

function saveSrvStep2AndReview() {
    const issue = (document.getElementById('srvIssue')?.value || '').trim();
    const screenErr = (document.getElementById('srvScreenErr')?.value || '').trim();
    if (!issue && !screenErr) return markInputError('srvIssue', "Vui lòng nhập Tình trạng lỗi hoặc nhu cầu tư vấn!");
    const pVal = (document.getElementById('srvPumpVal')?.value || '').trim();
    const pUnit = document.querySelector('input[name="srvPumpUnit"]:checked')?.value || 'kW';
    const iVal = (document.getElementById('srvInvVal')?.value || '').trim();
    const iUnit = document.querySelector('input[name="srvInvUnit"]:checked')?.value || 'kW';
    srvState.form = {
        username: currentUser.username,
        field: document.getElementById('srvField')?.value || '',
        reqType: document.getElementById('srvReqType')?.value || '',
        bill: (document.getElementById('srvBill')?.value || '').trim() || 'Không ghi',
        pumpVal: pVal, pumpUnit: pUnit, pumpKw: pVal ? `${pVal} ${pUnit}` : 'Chưa nhập',
        invVal: iVal, invUnit: iUnit, invKw: iVal ? `${iVal} ${iUnit}` : 'Chưa nhập',
        pvKw: (document.getElementById('srvPvKw')?.value || '').trim() || 'Chưa có',
        issue, screenErr: screenErr || 'Không báo mã lỗi',
        note: (document.getElementById('srvNote')?.value || '').trim() || 'Không',
        createdAt: document.getElementById('srvCreatedAt')?.value || getNowVnStr()
    };
    goSrvStep(3);
}

function renderSrvStep3() {
    const f = srvState.form;
    document.getElementById('phoneScreenBody').innerHTML = `
        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:10px; font-size:12.5px; line-height:1.6; margin-bottom:10px;">
            <div>• <b>Khách hàng:</b> ${f.username} | <b>Hẹn:</b> ${srvState.time} (${srvState.date})</div>
            <div>• <b>Lĩnh vực:</b> ${f.field} (${f.reqType})</div>
            <div>• <b>Tiền điện/tháng:</b> ${f.bill} | <b>Giàn PIN:</b> ${f.pvKw}</div>
            <div>• <b>Bơm:</b> ${f.pumpKw} | <b>Biến tần:</b> ${f.invKw}</div>
            <div>• <b>Tình trạng lỗi:</b> ${f.issue} (${f.screenErr})</div>
            <div>• <b>Yêu cầu khác:</b> ${f.note} | <b>Tạo lúc:</b> ${f.createdAt}</div>
        </div>
        <div class="grid-2"><button class="btn btn-outline" onclick="goSrvStep(2)">⬅ Sửa lại</button><button class="btn btn-success" id="btnSubmitBooking" onclick="submitServiceBooking()">🚀 GỬI YÊU CẦU</button></div>
    `;
}
/* === ĐẶT LỊCH HỖ TRỢ: GỬI PHIẾU, BƯỚC 4 TRẠNG THÁI & NẮNG AI === */
async function submitServiceBooking() {
    const btn = document.getElementById('btnSubmitBooking');
    if (btn) { btn.disabled = true; btn.innerText = "⏳ Đang gửi..."; }
    const f = srvState.form;
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'create_booking', username: currentUser.username, date: srvState.date, time: srvState.time, ...f }) });
    const data = await res.json();
    if (data.status === 'limit_exceeded') showToast("⚠️ Bạn đã đạt tối đa 3 yêu cầu đang xử lý!", "warn");
    else showToast("✅ Đã gửi yêu cầu đặt lịch hỗ trợ!", "success");
    srvState.date = ""; srvState.time = ""; srvState.form = {};
    await syncDataFromGoogleSheet();
    goSrvStep(4);
}

function renderSrvStep4() {
    const body = document.getElementById('phoneScreenBody');
    if (!body) return;
    if (!currentUser) { body.innerHTML = `<div style="text-align:center; padding:20px;">Đăng nhập để xem trạng thái phiếu của bạn.</div>`; return; }
    const tickets = (appData.bookings || []).filter(b => b.username === currentUser.username).reverse();
    const activeCnt = tickets.filter(b => b.status !== 'Kết thúc' && b.status !== 'Đã hủy').length;
    const listHtml = tickets.map(t => `
        <div style="border:1px solid #cbd5e1; border-left:4px solid var(--primary); border-radius:8px; padding:9px; margin-bottom:8px; font-size:12px;">
            <div style="display:flex; justify-content:space-between;"><b>#${t.id} — ${t.date} (${t.time})</b><span style="background:#fef3c7; color:#92400e; padding:1px 6px; border-radius:10px; font-weight:700;">${t.status}</span></div>
            <div style="margin-top:4px;">• ${t.field} (${t.reqType}) — Bơm: ${t.pumpKw} | Biến tần: ${t.invKw}</div>
            <div>• Lỗi: ${t.issue} (${t.screenErr})</div>
        </div>
    `).join('') || '<div style="text-align:center; padding:16px; color:#64748b;">Chưa có yêu cầu nào.</div>';

    body.innerHTML = `
        <div style="background:#f0fdf4; padding:8px; border-radius:6px; font-size:12.5px; color:#166534; font-weight:700; margin-bottom:8px;">⏳ Đang chờ tiếp nhận yêu cầu (${activeCnt}/3 phiếu đang mở)</div>
        ${listHtml}
        ${activeCnt < 3 ? `<button class="btn btn-primary" onclick="srvState.forceNew=true; srvState.date=''; srvState.time=''; goSrvStep(1)">+ Tạo thêm yêu cầu mới (${activeCnt}/3)</button>` : '<div style="text-align:center; font-size:12px; color:#b45309; font-weight:700;">Đã đạt giới hạn tối đa 3 yêu cầu/tài khoản.</div>'}
    `;
}

let aiTimer = null;
function toggleSolarAiBox() {
    const box = document.getElementById('solarAiBox');
    if (!box) return;
    const open = !box.classList.contains('open');
    box.classList.toggle('open', open);
    if (open) {
        if (aiTimer) clearInterval(aiTimer);
        const greet = document.getElementById('solarAiGreeting');
        const btns = document.querySelectorAll('#solarAiMenu .seq-item');
        btns.forEach(b => b.classList.remove('show'));
        const u = currentUser ? currentUser.username : "bạn";
        const txt = `Chào ${u}, mình là Nắng - Trợ lý Solar AI. Bạn cần hỗ trợ gì hôm nay?`;
        let i = 0; greet.innerText = "";
        aiTimer = setInterval(() => {
            i++; greet.innerText = txt.slice(0, i);
            if (i >= txt.length) { clearInterval(aiTimer); btns.forEach((b, k) => setTimeout(() => b.classList.add('show'), k * 140)); }
        }, 22);
    }
}

function aiQuickAction(t) {
    toggleSolarAiBox();
    if (t === 'solar') navigateApp('tool-solar');
    else if (t === 'health') navigateApp('tool-health');
    else if (t === 'error') navigateApp('errors');
    else if (t === 'service') navigateApp('service');
}
