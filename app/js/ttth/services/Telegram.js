/**
* @name serviceTelegramAddEventListener
* @summary Adds several EventListeners to the webview of the service
* @description Defines several EventListeners to the webview of the service and starts a periodic request to check for unread messages
*/
function serviceTelegramAddEventListener(serviceId)
{
    console.log("serviceTelegramAddEventListener ::: Start");

    console.log("serviceTelegramAddEventListener ::: Adding event listeners for webview: _webview_" + serviceId + "_.");

    // get webview
    var webview = document.getElementById("webview_" + serviceId);

    // run it periodically
    //
    //  5.000 =  5 sec
    var intervalID = setInterval(function()
    {
        webview.send("request");
    }, 5000);


    // WebView Event: new-window
    //
    webview.addEventListener("new-window", function(e)
    {
        console.log("serviceTelegramAddEventListener ::: new-window");

        const BrowserWindow = require("electron");
        const shell = require("electron").shell;
        const protocol = require("url").parse(e.url).protocol;

        if (protocol === "http:" || protocol === "https:")
        {
            shell.openExternal(e.url);
        }
    });


    // WebView Event: did-start-loading
    //
    webview.addEventListener("did-start-loading", function()
    {
        console.log("serviceTelegramAddEventListener ::: did-start-loading.");

        // Triggering search for unread messages
        webview.send("request");
    });


    // WebView Event: dom-ready
    //
    webview.addEventListener("dom-ready", function()
    {
        console.log("serviceTelegramAddEventListener ::: DOM-Ready");

        // Triggering search for unread messages
        webview.send("request");
    });


    // WebView Event: did-stop-loading
    //
    webview.addEventListener("did-stop-loading", function()
    {
        console.log("serviceTelegramAddEventListener ::: did-stop-loading");

        // Debug: Open a separate Console Window for this WebView
        //webview.openDevTools();

        // Triggering search for unread messages
        webview.send("request");
    });


    // WebView Event:  ipc-message
    webview.addEventListener("ipc-message",function(event)
    {
        console.log("serviceTelegramAddEventListener ::: IPC message: _" + event + "_.");
        //console.log(event);
        //console.info(event.channel);

        // update the badge
        if(event.channel != null)
        {
            updateServiceBadge(serviceId, event.channel);
        }
    });

    console.log("serviceTelegramAddEventListener ::: End");
}


/**
* @name serviceTelegramInit
* @summary Initializes the Telegram Service
* @description Initializes the Telegram Service
*/
function serviceTelegramInit(serviceName, serviceUrl)
{
    console.log("serviceTelegramInit ::: Start");

    // re-set the src for the webview
    //document.getElementById( serviceName + "Webview" ).setAttribute( "src", serviceUrl);
    document.getElementById( serviceName + "Webview" ).loadURL(serviceUrl);

    console.log("serviceTelegramInit ::: End");
}
