shaft
=====

A fork from pen.js

shaft  provide the  basic of a  WYSIWYG  editor   

you can make kind of editor by shaft such as:

* inline editor
* markdown editor
* custom everything 

## demo 

`demo/index.html` 

## document

### inherit from Shaft

```javascript
 var YourEditor = Shaft.klass(Shaft, {
    __construct: function(conf) {
        // your logic here
    }
  })

  var editor = new YourEditor({
     editor: $('editor-dom-id')
  })
```

### editor.execCommand 

you can use execCommand to exec an inner command 

```javascript
 // commands
 var CommandTypes = {
    formatBlocks: 'h1,h2,h3,h4,h5,h6,blockquote,p,pre',
    commands: 'bold,italiz,underline,indent,outdent',
    insert_inline: 'inserthorizontalrule,insertimage',
    source: 'createlink,unlink'
 };
 var ListCommand = 'ol,ul';
 var AppendCommand = 'append'
 // eg
 youtEditalInstance.execCommand('ul');
```

### intercept

you can intercept any event support in shaft, so you can write your 
editor logic in an intercept. 

if you want to prevent default behaviors , just return false in an intercept

custom events support 

```javascript
 // ['keyup,keydown,keypress,focus']
 // eg
 yourEditorInstance.registItercept('keydown', function(ev) {
    switch (ev.which) {
        case Shaft.keyMap('enter'):
            // do something enter 
            // prevent default editor behaviors , here is new line
            return false;
        case Shaft.keyMap('tab'):
            // do something tab
            break;
    }
    return true;
 })
```

### events 

if you just want to do something on an event fired 
use on api 

```javascript
 // keyup,keydown,keypress,focus
 // action-*
 yourEditorInstance.on('keydown', function(ev) {
  // your logic
 })
```

### rangy apis

Shaft['rangyApi']

you can use rangy api to contrl the caret 

* getCaretNode
* getSelectStartNode
* getCaretTextNode
* getCaretOffset
* moveCaretTo(domNode) : move the caret to a node
* insertHtmlAtCaret(htmlText)
* getCharacterOffsetWithin(range, node) 
* getSelectionHtml




