
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const PORT = 5000; // Đổi sang 5000 để tránh trùng với React (3000)

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- 1. KHỞI TẠO DATABASE ---
const dbDir = path.join(__dirname, 'backend', 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'rental.db');
const db = new sqlite3.Database(dbPath);

// Hàm helper để dùng async/await cho Database
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
});

// --- 2. KHỞI TẠO CẤU TRÚC BẢNG ---
db.serialize(() => {
    // Bảng xe
    db.run(`CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, category TEXT, transmission TEXT, 
        price_per_day REAL, image_url TEXT, status TEXT DEFAULT 'available', seats INTEGER
    )`);

    // Bảng tài xế
    db.run(`CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, phone TEXT, experience INTEGER, 
        status TEXT DEFAULT 'available', bio TEXT, price REAL DEFAULT 500000 
    )`);

    // MỚI: Bảng lưu đơn đặt hàng (Để Admin quản lý)
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT, item_id INTEGER, customer_name TEXT, 
        customer_phone TEXT, start_date TEXT, end_date TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Nạp dữ liệu mẫu (Chỉ nạp nếu bảng trống)
    db.get("SELECT count(*) as count FROM cars", (err, row) => {
        if (row && row.count === 0) {
            console.log(`🚚 Đang nạp xe mẫu...`);
            const carModels = [
                { name: "Toyota Vios", cat: "5 chỗ", price: 800000, img: "https://images.unsplash.com/photo-1590362891175-3794ec169ec5", seats: 5 },
                { name: "Mercedes S450", cat: "4 chỗ", price: 4000000, img: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8", seats: 4 },
                { name: "Ford Everest", cat: "7 chỗ", price: 1500000, img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf", seats: 7 }
            ];
            const stmt = db.prepare("INSERT INTO cars (name, category, transmission, price_per_day, image_url, status, seats) VALUES (?,?,?,?,?,?,?)");
            for (let i = 1; i <= 20; i++) {
                const m = carModels[i % carModels.length];
                stmt.run(`${m.name} v${i}`, m.cat, i % 2 === 0 ? "Tự động" : "Số sàn", m.price, m.img, "available", m.seats);
            }
            stmt.finalize();
        }
    });
});

// --- 3. API ENDPOINTS ---

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
        const rows = await dbAll(sql, params);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// LẤY DANH SÁCH TÀI XẾ
app.get('/api/drivers', async (req, res) => {
    try {
        const rows = await dbAll("SELECT * FROM drivers WHERE status = 'available'", []);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ĐẶT XE/TÀI XẾ (Đã sửa lỗi không lưu đơn hàng)
app.post('/api/bookings', async (req, res) => {
    const { type, id, customer, startDate, endDate } = req.body;

    if (!type || !id || !customer) {
        return res.status(400).json({ success: false, error: "Thiếu thông tin đặt chỗ!" });
    }

    try {
        const table = type === 'car' ? 'cars' : 'drivers';
        
        // 1. Cập nhật trạng thái bận
        const updateResult = await dbRun(`UPDATE ${table} SET status = 'busy' WHERE id = ? AND status = 'available'`, [id]);
        
        if (updateResult.changes === 0) {
            return res.status(400).json({ success: false, error: "Mục này đã bị người khác đặt hoặc không tồn tại" });
        }

        // 2. Lưu thông tin khách vào bảng bookings
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

// API Thống kê nhanh cho Admin
app.get('/api/health', async (req, res) => {
    try {
        const cars = await dbAll("SELECT COUNT(*) as count FROM cars WHERE status = 'available'");
        const drivers = await dbAll("SELECT COUNT(*) as count FROM drivers WHERE status = 'available'");
        const bookings = await dbAll("SELECT COUNT(*) as count FROM bookings");
        res.json({ 
            status: "Online", 
            available_cars: cars[0].count, 
            available_drivers: drivers[0].count,
            total_bookings: bookings[0].count 
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`🚀 Server TrangHy Autocar đang chạy tại: http://localhost:${PORT}`);
});