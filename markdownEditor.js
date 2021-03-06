/**
 * markdownEditor backup by shaft.js
 */
(function($, Shaft) {
    var G = {
        'markdown-class': 'shaft-markdown',
        'keymap': {
            '96': '`',
            '62': '>',
            '49': '1',
            '46': '.',
            '45': '-',
            '42': '*',
            '35': '#'
        }
    };
    var MarkdownEditor = Shaft.klass(Shaft, {
        __construct: function(conf) {
        	this._inputKeyStack = [];
        	this.intercept();
        },
        intercept: function(){
        	var self = this;
	        self.on('keypress', function(ev){
	        	var command = self.acceptKeyEvent(ev);
				command && self.goMarkdown(command);
	        });
        },
        acceptKeyEvent: function(ev){
        	var code = ev.which;
        	var command = [];
        	var commandStr;
        	if(code == Shaft.keyMap('space')){
        		commandStr = this._inputKeyStack.join('');
        		this._inputKeyStack.length = 0;
        		command = parseMarkdownExpression(commandStr);
        		return command;
        	}

        	if(G['keymap'][code]) {
        		this._inputKeyStack.push(G['keymap'][code]);
        	}
        	return false;
        },
        goMarkdown: function(command){
        	if(Shaft.selection.focusOffset > command[1]) {
        		Shaft.log('focus Offset ' +  Shaft.selection.focusOffset + '> ' + command[0] + '  ' + command[1])
        		return;
        	}

            if(command[0] == 'inserthorizontalrule'){
                var node = Shaft.getCaretNode();
                $(node).before('<hr>');
                node.textContent = node.textContent.slice(command[1]);
                return;
            }

        	this.execCommand(command[0]);
            var node = Shaft.getCaretNode();
            node.textContent = node.textContent.slice(command[1]);
        }
    });

    function parseMarkdownExpression(str) {
        var len = str.length;
        if (str.match(/[#]{1,6}/)) {
            return ['h' + len, len];
        } else if (str === '```') {
            return ['pre', len];
        } else if (str === '>') {
            return ['blockquote', len];
        } else if (str === '1.') {
            return ['ol', len];
        } else if (str === '-' || str === '*') {
            return ['ul', len];
        } else if (str.match(/(?:\.|\*|\-){3,}/)) {
            return ['inserthorizontalrule', len];
        }
    }

    Shaft.Markdown = MarkdownEditor;
})($, Shaft);