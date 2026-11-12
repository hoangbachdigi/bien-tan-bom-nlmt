const API_URL = "https://script.google.com/macros/s/AKfycbwXhaoIyrMIJNitAvvlIc9f3dHMc2R4YHU74Tk1KxeJ2iQf2YJiYa2BmYRt87ELQuFSYA/exec";

let appData = {
    users: [{ username: 'nguyenhoangbach', role: 'admin', status: 'approved' }],
    configs: [],
    logs: []
};
let guestCount = parseInt(localStorage.getItem('guest_visits_count')) || 0;
let currentUser = JSON.parse(sessionStorage.getItem('current_user')) || null;
let computedPumpHP = 0; 
let adminChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
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
    container.innerHTML = `<p style="text-align: center; color: #6c757d;">⏳ Đang tải nội dung...</p>`;
    try {
        const response = await fetch(pageFile);
        if (!response.ok) throw new Error("Không tìm thấy file");
        const html = await response.text();
        container.innerHTML = html;
        
        if (pageFile === 'page-tinh-toan.html' && computedPumpHP > 0) {
            const hpInput = document.getElementById('pumpHPInput');
            if (hpInput) hpInput.value = computedPumpHP.toFixed(1);
        }
        if (pageFile === 'page-san-pham.html') renderDynamicList('SAN_PHAM', 'productListArea');
        if (pageFile === 'page-kien-thuc.html') renderDynamicList('KIEN_THUC', 'blogListArea');
    } catch (error) {
        container.innerHTML = `<div style="text-align:center; padding:30px; color:#dc3545;">⚠️ Chưa tìm thấy file <b>${pageFile}</b> trên GitHub. Bạn hãy kiểm tra xem đã tạo file này chưa nhé!</div>`;
    }
}
async function syncDataFromGoogleSheet() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        appData.users = [
            { username: 'nguyenhoangbach', role: 'admin', status: 'approved' },
            ...(data.users || []).map(u => ({ ...u, role: 'user' }))
        ];
        appData.configs = data.configs || [];
        appData.logs = data.logs || [];

        const bannerCfg = appData.configs.find(c => c.code === 'BANNER');
        if (bannerCfg && bannerCfg.media) {
            document.getElementById('bannerContainer').innerHTML = `<img src="${bannerCfg.media}" alt="Banner Biến Tần Bơm và Điện Năng Lượng Mặt Trời">`;
            document.getElementById('bannerContainer').style.padding = "0";
        }

        if (currentUser) {
            const freshUser = appData.users.find(u => u.username === currentUser.username);
            if (freshUser) {
                currentUser = freshUser;
                sessionStorage.setItem('current_user', JSON.stringify(currentUser));
            }
        }
        updateTopUserBar();
    } catch (e) {
        console.log("Đang đồng bộ dữ liệu nền...");
    }
}
function updateTopUserBar() {
    const statusText = document.getElementById('userStatusText');
    const btnLabel = document.getElementById('userBtnLabel');

    if (currentUser) {
        if (currentUser.role === 'admin') {
            statusText.innerHTML = `😎 Xin chào Quản trị viên: <b style="color:var(--primary)">${currentUser.username}</b>`;
            btnLabel.innerText = "Bảng Admin";
        } else {
            statusText.innerHTML = `👤 Thành viên Zalo: <b>${currentUser.username}</b> (${currentUser.status === 'approved' ? '<span style="color:green">Đã duyệt - Vô hạn</span>' : '<span style="color:orange">Chờ duyệt</span>'})`;
            btnLabel.innerText = "Tài khoản";
        }
    } else {
        let left = Math.max(0, 3 - guestCount);
        statusText.innerHTML = `🔮 Chế độ: Khách vãng lai (Còn <b style="color:red">${left}</b> lần tính miễn phí)`;
        btnLabel.innerText = "Đăng nhập / ĐK";
    }
}

