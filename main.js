// Measuring startup
console.time("init");


// -----------------------------------------------------------------------------
// DEFINE CONSTANTS AND VARIABLES
// -----------------------------------------------------------------------------
const {app, BrowserWindow, Menu, Tray, ipcMain, electron } = require("electron");
//const nodeConsole = require("console"); // for writing to terminal
const defaultUserDataPath = app.getPath("userData"); // for storing window position and size
const gotTheLock = app.requestSingleInstanceLock(); // for single-instance handling
const shell = require("electron").shell;
const openAboutWindow = require("about-window").default;

var AutoLaunch = require("auto-launch"); // for autostart
var path = require("path");
var fs = require("fs");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let secondWindow;


/**
* @name createMenu
* @summary Creates the menu
* @description Creates the menu and auto-hides it on init
*/
function createMenu()
{
    // Create a custom menu
    //
    var menu = Menu.buildFromTemplate([

    // Menu: File
    {
        label: "File",
        submenu: [
        {
            label: "Settings",
            click() {
                mainWindow.webContents.send("showSettings");
            },
            accelerator: "CmdOrCtrl+,"
        },
        {
            type: "separator"
        },
        {
            role: "quit",
            label: "Exit",
            click() {
                app.quit();
            },
            accelerator: "CmdOrCtrl+Q"
        }
    ]
    },

    // Menu: Edit
    {
        label: "Edit",
        submenu: [
        {
            label: "Undo",
            accelerator: "CmdOrCtrl+Z",
            selector: "undo:"
        },
        {
            label: "Redo",
            accelerator: "Shift+CmdOrCtrl+Z",
            selector: "redo:"
        },
        {
            type: "separator"
        },
        {
            label: "Cut",
            accelerator: "CmdOrCtrl+X",
            selector: "cut:"
        },
        {
            label: "Copy",
            accelerator: "CmdOrCtrl+C",
            selector: "copy:"
        },
        {
            label: "Paste",
            accelerator: "CmdOrCtrl+V",
            selector: "paste:"
        },
        {
            label: "Select All",
            accelerator: "CmdOrCtrl+A",
            selector: "selectAll:"
        }
    ]
    },

    // Menu: View
    {
        label: "View",
        submenu: [
        {
            label: "Next Service",
            click() {
                mainWindow.webContents.send("nextTab");
            },
            accelerator: "CmdOrCtrl+right"
        },
        {
            label: "Previous Service",
            click() {
                mainWindow.webContents.send("previousTab");
            },
            accelerator: "CmdOrCtrl+left"
        },
        {
            type: "separator"
        },
        {
            role: "reload",
            label: "Reload",
            click() {
                mainWindow.reload();
            },
            accelerator: "CmdOrCtrl+R"
        },
        {
            label: "Reload current service",
            click() {
                // calling the renderer process from main.js
                mainWindow.webContents.send("reloadCurrentService", "whoooooooh!");
            },
            accelerator: "CmdOrCtrl+S",
            enabled: true
        },
        {
            type: "separator"
        },
        {
            id: "ViewToggleMenubar",
            label: "Toggle MenuBar",
            click() {
                if(mainWindow.isMenuBarVisible())
                {
                    mainWindow.setMenuBarVisibility(false);
                }
                else
                {
                    mainWindow.setMenuBarVisibility(true);
                }
            },
            accelerator: "F10"
        }
    ]
    },

    // Menu: Window
    {
        label: "Window",
        submenu: [
        {
            role: "togglefullscreen",
            label: "Toggle Fullscreen",
            click() {
                if(mainWindow.isFullScreen())
                {
                    mainWindow.setFullScreen(false);
                }
                else
                {
                    mainWindow.setFullScreen(true);
                }

            },
            accelerator: "F11" // is most likely predefined on osx - doesnt work
        },
        {
            role: "hide",
            label: "Hide",
            click() {
                mainWindow.hide();
                //mainWindow.reload();
            },
            accelerator: "CmdOrCtrl+H",
            enabled: true
        },
        {
            role: "minimize",
            label: "Minimize",
            click() {
                if(mainWindow.isMinimized())
                {
                    //mainWindow.restore();
                }
                else
                {
                    mainWindow.minimize();
                }
            },
            accelerator: "CmdOrCtrl+M",
        },
        {
            label: "Maximize",
            click() {
                if(mainWindow.isMaximized())
                {
                    mainWindow.unmaximize();
                }
                else
                {
                    mainWindow.maximize();
                }
            },
            accelerator: "CmdOrCtrl+K",
        }
    ]
    },

    // Menu: Help
    {
        role: "help",
        label: "Help",
        submenu: [
        // About
        {
            role: "about",
            label: "About",
            click() {
                openAboutWindow({
                    icon_path: path.join(__dirname, "app/img/about/icon_about.png"),
                    open_devtools: false,
                    use_version_info: true,
                    win_options:  // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#new-browserwindowoptions
                    {
                        autoHideMenuBar: true,
                        titleBarStyle: "hidden",
                        minimizable: false, // not implemented on linux
                        maximizable: false, // not implemented on linux
                        movable: false, // not implemented on linux
                        resizable: false,
                        alwaysOnTop: true,
                        fullscreenable: false,
                        skipTaskbar: false
                    }
                });

            },
        },
        {
            label: "Homepage",
            click() {
                shell.openExternal("https://github.com/yafp/ttth");
            },
            accelerator: "F1"
        },
        // report issue
        {
            label: "Report issue",
            click() {
                shell.openExternal("https://github.com/yafp/ttth/issues");
            },
            accelerator: "F2"
        },
        {
            type: "separator"
        },
        // Update
        {
            label: "Search updates",
            click() {
                //mainWindow.webContents.toggleDevTools();
                mainWindow.webContents.send("startSearchUpdates");
            },
            enabled: true
            //accelerator: "F12"
        },
        {
            type: "separator"
        },
        // Console
        {
            id: "HelpConsole",
            label: "Console",
            click() {
                mainWindow.webContents.toggleDevTools();
            },
            enabled: true,
            accelerator: "F12"
        },
        {
            type: "separator"
        },
        // SubMenu
        {
            label: "Cleaner",
            submenu: [
            // Clear cache
            {
                id: "ClearCache",
                label: "Clear cache",
                click() {
                    const ses = mainWindow.webContents.session;
                    ses.clearCache(() => {

                    });
                    mainWindow.reload();
                },
                enabled: true
            },
            // Clear Local Storage
            {
                id: "ClearLocalStorage",
                label: "Clear local storage",
                click() {
                    const ses = mainWindow.webContents.session;
                    ses.clearStorageData(() => {
                        storages: ["localstorage"];
                    });
                    mainWindow.reload();
                },
                enabled: true
            },
            ]
        }
        ]
    }
    ]);

    // use the menu
    Menu.setApplicationMenu(menu);

    // hide menubar on launch
    //mainWindow.setMenuBarVisibility(false);


    // Hide Menubar
    //
    ipcMain.on("hideMenubar", function() {
        mainWindow.setMenuBarVisibility(false);
    });

    // Show Menubar
    //
    ipcMain.on("showMenubar", function() {
        mainWindow.setMenuBarVisibility(true);
    });


    // Disable some menu-elements - depending on the platform
    //
    var os = require("os");
    if(os.platform() === "darwin")
    {
        // see #21
        Menu.getApplicationMenu().items; // all the items
        var item = Menu.getApplicationMenu().getMenuItemById("ViewToggleMenubar");
        item.enabled = false;
    }
}


