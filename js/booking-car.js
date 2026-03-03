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
        ZALO_URL: "https://zalo.me/0353979614",
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
            disableMobile: true
        };

        if (window.flatpickr) {
            flatpickr("#pickup-date", { 
                ...commonOptions, 
                onChange: () => this.calculateTotal() 
            });
            flatpickr("#return-date", { 
                ...commonOptions, 
                onChange: () => this.calculateTotal() 
            });
            // Thêm lịch cho ngày sinh nếu có field
            if (document.getElementById('cust-dob')) {
                flatpickr("#cust-dob", { ...commonOptions, minDate: null, maxDate: "today" });
            }
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
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error("Lỗi fetch data:", error);
        }
    },

    // 6. HIỂN THỊ GIAO DIỆN CHI TIẾT
    renderCarDetail() {
        const car = this.state.selectedCar;
        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setText('car-name', car.name);
        setText('car-price', this.formatMoney(car.price));
        setText('spec-fuel', car.fuel || "Xăng");
        setText('spec-transmission', car.transmission || "Tự động");
        setText('spec-engine', car.engine || "N/A");
        setText('spec-seats', car.category || "5 chỗ");

        const imgEl = document.getElementById('car-img');
        if (imgEl) imgEl.src = car.image_url;

        const featuresContainer = document.getElementById('features-list');
        if (featuresContainer && car.features) {
            featuresContainer.innerHTML = car.features.map(f => 
                `<span class="feature-tag"><i class="fa-solid fa-circle-check"></i> ${f}</span>`
            ).join('');
        }
    },

    // 7. GẮN SỰ KIỆN
    bindEvents() {
        document.getElementById('with-driver')?.addEventListener('change', () => this.calculateTotal());
        
        const form = document.getElementById('rental-form');
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBooking();
        });
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

            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
            this.state.days = diffDays;

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
        const formattedPrice = this.formatMoney(total);
        const elIds = {
            'total-price': `${formattedPrice} (cho ${days} ngày)`,
            'modal-total-price': formattedPrice,
            'calc-days-text': days
        };

        for (const [id, val] of Object.entries(elIds)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        }
    },

    // 9. XỬ LÝ ĐẶT XE
    async handleBooking() {
        if (this.state.isLoading) return;

        const agreeCheck = document.getElementById('agree-contract');
        if (agreeCheck && !agreeCheck.checked) return alert("⚠️ Vui lòng đồng ý điều khoản!");

        const getValue = (id) => document.getElementById(id)?.value.trim();
        
        const fullname = getValue('cust-fullname');
        const phone = getValue('cust-phone');
        const cccd = getValue('cust-cccd');
        const startDate = getValue('pickup-date');
        const endDate = getValue('return-date');
        const isDriverSelected = document.getElementById('with-driver')?.checked;

        if (!fullname || !phone || !startDate || !endDate) {
            return alert("⚠️ Vui lòng điền đầy đủ thông tin nhận xe!");
        }

        // Kiểm tra ảnh bằng lái chỉ khi Tự lái
        const fileInput = document.getElementById('license-upload');
        if (!isDriverSelected && (!fileInput?.files || fileInput.files.length === 0)) {
            return alert("⚠️ Vì quý khách chọn tự lái, vui lòng tải lên ảnh Bằng lái xe!");
        }

        this.state.isLoading = true;
        
        const orderData = {
            ThoiGian: new Date().toLocaleString('vi-VN'),
            carName: this.state.selectedCar.name,
            custName: fullname,
            phone: phone,
            cccd: cccd || "N/A",
            startDate: startDate,
            endDate: endDate,
            totalPrice: this.state.totalPrice,
            location: getValue('cust-location') || "Tại Gara",
            status: "Chờ duyệt",
            licenseNo: getValue('cust-gplx') || (isDriverSelected ? "Có tài xế" : "N/A"),
            licenseRank: getValue('cust-rank') || "N/A",
            dob: getValue('cust-dob') || "N/A"
        };

        // Gửi dữ liệu đồng thời
        try {
            this.saveToAdmin(orderData);
            await this.sendToSheet(orderData); // Sử dụng await để đợi kết quả nếu cần
            
            const memo = `THUE ${this.state.selectedCar.name.substring(0,10).toUpperCase()} ${phone}`;
            this.generatePaymentQR(this.state.totalPrice, memo);
        } catch (err) {
            alert("Lỗi khi gửi đơn hàng, vui lòng thử lại!");
            this.state.isLoading = false;
        }
    },

    // 10. HỆ THỐNG THANH TOÁN
    generatePaymentQR(amount, memo) {
        const bank = this.CONFIG;
        const url = `https://img.vietqr.io/image/${bank.BANK_ID}-${bank.ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(bank.ACCOUNT_NAME)}`;

        const qrImg = document.getElementById('qr-code');
        if (qrImg) qrImg.src = url;

        const finalAmountEl = document.getElementById('payment-final-amount');
        if (finalAmountEl) finalAmountEl.innerText = this.formatMoney(amount);

        // Hiển thị Modal hoặc thông báo
        if (typeof this.toggleModal === 'function') {
            this.toggleModal('payment-modal', true);
        } else {
            document.getElementById('payment-modal')?.classList.add('active'); // CSS dự phòng
        }

        // Cài đặt sự kiện nút xác nhận trong modal
        const confirmBtn = document.getElementById('btn-confirm-payment');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                alert("🎉 CẢM ƠN QUÝ KHÁCH!\nHệ thống đang chuyển hướng tới Zalo để xác nhận...");
                window.location.href = this.CONFIG.ZALO_URL;
            };
        }
    },

    // 11. CÁC HÀM BỔ TRỢ
    formatMoney(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount) + " VNĐ";
    },

    async sendToSheet(data) {
        // Sử dụng return để bên handleBooking có thể bắt lỗi
        return fetch(this.CONFIG.SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(data)
        }).catch(e => {
            console.error("Lỗi gửi Sheet:", e);
            throw e;
        });
    },

    saveToAdmin(data) {
        const adminOrder = {
            id: 'DH' + Math.floor(1000 + Math.random() * 9000),
            customerName: data.custName,
            customerPhone: data.phone,
            carName: data.carName,
            date: `${data.startDate} -> ${data.endDate}`,
            totalPrice: data.totalPrice,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        const currentOrders = JSON.parse(localStorage.getItem('tranghy_orders')) || [];
        currentOrders.push(adminOrder);
        localStorage.setItem('tranghy_orders', JSON.stringify(currentOrders));
    }
};

document.addEventListener('DOMContentLoaded', () => bookingApp.init());