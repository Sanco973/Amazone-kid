var desiredLength = 1;
var batdau = "- - -";

var tocdo = 80;
var timecham = tocdo;
var cham = 0;

var ArrDAIKIN = [];
var ArrDAIKINbackup = [];
var index = 0;

var Start = false;
var previous = 0;
var startTime;
var kiemtrachay = false;

// ==========================
// Helpers
// ==========================
function ensureArray(key) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify([]));
    return [];
  }
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v;
  } catch (e) { }
  localStorage.setItem(key, JSON.stringify([]));
  return [];
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ==========================
// Background storage
// ==========================
function readStoredBackground() {
  const raw = localStorage.getItem("backgroundVideo");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : raw;
  } catch (e) {
    return raw;
  }
}

function writeStoredBackground(url) {
  if (!url) return;
  localStorage.setItem("backgroundVideo", JSON.stringify(url));
}

// ==========================
// Nhập danh sách dự phòng
// ==========================
function nhapdanhsachquay() {
  let inputText = prompt("Nhập danh sách (mỗi dòng 1 người/số):");
  if (!inputText) return;

  let lines = inputText
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  let set = new Set();
  for (let s of lines) {
    if (s !== "NO") set.add(String(s));
  }
  ArrDAIKIN = Array.from(set);

  if (ArrDAIKIN.length === 0) {
    alert("Không có dữ liệu hợp lệ để quay!");
    return;
  }

  ArrDAIKINbackup = [...ArrDAIKIN];
  shuffleArray(ArrDAIKIN);

  localStorage.setItem("ArrDAIKIN", JSON.stringify(ArrDAIKIN));
  localStorage.setItem("ArrDAIKINbackup", JSON.stringify(ArrDAIKINbackup));
  ensureArray("DAIKINDaTrungThuong");
  localStorage.setItem("ArrDAIKINTrungThuong", JSON.stringify(null));
}

function init() {
  ArrDAIKIN = JSON.parse(localStorage.getItem("ArrDAIKIN")) || [];
  ArrDAIKINbackup = JSON.parse(localStorage.getItem("ArrDAIKINbackup")) || [];

  ensureArray("DAIKINDaTrungThuong");

  const currentBg = readStoredBackground();
  if (!currentBg) {
    writeStoredBackground("assets/background/video1.mp4");
  } else {
    const raw = localStorage.getItem("backgroundVideo");
    if (raw && raw[0] !== '"') writeStoredBackground(currentBg);
  }

  if (!ArrDAIKIN || ArrDAIKIN.length === 0) {
    nhapdanhsachquay();
    ArrDAIKIN = JSON.parse(localStorage.getItem("ArrDAIKIN")) || [];
  }

  $("#digits").html(batdau);

  var savedBackground = readStoredBackground();
  let videoElement = document.getElementById("background-video");
  if (videoElement && savedBackground) changeBackground(savedBackground);
}

// ==========================
// HÀM TẠO LƯỚI GRID 5 CỘT
// ==========================
// ==========================
// HÀM TẠO LƯỚI GRID HIỂN THỊ THÔNG MINH
// ==========================
function renderDigitsGrid(values) {
  if (values.length <= 1) return values[0] || batdau;
  
  let rows = [];
  const maxCols = 5;
  let remainder = values.length % maxCols;
  let startIndex = 0;

  // 1. Nếu số lượng không chia hết cho 5, đưa phần dư (số lượng ít) lên hàng đầu tiên
  if (remainder > 0) {
    rows.push(values.slice(0, remainder));
    startIndex = remainder;
  }

  // 2. Phân bổ các số còn lại thành từng hàng, mỗi hàng đủ 5 cột
  while (startIndex < values.length) {
    rows.push(values.slice(startIndex, startIndex + maxCols));
    startIndex += maxCols;
  }

  // 3. Render HTML bằng Flexbox để canh giữa tuyệt đối cho mọi hàng
  let html = `<div style="display: flex; flex-direction: column; gap: 30px; align-items: center; width: 100%; line-height: 1.2;">`;
  
  for (let row of rows) {
    html += `<div style="display: flex; gap: 80px; justify-content: center; flex-wrap: nowrap;">`;
    for (let v of row) {
      html += `<div style="white-space: nowrap; text-align: center;">${v}</div>`;
    }
    html += `</div>`;
  }
  
  html += `</div>`;
  
  return html;
}

