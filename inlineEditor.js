/**
 * inlineEditor backup by shaft.js
 * depend on jquery
 */
(function($, Shaft){
    
    var G = {
        'inline-class': 'shaft-inline'
    };

    var Inline = Shaft.klass(Shaft, {
        __construct: function(conf){
            this.editor.css({
                'position': 'relative',
                'min-height': '27px'
            });
            this._initPlaceholder(conf);
            this.intercept();

            if(conf.value){
                this.value(conf.value);
            }

            if(conf.focus){
                this.focus();
            }
        }   
    });   

    Inline.prototype._initPlaceholder = function(conf){
        var text = this._placeholderText = conf.placeholder || 'text';
        var $placeholder = this.$placeholder = $('<p class="shaft-placeholder">' + text + '</p>');
        this.editor.append($placeholder);
        this.editor.append('<p></p>');
    }

    Inline.prototype.focus = function(){
        Shaft.moveCursorToTheEndOfANode(this.editor[0]);
    }

    Inline.prototype.intercept = function(){
        var self = this;
        self.registIntercept('keydown', function(ev){
            var node = Shaft.getSelectStartContainer();
            
            if(!node) return true;

            switch(ev.which){
                case Shaft.codeMap('enter'):
                    console.log('enter pressed')
                    self.fire('press-enter', ev);
                    return false;
                case Shaft.codeMap('tab'):
                    self.fire('press-tab', ev);
                    break;
                case Shaft.codeMap('backspace'):
                    self.fire('backspace', ev);
                    break;
            }

            return true;
        }); 

        self.registIntercept('keyup', function(ev){
            self.placeholder();
            return true;
        });
    }

    Inline.prototype.placeholder = function(){
        var $editor = this.editor;
        this.$placeholder.remove();

        // console.log($editor.text(), $editor.text.length)
        var innerText = Shaft.trim($editor.text());
        $editor.append(this.$placeholder);

        if(innerText == ''){
            this.$placeholder.show();
        } else {
            this.$placeholder.hide();
        }
    }

    Inline.prototype.value = function(val){
        var $editor = this.editor;
        var ret = '';
        this.$placeholder.remove();
        if(val){
            $editor.html('<p>' + val + '</p>');
            return this;
        }else{
            ret = $editor.text();
            $editor.append(this.$placeholder);
        }
        return ret;
    }

    Shaft.Inline = Inline;
})($, Shaft);