/* ===== KHỐI 1: BIẾN CHUNG + HÀM TIỆN ÍCH ===== */
const STATUSES = ["Chờ xác nhận", "Đang giao", "Hoàn thành", "Đã hủy"];
let editingId = null;   // id sản phẩm đang sửa (null = đang thêm mới)

// Chống lỗi hiển thị khi dữ liệu có dấu " < > &
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function catName(id) {
  const c = getData(KEY.categories).find(function (x) { return x.id === id; });
  return c ? c.name : "—";
}
// Tạo bảng từ tiêu đề + các dòng HTML; không có dòng nào thì báo trống
function tableHtml(headers, rows) {
  if (rows.length === 0) return '<tbody><tr><td class="none">Chưa có dữ liệu.</td></tr></tbody>';
  return "<thead><tr>" + headers.map(function (h) { return "<th>" + h + "</th>"; }).join("") +
         "</tr></thead><tbody>" + rows.join("") + "</tbody>";
}
function openModal(title, html) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = html;
  show("modal", true);
}
function closeModal() { show("modal", false); }
let toastTimer;
function showToast(text) {
  const t = document.getElementById("toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1600);
}

/* ===== KHỐI 2: KHỞI CHẠY + PHÂN QUYỀN (chỉ role "admin" mới vào được) ===== */
document.addEventListener("DOMContentLoaded", function () {
  const me = getCurrentUser();
  if (!me || me.role !== "admin") { show("denied", true); return; }
  show("admin-app", true);
  document.getElementById("admin-name").textContent = me.fullName;

  document.querySelector(".side").addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-section]");
    if (btn) showSection(btn.dataset.section);
  });
  document.getElementById("admin-app").addEventListener("click", handleAction);
  document.getElementById("admin-app").addEventListener("change", handleStatusChange);
  document.getElementById("category-form").addEventListener("submit", addCategory);
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal").addEventListener("click", function (e) {
    if (e.target.id === "modal") closeModal();   // bấm ra ngoài hộp thoại để đóng
  });
  document.getElementById("logout-btn").addEventListener("click", function () {
    localStorage.removeItem(KEY.currentUser);
    window.location.href = "taikhoan.html";
  });
  showSection("dashboard");
});

// Chuyển giữa các mục menu bên trái, mỗi lần chuyển vẽ lại dữ liệu mới nhất
const SECTIONS = { dashboard: renderDashboard, products: renderProducts, categories: renderCategories,
                                      orders: renderOrders, users: renderUsers, contacts: renderContacts };
function showSection(name) {
  Object.keys(SECTIONS).forEach(function (k) {
    show("sec-" + k, k === name);
    document.querySelector('.side-btn[data-section="' + k + '"]').classList.toggle("active", k === name);
  });
  SECTIONS[name]();
}
// Một nơi xử lý tất cả nút có data-act (Sửa, Xóa, Chi tiết...)
function handleAction(e) {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  switch (btn.dataset.act) {
    case "p-add": openProductForm(null); break;
    case "p-edit": openProductForm(id); break;
    case "p-del": deleteProduct(id); break;
    case "c-edit": renameCategory(id); break;
    case "c-del": deleteCategory(id); break;
    case "o-view": viewOrder(id); break;
    case "u-del": deleteUser(id); break;
        case "m-view": viewContact(id); break;
    case "m-del": deleteContact(id); break;
  }
}

/* ===== KHỐI 3: TỔNG QUAN ===== */
function renderDashboard() {
  const orders = getData(KEY.orders);
  const revenue = orders.filter(function (o) { return o.status !== "Đã hủy"; })
                        .reduce(function (s, o) { return s + o.total; }, 0);
  const cards = [
    ["Sản phẩm", getData(KEY.products).length],
    ["Danh mục", getData(KEY.categories).length],
    ["Tổng đơn hàng", orders.length],
    ["Đơn chờ xác nhận", orders.filter(function (o) { return o.status === "Chờ xác nhận"; }).length],
    ["Khách hàng", getData(KEY.users).filter(function (u) { return u.role === "customer"; }).length],
    ["Doanh thu (không tính đơn hủy)", formatPrice(revenue)]
  ];
  document.getElementById("stats").innerHTML = cards.map(function (c) {
    return '<div class="stat"><p>' + c[0] + "</p><b>" + c[1] + "</b></div>";
  }).join("");
}

