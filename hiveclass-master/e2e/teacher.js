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

var teacherCapabilities = webdriver.Capabilities.chrome();

teacherCapabilities.caps_.chromeOptions = {
    args: [
        'load-extension=../extensions/teacher',
        'force-device-scale-factor=0.5',
        'auto-select-desktop-capture-source=Entire screen',
        'allow-http-screen-capture'
    ]
};

var teacherDriver = new webdriver.Builder()
    .withCapabilities(teacherCapabilities)
    .build();

teacherDriver.waitForElementLocated = utils.waitForElementLocatedBuilder(teacherDriver);
teacherDriver.waitForApplicationToLoad = utils.waitForApplicationToLoadBuilder(teacherDriver);

var createClassroom = function (url) {
    var cookies, profile;
    return teacherDriver.get(url)
        .then(function() {
            return utils.generateCookie()
        })
        .then(function(cookieData) {
            profile = cookieData.profile;
            cookies = cookieData.cookies;
            return teacherDriver.manage().addCookie('sid', cookies.sid);
        })
        .then(function() {
            return teacherDriver.manage().addCookie('hiveclass-profile', cookies.profile);
        })
        .then(function() {
            return teacherDriver.navigate().to(url);
        })
        .then(teacherDriver.waitForApplicationToLoad)
        .then(function () {
            return teacherDriver.waitForElementLocated(utils.byMontageId('nextButton'))
        })
        .then(utils.clickButton)
        .then(function () {
            return teacherDriver.waitForElementLocated(utils.byMontageId('firstClassNameField'));
        })
        .then(function (element) {
            element.sendKeys('Foo');
            return teacherDriver.waitForElementLocated(utils.byMontageId('enterClassButton'))
        })
        .then(utils.clickButton)
        .then(function () {
            return teacherDriver.wait(until.elementsLocated(utils.byMontageId('digitInput')))
        })
        .then(function (elements) {
            return Promise.all(elements.map(function(x) { return x.getText(); }));
        })
        .then(function (digits) {
            //console.log(digits);
            return digits.join('');
        });
};

function launchTest() {
    return utils.setupDriver(teacherDriver)
        .then(function() {
            return createClassroom(process.argv[2])
        })
        ;
}

launchTest()
    .then(function(accessCode) {
        console.log(accessCode);
        setTimeout(function() {
            teacherDriver.close();
        }, 3600 * SECS);
    }, function(err) {
        teacherDriver.manage().logs().get('browser')
            .then(function(logs) {
                console.log(logs);
            });
        console.log(err);
    });
