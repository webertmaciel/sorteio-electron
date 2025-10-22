const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

app.disableHardwareAcceleration();

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
    frame: false,
    icon: path.join(__dirname, '..', '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
    },
  });

  mainWindow.setMenu(null);

  if (fs.existsSync(participantsJsonPath)) {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'panel', 'panel.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'load', 'load.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// --- CORREÇÃO AQUI: Todos os listeners de janela juntos ---
ipcMain.on('minimize-window', () => { mainWindow.minimize(); });
ipcMain.on('close-window', () => { mainWindow.close(); });
ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
// --- FIM DA CORREÇÃO ---


ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'Nenhum arquivo selecionado.' };
  }

  const filePath = result.filePaths[0];

  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    if (!fs.existsSync(dataFolderPath)) fs.mkdirSync(dataFolderPath, { recursive: true });
    if (!fs.existsSync(winnersFolderPath)) fs.mkdirSync(winnersFolderPath, { recursive: true });

    const participants = data
      .slice(1)
      .map((row, index) => {
        if (!row || typeof row[0] === 'undefined' || row[0] === null || String(row[0]).trim() === '') {
          return null;
        }
        
        const fullName = String(row[0]).trim();
        const nameParts = fullName.split(' ');
        const Nome = nameParts.shift();
        const Sobrenome = nameParts.join(' ');

        return {
          id: index + 1,
          Nome: Nome,
          Sobrenome: Sobrenome,
          Função: row[1] ? String(row[1]).trim() : 'Não informado',
          Unidade: row[2] ? String(row[2]).trim() : 'Não informada',
        };
      })
      .filter(p => p !== null);

    if (participants.length === 0) {
      return { success: false, error: 'A planilha está vazia ou não contém nomes válidos na primeira coluna.' };
    }

    fs.writeFileSync(participantsJsonPath, JSON.stringify(participants, null, 2));
    
    await mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'panel', 'panel.html'));
    return { success: true };

  } catch (error) {
    return { success: false, error: `Erro ao processar o arquivo: ${error.message}` };
  }
});

ipcMain.handle('get-participants', () => {
  try {
    if (fs.existsSync(participantsJsonPath)) {
      const jsonData = fs.readFileSync(participantsJsonPath, 'utf-8');
      return { success: true, data: JSON.parse(jsonData) };
    }
    return { success: false, error: 'Arquivo de dados não encontrado.' };
  } catch (error) {
    return { success: false, error: `Falha ao ler o arquivo: ${error.message}` };
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
    fs.writeFileSync(winnersJsonPath, JSON.stringify(winners, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: `Erro ao salvar ganhadores: ${error.message}` };
  }
});