/* ===== KHỐI 4: QUẢN LÝ SẢN PHẨM (thêm, sửa, xóa) ===== */
function renderProducts() {
  const brands = getData(KEY.brands);
  const rows = getData(KEY.products).map(function (p) {
    const b = brandOf(p, brands);
    return "<tr><td>" + esc(p.name) + "</td><td>" + esc(catName(p.categoryId)) + "</td><td>" +
      (b ? esc(b.name) : "—") + "</td><td>" + formatPrice(p.price) + "</td><td>" + esc(p.power) + "</td>" +
      '<td class="act"><button type="button" data-act="p-edit" data-id="' + p.id + '">Sửa</button>' +
      '<button type="button" class="danger" data-act="p-del" data-id="' + p.id + '">Xóa</button></td></tr>';
  });
  document.getElementById("tbl-products").innerHTML =
    tableHtml(["Tên sản phẩm", "Danh mục", "Thương hiệu", "Giá", "Công suất", ""], rows);
}
function optionList(items, selectedId) {
  return items.map(function (i) {
    return '<option value="' + i.id + '"' + (i.id === selectedId ? " selected" : "") + ">" + esc(i.name) + "</option>";
  }).join("");
}
function openProductForm(id) {
  editingId = id;
  const brands = getData(KEY.brands);
  const p = id ? getData(KEY.products).find(function (x) { return x.id === id; })
               : { name: "", categoryId: "", brandId: "", power: "", price: "", oldPrice: 0, desc: "" };
  const curBrand = p.brandId || (id && brandOf(p, brands) ? brandOf(p, brands).id : "");

  openModal(id ? "Sửa sản phẩm" : "Thêm sản phẩm",
    '<form id="product-form" class="pform">' +
    '<label>Tên sản phẩm <input id="f-name" type="text" required value="' + esc(p.name) + '"></label>' +
    '<div class="row2"><label>Danh mục <select id="f-cat" required>' + optionList(getData(KEY.categories), p.categoryId) + "</select></label>" +
    '<label>Thương hiệu <select id="f-brand"><option value="">(Không có)</option>' + optionList(brands, curBrand) + "</select></label></div>" +
    '<div class="row2"><label>Giá bán (đ) <input id="f-price" type="number" min="1000" required value="' + p.price + '"></label>' +
    '<label>Giá cũ (đ, nhập 0 nếu không có) <input id="f-old" type="number" min="0" value="' + (p.oldPrice || 0) + '"></label></div>' +
    '<label>Công suất <input id="f-power" type="text" placeholder="VD: 55W" required value="' + esc(p.power) + '"></label>' +
    '<label>Mô tả <textarea id="f-desc" rows="3">' + esc(p.desc || "") + "</textarea></label>" +
    '<p id="f-msg" class="msg"></p><button class="btn-save" type="submit">Lưu sản phẩm</button></form>');
  document.getElementById("product-form").addEventListener("submit", saveProduct);
}
function saveProduct(e) {
  e.preventDefault();
  const price = parseInt(document.getElementById("f-price").value, 10);
  const oldPrice = parseInt(document.getElementById("f-old").value, 10) || 0;
  if (oldPrice && oldPrice <= price) return setMsg("f-msg", "Giá cũ phải lớn hơn giá bán (hoặc nhập 0).", false);

  const data = {
    name: document.getElementById("f-name").value.trim(),
    categoryId: document.getElementById("f-cat").value,
    brandId: document.getElementById("f-brand").value,
    power: document.getElementById("f-power").value.trim(),
    price: price, oldPrice: oldPrice,
    desc: document.getElementById("f-desc").value.trim()
  };
  const products = getData(KEY.products);
  if (editingId) {
    const i = products.findIndex(function (x) { return x.id === editingId; });
    products[i] = Object.assign(products[i], data);   // giữ nguyên id, chỉ cập nhật các trường
  } else {
    data.id = "p" + Date.now();
    products.push(data);
  }
  setData(KEY.products, products);
  closeModal();
  renderProducts();
  showToast("Đã lưu sản phẩm");
}
function deleteProduct(id) {
  if (!confirm("Xóa sản phẩm này?")) return;
  setData(KEY.products, getData(KEY.products).filter(function (p) { return p.id !== id; }));
  renderProducts();
  showToast("Đã xóa sản phẩm");
}

