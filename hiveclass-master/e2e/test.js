#!/usr/bin/env node
process.env.PATH += ':./bin';

var Promise = require('bluebird'),
    webdriver = require('selenium-webdriver'),
    until = webdriver.until,
    by = webdriver.By,
    assert = require('chai').assert,
    utils = require('./utils'),
    assertions = require('./assertions');


var chromeArgs = [
    'force-device-scale-factor=0.5',
    'auto-select-desktop-capture-source=Entire screen'
];
var teacherCapabilities = webdriver.Capabilities.chrome();
var studentCapabilities = webdriver.Capabilities.chrome();

teacherCapabilities.caps_.chromeOptions = {
    args: chromeArgs.concat('load-extension=../extensions/teacher')
};
studentCapabilities.caps_.chromeOptions = {
    args: chromeArgs.concat('load-extension=../extensions/student')
};

var teacherDriver = new webdriver.Builder()
    .withCapabilities(teacherCapabilities)
    .build();

teacherDriver.waitForElementLocated = utils.waitForElementLocatedBuilder(teacherDriver);
teacherDriver.waitForApplicationToLoad = utils.waitForApplicationToLoadBuilder(teacherDriver);

var studentDriver = new webdriver.Builder()
    .withCapabilities(studentCapabilities)
    .build();

studentDriver.waitForElementLocated = utils.waitForElementLocatedBuilder(studentDriver);
studentDriver.waitForApplicationToLoad = utils.waitForApplicationToLoadBuilder(studentDriver);

var loginUsingGoogle = function (driver, login, password) {
    return driver.waitForElementLocated(by.id('Email'))
        .then(function(element) {
            utils.typeTextInElement(element, login);
            return driver.waitForElementLocated(by.id('Passwd'));
        })
        .then(function(element) {
            utils.typeTextInElement(element, password);
            return driver.waitForElementLocated(by.id('signIn'));
        })
        .then(utils.clickButton)
        .then(function() {
            return driver.waitForElementLocated(by.id('submit_approve_access'), utils.DEFAULT_TIMEOUT)
        })
        .then(function(element) {
            return driver.wait(until.elementIsEnabled(element), utils.DEFAULT_TIMEOUT);
        })
        .then(function() {
            return driver.waitForElementLocated(by.id('submit_approve_access'))
        })
        .then(utils.clickButton);
};

var ensureTeacherNameDefaultValue = function (profile) {
    return teacherDriver.waitForElementLocated(utils.byMontageId(('teacherNameField')))
        .then(function (element) {
            var gender = profile.gender == 'male' ? 'Mr' : 'Mrs';
            return element.getAttribute('value')
                .then(function(value) {
                    assert.equal(value, gender + '. ' + profile.lastname);
                })
                .then(function() {
                    element.sendKeys(webdriver.Key.CONTROL, "a", webdriver.Key.NULL,
                        'Mr Foo');
                });
        })
        .then(function () {
            return teacherDriver.waitForElementLocated(utils.byMontageId('nextButton'))
        })
        .then(utils.clickButton);
};

var ensureEnterClassButtonIsActiveOnlyIfClassNamePresent = function () {
    return teacherDriver.waitForElementLocated(utils.byMontageId('enterClassButton'))
        .then(function (element) {
            return assertions.assertElementHasClass(element, 'montage--disabled');
        })
        .then(function () {
            return teacherDriver.waitForElementLocated(utils.byMontageId('firstClassNameField'));
        })
        .then(function (element) {
            element.sendKeys('Bar');
            return teacherDriver.waitForElementLocated(utils.byMontageId('enterClassButton'))
        })
        .then(function (element) {
            teacherDriver.sleep(250);
            return assertions.assertElementHasNotClass(element, 'montage--disabled');
        })
        .then(utils.clickButton);
};

var ensureAccessCodeChangeOnUnlock = function () {
    var accessCode;
    return teacherDriver.wait(until.elementsLocated(utils.byMontageId('digitInput')))
        .then(function (elements) {
            return Promise.all(elements.map(function(x) { return x.getText(); }));
        })
        .then(function (digits) {
            accessCode = digits.join('');
        })
        .then(function () {
            return teacherDriver.waitForElementLocated(utils.byMontageId('unlockButton'));
        })
        .then(utils.clickButton)
        .then(function () {
            return teacherDriver.waitForElementLocated(utils.byMontageId('settingsButton'));
        })
        .then(utils.clickButton)
        .then(function () {
            return teacherDriver.waitForElementLocated(utils.byMontageId('lockClass-switch'));
        })
        .then(function (element) {
            return teacherDriver.wait(until.elementIsVisible(element), utils.DEFAULT_TIMEOUT)
                .then(function () {
                    return element;
                });
        })
        .then(utils.clickButton)
        .then(function () {
            return teacherDriver.wait(until.elementsLocated(utils.byMontageId('digitInput')))
        })
        .then(function (elements) {
            return Promise.all(elements.map(function(x) { return x.getText(); }));
        })
        .then(function (digits) {
            assert.notEqual(accessCode, digits.join(''));
            return digits;
        });
};

