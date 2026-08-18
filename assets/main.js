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
// ✅ Background storage (FIX giật/đứng do JSON.parse)
// ==========================
function readStoredBackground() {
  const raw = localStorage.getItem("backgroundVideo");
  if (!raw) return null;

  // hỗ trợ cả 2 kiểu:
  // 1) kiểu mới: JSON string -> "\"assets/...mp4\""
  // 2) kiểu cũ: string thô -> "assets/...mp4"
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : raw;
  } catch (e) {
    return raw;
  }
}

function writeStoredBackground(url) {
  if (!url) return;
  // lưu kiểu mới (ổn định, không gây JSON.parse crash)
  localStorage.setItem("backgroundVideo", JSON.stringify(url));
}

// ==========================
// ✅ Cho index.html tự nhập danh sách nếu chưa có
// ==========================
function nhapdanhsachquay() {
  let inputText = prompt("Nhập danh sách (mỗi dòng 1 người/số):");
  if (!inputText) return;

  let lines = inputText
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  // unique
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

  // đảm bảo các key không null
  ensureArray("DAIKINDaTrungThuong");
  localStorage.setItem("ArrDAIKINTrungThuong", JSON.stringify(null));
}

function init() {
  ArrDAIKIN = JSON.parse(localStorage.getItem("ArrDAIKIN")) || [];
  ArrDAIKINbackup = JSON.parse(localStorage.getItem("ArrDAIKINbackup")) || [];

  // đảm bảo winners luôn là mảng
  ensureArray("DAIKINDaTrungThuong");

  // background mặc định + migrate dữ liệu cũ
  const currentBg = readStoredBackground();
  if (!currentBg) {
    writeStoredBackground("assets/background/video1.mp4");
  } else {
    // migrate string thô -> JSON string
    const raw = localStorage.getItem("backgroundVideo");
    if (raw && raw[0] !== '"') writeStoredBackground(currentBg);
  }

  if (!ArrDAIKIN || ArrDAIKIN.length === 0) {
    nhapdanhsachquay();
    ArrDAIKIN = JSON.parse(localStorage.getItem("ArrDAIKIN")) || [];
  }

  $("#digits").html(batdau);

  // apply background đã lưu
  var savedBackground = readStoredBackground();
  let videoElement = document.getElementById("background-video");
  if (videoElement && savedBackground) changeBackground(savedBackground);
}

// Hàm hỗ trợ tạo lưới CSS hiển thị nhiều số
function renderDigitsGrid(values) {
  if (values.length <= 1) return values[0] || batdau;

  // Nếu hiển thị nhiều số, tự động tạo lưới. Tối đa 5 cột.
  let cols = values.length >= 5 ? 5 : values.length;
  
  return `<div style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 20px 4vw; justify-items: center; align-items: center; width: 90vw; line-height: 1.3;">
    ${values.map(v => `<div style="white-space: nowrap;">${v}</div>`).join('')}
  </div>`;
}

