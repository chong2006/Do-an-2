/* ===== KHỐI 1: KHỞI CHẠY (chung.js đã nạp dữ liệu mẫu, getData, KEY...) ===== */
document.addEventListener("DOMContentLoaded", function () {
  renderStats();
  renderBrands();
    setupSupport();
});

/* ===== KHỐI 2: CON SỐ THỐNG KÊ (lấy từ dữ liệu thật trong localStorage) ===== */
function renderStats() {
  const items = [
    { value: getData(KEY.products).length, label: "Sản phẩm" },
    { value: getData(KEY.categories).length, label: "Danh mục" },
    { value: getData(KEY.brands).length, label: "Thương hiệu" },
    { value: 10, label: "Giờ hỗ trợ mỗi ngày (08:00 – 18:00)" }
  ];
  const box = document.getElementById("stats");
  box.innerHTML = items.map(function (i) {
    return '<div class="about-stat"><b data-target="' + i.value + '">0</b><span>' + i.label + "</span></div>";
  }).join("");
  box.querySelectorAll("b").forEach(function (el) { countUp(el, parseInt(el.dataset.target, 10)); });
}
// Hiệu ứng đếm từ 0 lên số cần hiện (người dùng tắt hiệu ứng chuyển động thì hiện luôn)
function countUp(el, target) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || target === 0) {
    el.textContent = target;
    return;
  }
  let n = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const timer = setInterval(function () {
    n = Math.min(target, n + step);
    el.textContent = n;
    if (n >= target) clearInterval(timer);
  }, 30);
}

/* ===== KHỐI 3: THƯƠNG HIỆU ===== */
function renderBrands() {
  document.getElementById("brand-list").innerHTML = getData(KEY.brands).map(function (b) {
    return '<a class="brand" style="color:' + b.color + '" href="sanpham.html?brand=' + b.id + '">' + b.name + "</a>";
  }).join("");
}

/* ===== KHỐI 4: CHÍNH SÁCH VÀ HỖ TRỢ (đổi chủ đề, mở theo địa chỉ #..., tra cứu đơn) ===== */
function setupSupport() {
  document.querySelector(".topics").addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-topic]");
    if (btn) openTopic(btn.dataset.topic);
  });
  document.getElementById("track-form").addEventListener("submit", handleTrack);
  window.addEventListener("hashchange", openFromHash);   // bấm link ở footer khi đang ở trang này
  openFromHash();                                         // mở trang từ link footer (VD: gioithieu.html#doitra)
}
function openTopic(name) {
  document.querySelectorAll(".topic-btn").forEach(function (b) {
    b.classList.toggle("active", b.dataset.topic === name);
  });
  document.querySelectorAll(".topic-panel").forEach(function (p) {
    p.classList.toggle("active", p.dataset.topic === name);
  });
}
function openFromHash() {
  const name = window.location.hash.slice(1);
  const exists = Array.from(document.querySelectorAll(".topic-panel")).some(function (p) {
    return p.dataset.topic === name;
  });
  if (!exists) return;
  openTopic(name);
  document.getElementById("support").scrollIntoView();
}
// Tra cứu đơn: phải khớp cả mã đơn và số điện thoại để người khác không xem được đơn của bạn
function handleTrack(e) {
  e.preventDefault();
  const code = document.getElementById("tk-code").value.trim().toUpperCase();
  const phone = document.getElementById("tk-phone").value.trim();
  const order = getData(KEY.orders).find(function (o) {
    return o.id.toUpperCase() === code && o.phone === phone;
  });
  const box = document.getElementById("track-result");
  if (!order) {
    box.className = "track-result err";
    box.textContent = "Không tìm thấy đơn hàng. Hãy kiểm tra lại mã đơn và số điện thoại.";
    return;
  }
  box.className = "track-result ok";
  box.textContent = "Đơn " + order.id + " – Trạng thái: " + order.status + "\n" +
    "Ngày đặt: " + new Date(order.createdAt).toLocaleDateString("vi-VN") + "\n" +
    "Tổng tiền: " + formatPrice(order.total) + "\n" +
    "Sản phẩm: " + order.items.map(function (i) { return i.name + " x" + i.qty; }).join(", ");
}