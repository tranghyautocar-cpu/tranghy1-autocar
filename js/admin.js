// Hàm này chạy khi trang Admin tải xong
async function loadRealDashboard() {
    const SCRIPT_URL = 'LINK_GOOGLE_SCRIPT_CUA_BAN_O_DAY'; // Dán link script của bạn vào

    try {
        console.log("⏳ Đang tải dữ liệu thật từ Google Sheet...");
        
        // 1. Gọi điện cho Google lấy dữ liệu
        const response = await fetch(SCRIPT_URL);
        const data = await response.json(); // Danh sách tất cả đơn hàng

        // 2. Tính toán số liệu
        const totalOrders = data.length; // Tổng số dòng
        
        // Cộng tổng tiền (Hơi khó vì tiền trong sheet là dạng chữ "1.500.000đ")
        let totalRevenue = 0;
        data.forEach(order => {
            // Xóa chữ "đ", xóa dấu chấm, chuyển thành số để cộng
            let cleanPrice = order.price.toString().replace(/[^\d]/g, ''); 
            totalRevenue += parseInt(cleanPrice) || 0;
        });

        // 3. Hiển thị lên màn hình (Update vào các ID đã đặt ở Bước 2)
        if(document.getElementById('real-revenue')) {
            // Format lại thành tiền Việt: 134000000 -> 134.000.000
            document.getElementById('real-revenue').innerText = 
                new Intl.NumberFormat('vi-VN').format(totalRevenue) + ' vnđ';
        }

        if(document.getElementById('real-orders')) {
            document.getElementById('real-orders').innerText = totalOrders;
        }

        console.log("✅ Đã cập nhật số liệu thật!");

    } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        alert("Không tải được doanh thu từ Google Sheet!");
    }
}

// Gọi hàm này ngay khi file chạy
loadRealDashboard();