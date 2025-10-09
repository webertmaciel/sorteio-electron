const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  getParticipants: () => ipcRenderer.invoke('get-participants'),
  getWinners: () => ipcRenderer.invoke('get-winners'), // <-- NOVA FUNÇÃO EXPOSTA
  resetApp: () => ipcRenderer.invoke('reset-app'),
  updateWinnersFile: (winners) => ipcRenderer.invoke('update-winners-file', winners),
});