function checkLimitAndRun(callbackFn) {
    if (currentUser && currentUser.status === 'approved') {
        callbackFn();
        return;
    }
    if (guestCount >= 3) {
        alert("Bạn đã dùng hết 3 lần tính miễn phí! Vui lòng bấm nút 'Đăng nhập / ĐK' ở góc trên bên phải, nhập Tên Zalo để đăng ký và liên hệ Zalo Quang Nguyen duyệt mở khóa vô hạn.");
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
            <h3 style="margin-top:0; color:var(--primary);">👤 Đăng Nhập / Đăng Ký Thành Viên Zalo</h3>
            <p style="font-size:13.5px; color:#555;">Đăng ký bằng Tên Zalo của bạn để mở khóa tính toán không giới hạn sau khi Admin phê duyệt.</p>
            <div class="form-group">
                <label>Nhập chính xác Tên tài khoản Zalo:</label>
                <input type="text" id="modalZaloInput" placeholder="Ví dụ: Nguyen Van A">
            </div>
            <div style="display:flex; gap:10px;">
                <button class="btn btn-primary" onclick="processLogin()">Đăng Nhập</button>
                <button class="btn btn-success" style="width:100%;" onclick="processRegister()">Đăng Ký Mới</button>
            </div>
        `;
    } else if (currentUser.role === 'admin') {
        renderAdminDashboard(area);
    } else {
        area.innerHTML = `
            <h3 style="margin-top:0;">👤 Thông Tin Tài Khoản</h3>
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
    if (name === 'nguyenhoangbach') return alert("Tài khoản này bị khóa!");

    alert("Đang gửi yêu cầu đăng ký lên hệ thống...");
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'register', username: name }) });
    alert("Đăng ký thành công! Vui lòng liên hệ Zalo Quang Nguyen để được duyệt.");
    closeUserModal();
    syncDataFromGoogleSheet();
}

async function processLogin() {
    const name = document.getElementById('modalZaloInput').value.trim();
    if (!name) return alert("Vui lòng nhập tên Zalo!");

    const user = appData.users.find(u => u.username === name);
    if (!user) return alert("Tên Zalo này chưa đăng ký hoặc hệ thống đang đồng bộ, vui lòng thử lại sau 3 giây!");
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

async function renderAdminDashboard(container) {
    container.innerHTML = `<p style="text-align:center; padding:30px;">⏳ Đang tải dữ liệu thống kê mới nhất từ Google Sheet...</p>`;
    await syncDataFromGoogleSheet();

    const currentBanner = (appData.configs.find(c => c.code === 'BANNER') || {}).media || '';
    let userRows = appData.users.filter(u => u.role !== 'admin').map(u => `
        <tr>
            <td><a href="javascript:void(0)" onclick="filterLogByUser('${u.username}')" style="font-weight:bold; color:var(--primary); text-decoration:underline;">${u.username}</a></td>
            <td style="color:${u.status==='approved'?'green':'orange'}">${u.status==='approved'?'Đã duyệt':'Chờ duyệt'}</td>
            <td>
                ${u.status==='pending' ? `<button class="btn btn-success" style="padding:4px 8px; font-size:12px;" onclick="adminAction('approve', '${u.username}')">Duyệt</button>` : ''}
                <button class="btn btn-danger" style="padding:4px 8px; font-size:12px;" onclick="adminAction('delete', '${u.username}')">Xóa</button>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:15px;">
            <h3 style="margin:0; color:var(--primary);">⚙️ Bảng Điều Khiển Admin (nguyenhoangbach)</h3>
            <button class="btn btn-danger" style="padding:5px 10px; font-size:12px;" onclick="processLogout()">Đăng xuất</button>
        </div>

        <div class="card" style="margin-bottom:15px;">
            <div class="card-title">🖼️ Cập Nhật Banner Quảng Cáo (Link Google Photos)</div>
            <div style="display:flex; gap:10px;">
                <input type="text" id="adminBannerUrl" value="${currentBanner}" placeholder="Dán địa chỉ hình ảnh (Copy image address) từ Google Photos...">
                <button class="btn btn-success" style="white-space:nowrap;" onclick="saveBannerUrl()">Lưu Banner</button>
            </div>
        </div>

        <div class="card" style="margin-bottom:15px;">
            <div class="card-title">👥 Danh Sách Thành Viên (Bấm vào tên để xem biểu đồ riêng)</div>
            <table class="admin-table">
                <thead><tr><th>Tên Zalo</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>${userRows || '<tr><td colspan="3">Chưa có thành viên đăng ký</td></tr>'}</tbody>
            </table>
        </div>

        <div class="card">
            <div class="card-title" id="chartFilterTitle">📊 Thống Kê Lượt Đăng Nhập (Tất cả User)</div>
            <div style="margin-bottom:10px; display:flex; gap:5px; flex-wrap:wrap;">
                <button class="btn btn-primary" style="width:auto; padding:5px 10px; font-size:12px;" onclick="drawLogChart('day')">Theo Ngày</button>
                <button class="btn btn-primary" style="width:auto; padding:5px 10px; font-size:12px;" onclick="drawLogChart('week')">Theo Tuần</button>
                <button class="btn btn-primary" style="width:auto; padding:5px 10px; font-size:12px;" onclick="drawLogChart('month')">Theo Tháng</button>
                <button class="btn btn-success" style="width:auto; padding:5px 10px; font-size:12px;" onclick="filterLogByUser(null)">Xem Tất Cả</button>
            </div>
            <div style="height:240px; width:100%; position:relative;"><canvas id="realAdminChart"></canvas></div>
        </div>
    `;
    drawLogChart('day');
}

async function saveBannerUrl() {
    const url = document.getElementById('adminBannerUrl').value.trim();
    alert("Đang cập nhật Banner lên hệ thống...");
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'update_banner', bannerUrl: url }) });
    await syncDataFromGoogleSheet();
    alert("Cập nhật Banner thành công!");
}

