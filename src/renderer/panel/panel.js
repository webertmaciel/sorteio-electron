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

// --- Funções de Controle da Interface ---

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
}

function showSpinner() {
    displayArea.innerHTML = `<div class="spinner"></div>`;
}

function showWinner(winner) {
    displayArea.innerHTML = `
        <i class="fas fa-trophy large-icon hidden"></i>
        <div id="winner-info-container">
            <p class="info-value">
                ${winner.Unidade || 'N/A'}<span class="cover"></span>
            </p>
            <p class="info-value">
                ${winner.Função || 'N/A'}<span class="cover"></span>
            </p>
            <p class="info-value name">
                ${winner.Nome} ${winner.Sobrenome || ''}<span class="cover"></span>
            </p>
        </div>
    `;
}


function fireFireworks() {
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
        
        // ADICIONADO DE VOLTA: Chamada para os fogos de artifício
        fireFireworks();
    }
}

const onKeyDown = (event) => {
    if (event.code === 'Space' || event.code === 'F1') {
        event.preventDefault();
        handleReveal();
    }
};

// --- Lógica Principal do Sorteio ---

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

// --- Inicialização ---

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