requirejs.load = function (context, moduleName, url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", chrome.extension.getURL(url) + '?r='  + Date.now(), true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            eval(xhr.responseText);
            context.completeLoad(moduleName)
        }
    };
    xhr.send(null);
};

requirejs({ baseUrl: 'js' }, ['configuration'], function(configuration) {

    var loginUrl = configuration.application.url.replace(/[a-z]+$/, 'login');
    if (location.href.indexOf(configuration.application.url) === 0 || location.href.indexOf(loginUrl) === 0) {
        var port;

        function initializePort() {
            port = chrome.runtime.connect();
            port.onMessage.addListener(onMessage);
            port.onDisconnect.addListener(onDisconnect);
        }

        var onMessage = function (payload) {
            var msg = {
                target: 'application',
                payload: payload
            };
            window.postMessage(msg, configuration.application.url);
        };

        var onDisconnect = function () {
            port.onMessage.removeListener(onMessage);
            port.onDisconnect.removeListener(onDisconnect);
            port.disconnect();
        };

        var onDOMMessage = function (event) {
            var msg = event.data;
            if (msg && msg.target === 'extension') {
                port.postMessage(msg.payload);
            }
        };

        function initialize() {
            initializePort();
            window.addEventListener("message", onDOMMessage);
        }

        function destructor() {
            document.removeEventListener(destructionEvent, destructor);
            window.removeEventListener("message", onDOMMessage);
            port = null;
        }

        var destructionEvent = 'destructmyextension_' + chrome.runtime.id;
        document.dispatchEvent(new CustomEvent(destructionEvent));
        setTimeout(function() {
            document.addEventListener(destructionEvent, destructor);
        }, 10);
        initialize();
    }
});
