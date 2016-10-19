var Skinable = require('../core/Skinable');

/**
 * InputControl used for TextInput, TextArea and everything else that
 * is capable of entering text
 *
 * roughly based on PIXI.Input InputObject by Sebastian Nette,
 * see https://github.com/SebastianNette/PIXI.Input
 *
 * @class InputControl
 * @extends GOWN.Skinable
 * @memberof GOWN
 * @constructor
 */
function InputControl(theme) {
    Skinable.call(this, theme);

    this.receiveKeys = true;

    /**
     * current position of the cursor in the text
     */
    this.cursorPos = 0;

    /**
     * character position of selected area in the text (start and end)
     *
     * @type {Array}
     * @private
     */
    this.selection = [0, 0];

    /**
     * character position that marks the beginning of the current selection
     */
    this.selectionStart = 0;

    this.textOffset = new PIXI.Point(5, 4);

    this.text = this.text || '';

    this.hasFocus = false;

    /**
     * indicates if the mouse button has been pressed
     * @property _mouseDown
     * @type {boolean}
     * @private
     */
    this._mouseDown = false;

    this.currentState = InputControl.UP;

    /**
     * timer used to indicate if the cursor is shown
     *
     * @property _cursorTimer
     * @type {Number}
     * @private
     */
    this._cursorTimer = 0;

    /**
     * indicates if the cursor position has changed
     *
     * @property _cursorNeedsUpdate
     * @type {Boolean}
     * @private
     */

    this._cursorNeedsUpdate = true;

    /**
     * interval for the cursor (in milliseconds)
     *
     * @property blinkInterval
     * @type {number}
     */
    this.blinkInterval = 500;

    // caret/selection sprite
    this.cursor = new PIXI.Text('|', this.cursorStyle);
    if (this.pixiText) {
        this.cursor.y = this.pixiText.y;
    }
    this.addChild(this.cursor);

    // selection background
    this.selectionBg = new PIXI.Graphics();
    this.addChildAt(this.selectionBg, 0);

    // TODO: remove events on destroy
    // setup events
    this.on('touchstart', this.onDown, this);
    this.on('mousedown', this.onDown, this);

    this.on('touchend', this.onUp, this);
    this.on('mouseupoutside', this.onUp, this);
    this.on('mouseup', this.onUp, this);

    this.on('mousemove', this.onMove, this);
    this.on('touchmove', this.onMove, this);

    this.on('keydown', this.onKeyDown, this);
    this.on('keyup', this.onKeyUp, this);
}

InputControl.prototype = Object.create( Skinable.prototype );
InputControl.prototype.constructor = InputControl;
module.exports = InputControl;

/**
 * Up state: mouse button is released or finger is removed from the screen
 *
 * @property UP
 * @static
 * @final
 * @type String
 */
InputControl.UP = 'up';

/**
 * Down state: mouse button is pressed or finger touches the screen
 *
 * @property DOWN
 * @static
 * @final
 * @type String
 */
InputControl.DOWN = 'down';

/**
 * Hover state: mouse pointer hovers over the button
 * (ignored on mobile)
 *
 * @property HOVER
 * @static
 * @final
 * @type String
 */
InputControl.HOVER = 'hover';

/**
 * Hover state: mouse pointer hovers over the button
 * (ignored on mobile)
 *
 * @property HOVER
 * @static
 * @final
 * @type String
 */
InputControl.OUT = 'out';


/**
 * names of possible states for a button
 *
 * @property stateNames
 * @static
 * @final
 * @type String
 */
InputControl.stateNames = [
    InputControl.DOWN, InputControl.HOVER, InputControl.UP
];

/**
 * currently selected input control (used for tab index)
 *
 * @property currentInput
 * @type GOWN.InputControl
 * @static
 */
InputControl.currentInput = null;

