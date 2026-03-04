
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw76mlpSoJlip6iFAncy_fUj7GgVOHJ4dK_CEOGBXbgljweNA6-UYybQlQvVSjWpwfI/exec';
async function loadRealDashboard() {
    const revenueEl = document.getElementById('stat-revenue');
    const ordersEl = document.getElementById('stat-orders');

    try {
        console.log("⏳ Đang kết nối Google Sheet...");
        
        // Trạng thái chờ trong khi tải dữ liệu
        if (revenueEl) revenueEl.innerText = "Đang tính...";
        if (ordersEl) ordersEl.innerText = "...";

        // Gửi yêu cầu lấy dữ liệu
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) throw new Error("Không thể kết nối với Script URL");
        
        const data = await response.json(); 

        const validOrders = data.filter(order => order['tổng tiền'] || order['tên dịch vụ']);
        
        let totalRevenue = 0;
        validOrders.forEach(order => {
            // Lấy giá trị từ cột 'tổng tiền', xóa ký tự 'đ', '.', ',' để chuyển về số
            let priceStr = String(order['tổng tiền'] || "0");
            let cleanPrice = parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
            totalRevenue += cleanPrice;
        });

        console.log(`✅ Thành công: Đã nạp ${validOrders.length} đơn hàng.`);

        // HIỂN THỊ LÊN GIAO DIỆN
        if (revenueEl) {
            // Định dạng tiền Việt: ví dụ 120.000.000 vnđ
            revenueEl.innerHTML = new Intl.NumberFormat('vi-VN').format(totalRevenue) + 
                ' <span class="text-xs text-slate-400 font-medium">vnđ</span>';
        }
        if (ordersEl) {
            ordersEl.innerText = validOrders.length;
        }

    } catch (error) {
        console.error("❌ Lỗi Google Sheet:", error);
        if (revenueEl) revenueEl.innerText = "Lỗi nạp";
        if (ordersEl) ordersEl.innerText = "!";
    }
}
async function initAdminSystem() {
    // 1. Nạp thống kê từ Google Sheet
    loadRealDashboard();

    // 2. Nạp số lượng xe từ file cars.json (nếu có)
    try {
        const resCars = await fetch('cars.json');
        if (resCars.ok) {
            const cars = await resCars.json();
            const carStat = document.getElementById('stat-cars');
            if (carStat) carStat.innerText = cars.length;
        }
    } catch (e) { 
        console.warn("Chưa tìm thấy file cars.json, số lượng xe sẽ giữ mặc định."); 
    }

    // 3. Nạp số lượng tài xế (Lấy từ LocalStorage hoặc mặc định là 5)
    const drivers = JSON.parse(localStorage.getItem('drivers_data')) || [];
    const driverStat = document.getElementById('stat-drivers');
    if (driverStat) {
        driverStat.innerText = drivers.length > 0 ? drivers.length : "5";
    }
}

// Lắng nghe sự kiện trang web đã sẵn sàng để chạy code
document.addEventListener('DOMContentLoaded', initAdminSystem);