/**
 * @module ui/aerohive-logo.reel
 * @requires montage/ui/component
 */

var Anchor = require("matte/ui/anchor.reel").Anchor;

/**
 * Montage Anchor
 * @class module:"matte/ui/anchor.reel".Anchor
 * @extends module:"native/ui/anchor.reel".Anchor
 */
exports.AerohiveAnchor = Anchor.specialize(/** @lends module:"matte/ui/anchor.reel".Anchor# */ {

    hasTemplate: {value: true}

});