var createClassroom = function () {
    var cookies, profile;
    return teacherDriver.get('http://localhost:8080/apps/teacher')
        .then(function() {
            return utils.generateCookie()
        })
        .then(function(cookieData) {
            profile = cookieData.profile;
            cookies = cookieData.cookies;
            return teacherDriver.manage().addCookie('sid', cookies.sid/*, '/', 'localhost:8080'*/);
        })
        .then(function() {
            return teacherDriver.manage().addCookie('hiveclass-profile', cookies.profile/*, '/', 'localhost:8080'*/);
        })
        .then(function() {
            return teacherDriver.navigate().to('http://localhost:8080/apps/teacher');
        })
        .then(teacherDriver.waitForApplicationToLoad)
        .then(function() {
            return ensureTeacherNameDefaultValue(profile)
        })
        .then(ensureEnterClassButtonIsActiveOnlyIfClassNamePresent);
};

var enterClassAsAStudent = function(accessCode) {
    var cookies, profile;
    return studentDriver.get('http://localhost:8080/apps/student')
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
            return studentDriver.navigate().to('http://localhost:8080/apps/student');
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
        .then(function (element) {
            return assertions.assertElementHasText(element, 'Mr Foo');
        })
        .then(function () {
            return studentDriver.waitForElementLocated(utils.byMontageId('classroom'));
        })
        .then(function (element) {
            return assertions.assertElementHasText(element, 'Bar');
        })
        .then(function () {
            return studentDriver.waitForElementLocated(utils.byMontageId('resourcesSubstitution'));
        })
        .then(function (element) {
            return assertions.assertElementHasText(element, 'Mr Foo has not currently assigned any resources');
        })
    ;
};

var ensureStudentIsShownAsConnected = function () {
    return teacherDriver.waitForElementLocated(utils.byMontageId('nameHexagon'))
        .then(function (element) {
            return assertions.assertElementHasText(element, 'Tester\nAccount 2');
        })
        .then(function () {
            return teacherDriver.waitForElementLocated(utils.byMontageId('color-hexagon'));
        })
        .then(function (element) {
            return assertions.assertElementHasNotClass(element, 'hidden');
        })
};

var ensureStudentIsShownAsDisconnected = function () {
    return teacherDriver.waitForElementLocated(utils.byMontageId('nameHexagon'))
        .then(function (element) {
            return assertions.assertElementHasText(element, 'Tester\nAccount 2');
        })
        .then(function () {
            return teacherDriver.waitForElementLocated(utils.byMontageId('color-hexagon'));
        })
        .then(function (element) {
            return assertions.assertElementHasClass(element, 'hidden');
        })
};

var disconnectStudent = function () {
    return studentDriver.waitForElementLocated(utils.byMontageId('studentMenuButton'))
        .then(utils.clickButton)
        .then(function () {
            return studentDriver.waitForElementLocated(utils.byMontageId('leaveClass'));
        })
        .then(function (element) {
            return studentDriver.wait(until.elementIsVisible(element), utils.DEFAULT_TIMEOUT)
                .then(function () {
                    return element;
                });
        })
        .then(utils.clickButton)
        .then(function () {
            return studentDriver.wait(until.elementsLocated(by.className('classroom-item')), utils.DEFAULT_TIMEOUT);
        })
        .then(function (elements) {
            assert.equal(elements.length, 1);
        });
};

function launchTest() {
    return utils.setupDriver(teacherDriver)
        .then(function () {
            return utils.setupDriver(studentDriver, true);
        })
        .then(createClassroom)
        .then(ensureAccessCodeChangeOnUnlock)
        .then(enterClassAsAStudent)
        .then(ensureStudentIsShownAsConnected)
        .then(disconnectStudent)
        .then(ensureStudentIsShownAsDisconnected)
        ;
}

launchTest()
    .then(function() {
        teacherDriver.close();
        studentDriver.close();
    }, function(err) {
        teacherDriver.manage().logs().get('browser')
            .then(function(logs) {
                console.log(logs);
            });
        studentDriver.manage().logs().get('browser')
            .then(function(logs) {
                console.log(logs);
            });
        console.log(err);
    });
