// LINK GOOGLE SCRIPT CỦA BẠN (Cái link bạn vừa tìm thấy lúc nãy)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzDi9Cjw1E6cINUdmTn15HpQ3Cebb49fp9PKjJKzgGKzfXs3DQ5dVVwPjLF2YZ5XYlp/exec'
async function loadRealDashboard() {
    try {
        console.log("⏳ Đang kết nối Google Sheet...");
        
        // 1. Lấy dữ liệu Đơn hàng từ Google Sheet
        const response = await fetch(SCRIPT_URL);
        const data = await response.json(); 

        console.log("✅ Đã lấy được:", data.length, "đơn hàng");

        // 2. Tính toán số liệu
        let totalOrders = data.length; // Tổng số đơn
        let totalRevenue = 0;          // Tổng tiền

        data.forEach(order => {
            // Xử lý tiền: Xóa chữ "đ", xóa dấu chấm/phẩy để thành số
            // Ví dụ: "1.500.000đ" -> 1500000
            let rawPrice = order.price ? order.price.toString() : "0";
            let cleanPrice = rawPrice.replace(/[^\d]/g, ''); 
            totalRevenue += parseInt(cleanPrice) || 0;
        });

        // 3. Hiển thị lên HTML (Dựa theo ID bạn đã đặt trong code)
        
        // Cập nhật DOANH THU (id="stat-revenue")
        const revenueEl = document.getElementById('stat-revenue');
        if (revenueEl) {
            // Định dạng tiền Việt: 134.000.000 vnđ
            revenueEl.innerHTML = new Intl.NumberFormat('vi-VN').format(totalRevenue) + ' <span class="text-sm text-slate-400 font-medium">vnđ</span>';
        }

        // Cập nhật ĐƠN ĐẶT XE (id="stat-orders")
        const ordersEl = document.getElementById('stat-orders');
        if (ordersEl) {
            ordersEl.innerText = totalOrders;
        }

    } catch (error) {
        console.error("❌ Lỗi lấy dữ liệu:", error);
        // Nếu lỗi thì giữ nguyên số 0 hoặc báo lỗi
    }
}

// 4. Gọi hàm này chạy ngay khi mở trang Admin
document.addEventListener('DOMContentLoaded', () => {
    loadRealDashboard();
    
    // Nếu muốn tự động cập nhật số Tổng xe và Tài xế từ file json thì thêm đoạn này:
    fetch('cars.json').then(res => res.json()).then(cars => {
        if(document.getElementById('stat-cars')) {
            document.getElementById('stat-cars').innerText = cars.length;
        }
    });
    
    // (Giả lập số tài xế vì chưa có file drivers.json, hoặc set cứng)
    if(document.getElementById('stat-drivers')) {
        document.getElementById('stat-drivers').innerText = "5"; 
    }
});