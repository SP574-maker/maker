function submitAirdrop() {
    const tg = Telegram.WebApp;

    const payload = {
        event: "airdrop_claim",
        user_id: tg?.initDataUnsafe?.user?.id || "-",
        username: tg?.initDataUnsafe?.user?.username || "-",
        timestamp: new Date().toISOString()
    };

    tg.sendData(JSON.stringify(payload)); // Надсилаємо в бот

    tg.expand(); // Розгортаємо WebApp

    // 💬 Відображення статусу
    const container = document.querySelector(".container");
    if (container) {
        container.innerHTML = `
            <h3 style="color:green;text-align:center">⏳ Отримання Airdrop…</h3>
        `;
    }

    // ✅ Через 1.5 секунди переходимо на airprofile.html
    setTimeout(() => {
        window.location.href = "airprofile.html";
    }, 1500);
}