function setRandomNumber(timestamp) {
  ArrDAIKIN = JSON.parse(localStorage.getItem("ArrDAIKIN")) || [];
  if (Start === false) return;
  if (!previous) previous = timestamp;

  var progress = timestamp - previous;
  if (progress > tocdo && ArrDAIKIN.length > 0) {
    previous = timestamp;

    // Lấy số lượng cần quay
    let count = parseInt(localStorage.getItem("spinCount")) || 1;
    count = Math.min(count, ArrDAIKIN.length); // Không quay vượt quá số người trong danh sách

    let currentValues = [];
    for(let i = 0; i < count; i++) {
       let r = Math.floor(Math.random() * ArrDAIKIN.length);
       currentValues.push(ArrDAIKIN[r]);
    }
    $("#digits").html(renderDigitsGrid(currentValues));
  }

  requestAnimationFrame(setRandomNumber);
}

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

  // ✅ KẾT THÚC QUAY - CHỐT KẾT QUẢ ĐẢM BẢO KHÔNG TRÙNG LẶP
  cham = 0;
  timecham = tocdo;

  let finalWinners = [];
  let available = [...ArrDAIKIN]; // Danh sách có thể trúng
  let needed = count;

  // 1. Ưu tiên xét ép trúng (nếu có)
  var forcedWinner = JSON.parse(localStorage.getItem("ArrDAIKINTrungThuong"));
  if (forcedWinner != null && available.includes(forcedWinner)) {
    finalWinners.push(forcedWinner);
    available = available.filter(item => item !== forcedWinner);
    needed--; // Đã có 1 giải ép, chỉ cần random các giải còn lại
  }

  // 2. Random các slot còn lại
  for(let i = 0; i < needed; i++) {
      if (available.length === 0) break;
      let r = Math.floor(Math.random() * available.length);
      finalWinners.push(available[r]);
      available.splice(r, 1); // Rút ra khỏi danh sách tạm để không trùng nhau
  }

  // Xáo trộn vị trí hiển thị để giải ép trúng không luôn nằm ở vị trí đầu tiên
  finalWinners.sort(() => 0.5 - Math.random());

  // Hiển thị lưới kết quả
  $("#digits").html(renderDigitsGrid(finalWinners));
  startAnimation();
  startConfettiLoop();

  // 3. Ghi nhận TẤT CẢ vào danh sách trúng thưởng
  var DAIKINDaTrungThuong = ensureArray("DAIKINDaTrungThuong");
  finalWinners.forEach(w => {
      DAIKINDaTrungThuong.push(w);
      ArrDAIKIN = ArrDAIKIN.filter(item => item !== w); // Rút người này khỏi hòm phiếu
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
// Background apply (safe + fallback)
// ==========================
function changeBackground(backgroundUrl) {
  let videoElement = document.getElementById("background-video");
  if (!videoElement) return;

  // fallback nếu video lỗi
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

// nhận background đổi từ control
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
      $("#digits").css({ left: "", top: "" }); // về mặc định CSS
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

  // restore vị trí/kích thước digits
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

// phím tắt
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

// sync từ control.html
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
// Confetti Engine (loop until Reset)
// uses <canvas id="fireworksCanvas"></canvas>
// ==========================
let __confetti = {
  running: false,
  raf: null,
  interval: null,
  timeout: null,   // ✅ thêm
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

  // ✅ chọn vị trí ngẫu nhiên cho mỗi burst
  // (ưu tiên vùng nhìn đẹp: tránh sát mép và không quá thấp)
  const originX = w * (0.1 + Math.random() * 0.8);   // 10% -> 90% chiều ngang
  const originY = h * (0.12 + Math.random() * 0.55); // 12% -> 67% chiều dọc

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

  // update + draw
  const next = [];
  for (const p of __confetti.particles) {
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.g;

    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.rotSpd;
    p.life -= 1;

    // giữ nếu còn sống và chưa ra khỏi màn hình quá xa
    if (p.life > 0 && p.y < h + 60) next.push(p);

    // draw (rect xoay)
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
  // chỉ init 1 lần
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

  // ✅ nếu đang chạy thì restart timer 20s (không tạo thêm interval)
  if (!__confetti.running) {
    __confetti.running = true;

    // burst ngay lập tức + lặp burst
    __confettiSpawnBurst(160);
    __confetti.interval = setInterval(() => {
      // 2–4 điểm burst ngẫu nhiên mỗi nhịp (nhẹ)
      const bursts = 2 + Math.floor(Math.random() * 3);
      for (let b = 0; b < bursts; b++) __confettiSpawnBurst(70);
    }, 1200);

    __confettiTick();
  }

  // ✅ reset timer tự tắt sau 20 giây
  if (__confetti.timeout) {
    clearTimeout(__confetti.timeout);
    __confetti.timeout = null;
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

  // ✅ thêm
  if (__confetti.timeout) {
    clearTimeout(__confetti.timeout);
    __confetti.timeout = null;
  }

  if (__confetti.ctx) {
    __confetti.ctx.clearRect(0, 0, __confetti.w, __confetti.h);
  }
  __confetti.particles = [];
}