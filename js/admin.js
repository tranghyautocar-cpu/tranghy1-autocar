// --- CẤU HÌNH ---
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw76mlpSoJlip6iFAncy_fUj7GgVOHJ4dK_CEOGBXbgljweNA6-UYybQlQvVSjWpwfI/exec';

// --- 0. BẢO MẬT ---
const currentUser = JSON.parse(localStorage.getItem('tranghy_user'));
if(!currentUser || currentUser.role !== 'ADMIN') {
    window.location.href = 'login.html';
} else {
    document.getElementById('admin-name').innerText = currentUser.name;
}

// --- 1. QUẢN LÝ DỮ LIỆU ---
const DB = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};

// --- 2. NẠP DỮ LIỆU TỪ GOOGLE SHEETS (HÀM CHÍNH) ---
async function syncWithGoogleSheets() {
    const revenueEl = document.getElementById('stat-revenue');
    const ordersEl = document.getElementById('stat-orders');
    const orderTableBody = document.getElementById('orders-table-body');

    try {
        revenueEl.innerText = "Đang tải...";
        const response = await fetch(SCRIPT_URL);
        const data = await response.json(); 

        // Giả sử Google Sheet trả về mảng các object
        let totalRevenue = 0;
        let tableHTML = '';
        
        // Cập nhật mảng đơn hàng vào LocalStorage để đồng bộ các phần khác nếu cần
        DB.set('tranghy_orders', data);

        data.forEach((o, idx) => {
            let price = parseInt(String(o['tổng tiền'] || 0).replace(/[^\d]/g, '')) || 0;
            totalRevenue += price;

            tableHTML += `
                <tr>
                    <td class="px-8 py-5 font-bold">${o['tên khách hàng'] || 'Khách vãng lai'}</td>
                    <td class="px-8 py-5 text-blue-600 font-bold uppercase italic text-[11px]">${o['tên xe'] || 'Dịch vụ'}</td>
                    <td class="px-8 py-5 font-black">${price.toLocaleString('vi-VN')}đ</td>
                    <td class="px-8 py-5"><span class="status-badge status-success">Đã xác nhận</span></td>
                    <td class="px-8 py-5 text-right">
                        <button class="text-slate-400"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>`;
        });

        revenueEl.innerText = totalRevenue.toLocaleString('vi-VN') + 'đ';
        ordersEl.innerText = data.length;
        document.getElementById('menu-orders-count').innerText = data.length;
        orderTableBody.innerHTML = tableHTML;

    } catch (error) {
        console.error("Lỗi kết nối Sheet:", error);
        revenueEl.innerText = "Lỗi nạp";
        renderOrders(); // Quay về dùng local nếu lỗi
    }
}

// --- 3. RENDER CÁC THÀNH PHẦN KHÁC ---
function renderCars() {
    const container = document.getElementById('cars-grid');
    const cars = DB.get('tranghy_cars');
    container.innerHTML = cars.map((car, idx) => `
        <div class="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
            <img src="${car.img}" class="w-full h-40 object-cover rounded-2xl mb-4">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-black text-sm uppercase italic">${car.name}</h4>
                    <p class="text-[10px] text-slate-400 font-bold">${car.type || 'Hạng sang'}</p>
                </div>
                <span class="status-badge status-success">${car.status}</span>
            </div>
            <div class="mt-4 pt-4 border-t flex justify-between items-center">
                <span class="text-blue-600 font-black">${parseInt(car.price).toLocaleString('vi-VN')}đ</span>
                <button onclick="deleteItem('tranghy_cars', ${idx}, renderCars)" class="text-red-400"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
    document.getElementById('stat-cars').innerText = cars.length;
}

// --- 4. KHỞI CHẠY ---
document.addEventListener('DOMContentLoaded', () => {
    syncWithGoogleSheets(); // Lấy dữ liệu đơn hàng từ Cloud
    renderCars();           // Lấy dữ liệu xe từ máy
    renderDrivers();        // Lấy dữ liệu tài xế từ máy
    
    // Khởi tạo biểu đồ
    const ctx = document.getElementById('revenueChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
            datasets: [{ label: 'Doanh thu', data: [12, 19, 15, 25, 22, 30, 45], borderColor: '#2563eb', tension: 0.4 }]
        }
    });
});

// ... Các hàm bổ trợ switchTab, openModal, logout giữ nguyên ...