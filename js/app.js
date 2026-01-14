const app = {
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

    // Cấu hình hệ thống
    CONFIG: {
        BANK_ID: "MB",
        ACCOUNT_NO: "0353979614",
        ACCOUNT_NAME: "BUI VAN TRANG",
        DRIVER_PRICE_PER_DAY: 500000,
        SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzDi9Cjw1E6cINUdmTn15HpQ3Cebb49fp9PKjJKzgGKzfXs3DQ5dVVwPjLF2YZ5XYlp/exec'
    },

    // ============================================================
    // 1. KHỞI TẠO & SỰ KIỆN
    // ============================================================
    async init() {
        console.log("%c🚀 TrangHy Autocar: System Started", "color: #2563eb; font-weight: bold;");
        window.app = app;
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
    // 1. Đóng modal login (nếu có)
    this.closeLogin(); 
    
    // 2. Hiện container tổng của Dashboard
    const dashContainer = document.getElementById('dashboard-container');
    if (dashContainer) dashContainer.classList.remove('hidden');

    const adminView = document.getElementById('admin-view');
    const driverView = document.getElementById('driver-view');
    const roleText = document.getElementById('dash-role');

    // 3. Phân quyền hiển thị
    if (role === 'ADMIN') {
        if (roleText) roleText.innerText = "HỆ THỐNG QUẢN TRỊ";
        
        // Hiển thị view Admin, ẩn view Driver
        if (adminView) adminView.classList.remove('hidden');
        if (driverView) driverView.classList.add('hidden');
        
        // Cập nhật dữ liệu thực tế
        this.updateAdminStats();  // Cập nhật các con số (Tổng xe, doanh thu...)
        this.renderAdminOrders(); // Vẽ bảng đơn hàng
        this.renderAdminCars();   // Vẽ trạng thái xe
        this.renderAdminDrivers(); // Vẽ trạng thái tài xế
        
    } else if (role === 'DRIVER') {
        if (roleText) roleText.innerText = "GIAO DIỆN TÀI XẾ";
        
        // Hiển thị view Driver, ẩn view Admin
        if (driverView) driverView.classList.remove('hidden');
        if (adminView) adminView.classList.add('hidden');
        
        // Cập nhật dữ liệu cho tài xế
        this.renderDriverOrders(); // Vẽ lịch trình đón khách
    }
},
updateAdminStats: function() {
    // Đếm số lượng từ mảng dữ liệu hiện tại trong state
    const carCount = this.state.cars.length;
    const driverCount = this.state.drivers.length;
    const orderCount = this.state.bookings.length;

    // Cập nhật số liệu vào các thẻ (Đảm bảo ID trùng với HTML của bạn)
    const carElem = document.getElementById('total-cars-count');
    const driverElem = document.getElementById('total-drivers-count');
    const orderElem = document.getElementById('total-bookings-count');

    if(carElem) carElem.innerText = carCount;
    if(driverElem) driverElem.innerText = driverCount;
    if(orderElem) orderElem.innerText = orderCount;
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
 renderCars: function(data = null) {
    const container = document.getElementById('car-list');
    if (!container) return;

    // Ưu tiên lấy data truyền vào, nếu không có thì lấy từ state
    const displayData = data || this.state.cars;

    // Kiểm tra nếu vẫn không có dữ liệu
    if (!displayData || displayData.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-20">
                <p class='text-slate-400 font-bold'>Dữ liệu xe đang trống...</p>
                <p class='text-xs text-slate-500'>Vui lòng kiểm tra file cars.json hoặc kết nối mạng.</p>
            </div>`;
        return;
    }

    container.innerHTML = displayData.map(car => {
        const isBusy = car.status === 'busy' || car.status === 'Đang bận';
        const img = car.image_url || 'images/default-car.png'; 
        
        // Chuẩn hóa hiển thị số chỗ
        let seatDisplay = car.category || car.seats || '4';
        if (!String(seatDisplay).toLowerCase().includes('chỗ')) {
            seatDisplay += ' Chỗ';
        }

        const priceDisplay = new Intl.NumberFormat('vi-VN').format(car.price);

        return `
        <div class="car-card bg-white p-5 group relative shadow-sm rounded-[2rem] border border-slate-100 ${isBusy ? 'opacity-60 grayscale pointer-events-none' : 'cursor-pointer'}">
            <div class="relative overflow-hidden h-52 rounded-[1.5rem] mb-4">
                <img src="${img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                     onerror="this.src='https://via.placeholder.com/300?text=Xe+TrangHy'">
                <div class="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-blue-600">
                    ${seatDisplay}
                </div>
                ${isBusy ? '<div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold uppercase text-xs">ĐÃ ĐƯỢC THUÊ</div>' : ''}
            </div>
            <div class="space-y-2 px-2">
                <h3 class="text-xl font-black text-slate-900 italic uppercase tracking-tighter">${car.name}</h3>
                <div class="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
                    <div>
                        <p class="text-[9px] font-bold text-slate-400 uppercase">Giá thuê ngày</p>
                        <p class="text-xl font-black text-blue-600">${priceDisplay}đ</p>
                    </div>
                    <button onclick="app.openCar(${car.id})" 
                        class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/20">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
},
filterCars(seats) {
    if (seats === 'all') {
        this.renderCars(this.state.cars);
    } else {
        const filtered = this.state.cars.filter(car => 
            String(car.category || car.seats).includes(seats)
        );
        this.renderCars(filtered);
    }
},
 renderDriversHome() {
    const container = document.getElementById('display-drivers');
    if (!container) return;

    // Đảm bảo lấy đúng mảng drivers từ state
    const driversData = this.state.drivers || [];

    container.innerHTML = driversData.map(d => {
        // Chuẩn hóa kiểm tra trạng thái bận
        const status = String(d.status || '').toLowerCase();
        const isBusy = status === 'busy' || status === 'đang bận';
        
        const avatarChar = d.name ? d.name.trim().split(' ').pop().charAt(0) : '?';
        
        // Dùng dấu ngoặc đơn quanh ${d.id} để an toàn cho cả ID dạng số và chữ
        const clickAction = isBusy ? '' : `onclick="window.app.openDriverBooking('${d.id}')"`;
        const busyClass = isBusy ? 'opacity-60 grayscale pointer-events-none' : 'cursor-pointer';

        return `
        <div class="driver-card bg-white p-8 relative shadow-sm rounded-[2.5rem] border border-slate-100 transition-all hover:shadow-xl ${busyClass}">
            <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black italic shadow-lg">
                    ${avatarChar}
                </div>
                <div>
                    <h4 class="text-lg font-black italic text-slate-900 uppercase tracking-tighter">${d.name}</h4>
                    <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest">${d.experience || d.exp || 0}+ Năm kinh nghiệm</p>
                </div>
            </div>
            <p class="text-slate-500 text-xs font-medium mb-6 line-clamp-2 leading-relaxed italic border-l-2 border-slate-100 pl-3">
                ${d.bio || 'Tài xế chuyên nghiệp, tận tâm và giàu kinh nghiệm.'}
            </p>
            
            <button ${clickAction} 
                class="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300
                ${isBusy 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-200 active:scale-95'}">
                ${isBusy ? 'Hiện đang bận' : 'Liên hệ thuê ngay'}
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
    // 1. Ép kiểu cả 2 về String để đảm bảo luôn tìm thấy dù id là số hay chữ
    const driver = this.state.drivers.find(d => String(d.id) === String(id));
    
    if (!driver) {
        console.error("❌ Không tìm thấy tài xế với ID:", id);
        return;
    }

    // 2. Lưu tài xế đang chọn vào state
    this.state.selectedDriver = driver;

    // 3. Đổ dữ liệu an toàn vào giao diện (Dùng Optional Chaining để tránh lỗi name null)
    const avatarChar = driver.name ? driver.name.trim().split(' ').pop().charAt(0) : '?';
    
    const avatarEl = document.getElementById('dr-avatar');
    const nameEl = document.getElementById('dr-name');
    const expEl = document.getElementById('dr-exp'); // Thêm dòng này để hiện kinh nghiệm

    if (avatarEl) avatarEl.innerText = avatarChar;
    if (nameEl) nameEl.innerText = driver.name;
    if (expEl) expEl.innerText = `${driver.experience || driver.exp || 0} NĂM KINH NGHIỆM`;

    // 4. Reset ngày và tính toán giá mặc định
    if (document.getElementById('dr-start-date')) document.getElementById('dr-start-date').value = "";
    if (document.getElementById('dr-end-date')) document.getElementById('dr-end-date').value = "";

    // 5. Hiển thị Modal và cập nhật giá
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

    
    // --- 2. HÀM XỬ LÝ ĐẶT XE (ĐÃ CẬP NHẬT) ---
  saveBookingToLocal(id, type = 'car') {
        const key = type === 'driver' ? 'booked_driver_ids' : 'booked_car_ids';
        let bookedIDs = JSON.parse(localStorage.getItem(key)) || [];
        if (!bookedIDs.includes(id)) {
            bookedIDs.push(id);
            localStorage.setItem(key, JSON.stringify(bookedIDs));
        }
    },

    // Hàm in hợp đồng Tài xế (PDF)
    printDriverContract() {
        const data = this.state.tempOrderData;
        if (!data) return alert("⚠️ Không tìm thấy dữ liệu hợp đồng!");

        const content = `
            <html>
            <head><title>HỢP ĐỒNG THUÊ TÀI XẾ</title></head>
            <body style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px;">
                    <h2 style="margin: 0;">HỢP ĐỒNG THUÊ TÀI XẾ RIÊNG</h2>
                    <p style="margin: 5px 0;">Mã đơn: #TX${Math.floor(Math.random()*10000)}</p>
                </div>
                <div style="margin-top: 30px;">
                    <p><strong>BÊN A (KHÁCH HÀNG):</strong> ${data.custName}</p>
                    <p>Số điện thoại: ${data.phone}</p>
                    <p>CCCD/CMND: ${data.cccd}</p>
                    <hr style="border-top: 1px dashed #ccc;">
                    <p><strong>BÊN B (DỊCH VỤ):</strong> TrangHy Autocar</p>
                    <p>Tài xế phụ trách: <strong>${data.carName.replace('TÀI XẾ: ', '')}</strong></p>
                </div>
                <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border: 1px solid #ddd;">
                    <p>Thời gian bắt đầu: ${data.startDate}</p>
                    <p>Thời gian kết thúc: ${data.endDate}</p>
                    <p style="font-size: 18px; color: #d32f2f; font-weight: bold;">TỔNG CHI PHÍ: ${data.totalPrice}</p>
                </div>
                <div style="margin-top: 50px; text-align: right;">
                    <p><i>Ngày......tháng......năm......</i></p>
                    <p><strong>ĐẠI DIỆN TRANGHY AUTOCAR</strong></p>
                    <p style="color: red; margin-top: 40px;">[Đã Ký Duyệt Điện Tử]</p>
                </div>
            </body>
            </html>`;
            
        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write(content);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    },

    // Hàm Xác nhận thanh toán (Cầu nối để hiện PDF)
    verifyPayment() {
        alert("✅ Xác nhận thanh toán thành công! Đang xuất hợp đồng...");
        const modal = document.getElementById('payment-modal');
        if (modal) modal.classList.add('hidden');
        
        // Kiểm tra xem là in hợp đồng xe hay tài xế
        if (this.state.paymentType === 'taixe') {
            this.printDriverContract();
        } else if (typeof this.printContract === 'function') {
            this.printContract(); // Hàm in xe cũ (nếu có)
        }
    },
    async handleBooking() {
    // 1. Kiểm tra đồng ý điều khoản
    if (!document.getElementById('agree-contract')?.checked) return alert("⚠️ Vui lòng đồng ý điều khoản!");

    // 2. Lấy giá trị từ các trường nhập liệu
    const fullname = document.getElementById('cust-fullname').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const cccd = document.getElementById('cust-cccd').value.trim();
    const location = document.getElementById('cust-location')?.value || "Tại Gara";
    const startDate = document.getElementById('modal-start-date')?.value;
    const endDate = document.getElementById('modal-end-date')?.value;
    
    // Lấy thông tin file ảnh và trạng thái thuê tài xế để kiểm soát
    const fileInput = document.getElementById('cust-license-img');
    const isDriverSelected = document.getElementById('driver-toggle')?.checked;

    // 3. Kiểm tra thông tin cơ bản
    if (!fullname || !phone || !cccd || !startDate || !endDate) return alert("⚠️ Vui lòng điền đầy đủ thông tin!");

    // --- PHẦN THÊM MỚI: KIỂM SOÁT BẰNG LÁI ---
    // Nếu KHÔNG thuê tài xế (tức là tự lái) thì BẮT BUỘC phải có ảnh bằng lái
    if (!isDriverSelected && (!fileInput.files || fileInput.files.length === 0)) {
        return alert("⚠️ Vì quý khách chọn tự lái, vui lòng tải lên ảnh Bằng lái xe (B1/B2) để xác thực!");
    }
    // ------------------------------------------

    // 4. Gom dữ liệu đơn hàng cho User/Sheet
    const orderData = {
        carName: this.state.selectedCar.name,
        custName: fullname,
        phone: phone,
        cccd: cccd,
        startDate: startDate,
        endDate: endDate,
        duration: this.state.days + " ngày",
        totalPrice: this.formatMoney(this.state.totalPrice),
        location: location,
        type: isDriverSelected ? "Thuê kèm tài xế" : "Tự lái", // Thêm loại hình
        licenseStatus: fileInput.files.length > 0 ? "Đã đính kèm ảnh" : "N/A" // Trạng thái ảnh
    };

    // 5. Gom dữ liệu cho Admin (Local Storage)
    const adminOrder = {
        id: 'DH' + Math.floor(Math.random() * 10000),
        customerName: fullname,
        customerPhone: phone,
        carName: this.state.selectedCar.name,
        date: `${startDate} -> ${endDate}`,
        totalPrice: this.formatMoney(this.state.totalPrice),
        status: 'pending',
        createdAt: new Date().toISOString(),
        bookingType: isDriverSelected ? "Có tài" : "Tự lái" // Giúp Admin phân loại nhanh
    };

    const currentOrders = JSON.parse(localStorage.getItem('tranghy_orders')) || [];
    currentOrders.push(adminOrder);
    localStorage.setItem('tranghy_orders', JSON.stringify(currentOrders));

    // 6. Gửi dữ liệu đi
    this.sendToSheet(orderData);
    
    if(typeof this.addOrderToLocal === 'function') {
         this.addOrderToLocal({
            customer: fullname,
            product: orderData.carName,
            range: `${startDate} ➔ ${endDate}`,
            status: "Chờ duyệt"
        });
    }

    // 7. Mở QR Thanh toán (Giữ nguyên)
    const memo = `THUE ${this.state.selectedCar.name.substring(0,10)} ${phone}`;
    this.generatePaymentQR(this.state.totalPrice, memo, 'xe');

    this.closeCar();
},
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

        this.sendToSheet(orderData);
        if(typeof this.addOrderToLocal === 'function') {
            this.addOrderToLocal({
                customer: fullname,
                product: orderData.carName,
                range: `${startDate} ➔ ${endDate}`,
                status: "Chờ duyệt"
            });

        }
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
    // 1. Lấy dữ liệu tùy theo loại (Xe hay Tài xế)
    const nameId = type === 'xe' ? 'cust-fullname' : 'dr-cust-fullname';
    const phoneId = type === 'xe' ? 'cust-phone' : 'dr-cust-phone';
    const totalId = type === 'xe' ? 'modal-total-price' : 'dr-total';
    const startId = type === 'xe' ? 'modal-start-date' : 'dr-start-date';
    const endId = type === 'xe' ? 'modal-end-date' : 'dr-end-date';

    const name = document.getElementById(nameId).value;
    const phone = document.getElementById(phoneId).value;
    const total = document.getElementById(totalId).innerText;
    const startDate = document.getElementById(startId).value;
    const endDate = document.getElementById(endId).value;
    const carName = type === 'xe' ? (this.state.selectedCar?.name || "Phương tiện tự lái") : "Dịch vụ Tài xế";

    if (!name || !phone || !startDate || !endDate) {
        alert("Thiếu thông tin để tạo hợp đồng!");
        return;
    }

        // HTML Hợp đồng
   const contractHtml = `
    <div id="pdf-template" style="width: 794px; padding: 50px 60px; background: white; font-family: 'Times New Roman', serif; color: #1a1a1a; line-height: 1.6; position: relative;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h4 style="margin: 0; text-transform: uppercase; font-size: 13px; letter-spacing: 1px;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
            <p style="margin: 5px 0; font-weight: bold; font-size: 14px;">Độc lập - Tự do - Hạnh phúc</p>
            <div style="width: 160px; height: 1.5px; background: #000; margin: 5px auto;"></div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">
            <div>
                <h2 style="color: #1e40af; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TRANGHY AUTOCAR</h2>
                <p style="font-size: 11px; margin: 2px 0; color: #666;">Dịch vụ cho thuê xe chuyên nghiệp & Uy tín</p>
            </div>
            <div style="text-align: right;">
                <p style="font-size: 12px; margin: 0;">Số: <strong>${Date.now()}/HĐTX-TH</strong></p>
                <p style="font-size: 12px; margin: 0;">Ngày lập: ${new Date().toLocaleDateString('vi-VN')}</p>
            </div>
        </div>

        <h1 style="text-align: center; color: #1e40af; font-size: 20px; text-transform: uppercase; margin-bottom: 30px; letter-spacing: 1px;">HỢP ĐỒNG CHO THUÊ DỊCH VỤ VẬN TẢI ĐIỆN TỬ</h1>

        <div style="font-style: italic; font-size: 12px; margin-bottom: 20px; color: #444;">
            <p style="margin: 2px 0;">- Căn cứ Bộ luật Dân sự số 91/2015/QH13 và các văn bản hướng dẫn thi hành;</p>
            <p style="margin: 2px 0;">- Căn cứ Luật Thương mại số 36/2005/QH11;</p>
            <p style="margin: 2px 0;">- Căn cứ nhu cầu và khả năng của hai bên.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <div style="border-left: 3px solid #1e40af; padding-left: 15px;">
                <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 5px; color: #1e40af;">BÊN A (Bên cho thuê)</p>
                <p style="margin: 3px 0; font-size: 13px;">Đại diện: <strong>Ông Bùi Văn Tráng</strong></p>
                <p style="margin: 3px 0; font-size: 13px;">Địa chỉ: TP Hưng Yên, Tỉnh Hưng Yên</p>
                <p style="margin: 3px 0; font-size: 13px;">Hotline: 0353.979.614</p>
            </div>
            <div style="border-left: 3px solid #059669; padding-left: 15px;">
                <p style="font-weight: bold; text-transform: uppercase; margin-bottom: 5px; color: #059669;">BÊN B (Bên thuê)</p>
                <p style="margin: 3px 0; font-size: 13px;">Khách hàng: <strong>${name.toUpperCase()}</strong></p>
                <p style="margin: 3px 0; font-size: 13px;">Điện thoại: ${phone}</p>
                <p style="margin: 3px 0; font-size: 13px;">Dịch vụ: ${type === 'xe' ? 'Thuê phương tiện tự lái' : 'Thuê tài xế chuyên nghiệp'}</p>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
            <thead>
                <tr style="background: #1e40af; color: white;">
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Mô tả chi tiết</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Ngày nhận</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Ngày trả</th>
                    <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 12px;">
                        <strong>${type === 'xe' ? 'Phương tiện: ' + carName : 'Dịch vụ: Tài xế riêng'}</strong><br>
                        <span style="font-size: 11px; color: #666;">Xác nhận qua hệ thống Tranghy Autocar</span>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${startDate}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${endDate}</td>
                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold; color: #1e40af;">${total}</td>
                </tr>
                <tr style="background: #f9fafb;">
                    <td colspan="3" style="border: 1px solid #ddd; padding: 10px; text-align: right; font-weight: bold;">TỔNG THANH TOÁN:</td>
                    <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-weight: bold; color: #b91c1c; font-size: 15px;">${total}</td>
                </tr>
            </tbody>
        </table>

        <div style="margin-top: 25px; font-size: 12px; background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <p style="font-weight: bold; text-decoration: underline; margin-bottom: 8px; color: #1e40af;">ĐIỀU KHOẢN VÀ CAM KẾT CHUNG:</p>
            <ol style="padding-left: 18px; margin: 0; space-y: 5px;">
                <li><strong>Trách nhiệm Bên B:</strong> Đảm bảo sử dụng phương tiện đúng mục đích, tuân thủ Luật giao thông đường bộ. Chịu hoàn toàn trách nhiệm dân sự/hình sự nếu phát sinh vi phạm trong thời gian thuê.</li>
                <li><strong>Trách nhiệm Bên A:</strong> Cung cấp phương tiện/dịch vụ đúng tiêu chuẩn chất lượng và thời gian đã thỏa thuận.</li>
                <li><strong>Giá trị pháp lý:</strong> Hợp đồng này là hợp đồng điện tử có giá trị pháp lý tương đương văn bản giấy theo Luật Giao dịch điện tử. Dữ liệu thanh toán được lưu vết trên hệ thống ngân hàng và máy chủ Tranghy Autocar.</li>
            </ol>
        </div>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="text-align: center; width: 220px;">
                <p style="font-size: 12px; font-weight: bold; text-transform: uppercase;">ĐẠI DIỆN BÊN B</p>
                <p style="margin-top: 50px; font-size: 13px; font-weight: bold;">${name.toUpperCase()}</p>
                <p style="font-size: 11px; color: #059669; font-style: italic;">(Đã xác thực điện tử qua số điện thoại: ${phone})</p>
            </div>
            <div style="text-align: center; width: 220px; position: relative;">
                <p style="font-size: 12px; font-weight: bold; text-transform: uppercase;">ĐẠI DIỆN BÊN A</p>
                
                <div style="margin: 10px auto; border: 3px double #b91c1c; color: #b91c1c; padding: 8px; font-weight: bold; transform: rotate(-10deg); width: fit-content; border-radius: 5px; background: rgba(185, 28, 28, 0.05);">
                    <p style="margin: 0; font-size: 14px;">TRANGHY AUTOCAR</p>
                    <p style="margin: 0; font-size: 12px;">ĐÃ THANH TOÁN</p>
                    <p style="margin: 0; font-size: 9px;">${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</p>
                </div>
                
                <p style="font-size: 13px; font-weight: bold; color: #1e40af;">BÙI VĂN TRÁNG</p>
            </div>
        </div>

        <div style="position: absolute; bottom: 20px; left: 0; width: 100%; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            Hợp đồng này được tạo tự động bởi hệ thống Tranghy Autocar - Bảo mật và an toàn 100%
        </div>
    </div>`;
   const element = document.createElement('div');
   element.innerHTML = contractHtml;
   document.body.appendChild(element);
  try {
    // 1. Kiểm tra xem thư viện đã sẵn sàng chưa
    if (typeof html2canvas === 'undefined') {
        throw new Error("Thiếu thư viện html2canvas. Hãy thêm vào file HTML.");
    }

    const template = element.querySelector('#pdf-template');
    if (!template) throw new Error("Không tìm thấy mẫu hợp đồng");

    // 2. Chụp ảnh vùng hợp đồng
    const canvas = await html2canvas(template, { 
        scale: 2, 
        useCORS: true,
        logging: false 
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // 3. Khởi tạo PDF (Sửa lỗi jspdf ở đây)
const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF; 

if (!jsPDF) {
    throw new Error("Không tìm thấy thư viện jsPDF. Vui lòng kiểm tra lại kết nối mạng!");}
const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`HopDong_TrangHy_${phone}.pdf`);
    
} catch (e) {
    console.error("PDF Error chi tiết:", e);
    alert("Lỗi: " + e.message); // Hiển thị lỗi thật để bạn dễ sửa
} finally {
    if (element && element.parentNode) {
        document.body.removeChild(element);
    }
}
const message = `Chào TrangHy Autocar, tôi là ${name}. Tôi đã thanh toán ${total} cho đơn hàng và vừa nhận hợp đồng điện tử.`;

// Mở Zalo với nội dung đã được mã hóa chuẩn URL
window.open(`https://zalo.me/0353979614?text=${encodeURIComponent(message)}`, '_blank');
},
    formatMoney(amount) {
        return parseInt(amount || 0).toLocaleString('vi-VN') + "đ";
    },
async subscribeNewsletter() {
    const emailInput = document.getElementById('newsletter-email');
    
    // 1. Kiểm tra xem ô input có tồn tại không
    if (!emailInput) return;

    const email = emailInput.value.trim();

    // 2. Kiểm tra bỏ trống
    if (!email) {
        alert("⚠️ Vui lòng nhập địa chỉ email của bạn!");
        return;
    }

    // 3. Kiểm tra định dạng email hợp lệ (có dấu @ và tên miền)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("⚠️ Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại!");
        return;
    }

    // 4. Thông báo thành công
    alert("🎉 Cảm ơn bạn! TrangHy Autocar đã ghi nhận email: " + email);
    
    // 5. Xóa trống ô nhập để sẵn sàng cho lần sau
    emailInput.value = "";
},
async fetchInitialData() {
    this.state.isLoading = true;
    console.log("📂 Đang đồng bộ hóa dữ liệu từ hệ thống...");

    try {
        // 1. Tải song song cả 2 file để tối ưu tốc độ
        const [resCars, resDrivers] = await Promise.all([
            fetch('cars.json').catch(() => ({ ok: false })),
            fetch('drivers.json').catch(() => ({ ok: false }))
        ]);

        // 2. Xử lý dữ liệu Xe
        if (resCars.ok) {
            this.state.cars = await resCars.json();
            console.log("✅ Đã tải cars.json");
        } else {
            this.state.cars = this.getFallbackCars();
            console.warn("⚠️ Dùng dữ liệu xe dự phòng");
        }

        // 3. Xử lý dữ liệu Tài xế (Sửa lỗi bỏ quên file JSON của bạn)
        if (resDrivers.ok) {
            this.state.drivers = await resDrivers.json();
            console.log("✅ Đã tải drivers.json");
        } else {
            this.state.drivers = this.getFallbackDrivers();
            console.warn("⚠️ Dùng dữ liệu tài xế dự phòng");
        }

        // 4. Xử lý đơn hàng an toàn
        try {
            const rawOrders = localStorage.getItem('tranghy_orders');
            this.state.bookings = rawOrders ? JSON.parse(rawOrders) : [];
        } catch (e) {
            this.state.bookings = [];
            console.error("Lỗi dữ liệu LocalStorage");
        }

        console.log(`🚀 System Ready: ${this.state.cars.length} Xe | ${this.state.drivers.length} Tài xế`);

        // 5. Hiển thị dữ liệu lên UI
        this.renderAll();
        
        // 6. Cập nhật Dashboard (Gửi state vào để hàm Dashboard xử lý chính xác)
        if (typeof updateDashboard === 'function') {
            updateDashboard(this.state);
        }

    } catch (error) {
        console.error("❌ Lỗi khởi tạo nghiêm trọng:", error);
        // Chế độ cứu hộ: Đảm bảo web vẫn hiện được gì đó
        this.state.cars = this.getFallbackCars();
        this.state.drivers = this.getFallbackDrivers();
        this.renderAll();
    } finally {
        this.state.isLoading = false;
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
    if (typeof this.updateAdminStats === 'function') {
        this.updateAdminStats();
    }
},
 // Đổi tên thành getFallbackDrivers để khớp với hàm fetchInitialData
    getFallbackDrivers() { 
        return Array.from({ length: 20 }, (_, i) => ({
            id: 100 + i,
            name: `Tài xế ${["Nguyễn", "Trần", "Lê", "Phạm", "Vũ"][i % 5]} ${["Văn", "Thành", "Minh", "Quốc", "Đình"][i % 5]} ${["Hùng", "Hải", "Nam", "Tâm", "Bảo", "Dũng", "Sơn", "Tùng"][i % 8]}`,
            experience: 5 + (i % 15),
            rating: (4.5 + (Math.random() * 0.5)).toFixed(1),
            status: "Sẵn sàng", 
            image_url: `https://i.pravatar.cc/150?u=${i}`,
            bio: "Tài xế chuyên nghiệp, tận tâm, rành đường đi tỉnh và nội thành."
        }));
    },
   getFallbackCars: () => 
    [
    { id: 1, name: "Toyota Camry 2024", category: "5", price: 1200000, status: "Sẵn sàng", image_url: "images/toyota2024.jpg", desc: "Sedan hạng D sang trọng." },
    { id: 2, name: "VinFast VF8", category: "5", price: 1500000, status: "Sẵn sàng", image_url: "images/vinvf8.jpg", desc: "Xe điện thông minh." },
    { id: 3, name: "Hyundai SantaFe", category: "7", price: 1800000, status: "Sẵn sàng", image_url: "images/santafe.jpg", desc: "SUV 7 chỗ gia đình." },
    { id: 4, name: "Kia Morning", category: "4", price: 600000, status: "Sẵn sàng", image_url: "images/kiamoning.jpg", desc: "Nhỏ gọn, tiết kiệm." },
    { id: 5, name: "Mazda 3", category: "5", price: 950000, status: "Sẵn sàng", image_url: "images/mazda3.jpg", desc: "Thiết kế trẻ trung." },
    { id: 6, name: "Mitsubishi Xpander", category: "7", price: 1000000, status: "Sẵn sàng", image_url: "images/xpander.jpg", desc: "Xe 7 chỗ quốc dân." },
    { id: 7, name: "Mercedes C200", category: "5", price: 2800000, status: "Sẵn sàng", image_url: "images/e200.jpg", desc: "Xe sang đi sự kiện." },
    { id: 8, name: "Ford Everest", category: "7", price: 2200000, status: "Sẵn sàng", image_url: "images/foreverret.jpg", desc: "SUV mạnh mẽ." },
    { id: 9, name: "Honda City", category: "5", price: 800000, status: "Sẵn sàng", image_url: "images/hondaciti.jpg", desc: "Bền bỉ, rộng rãi." },
    { id: 10, name: "Kia Carnival", category: "7", price: 3500000, status: "Sẵn sàng", image_url: "images/kia_carnival.jpg", desc: "Chuyên cơ mặt đất." },
    { id: 11, name: "Hyundai Accent", category: "5", price: 750000, status: "Sẵn sàng", image_url: "images/huyndai_acen.jpg", desc: "Lựa chọn kinh tế." },
    { id: 12, name: "BMW 320i", category: "5", price: 3200000, status: "Sẵn sàng", image_url: "images/bmw_320i.jpg", desc: "Đẳng cấp thể thao." },
    { id: 13, name: "Toyota Fortuner", category: "7", price: 1700000, status: "Sẵn sàng", image_url: "images/toyota_fortune.jpg", desc: "SUV đa dụng." },
    { id: 14, name: "VinFast VF9", category: "7", price: 2500000, status: "Sẵn sàng", image_url: "images/vin_vf9.jpg", desc: "SUV điện hạng sang." },
    { id: 15, name: "Kia Soluto", category: "4", price: 550000, status: "Sẵn sàng", image_url: "images/kia_soluto.jpg", desc: "Giá rẻ bất ngờ." },
    { id: 16, name: "Toyota Vios", category: "5", price: 700000, status: "Sẵn sàng", image_url: "images/vios_2025.jpg", desc: "Xe chạy phố bền bỉ." },
    { id: 17, name: "Mazda CX-5", category: "5", price: 1300000, status: "Sẵn sàng", image_url: "images/cx5.jpg", desc: "SUV 5 chỗ thời thượng." },
    { id: 18, name: "Hyundai Tucson", category: "5", price: 1250000, status: "Sẵn sàng", image_url: "images/tucson.jpg", desc: "Thiết kế phá cách." },
    { id: 19, name: "Toyota Innova", category: "7", price: 1100000, status: "Sẵn sàng", image_url: "images/toyota_2024.jpg", desc: "Xe điện trẻ trung, năng động." },
    { id: 21, name: "Kia K3", category: "5", price: 900000, status: "Sẵn sàng", image_url: "images/kia_k3.jpg", desc: "Sedan công nghệ ngập tràn." },
    { id: 22, name: "Honda CR-V", category: "7", price: 1600000, status: "Sẵn sàng", image_url: "images/cr-v.jpg", desc: "An toàn tuyệt đối." },
    { id: 23, name: "Hyundai i10", category: "4", price: 500000, status: "Sẵn sàng", image_url: "images/hyun_i10.jpg", desc: "Giá thuê tối ưu nhất." },
    { id: 24, name: "Mercedes E300", category: "5", price: 4500000, status: "Sẵn sàng", image_url: "images/mercedes_e300.jpg", desc: "Đỉnh cao xe hạng sang." },
    { id: 25, name: "Ford Ranger", category: "5", price: 1400000, status: "Sẵn sàng", image_url: "images/foer_ranger.jpg", desc: "Bán tải đa dụng." }
]
};
document.addEventListener('DOMContentLoaded', () => app.init());

async function loadDriversToUI() {
    const grid = document.getElementById('driver-grid');
    
    // Nếu không tìm thấy chỗ hiển thị (ví dụ đang ở trang khác) thì dừng lại
    if (!grid) return; 

    try {
        // 1. Gọi file drivers.json
        const response = await fetch('drivers.json');
        
        // Kiểm tra xem file có tồn tại không
        if (!response.ok) {
            throw new Error("Không tìm thấy file drivers.json");
        }

        const drivers = await response.json();

        // 2. Tạo HTML cho từng tài xế
        let htmlContent = '';
        
        drivers.forEach(driver => {
            // Format tiền (500000 -> 500.000)
            const priceFormatted = new Intl.NumberFormat('vi-VN').format(driver.price);

            htmlContent += `
            <div class="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-blue-500 transition-all group relative overflow-hidden">
                <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full blur-3xl opacity-10 -mr-10 -mt-10 transition-opacity group-hover:opacity-20"></div>

                <div class="flex items-center gap-4 mb-4 relative z-10">
                    <div class="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                        ${driver.avatar}
                    </div>
                    <div>
                        <h3 class="font-bold text-white text-lg leading-tight">${driver.name}</h3>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] font-bold bg-blue-900 text-blue-300 px-2 py-0.5 rounded uppercase">
                                ${driver.exp} KN
                            </span>
                            <span class="text-xs text-slate-400">
                                <i class="fas fa-star text-yellow-500"></i> 4.9
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-2 mb-6 border-t border-slate-700 pt-4">
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-400">Số điện thoại</span>
                        <span class="text-white font-bold">${driver.phone}</span>
                    </div>
                     <div class="flex justify-between text-sm">
                        <span class="text-slate-400">Giá thuê/ngày</span>
                        <span class="text-green-400 font-bold">${priceFormatted}đ</span>
                    </div>
                </div>
                
               <button onclick="app.openDriverBooking($'{driver.id}')" 
        class="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-900/50 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all">
        LIÊN HỆ THUÊ NGAY
    </button>
            </div>
            `;
        });

        // 3. Đổ HTML vào trang web
        grid.innerHTML = htmlContent;

    } catch (error) {
        console.error("Lỗi:", error);
        grid.innerHTML = `<div class="col-span-4 text-center p-10">
            <p class="text-red-500 font-bold mb-2">⚠️ Không tải được danh sách tài xế!</p>
            <p class="text-slate-500 text-sm">Vui lòng kiểm tra lại file drivers.json</p>
        </div>`;
    }
}

// CHẠY HÀM NÀY KHI TRANG WEB TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    loadDriversToUI();
    // ... các hàm khác của bạn ...
});