// ==========================
// QUAY SỐ (HIỆU ỨNG CHẠY)
// ==========================
function setRandomNumber(timestamp) {
  ArrDAIKIN = JSON.parse(localStorage.getItem("ArrDAIKIN")) || [];
  if (Start === false) return;
  if (!previous) previous = timestamp;

  var progress = timestamp - previous;
  if (progress > tocdo && ArrDAIKIN.length > 0) {
    previous = timestamp;

    let count = parseInt(localStorage.getItem("spinCount")) || 1;
    count = Math.min(count, ArrDAIKIN.length);

    let currentValues = [];
    for(let i = 0; i < count; i++) {
       let r = Math.floor(Math.random() * ArrDAIKIN.length);
       currentValues.push(ArrDAIKIN[r]);
    }
    $("#digits").html(renderDigitsGrid(currentValues));
  }

  requestAnimationFrame(setRandomNumber);
}

function startAnimation() {
  var element = document.getElementById("digits");
  var element2 = document.getElementById("digits2");

  element.classList.remove("run-animation");
  element2.classList.remove("run-animation");
  void element.offsetWidth;
  void element2.offsetWidth;
  element.classList.add("run-animation");
  element2.classList.add("run-animation");
}

// ==========================
// QUAY SỐ CHẬM DẦN & CHỐT KẾT QUẢ
// ==========================
function setRandomNumber_Cham(timestamp) {
  ArrDAIKIN = JSON.parse(localStorage.getItem("ArrDAIKIN")) || [];
  if (!startTime) startTime = timestamp;

  if (!ArrDAIKIN || ArrDAIKIN.length === 0) {
    alert("Đã hết danh sách để quay!");
    kiemtrachay = false;
    $("#start").show();
    $("#stop").hide();
    return;
  }

  let count = parseInt(localStorage.getItem("spinCount")) || 1;
  count = Math.min(count, ArrDAIKIN.length);

  if (cham < 5) {
    if (timestamp - previous >= timecham) {
      previous = timestamp;
      let currentValues = [];
      for(let i = 0; i < count; i++) {
         let r = Math.floor(Math.random() * ArrDAIKIN.length);
         currentValues.push(ArrDAIKIN[r]);
      }
      $("#digits").html(renderDigitsGrid(currentValues));
      cham++;
      timecham += tocdo;
    }
    requestAnimationFrame(setRandomNumber_Cham);
    return;
  }

  // ✅ CHỐT KẾT QUẢ VÀ LƯU
  cham = 0;
  timecham = tocdo;

  let finalWinners = [];
  let available = [...ArrDAIKIN];
  let needed = count;

  // Xét giải ép trúng
  var forcedWinner = JSON.parse(localStorage.getItem("ArrDAIKINTrungThuong"));
  if (forcedWinner != null && available.includes(forcedWinner)) {
    finalWinners.push(forcedWinner);
    available = available.filter(item => item !== forcedWinner);
    needed--;
  }

  // Random các slot còn lại
  for(let i = 0; i < needed; i++) {
      if (available.length === 0) break;
      let r = Math.floor(Math.random() * available.length);
      finalWinners.push(available[r]);
      available.splice(r, 1);
  }

  // Xáo trộn vị trí hiển thị an toàn
  shuffleArray(finalWinners);

  $("#digits").html(renderDigitsGrid(finalWinners));
  
  // Kích hoạt pháo hoa
  try {
    startAnimation();
    startConfettiLoop();
  } catch(e) {
    console.error("Lỗi hiệu ứng:", e);
  }

  // Ghi nhận vào danh sách trúng thưởng
  var DAIKINDaTrungThuong = ensureArray("DAIKINDaTrungThuong");
  finalWinners.forEach(w => {
      DAIKINDaTrungThuong.push(w);
      ArrDAIKIN = ArrDAIKIN.filter(item => item !== w);
  });

  localStorage.setItem("ArrDAIKINTrungThuong", JSON.stringify(null));
  localStorage.setItem("ArrDAIKIN", JSON.stringify(ArrDAIKIN));
  localStorage.setItem("DAIKINDaTrungThuong", JSON.stringify(DAIKINDaTrungThuong));

  kiemtrachay = false;
  shuffleArray(ArrDAIKIN);

  $("#start").show();
  $("#stop").hide();
}