/**
* @name createWindow
* @summary Creates the main window  of the app
* @description Creates the main window, restores window position and size of possible
*/
function createWindow ()
{
    // Check last window position and size from user data
    var windowWidth;
    var windowHeight;
    var windowPositionX;
    var windowPositionY;

    // Read a local config file
    var customUserDataPath = path.join(defaultUserDataPath, "ttthUserData.json");
    var data;
    try {
        data = JSON.parse(fs.readFileSync(customUserDataPath, "utf8"));

        // size
        windowWidth = data.bounds.width;
        windowHeight = data.bounds.height;

        // position
        windowPositionX = data.bounds.x;
        windowPositionY = data.bounds.y;
    }
    catch(e) {
        // set some default values for window size
        windowWidth = 800;
        windowHeight = 600;
    }

    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: "${productName}",
        frame: true, // false results in a borderless window
        show: false, // hide until: ready-to-show
        width: windowWidth,
        height: windowHeight,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: "#ffffff",
        icon: path.join(__dirname, "app/img/icon/icon.png"),
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Restore window position if possible
    //
    // requirements: found values in .tttUSerData.json from the previous session
    if ( (typeof windowPositionX !== "undefined") && (typeof windowPositionY !== "undefined") )
    {
        mainWindow.setPosition(windowPositionX, windowPositionY);
    }

    // set the user agent
    //changeUserAgent();

    // and load the index.html of the app.
    mainWindow.loadFile("app/index.html");

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // show the formerly hidden main window as it is fully ready now
    //
    mainWindow.on("ready-to-show", function()
    {
        console.log("main.js ::: Event: ready-to-show");
        mainWindow.show();
        mainWindow.focus();
    });


    // When dom is ready
    //
    mainWindow.webContents.once("dom-ready", () => {
        console.log("main.js ::: Event: dom-ready");
        let name = require("./package.json").name;
        let version = require("./package.json").version;
        let windowTitle = name + " " + version;
        mainWindow.setTitle(windowTitle);
    });


    // When page title gets changed
    //
    mainWindow.webContents.once("page-title-updated", () => {
        console.log("main.js ::: Event: page-title-updated");
    });


    // when the app is shown
    //
    mainWindow.on("show", function()
    {
        console.log("main.js ::: Event: show");
    });


    // when the app loses focus / aka blur
    //
    mainWindow.on("blur", function()
    {
        console.log("main.js ::: Event: blur");
    });


    // when the app gets focus
    //
    mainWindow.on("focus", function()
    {
        console.log("main.js ::: Event: focus");
    });


    // when the app goes fullscreen
    //
    mainWindow.on("enter-full-screen", function()
    {
        console.log("main.js ::: Event: Enter fullscreen");
    });


    // when the app goes leaves fullscreen
    //
    mainWindow.on("leave-full-screen", function()
    {
        console.log("main.js ::: Event: Leave fullscreen");
    });


    // when the app gets resized
    //
    mainWindow.on("resize", function()
    {
        console.log("main.js ::: Event: resize");
    });


    // when the app gets hidden
    //
    mainWindow.on("hide", function()
    {
        console.log("main.js ::: Event: hide");
    });


    // when the app gets maximized
    //
    mainWindow.on("maximize", function()
    {
        console.log("main.js ::: Event: maximize");
    });


    // when the app gets unmaximized
    //
    mainWindow.on("unmaximize", function()
    {
        console.log("main.js ::: Event: unmaximize");
    });


    // when the app gets minimized
    //
    mainWindow.on("minimize", function()
    {
        console.log("main.js ::: Event: minimize");
    });


    // when the app gets restored from minimized mode
    //
    mainWindow.on("restore", function()
    {
        console.log("main.js ::: Event: restore");
    });


    // Emitted before the window is closed.
    //
    mainWindow.on("close", function ()
    {
        console.log("main.js ::: Event: close");

        // get window position and size:
        var data = {
            bounds: mainWindow.getBounds()
        };

        // store it to file in user data
        var customUserDataPath = path.join(defaultUserDataPath, "ttthUserData.json");
        fs.writeFileSync(customUserDataPath, JSON.stringify(data));

        // close secondWindow
        secondWindow.close();
    });


    // Emitted when the window is closed.
    //
    mainWindow.on("closed", function ()
    {
        console.log("main.js ::: Event: closed");

        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;

    });


    // When the app is unresponsive
    //
    mainWindow.on("unresponsive", function ()
    {
        console.log("main.js ::: Event: unresponsive");
    });


    // When the app gets responsive again
    //
    mainWindow.on("responsive", function ()
    {
        console.log("main.js ::: Event: responsive");
    });


    // When the app is crashed
    //
    mainWindow.webContents.on("crashed", function ()
    {
        console.log("main.js ::: Event: crashed");
    });



    // Call from renderer: Update Window Title
    //
    ipcMain.on("updateWindowTitle", (event, arg) => {
        let name = require("./package.json").name;
        let version = require("./package.json").version;
        let windowTitle = name + " " + version;
        if(arg !== "")
        {
            windowTitle = windowTitle + " - " + arg;
        }

        // update title
        mainWindow.setTitle(windowTitle);
    });














    // FIXME: start to implement a second window to allow configuring a single service
    //
    //secondWindow = new BrowserWindow({ width: 800, height: 600 });
    secondWindow = new BrowserWindow({
        title: "${productName}",
        frame: false, // false results in a borderless window
        show: false, // hide as default
        resizable: false,
        width: 600,
        height: 700,
        minWidth: 600,
        minHeight: 700,
        backgroundColor: "#ffffff",
        icon: path.join(__dirname, "app/img/icon/icon.png"),
        webPreferences: {
            nodeIntegration: true
        }
    });

    // load html form to the window
    secondWindow.loadFile("app/config.html");

    // hide menubar
    secondWindow.setMenuBarVisibility(false);


    // Emitted when the window gets a close event.(close VS closed)
    //
    secondWindow.on("close", function (event)
    {
        console.log("main.js ::: Event: secondWindow close");

        // prevent the closing of the window
        //event.preventDefault();

        // just hide it - so it can re-opened
        secondWindow.hide();
    });


    // Emitted when the window is shown
    //
    secondWindow.on("show", function (event)
    {
        console.log("main.js ::: Event: secondWindow show");
        // load service data?
    });



    // Call from renderer: show configure single service window
    //
    ipcMain.on("showConfigureSingleServiceWindow", (event, arg) => {

        // show second window
        secondWindow.show();

        secondWindow.webContents.send("serviceToConfigure", arg);
    });

    // Call from renderer: hide configure single service window
    //
    ipcMain.on("closeConfigureSingleServiceWindow", (event) => {

        // hide second window
        secondWindow.hide();
    });









}


