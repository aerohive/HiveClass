#!/usr/bin/env node
process.env.PATH += ':./bin';

var Promise = require('bluebird'),
    webdriver = require('selenium-webdriver'),
    until = webdriver.until,
    utils = require('./utils');


var chromeArgs = [
    'force-device-scale-factor=0.5',
    'auto-select-desktop-capture-source=Entire screen'
];
var teacherCapabilities = webdriver.Capabilities.chrome();

teacherCapabilities.caps_.chromeOptions = {
    args: chromeArgs.concat('load-extension=../extensions/teacher')
};

exports.TeacherBot = function(url) {
    this._driver = new webdriver.Builder()
        .withCapabilities(teacherCapabilities)
        .build();

    this._driver.waitForElementLocated = utils.waitForElementLocatedBuilder(this._driver);
    this._driver.waitForApplicationToLoad = utils.waitForApplicationToLoadBuilder(this._driver);
    this._driver.showElement = utils.showElementBuilder(this._driver);

    this.createClassroom = function(name) {
        var self = this,
            cookies,
            profile;

        return utils.setupDriver(self._driver)
            .then(function () {
                return self._driver.get(url)
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
                        return self._driver.waitForElementLocated(utils.byMontageId('nextButton'))
                    })
                    .then(self._driver.showElement)
                    .then(utils.clickButton)
                    .then(function() {
                        return self._driver.waitForElementLocated(utils.byMontageId('firstClassNameField'));
                    })
                    .then(function (element) {
                        element.sendKeys(name);
                        return self._driver.waitForElementLocated(utils.byMontageId('enterClassButton'))
                    })
                    .then(self._driver.showElement)
                    .then(function (element) {
                        self._driver.sleep(250);
                        return utils.clickButton(element);
                    })
                    .then(function() {
                        return self._driver.wait(until.elementsLocated(utils.byMontageId('digitInput')));
                    })
                    .then(function (elements) {
                        return Promise.all(elements.map(function(x) { return x.getText(); }));
                    })
                    .then(function (digits) {
                        return digits.join('');
                    })
                    ;
            })
            .then(function(accessCode) {
                return accessCode;
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
