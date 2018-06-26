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
var sendMessage;
requirejs({ baseUrl: 'js' }, ['configuration'], function(configuration) {
    sendMessage = function sendMessageToExtension(message, callback) {
        chrome.runtime.sendMessage(chrome.runtime.id, message, callback);
    };
/*
    if (location.href.indexOf(configuration.application.url) === 0) {
        window.document.getElementsByTagName('body')[0].setAttribute('extensionId', chrome.runtime.id);
    }
*/
});
