#!/usr/bin/env node
process.env.PATH += ':./bin';

var Promise = require('bluebird'),
    webdriver = require('selenium-webdriver'),
    until = webdriver.until,
    by = webdriver.By,
    assert = require('chai').assert,
    utils = require('./utils'),
    assertions = require('./assertions');

var SECS = 1000;

var studentCapabilities = webdriver.Capabilities.chrome();

studentCapabilities.caps_.chromeOptions = {
    args: [
        'load-extension=../extensions/student',
        'force-device-scale-factor=0.5',
        'auto-select-desktop-capture-source=Entire screen',
        'allow-http-screen-capture'
    ]
};

var studentDriver = new webdriver.Builder()
    .withCapabilities(studentCapabilities)
    .build();

studentDriver.waitForElementLocated = utils.waitForElementLocatedBuilder(studentDriver);
studentDriver.waitForApplicationToLoad = utils.waitForApplicationToLoadBuilder(studentDriver);

var enterClassAsAStudent = function(url, accessCode) {
    var cookies, profile;
    return studentDriver.get(url)
        .then(function() {
            return utils.generateCookie()
        })
        .then(function(cookieData) {
            profile = cookieData.profile;
            cookies = cookieData.cookies;
            return studentDriver.manage().addCookie('sid', cookies.sid);
        })
        .then(function() {
            return studentDriver.manage().addCookie('hiveclass-profile', cookies.profile);
        })
        .then(function() {
            return studentDriver.navigate().to(url);
        })
        .then(studentDriver.waitForApplicationToLoad)
        .then(function () {
            return studentDriver.waitForElementLocated(utils.byMontageId('joinClassButton'));
        })
        .then(function (element) {
            return assertions.assertElementHasClass(element, 'montage--disabled');
        })
        .then(function () {
            return studentDriver.wait(until.elementsLocated(utils.byMontageId('digitInput')))
        })
        .then(function (elements) {
            for (var i = 0; i < elements.length; i++) {
                elements[i].sendKeys(accessCode[i]);
            }
        })
        .then(function () {
            return studentDriver.waitForElementLocated(utils.byMontageId('joinClassButton'));
        })
        .then(function (element) {
            studentDriver.sleep(250);
            return assertions.assertElementHasNotClass(element, 'montage--disabled');
        })
        .then(utils.clickButton)
        .then(function () {
            return studentDriver.waitForElementLocated(utils.byMontageId('teacher'));
        })
    ;
};

function launchTest() {
    return utils.setupDriver(studentDriver)
        .then(function() {
            return enterClassAsAStudent(process.argv[2], process.argv[3]);
        })
        ;
}

launchTest()
    .then(function() {
        setTimeout(function() {
            studentDriver.close();
        }, 3600 * SECS);
    }, function(err) {
        studentDriver.manage().logs().get('browser')
            .then(function(logs) {
                console.log('browser:', logs);
            });
        console.log('error:', err.stack);
    });
