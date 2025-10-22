const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFile: () => ipcRenderer.invoke('open-file-dialog'),
  getParticipants: () => ipcRenderer.invoke('get-participants'),
  getWinners: () => ipcRenderer.invoke('get-winners'),
  resetApp: () => ipcRenderer.invoke('reset-app'),
  updateWinnersFile: (winners) => ipcRenderer.invoke('update-winners-file', winners),
  
  // Funções de controle da janela
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'), // <-- Adicione/Verifique esta linha
  closeWindow: () => ipcRenderer.send('close-window')
});