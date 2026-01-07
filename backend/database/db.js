const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// --- CẤU HÌNH ĐƯỜNG DẪN CHUẨN ---
// File DB sẽ nằm cùng thư mục với file db.js này
const dbPath = path.join(__dirname, 'rental_MOI.db');
const db = new sqlite3.Database(dbPath);

// --- NÂNG CẤP 1: BẬT CHẾ ĐỘ WAL (Tăng tốc độ & Tránh khóa file) ---
db.run('PRAGMA journal_mode = WAL;', (err) => {
    if (err) console.error("⚠️ Không thể bật chế độ WAL:", err.message);
    else console.log("🚀 Đã bật chế độ WAL: Database chạy nhanh và ổn định hơn.");
});

// Hàm thực thi query (Promise)
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

// Hàm lấy dữ liệu (Promise)
const getQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

async function initDatabase() {
    console.log("🛠️  Hệ thống TrangHy Autocar đang kiểm tra dữ liệu...");

    try {
        const TARGET_CAR_COUNT = 25; 
        const shouldReset = true; // True = Luôn làm mới dữ liệu xe để cập nhật ảnh

        // --- BƯỚC 1: BẢNG XE (CARS) ---
        if (shouldReset) {
            await runQuery("DROP TABLE IF EXISTS cars");
        }

        await runQuery(`CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, category TEXT, transmission TEXT, 
            price_per_day REAL, image_url TEXT, seats INTEGER, 
            location_id TEXT, status TEXT DEFAULT 'available'
        )`);

        const carCheck = await getQuery("SELECT count(*) as count FROM cars");
        
        if (carCheck.count !== TARGET_CAR_COUNT) {
            console.log(`♻️  Đang tái tạo ${TARGET_CAR_COUNT} xe chuẩn...`);
            if (!shouldReset) await runQuery("DELETE FROM cars");

            const carModels = [
                { name: "Mercedes S450 Luxury", cat: "4 chỗ", price: 4000000, img: "images/e300.jpg", seats: 4 },
                { name: "Toyota Vios 2025",     cat: "5 chỗ", price: 800000,  img: "images/vios_2025.jpg", seats: 5 },
                { name: "Ford Everest Bi-Turbo",cat: "7 chỗ", price: 1500000, img: "images/foreverret.jpg", seats: 7 },
                { name: "Hyundai Accent",       cat: "5 chỗ", price: 700000,  img: "images/huyndai_acen.jpg", seats: 5 },
                { name: "VinFast VF9 Plus",     cat: "7 chỗ", price: 2500000, img: "images/vin_vf9.jpg", seats: 7 }
            ];

            for (let i = 1; i <= TARGET_CAR_COUNT; i++) {
                const m = carModels[(i - 1) % carModels.length];
                await runQuery(`INSERT INTO cars (name, category, transmission, price_per_day, image_url, seats, location_id, status) 
                                VALUES (?,?,?,?,?,?,?,?)`, 
                                [`${m.name} #${i}`, m.cat, i % 2 === 0 ? "Tự động" : "Số sàn", m.price, m.img, m.seats, "HungYen", "available"]);
            }
        }

        // --- BƯỚC 2: BẢNG TÀI XẾ (DRIVERS) ---
        await runQuery(`CREATE TABLE IF NOT EXISTS drivers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, phone TEXT, age INTEGER, experience INTEGER, 
            price_per_day REAL, bio TEXT, status TEXT DEFAULT 'available'
        )`);

        const driverCheck = await getQuery("SELECT count(*) as count FROM drivers");
        
        if (driverCheck.count !== 30) {
            console.log(`♻️  Cập nhật danh sách 30 tài xế...`);
            await runQuery("DELETE FROM drivers"); // Xóa cũ nạp mới cho nhanh

            const fNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi"];
            const mNames = ["Văn", "Đình", "Quốc", "Minh", "Thành", "Hữu"];
            const lNames = ["Hùng", "Nam", "Đức", "Tùng", "Thắng", "Tuấn", "Sơn", "Hải"];
            const bios = [
                "Chuyên lái xe đường dài, nhiệt tình, chu đáo.",
                "Am hiểu mọi cung đường du lịch, phục vụ tận tâm.",
                "Lái xe an toàn, lịch sự, phong cách phục vụ VIP."
            ];

            for (let i = 1; i <= 30; i++) {
                const fullName = `${fNames[(i-1)%8]} ${mNames[(i-1)%6]} ${lNames[(i-1)%8]}`;
                const age = 28 + (i % 22);
                await runQuery(`INSERT INTO drivers (name, phone, age, experience, price_per_day, bio, status) 
                                VALUES (?,?,?,?,?,?,?)`,
                                [fullName, `09${Math.floor(10000000 + Math.random() * 90000000)}`, age, age - 22, 500000, bios[i%3], "available"]);
            }
        }

        // --- NÂNG CẤP 2: THÊM BẢNG BOOKINGS (QUAN TRỌNG) ---
        // Nếu không có bảng này, chức năng "Đặt xe" sẽ gây lỗi server
        await runQuery(`CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,          -- 'car' hoặc 'driver'
            item_id INTEGER,    -- ID của xe hoặc tài xế
            customer_name TEXT, 
            customer_phone TEXT, 
            start_date TEXT, 
            end_date TEXT, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        console.log("✅ Database đã sẵn sàng: Cars, Drivers & Bookings.");

    } catch (err) {
        console.error("❌ Lỗi Database:", err);
    }
}

initDatabase();
module.exports = db;