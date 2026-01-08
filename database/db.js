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
    console.log("🛠️  Hệ thống TrangHy Autocar đang nạp dữ liệu chuẩn...");

    try {
        // --- DANH SÁCH 24 XE CỤ THỂ (Theo yêu cầu của bạn) ---
        const carList = [
            { name: "Toyota Camry 2024", category: "5", price: 1200000, image_url: "images/toyota2024.jpg" },
            { name: "VinFast VF8", category: "5", price: 1500000, image_url: "images/vinvf8.jpg" },
            { name: "Hyundai SantaFe", category: "7", price: 1800000, image_url: "images/santafe.jpg" },
            { name: "Kia Morning", category: "4", price: 600000, image_url: "images/kiamoning.jpg" },
            { name: "Mazda 3", category: "5", price: 950000, image_url: "images/mazda3.jpg" },
            { name: "Mitsubishi Xpander", category: "7", price: 1000000, image_url: "images/xpander.jpg" },
            { name: "Mercedes C200", category: "5", price: 2800000, image_url: "images/e200.jpg" },
            { name: "Ford Everest", category: "7", price: 2200000, image_url: "images/foreverret.jpg" },
            { name: "Honda City", category: "5", price: 800000, image_url: "images/hondaciti.jpg" },
            { name: "Kia Carnival", category: "7", price: 3500000, image_url: "images/kia_carnival.jpg" },
            { name: "Hyundai Accent", category: "5", price: 750000, image_url: "images/huyndai_acen.jpg" },
            { name: "BMW 320i", category: "5", price: 3200000, image_url: "images/bmw_320i.jpg" },
            { name: "Toyota Fortuner", category: "7", price: 1700000, image_url: "images/toyota_fortune.jpg" },
            { name: "VinFast VF9", category: "7", price: 2500000, image_url: "images/vin_vf9.jpg" },
            { name: "Kia Soluto", category: "4", price: 550000, image_url: "images/kia_soluto.jpg" },
            { name: "Toyota Vios", category: "5", price: 700000, image_url: "images/vios_2025.jpg" },
            { name: "Mazda CX-5", category: "5", price: 1300000, image_url: "images/cx5.jpg" },
            { name: "Hyundai Tucson", category: "5", price: 1250000, image_url: "images/tucson.jpg" },
            { name: "Toyota Innova", category: "7", price: 1100000, image_url: "images/toyota_2024.jpg" },
            { name: "Kia K3", category: "5", price: 900000, image_url: "images/kia_k3.jpg" },
            { name: "Honda CR-V", category: "7", price: 1600000, image_url: "images/cr-v.jpg" },
            { name: "Hyundai i10", category: "4", price: 500000, image_url: "images/hyun_i10.jpg" },
            { name: "Mercedes E300", category: "5", price: 4500000, image_url: "images/mercedes_e300.jpg" },
            { name: "Ford Ranger", category: "5", price: 1400000, image_url: "images/foer_ranger.jpg" }
        ];

        // --- BƯỚC 1: XỬ LÝ BẢNG XE (Reset sạch sẽ để nạp list mới) ---
        // Xóa bảng cũ đi để không bị trùng lặp với dữ liệu random trước đó
        await runQuery("DROP TABLE IF EXISTS cars");

        // Tạo lại bảng mới
        await runQuery(`CREATE TABLE cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, category TEXT, transmission TEXT, 
            price_per_day REAL, image_url TEXT, seats INTEGER, 
            location_id TEXT, status TEXT DEFAULT 'available'
        )`);

        console.log(`📥 Đang nạp ${carList.length} xe vào hệ thống...`);

        // Nạp từng xe trong danh sách
        for (const car of carList) {
            // Logic tự động: Xe giá dưới 800k thường là số sàn, trên là tự động
            const transmission = car.price < 800000 ? "Số sàn" : "Tự động";
            const seats = parseInt(car.category); // Lấy số ghế từ category (vd: "5" -> 5)
            const categoryStr = `${car.category} chỗ`; // Tạo chuỗi hiển thị (vd: "5 chỗ")

            await runQuery(`INSERT INTO cars (name, category, transmission, price_per_day, image_url, seats, location_id, status) 
                            VALUES (?,?,?,?,?,?,?,?)`, 
                            [car.name, categoryStr, transmission, car.price, car.image_url, seats, "HungYen", "available"]);
        }

        // --- BƯỚC 2: BẢNG TÀI XẾ (DRIVERS) ---
        await runQuery(`CREATE TABLE IF NOT EXISTS drivers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, phone TEXT, age INTEGER, experience INTEGER, 
            price_per_day REAL, bio TEXT, status TEXT DEFAULT 'available'
        )`);

        const driverCheck = await getQuery("SELECT count(*) as count FROM drivers");
        
        // Chỉ nạp lại tài xế nếu bảng trống
        if (driverCheck.count === 0) {
            console.log(`♻️  Khởi tạo danh sách tài xế...`);
            const fNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi"];
            const mNames = ["Văn", "Đình", "Quốc", "Minh", "Thành", "Hữu"];
            const lNames = ["Hùng", "Nam", "Đức", "Tùng", "Thắng", "Tuấn", "Sơn", "Hải"];
            
            for (let i = 1; i <= 20; i++) {
                const fullName = `${fNames[i%8]} ${mNames[i%6]} ${lNames[i%8]}`;
                await runQuery(`INSERT INTO drivers (name, phone, age, experience, price_per_day, bio, status) 
                                VALUES (?,?,?,?,?,?,?)`,
                                [fullName, "0908888999", 30 + (i%10), 5 + (i%5), 500000, "Tài xế chuyên nghiệp, rành đường", "available"]);
            }
        }

        // --- BƯỚC 3: BẢNG BOOKINGS (QUAN TRỌNG) ---
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

        console.log("✅ Database đã cập nhật xong: Danh sách xe chuẩn, Tài xế & Đơn hàng.");

    } catch (err) {
        console.error("❌ Lỗi Database:", err);
    }
}

initDatabase();
module.exports = db;