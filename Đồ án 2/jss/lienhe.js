/* ===== KHỐI 1: KHỞI CHẠY (chung.js đã nạp getData, setData, KEY, getCurrentUser, show, setMsg...) ===== */
document.addEventListener("DOMContentLoaded", function () {
  prefillForm();
  document.getElementById("contact-form").addEventListener("submit", handleSubmit);
  document.getElementById("ct-message").addEventListener("input", updateCounter);
  document.getElementById("again-btn").addEventListener("click", function () {
    show("sent-box", false);
    show("contact-form", true);
    prefillForm();
  });
});

/* ===== KHỐI 2: ĐIỀN SẴN THÔNG TIN + ĐẾM KÝ TỰ ===== */
// Đã đăng nhập thì điền sẵn họ tên, email, số điện thoại
function prefillForm() {
  const user = getCurrentUser();
  if (!user) return;
  document.getElementById("ct-name").value = user.fullName;
  document.getElementById("ct-email").value = user.email;
  document.getElementById("ct-phone").value = user.phone;
}
function updateCounter() {
  document.getElementById("ct-count").textContent = document.getElementById("ct-message").value.length;
}

/* ===== KHỐI 3: GỬI LIÊN HỆ (lưu vào localStorage, admin xem ở trang quản trị) ===== */
function handleSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById("ct-phone").value.trim();
  const message = document.getElementById("ct-message").value.trim();
  if (!/^0\d{9}$/.test(phone)) return setMsg("ct-msg", "Số điện thoại gồm 10 số, bắt đầu bằng 0.", false);
  if (message.length < 10) return setMsg("ct-msg", "Nội dung cần ít nhất 10 ký tự.", false);

  const user = getCurrentUser();
  const list = getData(KEY.contacts);
  list.push({
    id: "lh" + Date.now(),
    userId: user ? user.id : "",          // để trống nếu là khách vãng lai
    name: document.getElementById("ct-name").value.trim(),
    email: document.getElementById("ct-email").value.trim(),
    phone: phone,
    topic: document.getElementById("ct-topic").value,
    message: message,
    status: "Mới",
    createdAt: new Date().toISOString()
  });
  setData(KEY.contacts, list);

  document.getElementById("contact-form").reset();
  updateCounter();
  setMsg("ct-msg", "", true);
  show("contact-form", false);
  show("sent-box", true);
}