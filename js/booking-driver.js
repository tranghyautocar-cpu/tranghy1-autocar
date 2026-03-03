
const BookingDriver = {
    // 1. CẤU HÌNH (Đồng bộ với phần thuê xe)
    settings: {
        driverFeePerDay: 500000,
        BANK_ID: "MB",
        ACCOUNT_NO: "0353979614",
        ACCOUNT_NAME: "BUI VAN TRANG",
        ZALO_URL: "https://zalo.me/0353979614",
        scriptUrl: 'https://script.google.com/macros/s/AKfycbzDi9Cjw1E6cINUdmTn15HpQ3Cebb49fp9PKjJKzgGKzfXs3DQ5dVVwPjLF2YZ5XYlp/exec'
    },
    
    state: {
        driverDays: 1,
        currentPaymentAmount: 500000,
        tempOrderData: null,
        isLoading: false
    },

    // 2. KHỞI TẠO
    init: function() {
        console.log("BookingDriver System Initialized...");
        this.updateDriverTotal();
    },

    // 3. TÍNH TOÁN NGÀY CHUẨN
    calculateDriverDays: function() {
        const startInput = document.getElementById('dr-start-date');
        const endInput = document.getElementById('dr-end-date');
        
        if (!startInput || !endInput) return;

        const start = startInput._flatpickr?.selectedDates[0];
        const end = endInput._flatpickr?.selectedDates[0];
        
        if (start && end) {
            if (end < start) {
                this.showToast("Ngày kết thúc không hợp lệ!", "error");
                endInput._flatpickr.clear();
                return;
            }
            
            // Tính số ngày (22 đến 24 là 3 ngày)
            const diffTime = Math.abs(end - start);
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            this.state.driverDays = diffDays;
            this.updateDriverTotal();
        }
    },

    // 4. CẬP NHẬT UI TIỀN TỆ
    updateDriverTotal: function() {
        const total = this.state.driverDays * this.settings.driverFeePerDay;
        this.state.currentPaymentAmount = total;

        const totalEl = document.getElementById('dr-total');
        const daysEl = document.getElementById('dr-days-text');

        if (totalEl) {
            totalEl.style.opacity = '0.5';
            totalEl.innerText = this.formatCurrency(total);
            setTimeout(() => totalEl.style.opacity = '1', 100);
        }
        if (daysEl) daysEl.innerText = this.state.driverDays;
    },

    // 5. XỬ LÝ ĐẶT HÀNG & HIỆN QR
    handleBooking: async function(e) {
        if (e) e.preventDefault();
        
        // Thu thập dữ liệu
        const formData = {
            custName: document.getElementById('cust-name').value.trim(),
            phone: document.getElementById('cust-phone').value.trim(),
            cccd: document.getElementById('cust-cccd').value.trim(),
            startDate: document.getElementById('dr-start-date').value,
            endDate: document.getElementById('dr-end-date').value,
            driverType: document.getElementById('driver-pref').value,
            totalPrice: this.formatCurrency(this.state.currentPaymentAmount),
            carName: "DỊCH VỤ TÀI XẾ: " + document.getElementById('driver-pref').value,
            orderType: "DRIVER_ONLY"
        };

        // Kiểm tra thông tin
        if (!formData.custName || !formData.phone || !formData.startDate || !formData.endDate) {
            this.showToast("Vui lòng điền đầy đủ thông tin!", "warning");
            return;
        }

        this.state.tempOrderData = formData;

        // Hiển thị Loading
        Swal.fire({
            title: 'Đang xử lý đơn hàng...',
            html: 'Vui lòng chờ trong giây lát',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            // Gửi dữ liệu tới Google Sheets
            await fetch(this.settings.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            // Lưu vào Admin LocalStorage (giống phần thuê xe)
            this.saveToAdmin(formData);

            // HIỆN MODAL THANH TOÁN QR
            this.showPaymentModal();

        } catch (error) {
            console.error(error);
            Swal.fire("Lỗi hệ thống", "Không thể gửi đơn hàng. Vui lòng thử lại!", "error");
        }
    },

    // 6. HIỆN MODAL THANH TOÁN GIỐNG THUÊ XE
    showPaymentModal: function() {
        const amount = this.state.currentPaymentAmount;
        const phone = this.state.tempOrderData.phone;
        const memo = `TX ${phone} ${this.state.driverDays}ngay`.toUpperCase();
        
        const qrUrl = `https://img.vietqr.io/image/${this.settings.BANK_ID}-${this.settings.ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(this.settings.ACCOUNT_NAME)}`;

        Swal.fire({
            title: 'XÁC NHẬN THANH TOÁN',
            html: `
                <div style="text-align: center;">
                    <p style="color: #555; margin-bottom: 15px;">Quý khách vui lòng chuyển khoản để hoàn tất đặt tài xế</p>
                    <img src="${qrUrl}" style="width: 100%; max-width: 280px; border: 1px solid #eee; border-radius: 12px; margin-bottom: 15px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; text-align: left; font-size: 0.9rem;">
                        <p><b>Số tiền:</b> <span style="color: #d32f2f; font-size: 1.1rem;">${this.formatCurrency(amount)}</span></p>
                        <p><b>Nội dung:</b> <span style="color: #007bff;">${memo}</span></p>
                        <p><b>Ngân hàng:</b> ${this.settings.BANK_ID} - ${this.settings.ACCOUNT_NO}</p>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'ĐÃ CHUYỂN KHOẢN',
            cancelButtonText: 'ĐÓNG',
            confirmButtonColor: '#007bff',
            reverseButtons: true,
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'ĐANG XÁC THỰC',
                    text: 'Hệ thống đang kiểm tra giao dịch và chuyển hướng tới Zalo...',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                setTimeout(() => {
                    window.location.href = this.settings.ZALO_URL;
                }, 2000);
            }
        });
    },

    // 7. CÁC HÀM PHỤ TRỢ
    saveToAdmin: function(data) {
        const adminOrder = {
            id: 'TX' + Math.floor(Math.random() * 10000),
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
    },

    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + " VNĐ";
    },

    showToast: function(msg, icon) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ title: msg, icon: icon, timer: 2000, showConfirmButton: false });
        } else {
            alert(msg);
        }
    },

    // Hàm in hợp đồng (Giữ nguyên từ bản trước)
    printDriverContract: function() {
        const data = this.state.tempOrderData;
        if (!data) return this.showToast("Vui lòng 'Xác nhận đặt' trước!", "info");
        // ... (Giữ nguyên logic window.open như code của bạn)
    }
};

// Khởi tạo hệ thống
document.addEventListener('DOMContentLoaded', () => BookingDriver.init());
window.BookingDriver = BookingDriver;