function fnStart() {
  if (Start === true || kiemtrachay === true) return;
  Start = true;
  kiemtrachay = true;
  previous = 0;

  $("#stop").show();
  $("#start").hide();

  requestAnimationFrame(setRandomNumber);
}

function fnStop() {
  if (Start === false) return;
  $("#stop").hide();
  Start = false;
  previous = 0;
  requestAnimationFrame(setRandomNumber_Cham);
}

// ==========================
// Background apply
// ==========================
function changeBackground(backgroundUrl) {
  let videoElement = document.getElementById("background-video");
  if (!videoElement) return;

  videoElement.onerror = function () {
    const fallback = "assets/background/video1.mp4";
    if (videoElement.src !== fallback) {
      videoElement.src = fallback;
      writeStoredBackground(fallback);
    }
  };

  videoElement.src = backgroundUrl;
  writeStoredBackground(backgroundUrl);
}

window.addEventListener("storage", function (event) {
  if (event.key === "backgroundVideo") {
    const url = readStoredBackground();
    if (url) changeBackground(url);
  }
  if (event.key === "digitsPosition") {
    let digitsPosition = null;
    try { digitsPosition = JSON.parse(localStorage.getItem("digitsPosition")); } catch (e) { }
    if (digitsPosition) {
      $("#digits").css({ left: digitsPosition.left + "px", top: digitsPosition.top + "px" });
    } else {
      $("#digits").css({ left: "", top: "" });
    }
  }

  if (event.key === "digitsSize") {
    const digitsSize = localStorage.getItem("digitsSize");
    if (digitsSize) {
      $("#digits").css({ fontSize: digitsSize + "px" });
    } else {
      $("#digits").css({ fontSize: "" });
    }
  }
});

$("#start").on("click", fnStart);
$("#stop").on("click", fnStop);

$(document).ready(function () {
  init();

  let digitsPosition = JSON.parse(localStorage.getItem("digitsPosition"));
  let digitsSize = localStorage.getItem("digitsSize");

  if (digitsPosition) {
    $("#digits").css({ left: digitsPosition.left + "px", top: digitsPosition.top + "px" });
  }
  if (digitsSize) {
    $("#digits").css({ fontSize: digitsSize + "px" });
  }

  var savedRange = localStorage.getItem("NumberStartEnd");
  if (savedRange) $("#number-range").html(savedRange);
});

$(document).keydown(function (e) {
  let digits = $("#digits");
  let pos = digits.position();

  switch (e.which) {
    case 74: // j
      digits.css({ left: pos.left - 10 + "px" });
      break;
    case 73: // i
      digits.css({ top: pos.top - 10 + "px" });
      break;
    case 76: // l
      digits.css({ left: pos.left + 10 + "px" });
      break;
    case 75: // k
      digits.css({ top: pos.top + 10 + "px" });
      break;
    case 189: // -
      let newSize = prompt("Nhập kích thước mới cho SỐ (px):");
      if (newSize && !isNaN(newSize)) {
        digits.css({ fontSize: newSize + "px" });
        localStorage.setItem("digitsSize", newSize);
      }
      break;
    case 187: // =
      digits.removeAttr("style");
      localStorage.removeItem("digitsPosition");
      localStorage.removeItem("digitsSize");
      alert("Khôi phục tất cả cài đặt!");
      break;
    case 49:
      changeBackground("assets/background/video1.mp4");
      break;
    case 50:
      changeBackground("assets/background/video2.mp4");
      break;
    case 51:
      changeBackground("assets/background/video3.mp4");
      break;
    case 81: // Q nhập lại danh sách
      if (!kiemtrachay) nhapdanhsachquay();
      break;
    default:
      return;
  }

  localStorage.setItem("digitsPosition", JSON.stringify(digits.position()));
  e.preventDefault();
});

