/* ===== KHỐI 1: KHỞI CHẠY (chung.js đã nạp getData, setData, KEY, formatPrice, fanSvg, show, setMsg...) ===== */
document.addEventListener("DOMContentLoaded", function () {
  renderCart();
  prefillShipping();
  document.getElementById("cart-items").addEventListener("click", handleItemClick);
  document.getElementById("clear-cart").addEventListener("click", handleClearCart);
  document.getElementById("checkout-form").addEventListener("submit", handleCheckout);
});

/* ===== KHỐI 2: GHÉP GIỎ HÀNG VỚI THÔNG TIN SẢN PHẨM ===== */
// Giỏ hàng chỉ lưu {productId, qty}; hàm này tra thêm tên, giá từ bảng sản phẩm
function getCartDetails() {
  const products = getData(KEY.products);
  const rows = [];
  getData(KEY.cart).forEach(function (c) {
    const p = products.find(function (x) { return x.id === c.productId; });
    if (p) rows.push({ product: p, qty: c.qty });
  });
  return rows;
}

/* ===== KHỐI 3: HIỂN THỊ GIỎ HÀNG ===== */
function renderCart() {
  const rows = getCartDetails();
  show("cart-empty", rows.length === 0);     // giỏ trống thì hiện thông báo
  show("cart-content", rows.length > 0);     // có hàng thì hiện danh sách + form

  document.getElementById("cart-items").innerHTML = rows.map(function (r) {
    const p = r.product;
    return '<div class="item">' +
      '<div class="thumb">' + fanSvg() + "</div>" +
      '<div><h3>' + p.name + '</h3><p class="meta">Công suất: ' + p.power + '</p>' +
        '<p class="price">' + formatPrice(p.price) + "</p></div>" +
      '<div class="qty">' +
        '<button type="button" data-action="dec" data-id="' + p.id + '">−</button>' +
        "<span>" + r.qty + "</span>" +
        '<button type="button" data-action="inc" data-id="' + p.id + '">+</button></div>' +
      '<div class="line-total">' + formatPrice(p.price * r.qty) + "</div>" +
      '<button type="button" class="remove" data-action="remove" data-id="' + p.id + '" title="Xóa">✕</button>' +
      "</div>";
  }).join("");

  const total = rows.reduce(function (s, r) { return s + r.product.price * r.qty; }, 0);
  document.getElementById("sum-sub").textContent = formatPrice(total);
  document.getElementById("sum-total").textContent = formatPrice(total);
  updateCartCount();   // cập nhật số trên nút giỏ hàng (chung.js)
}

/* ===== KHỐI 4: TĂNG / GIẢM / XÓA SẢN PHẨM ===== */
function handleItemClick(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  let cart = getData(KEY.cart);
  const item = cart.find(function (i) { return i.productId === id; });
  if (!item) return;

  if (action === "inc" && item.qty < 99) item.qty += 1;
  if (action === "dec") item.qty -= 1;
  if (action === "remove" || item.qty <= 0) {
    cart = cart.filter(function (i) { return i.productId !== id; });
  }
  setData(KEY.cart, cart);
  renderCart();
}
function handleClearCart() {
  if (confirm("Xóa toàn bộ sản phẩm trong giỏ hàng?")) {
    setData(KEY.cart, []);
    renderCart();
  }
}

/* ===== KHỐI 5: ĐẶT HÀNG ===== */
// Nếu đã đăng nhập thì điền sẵn thông tin người nhận
function prefillShipping() {
  const user = getCurrentUser();
  if (!user) return;
  document.getElementById("co-name").value = user.fullName;
  document.getElementById("co-phone").value = user.phone;
  document.getElementById("co-address").value = user.address || "";
}
function handleCheckout(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return setMsg("co-msg", "Bạn cần đăng nhập để đặt hàng.", false);

  const phone = document.getElementById("co-phone").value.trim();
  if (!/^0\d{9}$/.test(phone)) return setMsg("co-msg", "Số điện thoại gồm 10 số, bắt đầu bằng 0.", false);

  const rows = getCartDetails();
  if (rows.length === 0) return;

  // Lưu đơn hàng (chụp lại tên, giá tại thời điểm mua để sau này đổi giá không ảnh hưởng đơn cũ)
  const order = {
    id: "DH" + Date.now().toString().slice(-6),
    userId: user.id,
    receiver: document.getElementById("co-name").value.trim(),
    phone: phone,
    address: document.getElementById("co-address").value.trim(),
    note: document.getElementById("co-note").value.trim(),
    payment: document.querySelector('input[name="payment"]:checked').value,
    status: "Chờ xác nhận",
    createdAt: new Date().toISOString(),
    items: rows.map(function (r) {
      return { productId: r.product.id, name: r.product.name, price: r.product.price, qty: r.qty };
    }),
    total: rows.reduce(function (s, r) { return s + r.product.price * r.qty; }, 0)
  };
  const orders = getData(KEY.orders);
  orders.push(order);
  setData(KEY.orders, orders);

  setData(KEY.cart, []);       // đặt xong thì làm trống giỏ
  updateCartCount();
  show("cart-content", false);
  show("order-done", true);
  document.getElementById("order-id").textContent = order.id;
}