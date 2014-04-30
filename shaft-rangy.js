/**
 * rangy api for Shaft
 * not compatible to ie <= 8
 */
(function(Shaft) {
    if (!Shaft || !Shaft.log) return;
    var selection = Shaft.selection;
    Shaft.getSelectStartNode = function() {
        var node = selection.anchorNode;
        return (node && node.nodeType === 3 ? node.parentNode : node);
    }
    Shaft.getCaretNode = Shaft.getSelectStartNode;

    /**
     * move the caret to a node
     */
    Shaft.moveCaretTo = function(node) {
        var range = document.createRange();
        range.selectionNodeContents(node);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    //--stackoverflow.com/questions/1181700/set-cursor-position-on-contenteditable-div
    Shaft.insertHtmlAtCaret = function(html) {
        var sel = selection, range;
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            var node = $(html)[0];
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
})(Shaft);