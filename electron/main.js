const { app, BrowserWindow } = require("electron");
const path = require("path");

// Check if we are running in development mode
const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    // Provide a default icon if you have one, e.g., path.join(__dirname, '../public/icon-512.png')
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Remove the default Electron menu bar for a cleaner app feel
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    // In development, load the local Next.js server
    mainWindow.loadURL("http://localhost:3000");
    // Open the DevTools automatically in dev
    mainWindow.webContents.openDevTools();
  } else {
    // 💡 IMPORTANT: In Production, load your live website URL!
    // Change this to your actual deployed website URL.
    // Example: mainWindow.loadURL("https://schoolapp.com");
    
    // For testing the production build locally before you deploy, you can point to localhost
    mainWindow.loadURL("https://test.patwaryinstitute.com"); 
  }
}

// When Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