InputControl.prototype.onKeyDown = function (eventData) {
    if (!this.hasFocus) {
        return;
    }
    var key = eventData.data.key;
    // TODO implement the insert key to overwrite text? it is gnored for now!
    if (key === 'WakeUp' || key === 'CapsLock' ||
        key === 'Shift' || key === 'Control' || key === 'Alt' ||
        (key.substring(0,1) === 'F' && key.length > 1) || // F1-F12
        key === 'Insert' ||
        key === 'Escape' || key === 'NumLock' ||
        key === 'Meta' || // Chrome Meta/Windows Key
        key === 'Win' || // Internet Explorer Meta/Windows Key
        key === 'Dead' || // Chrome Function/Dead Key
        key === 'Unidentified' // Internet Explorer Function Key
        ) {
        // ignore single shift/control/alt, meta and dead keys
        return;
    }

    if (key === 'Tab') {
        // TODO: implement Tab / TabIndex
        return;
    }
    if (key === 'Enter') {
        this.emit('enter', this);
        return;
    }

    // check for selected Text
    var selected = this.selection && (
        this.selection[0] !== this.selection[1]);

    switch (key) {
        case 'Left': // Internet Explorer left arrow
        case 'ArrowLeft': // Chrome left arrow
            this.moveCursorLeft();
            if (eventData.data.shiftKey) {
                this.updateSelection(this.cursorPos, this.selection[1]);
            } else {
                this.updateSelection(this.cursorPos, this.cursorPos);
            }
            break;
        case 'Right':
        case 'ArrowRight':
            this.moveCursorRight();
            if (eventData.data.shiftKey) {
                this.updateSelection(this.selection[0], this.cursorPos);
            } else {
                this.updateSelection(this.cursorPos, this.cursorPos);
            }
            break;
        case 'PageDown':
        case 'PageUp':
        case 'Home':
        case 'End':
            // TODO: implement jump to first/last character
            // ignored for now...
            break;
        case 'Up':
        case 'ArrowUp':
            /*this.moveCursorUp();
            if (eventData.data.shiftKey) {
                if (maxLines === 0) {
                    this.cursorPos = 0;
                }
                this.updateSelection(this.cursorPos, this.selection[1]);
            } else {
                this.updateSelection(this.cursorPos, this.cursorPos);
            }
            this._cursorNeedsUpdate = true;*/
            break;
        case 'Down':
        case 'ArrowDown':
            /*this.moveCursorDown();
            if (eventData.data.shiftKey) {
                if (maxLines === 0) {
                    this.cursorPos = this.text.length;
                }
                this.updateSelection(this.selection[0], this.cursorPos);
            } else {
                this.updateSelection(this.cursorPos, this.cursorPos);
            }
            this._cursorNeedsUpdate = true;*/
            break;
        case 'Backspace':
            if (selected) {
                // remove only the selected Text
                this.deleteSelection();
                this.updateSelection(this.cursorPos, this.cursorPos);
            } else if (this.cursorPos > 0) {
                //if (eventData.data.ctrlKey) {
                    // TODO: delete previous word!
                //}
                // remove last char at cursorPosition
                this.moveCursorLeft();
                this.deleteText(this.cursorPos, this.cursorPos+1);
            }
            // ignore browser-back
            eventData.originalEvent.preventDefault();
            break;
        case 'Del': // Internet Explorer Delete Key
        case 'Delete': // Chrome Delete Key
            if (selected) {
                this.deleteSelection();
                this.updateSelection(this.cursorPos, this.cursorPos);
            } else if (this.cursorPos < this.text.length) {
                //if (eventData.data.ctrlKey) {
                    // TODO: delete previous word!
                //}
                // remove next char after cursorPosition
                this.deleteText(this.cursorPos, this.cursorPos+1);
            }
            break;
        default:
            // select all text
            if (eventData.data.ctrlKey && key.toLowerCase() === 'a') {
                this.cursorPos = this.text.length;
                this.updateSelection(0, this.cursorPos);
                this._cursorNeedsUpdate = true;
                return;
            }
            // allow µ or ² but ignore keys for browser refresh / show Developer Tools
            if (eventData.data.ctrlKey && (key.toLowerCase() === 'j' || key.toLowerCase() === 'r')) {
                return;
            }
            if (selected) {
                this.deleteSelection();
            }


            // Internet Explorer space bar
            if (key === 'Spacebar') {
                key = ' ';
            }
            if (key === ' ') {
                // do not scroll down when the space bar has been pressed.
                eventData.originalEvent.preventDefault();
            }

            if (key.length !== 1) {
                throw new Error('unknown key ' + key);
            }

            this.insertChar(key);
            this.updateSelection(this.cursorPos, this.cursorPos);
    }
};

