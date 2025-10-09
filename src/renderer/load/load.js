const btnSelectFile = document.getElementById('btn-select-file');
const loadingMessage = document.getElementById('loading-message');

btnSelectFile.addEventListener('click', async () => {
    btnSelectFile.disabled = true;
    loadingMessage.classList.remove('hidden');

    const result = await window.api.selectFile();

    // Se o processamento falhar, o alerta é exibido e o botão é reativado.
    if (!result.success && result.error) {
        alert(`Erro ao processar o arquivo:\n${result.error}`);
        btnSelectFile.disabled = false;
        loadingMessage.classList.add('hidden');
    }
    // Se der sucesso, o main.js navega a página, então não fazemos mais nada aqui.
});