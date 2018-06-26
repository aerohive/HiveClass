/*jshint node:true */
module.exports = require("core/node/url");

module.exports.toModuleId = urlToModuleId;

var endsWithJsRe = /\.js$/;
/**
 * Converts a URL in a given package URL to a module ID as best as possible.
 * @param  {string} url        The URL of the module.
 * @param  {string} packageUrl The URL of the package the module is in.
 * @return {string}            A module ID.
 */
function urlToModuleId(url, packageUrl) {
    // Package url must always be directory
    if (packageUrl.charAt(packageUrl.length - 1) !== "/") {
        packageUrl += "/";
    }

    if (url.indexOf(packageUrl) !== 0) {
        throw new Error("URL " + url + " must be in package " + packageUrl + " to be converted to a module ID");
    }

    var moduleId = url.substring(packageUrl.length);

    if (moduleId.charAt(moduleId.length - 1) === "/") {
        // remove trailing /
        moduleId = moduleId.substring(0, moduleId.length - 1);
    } else if (endsWithJsRe.test(moduleId)) {
        // remove ".js"
        moduleId = moduleId.substring(0, moduleId.length - 3);
    }

    return moduleId;
}