InputControl.prototype.moveCursorLeft = function() {
    this.cursorPos = Math.max(this.cursorPos-1, 0);
    this._cursorNeedsUpdate = true;
};

InputControl.prototype.moveCursorRight = function() {
    this.cursorPos = Math.min(this.cursorPos+1, this.text.length);
    this._cursorNeedsUpdate = true;
};

/**
 * insert char at current cursor position
 */
InputControl.prototype.insertChar = function(char) {
    if (this.maxChars > 0 && this.pixiText.text >= this.maxChars) {
        this.pixiText.text = this.pixiText.text.substring(0, this.maxChars);
        return;
    }
    this.text = [this.text.slice(0, this.cursorPos), char, this.text.slice(this.cursorPos)].join('');
    this.moveCursorRight();
    this.emit('change', this);
};

/**
 * delete selected text
 *
 */
InputControl.prototype.deleteSelection = function() {
    var start = this.selection[0];
    var end = this.selection[1];
    if (start < end) {
        this.cursorPos = start;
        return this.deleteText(start, end);
    } else if (start > end) {
        this.cursorPos = end;
        return this.deleteText(end, start);
    }
    throw new Error('can not delete text! (start & end are the same)');
};



/**
 * deletion from to multiple lines
 */
InputControl.prototype.deleteText = function(fromPos, toPos) {
    this.text = [this.text.slice(0, fromPos), this.text.slice(toPos)].join('');
    this.emit('change', this);
    return this.text;
};

InputControl.prototype.skinableSetTheme = Skinable.prototype.setTheme;
/**
 * change the theme
 *
 * @method setTheme
 * @param theme the new theme {Theme}
 */
InputControl.prototype.setTheme = function(theme) {
    if (theme === this.theme || !theme) {
        return;
    }
    this.skinableSetTheme(theme);
    // copy text so we can force wordwrap
    this.style = theme.textStyle;
};

InputControl.prototype.setText = function(text) {
    this._displayText = text || '';
    if (!this.pixiText) {
        this.pixiText = new PIXI.Text(text, this.textStyle);
        this.pixiText.position = this.textOffset;
        this.addChild(this.pixiText);
    } else {
        this.pixiText.text = text;
    }
};

/**
 * set the text that is shown inside the input field.
 * calls onTextChange callback if text changes
 *
 * @property text
 * @type String
 */
Object.defineProperty(InputControl.prototype, 'text', {
    get: function () {
        if (this.pixiText) {
            return this.pixiText.text;
        }
        return this._origText;
    },
    set: function (text) {
        text += ''; // add '' to assure text is parsed as string
        if (this._origText === text) {
            // return if text has not changed
            return;
        }
        this._origText = text;
        this.setText(text);

        // reposition cursor
        this._cursorNeedsUpdate = true;
    }
});

/**
 * The maximum number of characters that may be entered. If 0,
 * any number of characters may be entered.
 * (same as maxLength for DOM inputs)
 *
 * @default 0
 * @property maxChars
 * @type String
 */
Object.defineProperty(InputControl.prototype, 'maxChars', {
    get: function () {
        return this._maxChars;
    },
    set: function (value) {
        if (this._maxChars === value) {
            return;
        }
        if (this.pixiText.text > value) {
            this.pixiText.text = this.pixiText.text.substring(0, value);
            if (this.cursorPos > value) {
                this.cursorPos = value;
                this._cursorNeedsUpdate = true;
            }
            this.updateSelection(
                Math.max(this.selection[0], value),
                Math.max(this.selection[1], value)
            );
        }
        this._maxChars = value;

    }
});

Object.defineProperty(InputControl.prototype, 'value', {
    get: function() {
        return this._origText;
    }
});

/**
 * set selected text
 *
 * @method updateSelection
 * @param start start position in the text
 * @param end end position in the text
 * @returns {boolean}
 */