/* ===== KHỐI 5: QUẢN LÝ DANH MỤC ===== */
function renderCategories() {
  const products = getData(KEY.products);
  const rows = getData(KEY.categories).map(function (c) {
    const n = products.filter(function (p) { return p.categoryId === c.id; }).length;
    return "<tr><td>" + esc(c.name) + "</td><td>" + n + " sản phẩm</td>" +
      '<td class="act"><button type="button" data-act="c-edit" data-id="' + c.id + '">Đổi tên</button>' +
      '<button type="button" class="danger" data-act="c-del" data-id="' + c.id + '">Xóa</button></td></tr>';
  });
  document.getElementById("tbl-categories").innerHTML = tableHtml(["Tên danh mục", "Số sản phẩm", ""], rows);
}
function addCategory(e) {
  e.preventDefault();
  const input = document.getElementById("cat-name");
  const cats = getData(KEY.categories);
  cats.push({ id: "cat" + Date.now(), name: input.value.trim() });
  setData(KEY.categories, cats);
  input.value = "";
  renderCategories();
  showToast("Đã thêm danh mục");
}
function renameCategory(id) {
  const cats = getData(KEY.categories);
  const c = cats.find(function (x) { return x.id === id; });
  const name = prompt("Tên mới của danh mục:", c.name);
  if (!name || !name.trim()) return;
  c.name = name.trim();
  setData(KEY.categories, cats);
  renderCategories();
}
function deleteCategory(id) {
  const used = getData(KEY.products).filter(function (p) { return p.categoryId === id; }).length;
  if (used > 0) return alert("Không thể xóa: còn " + used + " sản phẩm thuộc danh mục này.");
  if (!confirm("Xóa danh mục này?")) return;
  setData(KEY.categories, getData(KEY.categories).filter(function (c) { return c.id !== id; }));
  renderCategories();
}

/* ===== KHỐI 6: QUẢN LÝ ĐƠN HÀNG (xem chi tiết, đổi trạng thái) ===== */
function renderOrders() {
  const rows = getData(KEY.orders).slice().reverse().map(function (o) {   // đơn mới nhất lên đầu
    const opts = STATUSES.map(function (s) {
      return "<option" + (s === o.status ? " selected" : "") + ">" + s + "</option>";
    }).join("");
    return "<tr><td>" + o.id + "</td><td>" + esc(o.receiver) + "</td><td>" + esc(o.phone) + "</td><td>" +
      formatPrice(o.total) + "</td><td>" + new Date(o.createdAt).toLocaleString("vi-VN") + "</td>" +
      '<td><select class="status" data-order="' + o.id + '">' + opts + "</select></td>" +
      '<td class="act"><button type="button" data-act="o-view" data-id="' + o.id + '">Chi tiết</button></td></tr>';
  });
  document.getElementById("tbl-orders").innerHTML =
    tableHtml(["Mã đơn", "Người nhận", "SĐT", "Tổng tiền", "Ngày đặt", "Trạng thái", ""], rows);
}
function handleStatusChange(e) {
  const sel = e.target.closest("select[data-order]");
  if (!sel) return;
  const orders = getData(KEY.orders);
  const o = orders.find(function (x) { return x.id === sel.dataset.order; });
  o.status = sel.value;
  setData(KEY.orders, orders);
  showToast("Đã cập nhật trạng thái đơn " + o.id);
}
function viewOrder(id) {
  const o = getData(KEY.orders).find(function (x) { return x.id === id; });
  const items = o.items.map(function (i) {
    return "<tr><td>" + esc(i.name) + "</td><td>" + i.qty + "</td><td>" + formatPrice(i.price * i.qty) + "</td></tr>";
  }).join("");
  openModal("Đơn hàng " + o.id,
    '<div class="order-info"><p><b>Người nhận:</b> ' + esc(o.receiver) + " – " + esc(o.phone) + "</p>" +
    "<p><b>Địa chỉ:</b> " + esc(o.address) + "</p>" +
    "<p><b>Thanh toán:</b> " + esc(o.payment) + "</p>" +
    "<p><b>Ghi chú:</b> " + (o.note ? esc(o.note) : "—") + "</p></div>" +
    '<div class="table-wrap"><table>' + tableHtml(["Sản phẩm", "SL", "Thành tiền"], [items]) + "</table></div>" +
    '<p style="margin-top:12px"><b>Tổng cộng: ' + formatPrice(o.total) + "</b></p>");
}

