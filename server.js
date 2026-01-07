const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./backend/database/db'); 

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Cấu hình để thư mục public hiển thị được ảnh (QUAN TRỌNG)
app.use(express.static('public'));

// --- HÀM HỖ TRỢ (Giữ lại để API chạy mượt) ---
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
});

// --- 2. API ENDPOINTS (Giữ nguyên logic của bạn) ---

// API LẤY DANH SÁCH XE
app.get('/api/cars', async (req, res) => {
    try {
        const { category } = req.query;
        let sql = "SELECT * FROM cars"; 
        let params = [];
        if (category && category !== 'All') {
            sql += " WHERE category = ?";
            params.push(category);
        }
        const rows = await dbAll(sql, params);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// API LẤY DANH SÁCH TÀI XẾ
app.get('/api/drivers', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM drivers WHERE status = 'available'", []);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// API ĐẶT XE/TÀI XẾ
app.post('/api/bookings', async (req, res) => {
    const { type, id, customer, startDate, endDate } = req.body;

    if (!type || !id || !customer) {
        return res.status(400).json({ success: false, error: "Thiếu thông tin đặt chỗ!" });
    }

    try {
        const table = type === 'car' ? 'cars' : 'drivers';
        
        // Kiểm tra xe còn trống không
        const updateResult = await dbRun(`UPDATE ${table} SET status = 'busy' WHERE id = ? AND status = 'available'`, [id]);
        
        if (updateResult.changes === 0) {
            return res.status(400).json({ success: false, error: "Mục này đã bị người khác đặt hoặc không tồn tại" });
        }

        // Tạo bảng bookings nếu chưa có (Phòng hờ)
        await dbRun(`CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT, item_id INTEGER, customer_name TEXT, 
            customer_phone TEXT, start_date TEXT, end_date TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Lưu đơn hàng
        await dbRun(
            `INSERT INTO bookings (type, item_id, customer_name, customer_phone, start_date, end_date) VALUES (?,?,?,?,?,?)`,
            [type, id, customer.name, customer.phone, startDate, endDate]
        );

        console.log(`\n📢 Đơn hàng mới: ${customer.name} đã thuê ${type} (ID: ${id})`);
        res.json({ success: true, message: "Đặt chỗ thành công! Chúng tôi sẽ liên hệ sớm." });

    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// API ADMIN HEALTH CHECK
app.get('/api/health', async (req, res) => {
    try {
        const cars = await dbAll("SELECT COUNT(*) as count FROM cars WHERE status = 'available'");
        const drivers = await dbAll("SELECT COUNT(*) as count FROM drivers WHERE status = 'available'");
        
        // Kiểm tra bảng bookings có tồn tại không trước khi query
        let bookingCount = 0;
        try {
            const bookings = await dbAll("SELECT COUNT(*) as count FROM bookings");
            bookingCount = bookings[0].count;
        } catch (err) {
            // Nếu bảng chưa có thì count = 0, không báo lỗi
        }

        res.json({ 
            status: "Online", 
            available_cars: cars[0].count, 
            available_drivers: drivers[0].count,
            total_bookings: bookingCount 
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`🔗 Database đang dùng: rental_MOI.db (Load từ db.js)`);
});