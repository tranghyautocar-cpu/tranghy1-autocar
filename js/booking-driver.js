const BookingDriver = {
    settings: {
        driverFeePerDay: 500000,
        scriptUrl: 'https://script.google.com/macros/s/AKfycbzDi9Cjw1E6cINUdmTn15HpQ3Cebb49fp9PKjJKzgGKzfXs3DQ5dVVwPjLF2YZ5XYlp/exec'
    },
    
    state: {
        driverDays: 1,
        currentPaymentAmount: 500000,
        tempOrderData: null
    },

    // 1. Khởi tạo và gắn sự kiện
    init: function() {
        console.log("BookingDriver System Initialized...");
        this.updateDriverTotal();
    },

    // 2. Tính toán ngày từ Flatpickr
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
            
            // Tính số ngày (bao gồm cả ngày bắt đầu và kết thúc)
            const diffTime = Math.abs(end - start);
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            this.state.driverDays = diffDays;
            this.updateDriverTotal();
        }
    },

    // 3. Cập nhật UI tiền tệ
    updateDriverTotal: function() {
        const total = this.state.driverDays * this.settings.driverFeePerDay;
        this.state.currentPaymentAmount = total;

        const totalEl = document.getElementById('dr-total');
        const daysEl = document.getElementById('dr-days-text');

        if (totalEl) {
            totalEl.style.opacity = '0';
            setTimeout(() => {
                totalEl.innerText = this.formatCurrency(total);
                totalEl.style.opacity = '1';
            }, 150);
        }
        if (daysEl) daysEl.innerText = this.state.driverDays;
    },

    // 4. Xử lý gửi đơn hàng (Nâng cấp Validation & UI)
    handleBooking: async function(e) {
        e.preventDefault();
        
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const originalText = btnSubmit.innerHTML;

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

        // Validation đơn giản
        if (!formData.custName || !formData.phone || !formData.startDate || !formData.endDate) {
            this.showToast("Vui lòng điền đầy đủ thông tin!", "warning");
            return;
        }

        try {
            // Trạng thái Loading
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<i class="fa fa-spinner fa-spin"></i> ĐANG GỬI...`;

            this.state.tempOrderData = formData;

            // Gửi dữ liệu
            await fetch(this.settings.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            // Thành công
            this.showToast("Đặt tài xế thành công! Chúng tôi sẽ liên hệ lại ngay.", "success");
            
        } catch (error) {
            console.error(error);
            this.showToast("Gửi yêu cầu thất bại. Vui lòng thử lại!", "error");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalText;
        }
    },

    // 5. In hợp đồng (Giao diện chuyên nghiệp)
    printDriverContract: function() {
        const data = this.state.tempOrderData;
        if (!data) {
            this.showToast("Vui lòng ấn 'Xác nhận đặt' trước khi in hợp đồng!", "info");
            return;
        }

        const printWindow = window.open('', '', 'height=900,width=850');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Hợp đồng - ${data.custName}</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; padding: 50px; line-height: 1.5; color: #000; }
                        .text-center { text-align: center; }
                        .header-title { font-size: 22px; font-weight: bold; text-transform: uppercase; }
                        .info-box { border: 1px solid #000; padding: 15px; margin: 20px 0; }
                        .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                        .stamp { color: red; border: 3px solid red; padding: 10px; font-weight: bold; transform: rotate(-15deg); display: inline-block; margin-top: 20px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="text-center">
                        <div class="header-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                        <div>Độc lập - Tự do - Hạnh phúc</div>
                        <hr width="30%">
                        <h2 style="margin-top:30px">HỢP ĐỒNG THUÊ TÀI XẾ RIÊNG</h2>
                        <p>Mã số: TX-${Date.now().toString().slice(-6)}</p>
                    </div>
                    
                    <div class="section">
                        <p><strong>BÊN A (KHÁCH HÀNG):</strong> ${data.custName}</p>
                        <p>Số điện thoại: ${data.phone} | CCCD: ${data.cccd}</p>
                        <p><strong>BÊN B (ĐƠN VỊ CUNG CẤP):</strong> TRANGHY AUTOCAR</p>
                    </div>

                    <div class="info-box">
                        <p>Loại dịch vụ: <strong>${data.driverType}</strong></p>
                        <p>Thời gian làm việc: Từ ngày ${data.startDate} đến ngày ${data.endDate}</p>
                        <p>Giá trị hợp đồng: <span style="font-size: 20px; color: red;">${data.totalPrice}</span></p>
                    </div>

                    <div class="footer">
                        <div class="text-center">
                            <p><strong>ĐẠI DIỆN BÊN A</strong></p>
                            <p style="margin-top:60px">(Ký và ghi rõ họ tên)</p>
                        </div>
                        <div class="text-center">
                            <p><strong>ĐẠI DIỆN BÊN B</strong></p>
                            <div class="stamp">TRANGHY AUTOCAR<br>ĐÃ XÁC NHẬN</div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 500);
    },

    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + " VNĐ";
    },

    showToast: function(msg, icon) {
        // Nếu bạn dùng SweetAlert2
        if (typeof Swal !== 'undefined') {
            Swal.fire({ title: msg, icon: icon, timer: 2500, showConfirmButton: false });
        } else {
            alert(msg);
        }
    }
};

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => BookingDriver.init());
window.BookingDriver = BookingDriver;