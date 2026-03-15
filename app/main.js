import { app, BrowserWindow } from "electron"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function createWindow() {

    const win = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload/preload.js")
        }
    })

    win.loadFile(path.join(__dirname, "renderer/main/index.html"))
}

app.whenReady().then(createWindow)