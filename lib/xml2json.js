var expat = require('node-expat');
var fs = require('fs');

// This object will hold the final result.
var obj = currentObject = {};
var ancestors = [];

var options = {}; //configuration options
function startElement(name, attrs) {
    // if options.attributes is false, throw away attributes
    if (!options.attributes) attrs = {};

    if(options.coerce) {
        // Looping here in stead of making coerce generic as object walk is unnecessary
        for (var key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                attrs[key] = coerce(attrs[key]);
            }
        }
    }

    if (! (name in currentObject)) {
        currentObject[name] = attrs;
    } else if (! (currentObject[name] instanceof Array)) {
        // Put the existing object in an array.
        var newArray = [currentObject[name]];
        // Add the new object to the array.
        newArray.push(attrs);
        // Point to the new array.
        currentObject[name] = newArray;
    } else {
        // An array already exists, push the attributes on to it.
        currentObject[name].push(attrs);
    }

    // Store the current (old) parent.
    ancestors.push(currentObject);

    // We are now working with this object, so it becomes the current parent.
    if (currentObject[name] instanceof Array) {
        // If it is an array, get the last element of the array.
        currentObject = currentObject[name][currentObject[name].length - 1];
    } else {
        // Otherwise, use the object itself.
        currentObject = currentObject[name];
    }
}

function text(data) {
    data = data.trim();
    if (!data.length) {
        return;
    }
    currentObject[options.textNodeKey] = coerce((currentObject[options.textNodeKey] || "") + data);
}

function endElement(name) {
    // This should check to make sure that the name we're ending 
    // matches the name we started on.
    var ancestor = ancestors.pop();
    if (!options.reversible) {
        if ((Object.keys(currentObject).length == 1) && (options.textNodeKey in currentObject)) {
            if (ancestor[name] instanceof Array) {
                ancestor[name].push(ancestor[name].pop()[options.textNodeKey]);
            } else {
                ancestor[name] = currentObject[options.textNodeKey];
            }
        }
    }

    currentObject = ancestor;
}

function coerce(val) {
    if (!options.coerce) {
        return val;
    }
    var num = Number(val);
    if (!isNaN(num)) {
        return num;
    }
    switch (val.toLowerCase()){
        case 'true':
        case 'yes':
            return true;
        case 'false':
        case 'no':
            return false;
        default: return val;
    }
}

module.exports = function(xml, _options) {
    var parser = new expat.Parser('UTF-8');

    parser.on('startElement', startElement);
    parser.on('text', text);
    parser.on('endElement', endElement);

    obj = currentObject = {};
    ancestors = [];

    options = {
        object: false,
        reversible: false,
        textNodeKey: '$t',
        attributes: true
    };

    for (var opt in _options) {
        options[opt] = _options[opt];
    }

    if (!parser.parse(xml)) {
        throw new Error('There are errors in your xml file: ' + parser.getError());
    }

    if (options.object) {
        return obj;
    }

    return JSON.stringify(obj);
};

