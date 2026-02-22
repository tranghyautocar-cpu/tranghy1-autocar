const bookingApp = {
    // 1. TRẠNG THÁI HỆ THỐNG
    state: {
        selectedCar: null,
        days: 1,
        totalPrice: 0,
        isLoading: false
    },

    // 2. CẤU HÌNH
    CONFIG: {
        BANK_ID: "MB",
        ACCOUNT_NO: "0353979614",
        ACCOUNT_NAME: "BUI VAN TRANG",
        DRIVER_PRICE_PER_DAY: 500000,
        SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzDi9Cjw1E6cINUdmTn15HpQ3Cebb49fp9PKjJKzgGKzfXs3DQ5dVVwPjLF2YZ5XYlp/exec'
    },

    // 3. KHỞI TẠO HỆ THỐNG
    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const carId = urlParams.get('id');

        if (!carId) {
            alert("Không tìm thấy thông tin xe! Quay lại trang chủ.");
            window.location.href = 'index.html';
            return;
        }

        await this.loadCarData(carId);
        this.initDatePickers(); 
        this.bindEvents();
    },

    // 4. CÀI ĐẶT LỊCH (FLATPICKR)
    initDatePickers() {
        const commonOptions = { 
            minDate: "today", 
            dateFormat: "d/m/Y", 
            locale: "vn",
            disableMobile: "true"
        };

        if (typeof flatpickr !== 'undefined') {
            // Sử dụng ID pickup-date và return-date thống nhất
            flatpickr("#pickup-date", { 
                ...commonOptions, 
                onChange: () => this.calculateTotal() 
            });
            flatpickr("#return-date", { 
                ...commonOptions, 
                onChange: () => this.calculateTotal() 
            });
        } else {
            console.warn("Flatpickr chưa được tải.");
        }
    },

    // 5. XỬ LÝ DỮ LIỆU XE
    async loadCarData(id) {
        try {
            const response = await fetch('cars.json');
            const cars = await response.json();
            this.state.selectedCar = cars.find(c => String(c.id) === String(id));

            if (this.state.selectedCar) {
                this.renderCarDetail();
            } else {
                alert("Xe không tồn tại!");
            }
        } catch (error) {
            console.error("Lỗi fetch data:", error);
        }
    },

    // 6. HIỂN THỊ GIAO DIỆN CHI TIẾT
    renderCarDetail() {
        const car = this.state.selectedCar;
        document.getElementById('car-name').innerText = car.name;
        document.getElementById('car-img').src = car.image_url;
        document.getElementById('car-price').innerText = this.formatMoney(car.price);
        
        document.getElementById('spec-fuel').innerText = car.fuel || "Xăng";
        document.getElementById('spec-transmission').innerText = car.transmission || "Tự động";
        document.getElementById('spec-engine').innerText = car.engine || "N/A";
        document.getElementById('spec-seats').innerText = car.category || "5 chỗ";

        const featuresContainer = document.getElementById('features-list');
        if (car.features) {
            featuresContainer.innerHTML = car.features.map(f => 
                `<span class="feature-tag"><i class="fa-solid fa-circle-check"></i> ${f}</span>`
            ).join('');
        }
    },

    // 7. GẮN SỰ KIỆN
    bindEvents() {
        // Sự kiện khi thay đổi tùy chọn tài xế
        const driverCheckbox = document.getElementById('with-driver');
        if (driverCheckbox) {
            driverCheckbox.addEventListener('change', () => this.calculateTotal());
        }

        // Sự kiện gửi form đặt xe
        const form = document.getElementById('rental-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBooking();
            });
        }
    },

    // 8. LOGIC TÍNH TOÁN TỔNG TIỀN
    calculateTotal() {
        const start = document.getElementById('pickup-date')._flatpickr?.selectedDates[0];
        const end = document.getElementById('return-date')._flatpickr?.selectedDates[0];
        const isDriver = document.getElementById('with-driver')?.checked;

        if (start && end) {
            if (end < start) {
                alert("⚠️ Ngày trả xe không được nhỏ hơn ngày nhận!");
                document.getElementById('return-date')._flatpickr.clear();
                return;
            }

            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            this.state.days = diffDays <= 0 ? 1 : diffDays;

            if (!this.state.selectedCar) return;

            const carPrice = Number(this.state.selectedCar.price_per_day || this.state.selectedCar.price || 0);
            let total = this.state.days * carPrice;

            if (isDriver) {
                total += (this.state.days * this.CONFIG.DRIVER_PRICE_PER_DAY);
            }

            this.state.totalPrice = total;
            this.updatePriceUI(total, this.state.days);
        }
    },

    updatePriceUI(total, days) {
        const priceEl = document.getElementById('total-price');
        const modalPriceEl = document.getElementById('modal-total-price');
        const daysEl = document.getElementById('calc-days-text');

        const formattedPrice = this.formatMoney(total);

        if (priceEl) priceEl.innerText = `${formattedPrice} (cho ${days} ngày)`;
        if (modalPriceEl) modalPriceEl.innerText = formattedPrice;
        if (daysEl) daysEl.innerText = days;
    },

    // 9. XỬ LÝ ĐẶT XE & THANH TOÁN
    async handleBooking() {
        // Kiểm tra đồng ý điều khoản
        const agreeCheck = document.getElementById('agree-contract');
        if (agreeCheck && !agreeCheck.checked) return alert("⚠️ Vui lòng đồng ý điều khoản!");

        // Lấy giá trị nhập liệu
        const fullname = document.getElementById('cust-fullname')?.value.trim();
        const phone = document.getElementById('cust-phone')?.value.trim();
        const cccd = document.getElementById('cust-cccd')?.value.trim();
        const location = document.getElementById('cust-location')?.value || "Tại Gara";
        const startDate = document.getElementById('pickup-date')?.value;
        const endDate = document.getElementById('return-date')?.value;
        
        const fileInput = document.getElementById('license-upload');
        const isDriverSelected = document.getElementById('with-driver')?.checked;

        // Kiểm tra thông tin cơ bản
        if (!fullname || !phone || !cccd || !startDate || !endDate) {
            return alert("⚠️ Vui lòng điền đầy đủ thông tin!");
        }

        // Kiểm soát bằng lái: Nếu tự lái (isDriverSelected = false) thì bắt buộc có ảnh
        if (!isDriverSelected && (!fileInput.files || fileInput.files.length === 0)) {
            return alert("⚠️ Vì quý khách chọn tự lái, vui lòng tải lên ảnh Bằng lái xe để xác thực!");
        }

        // Dữ liệu đơn hàng gửi đi
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
            type: isDriverSelected ? "Thuê kèm tài xế" : "Tự lái",
            licenseStatus: (fileInput.files && fileInput.files.length > 0) ? "Đã đính kèm ảnh" : "N/A"
        };

        // Lưu đơn cho Admin (LocalStorage)
        this.saveToAdmin(orderData);

        // Gửi tới Google Sheets
        this.sendToSheet(orderData);
        
        // Cập nhật trạng thái đơn hàng cục bộ nếu có hàm hỗ trợ
        if(typeof this.addOrderToLocal === 'function') {
             this.addOrderToLocal({
                customer: fullname,
                product: orderData.carName,
                range: `${startDate} ➔ ${endDate}`,
                status: "Chờ duyệt"
            });
        }

        // Tạo mã QR Thanh toán
        const memo = `THUE ${this.state.selectedCar.name.substring(0,10)} ${phone}`;
        this.generateQR(this.state.totalPrice, memo);

        // Đóng giao diện đặt xe nếu có hàm close
        if(typeof this.closeCar === 'function') this.closeCar();
    },

    // 10. CÁC HÀM BỔ TRỢ
    formatMoney(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount) + " VNĐ";
    },

    sendToSheet(data) {
        fetch(this.CONFIG.SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(data)
        }).catch(e => console.error("Lỗi gửi Sheet:", e));
    },

    saveToAdmin(data) {
        const adminOrder = {
            id: 'DH' + Math.floor(Math.random() * 10000),
            customerName: data.custName,
            customerPhone: data.phone,
            carName: data.carName,
            date: `${data.startDate} -> ${data.endDate}`,
            totalPrice: data.totalPrice,
            status: 'pending',
            createdAt: new Date().toISOString(),
            bookingType: data.type
        };
        const currentOrders = JSON.parse(localStorage.getItem('tranghy_orders')) || [];
        currentOrders.push(adminOrder);
        localStorage.setItem('tranghy_orders', JSON.stringify(currentOrders));
    },

    generateQR(amount, memo) {
        const bank = this.CONFIG;
        const qrUrl = `https://img.vietqr.io/image/${bank.BANK_ID}-${bank.ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(bank.ACCOUNT_NAME)}`;
        
        const confirmPay = confirm(`Hệ thống đã ghi nhận đơn hàng.\nTổng tiền: ${this.formatMoney(amount)}\nBạn có muốn xem mã QR để thanh toán ngay không?`);
        if(confirmPay) {
            window.open(qrUrl, '_blank');
        }
        alert("🎉 Đơn hàng đã được gửi! Chúng tôi sẽ liên hệ bạn sớm.");
    }
};

// Khởi chạy khi trang sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    bookingApp.init();
});