const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'rental.db');
const db = new sqlite3.Database(dbPath);

// Hàm thực thi query trả về Promise
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

// Hàm lấy dữ liệu trả về Promise
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
        // --- BƯỚC 1: QUẢN LÝ BẢNG XE (40 XE) ---
        await runQuery(`CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, category TEXT, transmission TEXT, 
            price_per_day REAL, image_url TEXT, seats INTEGER, 
            location_id TEXT, status TEXT DEFAULT 'available'
        )`);

        const carCheck = await getQuery("SELECT count(*) as count FROM cars");
        
        // Nếu không đủ 40 xe, xóa đi nạp lại bản chuẩn
        if (carCheck.count !== 40) {
            console.log(`♻️  Số lượng xe không khớp (${carCheck.count}/40). Đang tái thiết lập...`);
            await runQuery("DROP TABLE IF EXISTS cars");
            await runQuery(`CREATE TABLE cars (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT, category TEXT, transmission TEXT, 
                price_per_day REAL, image_url TEXT, seats INTEGER, 
                location_id TEXT, status TEXT DEFAULT 'available'
            )`);

            const carModels = [
    // Sửa lại property 'img' thành đường dẫn local: "images/ten_file.jpg"
    { name: "Mercedes S450 Luxury", cat: "4 chỗ", price: 4000000, img: "images/e300.jpg", seats: 4 },
    { name: "Toyota Camry 2024", cat: "5 chỗ", price: 1200000, img: "images/vios 2025", seats: 5 },
    { name: "Ford Everest Bi-Turbo", cat: "7 chỗ", price: 1500000, img: "images/foreverret.jpg", seats: 7 },
    { name: "Hyundai Accent", cat: "5 chỗ", price: 700000, img: "images/huyndai acen.jpg", seats: 5 },
    { name: "VinFast VF9 Plus", cat: "7 chỗ", price: 2500000, img: "images/vin vf9.jpg", seats: 7 }
];

            for (let i = 1; i <= 40; i++) {
                const m = carModels[i % carModels.length];
                await runQuery(`INSERT INTO cars (name, category, transmission, price_per_day, image_url, seats, location_id, status) 
                                VALUES (?,?,?,?,?,?,?,?)`, 
                                [`${m.name} #${i}`, m.cat, i % 2 === 0 ? "Tự động" : "Số sàn", m.price, m.img, m.seats, "HungYen", "available"]);
            }
        }

        // --- BƯỚC 2: QUẢN LÝ BẢNG TÀI XẾ (30 TÀI XẾ) ---
        // Nâng cấp: Thêm trường 'bio' để tránh lỗi 'undefined' trên giao diện
        await runQuery(`CREATE TABLE IF NOT EXISTS drivers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, phone TEXT, age INTEGER, experience INTEGER, 
            price_per_day REAL, bio TEXT, status TEXT DEFAULT 'available'
        )`);

        const driverCheck = await getQuery("SELECT count(*) as count FROM drivers");
        
        if (driverCheck.count !== 30) {
            console.log(`♻️  Số lượng tài xế không khớp (${driverCheck.count}/30). Đang cập nhật danh sách mới...`);
            await runQuery("DROP TABLE IF EXISTS drivers");
            await runQuery(`CREATE TABLE drivers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT, phone TEXT, age INTEGER, experience INTEGER, 
                price_per_day REAL, bio TEXT, status TEXT DEFAULT 'available'
            )`);

            const fNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi"];
            const mNames = ["Văn", "Đình", "Quốc", "Minh", "Thành", "Hữu"];
            const lNames = ["Hùng", "Nam", "Đức", "Tùng", "Thắng", "Tuấn", "Sơn", "Hải"];
            const bios = [
                "Chuyên lái xe đường dài, nhiệt tình, chu đáo.",
                "Am hiểu mọi cung đường du lịch, phục vụ tận tâm.",
                "Lái xe an toàn, lịch sự, phong cách phục vụ VIP.",
                "Thông thạo đường phố, đúng giờ, trách nhiệm cao."
            ];

            for (let i = 1; i <= 30; i++) {
                const fullName = `${fNames[i % fNames.length]} ${mNames[i % mNames.length]} ${lNames[i % lNames.length]}`;
                const age = 28 + (i % 22);
                const bio = bios[i % bios.length];
                await runQuery(`INSERT INTO drivers (name, phone, age, experience, price_per_day, bio, status) 
                                VALUES (?,?,?,?,?,?,?)`,
                                [fullName, `03${Math.floor(10000000 + Math.random() * 90000000)}`, age, age - 22, 500000, bio, "available"]);
            }
        }

        console.log("✅ Database đã sẵn sàng: 40 Xe & 30 Tài xế chuẩn.");

    } catch (err) {
        console.error("❌ Lỗi Database:", err);
    }
}

initDatabase();
module.exports = db;