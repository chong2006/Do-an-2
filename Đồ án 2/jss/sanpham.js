/* ===== KHỐI 1: TRẠNG THÁI BỘ LỌC (đọc từ địa chỉ trang: ?cat=...&brand=...&q=...) ===== */
const urlParams = new URLSearchParams(window.location.search);
const state = {
  cat: urlParams.get("cat") || "",
  brand: urlParams.get("brand") || "",
  q: (urlParams.get("q") || "").trim(),
  price: "",
  sort: ""
};
// Các mức giá để lọc: lấy sản phẩm có min <= giá < max
const PRICE_RANGES = [
  { id: "", label: "Tất cả mức giá", min: 0, max: Infinity },
  { id: "lt500", label: "Dưới 500.000đ", min: 0, max: 500000 },
  { id: "mid", label: "500.000đ – 1.500.000đ", min: 500000, max: 1500000 },
  { id: "gt1500", label: "Trên 1.500.000đ", min: 1500000, max: Infinity }
];

/* ===== KHỐI 2: KHỞI CHẠY (chung.js đã nạp dữ liệu mẫu, getData, addToCart, formatPrice...) ===== */
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("search-input").value = state.q;   // giữ từ khóa trên ô tìm kiếm
  renderFilters();
  renderProducts();
  document.querySelector(".filters").addEventListener("click", handleFilterClick);
  document.getElementById("reset-filter").addEventListener("click", resetFilters);
  document.getElementById("sort").addEventListener("change", function (e) {
    state.sort = e.target.value;
    renderProducts();
  });
  document.getElementById("product-list").addEventListener("click", handleAddClick);
});

/* ===== KHỐI 3: LỌC VÀ SẮP XẾP ===== */

function getFilteredProducts() {
  const brands = getData(KEY.brands);
  const range = PRICE_RANGES.find(function (r) { return r.id === state.price; });
  const list = getData(KEY.products).filter(function (p) {
    if (state.cat && p.categoryId !== state.cat) return false;
    if (state.brand) {
      const b = brandOf(p, brands);
      if (!b || b.id !== state.brand) return false;
    }
    if (p.price < range.min || p.price >= range.max) return false;
    if (state.q && !p.name.toLowerCase().includes(state.q.toLowerCase())) return false;
    return true;
  });
  if (state.sort === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
  if (state.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
  if (state.sort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name, "vi"); });
  return list;
}

/* ===== KHỐI 4: HIỂN THỊ BỘ LỌC ===== */
// Tạo 1 nhóm nút lọc; nút đang chọn có class "active"
function optionHtml(group, value, label) {
  const active = state[group] === value ? " active" : "";
  return '<li><button type="button" class="opt' + active + '" data-group="' + group +
         '" data-value="' + value + '">' + label + "</button></li>";
}
function renderFilters() {
  const cats = getData(KEY.categories);
  const brands = getData(KEY.brands);
  document.getElementById("filter-cat").innerHTML =
    optionHtml("cat", "", "Tất cả") + cats.map(function (c) { return optionHtml("cat", c.id, c.name); }).join("");
  document.getElementById("filter-brand").innerHTML =
    optionHtml("brand", "", "Tất cả") + brands.map(function (b) { return optionHtml("brand", b.id, b.name); }).join("");
  document.getElementById("filter-price").innerHTML =
    PRICE_RANGES.map(function (r) { return optionHtml("price", r.id, r.label); }).join("");
}
function handleFilterClick(e) {
  const btn = e.target.closest("button[data-group]");
  if (!btn) return;
  state[btn.dataset.group] = btn.dataset.value;
  renderFilters();
  renderProducts();
}
function resetFilters() {
  state.cat = ""; state.brand = ""; state.q = ""; state.price = ""; state.sort = "";
  document.getElementById("sort").value = "";
  document.getElementById("search-input").value = "";
  history.replaceState(null, "", "sanpham.html");   // xóa ?cat=... trên thanh địa chỉ
  renderFilters();
  renderProducts();
}

/* ===== KHỐI 5: HIỂN THỊ DANH SÁCH SẢN PHẨM ===== */
function renderProducts() {
  const list = getFilteredProducts();

  // Tiêu đề trang theo bộ lọc đang dùng
  let title = "Tất cả sản phẩm";
  if (state.q) title = 'Kết quả cho "' + state.q + '"';
  else if (state.cat) {
    const c = getData(KEY.categories).find(function (x) { return x.id === state.cat; });
    if (c) title = c.name;
  }
  document.getElementById("page-title").textContent = title;
  document.getElementById("result-count").textContent = "Có " + list.length + " sản phẩm";

  document.getElementById("no-result").classList.toggle("hidden", list.length > 0);
  document.getElementById("product-list").innerHTML = list.map(function (p) {
    const old = p.oldPrice ? "<del>" + formatPrice(p.oldPrice) + "</del>" : "";
    const link = "chitiet.html?id=" + p.id;   // trang chi tiết sẽ làm ở bước sau
    return '<div class="product">' +
      '<a class="thumb" href="' + link + '">' + fanSvg() + "</a>" +
      '<h3><a href="' + link + '">' + p.name + "</a></h3>" +
      '<p class="meta">Công suất: ' + p.power + "</p>" +
      '<p class="price">' + formatPrice(p.price) + old + "</p>" +
      '<button type="button" class="btn-add" data-id="' + p.id + '">Thêm vào giỏ</button>' +
      "</div>";
  }).join("");
}

/* ===== KHỐI 6: THÊM VÀO GIỎ + THÔNG BÁO ===== */
function handleAddClick(e) {
  const btn = e.target.closest(".btn-add");
  if (!btn) return;
  addToCart(btn.dataset.id);          // hàm trong chung.js
  showToast("Đã thêm vào giỏ hàng");
}
let toastTimer;
function showToast(text) {
  const t = document.getElementById("toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1600);
}