const app = {
    state: {
        cars: [],
        drivers: [],
        filteredCars: [],
        selectedCar: null,
        selectedDriver: null,
        days: 1,
        driverDays: 1,
        totalPrice: 0,
        currentPaymentAmount: 0,
        isLoading: false
    },

    // Cấu hình hệ thống
    CONFIG: {
        BANK_ID: "MB",
        ACCOUNT_NO: "0353979614",
        ACCOUNT_NAME: "BUI VAN TRANG",
        DRIVER_PRICE_PER_DAY: 500000,
        TELEGRAM_TOKEN: "8376675819:AAEa5I1_vdfytpIuUOjYAkSr2NeZZChKLWs",
        TELEGRAM_CHAT_ID: "5758212428",
        SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby_iypBShENktKrM_K25bLQDlE_SfUQBQ9AKkvaZIXVuOuzsQGvi5RBFmYBssYwhWo-/exec'
    },

    // ============================================================
    // 1. KHỞI TẠO & SỰ KIỆN
    // ============================================================
    async init() {
        console.log("%c🚀 TrangHy Autocar: System Started", "color: #2563eb; font-weight: bold;");
        window.app = this; // Public app ra window để HTML gọi được
        this.bindEvents();
        await this.fetchInitialData();
        this.initDatePickers();
    },

    bindEvents() {
        // Đóng modal khi click ra ngoài
        window.addEventListener('click', (e) => {
            if (e.target.id === 'modal-car') this.closeCar();
            if (e.target.id === 'modal-driver') this.closeDriver();
            if (e.target.id === 'payment-modal') this.closePay();
            if (e.target.id === 'modal-login') this.closeLogin();
        });
    },

    // ============================================================
    // 2. QUẢN LÝ MODAL (Cải thiện hiển thị)
    // ============================================================
    openLogin() { this.toggleModal('modal-login', true); },
    closeLogin() { this.toggleModal('modal-login', false); },
    closeCar() { this.toggleModal('modal-car', false); },
    closeDriver() { this.toggleModal('modal-driver', false); },
    closePay() { this.toggleModal('payment-modal', false); },

    toggleModal(id, show) {
        const el = document.getElementById(id);
        if (el) {
            if (show) {
                el.classList.remove('hidden');
                el.style.display = 'flex'; // Đảm bảo hiện Flex
            } else {
                el.classList.add('hidden');
                el.style.display = 'none';
            }
        }
    },

    // ============================================================
    // 3. XỬ LÝ ĐĂNG NHẬP
    // ============================================================
    handleLogin: function() {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;

        if (user === 'admin' && pass === '123') {
            this.showDashboard('ADMIN');
        } else if (user === 'driver1' && pass === '123') {
            this.showDashboard('DRIVER');
        } else {
            alert("⚠️ Tài khoản hoặc mật khẩu không đúng!");
        }
    },

    showDashboard: function(role) {
        this.closeLogin();
        document.getElementById('dashboard-container').classList.remove('hidden');
        const adminView = document.getElementById('admin-view');
        const driverView = document.getElementById('driver-view');
        const roleText = document.getElementById('dash-role');

        if (role === 'ADMIN') {
            roleText.innerText = "HỆ THỐNG QUẢN TRỊ";
            adminView.classList.remove('hidden');
            driverView.classList.add('hidden');
            this.renderAdminOrders();
        } else {
            roleText.innerText = "GIAO DIỆN TÀI XẾ";
            driverView.classList.remove('hidden');
            adminView.classList.add('hidden');
            this.renderDriverOrders();
        }
    },

    // ============================================================
    // 4. HIỂN THỊ DỮ LIỆU
    // ============================================================
    renderAdminOrders: function() {
        const list = document.getElementById('admin-order-list');
        if (list) {
            list.innerHTML = `
            <tr class="border-b border-slate-50">
                <td class="px-8 py-4 font-bold text-sm">Khách hàng mẫu</td>
                <td class="px-8 py-4 text-blue-600 font-black text-xs uppercase">Xe đang sử dụng</td>
                <td class="px-8 py-4 text-xs font-bold">30/12 - 01/01</td>
                <td class="px-8 py-4"><span class="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Đang thuê</span></td>
            </tr>`;
        }
    },

    renderDriverOrders: function() {
        const container = document.getElementById('driver-order-list');
        if (container) {
            container.innerHTML = `
            <div class="p-6 bg-white rounded-3xl border-2 border-blue-600 shadow-sm">
                <div class="flex justify-between mb-4">
                    <span class="bg-blue-600 text-white px-2 py-1 rounded text-[9px] font-black uppercase">Lịch của bạn</span>
                </div>
                <h5 class="text-lg font-black text-slate-900 uppercase italic">Đón khách: Trung tâm TP</h5>
                <p class="text-xs text-slate-500 font-bold mt-1">Số ĐT khách: 09xx xxx xxx</p>
                <button class="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase">Hoàn thành nhiệm vụ</button>
            </div>`;
        }
    },

    // ============================================================
    // 5. RENDER XE VÀ TÀI XẾ
    // ============================================================
    renderCars(data = this.state.filteredCars) {
        const container = document.getElementById('car-list');
        if (!container) return;

        container.innerHTML = data.map(car => {
            const isBusy = car.status === 'busy';
            const price = car.price_per_day || car.price || 0;
            return `
            <div onclick="${isBusy ? '' : `app.openCar(${car.id})`}" 
                 class="car-card bg-white p-5 group relative ${isBusy ? 'opacity-60 grayscale pointer-events-none' : 'cursor-pointer'}">
                
                <div class="relative overflow-hidden h-56 rounded-[2rem] mb-4">
                    <img src="${car.image_url || car.image}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    <div class="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold">
                        ${car.seats || 4} Chỗ
                    </div>
                    ${isBusy ? '<div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold uppercase">ĐÃ ĐƯỢC THUÊ</div>' : ''}
                </div>
                
                <div class="space-y-2">
                    <h3 class="text-xl font-black text-slate-900 italic">${car.name}</h3>
                    <div class="flex justify-between items-center border-t border-slate-100 pt-3">
                        <div>
                            <p class="text-[9px] font-bold text-slate-400 uppercase">Giá thuê ngày</p>
                            <p class="text-xl font-black text-blue-600">${this.formatMoney(price)}</p>
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
            return `
            <div class="driver-card bg-white p-8 relative ${isBusy ? 'opacity-60 grayscale' : ''}">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black italic">
                        ${d.name.split(' ').pop().charAt(0)}
                    </div>
                    <div>
                        <h4 class="text-lg font-black italic">${d.name}</h4>
                        <p class="text-xs font-bold text-blue-600">${d.experience}+ Năm kinh nghiệm</p>
                    </div>
                </div>
                <p class="text-slate-500 text-xs font-medium mb-6 line-clamp-2">${d.bio}</p>
                <button ${isBusy ? 'disabled' : `onclick="app.openDriverBooking(${d.id})"`} 
                    class="w-full py-4 rounded-xl bg-slate-100 text-slate-900 font-black text-[10px] uppercase hover:bg-slate-900 hover:text-white transition-all">
                    ${isBusy ? 'Đang bận' : 'Liên hệ thuê'}
                </button>
            </div>`;
        }).join('');
    },

    // ============================================================
    // 6. XỬ LÝ MỞ FORM ĐẶT (OPEN MODALS)
    // ============================================================
    openCar(id) {
        const car = this.state.cars.find(c => c.id === id);
        if (!car) return;
        this.state.selectedCar = car;

        document.getElementById('d-img').src = car.image_url || car.image;
        document.getElementById('d-name').innerText = car.name;

        this.toggleModal('modal-car', true);
        this.updateTotal();
    },

    openDriverBooking(id) {
        const driver = this.state.drivers.find(d => d.id === id);
        if (!driver) return;
        this.state.selectedDriver = driver;

        document.getElementById('dr-avatar').innerText = driver.name.split(' ').pop().charAt(0);
        document.getElementById('dr-name').innerText = driver.name;

        this.toggleModal('modal-driver', true);
        this.updateDriverTotal();
    },

    // ============================================================
    // 7. XỬ LÝ DATE & GIÁ (Thêm Validate Ngày)
    // ============================================================
    initDatePickers() {
        const commonOptions = { minDate: "today", dateFormat: "d/m/Y", locale: "vn" };
        if (typeof flatpickr !== 'undefined') {
            flatpickr("#modal-start-date", { ...commonOptions, onChange: () => this.calculateDays() });
            flatpickr("#modal-end-date", { ...commonOptions, onChange: () => this.calculateDays() });
            flatpickr("#dr-start-date", { ...commonOptions, onChange: () => this.calculateDriverDays() });
            flatpickr("#dr-end-date", { ...commonOptions, onChange: () => this.calculateDriverDays() });
        }
    },

    calculateDays() {
        const start = document.getElementById('modal-start-date')._flatpickr?.selectedDates[0];
        const end = document.getElementById('modal-end-date')._flatpickr?.selectedDates[0];
        if (start && end) {
            if (end < start) {
                alert("⚠️ Ngày trả xe không được nhỏ hơn ngày nhận!");
                document.getElementById('modal-end-date')._flatpickr.clear();
                return;
            }
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            this.state.days = diffDays <= 0 ? 1 : diffDays;
            this.updateTotal();
        }
    },

    calculateDriverDays() {
        const start = document.getElementById('dr-start-date')._flatpickr?.selectedDates[0];
        const end = document.getElementById('dr-end-date')._flatpickr?.selectedDates[0];
        if (start && end) {
            if (end < start) {
                alert("⚠️ Ngày kết thúc không được nhỏ hơn ngày bắt đầu!");
                document.getElementById('dr-end-date')._flatpickr.clear();
                return;
            }
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            this.state.driverDays = diffDays <= 0 ? 1 : diffDays;
            this.updateDriverTotal();
        }
    },

    updateTotal() {
        if (!this.state.selectedCar) return;
        const total = this.state.days * Number(this.state.selectedCar.price_per_day || this.state.selectedCar.price || 0);
        this.state.totalPrice = total;

        const priceEl = document.getElementById('modal-total-price');
        const daysEl = document.getElementById('calc-days-text');

        if (priceEl) priceEl.innerText = this.formatMoney(total);
        if (daysEl) daysEl.innerText = this.state.days;
    },

    updateDriverTotal() {
        const total = this.state.driverDays * this.CONFIG.DRIVER_PRICE_PER_DAY;
        this.state.currentPaymentAmount = total;

        const totalEl = document.getElementById('dr-total');
        const daysEl = document.getElementById('dr-days-text');

        if (totalEl) totalEl.innerText = this.formatMoney(total);
        if (daysEl) daysEl.innerText = this.state.driverDays;
    },

    // ============================================================
    // 8. XỬ LÝ BOOKING (Gửi Sheet & Mở QR)
    // ============================================================
 // 1. XỬ LÝ ĐẶT XE (Đã sửa để Admin nhận được đơn)
    async handleBooking() {
        // Kiểm tra điều khoản
        if (!document.getElementById('agree-contract')?.checked) return alert("⚠️ Vui lòng đồng ý điều khoản!");

        // Lấy thông tin từ form
        const fullname = document.getElementById('cust-fullname').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const cccd = document.getElementById('cust-cccd').value.trim();
        const location = document.getElementById('cust-location')?.value || "Tại Gara";
        const startDate = document.getElementById('modal-start-date')?.value;
        const endDate = document.getElementById('modal-end-date')?.value;

        // Validate
        if (!fullname || !phone || !cccd || !startDate || !endDate) return alert("⚠️ Vui lòng điền đầy đủ thông tin!");

        // Dữ liệu dùng cho Google Sheet (Giữ nguyên cấu trúc cũ của bạn)
        const orderData = {
            carName: this.state.selectedCar.name,
            custName: fullname,
            phone: phone,
            cccd: cccd,
            startDate: startDate,
            endDate: endDate,
            duration: this.state.days + " ngày",
            totalPrice: this.formatMoney(this.state.totalPrice),
            location: location
        };

        // --- [QUAN TRỌNG] THÊM ĐOẠN NÀY ĐỂ GỬI VỀ ADMIN ---
        const adminOrder = {
            id: 'DH' + Math.floor(Math.random() * 10000),
            customerName: fullname,   // Admin cần key là customerName
            customerPhone: phone,
            carName: this.state.selectedCar.name,
            date: `${startDate} -> ${endDate}`,
            totalPrice: this.formatMoney(this.state.totalPrice),
            status: 'pending',        // Trạng thái chờ duyệt
            createdAt: new Date().toISOString()
        };

        // Lưu vào LocalStorage cho Admin thấy
        const currentOrders = JSON.parse(localStorage.getItem('tranghy_orders')) || [];
        currentOrders.push(adminOrder);
        localStorage.setItem('tranghy_orders', JSON.stringify(currentOrders));
        // ----------------------------------------------------

        // Gửi Google Sheet (Giữ nguyên)
        this.sendToSheet(orderData);
        
        // Cập nhật giao diện tạm thời (Nếu bạn vẫn muốn dùng hàm cũ này)
        if(typeof this.addOrderToLocal === 'function') {
             this.addOrderToLocal({
                customer: fullname,
                product: orderData.carName,
                range: `${startDate} ➔ ${endDate}`,
                status: "Chờ duyệt"
            });
        }

        // Mở QR Thanh toán (Giữ nguyên)
        const memo = `THUE ${this.state.selectedCar.name.substring(0,10)} ${phone}`;
        this.generatePaymentQR(this.state.totalPrice, memo, 'xe');

        this.closeCar();
    },

  // 2. XỬ LÝ ĐẶT TÀI XẾ (Đã sửa để Admin nhận được đơn)
    async handleDriverBooking() {
        if (!document.getElementById('agree-contract-driver')?.checked) return alert("⚠️ Vui lòng đồng ý điều khoản!");

        const fullname = document.getElementById('dr-cust-fullname').value.trim();
        const phone = document.getElementById('dr-cust-phone').value.trim();
        const cccd = document.getElementById('dr-cust-cccd').value.trim();
        const startDate = document.getElementById('dr-start-date').value;
        const endDate = document.getElementById('dr-end-date').value;

        if (!fullname || !phone || !cccd || !startDate || !endDate) return alert("⚠️ Vui lòng nhập đầy đủ thông tin!");

        // Dữ liệu Google Sheet (Giữ nguyên)
        const orderData = {
            carName: "TÀI XẾ: " + this.state.selectedDriver.name,
            custName: fullname,
            phone: phone,
            cccd: cccd,
            startDate: startDate,
            endDate: endDate,
            totalPrice: this.formatMoney(this.state.currentPaymentAmount),
            location: "Dịch vụ Tài xế riêng"
        };

        // --- [QUAN TRỌNG] THÊM ĐOẠN NÀY ĐỂ GỬI VỀ ADMIN ---
        const adminOrder = {
            id: 'TX' + Math.floor(Math.random() * 10000), // Mã đơn TX
            customerName: fullname,
            customerPhone: phone,
            carName: "Tài xế: " + this.state.selectedDriver.name,
            date: `${startDate} -> ${endDate}`,
            totalPrice: this.formatMoney(this.state.currentPaymentAmount),
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        const currentOrders = JSON.parse(localStorage.getItem('tranghy_orders')) || [];
        currentOrders.push(adminOrder);
        localStorage.setItem('tranghy_orders', JSON.stringify(currentOrders));
        // -----------------------------------------------------------

        // Gửi Sheet (Giữ nguyên)
        this.sendToSheet(orderData);
        
        // Cập nhật giao diện tạm (Giữ nguyên nếu bạn dùng)
        if(typeof this.addOrderToLocal === 'function') {
            this.addOrderToLocal({
                customer: fullname,
                product: orderData.carName,
                range: `${startDate} ➔ ${endDate}`,
                status: "Chờ duyệt"
            });
        }

        // Mở QR Thanh toán (Giữ nguyên)
        const memo = `TAIXE ${this.state.selectedDriver.name.substring(0,5)} ${phone}`;
        this.generatePaymentQR(this.state.currentPaymentAmount, memo, 'taixe');

        this.closeDriver();
    },
    sendToSheet(data) {
        fetch(this.CONFIG.SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(err => console.error("Lỗi gửi đơn:", err));
    },

    addOrderToLocal(data) {
        const adminList = document.getElementById('admin-order-list');
        const driverList = document.getElementById('driver-order-list');

        if (adminList) {
            const adminRow = `
                <tr class="hover:bg-blue-50/50 border-b border-slate-50 animate-pulse">
                    <td class="px-8 py-5"><p class="font-black text-slate-900 text-sm italic">${data.customer}</p></td>
                    <td class="px-8 py-5 font-black text-blue-600 text-xs uppercase italic">${data.product}</td>
                    <td class="px-8 py-5 text-xs font-black text-slate-500 italic">${data.range}</td>
                    <td class="px-8 py-4"><span class="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">${data.status}</span></td>
                </tr>`;
            adminList.insertAdjacentHTML('afterbegin', adminRow);
        }

        if (driverList) {
            const driverCard = `
                <div class="p-6 bg-white rounded-3xl border-2 border-orange-400 shadow-xl animate-bounce">
                    <div class="flex justify-between mb-2"><span class="bg-orange-400 text-white px-2 py-1 rounded text-[9px] font-black uppercase">Đơn mới phân công</span></div>
                    <h5 class="text-lg font-black text-slate-900 uppercase italic leading-tight">${data.product}</h5>
                    <p class="text-[11px] text-slate-500 font-bold uppercase mt-2">Khách: ${data.customer}</p>
                    <p class="text-[10px] text-blue-600 font-black italic mt-1">Lịch: ${data.range}</p>
                </div>`;
            driverList.insertAdjacentHTML('afterbegin', driverCard);
        }
    },

    // ============================================================
    // 9. THANH TOÁN & HỢP ĐỒNG (Đã tích hợp Logic)
    // ============================================================
    generatePaymentQR(amount, memo, type) {
        const bank = this.CONFIG;
        const url = `https://img.vietqr.io/image/${bank.BANK_ID}-${bank.ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(bank.ACCOUNT_NAME)}`;

        document.getElementById('qr-code').src = url;
        document.getElementById('payment-final-amount').innerText = this.formatMoney(amount);

        this.toggleModal('payment-modal', true);

        // CLONE NÚT ĐỂ XÓA EVENT CŨ TRÁNH LỖI DUPLICATE
        const oldBtn = document.getElementById('btn-confirm-payment');
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);

        newBtn.onclick = async () => {
            if (this.state.isLoading) return;
            this.state.isLoading = true;
            newBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

            try {
                // Gọi hàm tạo hợp đồng nội bộ
                await this.processContractAndZalo(type);

                alert("🎉 CẢM ƠN QUÝ KHÁCH!\nHợp đồng đang được tải xuống. Hệ thống đang chuyển hướng tới Zalo...");
                this.closePay();

                if (this.state.selectedCar) this.state.selectedCar.status = 'busy';
                if (this.state.selectedDriver) this.state.selectedDriver.status = 'busy';
                this.renderAll();
            } catch (err) {
                console.error("Lỗi:", err);
                alert("Có lỗi khi tạo hợp đồng. Vui lòng kiểm tra lại!");
            } finally {
                this.state.isLoading = false;
                newBtn.innerHTML = 'ĐÃ CHUYỂN KHOẢN';
            }
        };
    },

    // HÀM TẠO HỢP ĐỒNG PDF & ZALO (Nâng cấp CORS & Scope)
    async processContractAndZalo(type) {
        // Lấy dữ liệu tùy theo loại (Xe hay Tài xế)
        const nameId = type === 'xe' ? 'cust-fullname' : 'dr-cust-fullname';
        const phoneId = type === 'xe' ? 'cust-phone' : 'dr-cust-phone';
        const totalId = type === 'xe' ? 'modal-total-price' : 'dr-total';

        const name = document.getElementById(nameId).value;
        const phone = document.getElementById(phoneId).value;
        const total = document.getElementById(totalId).innerText;

        if (!name || !phone) return;

        // HTML Hợp đồng
        const contractHtml = `
            <div id="pdf-template" style="width: 794px; padding: 60px; background: white; font-family: 'Arial', sans-serif; color: #333; position: relative;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h4 style="margin: 0; text-transform: uppercase;">Cộng hòa xã hội chủ nghĩa Việt Nam</h4>
                    <p style="margin: 5px 0;">Độc lập - Tự do - Hạnh phúc</p>
                    <div style="width: 150px; height: 1px; background: black; margin: 0 auto;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                    <div>
                        <h2 style="color: #1e40af; margin: 0;">TRANGHY AUTOCAR</h2>
                        <p style="font-size: 12px;">Số: ${Date.now()}/HĐ-TH</p>
                    </div>
                </div>
                <h1 style="text-align: center; color: #1e40af; font-size: 24px;">HỢP ĐỒNG ĐIỆN TỬ</h1>
                <div style="margin-top: 30px;">
                    <p><strong>BÊN A:</strong> TRANGHY AUTOCAR (Ông Bùi Văn Trang)</p>
                    <p><strong>BÊN B:</strong> ${name.toUpperCase()} - SĐT: ${phone}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr style="background: #f3f4f6;">
                        <th style="border: 1px solid #ddd; padding: 12px;">Nội dung</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Thành tiền</th>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">${type === 'xe' ? 'Thuê phương tiện' : 'Thuê tài xế'}</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold; color: #1e40af;">${total}</td>
                    </tr>
                </table>
                <div style="margin-top: 40px; text-align: center; width: 200px; margin-left: auto;">
                    <p><strong>ĐÃ THANH TOÁN</strong></p>
                    <div style="margin-top: 10px; border: 2px dashed #059669; color: #059669; padding: 5px; font-weight: bold;">XÁC NHẬN</div>
                </div>
            </div>`;

        // Render PDF
        const element = document.createElement('div');
        element.innerHTML = contractHtml;
        element.style.position = 'fixed';
        element.style.left = '-9999px';
        document.body.appendChild(element);

        try {
            // Quan trọng: useCORS để load ảnh
            const canvas = await html2canvas(element.querySelector('#pdf-template'), { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`HopDong_TrangHy_${phone}.pdf`);
        } catch (e) {
            console.error("PDF Error:", e);
        } finally {
            document.body.removeChild(element);
        }

        // Mở Zalo
        window.open(`https://zalo.me/0353979614?text=Toi la ${name}, da thanh toan ${total} va nhan Hop dong dien tu.`, '_blank');
    },

    // ============================================================
    // 10. CÁC HÀM HỖ TRỢ KHÁC
    // ============================================================
    formatMoney(amount) {
        return parseInt(amount || 0).toLocaleString('vi-VN') + "đ";
    },

    async subscribeNewsletter() {
        const emailInput = document.getElementById('newsletter-email');
        if (!emailInput || !emailInput.value) return alert("Vui lòng nhập email!");
        alert("🎉 Đã đăng ký nhận tin thành công!");
        emailInput.value = "";
    },

    async fetchInitialData() {
        try {
            const savedCars = localStorage.getItem('tranghy_cars');
            const savedDrivers = localStorage.getItem('drivers_data');
            const [carsRes, driversRes] = await Promise.all([
                fetch('/api/cars').catch(() => null),
                fetch('/api/drivers').catch(() => null)
            ]);

            this.state.cars = carsRes ? await carsRes.json() : (savedCars ? JSON.parse(savedCars) : this.getFallbackCars());
            this.state.drivers = driversRes ? await driversRes.json() : (savedDrivers ? JSON.parse(savedDrivers) : this.getFallbackDrivers());

            this.state.filteredCars = [...this.state.cars];
            this.renderAll();
        } catch (error) {
            this.state.cars = this.getFallbackCars();
            this.state.drivers = this.getFallbackDrivers();
            this.renderAll();
        }
    },

    renderAll() {
        const dash = document.getElementById('admin-dashboard');
        if (dash) {
            dash.innerHTML = `
                <span class="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-bold">${this.state.cars.filter(c => c.status !== 'busy').length} XE SẴN SÀNG</span>
                <span class="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold">${this.state.drivers.filter(d => d.status !== 'busy').length} TÀI XẾ</span>`;
        }
        this.renderCars();
        this.renderDriversHome();
    },

    getFallbackDrivers: () => [
        { id: 101, name: "Nguyễn Văn Long", experience: 10, status: 'available', bio: "Tài xế điềm đạm, rành đường đi tỉnh." },
        { id: 102, name: "Trần Thế Vinh", experience: 8, status: 'available', bio: "Vui vẻ, nhiệt tình, hỗ trợ bê đồ." },
        { id: 103, name: "Lê Minh Tú", experience: 5, status: 'busy', bio: "Chuyên chạy xe 7 chỗ gia đình." }
    ],
    getFallbackCars: () => [
        { id: 1, name: "Toyota Vios 2024", price: 800000, status: 'available', seats: 4, image_url: "https://images.unsplash.com/photo-1590362891991-f776e747a588" },
        { id: 2, name: "Mazda 3 Premium", price: 1200000, status: 'available', seats: 4, image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341" },
        { id: 3, name: "Hyundai SantaFe", price: 1500000, status: 'busy', seats: 7, image_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf" }
    ]
};

document.addEventListener('DOMContentLoaded', () => app.init());