var Component = require("montage/ui/component").Component;

exports.TimelineChart = Component.specialize({

    enterDocument: {
        value: function (isFirstTime) {
            if (isFirstTime) {
                window.addEventListener("resize", this, false);
            }
        }
    },

    handleResize: {
        value: function () {
            this.needsDraw = true;
        }
    },

    _start: {
        value: "00:00"
    },

    start: {
        get: function () {
            return this._start;
        },
        set: function (value) {
            if (value && value != this._start) {
                this._start = value;
                this.needsDraw = true;
            }
        }
    },

    _end: {
        value: "24:00"
    },

    end: {
        get: function () {
            return this._end;
        },
        set: function (value) {
            if (value && value != this._end){
                this._end = value;
                this.needsDraw = true;
            }
        }
    },

    _data: {
        value: null
    },

    data: {
        get: function () {
            return this._data;
        },
        set: function (value) {
            if (value && value != this._data){
                this._data = value;
                this.needsDraw = true;
            }
        }
    },

    _getHours: {
        value: function (timeString) {
            return timeString.substring(0, timeString.indexOf(":")) * 1;
        }
    },

    _getMinutes: {
        value: function (timeString) {
            return timeString.substring(timeString.indexOf(":") + 1) * 1;
        }
    },

    _getTotalMinutes: {
        value: function (timeString) {
            return this._getHours(timeString) * 60 + this._getMinutes(timeString);
        }
    },

    _convertMinutesToString: {
        value: function (minutes) {
            var hour = Math.floor(minutes / 60),
                minutesString;

            minutes = minutes - hour * 60;
            hour = hour % 24;
            minutesString = ":" + (minutes + 100).toString().substr(1);

            if (!hour) {
                return "12" + minutesString + " AM";
            }
            if (hour < 12) {
                return hour + minutesString + " AM";
            }
            if (hour === 12) {
                return "12" + minutesString + " PM";
            }
            return (hour - 12) + minutesString + " PM";
        }
    },

    _hoursMargin: {
        value: 12
    },

    _intervals: {
        value: [
            "0:01",
            "0:02",
            "0:05",
            "0:10",
            "0:15",
            "0:30",
            "1:00",
            "2:00",
            "3:00",
            "4:00",
            "5:00",
            "6:00",
            "7:00",
            "8:00",
            "9:00",
            "11:00",
            "12:00",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
            "17:00",
            "18:00",
            "19:00",
            "20:00",
            "21:00",
            "22:00",
            "23:00",
            "24:00"
        ]
    },


    _interval: {
        value: "0:01"
    },

    interval: {
        get: function () {
            return this._interval;
        },
        set: function (value) {
            if (value && value != this.interval){
                this._interval = value;
                this.needsDraw = true;
            }
        }
    },

    _maxSecondaySubdivisions: {
        value: 4
    },

    maxSecondaySubdivisions: {
        get: function () {
            return this._maxSecondaySubdivisions;
        },
        set: function (value) {
            if (value && value != this._maxSecondaySubdivisions){
                this._maxSecondaySubdivisions = value;
                this.needsDraw = true;
            }
        }
    },

    willDraw: {
        value: function () {
            if (this.hourToMeasure) {
                this._hourWidth = this.hourToMeasure.offsetWidth + this._hoursMargin;
                this._hourHeight = this.hourToMeasure.offsetHeight;
                this.hourToMeasure = null;
            }
            if (this.lineToMeasure) {
                this._lineHeight = this.lineToMeasure.offsetHeight;
                this.lineToMeasure = null;
            }
            if (this.segmentToMeasure) {
                this._segmentHeight = this.segmentToMeasure.offsetHeight;
                this.segmentToMeasure = null;
            }
            this._width = this.element.clientWidth;
        }
    },

    draw: {
        value: function () {
            var startTime = this._getTotalMinutes(this._start),
                endTime = this._getTotalMinutes(this._end),
                hourElement,
                lineElement,
                segmentElement,
                padding = Math.ceil(this._hourWidth * .5),
                step = this._getTotalMinutes(this._interval),
                steps,
                interval,
                minLabelStep,
                labelStep,
                difference,
                minDifference = Infinity,
                segmentData,
                i;

            this.hoursElement.style.height = this._hourHeight + "px";
            this.linesElement.style.height = this._lineHeight + "px";
            this.segmentsElement.style.height = this._segmentHeight + "px";
            this.linesElement.style.marginLeft = padding + "px";
            this.linesElement.style.marginRight = padding + "px";
            this.segmentsElement.style.marginLeft = padding + "px";
            this.segmentsElement.style.marginRight = padding + "px";
            this.hoursElement.innerHTML = "";
            minLabelStep = Math.ceil(this._hourWidth / ((this._width - 2 * padding - 1) / (endTime - startTime)));
            for (i = 0; i < this._intervals.length; i++) {
                interval = this._getTotalMinutes(this._intervals[i]);
                difference = interval - minLabelStep;
                if (interval >= step && interval % step === 0 && difference >= 0 && difference < minDifference) {
                    minDifference = difference;
                    labelStep = interval;
                }
            }
            i = 0;
            while (labelStep / step > this._maxSecondaySubdivisions && i < this._intervals.length) {
                interval = this._getTotalMinutes(this._intervals[i]);
                if (labelStep % interval === 0) {
                    step = interval;
                }
                i++;
            }
            if (step > 60) {
                step = 60;
            }
            for (i = startTime; i <= endTime; i += labelStep) {
                hourElement = document.createElement("div");
                hourElement.classList.add("TimelineChart-hour");
                hourElement.textContent = this._convertMinutesToString(i);
                hourElement.style.width = this._hourWidth + "px";
                hourElement.style.left = ((i - startTime) * (this._width - 2 * padding - 1)) / (endTime - startTime) + "px";
                this.hoursElement.appendChild(hourElement);
            }
            this.linesElement.innerHTML = "";
            for (i = startTime; i <= endTime; i += step) {
                lineElement = document.createElement("div");
                lineElement.classList.add("TimelineChart-line");
                if ((i - startTime) % labelStep) {
                    lineElement.classList.add("TimelineChart-line-secondary");
                }
                lineElement.style.left = Math.round(((i - startTime) * (this._width - 2 * padding - 1)) / (endTime - startTime)) + "px";
                this.linesElement.appendChild(lineElement);
            }
            this.segmentsElement.innerHTML = "";
            if (this._data) {
                for (i = 0; i < this._data.length; i++) {
                    segmentData = this._data[i];
                    segmentElement = document.createElement("div");
                    segmentElement.classList.add("TimelineChart-segment");
                    segmentElement.style.width = "10px";
                    segmentElement.style.background = segmentData.background;
                    segmentElement.title = segmentData.url;
                    segmentElement.style.width = Math.round(((((this._getTotalMinutes(segmentData.end) - this._getTotalMinutes(segmentData.start))) * (this._width - 2 * padding - 1)) / (endTime - startTime)) + 1) + "px";
                    segmentElement.style.left = Math.round(((this._getTotalMinutes(segmentData.start) - startTime) * (this._width - 2 * padding - 1)) / (endTime - startTime)) + "px";
                    this.segmentsElement.appendChild(segmentElement);
                }
            }
        }
    },



});