/**
* @name createTray
* @summary Creates the tray of the app
* @description Creates the tray and the related menu.
*/
function createTray()
{
    let tray = null;
    app.on("ready", () => {

        tray = new Tray(path.join(__dirname, "app/img/tray/tray_default.png"));

        const contextMenu = Menu.buildFromTemplate([
            {
                // Window focus
                id: "show",
                label: "Show Window",
                click: function () {
                    // focus the main window
                    if (mainWindow.isMinimized())
                    {
                        mainWindow.restore();
                    }
                    else
                    {
                        // was maybe: hidden via hide()
                        mainWindow.show();
                    }
                    mainWindow.focus();
                },
                enabled: true
            },
            {
                type: "separator",
                enabled: false
            },
            {
                // Quit
                id: "exit",
                label: "Exit",
                enabled: true,
                click: function () {
                    app.quit();
                }
            }
        ]);

        tray.setToolTip("ttth");
        tray.setContextMenu(contextMenu);

        // from rambox
        switch (process.platform)
        {
            case "darwin":
                break;

            case "linux":
            case "freebsd":
                // Double click is not supported and Click its only supported when app indicator is not used.
                // Read more here (Platform limitations): https://github.com/electron/electron/blob/master/docs/api/tray.md
                tray.on("click", function() {
                });
                break;

            case "win32":
                tray.on("click", function() {
                });

                // only: mac & win
                tray.on("double-click", function() {
                });

                // only: mac & win
                tray.on("right-click", function() {
                });

                break;

            default:
                break;
        }

    });



    // Call from renderer: Change Tray Icon to UnreadMessages
    //
    ipcMain.on("changeTrayIconToUnreadMessages", function() {
        tray.setImage(path.join(__dirname, "app/img/tray/tray_unread.png"));
    });

    // Call from renderer: Change Tray Icon to Default
    //
    ipcMain.on("changeTrayIconToDefault", function() {
        tray.setImage(path.join(__dirname, "app/img/tray/tray_default.png"));
    });
}


