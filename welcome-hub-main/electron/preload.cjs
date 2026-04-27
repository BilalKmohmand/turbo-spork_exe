const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("thg", {
  platform: process.platform,
});
