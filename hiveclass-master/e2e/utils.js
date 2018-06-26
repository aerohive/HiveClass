var Promise = require('bluebird'),
    webdriver = require('selenium-webdriver'),
    until = webdriver.until,
    by = webdriver.By;

utils = {
    DEFAULT_TIMEOUT: 10000
};

utils.clickButton = function(button) {
    return button.click();
};

utils.waitForElementLocatedBuilder = function(driver) {
    return function(locator, timeout) {
        timeout = timeout || utils.DEFAULT_TIMEOUT;
        return driver.wait(until.elementLocated(locator), timeout);
    };
};

utils.waitForApplicationToLoadBuilder = function (driver) {
    return function() {
        return driver.waitForElementLocated(by.xpath('//div[@class="Loading"]'))
            .then(function (element) {
                return driver.wait(until.stalenessOf(element), utils.DEFAULT_TIMEOUT);
            });
    };
};

utils.byMontageId = function(montageId) {
    return by.xpath('//*[@data-montage-id="' + montageId + '"]');
};

utils.typeTextInElement = function (element, text) {
    var driver = element.getDriver();
    driver.sleep(100);
    for (var i = 0; i < text.length; i++) {
        element.sendKeys(text[i]);
        driver.sleep(25);
    }
};

utils.setupDriver = function (driver, move) {
    return driver.manage().timeouts().implicitlyWait(utils.DEFAULT_TIMEOUT)
        .then(function () {
            return move ? driver.manage().window().getSize() : Promise.resolve({width: 5});
        })
        .then(function (size) {
            return driver.manage().window().setPosition(size.width+5, 5);
        });
};

utils.generateCookie = function() {
    var Iron = require('iron');

    var SID_PASSWORD = 'session63581e0fca66ca827d10e6bc2f3c538392f09718';
    var PROFILE_PASSWORD = '63581e0fca66ca827d10e6bc2f3c538392f09718';

    var firstnames = [
        'Wilfredo',
        'Bula',
        'Sylvia',
        'Takisha',
        'Stephen',
        'Genna',
        'Fernande',
        'Tyisha',
        'Newton',
        'Misha',
        'Benny',
        'Nannie',
        'Neda',
        'Elwanda',
        'Claire',
        'Chandra',
        'Lana',
        'Racheal',
        'Lita',
        'Marita',
        'Kalyn',
        'Lizbeth',
        'Lovella',
        'Noelia',
        'Lupita',
        'Kristi',
        'Dorine',
        'January',
        'Retha',
        'Maire',
        'Aja',
        'Nathaniel',
        'Lorretta',
        'Suanne',
        'Basilia',
        'Shellie',
        'Nga',
        'Avelina',
        'Xuan',
        'Leona',
        'Lorna',
        'Elfrieda',
        'Tonie',
        'Vernie',
        'Melodee',
        'Shawanda',
        'Veronika',
        'Jerica',
        'Keri',
        'Donn'
    ];

    var lastnames = [
        'Wolfgang',
        'Blumenthal',
        'Selvey',
        'Tseng',
        'Spray',
        'Gillam',
        'Frappier',
        'Traxler',
        'Noone',
        'Meas',
        'Boner',
        'Nealon',
        'Nantz',
        'Eagan',
        'Calfee',
        'Costello',
        'Loffredo',
        'Radabaugh',
        'Levesque',
        'Moad',
        'Kosakowski',
        'Lesher',
        'Loaiza',
        'Newcomer',
        'Lillie',
        'Kleven',
        'Dinatale',
        'Jacko',
        'Roesner',
        'Motsinger',
        'Ang',
        'Noffsinger',
        'Leister',
        'Silverstein',
        'Blankenship',
        'Spaeth',
        'Neve',
        'Acker',
        'Xie',
        'Lampe',
        'Lampe',
        'Evens',
        'Turney',
        'Veasley',
        'Mcconnel',
        'Seville',
        'Vito',
        'Jehle',
        'Kothari',
        'Deavers'
    ];

    var first = firstnames[Math.round(Math.random() * firstnames.length)],
        last = lastnames[Math.round(Math.random() * lastnames.length)],
        picture = 'http://lorempixel.com/300/400/cats/' + first+last;

    var profile = {
        id: Date.now(),
        email: (first+'.'+last+'@montagestudio.com').toLowerCase(),
        gender: ['male', 'female'][Math.min(Math.round(Math.random()*2), 1)],
        firstname: first,
        lastname: last,
        avatar: picture
    };

    return new Promise(function(resolve) {
        Iron.seal(profile, SID_PASSWORD, Iron.defaults, function(error, sealed) {
            resolve(sealed);
        });
    }).then(function(sidSealed) {
            return new Promise(function(resolve) {
                Iron.seal(profile, PROFILE_PASSWORD, Iron.defaults, function(error, sealed) {
                    resolve({
                        profile: profile,
                        cookies: {
                            sid: sidSealed,
                            profile: sealed
                        }
                    });
                });
            });
    });
};


module.exports = utils;
