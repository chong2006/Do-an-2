/* ===== KHỐI 1: KHỞI CHẠY (chung.js đã nạp getData, setData, KEY, getCurrentUser...) ===== */
document.addEventListener("DOMContentLoaded", function () {
  showView();   // hiện form đăng nhập hoặc thông tin tài khoản
  document.getElementById("tab-login").addEventListener("click", function () { switchTab("login"); });
  document.getElementById("tab-register").addEventListener("click", function () { switchTab("register"); });
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("register-form").addEventListener("submit", handleRegister);
  document.getElementById("profile-form").addEventListener("submit", handleSaveProfile);
  document.getElementById("logout-btn").addEventListener("click", handleLogout);
});

/* ===== KHỐI 2: CHUYỂN GIAO DIỆN ===== */
function show(id, visible) { document.getElementById(id).classList.toggle("hidden", !visible); }
function setMsg(id, text, ok) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "err");
}
function switchTab(which) {
  show("login-form", which === "login");
  show("register-form", which === "register");
  document.getElementById("tab-login").classList.toggle("active", which === "login");
  document.getElementById("tab-register").classList.toggle("active", which === "register");
}
function showView() {
  const user = getCurrentUser();
  show("auth-box", !user);
  show("profile-box", !!user);
  if (user) fillProfile(user);
}
function fillProfile(user) {
  document.getElementById("avatar").textContent = user.fullName.trim().charAt(0).toUpperCase();
  document.getElementById("profile-name").textContent = user.fullName;
  document.getElementById("profile-role").textContent = user.role === "admin" ? "Quản trị viên" : "Khách hàng";
  document.getElementById("pf-name").value = user.fullName;
  document.getElementById("pf-email").value = user.email;
  document.getElementById("pf-phone").value = user.phone;
  document.getElementById("pf-address").value = user.address || "";
  show("admin-link", user.role === "admin");   // chỉ admin thấy liên kết quản trị
}

/* ===== KHỐI 3: ĐĂNG NHẬP ===== */
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const pass = document.getElementById("login-pass").value;
  const user = getData(KEY.users).find(function (u) { return u.email === email && u.password === pass; });
  if (!user) return setMsg("login-msg", "Email hoặc mật khẩu không đúng.", false);
  localStorage.setItem(KEY.currentUser, user.id);   // lưu phiên đăng nhập
  updateAccountButton();                            // đổi chữ trên header (hàm trong chung.js)
  showView();
}

/* ===== KHỐI 4: ĐĂNG KÝ ===== */
function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const phone = document.getElementById("reg-phone").value.trim();
  const pass = document.getElementById("reg-pass").value;
  const pass2 = document.getElementById("reg-pass2").value;
  const users = getData(KEY.users);

  if (pass.length < 6) return setMsg("reg-msg", "Mật khẩu cần tối thiểu 6 ký tự.", false);
  if (pass !== pass2) return setMsg("reg-msg", "Hai mật khẩu chưa trùng nhau.", false);
  if (!/^0\d{9}$/.test(phone)) return setMsg("reg-msg", "Số điện thoại gồm 10 số, bắt đầu bằng 0.", false);
  if (users.some(function (u) { return u.email === email; })) return setMsg("reg-msg", "Email này đã được đăng ký.", false);

  users.push({ id: "u" + Date.now(), fullName: name, email: email, phone: phone,
               address: "", password: pass, role: "customer" });
  setData(KEY.users, users);
  setMsg("reg-msg", "", true);
  document.getElementById("register-form").reset();
  document.getElementById("login-email").value = email;   // điền sẵn email cho bước đăng nhập
  switchTab("login");
  setMsg("login-msg", "Đăng ký thành công, hãy đăng nhập.", true);
}

/* ===== KHỐI 5: CẬP NHẬT THÔNG TIN & ĐĂNG XUẤT ===== */
function handleSaveProfile(e) {
  e.preventDefault();
  const phone = document.getElementById("pf-phone").value.trim();
  if (!/^0\d{9}$/.test(phone)) return setMsg("pf-msg", "Số điện thoại gồm 10 số, bắt đầu bằng 0.", false);
  const current = getCurrentUser();
  const users = getData(KEY.users).map(function (u) {
    if (u.id !== current.id) return u;
    u.fullName = document.getElementById("pf-name").value.trim();
    u.phone = phone;
    u.address = document.getElementById("pf-address").value.trim();
    return u;
  });
  setData(KEY.users, users);
  updateAccountButton();
  fillProfile(getCurrentUser());
  setMsg("pf-msg", "Đã lưu thay đổi.", true);
}
function handleLogout() {
  localStorage.removeItem(KEY.currentUser);
  updateAccountButton();
  showView();
  switchTab("login");
}