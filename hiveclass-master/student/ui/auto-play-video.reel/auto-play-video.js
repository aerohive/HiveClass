/**
 * @module ui/auto-play-video.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class AutoPlayVideo
 * @extends Component
 */
var AutoPlayVideo = exports.AutoPlayVideo = Component.specialize(/** @lends AutoPlayVideo# */ {


    pause: {
        value: function () {
            this.element.pause();
        }
    }

});


AutoPlayVideo.addAttributes({
    width: {value: "640px", dataType: 'string'},
    height: {value: "480px", dataType: 'string'}
});
