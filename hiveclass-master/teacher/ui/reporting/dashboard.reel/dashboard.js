/**
 * @module ui/reporting/dashboard.reel
 */
var Component = require("montage/ui/component").Component,
    Application = require("montage/core/application").application,
    DigitRadioButton = require("digit/ui/radio-button.reel").RadioButton,
    MontageText = require("montage/ui/text.reel").Text;

/**
 * @class Dashboard
 * @extends Component
 */
exports.Dashboard = Component.specialize(/** @lends Dashboard.prototype */{

    _studentList: {
        value: null
    },

    session: {
        value: null
    },

    studentList: {
        get: function() {
            return this._studentList;
        },
        set: function(studentList) {
            this._studentList = studentList;
        }
    },

    selectedStudent: {
        value: null
    },

    percentageToString: {
        value: function (percentage) {
            return Math.round(percentage) + "%";
        }
    },

    _updateInterval: {
        value: null
    },

    activity: {
        value: null
    },


    _activityLog: {
        value: null
    },

    activityLog: {
        get: function() {
            return this._activityLog;
        },
        set: function(activityLog) {
            this._activityLog = activityLog;
        }
    },

    classSession: {
        value:null
    },

    classStartTime: {
        value: null
    },

    classEndTime: {
        value: null
    },

    _timestampToTime: {
        value: function(timestamp) {
            var date = new Date(timestamp * 1000),
                hours = date.getHours(),
                minutes = "0" + date.getMinutes(),
                formattedTime = hours + ':' + minutes.substr(-2);

                return formattedTime;
        }
    },

    colors: {
        value: [
        '#0066b3',
        '#ff8000',
        '#ffcc00',
        '#330099',
        '#990099',
        '#ccff00',
        '#008f00',
        '#00487d',
        '#b35a00',
        '#b38f00',
        '#6b006b',
        '#8fb300',
        '#b30000',
        '#bebebe',
        '#80ff80',
        '#80c9ff',
        '#ffc080',
        '#ffe680',
        '#aa80ff',
        '#ee00cc',
        '#ff8080',
        '#666600',
        '#ffbfff',
        '#00ffcc',
        '#cc6699',
        '#999900',
        '#00cc00']
    },

    _getBaseUrl: {
        value: function (url) {
            var domain;
            //find & remove protocol (http, ftp, etc.) and get domain
            if (url.indexOf("://") > -1) {
                domain = url.split('/')[2];
            }
            else {
                domain = url.split('/')[0];
            }

            //find & remove port number
            domain = domain.split(':')[0];

            return domain;
        }

    },

    _formatActivity: {
        value: function (url, start, end, background, details) {

            switch (url) {
                case 'CLASSROOM_START':
                    background = '#e6e6e6';
                    url = 'Teacher Starts Class';
                    break;
                case 'ENTER':
                    url = 'Student Enters Class';
                    background = '#e6e6e6';
                    break;
                case 'NATIVE':
                    url = 'Out of Browser';
                    background = '#b3b3b3';
                    break;
                case 'EXIT':
                    background = '#e6e6e6';
                    url = 'Student Exits Classroom';
                    break;
                case 'CLASSROOM_END':
                    url = 'Teacher Ends Class';
                    background = '#000000';
                    break;
                case document.domain:
                    background = '#00e600';
                    break;
                case 'www.facebook.com':
                    background = '#FF0000';
                    break;
            }
                return {url, start, end, background, details};
        }

    },

    _reuseColors : {
        value: function (chartData, currentUrl) {

            var duplicateUrl = chartData.filter(function(value){return value.url == currentUrl})[0];
            if (duplicateUrl) {
                return duplicateUrl.background;
            }
        }
    },

    _getChartData: {
        value: function ( ) {

            var chartData = [],
                colorIndex = 0,
                firstActivityTime = this.activities[0].timestamp,
                lastActivity = this.activities.slice(-1)[0],
                lastActivityTime = lastActivity.timestamp,
                endTime = (lastActivity.url == 'CLASSROOM_END') ? lastActivityTime : Math.round(Date.now() / 1000);

            this.classStartTime = this._timestampToTime(firstActivityTime);

            for (i = 0; i < this.activities.length; i++) {
                var previousActivity = this.activities[i-1],
                    currentActivity = this.activities[i],
                    nextActivity = this.activities[i+1],
                    currentUrl = this._getBaseUrl(currentActivity.url),
                    previousUrl = previousActivity ? this._getBaseUrl(previousActivity.url) : null,
                    nextStart = nextActivity ? nextActivity.timestamp : endTime,
                    backgroundColor = this.colors[colorIndex++ % this.colors.length],
                    existingColor = this._reuseColors(chartData, currentUrl),
                    detailsUrl = [];


                if (currentUrl != previousUrl) {
                    detailsUrl.push(currentActivity.url);
                    backgroundColor = existingColor ? existingColor : backgroundColor;
                    chartData.push(this._formatActivity(
                        currentUrl,
                        this._timestampToTime(currentActivity.timestamp),
                        this._timestampToTime(nextStart),
                        backgroundColor,
                        detailsUrl
                        )
                    );
                } else {
                    var entry = chartData.pop();
                    entry.details.push(currentActivity.url);
                    entry.end = this._timestampToTime(nextStart);
                    chartData.push(entry);
                }

                this.classEndTime = this._timestampToTime(Math.max(firstActivityTime + 300, nextStart));
            }
            return chartData;
        }

    },

    chartData: {
        value: null
    },

    sessionTime: {
        value: null
    },

    _getSessionTime: {
        value: function (session) {
            var firstsplit = session.split("_"),
                secondsplit = firstsplit[0].split("-"),
                array = secondsplit.splice(1, 2);
                array.push(secondsplit[0]);

            var date = array.join('/');
                date += ' - ';

            var time = this.application.reportingService.convertTime(firstsplit[1]);

            this.sessionTime = date + time;
        }
    },

    _updateChart: {
        value: function () {
            this.chartData = this._getChartData();

            if (!this.templateObjects.sessionSwitcher.toggleChecked && !this.noPrevious && !this.noCurrent){
                this.templateObjects.sessionSwitcher.enableToggle();
            }
        }
    },

    // =============================================================================================
    // Event Handlers
    // =============================================================================================

    handleClick: {
        value: function (event) {
            var target = event.target;

            if (target && target.tagName === "LABEL" && target.component instanceof Label) {
                var switchTarget = document.getElementById(target.component.for);

                if (switchTarget && switchTarget.component instanceof RadioButton && !switchTarget.component.checked) {
                    switchTarget.component.checked = true;
                    switchTarget.component.check();
                }
            }
        }
    },

    handleSessionSwitcherAction: {
        value: function () {
            this.selectedStudent = this.studentList[0];
            this._getSessionTime(this.session);
        }
    },

    // =============================================================================================
    // Life Cycle Hooks
    // =============================================================================================

    enterDocument: {
        value: function () {
            this.selectedStudent = this.studentList[0];
            this.chartData = this._getChartData();
            this._updateInterval = setInterval(this._updateChart.bind(this), 3000);
            this._getSessionTime(this.session);

            if (this.noPrevious || this.noCurrent){
                this.templateObjects.sessionSwitcher.disableToggle();
            }

            Application.analyticsService.trackView({
                "screenName": "Reporting"
            });
        }
    },

    exitDocument: {
        value: function () {
            clearInterval(this._updateInterval);
        }
    }

});

var RadioButton = exports.RadioButton = DigitRadioButton.specialize();

RadioButton.prototype._templateModuleId = DigitRadioButton.prototype.templateModuleId;

RadioButton.addAttributes({
    id: {value: null, dataType: 'string'}
});

var Label = exports.Label = MontageText.specialize();

Label.addAttributes({
    for: {value: null, dataType: 'string'}
});

