function Klass(Parent, props) {
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

var A = Klass(null, {
    __construct: function(config){
        
    },
})