window.addEventListener("storage", function (event) {
  if (event.key === "btnStart") {
    let nutStart = JSON.parse(localStorage.getItem("btnStart"));
    if (nutStart === true) fnStart();
    if (nutStart === false) fnStop();
  }
  if (event.key === "Reset_So") {
    $("#digits").html(batdau);
    stopConfetti();
  }
});

// ==========================
// Confetti Engine (Fixed)
// ==========================
let __confetti = {
  running: false,
  raf: null,
  interval: null,
  timeout: null,
  canvas: null,
  ctx: null,
  w: 0,
  h: 0,
  particles: [],
};

function __confettiResize() {
  if (!__confetti.canvas) return;
  const dpr = window.devicePixelRatio || 1;
  __confetti.w = window.innerWidth;
  __confetti.h = window.innerHeight;

  __confetti.canvas.style.width = __confetti.w + "px";
  __confetti.canvas.style.height = __confetti.h + "px";
  __confetti.canvas.width = Math.floor(__confetti.w * dpr);
  __confetti.canvas.height = Math.floor(__confetti.h * dpr);

  __confetti.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function __confettiSpawnBurst(count = 120) {
  const w = __confetti.w;
  const h = __confetti.h;

  const originX = w * (0.1 + Math.random() * 0.8);
  const originY = h * (0.12 + Math.random() * 0.55);

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 6;

    __confetti.particles.push({
      x: originX + (Math.random() * 24 - 12),
      y: originY + (Math.random() * 24 - 12),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      g: 0.12 + Math.random() * 0.08,
      drag: 0.985,
      size: 4 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      rotSpd: (Math.random() - 0.5) * 0.2,
      life: 240 + Math.floor(Math.random() * 120),
      color: `hsl(${Math.floor(Math.random() * 360)}, 90%, 60%)`,
    });
  }
}

function __confettiTick() {
  if (!__confetti.running) return;

  const ctx = __confetti.ctx;
  const w = __confetti.w;
  const h = __confetti.h;

  ctx.clearRect(0, 0, w, h);

  const next = [];
  for (const p of __confetti.particles) {
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.g;

    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.rotSpd;
    p.life -= 1;

    if (p.life > 0 && p.y < h + 60) next.push(p);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
    ctx.restore();
  }
  __confetti.particles = next;

  __confetti.raf = requestAnimationFrame(__confettiTick);
}

function startConfettiLoop() {
  if (!__confetti.canvas) {
    __confetti.canvas = document.getElementById("fireworksCanvas");
    if (!__confetti.canvas) return;

    __confetti.ctx = __confetti.canvas.getContext("2d");
    __confetti.canvas.style.position = "fixed";
    __confetti.canvas.style.left = "0";
    __confetti.canvas.style.top = "0";
    __confetti.canvas.style.pointerEvents = "none";
    __confetti.canvas.style.zIndex = "9999";

    __confettiResize();
    window.addEventListener("resize", __confettiResize);
  }

  // Xóa mọi trạng thái kẹt cũ
  stopConfetti();

  __confetti.running = true;
  __confetti.particles = [];

  __confettiSpawnBurst(160);

  __confetti.interval = setInterval(() => {
    const bursts = 2 + Math.floor(Math.random() * 3);
    for (let b = 0; b < bursts; b++) __confettiSpawnBurst(70);
  }, 1200);

  __confettiTick();

  if (__confetti.timeout) {
    clearTimeout(__confetti.timeout);
  }
  __confetti.timeout = setTimeout(() => {
    stopConfetti();
  }, 20000);
}

function stopConfetti() {
  __confetti.running = false;

  if (__confetti.interval) {
    clearInterval(__confetti.interval);
    __confetti.interval = null;
  }
  if (__confetti.raf) {
    cancelAnimationFrame(__confetti.raf);
    __confetti.raf = null;
  }
  if (__confetti.timeout) {
    clearTimeout(__confetti.timeout);
    __confetti.timeout = null;
  }
  if (__confetti.ctx) {
    __confetti.ctx.clearRect(0, 0, __confetti.w, __confetti.h);
  }
  __confetti.particles = [];
}