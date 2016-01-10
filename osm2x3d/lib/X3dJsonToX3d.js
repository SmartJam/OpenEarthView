"use strict";
var os = require('os');
var stream = require('stream');
var util = require('util');
// Java Style Sheet Language, implementation 1

// convert X3D JSON format to X3D XML

var content = '';
// read content into buffer
//process.stdin.resume();
//process.stdin.on('data', function(buf) { content += buf.toString(); });
//
function toString(el, indent, writeStream) {
    if (writeStream === undefined) {
        console.error('writeStream undefined')
        return;
    }
    var child;
    var key;
    var attrs;
    if (typeof el === 'string') {
        writeStream.write((indent + el));
        return result;
    }
    if (el.key) {
        key = el.key;
    }
    if (el.attributes && el.attributes.length > 0) {
        attrs = " " + el.attributes.join(" ");
    }
    if (el.children && typeof key !== 'undefined' && typeof attrs !== 'undefined') {
        writeStream.write(indent + "<" + key + attrs + ">\n");
    } else if (el.children && typeof key !== 'undefined') {
        writeStream.write(indent + "<" + key + ">\n");
    } else if (typeof key !== 'undefined' && typeof attrs !== 'undefined') {
        writeStream.write(indent + "<" + key + attrs + "/>\n");
    } else if (typeof key !== 'undefined') {
        writeStream.write(indent + "<" + key + "/>\n");
    }
    for (child in el) {
        if (child === "children") {
            toString(el[child], indent + "  ", writeStream);
        } else {
            if (isNaN(parseInt(child))) {
            } else {
                toString(el[child], indent + "", writeStream);
            }
        }
    }
    if (el.children && typeof key !== 'undefined') {
        writeStream.write(indent + "</" + key + ">\n");
    }
}

function ConvertChildren(object, parentkey) {
    var key;
    var children = [];
    for (key in object) {
        if (typeof object[key] === 'object') {
            var el = ConvertToX3D(object[key], key);
            children.push(el);
        }
    }
    return children;
}

function ConvertToX3D(object, parentkey) {
    var key;
    var localArray = [];
    var isArray = false;
    var arrayOfStrings = false;
    var attributes = [];
    var children = [];
    for (key in object) {
        if (isNaN(parseInt(key))) {
            isArray = false;
        } else {
            isArray = true;
        }
        if (isArray) {
            if (typeof object[key] === 'number') {
                localArray.push(object[key]);
            } else if (typeof object[key] === 'string') {
                localArray.push(object[key]);
                arrayOfStrings = true;
            } else if (typeof object[key] === 'boolean') {
                localArray.push(object[key]);
            } else if (typeof object[key] === 'object') {
                var el = ConvertToX3D(object[key], key);
                children.push(el);
            } else {
                console.log("Unknown type found in array " + typeof object[key]);
            }
        } else if (typeof object[key] === 'object') {
            if (key.substr(0, 1) === '@') {
                var el = ConvertToX3D(object[key], key);
                for (var attr in el.attributes) {
                    attributes.push(el.attributes[attr]);
                }
            } else if (key.substr(0, 1) === '-') {
                children.push(ConvertChildren(object[key], key));
            } else {
                var el = ConvertToX3D(object[key], key);
                el.key = key;
                children.push(el);
            }
        } else if (typeof object[key] === 'number') {
            attributes.push(key.substr(1) + "='" + object[key] + "'");
        } else if (typeof object[key] === 'string') {
            if (key === '#comment') {
                children.push('<!--' + object[key] + '-->');
            } else {
                attributes.push(key.substr(1) + "='" + object[key] + "'");
            }
        } else if (typeof object[key] === 'boolean') {
            attributes.push(key.substr(1) + "='" + object[key] + "'");
        } else {
            console.log("Unknown type found in object " + typeof object[key]);
        }
    }
    if (isArray) {
        if (parentkey.substr(0, 1) === '@') {
            if (arrayOfStrings) {
                arrayOfStrings = false;
                attributes.push(parentkey.substr(1) + "='&quot;" + localArray.join('&quot; &quot;') + "&quot;'");
            } else {
                attributes.push(parentkey.substr(1) + "='" + localArray.join(" ") + "'");
            }
        }
        isArray = false;
    }
    return {attributes: attributes, children: children};
}
//
//process.stdin.on('end', function() {
//	var json = JSON.parse(content);
//console.log('<?xml version="1.0" encoding="UTF-8"?>');
//console.log('<!DOCTYPE X3D PUBLIC "ISO//Web3D//DTD X3D 3.3//EN" "http://www.web3d.org/specifications/x3d-3.3.dtd"><X3D><Scene>');
//	var el = ConvertToX3D(json, "", "");
//	printElement(el, "");
//console.log('</Scene></X3D>');
//});

function convert(object, writeStream) {
    var json = ConvertToX3D(object['X3D']['Scene'], "");
    var result = '';
    result += '<?xml version="1.0" encoding="UTF-8"?>\n';
    result += '<!DOCTYPE X3D PUBLIC "ISO//Web3D//DTD X3D 3.2//EN" "http://www.web3d.org/specifications/x3d-3.2.dtd">\n';
    result += '<X3D profile="Interchange" version="3.2" xmlns:xsd="http://www.w3.org/2001/XMLSchema-instance" xsd:noNamespaceSchemaLocation="http://www.web3d.org/specifications/x3d-3.2.xsd">\n';
    result += '    <Scene>\n';
    if (writeStream) {
        writeStream.write(result);
    }
//    console.log(JSON.stringify(object))
//    console.log(JSON.stringify(json))

//{
//    "X3D": {
//        "@profile": "Immersive",
//        "@version": 3.3,
//        "@xsd:noNamespaceSchemaLocation": "http://www.web3d.org/specifications/x3d-3.3.xsd",
//        "Scene": {

    result += toString(json, "    ", writeStream);
    var endResult = '';
    endResult += ('    </Scene>\n');
    endResult += ('</X3D>\n');
    if (writeStream) {
        writeStream.write(endResult);
    }
    return result + endResult;
}

exports.convert = convert;
