const app = {
    // --- CẤU HÌNH SERVER BACKEND (QUAN TRỌNG) ---
    API_URL: 'http://localhost:5000', 
    
    state: {
        cars: [],
        drivers: [],
        bookings: [],
        filteredCars: [],
        selectedCar: null,
        selectedDriver: null,
        days: 1,
        driverDays: 1,
        totalPrice: 0,
        currentPaymentAmount: 0,
        isLoading: false
    },

    CONFIG: {
        BANK_ID: "MB",
        ACCOUNT_NO: "0353979614",
        ACCOUNT_NAME: "BUI VAN TRANG",
        DRIVER_PRICE_PER_DAY: 500000,
        SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby_iypBShENktKrM_K25bLQDlE_SfUQBQ9AKkvaZIXVuOuzsQGvi5RBFmYBssYwhWo-/exec'
    },

    // ============================================================
    // 1. KHỞI TẠO & SỰ KIỆN
    // ============================================================
    async init() {
        console.log("%c🚀 TrangHy Autocar: Connecting to Backend...", "color: #2563eb; font-weight: bold;");
        window.app = this;
        this.bindEvents();
        this.initDatePickers();
        
        // Gọi dữ liệu từ Server thật
        await this.fetchDataFromServer();
    },

    bindEvents() {
        window.addEventListener('click', (e) => {
            if (e.target.id === 'modal-car') this.closeCar();
            if (e.target.id === 'modal-driver') this.closeDriver();
            if (e.target.id === 'payment-modal') this.closePay();
            if (e.target.id === 'modal-login') this.closeLogin();
        });
    },

    // ============================================================
    // 2. KẾT NỐI SERVER (PHẦN MỚI QUAN TRỌNG)
    // ============================================================
    async fetchDataFromServer() {
        try {
            // 1. Lấy danh sách xe
            const resCars = await fetch(`${this.API_URL}/api/cars`);
            if (!resCars.ok) throw new Error("Không kết nối được Server Xe");
            this.state.cars = await resCars.json();
            this.state.filteredCars = [...this.state.cars];

            // 2. Lấy danh sách tài xế
            const resDrivers = await fetch(`${this.API_URL}/api/drivers`);
            this.state.drivers = await resDrivers.json();

            console.log(`✅ Đã tải: ${this.state.cars.length} Xe & ${this.state.drivers.length} Tài xế từ Database.`);
            
            // 3. Hiển thị ra màn hình
            this.renderCars();
            this.renderDriversHome();
            this.updateAdminStats();

        } catch (error) {
            console.error("❌ Lỗi kết nối Backend:", error);
            alert("⚠️ Lỗi: Không thể kết nối tới Server (Port 5000).\nHãy chắc chắn bạn đã chạy lệnh 'node server.js'");
        }
    },

    // ============================================================
    // 3. QUẢN LÝ MODAL
    // ============================================================
    openLogin() { this.toggleModal('modal-login', true); },
    closeLogin() { this.toggleModal('modal-login', false); },
    closeCar() { this.toggleModal('modal-car', false); },
    closeDriver() { this.toggleModal('modal-driver', false); },
    closePay() { this.toggleModal('payment-modal', false); },

    toggleModal(id, show) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle('hidden', !show);
            el.style.display = show ? 'flex' : 'none';
        }
    },

    // ============================================================
    // 4. HIỂN THỊ DỮ LIỆU (RENDER)
    // ============================================================
    renderCars(data = null) {
        const container = document.getElementById('car-list');
        if (!container) return;

        const displayData = data || this.state.filteredCars;

        if (displayData.length === 0) {
            container.innerHTML = "<p class='col-span-full text-center py-10 text-slate-400'>Không tìm thấy xe nào...</p>";
            return;
        }

        container.innerHTML = displayData.map(car => {
            const isBusy = car.status === 'busy' || car.status === 'Đang bận';
            // Xử lý ảnh: Nếu ảnh chưa có đường dẫn đầy đủ thì nối thêm API_URL
            let imgUrl = car.image_url;
            if (imgUrl && !imgUrl.startsWith('http')) {
                imgUrl = `${this.API_URL}/${imgUrl}`;
            }

            return `
            <div onclick="${isBusy ? '' : `app.openCar(${car.id})`}" 
                 class="car-card bg-white p-5 group relative ${isBusy ? 'opacity-60 grayscale pointer-events-none' : 'cursor-pointer'}">
                
                <div class="relative overflow-hidden h-56 rounded-[2rem] mb-4">
                    <img src="${imgUrl}" 
                         onerror="this.src='https://via.placeholder.com/300?text=No+Image'"
                         class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    <div class="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold">
                        ${car.category || 4} Chỗ
                    </div>
                    ${isBusy ? '<div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold uppercase">ĐÃ ĐƯỢC THUÊ</div>' : ''}
                </div>
                
                <div class="space-y-2">
                    <h3 class="text-xl font-black text-slate-900 italic">${car.name}</h3>
                    <div class="flex justify-between items-center border-t border-slate-100 pt-3">
                        <div>
                            <p class="text-[9px] font-bold text-slate-400 uppercase">Giá thuê ngày</p>
                            <p class="text-xl font-black text-blue-600">${this.formatMoney(car.price_per_day)}</p>
                        </div>
                        <button class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                            <i class="fas fa-arrow-right -rotate-45 group-hover:rotate-0 transition-transform"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    renderDriversHome() {
        const container = document.getElementById('display-drivers');
        if (!container) return;

        container.innerHTML = this.state.drivers.map(d => {
            const isBusy = d.status === 'busy';
            const avatarChar = d.name ? d.name.split(' ').pop().charAt(0) : '?';
            
            return `
            <div class="driver-card bg-white p-8 relative ${isBusy ? 'opacity-60 grayscale' : ''}">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black italic">
                        ${avatarChar}
                    </div>
                    <div>
                        <h4 class="text-lg font-black italic">${d.name}</h4>
                        <p class="text-xs font-bold text-blue-600">${d.experience}+ Năm kinh nghiệm</p>
                    </div>
                </div>
                <p class="text-slate-500 text-xs font-medium mb-6 line-clamp-2">${d.bio || 'Tài xế chuyên nghiệp'}</p>
                <button ${isBusy ? 'disabled' : `onclick="app.openDriverBooking(${d.id})"`} 
                    class="w-full py-4 rounded-xl bg-slate-100 text-slate-900 font-black text-[10px] uppercase hover:bg-slate-900 hover:text-white transition-all">
                    ${isBusy ? 'Đang bận' : 'Liên hệ thuê'}
                </button>
            </div>`;
        }).join('');
    },

    // ============================================================
    // 5. XỬ LÝ ĐẶT HÀNG (GỬI VỀ SERVER)
    // ============================================================
    
    // Mở Modal Xe
    openCar(id) {
        const car = this.state.cars.find(c => c.id === id);
        if (!car) return;
        this.state.selectedCar = car;

        let imgUrl = car.image_url;
        if (imgUrl && !imgUrl.startsWith('http')) imgUrl = `${this.API_URL}/${imgUrl}`;

        document.getElementById('d-img').src = imgUrl;
        document.getElementById('d-name').innerText = car.name;
        this.toggleModal('modal-car', true);
        this.updateTotal();
    },

    // Mở Modal Tài xế
    openDriverBooking(id) {
        const driver = this.state.drivers.find(d => d.id === id);
        if (!driver) return;
        this.state.selectedDriver = driver;

        document.getElementById('dr-avatar').innerText = driver.name.split(' ').pop().charAt(0);
        document.getElementById('dr-name').innerText = driver.name;
        this.toggleModal('modal-driver', true);
        this.updateDriverTotal();
    },

    // XỬ LÝ THANH TOÁN & ĐẶT CỌC
    generatePaymentQR(amount, memo, type) {
        const bank = this.CONFIG;
        const url = `https://img.vietqr.io/image/${bank.BANK_ID}-${bank.ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(bank.ACCOUNT_NAME)}`;

        document.getElementById('qr-code').src = url;
        document.getElementById('payment-final-amount').innerText = this.formatMoney(amount);
        this.toggleModal('payment-modal', true);

        // Nút xác nhận thanh toán
        const btn = document.getElementById('btn-confirm-payment');
        // Clone để xóa event cũ
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.onclick = async () => {
            if (this.state.isLoading) return;
            this.state.isLoading = true;
            newBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

            try {
                // 1. Gửi dữ liệu về Server để lưu vào Database
                if (type === 'xe') await this.confirmBookingCar();
                else await this.confirmBookingDriver();

                // 2. Tạo hợp đồng & Chuyển hướng
                await this.processContractAndZalo(type);
                
                alert("🎉 Đặt thành công! Hệ thống đã ghi nhận.");
                this.closePay();
                
                // 3. Tải lại dữ liệu mới nhất (để cập nhật trạng thái Busy)
                await this.fetchDataFromServer();

            } catch (err) {
                console.error("Lỗi đặt:", err);
                alert("Lỗi: " + err.message);
            } finally {
                this.state.isLoading = false;
                newBtn.innerHTML = 'XÁC NHẬN ĐÃ CHUYỂN';
            }
        };
    },

    // Gửi API đặt xe
    async confirmBookingCar() {
        const bookingData = {
            type: 'car',
            id: this.state.selectedCar.id,
            customer: {
                name: document.getElementById('cust-fullname').value,
                phone: document.getElementById('cust-phone').value
            },
            startDate: document.getElementById('modal-start-date').value,
            endDate: document.getElementById('modal-end-date').value
        };

        const res = await fetch(`${this.API_URL}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        
        const result = await res.json();
        if (!result.success) throw new Error(result.error || "Đặt xe thất bại");
    },

    // Gửi API đặt tài xế
    async confirmBookingDriver() {
        const bookingData = {
            type: 'driver',
            id: this.state.selectedDriver.id,
            customer: {
                name: document.getElementById('dr-cust-fullname').value,
                phone: document.getElementById('dr-cust-phone').value
            },
            startDate: document.getElementById('dr-start-date').value,
            endDate: document.getElementById('dr-end-date').value
        };

        const res = await fetch(`${this.API_URL}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        const result = await res.json();
        if (!result.success) throw new Error(result.error || "Đặt tài xế thất bại");
    },

    // Các bước chuẩn bị trước khi thanh toán
    handleBooking() {
        if (!document.getElementById('agree-contract')?.checked) return alert("⚠️ Vui lòng đồng ý điều khoản!");
        
        const fullname = document.getElementById('cust-fullname').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const start = document.getElementById('modal-start-date').value;
        const end = document.getElementById('modal-end-date').value;

        if (!fullname || !phone || !start || !end) return alert("⚠️ Thiếu thông tin!");

        // Gửi Google Sheet (giữ nguyên tính năng này cho bạn)
        this.sendToSheet({
            carName: this.state.selectedCar.name,
            custName: fullname,
            phone: phone,
            startDate: start,
            endDate: end,
            totalPrice: this.formatMoney(this.state.totalPrice)
        });

        // Mở thanh toán
        const memo = `THUE ${this.state.selectedCar.name.substring(0,10)} ${phone}`;
        this.generatePaymentQR(this.state.totalPrice, memo, 'xe');
        this.closeCar();
    },

    handleDriverBooking() {
        if (!document.getElementById('agree-contract-driver')?.checked) return alert("⚠️ Vui lòng đồng ý điều khoản!");
        
        const fullname = document.getElementById('dr-cust-fullname').value.trim();
        const phone = document.getElementById('dr-cust-phone').value.trim();
        const start = document.getElementById('dr-start-date').value;
        const end = document.getElementById('dr-end-date').value;

        if (!fullname || !phone || !start || !end) return alert("⚠️ Thiếu thông tin!");

        this.sendToSheet({
            carName: "Tài xế: " + this.state.selectedDriver.name,
            custName: fullname,
            phone: phone,
            startDate: start,
            endDate: end,
            totalPrice: this.formatMoney(this.state.currentPaymentAmount)
        });

        const memo = `TX ${this.state.selectedDriver.name.substring(0,5)} ${phone}`;
        this.generatePaymentQR(this.state.currentPaymentAmount, memo, 'driver');
        this.closeDriver();
    },

    // ============================================================
    // 6. CÁC HÀM TIỆN ÍCH KHÁC (Date, Money, PDF...)
    // ============================================================
    initDatePickers() {
        if (typeof flatpickr !== 'undefined') {
            const opts = { minDate: "today", dateFormat: "d/m/Y", locale: "vn" };
            flatpickr("#modal-start-date", { ...opts, onChange: () => this.calcDays('xe') });
            flatpickr("#modal-end-date", { ...opts, onChange: () => this.calcDays('xe') });
            flatpickr("#dr-start-date", { ...opts, onChange: () => this.calcDays('tx') });
            flatpickr("#dr-end-date", { ...opts, onChange: () => this.calcDays('tx') });
        }
    },

    calcDays(type) {
        const p1 = type === 'xe' ? 'modal' : 'dr';
        const start = document.getElementById(`${p1}-start-date`)._flatpickr?.selectedDates[0];
        const end = document.getElementById(`${p1}-end-date`)._flatpickr?.selectedDates[0];

        if (start && end) {
            if (end < start) {
                alert("Ngày trả không được nhỏ hơn ngày nhận!");
                return;
            }
            const diff = Math.ceil(Math.abs(end - start) / (86400000)) || 1;
            
            if (type === 'xe') {
                this.state.days = diff;
                this.updateTotal();
            } else {
                this.state.driverDays = diff;
                this.updateDriverTotal();
            }
        }
    },

    updateTotal() {
        if (!this.state.selectedCar) return;
        this.state.totalPrice = this.state.days * this.state.selectedCar.price_per_day;
        document.getElementById('modal-total-price').innerText = this.formatMoney(this.state.totalPrice);
        document.getElementById('calc-days-text').innerText = this.state.days;
    },

    updateDriverTotal() {
        this.state.currentPaymentAmount = this.state.driverDays * this.CONFIG.DRIVER_PRICE_PER_DAY;
        document.getElementById('dr-total').innerText = this.formatMoney(this.state.currentPaymentAmount);
        document.getElementById('dr-days-text').innerText = this.state.driverDays;
    },

    formatMoney(amount) {
        return parseInt(amount || 0).toLocaleString('vi-VN') + "đ";
    },

    sendToSheet(data) {
        fetch(this.CONFIG.SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(e => console.error("Lỗi gửi Sheet:", e));
    },

    // --- LOGIC HỢP ĐỒNG PDF & ZALO (GIỮ NGUYÊN NHƯ CŨ) ---
    async processContractAndZalo(type) {
        // (Tôi giữ nguyên logic tạo PDF bạn đã viết rất tốt ở trên)
        // Chỉ thêm 1 chút log để debug
        console.log("Đang tạo hợp đồng cho:", type);
        
        // ... (Phần code PDF của bạn giữ nguyên, không cần sửa gì) ...
        // Lưu ý: Tôi rút gọn chỗ này để code không quá dài, 
        // nhưng bạn cứ giữ nguyên hàm processContractAndZalo cũ của bạn là được.
        // Chỉ cần đảm bảo khi gọi window.open Zalo thì link đúng.
    },
    
    // --- ADMIN DASHBOARD (Hiển thị thống kê cơ bản) ---
    updateAdminStats() {
        const carElem = document.getElementById('total-cars-count');
        const driverElem = document.getElementById('total-drivers-count');
        if(carElem) carElem.innerText = this.state.cars.length;
        if(driverElem) driverElem.innerText = this.state.drivers.length;
    },
    
    // Xử lý đăng nhập (Giả lập)
    handleLogin() {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        if (user === 'admin' && pass === '123') {
            document.getElementById('modal-login').classList.add('hidden');
            document.getElementById('dashboard-container').classList.remove('hidden');
            document.getElementById('admin-view').classList.remove('hidden');
            this.updateAdminStats();
        } else {
            alert("Sai tài khoản/mật khẩu!");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());