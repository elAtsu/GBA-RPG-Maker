const { app, BrowserWindow } = require('electron');
const path = require('path');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true // oculta la barra de menú automáticamente
        // o puedes usar "frame: false" para quitar toda la barra de título
    });

    // Cargar HTML
    win.loadFile(path.join(__dirname, '.', 'index.html'));

    // DevTools opcional para depuración
    // win.webContents.openDevTools();

    // Quitar menú por completo (opcional)
    win.setMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
