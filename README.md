# Background Changer Extension

Một tiện ích mở rộng trên Chrome (Chrome Extension) cho phép bạn thay đổi hình nền của bất kỳ trang web nào để cá nhân hoá trải nghiệm duyệt web. Tiện ích được xây dựng với **React**, **TypeScript**, **Vite** và **TailwindCSS**, sử dụng Manifest V3 mới nhất của Chrome.

## ✨ Tính năng nổi bật

- **🖼️ Thay đổi hình nền tùy thích**: Upload hình ảnh từ máy tính (hỗ trợ đến 30MB) và đặt làm hình nền cho bất kỳ trang web nào.
- **🎯 Phạm vi áp dụng linh hoạt**: Bạn có thể chọn áp dụng hình nền cho **Cả website** (toàn bộ tên miền) hoặc chỉ áp dụng riêng cho **Trang này** (đường dẫn cụ thể).
- **🎚️ Chỉnh độ mờ (Opacity) mượt mà**: Thay đổi độ mờ của hình nền thông qua thanh trượt. Hiệu ứng hiển thị mượt mà tức thì nhờ sử dụng CSS Variables.
- **⚡ Hiệu suất siêu tốc (Zero-Latency Rendering)**: Cơ chế nén ảnh tạo Thumbnail (WebP) lưu vào `chrome.storage.local` kết hợp IndexedDB giúp hình nền tải ngay lập tức mà không gây giật lag (flicker) hay tốn nhiều tài nguyên khi trang vừa tải.
- **🔋 Tối ưu hóa hệ thống**: Sử dụng cơ chế đăng ký script động (`chrome.scripting.registerContentScripts`), đảm bảo extension chỉ tiêm mã vào các trang web mà người dùng đã bật thay đổi hình nền, tiết kiệm bộ nhớ và tài nguyên trình duyệt.
- **💾 Lưu trữ an toàn**: Tất cả dữ liệu hình ảnh được lưu trữ hoàn toàn cục bộ trên trình duyệt của bạn (Local Storage & IndexedDB), không cần server, đảm bảo quyền riêng tư.

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 18, TypeScript, TailwindCSS, Vite.
- **Extension API**: Manifest V3, `chrome.storage`, `chrome.scripting`, `chrome.runtime`.
- **Lưu trữ**: IndexedDB (lưu trữ ảnh gốc chất lượng cao), Chrome Local Storage (lưu trữ thông số và ảnh thumbnail WebP).

## 🚀 Hướng dẫn cài đặt và phát triển

Dự án này sử dụng Vite để build giao diện Popup, phần logic lõi của extension (Background Service Worker và Content Scripts) được đặt sẵn trong thư mục `extension/`.

### 1. Yêu cầu hệ thống
- Đã cài đặt [Node.js](https://nodejs.org/) (khuyến nghị phiên bản LTS).
- Trình duyệt Google Chrome, Edge hoặc các trình duyệt sử dụng nhân Chromium.

### 2. Cài đặt các gói phụ thuộc
Mở terminal tại thư mục gốc của dự án và chạy:
```bash
npm install
```

### 3. Build mã nguồn
Sau khi chỉnh sửa code trong thư mục `src/`, bạn cần build để cập nhật giao diện vào thư mục `extension/popup/`:
```bash
npm run build
```

### 4. Cài đặt Extension vào Trình duyệt
1. Mở trình duyệt Chrome và truy cập vào địa chỉ: `chrome://extensions/`
2. Bật công tắc **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải.
3. Nhấn vào nút **Load unpacked** (Tải tiện ích đã giải nén) ở góc trên bên trái.
4. Trỏ đường dẫn đến thư mục `extension` bên trong dự án của bạn (`d:\Web\Background\extension`).
5. Ghim extension lên thanh công cụ để bắt đầu sử dụng!

## 📄 Cấu trúc thư mục

- `src/`: Chứa mã nguồn React cho giao diện Popup.
- `extension/`: Thư mục chính của tiện ích mở rộng (Extension).
  - `background/`: Chứa `background.js` (Service Worker xử lý logic và gọi IndexedDB) và `db.js`.
  - `scripts/`: Chứa `content.js` (Script được tiêm vào các trang web để render hình nền).
  - `shared/`: Chứa file `constants.js` định nghĩa các key cấu hình dùng chung.
  - `popup/`: (Được tạo ra sau khi build) Chứa file HTML/CSS/JS của giao diện Popup sinh ra bởi Vite.
  - `manifest.json`: Tệp tin cấu hình chính của Chrome Extension.
