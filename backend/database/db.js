const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'rental_MOI.db');
const db = new sqlite3.Database(dbPath);

// --- GIỮ NGUYÊN HÀM HỖ TRỢ (CORE LOGIC) ---
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

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
        // --- CẤU HÌNH SỐ LƯỢNG XE MUỐN HIỂN THỊ ---
        const TARGET_CAR_COUNT = 25; // Đặt là 25 xe theo yêu cầu
        const shouldReset = true;    // Đặt true để ép cập nhật lại ảnh mới (quan trọng!)

        // --- BƯỚC 1: QUẢN LÝ BẢNG XE ---
        if (shouldReset) {
            await runQuery("DROP TABLE IF EXISTS cars");
        }

        // (Giữ nguyên cấu trúc bảng để không lỗi code hiển thị)
        await runQuery(`CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, category TEXT, transmission TEXT, 
            price_per_day REAL, image_url TEXT, seats INTEGER, 
            location_id TEXT, status TEXT DEFAULT 'available'
        )`);

        const carCheck = await getQuery("SELECT count(*) as count FROM cars");
        
        // Logic: Nếu số lượng xe khác 25 (hoặc vừa bị xóa = 0) thì nạp lại
        if (carCheck.count !== TARGET_CAR_COUNT) {
            console.log(`♻️  Đang thiết lập lại danh sách ${TARGET_CAR_COUNT} xe chuẩn...`);
            
            // Nếu chưa reset ở trên thì xóa ở đây cho chắc chắn sạch
            if (!shouldReset) await runQuery("DELETE FROM cars");

            // DANH SÁCH XE (Đã sửa lại tên file cho chuẩn cú pháp)
            // LƯU Ý: Bạn cần đổi tên file thật trong thư mục images cho khớp y hệt
            const carModels = [
                { name: "Mercedes S450 Luxury", cat: "4 chỗ", price: 4000000, img: "images/e300.jpg", seats: 4 },
                { name: "Toyota Vios 2025",     cat: "5 chỗ", price: 800000,  img: "images/vios_2025.jpg", seats: 5 }, // Đã thêm .jpg và bỏ dấu cách
                { name: "Ford Everest Bi-Turbo",cat: "7 chỗ", price: 1500000, img: "images/foreverret.jpg", seats: 7 },
                { name: "Hyundai Accent",       cat: "5 chỗ", price: 700000,  img: "images/huyndai_acen.jpg", seats: 5 }, // Đã bỏ dấu cách
                { name: "VinFast VF9 Plus",     cat: "7 chỗ", price: 2500000, img: "images/vin_vf9.jpg", seats: 7 } // Đã bỏ dấu cách
            ];

            for (let i = 1; i <= TARGET_CAR_COUNT; i++) {
                // Sửa logic (i-1) để lấy đúng từ xe đầu tiên, không bị sót Mercedes
                const m = carModels[(i - 1) % carModels.length];
                
                await runQuery(`INSERT INTO cars (name, category, transmission, price_per_day, image_url, seats, location_id, status) 
                                VALUES (?,?,?,?,?,?,?,?)`, 
                                [`${m.name} #${i}`, m.cat, i % 2 === 0 ? "Tự động" : "Số sàn", m.price, m.img, m.seats, "HungYen", "available"]);
            }
        }

        // --- BƯỚC 2: QUẢN LÝ BẢNG TÀI XẾ ---
        // (Giữ nguyên toàn bộ logic cũ của bạn vì đã ổn định)
        await runQuery(`CREATE TABLE IF NOT EXISTS drivers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, phone TEXT, age INTEGER, experience INTEGER, 
            price_per_day REAL, bio TEXT, status TEXT DEFAULT 'available'
        )`);

        const driverCheck = await getQuery("SELECT count(*) as count FROM drivers");
        
        if (driverCheck.count !== 30) {
            console.log(`♻️  Cập nhật danh sách tài xế...`);
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
                // Sửa logic (i-1) để tên người đầu tiên không bị nhảy cóc
                const fullName = `${fNames[(i-1) % fNames.length]} ${mNames[(i-1) % mNames.length]} ${lNames[(i-1) % lNames.length]}`;
                const age = 28 + (i % 22);
                const bio = bios[(i-1) % bios.length];
                
                await runQuery(`INSERT INTO drivers (name, phone, age, experience, price_per_day, bio, status) 
                                VALUES (?,?,?,?,?,?,?)`,
                                [fullName, `03${Math.floor(10000000 + Math.random() * 90000000)}`, age, age - 22, 500000, bio, "available"]);
            }
        }

        console.log(`✅ Database đã sẵn sàng: ${TARGET_CAR_COUNT} Xe & 30 Tài xế chuẩn.`);

    } catch (err) {
        console.error("❌ Lỗi Database:", err);
    }
}

initDatabase();
module.exports = db;