let participants = [];
let winners = [];
let revealStep = 0;
let isRevealPhase = false;

const btnDraw = document.getElementById('btn-draw');
const btnReset = document.getElementById('btn-reset');
const participantCountSpan = document.getElementById('participant-count');
const winnerCountSpan = document.getElementById('winner-count');
const participantsList = document.getElementById('participants-list');
const winnersList = document.getElementById('winners-list');
const displayArea = document.getElementById('display-area');

function adjustWinnerFontSize() {
    const container = document.getElementById('display-area');
    if (!container) return;

    const icon = container.querySelector('.large-icon');
    const nameValue = container.querySelector('.info-value.name');
    const otherInfoValues = container.querySelectorAll('.info-value:not(.name)');
    const initialMessage = container.querySelector('.initial-message');

    const baseContainer = container.parentElement;
    if (!baseContainer) return;

    const baseSize = Math.min(baseContainer.clientWidth, baseContainer.clientHeight);
    const usableSize = baseSize * 0.9;

    if (icon) icon.style.fontSize = `${usableSize * 0.25}px`;
    if (initialMessage) initialMessage.style.fontSize = `${usableSize * 0.10}px`;

    if (otherInfoValues.length > 0) {
        const infoSize = usableSize * 0.06;
        otherInfoValues.forEach(el => el.style.fontSize = `${infoSize}px`);
    }

    if (nameValue) {
        let currentFontSize = usableSize * 0.15;
        nameValue.style.fontSize = `${currentFontSize}px`;

        const minFontSize = 10;
        while ((nameValue.scrollHeight > nameValue.clientHeight || nameValue.scrollWidth > nameValue.clientWidth) && currentFontSize > minFontSize) {
            currentFontSize--;
            nameValue.style.fontSize = `${currentFontSize}px`;
        }
    }
}

function updateUI(updateWinnersListFlag = true) {
    participantsList.innerHTML = '';
    participants.forEach(p => {
        const li = document.createElement('li');
        li.textContent = `${p.Nome} ${p.Sobrenome || ''}`;
        participantsList.appendChild(li);
    });

    if (updateWinnersListFlag) {
        winnersList.innerHTML = '';
        winners.forEach((w, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="winner-number">${index + 1}º</span> <i class="fas fa-medal"></i> ${w.Nome} ${w.Sobrenome || ''}`;
            winnersList.appendChild(li);
        });
    }

    participantCountSpan.textContent = participants.length;
    winnerCountSpan.textContent = winners.length;
    btnDraw.disabled = participants.length === 0 || isRevealPhase;
}

function showInitialState() {
    displayArea.innerHTML = `
        <i class="fas fa-trophy large-icon"></i>
        <div id="winner-info-container">
            <p class="initial-message">Clique em "Iniciar Sorteio" para começar</p>
        </div>
    `;
    setTimeout(adjustWinnerFontSize, 0);
}

function showSpinner() {
    displayArea.innerHTML = `<strong><p>Sorteando...</p></strong><div class="spinner-container"><div class="spinner"></div></div>`;
}

function showWinner(winner) {
    displayArea.innerHTML = `
        <i class="fas fa-trophy large-icon hidden"></i>
        <div id="winner-info-container">
            <strong><p class="info-value">
                ${winner.Unidade || 'N/A'}<span class="cover"></span>
            </strong></p>
            <p class="info-value">
                ${winner.Função || 'N/A'}<span class="cover"></span>
            </p>
            <p class="info-value name">
                ${winner.Nome} ${winner.Sobrenome || ''}<span class="cover"></span>
            </p>
        </div>
    `;
    setTimeout(adjustWinnerFontSize, 0);
}

function fireFireworks() {
    const audio = new Audio('../../assets/fireworks.mp3');
    audio.play();
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
    function randomInRange(min, max) { return Math.random() * (max - min) + min; }
    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
    setTimeout(() => {
        audio.pause();
        audio.currentTime = 0; 
    }, duration);
}

function handleReveal() {
    if (!isRevealPhase) return;
    const covers = document.querySelectorAll('.cover');
    if (revealStep < covers.length) {
        covers[revealStep].classList.add('revealed');
        revealStep++;
    }

    if (revealStep >= covers.length) {
        isRevealPhase = false;
        document.removeEventListener('keydown', onKeyDown);
        window.api.updateWinnersFile(winners);
        updateUI(true);
        displayArea.querySelector('.large-icon')?.classList.remove('hidden');
        fireFireworks();
    }
}

const onKeyDown = (event) => {
    if (event.code === 'Space' || event.code === 'F1') {
        event.preventDefault();
        handleReveal();
    }
};

btnDraw.addEventListener('click', () => {
    if (participants.length === 0) return;
    isRevealPhase = true;
    btnDraw.disabled = true;
    btnReset.disabled = true;
    showSpinner();
    const randomIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[randomIndex];
    setTimeout(() => {
        participants.splice(randomIndex, 1);
        winners.push(winner);
        showWinner(winner);
        updateUI(false);
        revealStep = 0;
        btnReset.disabled = false;
        document.addEventListener('keydown', onKeyDown);
    }, 3000);
});

btnReset.addEventListener('click', () => {
    if (isRevealPhase) return;
    window.api.resetApp();
});

window.addEventListener('resize', adjustWinnerFontSize);

async function initialize() {
    try {
        const result = await window.api.getParticipants();
        if (result && result.success) {
            let allParticipants = result.data;
            const winnersResult = await window.api.getWinners();
            if (winnersResult && winnersResult.success && winnersResult.data.length > 0) {
                winners = winnersResult.data;
                const winnerIDs = new Set(winners.map(w => w.id));
                participants = allParticipants.filter(p => !winnerIDs.has(p.id));
            } else {
                participants = allParticipants;
            }
            updateUI(true);
            showInitialState();
        } else {
            const errorMessage = result ? result.error : "Não foi possível carregar os dados.";
            displayArea.innerHTML = `<p class="initial-message" style="color: var(--primary-red);">${errorMessage}</p>`;
            btnDraw.disabled = true;
        }
    } catch (error) {
        alert("Ocorreu um erro inesperado na comunicação com o sistema.");
        console.error(error);
    }
}

initialize();

// --- MELHORIA ADICIONADA: Controles da Janela ---
document.getElementById('btn-minimize').addEventListener('click', () => {
    window.api.minimizeWindow();
});

document.getElementById('btn-close').addEventListener('click', () => {
    window.api.closeWindow();
});

// Adiciona o listener para o novo botão
document.getElementById('btn-maximize').addEventListener('click', () => {
    window.api.maximizeWindow();
});