InputControl.prototype.updateSelection = function (start, end) {
    if (this.selection[0] !== start || this.selection[1] !== end) {
        this.selection[0] = start;
        this.selection[1] = end;
        this._selectionNeedsUpdate = true;
        return true;
    }
    return false;
};

/**
 * get text width
 *
 * @method textWidth
 * @param text
 * @returns {*}
 */
InputControl.prototype.textWidth = function(text) {
    // TODO: support BitmapText for PIXI v3+
    var ctx = this.pixiText.context;
    return ctx.measureText(text || '').width;
};

/**
 * focus on this input and set it as current
 *
 * @method focus
 */
InputControl.prototype.focus = function () {
    // is already current input
    if (GOWN.InputControl.currentInput === this) {
        return;
    }

    // drop focus
    if (GOWN.InputControl.currentInput) {
        GOWN.InputControl.currentInput.blur();
    }

    // set focus
    GOWN.InputControl.currentInput = this;
    this.hasFocus = true;

    // check custom focus event
    this.onfocus();

    this.emit('focusIn', this);
    /*
     //TODO: disable/ is read only
     if(this.readonly) {
        return;
     }
     */
};

InputControl.prototype.onMouseUpOutside = function() {
    if(this.hasFocus && !this._mouseDown)
    {
        this.blur();
    }
    this._mouseDown = false;
};

/**
 * callback to execute code on focus
 * @method onFocus
 */
InputControl.prototype.onfocus = function () {
};

/**
 * blur the text input (remove focus)
 *
 * @method blur
 */
InputControl.prototype.blur = function() {
    if (GOWN.InputControl.currentInput === this) {
        GOWN.InputControl.currentInput = null;
        this.hasFocus = false;

        // blur hidden input
        this.onblur();
    }
};

/**
 * position cursor on the text
 */
InputControl.prototype.setCursorPos = function () {
    this.textToPixelPos(this.cursorPos, this.cursor.position);
    this.cursor.position.x += this.pixiText.x;
    this.cursor.position.y += this.pixiText.y;
};

/**
 * height of the line in pixel
 * (assume that every character of pixi text has the same line height)
 */
InputControl.prototype.lineHeight = function() {
    var style = this.pixiText._style;
    var fontProperties = this.pixiText.determineFontProperties(this.pixiText._font);
    var lineHeight = style.lineHeight || fontProperties.fontSize + style.strokeThickness;
    return lineHeight;
};

/**
 * draw the cursor
 *
 * @method drawCursor
 */
InputControl.prototype.drawCursor = function () {
    // TODO: use Tween instead!
    if (this.hasFocus || this._mouseDown) {
        var time = Date.now();

        // blink interval for cursor
        if ((time - this._cursorTimer) >= this.blinkInterval) {
            this._cursorTimer = time;
            this.cursor.visible = !this.cursor.visible;
        }

        // update cursor position
        if (this.cursor.visible && this._cursorNeedsUpdate) {
            this.setCursorPos();
            this._cursorNeedsUpdate = false;
        }
    } else {
        this.cursor.visible = false;
    }
};

InputControl.prototype.onMove = function (e) {
    var mouse = e.data.getLocalPosition(this.pixiText);
    if (!this.hasFocus || !this._mouseDown) { // || !this.containsPoint(mouse)) {
        return false;
    }

    var curPos = this.pixelToTextPos(mouse),
        start = this.selectionStart,
        end = curPos;

    if (this.updateSelection(start, end)) {
        this.cursorPos = curPos;
        this._cursorNeedsUpdate = true;
    }
    return true;
};

InputControl.prototype.onDown = function (e) {
    var mouse = e.data.getLocalPosition(this.pixiText);
    var originalEvent = e.data.originalEvent;
    if (originalEvent.which === 2 || originalEvent.which === 3) {
        originalEvent.preventDefault();
        return false;
    }

    // focus input
    this.focus();

    this._mouseDown = true;

    // start the selection drag if inside the input
    this.selectionStart = this.pixelToTextPos(mouse);
    this.updateSelection(this.selectionStart, this.selectionStart);
    this.cursorPos = this.selectionStart;
    this._cursorNeedsUpdate = true;
    return true;
};

