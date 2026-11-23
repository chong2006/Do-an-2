/* ===== KHỐI 1: CẤU HÌNH PHÒNG VÀ MỨC CÔNG SUẤT =====
   cats: mã danh mục nên gợi ý cho loại phòng đó (khớp với mã trong dữ liệu mẫu: cat1...cat6)
   area: diện tích mặc định khi bấm chọn phòng */
const ROOMS = [
  { id: "bedroom", name: "Phòng ngủ", note: "Gió êm, dễ ngủ", area: 15, cats: ["cat3", "cat2", "cat6"],
    tip: "Phòng ngủ cần gió êm, ít ồn. Nên xem quạt hộp, quạt treo tường hoặc quạt trần." },
  { id: "living", name: "Phòng khách", note: "Không gian rộng, nhiều người", area: 25, cats: ["cat1", "cat6", "cat4"],
    tip: "Phòng khách cần luồng gió lan rộng. Quạt đứng, quạt trần hoặc quạt điều hòa là lựa chọn hợp lý." },
  { id: "kitchen", name: "Nhà bếp", note: "Thoáng khí, gọn gàng", area: 10, cats: ["cat2", "cat3"],
    tip: "Nhà bếp nên chọn quạt treo tường hoặc quạt hộp để tiết kiệm chỗ và dễ vệ sinh." },
  { id: "office", name: "Văn phòng", note: "Gió đều, làm việc yên tĩnh", area: 30, cats: ["cat1", "cat6", "cat4"],
    tip: "Văn phòng cần gió đều và vận hành êm. Quạt đứng, quạt trần hoặc quạt điều hòa đều phù hợp." },
  { id: "shop", name: "Quán ăn, cửa hàng", note: "Đông khách, cần làm mát nhanh", area: 40, cats: ["cat4", "cat5", "cat1"],
    tip: "Không gian đông người nên ưu tiên quạt điều hòa hoặc quạt công nghiệp để làm mát nhanh." },
  { id: "factory", name: "Nhà xưởng, kho bãi", note: "Lưu lượng gió lớn", area: 120, cats: ["cat5"],
    tip: "Nhà xưởng, kho bãi cần lưu lượng gió lớn và độ bền cao. Hãy chọn quạt công nghiệp." }
];
// Công suất gợi ý theo diện tích (con số tham khảo): area <= max thì dùng mức đó
const AREA_TIERS = [
  { max: 15, minW: 30, maxW: 55 },
  { max: 30, minW: 45, maxW: 80 },
  { max: 60, minW: 70, maxW: 130 },
  { max: Infinity, minW: 100, maxW: 400 }
];
const state = { room: "", area: 20 };

/* ===== KHỐI 2: KHỞI CHẠY (chung.js đã nạp dữ liệu mẫu, getData, addToCart, formatPrice...) ===== */
document.addEventListener("DOMContentLoaded", function () {
  renderRooms();
  const fromUrl = new URLSearchParams(window.location.search).get("room");   // VD: chonphong.html?room=bedroom
  if (fromUrl) selectRoom(fromUrl);
  else render();

  document.getElementById("room-list").addEventListener("click", function (e) {
    const btn = e.target.closest("button[data-room]");
    if (btn) selectRoom(btn.dataset.room);
  });
  document.getElementById("area").addEventListener("input", function (e) {
    state.area = parseInt(e.target.value, 10);
    render();
  });
  document.getElementById("product-list").addEventListener("click", handleAddClick);
});

/* ===== KHỐI 3: CHỌN PHÒNG ===== */
function renderRooms() {
  document.getElementById("room-list").innerHTML = ROOMS.map(function (r) {
    return '<button type="button" class="room" data-room="' + r.id + '"><b>' + r.name + "</b><span>" + r.note + "</span></button>";
  }).join("");
}
function selectRoom(id) {
  const room = ROOMS.find(function (r) { return r.id === id; });
  if (!room) return;
  state.room = id;
  state.area = room.area;                              // đặt diện tích mặc định cho loại phòng
  document.getElementById("area").value = room.area;
  render();
}

/* ===== KHỐI 4: TÍNH GỢI Ý ===== */
function getPowerRange(area) {
  return AREA_TIERS.find(function (t) { return area <= t.max; });
}
// Lấy số watt từ chuỗi công suất: "55W" -> 55
function watts(p) {
  const n = parseInt(p.power, 10);
  return isNaN(n) ? 0 : n;
}
// Lọc sản phẩm theo danh mục của phòng, rồi xếp: đúng khoảng công suất trước, gần mức giữa hơn thì trước
function getSuggestions(room, range) {
  const mid = (range.minW + range.maxW) / 2;
  return getData(KEY.products)
    .filter(function (p) { return room.cats.indexOf(p.categoryId) !== -1; })
    .map(function (p) {
      const w = watts(p);
      return { product: p, fit: w >= range.minW && w <= range.maxW, gap: Math.abs(w - mid) };
    })
    .sort(function (a, b) { return (b.fit - a.fit) || (a.gap - b.gap); });
}

/* ===== KHỐI 5: HIỂN THỊ KẾT QUẢ ===== */
function render() {
  document.getElementById("area-text").textContent = state.area;
  const room = ROOMS.find(function (r) { return r.id === state.room; });

  document.querySelectorAll(".room").forEach(function (b) {
    b.classList.toggle("active", b.dataset.room === state.room);
  });
  show("advice", !!room);
  document.getElementById("hint").classList.toggle("hidden", !!room);
  if (!room) { document.getElementById("product-list").innerHTML = ""; return; }

  const range = getPowerRange(state.area);
  document.getElementById("advice-title").textContent = room.name + " khoảng " + state.area + " m²";
  document.getElementById("advice-text").textContent = room.tip;
  document.getElementById("advice-power").textContent =
    "Công suất gợi ý: khoảng " + range.minW + " – " + range.maxW + "W (mang tính tham khảo).";

  const list = getSuggestions(room, range);
  if (list.length === 0) {
    document.getElementById("hint").textContent = "Hiện chưa có sản phẩm phù hợp cho loại phòng này.";
    document.getElementById("hint").classList.remove("hidden");
  }
  document.getElementById("product-list").innerHTML = list.map(function (s) {
    const p = s.product;
    const old = p.oldPrice ? "<del>" + formatPrice(p.oldPrice) + "</del>" : "";
    const link = "chitiet.html?id=" + p.id;
    return '<div class="product">' +
      '<span class="tag ' + (s.fit ? "fit" : "ref") + '">' + (s.fit ? "Phù hợp" : "Tham khảo") + "</span>" +
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