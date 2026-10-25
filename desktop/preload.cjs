// The only bridges from the game page to the Electron shell: feat ids for Steam achievements and
// an app relaunch (the GPU overlay's Reload, src/core/platform.ts `restartApp`).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('trucoSteam', {
	/** @param {string[]} ids */
	unlock: (ids) => ipcRenderer.send('steam:unlock', ids),
});

contextBridge.exposeInMainWorld('trucoShell', {
	relaunch: () => ipcRenderer.send('app:relaunch'),
});