/* ===== KHỐI 7: QUẢN LÝ NGƯỜI DÙNG (xem, xóa khách hàng) ===== */
function renderUsers() {
  const orders = getData(KEY.orders);
  const rows = getData(KEY.users).map(function (u) {
    const n = orders.filter(function (o) { return o.userId === u.id; }).length;
    const action = u.role === "admin" ? "" :
      '<button type="button" class="danger" data-act="u-del" data-id="' + u.id + '">Xóa</button>';
    return "<tr><td>" + esc(u.fullName) + "</td><td>" + esc(u.email) + "</td><td>" + esc(u.phone) + "</td><td>" +
      (u.role === "admin" ? "Quản trị viên" : "Khách hàng") + "</td><td>" + n + '</td><td class="act">' + action + "</td></tr>";
  });
  document.getElementById("tbl-users").innerHTML =
    tableHtml(["Họ tên", "Email", "SĐT", "Vai trò", "Số đơn", ""], rows);
}
function deleteUser(id) {
  if (!confirm("Xóa tài khoản này? Các đơn hàng đã đặt vẫn được giữ lại.")) return;
  setData(KEY.users, getData(KEY.users).filter(function (u) { return u.id !== id; }));
  renderUsers();
  showToast("Đã xóa tài khoản");
}

/* ===== KHỐI 8: QUẢN LÝ LIÊN HỆ (xem, đánh dấu đã xử lý, xóa) ===== */
function renderContacts() {
  const rows = getData(KEY.contacts).slice().reverse().map(function (m) {   // tin mới nhất lên đầu
    return "<tr><td>" + new Date(m.createdAt).toLocaleString("vi-VN") + "</td><td>" + esc(m.name) + "</td><td>" +
      esc(m.email) + " · " + esc(m.phone) + "</td><td>" + esc(m.topic) + "</td><td>" +
      (m.status === "Mới" ? "<b>Mới</b>" : esc(m.status)) + "</td>" +
      '<td class="act"><button type="button" data-act="m-view" data-id="' + m.id + '">Xem</button>' +
      '<button type="button" class="danger" data-act="m-del" data-id="' + m.id + '">Xóa</button></td></tr>';
  });
  document.getElementById("tbl-contacts").innerHTML =
    tableHtml(["Ngày gửi", "Họ tên", "Liên hệ", "Chủ đề", "Trạng thái", ""], rows);
}
function viewContact(id) {
  const m = getData(KEY.contacts).find(function (x) { return x.id === id; });
  const done = m.status === "Đã xử lý";
  openModal("Liên hệ từ " + m.name,
    '<div class="order-info"><p><b>Email:</b> ' + esc(m.email) + "</p>" +
    "<p><b>Số điện thoại:</b> " + esc(m.phone) + "</p>" +
    "<p><b>Chủ đề:</b> " + esc(m.topic) + "</p>" +
    '<p><b>Nội dung:</b></p><p style="white-space:pre-wrap">' + esc(m.message) + "</p></div>" +
    '<button id="toggle-done" class="btn-save" type="button" style="margin-top:12px">' +
    (done ? "Đánh dấu là mới" : "Đánh dấu đã xử lý") + "</button>");
  document.getElementById("toggle-done").addEventListener("click", function () {
    const list = getData(KEY.contacts);
    list.find(function (x) { return x.id === id; }).status = done ? "Mới" : "Đã xử lý";
    setData(KEY.contacts, list);
    closeModal();
    renderContacts();
    showToast("Đã cập nhật trạng thái");
  });
}
function deleteContact(id) {
  if (!confirm("Xóa liên hệ này?")) return;
  setData(KEY.contacts, getData(KEY.contacts).filter(function (m) { return m.id !== id; }));
  renderContacts();
  showToast("Đã xóa liên hệ");
}