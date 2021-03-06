/**
 * shaft.js
 * @author: 6174
 * -- a fork from pen.js
 * -- provide a custom editor backbone
 *
 *   action: 
 *      an action is an `execCommand` command , beside the default command , shaft provide 
 *      some custom command  
 *
 *   apis:
 *    
 *        editor.execCommand('action', value)
 *        editor.interceptAction('action', value){}
 *        editor.on('keyup|keydown|focus', function(){});
 *        
 */
(function($, exports) {
    var doc = document;
    var Shaft, G, selection = doc.getSelection();
    window.sel = selection;
    G = {
        debug: true,
        keyMap: {
            'enter': 13,
            'backspace': 8,
            'delete': 46,
            'tab': 9,
            'space': 32
        },
        reg: {
            spaces: /^[ \t\f\r\n]+$/,
            spacesMinusLineBreaksRegex: /^[ \t\f\r]+$/,
            nonLineBreakWhiteSpaceRegex: /^[\t \u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000]+$/,
            allWhiteSpaceRegex: /^[\t-\r \u0085\u00A0\u1680\u180E\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]+$/,
            lineBreakRegex: /^[\n-\r\u0085\u2028\u2029]$/
        }
    };
    /**********************************************************************
     * Shaft core
     **********************************************************************/
    /**
     * @klass Shaft
     * @param: conf
     */
    Shaft = klass(null, {
        __construct: function(userConfig) {
            if (!userConfig) {
                log('can\'t find config', true);
                return;
            }
            // export a global variable for test
            window.editor = this;
            this.initialization(userConfig);
            this.defaultIntercept();
        },
        defaultConfig: function() {
            return {
                editorClass: 'shaft',
                debug: true,
                editor: null,
                // handler called before close window
                onCloseWindow: nil
            }
        }
    });
    /**
     * [initialization]
     * @param  {[type]} userConfig [description]
     * @return {[type]}            [description]
     */
    Shaft.prototype.initialization = function(userConfig) {
        var config = this.config = this.defaultConfig(),
            me = this;
        mix(config, userConfig);
        // event enable
        mix(me, getEventHub());
        initEditorElement();
        initActions();
        initEvents();
        return;

        /**
         * editor element initialization
         */
        function initEditorElement() {

            if (config.editor) {
                config.editor = $(config.editor);
            } else {
                // userconfig is a HTMLElement
                config.editor = $(userConfig);
            }

            if (!config.editor) {
                throw new Error('cant\'t find editor');
                return;
            }

            config.editor.addClass(config.editorClass);
            config.editor.attr('contenteditable', 'true');
            me.editor = config.editor;
        }

        /**
         * actions initialization
         */
        function initActions() {
            var commands = config.commands;
            // default command types;
            var types = {
                formatBlocks: 'h1,h2,h3,h4,h5,h6,blockquote,p,pre',
                commands: 'bold,italiz,underline,indent,outdent',
                insert_inline: 'inserthorizontalrule,insertimage',
                source: 'createlink,unlink'
            };

            /**
             * just execCommand
             */
            (types.insert_inline + ',' + types.source + ',' + types.commands).split(',').forEach(function(name) {
                me.registAction(name, function(ev) {
                    var action = ev.type.replace('action-', '');
                    me._execCommand(action, ev.val);
                });
            });

            /**
             * formatblocks
             * need to toggle blockquote
             */
            (types.formatBlocks).split(',').forEach(function(name) {
                me.registAction(name, function(ev) {
                    var action = ev.type.replace('action-', '');
                    //--toggle format
                    if (me.getNodesFromCurrentToEditor(selection.getRangeAt(0).startContainer, true).indexOf(action) !== -1) {
                        if (action === 'blockquote') {
                            return me._execCommand('outdent')
                        }
                        action = 'p';
                    }
                    me._execCommand('formatblock', action)
                });
            });

            'ol,ul'.split(',').forEach(function(name){
                me.registAction(name, function(ev) {
                    var action = ev.type.replace('action-', ''),
                        block = Shaft.getCaretNode(),
                        tagName = block.tagName.toLowerCase();

                    // there is a ol or ul
                    if(me.getNodesFromCurrentToEditor(selection.getRangeAt(0).startContainer, true).indexOf(action) !== -1){
                        return '';
                    }

                    var parent = document.createElement(action),
                        li = document.createElement('li');
                    li.textContent = block.textContent;
                    parent.appendChild(li);
                    $(block).after(parent);
                    $(block).remove();
                    Shaft.moveCaretTo(li);
                });
            }); 


            /**
             * append a node at the end of the editor
             */
            me.registAction('append', function(ev) {
                var child = ev.val;
                me.editor.append(child);
            });

            /**
             * action api for custom command and default command
             */
            me.interceptAction = function() {
                return true;
            }

            me.execCommand = me.action = function(name, value) {
                // action channel  intercept
                if (!me.callIntercept('action', value)) {
                    return;
                }
                if (!me.callIntercept(name, value)) {
                    return;
                }
                me.fire('action-' + name, {
                    val: value
                });
            }
        }
        /**
         * events initialization
         */
        function initEvents() {
            var $editor = config.editor;
            me.interceptEvent = function(ev) {
                return true;
            }
            // pass dom keyboard event to shaft editor 
            'keyup,keydown,keypress,focus'.split(',').forEach(function(it) {
                $editor.on(it, function(ev) {
                    if (!me.callIntercept(it, ev)) {
                        return ev.preventDefault();
                    }
                    me.fire(it, ev);
                })
            });
            // fix chrome span default line-height bug
            editor.on("DOMNodeInserted", function(e) {
                var target = e.target,
                    helper;
                if (target.tagName == "SPAN") {
                    target = $(target);
                    helper = $("<b>helper</b>");
                    target.before(helper);
                    helper.after(target.contents());
                    helper.remove();
                    target.remove();
                    return;
                }
                // turn div block to p
                if (target.tagName === 'DIV') {
                    // execCommand('formatblock', 'p')
                    return;
                }
            });
        }
    };
    /**
     * default intercept behaviors
     * 1. space key intercept: enter word , no more than two spaces
     * 2. enter key intercept:
     *      + resonpse according to attribute
     *      + h*, blockquote, p, div end  pressed enter key , create p tag
     *      + h*, blockquote center pressed enter key create new (h*,blk)
     * 3. block can't contain blocks
     */
    Shaft.prototype.defaultIntercept = function() {
        this.on('keydown', function(ev) {
            var which = ev.which;
            switch (which) {
                case Shaft.keyMap('space'):
                    spaceKeyIntercept(ev);
                    break;
                case Shaft.keyMap('enter'):
                    enterKeyIntercept(ev);
                    break;
            }
        });
        return;

        function spaceKeyIntercept(ev) {
            selection.isCollapsed ? collapsed() : notCollapsed();
            return;

            function collapsed() {
                var node = Shaft.getCaretTextNode(),
                    offset = Shaft.getCaretOffset(),
                    text = node.textContent,
                    caretPrevChar = text.slice(offset - 1, offset),
                    caretNextChar = text.slice(offset, offset + 1);
                // console.log("OffsetText: ", '--' + text + '-prev-' + caretPrevChar + '-next-' + caretNextChar + '--');
                //--move caret to the space
                if (caretNextChar !== '' && G.reg.allWhiteSpaceRegex.test(caretNextChar)) {
                    ev.preventDefault();
                    // http://stackoverflow.com/questions/11247737/how-can-i-get-the-word-that-the-caret-is-upon-inside-a-contenteditable-div
                    selection.modify("move", "forward", "character");
                    return;
                }
                if (G.reg.allWhiteSpaceRegex.test(caretPrevChar)) {
                    ev.preventDefault();
                }
            }
            //--  user select a range, and press space key
            //--  a space will be entered
            function notCollapsed() {
                // selection.modify("move", "backward", "character");
                ev.preventDefault();
                //--delete select
                Shaft.insertHtmlAtCaret('', true);
            }
        }

        function enterKeyIntercept(ev) {
            //-- caret at the block end
            var node = Shaft.getCaretTextNode(),
                block = Shaft.getCaretNode();
            if (block.getAttribute('data-disable-return')) {
                ev.preventDefault();
                return;
            }
            var text = node.textContent,
                offset = Shaft.getCaretOffset(),
                str = text.slice(offset, text.length);
            var blockName = block.tagName.toLowerCase();
            //--it is text node
            if (node !== block) {
                //--node is current textnode or block,
                //--find nextsibling until null
                while (node) {
                    node = node.nextSibling
                    if (node) {
                        str += node.textContent
                    }
                }

                console.log('text-at-caret-right:', '--' + str + '--');
                if (str == '' || G.reg.allWhiteSpaceRegex.test(str)) {
                    if (blockName != 'li') {
                        ev.preventDefault();
                        Shaft.newLine();
                    } else if(G.reg.allWhiteSpaceRegex.test(block.textContent)){
                        ev.preventDefault();
                        liNewLine();
                    } 
                }
            } else { // it is a block node
                ev.preventDefault();
                if (blockName == 'li') {
                    liNewLine();
                } else {
                    Shaft.newLine();
                }
            }

            function liNewLine() {
                var parentNode = block.parentNode;
                console.log('li new line');
                //--delete current li
                parentNode.removeChild(block);
                //-- cant use newLine any more  li, ol are both block
                //-- new line after ol or li
                var lineEl = $('<p><br></p>')[0];
                $(parentNode).after(lineEl);
                Shaft.moveCaretTo(lineEl);
                //--delete empty ol or ul
                if (parentNode.children.length == 0) {
                    console.log('remove parent');
                    $(parentNode).remove();
                }
            }
        }
    };
    /**
     * [actions and intercepts]
     * @param  {[type]}   name [description]
     * @param  {Function} fn   [description]
     * @return {[type]}        [description]
     */
    Shaft.prototype.registAction = function(name, fn) {
        this.on('action-' + name, proxy(fn, this));
    };
    Shaft.prototype.unRegistAction = function(name) {
        this.detach('action-' + name);
    };
    Shaft.prototype.registIntercept = function(type, fn) {
        this._intercepts = this._intercepts || {};
        this._intercepts[type] = this._intercepts[type] || [];
        this._intercepts[type].push(fn);
    };
    Shaft.prototype.unRegistIntercept = function(type) {
        this._intercepts = this._intercepts || {};
        this._intercepts[type] = [];
    };
    Shaft.prototype.callIntercept = function(type, ev) {
        this._intercepts = this._intercepts || {};
        if (!this._intercepts[type]) {
            return true;
        }
        return this._intercepts[type].every(function(fn) {
            return fn.apply(null, [ev]);
        });
    };
    /**
     * [_execCommand inner execCommand description]
     * @param  {[type]} name [description]
     * @param  {[type]} val  [description]
     * @return {[type]}      [description]
     */
    Shaft.prototype._execCommand = function(name, val) {
        execCommand(name, val);
    };
    /**
     * [getNodesFromCurrentToEditor description]
     * @param  {[type]} el                [description]
     * @param  {[type]} returnAsNodeName  [description]
     * @param  {[type]} returnAdClassName [description]
     * @return {[type]}                   [description]
     */
    Shaft.prototype.getNodesFromCurrentToEditor = function(el, returnAsNodeName, returnAdClassName) {
        var nodes = [];
        //--editor is a $, el is a HTMLElement
        while (el !== this.config.editor[0]) {
            if (el.nodeName.match(/(?:[pubia]|h[1-6]|blockquote|[uo]l|li)/i)) {
                if (returnAdClassName) {
                    nodes.push(el.className);
                } else {
                    nodes.push(returnAsNodeName ? el.nodeName.toLowerCase() : el);
                }
            }
            el = el.parentNode;
        }
        return nodes;
    }
    /**
     * static method
     * @param  {[type]} node)   {                          var els    [description]
     * @param  {[type]} keyMap: function(name) {               return G.keyMap[name];        }    } [description]
     * @return {[type]}         [description]
     */
    mix(Shaft, {
        klass: klass,
        getEventHub: getEventHub,
        execCommand: execCommand,
        mix: mix,
        is: is,
        selection: selection,
        log: log,
        proxy: proxy,
        hereDoc: hereDoc,
        trim: trim,
        cleanStyle: function(node) {
            var els = node.querySelectorAll('[style]');
            [].slice.call(els).forEach(function(item) {
                item.removeAttribute('style');
            });
        },
        keyMap: function(name) {
            return G.keyMap[name];
        },
        reg: G.reg
    });
    /**********************************************************************
     * Shaft rangy and selection method
     **********************************************************************/
    /**
     * rangy api for Shaft
     * not compatible to ie <= 8
     */
    Shaft.getSelectStartNode = function() {
        var node = selection.anchorNode;
        return (node && node.nodeType === 3 ? node.parentNode : node);
    }
    Shaft.getCaretTextNode = function() {
        return selection.anchorNode;
    }
    Shaft.getCaretOffset = function() {
        return selection.anchorOffset;
    }
    Shaft.getCaretNode = Shaft.getSelectStartNode;
    /**
     * move the caret to a node
     */
    Shaft.moveCaretTo = function(node) {
        var range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    Shaft.newLine = function() {
        var lineEl = $('<p><br><p>')[0],
            node = this.getCaretNode();
        $(node).after(lineEl);
        this.moveCaretTo(lineEl);
    }
    Shaft.insertHtmlAtCaret = function(html, isPlainText) {
        var sel = selection,
            range, node;
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            if (isPlainText) {
                node = document.createTextNode(html || '');
            } else {
                node = $(html)[0];
            }
            range.insertNode(node);
            // Preserve the selection
            range = range.cloneRange();
            range.setStartAfter(node);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
    //--http://stackoverflow.com/questions/4767848/get-caret-cursor-position-in-contenteditable-area-containing-html-content
    Shaft.getCharacterOffsetWithin = function(range, node) {
        var treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, function(node) {
            var nodeRange = document.createRange();
            nodeRange.selectNode(node);
            return nodeRange.compareBoundaryPoints(Range.END_TO_END, range) < 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }, false);
        var charCount = 0;
        while (treeWalker.nextNode()) {
            charCount += treeWalker.currentNode.length;
        }
        if (range.startContainer.nodeType == 3) {
            charCount += range.startOffset;
        }
        return charCount;
    }
    //http://stackoverflow.com/questions/5605401/insert-link-in-contenteditable-element
    Shaft.saveSelection = function() {
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                var ranges = [];
                for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                    ranges.push(sel.getRangeAt(i));
                }
                return ranges;
            }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
        }
        return null;
    }
    Shaft.restoreSelection = function(savedSel) {
        if (savedSel) {
            if (window.getSelection) {
                sel = window.getSelection();
                sel.removeAllRanges();
                for (var i = 0, len = savedSel.length; i < len; ++i) {
                    sel.addRange(savedSel[i]);
                }
            } else if (document.selection && savedSel.select) {
                savedSel.select();
            }
        }
    }
    // http://stackoverflow.com/questions/4176923/html-of-selected-text
    // by Tim Down
    Shaft.getSelectionHtml = function() {
        var i,
            html = '',
            sel,
            len,
            container;
        if (window.getSelection !== undefined) {
            sel = window.getSelection();
            if (sel.rangeCount) {
                container = document.createElement('div');
                for (i = 0, len = sel.rangeCount; i < len; i += 1) {
                    container.appendChild(sel.getRangeAt(i).cloneContents());
                }
                html = container.innerHTML;
            }
        } else if (document.selection !== undefined) {
            if (document.selection.type === 'Text') {
                html = document.selection.createRange().htmlText;
            }
        }
        return html;
    }
    /**********************************************************************
     *+ common util
     **********************************************************************/
    function execCommand(cmd, val, notLog) {
        var message = ' to exec 「' + cmd + '」 command' + (val ? (' with value: ' + val) : '');
        if (document.execCommand(cmd, false, val) && !notLog) {
            log('success' + message);
        } else {
            log('fail' + message);
        }
    }

    function isElement(obj) {
        return !!(obj && obj.nodeType === 1);
    }

    function hereDoc(f) {　
        return f.toString().replace(/^[^\/]+\/\*!?\s?/, '').replace(/\*\/[^\/]+$/, '');
    }

    function trim(str) {
        return str.replace(/^\s+|\s+$/g, '');
    }

    function nil() {}

    function log(message, force) {
        if (G.debug || force) {
            console.log('%cPEN DEBUGGER: %c' + message, 'font-family:arial,sans-serif;color:#1abf89;line-height:2em;')
        }
    }

    function is(obj, type) {
        return Object.prototype.toString.call(obj).slice(8, -1) === type;
    }

    function mix(obj, trait, isCoverOriginMethod) {
        var hasOwn = Object.prototype.hasOwnProperty;
        for (var attr in trait) {
            if (hasOwn.call(trait, attr) && !(isCoverOriginMethod && obj[attr])) {
                obj[attr] = trait[attr];
            }
        }
    }

    function proxy(func, context) {
        return function() {
            func.apply(context, arguments);
        }
    };

    function getEventHub() {
        return {
            on: function(type, callback) {
                if (!is(callback, 'Function')) {
                    throw new Error('callback is not a function');
                    return;
                }
                this._callback = this._callback || {};
                this._callback[type] = this._callback[type] || [];
                this._callback[type].push(callback);
                return this;
            },
            detach: function(type, callback) {
                this._callback = this._callback || {};
                if (!type) {
                    this._callback = {};
                } else if (!callback) {
                    this._callback[type] = [];
                } else if (this._callback[type] && this._callback[type].length > 0) {
                    var index = S.indexOf(callback, this._callback[type]);
                    if (index != -1) this._callback[type].splice(index, 1);
                }
                return this;
            },
            fire: function(type, data) {
                if (this._callback) {
                    var arr = this._callback[type];
                    if (arr && arr.length > 0) {
                        data = data || {};
                        data.type = type;
                        data.target = this;
                        for (var i = arr.length - 1; i >= 0; i--) {
                            is(arr[i], 'Function') && arr[i].call(this, data);
                        }
                    }
                }
                return this;
            }
        };
    };

    function klass(Parent, props) {
        var Child, F, i;
        Child = function() {
            var parent = Child.parent;
            while (parent) {
                parent.prototype && parent.prototype.hasOwnProperty("__construct") && parent.prototype.__construct.apply(this, arguments);
                parent = parent.parent;
            }
            if (Child.prototype.hasOwnProperty("__construct")) {
                Child.prototype.__construct.apply(this, arguments);
            }
            this.super = Parent.prototype;
        };
        Parent = Parent || Object;
        F = function() {};
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.parent = Parent;
        Child.super = Parent.prototype;
        Child.prototype.constructor = Child;
        for (i in props) {
            if (props.hasOwnProperty(i)) {
                Child.prototype[i] = props[i];
            }
        }
        return Child;
    }
    exports.Shaft = Shaft;
})($, window);