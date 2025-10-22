const btnSelectFile = document.getElementById('btn-select-file');
const loadingMessage = document.getElementById('loading-message');

btnSelectFile.addEventListener('click', async () => {
    btnSelectFile.disabled = true;
    loadingMessage.classList.remove('hidden');

    const result = await window.api.selectFile();
    
    if (!result.success && result.error) {
        alert(`Erro ao processar o arquivo:\n${result.error}`);
        btnSelectFile.disabled = false;
        loadingMessage.classList.add('hidden');
    }
});

// --- NOVO: EVENTOS DOS CONTROLES DA JANELA ---
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