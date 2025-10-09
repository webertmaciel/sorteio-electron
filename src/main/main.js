const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// --- CORREÇÃO DEFINITIVA PARA O ERRO DE GPU ---
// Esta linha desativa a aceleração de hardware, que é a causa mais
// comum de travamentos e do erro "GPU process exited unexpectedly".
app.disableHardwareAcceleration();
// ---------------------------------------------

let mainWindow;

const userDataPath = app.getPath('userData'); 
const dataFolderPath = path.join(userDataPath, 'DATA');
const participantsJsonPath = path.join(dataFolderPath, 'professores.json');
const winnersFolderPath = path.join(userDataPath, 'ganhadores');
const winnersJsonPath = path.join(winnersFolderPath, 'ganhadores.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '..', '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
    },
  });

  if (fs.existsSync(participantsJsonPath)) {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'panel', 'panel.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'load', 'load.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('select-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Selecione a planilha de participantes',
    properties: ['openFile'], filters: [{ name: 'Planilhas Excel', extensions: ['xls', 'xlsx'] }],
  });
  if (canceled || filePaths.length === 0) return { success: false };
  try {
    const filePath = filePaths[0];
    const workbook = xlsx.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const dataAsArrays = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const rows = dataAsArrays.slice(8);
    let idCounter = 1;
    const participants = rows.map(row => ({
        id: idCounter++, Nome: row[2], Sobrenome: row[3], Sede: row[21] || 'N/A', Cargo: row[22] || 'N/A'
    })).filter(p => p.Nome && String(p.Nome).trim() !== '');
    if (participants.length === 0) throw new Error('Nenhum participante válido foi encontrado na planilha.');
    if (!fs.existsSync(dataFolderPath)) fs.mkdirSync(dataFolderPath, { recursive: true });
    fs.writeFileSync(participantsJsonPath, JSON.stringify(participants, null, 2));
    await mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'panel', 'panel.html'));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-participants', () => {
  try {
    if (fs.existsSync(participantsJsonPath)) {
      const jsonData = fs.readFileSync(participantsJsonPath, 'utf-8');
      return { success: true, data: JSON.parse(jsonData) };
    }
    return { success: false, error: 'Arquivo de dados de professores não encontrado.' };
  } catch (error) {
    return { success: false, error: `Falha ao ler o arquivo de professores: ${error.message}` };
  }
});

ipcMain.handle('get-winners', () => {
    try {
        if (fs.existsSync(winnersJsonPath)) {
            const jsonData = fs.readFileSync(winnersJsonPath, 'utf-8');
            return { success: true, data: JSON.parse(jsonData) };
        }
        return { success: true, data: [] };
    } catch (error) {
        return { success: false, error: `Falha ao ler o arquivo de ganhadores: ${error.message}` };
    }
});

ipcMain.handle('reset-app', async () => {
    if (fs.existsSync(participantsJsonPath)) fs.unlinkSync(participantsJsonPath);
    if (fs.existsSync(winnersJsonPath)) fs.unlinkSync(winnersJsonPath);
    await mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'load', 'load.html'));
});

ipcMain.handle('update-winners-file', (event, winners) => {
    try {
        if (!fs.existsSync(winnersFolderPath)) {
            fs.mkdirSync(winnersFolderPath, { recursive: true });
        }
        fs.writeFileSync(winnersJsonPath, JSON.stringify(winners, null, 2));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});