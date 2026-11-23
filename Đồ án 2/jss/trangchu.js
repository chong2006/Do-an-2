/* ===== KHỐI 1: TÊN KHÓA LOCALSTORAGE ===== */
// Mỗi khóa tương ứng 1 "bảng" trong CSDL (dùng cho biểu đồ CSDL sau này)
const KEY = {
  products: "qs_products",
  categories: "qs_categories",
    brands: "qs_brands",
  cart: "qs_cart",
  users: "qs_users",
  orders: "qs_orders"
};

/* ===== KHỐI 2: HÀM ĐỌC / GHI LOCALSTORAGE ===== */
function getData(key) {
  // Đọc chuỗi JSON rồi đổi về mảng; nếu chưa có thì trả về mảng rỗng
  return JSON.parse(localStorage.getItem(key)) || [];
}
function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ===== KHỐI 3: DỮ LIỆU MẪU (chỉ nạp lần đầu) ===== */
const SEED_CATEGORIES = [
  { id: "cat1", name: "Quạt đứng" },
  { id: "cat2", name: "Quạt treo tường" },
  { id: "cat3", name: "Quạt hộp" },
  { id: "cat4", name: "Quạt điều hòa" },
  { id: "cat5", name: "Quạt công nghiệp" },
  { id: "cat6", name: "Quạt trần" }
];
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

function initData() {
  // Chỉ ghi dữ liệu mẫu khi localStorage đang trống
  if (!localStorage.getItem(KEY.categories)) setData(KEY.categories, SEED_CATEGORIES);
  if (!localStorage.getItem(KEY.products)) setData(KEY.products, SEED_PRODUCTS);
  if (!localStorage.getItem(KEY.cart)) setData(KEY.cart, []);
    if (!localStorage.getItem(KEY.brands)) setData(KEY.brands, SEED_BRANDS);
}

/* ===== KHỐI 4: TIỆN ÍCH DÙNG CHUNG ===== */
// Định dạng giá: 450000 -> "450.000đ"
function formatPrice(n) {
  return n.toLocaleString("vi-VN") + "đ";
}
// Hình quạt vẽ bằng SVG (thay cho ảnh, sau này bạn có thể đổi sang thẻ <img>)
function fanSvg() {
  return '<svg viewBox="0 0 100 100" fill="none">' +
    '<circle cx="50" cy="50" r="44" stroke="#17694a" stroke-width="3"/>' +
    '<g fill="#17694a"><ellipse cx="50" cy="27" rx="9" ry="19"/>' +
    '<ellipse cx="50" cy="27" rx="9" ry="19" transform="rotate(120 50 50)"/>' +
    '<ellipse cx="50" cy="27" rx="9" ry="19" transform="rotate(240 50 50)"/></g>' +
    '<circle cx="50" cy="50" r="6" fill="#0d3b2a"/></svg>';
}

/* ===== KHỐI 5: KHỞI CHẠY KHI TRANG TẢI XONG ===== */
document.addEventListener("DOMContentLoaded", function () {
  initData();            // nạp dữ liệu mẫu (khối 3)
  renderCategories();    // đổ danh mục
  renderProducts();      // đổ sản phẩm
    renderBrands();        // đổ thương hiệu
  updateCartCount();     // cập nhật số trên giỏ hàng
  setupSearch();         // xử lý ô tìm kiếm
  setupCategoryMenu();   // xử lý menu danh mục xổ xuống
  document.getElementById("hero-fan").innerHTML = fanSvg();
});

/* ===== KHỐI 6: HIỂN THỊ DANH MỤC ===== */
function renderCategories() {
  const cats = getData(KEY.categories);
  // Ô danh mục ở giữa trang
  document.getElementById("category-list").innerHTML = cats.map(function (c) {
    return '<a class="cat-item" href="sanpham.html?cat=' + c.id + '">' + fanSvg() + c.name + "</a>";
  }).join("");
  // Menu xổ xuống trên thanh điều hướng
  document.getElementById("cat-menu").innerHTML = cats.map(function (c) {
    return '<li><a href="sanpham.html?cat=' + c.id + '">' + c.name + "</a></li>";
  }).join("");
}

/* ===== KHỐI 7: HIỂN THỊ SẢN PHẨM NỔI BẬT (lấy 8 sản phẩm đầu) ===== */
function renderProducts() {
  const products = getData(KEY.products).slice(0, 8);
  document.getElementById("product-list").innerHTML = products.map(function (p) {
    const old = p.oldPrice ? "<del>" + formatPrice(p.oldPrice) + "</del>" : "";
    return '<div class="product">' +
      '<a class="thumb" href="chitiet.html?id=' + p.id + '">' + fanSvg() + "</a>" +
      '<h3><a href="chitiet.html?id=' + p.id + '">' + p.name + "</a></h3>" +
      '<p class="meta">Công suất: ' + p.power + "</p>" +
      '<p class="price">' + formatPrice(p.price) + old + "</p>" +
      '<button class="btn-add" onclick="addToCart(\'' + p.id + '\')">Thêm vào giỏ</button>' +
      "</div>";
  }).join("");
}

/* ===== KHỐI 8: GIỎ HÀNG (lưu trong localStorage) ===== */
function addToCart(productId) {
  const cart = getData(KEY.cart);
  const item = cart.find(function (i) { return i.productId === productId; });
  if (item) item.qty += 1;                              // đã có thì tăng số lượng
  else cart.push({ productId: productId, qty: 1 });     // chưa có thì thêm mới
  setData(KEY.cart, cart);
  updateCartCount();
}
function updateCartCount() {
  const total = getData(KEY.cart).reduce(function (s, i) { return s + i.qty; }, 0);
  document.getElementById("cart-count").textContent = total;
}

/* ===== KHỐI 9: TÌM KIẾM & MENU DANH MỤC ===== */
function setupSearch() {
  document.getElementById("search-form").addEventListener("submit", function (e) {
    e.preventDefault();  // chặn tải lại trang
    const q = document.getElementById("search-input").value.trim();
    // Chuyển sang trang sản phẩm kèm từ khóa (trang sanpham.html sẽ làm ở bước sau)
    window.location.href = "sanpham.html?q=" + encodeURIComponent(q);
  });
}
function setupCategoryMenu() {
  const menu = document.getElementById("cat-menu");
  document.getElementById("cat-toggle").addEventListener("click", function () {
    menu.classList.toggle("open");
  });
}

/* ===== KHỐI 10: HIỂN THỊ THƯƠNG HIỆU ===== */
function renderBrands() {
  document.getElementById("brand-list").innerHTML = getData(KEY.brands).map(function (b) {
    return '<a class="brand" style="color:' + b.color + '" href="sanpham.html?brand=' + b.id + '">' + b.name + "</a>";
  }).join("");
}