const express = require('express');
const cors = require('cors');
const path = require('path');

// --- 1. KẾT NỐI DATABASE (QUAN TRỌNG NHẤT) ---
// Dòng này trỏ đúng vào file db.js nằm trong thư mục backend/database
// Nó sẽ tự động kích hoạt file đó để tạo bảng và nạp dữ liệu
const db = require('../database/db'); 

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Cấu hình để thư mục public hiển thị được ảnh
app.use(express.static('public'));

// --- HÀM HỖ TRỢ (Promise wrapper) ---
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
});

// --- 2. API ENDPOINTS ---

// LẤY DANH SÁCH XE
app.get('/api/cars', async (req, res) => {
    try {
        const { category } = req.query;
        let sql = "SELECT * FROM cars"; 
        let params = [];
        if (category && category !== 'All') {
            sql += " WHERE category = ?";
            params.push(category);
        }
        // Sắp xếp xe theo tên cho đẹp
        sql += " ORDER BY id ASC";
        
        const rows = await dbAll(sql, params);
        res.json(rows);
    } catch (e) { 
        console.error("Lỗi lấy xe:", e);
        res.status(500).json({ error: e.message }); 
    }
});

// LẤY DANH SÁCH TÀI XẾ
app.get('/api/drivers', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM drivers WHERE status = 'available'");
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ĐẶT XE/TÀI XẾ (NÂNG CẤP: DÙNG TRANSACTION AN TOÀN)
app.post('/api/bookings', async (req, res) => {
    const { type, id, customer, startDate, endDate } = req.body;

    if (!type || !id || !customer) {
        return res.status(400).json({ success: false, error: "Thiếu thông tin đặt chỗ!" });
    }

    try {
        // Bắt đầu giao dịch (Khóa database lại để xử lý an toàn)
        await dbRun("BEGIN TRANSACTION");

        const table = type === 'car' ? 'cars' : 'drivers';
        
        // 1. Cố gắng cập nhật trạng thái
        const updateResult = await dbRun(
            `UPDATE ${table} SET status = 'busy' WHERE id = ? AND status = 'available'`, 
            [id]
        );
        
        // Nếu không update được (do xe đã bị người khác nhanh tay đặt trước)
        if (updateResult.changes === 0) {
            await dbRun("ROLLBACK"); // Hủy giao dịch
            return res.status(400).json({ success: false, error: "Rất tiếc, mục này vừa bị người khác đặt mất rồi!" });
        }

        // 2. Lưu đơn hàng
        await dbRun(
            `INSERT INTO bookings (type, item_id, customer_name, customer_phone, start_date, end_date) VALUES (?,?,?,?,?,?)`,
            [type, id, customer.name, customer.phone, startDate, endDate]
        );

        // Mọi thứ ổn -> Chốt giao dịch
        await dbRun("COMMIT");

        console.log(`\n📢 Đơn hàng mới: ${customer.name} - ${type.toUpperCase()} #${id}`);
        res.json({ success: true, message: "Đặt chỗ thành công!" });

    } catch (e) {
        await dbRun("ROLLBACK"); // Có lỗi -> Hoàn tác mọi thứ
        console.error("Lỗi đặt xe:", e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ADMIN HEALTH CHECK
app.get('/api/health', async (req, res) => {
    try {
        const cars = await dbAll("SELECT COUNT(*) as count FROM cars WHERE status = 'available'");
        const drivers = await dbAll("SELECT COUNT(*) as count FROM drivers WHERE status = 'available'");
        
        // Kiểm tra an toàn xem bảng booking đã có chưa
        let bookingCount = 0;
        try {
            const bookings = await dbAll("SELECT COUNT(*) as count FROM bookings");
            bookingCount = bookings[0].count;
        } catch (err) {}

        res.json({ 
            status: "Online", 
            available_cars: cars[0].count, 
            available_drivers: drivers[0].count,
            total_bookings: bookingCount 
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`🔗 Đã kết nối Database tại: backend/database/db.js`);
    console.log(`--------------------------------------------------`);
});