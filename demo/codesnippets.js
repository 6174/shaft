/**
 * List editor
 * Use Bone.js
 * List placeholder
 * List delete
 * List add
 */
(function(Bone) {
    var itemTemplate = hereDoc(listItemString);
    window.ListEditor = ListEditor;
    var G = {
        'list-item-class': 'list-item',
        'list-title-class': 'list-title',
        'list-content-class': 'list-content',
        'list-placeholder-class': 'listitem-placeholder'
    };

    function ListEditor(config) {
        this.bone = new Bone(config);
        this.initialize();
        this.intercept();
    }

    ListEditor.prototype.initialize = function() {
        this.newItem();
    };
    
    ListEditor.prototype.intercept = function() {
        var bone = this.bone;
        var me = this;

        bone.registIntercept('keydown', function(ev) {
            // console.log('call keydown intercept', ev.which);
            var node = bone.getSelectStartContainer();
            if (!node) {
                return true;
            }
            //--node's parents' class attr as a string
            var str = bone.getNodesFromCurrentToEditor(node, true, true).join(' ');

            //--list title inline control
            if (str.indexOf(G['list-title-class']) >= 0) {
            	var node = me.findParentByClassName(node, G['list-title-class']);
                if (bone.codeMap('enter') == ev.which) {
                    console.log('ok title is inline, so can not chane line by type enter');
                    me.findAndfocusToItemContent(node);
                    return false;
                }

                if(bone.codeMap('backspace') == ev.which){
                	if(me.isEmptyNode(node) && !confirm('delete item?')){
                		ev.preventDefault();
                		return false;
                	}
                }
            } 

            //--list content 
            if (str.indexOf(G['list-content-class']) >= 0) {
            	var node = me.findParentByClassName(node, G['list-content-class']);
            	if(bone.codeMap('enter') == ev.which){
            		return !me.doubleEnterKeyAutoMakeListItem(node);
            	} 

            	if(bone.codeMap('backspace') == ev.which){
            		if(me.isEmptyNode(node)){
	            		node = me.findParentByClassName(node, G['list-item-class']); 
	            		//--focus to item title end
	            		me.focusToItemTitle(node, true);
	            		ev.preventDefault();
	            		return false;
            		}
            	}
            }

        	//--list 
            return true;
        });
	
		//-- key up placeholder
		bone.registIntercept('keyup', function(ev){
			var node = bone.getSelectStartContainer();
            if (!node) {
                return true;
            }
            //--node's parents' class attr as a string
            var str = bone.getNodesFromCurrentToEditor(node, true, true).join(' ');
            //--list title inline control
            if (str.indexOf(G['list-title-class']) >= 0) {
            	var node = me.findParentByClassName(node, G['list-title-class']);
            	me.placeholder(node);
            }

            //--list content two 
            if (str.indexOf(G['list-content-class']) >= 0) {
            	var node = me.findParentByClassName(node, G['list-content-class']);
            	me.placeholder(node);
            }
		})
    }
    ListEditor.prototype.newItem = function(afterNode) {
        var bone = this.bone;
        var $node = $(itemTemplate);

        if(afterNode){
        	$(afterNode).after($node);
        }else{
	        this.bone.action('append', $node);
        }
        this.reorder();
        this.focusToItemTitle($node[0]);
    }
    ListEditor.prototype.findAndfocusToItemContent = function(node) {
        var bone = this.bone;
        var listItemNode = this.findParentByClassName(node, G['list-item-class']);
        if (!listItemNode) return;
        this.focusToItemContent(listItemNode);
    }
    ListEditor.prototype.focusToItemTitle = function(listItemNode, isFocusToEnd) {
        var $title = $(listItemNode).find('.' + G['list-title-class']);
        this.bone.moveCursorToTheEndOfANode($title[0]);
    }
    ListEditor.prototype.focusToItemContent = function(listItemNode) {
        var contentNode = $(listItemNode).find('.' + G['list-content-class'])[0];
        //--move to the front
        this.bone.moveCursorToTheEndOfANode(contentNode);
    }

    ListEditor.prototype.doubleEnterKeyAutoMakeListItem = function (listContentNode){
        var children = listContentNode.children;
        var len = children.length;
        var lastChild = children[len - 1];

        // console.log(lastChild, lastChild.nodeName, $(lastChild).text());
        if( lastChild.nodeName == 'P' && trim($(lastChild).text()) == ''){
        	//--placeholder  + empty p
        	if(len <= 2){
        		return false;
        	}
        	this.newItem(listContentNode.parentNode);
        	$(lastChild).remove();
        	return true;
        }
        return false;
    }

    ListEditor.prototype.findParentByClassName = function(node, className) {
        if (!node) return;
        while (node) {
            if (node.className == className) {
                return node;
            }
            node = node.parentNode;
        }
        return;
    }

    /**
     * node : placeholder's parent node
     */
    ListEditor.prototype.placeholder = function(node){
    	var node = $(node);
    	//--remove 
    	var placeholderEl = node.find('.' + G['list-placeholder-class']);
    	placeholderEl.remove();

    	//--use trim 
    	var innerText = trim(node.text());
    	node.prepend(placeholderEl);
    	console.log('"--' + innerText + '--"', innerText.length, innerText == '');

    	//--toggle place holder
    	if (innerText == ""){
    		placeholderEl.show();
    	} else{
    		placeholderEl.hide();
    	}
    }
    ListEditor.prototype.isEmptyNode = function(node){
    	var node = $(node);

    	//--remove 
    	var placeholderEl = node.find('.' + G['list-placeholder-class']);
    	placeholderEl.remove();

    	//--use trim 
    	var innerText = trim(node.text());
    	node.prepend(placeholderEl);
    	return innerText == '';
    }

    ListEditor.prototype.reorder = function(){
    	// var $items = this.bone.editor.find('.' + G['list-item-class'] + ":before");

  //   	var items = [].slice.call(
  //   		document.querySelector('.' +  G['list-item-class'], ':before'), 0);
		// console.log(items);
  //   	items.forEach(function(i, el){
	 //    	console.log(i, el)
  //   		// i ++;
  //   		// $(el).find("." + G['list-item-class'] + ":before").html(i + '.');
  //   	});
    }

    function listItemString() {
        /*
		<div class="list-item">
			<div class="list-title">
				<p contenteditable="false" class="listitem-placeholder"> list title </p>
				<p></p>
			</div>
			<div class="list-content">
				<p contenteditable="false" class="listitem-placeholder"> list content </p><p></p>
			</div>
		</div>
	*/
    }
    //---utils
    function hereDoc(f) {　
        return f.toString().replace(/^[^\/]+\/\*!?\s?/, '').replace(/\*\/[^\/]+$/, '');
    }

    function trim(str){
    	return str.replace(/^\s+|\s+$/g, '');	
    }

})(Bone);