/**
* @name changeUserAgent
* @summary Can owerwrite the user agent
* @description Can owerwrite the user agent
*/
function changeUserAgent()
{
    // get the out-of-the-box userAgent
    var defaultAgent = mainWindow.webContents.getUserAgent();

    // change user agent of browser
    //
    // Examples:
    // Windows:       Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36
    //                Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36
    // Linux:         Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36
    //
    var userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36";
    mainWindow.webContents.setUserAgent(userAgent);

    // check if setting the userAgent worked
    var newAgent = mainWindow.webContents.getUserAgent();
}


/**
* @name forceSingleAppInstance
* @summary Takes care that there is only 1 instance of this app running
* @description Takes care that there is only 1 instance of this app running
*/
function forceSingleAppInstance()
{
    if (!gotTheLock)
    {
        // quit the second instance
        app.quit();
    }
    else
    {
        app.on("second-instance", (event, commandLine, workingDirectory) =>
        {
            // Someone tried to run a second instance, we should focus our first instance window.
            if (mainWindow)
            {
                if (mainWindow.isMinimized())
                {
                    mainWindow.restore();
                }
                mainWindow.focus();
            }
        });
    }
}


// -----------------------------------------------------------------------------
// LETS GO
// -----------------------------------------------------------------------------


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//
//app.on("ready", createWindow);
app.on("ready", function ()
{
    forceSingleAppInstance();
    createWindow();
    createMenu();

});



// Quit when all windows are closed.
//
app.on("window-all-closed", function ()
{
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin")
    {
        app.quit();
    }
});


// macOS only:
// Emitted when the application is activated. Various actions can trigger this event, such as launching the application for the first time,
// attempting to re-launch the application when it's already running,
// or clicking on the application's dock or taskbar icon.
//
app.on("activate", function ()
{
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null)
    {
        forceSingleAppInstance();
        createWindow();
        createMenu();
    }
});


// create the tray
createTray();


process.on("uncaughtException", (err, origin) => {
  fs.writeSync(
    process.stderr.fd,
    `Caught exception: ${err}\n` +
    `Exception origin: ${origin}`
  );
});


// Measuring startup
console.timeEnd("init");
