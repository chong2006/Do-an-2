/* ===== KHỐI 1: ĐỌC MÃ SẢN PHẨM TỪ ĐỊA CHỈ TRANG (VD: chitiet.html?id=p1) ===== */
const productId = new URLSearchParams(window.location.search).get("id");
let product = null;

/* ===== KHỐI 2: KHỞI CHẠY (chung.js đã nạp dữ liệu mẫu, getData, addToCart, brandOf...) ===== */
document.addEventListener("DOMContentLoaded", function () {
  product = getData(KEY.products).find(function (p) { return p.id === productId; }) || null;
  if (!product) {                       // sai mã hoặc chưa có sản phẩm
    show("not-found", true);
    renderCrumb(null);
    return;
  }
  renderCrumb(product);
  renderDetail();
  renderSpecs();
  renderRelated();

  document.getElementById("qty-dec").addEventListener("click", function () { setQty(getQty() - 1); });
  document.getElementById("qty-inc").addEventListener("click", function () { setQty(getQty() + 1); });
  document.getElementById("d-qty").addEventListener("change", function () { setQty(getQty()); });
  document.getElementById("btn-add").addEventListener("click", handleAdd);
  document.getElementById("btn-buy").addEventListener("click", handleBuyNow);
  document.getElementById("related-list").addEventListener("click", handleRelatedAdd);
});

/* ===== KHỐI 3: HIỂN THỊ THÔNG TIN ===== */
function categoryOf(p) {
  return getData(KEY.categories).find(function (c) { return c.id === p.categoryId; }) || null;
}
function renderCrumb(p) {
  let html = '<a href="trangchu.html">Trang chủ</a><span>›</span><a href="sanpham.html">Tất cả sản phẩm</a>';
  if (p) {
    const cat = categoryOf(p);
    if (cat) html += '<span>›</span><a href="sanpham.html?cat=' + cat.id + '">' + cat.name + "</a>";
    html += "<span>›</span>" + p.name;
  }
  document.getElementById("crumb").innerHTML = html;
}
function renderDetail() {
  const brand = brandOf(product, getData(KEY.brands));
  const cat = categoryOf(product);
  document.title = product.name + " - Quạt Shop";
  show("detail", true);

  document.getElementById("d-image").innerHTML = fanSvg();
  document.getElementById("d-brand").textContent = brand ? brand.name : "Chính hãng";
  document.getElementById("d-name").textContent = product.name;
  document.getElementById("d-meta").textContent =
    "Danh mục: " + (cat ? cat.name : "Khác") + " · Công suất: " + product.power;
  document.getElementById("d-price").textContent = formatPrice(product.price);

  // Có giá cũ cao hơn giá hiện tại thì hiện giá gạch ngang + % giảm
  if (product.oldPrice > product.price) {
    const percent = Math.round((1 - product.price / product.oldPrice) * 100);
    document.getElementById("d-old").textContent = formatPrice(product.oldPrice);
    document.getElementById("d-sale").textContent = "-" + percent + "%";
    show("d-old", true);
    show("d-sale", true);
  }
  document.getElementById("d-desc").textContent = product.desc ||
    "Mô tả chi tiết đang được cập nhật. Vui lòng liên hệ hotline để được tư vấn thêm.";
}
function renderSpecs() {
  const brand = brandOf(product, getData(KEY.brands));
  const cat = categoryOf(product);
  const rows = [["Mã sản phẩm", product.id.toUpperCase()], ["Tên sản phẩm", product.name]];
  if (cat) rows.push(["Danh mục", cat.name]);
  if (brand) rows.push(["Thương hiệu", brand.name]);
  rows.push(["Công suất", product.power], ["Bảo hành", "Chính hãng"]);

  document.getElementById("d-specs").innerHTML = rows.map(function (r) {
    return "<tr><th>" + r[0] + "</th><td>" + r[1] + "</td></tr>";
  }).join("");
  show("spec-box", true);
}

/* ===== KHỐI 4: SỐ LƯỢNG + THÊM VÀO GIỎ / MUA NGAY ===== */
function getQty() {
  const n = parseInt(document.getElementById("d-qty").value, 10);
  return isNaN(n) ? 1 : n;
}
function setQty(n) {
  document.getElementById("d-qty").value = Math.max(1, Math.min(99, n));   // giữ trong khoảng 1-99
}
function handleAdd() {
  const qty = getQty();
  addToCart(product.id, qty);           // hàm trong chung.js
  showToast("Đã thêm " + qty + " sản phẩm vào giỏ hàng");
}
function handleBuyNow() {
  addToCart(product.id, getQty());
  window.location.href = "giohang.html";
}

/* ===== KHỐI 5: SẢN PHẨM LIÊN QUAN ===== */
// Ưu tiên cùng danh mục, thiếu thì lấy thêm sản phẩm khác cho đủ 4
function renderRelated() {
  const others = getData(KEY.products).filter(function (p) { return p.id !== product.id; });
  const same = others.filter(function (p) { return p.categoryId === product.categoryId; });
  const rest = others.filter(function (p) { return p.categoryId !== product.categoryId; });
  const list = same.concat(rest).slice(0, 4);
  if (list.length === 0) return;

  document.getElementById("related-list").innerHTML = list.map(function (p) {
    const old = p.oldPrice ? "<del>" + formatPrice(p.oldPrice) + "</del>" : "";
    const link = "chitiet.html?id=" + p.id;
    return '<div class="product">' +
      '<a class="thumb" href="' + link + '">' + fanSvg() + "</a>" +
      '<h3><a href="' + link + '">' + p.name + "</a></h3>" +
      '<p class="meta">Công suất: ' + p.power + "</p>" +
      '<p class="price">' + formatPrice(p.price) + old + "</p>" +
      '<button type="button" class="btn-add" data-id="' + p.id + '">Thêm vào giỏ</button>' +
      "</div>";
  }).join("");
  show("related-box", true);
}
function handleRelatedAdd(e) {
  const btn = e.target.closest(".btn-add");
  if (!btn) return;
  addToCart(btn.dataset.id);
  showToast("Đã thêm vào giỏ hàng");
}

/* ===== KHỐI 6: THÔNG BÁO NHỎ ===== */
let toastTimer;
function showToast(text) {
  const t = document.getElementById("toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1600);
}