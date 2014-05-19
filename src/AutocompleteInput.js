/*
 *
 *   The MIT License (MIT)
 *
 *   Copyright (c) 2014 Motley Agency
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *   THE SOFTWARE.
 *
 * Owner: lauri@motleyagency.com
 * @license MIT
 * @copyright Motley Agency, 2014
 *
* */

define(function(require, exports, module) {
    var Surface = require('famous/core/Surface');
    var ContainerSurface = require('famous/surfaces/ContainerSurface');
    var SequentialLayout = require('famous/views/SequentialLayout');
    var InputSurface = require('famous/surfaces/InputSurface');
    var Modifier = require('famous/core/Modifier');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Transform = require('famous/core/Transform');
    var Timer = require('famous/utilities/Timer');

    /**
     * Autocomplete widget that wraps up an InputSurface and list of clickable
     *   surfaces as options within a ContainerSurface. Use addOption to add options,
     *   clear to hide and remove them all, showOptions to show them and hideOptions
     *   to hide (these will fire on focus and blur by default).
     * @param options
     * @constructor
     */
    function AutocompleteInput(options) {
        ContainerSurface.call(this, {
            size: options.size || [undefined, true],
            classes: options.classes || ['autocomplete-input']
        });

        this._inputHeight = 40;
        this._input = new InputSurface({
            size: options.inputSize || [undefined, this._inputHeight],
            placeholder: options.placeholder || '',
            properties: {
                zIndex: 999
            }
        });

        this._options = [];
        this._maxOptions = options.maxOptions || 5;
        this._optionsCurrentIndex = 0;
        this._optionsHeight = options.optionHeight || 40;

        this._input.on('focus', function() {
            this.showOptions();
        }.bind(this));

        this._input.on('blur', function() {
            this.hideOptions();
        }.bind(this));

        var _debouncedFiltering =
            Timer.debounce(function() {
                    this._filter(this._input.getValue());
                }.bind(this),
                800);
        this._input.on('keyup', function(e) {
            _debouncedFiltering();
            if(e.which == 13) {
                this.emit('selected', this.val());
            }
        }.bind(this));

        this.add(this._input);
    }

    AutocompleteInput.prototype = Object.create(ContainerSurface.prototype);
    AutocompleteInput.prototype.constructor = AutocompleteInput;

    /**
     * Add one option
     * @param {String} [text] What the option says
     */
    AutocompleteInput.prototype.addOption = function(text) {
        var s = new Surface({
            content: text,
            classes: ['option'],
            size: [undefined, this._optionsHeight],
            properties: {
                zIndex: 998 - this._optionsCurrentIndex
            }
        });
        s.on('touchend', function(e) {
            var v = s.getContent();
            this._input.setValue(v);
            this.emit('selected', v);
        }.bind(this));
        var m = new StateModifier({
            transform: Transform.translate(0, 0, 0)
        });
        this
            .add(m)
            .add(s)
        this._options.push([m, s]);
        this._optionsCurrentIndex++;
    };

    /**
     * Show all the options added via addOption or by the provided array
     * @param {Array} [options] Don't provide this. Use addOption and leave this empty. This is a
     *                          subarray of [Surface, StateModifier] from this._options (internal use
     *                          in filtering)
     */
    AutocompleteInput.prototype.showOptions = function(options) {
        if(!options) {
            if(this.val() != '') {
                this._filter(this.val());
                return;
            } else {
                options = this._options;
            }
        }
        for(var i = 0; i < Math.min(options.length, this._maxOptions); i++) {
            var y = this._inputHeight + this._optionsHeight * i;
            var m = options[i][0];
            var s = 100 * (i - 1);
            setTimeout(function(y, s) {
                m.setTransform(Transform.translate(0, y, 0), {duration: 100});
            }(y, s), s);
        }
    };

    /**
     * Hide all the options
     * @param {Function} [doneCallback] a callback function to be called after the hide animation is done
     */
    AutocompleteInput.prototype.hideOptions = function(doneCallback) {
        var optionsAmount = Math.min(this._maxOptions, this._options.length)
        for(var i = 0; i < optionsAmount; i++) {
            var m = this._options[i][0];
            if(i == optionsAmount - 1 && doneCallback) {
                m.setTransform(Transform.translate(0, 0, 0), {duration: 200}, doneCallback);
            } else {
                m.setTransform(Transform.translate(0, 0, 0), {duration: 200});
            }
        }
    };

    /**
     * Filter options based on the string given. Hides the options that don't match.
     * @param {String} [needle] will be matched against each added option
     * @private
     */
    AutocompleteInput.prototype._filter = function(needle) {
        this.hideOptions(function() {
            var matchingOptions = [];
            needle = needle.toLowerCase();
            for(var i = 0; i < this._options.length; i++) {
                var modAndSurface = this._options[i];
                var t = modAndSurface[1].getContent().toLowerCase();
                if(t.indexOf(needle) != -1) {
                    matchingOptions.push(modAndSurface);
                }
            }
            this.showOptions(matchingOptions);
        }.bind(this));
    };

    /**
     * Hide the options and then clear them
     */
    AutocompleteInput.prototype.clear = function() {
        this.hideOptions(
            function() {
                this._optionsCurrentIndex = 0;
                this._options = [];
            }
        );
    };

    /**
     * Get the current value
     * @returns {string} value of the input field
     */
    AutocompleteInput.prototype.val = function() { return this._input.getValue(); };
    // to be consistent with the verbose style of InputSurface
    AutocompleteInput.prototype.getValue = AutocompleteInput.prototype.val;

    AutocompleteInput.prototype.focus = function() {
        this._input.focus();
    };

    module.exports = AutocompleteInput;
});