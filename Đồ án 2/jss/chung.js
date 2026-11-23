/* ===== FILE DÙNG CHUNG: dữ liệu localStorage + hành vi header =====
   Mọi trang MỚI (taikhoan, sanpham, giohang...) đều nhúng file này trước file JS riêng của trang. */

/* ===== KHỐI 1: TÊN KHÓA LOCALSTORAGE (mỗi khóa = 1 bảng CSDL) ===== */
const KEY = {
  products: "qs_products", categories: "qs_categories", brands: "qs_brands",
  cart: "qs_cart", users: "qs_users", orders: "qs_orders",contacts: "qs_contacts",
  currentUser: "qs_currentUser"   // id của người đang đăng nhập
};

/* ===== KHỐI 2: HÀM ĐỌC / GHI ===== */
function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

/* ===== KHỐI 3: DỮ LIỆU MẪU DÙNG CHUNG (chỉ nạp khi chưa có) ===== */
function initShared() {
  if (!localStorage.getItem(KEY.categories)) setData(KEY.categories, [
    { id: "cat1", name: "Quạt đứng" }, { id: "cat2", name: "Quạt treo tường" },
    { id: "cat3", name: "Quạt hộp" }, { id: "cat4", name: "Quạt điều hòa" },
    { id: "cat5", name: "Quạt công nghiệp" }, { id: "cat6", name: "Quạt trần" }
  ]);
  if (!localStorage.getItem(KEY.cart)) setData(KEY.cart, []);
  // Tài khoản quản trị mẫu (actor thứ 3: Quản trị viên)
  if (!localStorage.getItem(KEY.users)) setData(KEY.users, [
    { id: "u0", fullName: "Quản trị viên", email: "admin@quatshop.vn", phone: "0903000000",
      address: "Hưng Yên", password: "admin123", role: "admin" }
  ]);
}

/* ===== KHỐI 4: NGƯỜI DÙNG ĐANG ĐĂNG NHẬP ===== */
function getCurrentUser() {
  const id = localStorage.getItem(KEY.currentUser);
  return getData(KEY.users).find(function (u) { return u.id === id; }) || null;
}

/* ===== KHỐI 5: HÀNH VI HEADER (mỗi hàm tự kiểm tra phần tử có tồn tại) ===== */
function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (el) el.textContent = getData(KEY.cart).reduce(function (s, i) { return s + i.qty; }, 0);
}
function updateAccountButton() {
  const btn = document.getElementById("account-btn");
  const user = getCurrentUser();
  // Đã đăng nhập: "Xin chào, <tên>"; chưa: "Tài khoản"
  if (btn) btn.textContent = user ? "Xin chào, " + user.fullName.split(" ").pop() : "Tài khoản";
}
function renderCategoryMenu() {
  const menu = document.getElementById("cat-menu");
  if (menu) menu.innerHTML = getData(KEY.categories).map(function (c) {
    return '<li><a href="sanpham.html?cat=' + c.id + '">' + c.name + "</a></li>";
  }).join("");
}
function setupHeader() {
  const form = document.getElementById("search-form");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    window.location.href = "sanpham.html?q=" + encodeURIComponent(document.getElementById("search-input").value.trim());
  });
  const toggle = document.getElementById("cat-toggle");
  if (toggle) toggle.addEventListener("click", function () {
    document.getElementById("cat-menu").classList.toggle("open");
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initShared(); renderCategoryMenu(); updateCartCount(); updateAccountButton(); setupHeader();
});