async function adminAction(act, username) {
    if (act === 'delete' && !confirm(`Xóa vĩnh viễn tài khoản ${username}?`)) return;
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: act, username: username }) });
    renderAdminDashboard(document.getElementById('modalContentArea'));
}

let selectedFilterUser = null;
function filterLogByUser(username) {
    selectedFilterUser = username;
    document.getElementById('chartFilterTitle').innerText = username ? `📊 Lịch Sử Đăng Nhập Của: ${username}` : `📊 Thống Kê Lượt Đăng Nhập (Tất cả User)`;
    drawLogChart('day');
}

function drawLogChart(period) {
    const ctx = document.getElementById('realAdminChart');
    if (!ctx) return;

    if (typeof Chart === 'undefined') {
        ctx.parentElement.innerHTML = `<p style="color:red; text-align:center; padding-top:40px;">⚠️ Thư viện vẽ biểu đồ chưa tải xong, vui lòng F5 lại trang!</p>`;
        return;
    }

    let filteredLogs = selectedFilterUser ? appData.logs.filter(l => l.username === selectedFilterUser) : appData.logs;
    let labels = [];
    let counts = [];
    const now = new Date();

    if (period === 'day') {
        labels = ['Đêm (0-6h)', 'Sáng (6-12h)', 'Chiều (12-18h)', 'Tối (18-24h)'];
        let c0 = 0, c1 = 0, c2 = 0, c3 = 0;
        filteredLogs.forEach(l => {
            let d = new Date(Number(l.time));
            if (d.toDateString() === now.toDateString()) {
                let h = d.getHours();
                if (h < 6) c0++;
                else if (h < 12) c1++;
                else if (h < 18) c2++;
                else c3++;
            }
        });
        counts = [c0, c1, c2, c3];
    } else if (period === 'week') {
        labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        let w1 = 0, w2 = 0, w3 = 0, w4 = 0, w5 = 0, w6 = 0, w7 = 0;
        filteredLogs.forEach(l => {
            let day = new Date(Number(l.time)).getDay();
            if (day === 1) w1++;
            else if (day === 2) w2++;
            else if (day === 3) w3++;
            else if (day === 4) w4++;
            else if (day === 5) w5++;
            else if (day === 6) w6++;
            else w7++;
        });
        counts = [w1, w2, w3, w4, w5, w6, w7];
    } else if (period === 'month') {
        labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        let m1 = 0, m2 = 0, m3 = 0, m4 = 0;
        filteredLogs.forEach(l => {
            let d = new Date(Number(l.time));
            if (d.getMonth() === now.getMonth()) {
                let date = d.getDate();
                if (date <= 7) m1++;
                else if (date <= 14) m2++;
                else if (date <= 21) m3++;
                else m4++;
            }
        });
        counts = [m1, m2, m3, m4];
    }

    if (adminChartInstance) adminChartInstance.destroy();
    adminChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { 
            labels: labels, 
            datasets: [{ 
                label: 'Số lần đăng nhập', 
                data: counts, 
                backgroundColor: '#007bff',
                borderRadius: 4
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}


async function saveBannerUrl() {
    const url = document.getElementById('adminBannerUrl').value.trim();
    alert("Đang cập nhật Banner lên hệ thống...");
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'update_banner', bannerUrl: url }) });
    await syncDataFromGoogleSheet();
    alert("Cập nhật Banner thành công!");
}

