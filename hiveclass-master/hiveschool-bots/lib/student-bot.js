#!/usr/bin/env node
process.env.PATH += ':./bin';

var webdriver = require('selenium-webdriver'),
    until = webdriver.until,
    utils = require('./utils');

var chromeArgs = [
    'force-device-scale-factor=0.5',
    'auto-select-desktop-capture-source=Entire screen'
];
var studentCapabilities = webdriver.Capabilities.chrome();

studentCapabilities.caps_.chromeOptions = {
    args: chromeArgs.concat('load-extension=../extensions/student')
};

exports.StudentBot = function(url) {
    this._driver = new webdriver.Builder()
        .withCapabilities(studentCapabilities)
        .build();

    this._driver.waitForElementLocated = utils.waitForElementLocatedBuilder(this._driver);
    this._driver.waitForApplicationToLoad = utils.waitForApplicationToLoadBuilder(this._driver);
    this._driver.showElement = utils.showElementBuilder(this._driver);

    this.enterClassroomWithAccessCode = function(accessCode) {
        var self = this,
            cookies,
            profile,
            classroom = {};

        return utils.setupDriver(self._driver)
            .then(function () {
                return self._driver.get(url)
            })
            .then(function() {
                return utils.generateCookie()
            })
            .then(function(cookieData) {
                profile = cookieData.profile;
                cookies = cookieData.cookies;
                return self._driver.manage().addCookie('hiveschool_auth', cookies.sid);
            })
            .then(function() {
                return self._driver.manage().addCookie('hiveschool_id', cookies.profile);
            })
            .then(function() {
                return self._driver.manage().addCookie('hiveschool_tokens', cookies.tokens);
            })
            .then(function() {
                return self._driver.navigate().to(url);
            })
            .then(self._driver.waitForApplicationToLoad)
            .then(function () {
                return self._driver.wait(until.elementsLocated(utils.byMontageId('digitInput')))
            })
            .then(function (elements) {
                for (var i = 0; i < elements.length; i++) {
                    elements[i].sendKeys(accessCode[i]);
                }
            })
            .then(function () {
                return self._driver.waitForElementLocated(utils.byMontageId('joinClassButton'));
            })
            .then(self._driver.showElement)
            .then(function (element) {
                self._driver.sleep(250);
                return utils.clickButton(element);
            })
            .then(function () {
                return self._driver.waitForElementLocated(utils.byMontageId('teacher'));
            })
            .then(function (element) {
                return element.getText();
            })
            .then(function(teacher) {
                classroom.teacher = teacher;
                return self._driver.waitForElementLocated(utils.byMontageId('classroom'));
            })
            .then(function (element) {
                return element.getText();
            })
            .then(function(name) {
                classroom.name = name;
                return classroom;
            })
            .thenCatch(function(err) {
                self._driver.manage().logs().get('browser')
                    .then(function(logs) {
                        console.log(logs);
                    });
                console.log(err);
                throw err;
            });
    };

    this.close = function(isConnected) {
        var self = this;
        if (isConnected) {
            return this._driver.navigate().refresh()
                .then(function() {
                    return self._driver.wait(until.alertIsPresent());
                })
                .then(function(alert) {
                    alert.accept();
                })
                .then(function() {
                    self._driver.close();
                })
                ;
        } else {
            return this._driver.close();
        }
    };
};