InputControl.prototype.onUp = function (e) {
    var originalEvent = e.data.originalEvent;
    if (originalEvent.which === 2 || originalEvent.which === 3) {
        originalEvent.preventDefault();
        return false;
    }

    this.selectionStart = -1;
    this._mouseDown = false;
    return true;
};

/**
 * from position in the text to pixel position
 * (for cursor/selection positioning)
 *
 * @method textToPixelPos
 * @param textPos current character position in the text
 * @returns {Point} pixel position
 */
InputControl.prototype.textToPixelPos = function(textPos, position) {
    var lines = this.getLines();
    var x = 0;
    for (var y = 0; y < lines.length; y++) {
        var lineLength = lines[y].length;
        if (lineLength < textPos) {
            textPos -= lineLength + 1;
        } else {
            var text = lines[y];
            x = this.textWidth(text.substring(0, textPos));
            break;
        }
    }

    if (!position) {
        position = new PIXI.Point(x, y * this.lineHeight());
    } else {
        position.x = x;
        position.y = y * this.lineHeight();
    }
    return position;
};

/**
 * from pixel position on the text to character position inside the text
 * (used when clicked on the text)
 *
 * @method pixelToTextPos
 * @param mousePos position of the mouse on the PIXI Text
 * @returns {Number} position in the text
 */
InputControl.prototype.pixelToTextPos = function(pixelPos) {
    var textPos = 0;
    var lines = this.getLines();
    // calculate current line we are in
    var currentLine = Math.min(
        Math.max(
            parseInt(pixelPos.y / this.lineHeight()),
            0),
        lines.length - 1);
    // sum all characters of previous lines
    for (var i = 0; i < currentLine; i++) {
        textPos += lines[i].length + 1;
    }

    var displayText = lines[currentLine];
    var totalWidth = 0;
    if (pixelPos.x < this.textWidth(displayText)) {
        // loop through each character to identify the position
        for (i = 0; i < displayText.length; i++) {
            totalWidth += this.textWidth(displayText[i]);
            if (totalWidth >= pixelPos.x) {
                textPos += i;
                break;
            }
        }
    } else {
        textPos += displayText.length;
    }
    return textPos;
};

/**
 * callback that will be executed once the text input is blurred
 *
 * @method onblur
 */
InputControl.prototype.onblur = function() {
    this.updateSelection(0, 0);
    this.emit('focusOut', this);
};

// performance increase to avoid using call.. (10x faster)
InputControl.prototype.redrawSkinable = Skinable.prototype.redraw;
InputControl.prototype.redraw = function () {
    if (this.drawCursor) {
        this.drawCursor();
    }
    if (this._selectionNeedsUpdate) {
        this.updateSelectionBg();
    }
    this.redrawSkinable();
};


/**
 * determine if the input has the focus
 *
 * @property hasFocus
 * @type Boolean
 */
Object.defineProperty(InputControl.prototype, 'hasFocus', {
    get: function() {
        return this._hasFocus;
    },
    set: function(focus) {
        this._hasFocus = focus;
    }
});

/**
 * set text style (size, font etc.) for text and cursor
 */
Object.defineProperty(InputControl.prototype, 'style', {
    get: function() {
        return this.textStyle;
    },
    set: function(style) {
        this.cursorStyle = style;
        if (this.cursor) {
            this.cursor.style = style;
        }
        this.textStyle = style;
        if (this.pixiText) {
            this.pixiText.style = style;
            this._cursorNeedsUpdate = true;
        }
        this._cursorNeedsUpdate = true;
    }
});

/**
 * The current state (one of _validStates)
 * TODO: move to skinable?
 *
 * @property currentState
 * @type String
 */
Object.defineProperty(InputControl.prototype, 'currentState',{
    get: function() {
        return this._currentState;
    },
    set: function(value) {
        if (this._currentState === value) {
            return;
        }
        if (this._validStates.indexOf(value) < 0) {
            throw new Error('Invalid state: ' + value + '.');
        }
        this._currentState = value;
        // invalidate state so the next draw call will redraw the control
        this.invalidState = true;
    }
});
