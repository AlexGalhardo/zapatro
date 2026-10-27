// The only bridges from the game page to the Electron shell: feat ids for Steam achievements, an
// app relaunch (the GPU overlay's Reload, src/core/platform.ts `restartApp`) and the LAN table host.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('trucoSteam', {
	/** @param {string[]} ids */
	unlock: (ids) => ipcRenderer.send('steam:unlock', ids),
});

contextBridge.exposeInMainWorld('trucoShell', {
	relaunch: () => ipcRenderer.send('app:relaunch'),
	/** Starts the LAN table on this computer: its port and the addresses friends join at. */
	hostLan: () => ipcRenderer.invoke('lan:host'),
});