/* ===== KHỐI 6: TIỆN ÍCH DÙNG CHUNG CHO MỌI TRANG ===== */
// Định dạng giá: 450000 -> "450.000đ"
function formatPrice(n) { return n.toLocaleString("vi-VN") + "đ"; }
// Hình quạt vẽ bằng SVG (thay cho ảnh)
function fanSvg() {
  return '<svg viewBox="0 0 100 100" fill="none">' +
    '<circle cx="50" cy="50" r="44" stroke="#17694a" stroke-width="3"/>' +
    '<g fill="#17694a"><ellipse cx="50" cy="27" rx="9" ry="19"/>' +
    '<ellipse cx="50" cy="27" rx="9" ry="19" transform="rotate(120 50 50)"/>' +
    '<ellipse cx="50" cy="27" rx="9" ry="19" transform="rotate(240 50 50)"/></g>' +
    '<circle cx="50" cy="50" r="6" fill="#0d3b2a"/></svg>';
}
// Ẩn / hiện phần tử theo id (dùng class "hidden")
function show(id, visible) { document.getElementById(id).classList.toggle("hidden", !visible); }
// Hiện thông báo dưới form: ok = true (màu xanh), false (màu đỏ)
function setMsg(id, text, ok) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "err");
}

/* ===== KHỐI 7: GIỎ HÀNG + DỮ LIỆU SẢN PHẨM MẪU DÙNG CHUNG ===== */
// Thêm 1 sản phẩm vào giỏ (đã có thì tăng số lượng)
// Thêm sản phẩm vào giỏ: qty là số lượng (bỏ trống = 1), đã có thì cộng dồn, tối đa 99
function addToCart(productId, qty) {
  qty = qty || 1;
  const cart = getData(KEY.cart);
  const item = cart.find(function (i) { return i.productId === productId; });
  if (item) item.qty = Math.min(99, item.qty + qty);
  else cart.push({ productId: productId, qty: qty });
  setData(KEY.cart, cart);
  updateCartCount();
}
// Lấy thương hiệu của sản phẩm: ưu tiên trường brandId (admin chọn), chưa có thì đoán theo tên
function brandOf(product, brands) {
  if (product.brandId) {
    return brands.find(function (b) { return b.id === product.brandId; }) || null;
  }
  const name = product.name.toLowerCase();
  return brands.find(function (b) { return name.includes(b.name.toLowerCase()); }) || null;
}

const SEED_PRODUCTS = [
  { id: "p1", categoryId: "cat1", name: "Quạt đứng Senko DH1600", price: 450000, oldPrice: 520000, power: "55W" },
  { id: "p2", categoryId: "cat1", name: "Quạt đứng Asia L16001", price: 520000, oldPrice: 0, power: "60W" },
  { id: "p3", categoryId: "cat2", name: "Quạt treo tường Senko T1688", price: 410000, oldPrice: 460000, power: "50W" },
  { id: "p4", categoryId: "cat3", name: "Quạt hộp Panasonic F-308N", price: 380000, oldPrice: 0, power: "45W" },
  { id: "p5", categoryId: "cat4", name: "Quạt điều hòa Kangaroo KG50F", price: 2890000, oldPrice: 3290000, power: "80W" },
  { id: "p6", categoryId: "cat5", name: "Quạt công nghiệp Vinawind 650", price: 1650000, oldPrice: 0, power: "180W" },
  { id: "p7", categoryId: "cat6", name: "Quạt trần Mitsubishi C56-GY", price: 1490000, oldPrice: 1650000, power: "70W" },
  { id: "p8", categoryId: "cat3", name: "Quạt hộp Lifan QH-35", price: 320000, oldPrice: 0, power: "40W" }
];
const SEED_BRANDS = [
  { id: "b1", name: "SENKO", color: "#111111" },
  { id: "b2", name: "Panasonic", color: "#0a4ea3" },
  { id: "b3", name: "ASIA", color: "#2a6f97" },
  { id: "b4", name: "Vinawind", color: "#1d3557" },
  { id: "b5", name: "MITSUBISHI", color: "#c1121f" },
  { id: "b6", name: "Dasin", color: "#1b3a8a" },
  { id: "b7", name: "Deton", color: "#0b3d91" },
  { id: "b8", name: "KDK", color: "#d00000" }
];
// Nạp sản phẩm + thương hiệu mẫu nếu chưa có (để mở thẳng trang nào cũng có dữ liệu)
function initCatalog() {
  if (!localStorage.getItem(KEY.products)) setData(KEY.products, SEED_PRODUCTS);
  if (!localStorage.getItem(KEY.brands)) setData(KEY.brands, SEED_BRANDS);
}
document.addEventListener("DOMContentLoaded", initCatalog);