async function adminAction(act, username) {
    if (act === 'delete' && !confirm(`Xóa vĩnh viễn tài khoản ${username}?`)) return;
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: act, username: username }) });
    await syncDataFromGoogleSheet();
    renderAdminDashboard(document.getElementById('modalContentArea'));
}

let selectedFilterUser = null;
function filterLogByUser(username) {
    selectedFilterUser = username;
    document.getElementById('chartFilterTitle').innerText = username ? `📊 Lịch Sử Đăng Nhập Của: ${username}` : `📊 Thống Kê Lượt Đăng Nhập (Tất cả User)`;
    drawLogChart('day');
}

function drawLogChart(period) {
    const ctx = document.getElementById('realAdminChart');
    if (!ctx) return;

    let filteredLogs = selectedFilterUser ? appData.logs.filter(l => l.username === selectedFilterUser) : appData.logs;
    let labels = new Array();
    let counts = new Array();
    const now = new Date();

    if (period === 'day') {
        labels.push('Đêm (0-6h)', 'Sáng (6-12h)', 'Chiều (12-18h)', 'Tối (18-24h)');
        let c0 = 0, c1 = 0, c2 = 0, c3 = 0;
        filteredLogs.forEach(l => {
            let d = new Date(Number(l.time));
            if (d.toDateString() === now.toDateString()) {
                let h = d.getHours();
                if (h < 6) c0++;
                else if (h < 12) c1++;
                else if (h < 18) c2++;
                else c3++;
            }
        });
        counts.push(c0, c1, c2, c3);
    } else if (period === 'week') {
        labels.push('T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN');
        let w1 = 0, w2 = 0, w3 = 0, w4 = 0, w5 = 0, w6 = 0, w7 = 0;
        filteredLogs.forEach(l => {
            let day = new Date(Number(l.time)).getDay();
            if (day === 1) w1++;
            else if (day === 2) w2++;
            else if (day === 3) w3++;
            else if (day === 4) w4++;
            else if (day === 5) w5++;
            else if (day === 6) w6++;
            else w7++;
        });
        counts.push(w1, w2, w3, w4, w5, w6, w7);
    } else if (period === 'month') {
        labels.push('Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4');
        let m1 = 0, m2 = 0, m3 = 0, m4 = 0;
        filteredLogs.forEach(l => {
            let d = new Date(Number(l.time));
            if (d.getMonth() === now.getMonth()) {
                let date = d.getDate();
                if (date <= 7) m1++;
                else if (date <= 14) m2++;
                else if (date <= 21) m3++;
                else m4++;
            }
        });
        counts.push(m1, m2, m3, m4);
    }

    if (adminChartInstance) adminChartInstance.destroy();
    adminChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { 
            labels: labels, 
            datasets: new Array({ 
                label: 'Số lần đăng nhập', 
                data: counts, 
                backgroundColor: '#007bff',
                borderRadius: 4
            }) 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}


function renderDynamicList(typeCode, targetElementId) {
    const container = document.getElementById(targetElementId);
    if (!container) return;
    const items = appData.configs.filter(c => c.code === typeCode);
    if (items.length === 0) {
        container.innerHTML = `<p style="color:#6c757d; text-align:center;">Chưa có bài viết nào trong mục này.</p>`;
        return;
    }
    container.innerHTML = items.map(item => `
        <article class="card" style="margin-bottom:15px;">
            <h3 style="margin-top:0; color:var(--primary);">${item.title}</h3>
            <p>${item.content}</p>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
                ${item.media ? `<a href="${item.media}" target="_blank" class="btn btn-danger" style="text-decoration:none; font-size:13px;">▶ Xem Video YouTube</a>` : ''}
                ${item.affiliate ? `<a href="${item.affiliate}" target="_blank" class="btn btn-success" style="text-decoration:none; font-size:13px;">🛒 Xem Giá & Đặt Mua Vật Tư</a>` : ''}
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
    const height = parseFloat(document.getElementById('calcHeight').value) || 0;
    const length = parseFloat(document.getElementById('calcLength').value) || 0;
    const flow = parseFloat(document.getElementById('calcFlow').value) || 0;
    if (height === 0 && length === 0 && flow === 0) return alert("Vui lòng nhập thông số địa hình!");

    const totalHead = height + (length * 0.1);
    let estHP = (flow * totalHead) / 150;
    if (estHP < 0.5) estHP = 0.5;

    computedPumpHP = Math.ceil(estHP * 2) / 2;
    if (computedPumpHP > 3 && computedPumpHP < 5.5) computedPumpHP = 5.5;
    else if (computedPumpHP > 5.5 && computedPumpHP < 7.5) computedPumpHP = 7.5;
    else if (computedPumpHP > 7.5 && computedPumpHP < 10) computedPumpHP = 10;
    else if (computedPumpHP > 10 && computedPumpHP < 15) computedPumpHP = 15;
    else if (computedPumpHP > 15 && computedPumpHP < 20) computedPumpHP = 20;

    const resBox = document.getElementById('calcResultArea');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <h3 style="margin-top:0; color:var(--secondary);">KẾT QUẢ TÍNH CÔNG SUẤT BƠM</h3>
        <p>- Lưu lượng thiết kế (Q): <span class="highlight">${flow.toFixed(1)}</span> m³/giờ</p>
        <p>- Cột áp tổng cộng đẩy dốc (H tổng): <span class="highlight">${totalHead.toFixed(1)}</span> mét *(Đã tính ma sát đường ống)*</p>
        <p>- 🔋 <b>Công suất máy bơm đề xuất:</b> <span class="highlight">${computedPumpHP.toFixed(1)} HP</span> (~${(computedPumpHP * 0.7457).toFixed(2)} kW)</p>
        <p style="background:#fff; padding:10px; border-radius:5px; border:1px solid #dee2e6; margin-bottom:0;">
            💡 <b>Khuyến nghị:</b> Với cột áp ${totalHead.toFixed(1)}m, bạn nên chọn bơm ly tâm trục đứng đa tầng cánh hoặc bơm hỏa tiễn. Hãy chuyển sang tab <b>"CHỌN BIẾN TẦN & CÔNG SUẤT GIÀN PIN NLMT"</b> ngay bên cạnh để tính tủ điện nhé!
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
        ? `<span style="color:red; font-weight:bold;">⚠️ CẢNH BÁO: Điện áp ${totalVoc.toFixed(2)}V vượt quá 900V! Cần giảm số tấm mỗi chuỗi.</span>` 
        : `<span style="color:green; font-weight:bold;">✅ An toàn tuyệt đối (Dưới ngưỡng 900V)</span>`;

    const resBox = document.getElementById('calcResultArea');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <h3 style="margin-top:0; color:var(--secondary);">CẤU HÌNH BIẾN TẦN & GIÀN PIN ĐỀ XUẤT</h3>
        <p>- Công suất bơm đầu vào: <b>${pumpHP.toFixed(1)} HP</b> (Quy đổi: <b>${pumpKW.toFixed(2)} kW</b>)</p>
        <p>- ⚙️ <b>Biến tần bơm chọn lựa:</b> <span class="highlight">${finalInvKW} kW</span> *(Đã làm tròn vượt 2 cấp bảo vệ)*</p>
        <p>- ☀️ <b>Tổng công suất giàn pin NLMT:</b> <span class="highlight" style="color:#e65100;">${actualSolarKW.toFixed(2)} kWp</span> *(Gấp ${(actualSolarKW/finalInvKW).toFixed(2)} lần biến tần)*</p>
        <p>- 📦 <b>Tổng số lượng tấm pin:</b> <b>${totalPanels} tấm</b> (${selectedPanel.name})</p>
        <p>- 🧩 <b>Phương án chia chuỗi (String):</b> Chia thành <b>${stringCount} chuỗi</b>, mỗi chuỗi mắc nối tiếp <span class="highlight">${panelsPerString} tấm</span> *(Khuyến nghị tối ưu 17 tấm)*</p>
        <p>- ⚡ <b>Điện áp hở mạch mỗi chuỗi (Voc):</b> <b>${totalVoc.toFixed(2)} V</b> — ${vocAlert}</p>
        <p style="background:#fff; padding:10px; border-radius:5px; border:1px solid #dee2e6; margin-bottom:0;">
            💡 <b>Lưu ý lắp đặt:</b> Hệ thống bơm nước dốc có lực cản thủy lực lớn giúp motor dừng nhanh tự nhiên, <b>không cần lắp thêm điện trở hãm ngoài</b>. Hãy cài chế độ dừng tự do (Coast to Stop).
        </p>
    `;
}
