"use strict";

if (typeof document === 'undefined') {
	var document = {};
}

// For X3D Browser functions
if (typeof Browser === 'undefined') {
	var Browser = {
		print : function(string) { if (typeof console !== 'undefined' && typeof string !== 'undefined') console.error(string); },
		println : function(string) { if (typeof console !== 'undefined' && typeof string !== 'undefined') console.error(string); },
		stringToArray : function(obj) {
			if (typeof obj === 'object') {
				return obj;
			} else {
				return JSON.parse('['+obj+']');
			}
		},
		appendTo : function(element, json) {
			 return ConvertToX3DOM(json, "", element, 'foo.json');
		}
	}
}

var x3djsonNS;

// 'http://www.web3d.org/specifications/x3d-namespace'

// Load X3D JSON into web page

function elementSetAttribute(element, key, value) {
	if (key !== 'SON schema') {
		element.setAttribute(key, value);
	}
}

function ConvertChildren(parentkey, object, element, path) {
	var key;
	for (key in object) {
		if (typeof object[key] === 'object') {
			if (isNaN(parseInt(key))) {
				ConvertObject(key, object, element, path);
			} else {
				ConvertToX3DOM(object[key], key, element, path);
			}
		}
	}
}

function CreateElement(key, x3djsonNS) {
	if (typeof x3djsonNS === 'undefined') {
		return document.createElement(key);
	} else {
		var child = document.createElementNS(x3djsonNS, key);
		if (child == null || typeof child === 'undefined') {
			console.error('Trouble creating element for', key);
			child = document.createElement(key);
		}
		return child;
	}
}
function ConvertObject(key, object, element, path) {
	if (object !== null && typeof object[key] === 'object') {
		if (key.substr(0,1) === '@') {
			ConvertToX3DOM(object[key], key, element, path);
		} else if (key.substr(0,1) === '-') {
			ConvertChildren(key, object[key], element, path);
		} else if (key === '#comment') {
			for (var c in object[key]) {
				var child = document.createComment(object[key][c]);
				element.appendChild(child);
			}
		} else if (key === '#sourceText') {
			var open = document.createTextNode("<![CDATA[");
			var child = document.createTextNode(object[key].join("\n"));
			var close = document.createTextNode("]]>");
			element.appendChild(open);
			element.appendChild(child);
			element.appendChild(close);
		} else {
			if (key === 'connect' || key === 'fieldValue' || key === 'field' || key === 'meta') {
				for (var childkey in object[key]) {  // for each field
					if (typeof object[key][childkey] === 'object') {
						var child = CreateElement(key, x3djsonNS);
						ConvertToX3DOM(object[key][childkey], childkey, child, path);
						element.appendChild(child);
						element.appendChild(document.createTextNode("\n"));
					}
				}
			} else {
				var child = CreateElement(key, x3djsonNS);
				ConvertToX3DOM(object[key], key, child, path);
				element.appendChild(child);
				element.appendChild(document.createTextNode("\n"));
			}
		}
	}
}

function ConvertToX3DOM(object, parentkey, element, path) {
	var key;
	var localArray = [];
	var isArray = false;
	var arrayOfStrings = false;
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
				if (object[key] != null && typeof object[key].join === 'function') {
					localArray.push(object[key].join(" "));
				}
				ConvertToX3DOM(object[key], key, element, path);
			} else {
				console.error("Unknown type found in array "+typeof object[key]);
			}
		} else if (typeof object[key] === 'object') {
			// This is where the whole thing starts
			if (key === 'X3D') {
				ConvertToX3DOM(object[key], key, element, path);
			} else {
				ConvertObject(key, object, element, path);
			}
		} else if (typeof object[key] === 'number') {
			elementSetAttribute(element, key.substr(1),object[key]);
		} else if (typeof object[key] === 'string') {
			if (key !== '#comment') {
				elementSetAttribute(element, key.substr(1),object[key]);
			} else {
				var child = document.createComment(object[key]);
				element.appendChild(child);
			}
		} else if (typeof object[key] === 'boolean') {
			elementSetAttribute(element, key.substr(1),object[key]);
		} else {
			console.error("Unknown type found in object "+typeof object[key]);
		}
	}
	if (isArray) {
		if (parentkey.substr(0,1) === '@') {
			if (arrayOfStrings) {
				arrayOfStrings = false;
                                if (parentkey === '@url' || parentkey.indexOf("Url") === parentkey.length - 3) {
					var url;
					// No longer need to split
					// localArray = localArray[0].split(/" "/);
					for (url in localArray) {
						// localArray[url].replace(/"/g, '');
						if (localArray[url].indexOf("http://") === 0
						 || localArray[url].indexOf("https://") === 0) {
						} else if (localArray[url].indexOf("urn:web3d:media:textures/panoramas/") === 0) {
							var ls = localArray[url].lastIndexOf("/");
							if (ls > 0) {
								localArray[url] = 'examples/Basic/UniversalMediaPanoramas/'+localArray[url].substring(ls+1);
							}

						} else {
							var pe = path.lastIndexOf('/');
							var pc = path.substring(0, pe);
							localArray[url] = pc+'/'+localArray[url];
						        if (localArray[url].indexOf('/') === 0) {
								// no webroot absolute paths.  No /'s for cobweb shaders
								localArray[url] = localArray[url].substring(1);
							}
						}
							
                                       }
					// if URL
					console.error("Loading URL",'"'+localArray.join('" "')+'"');
					elementSetAttribute(element, parentkey.substr(1),'"'+localArray.join('" "')+'"');
                                } else {
					// if string array
					elementSetAttribute(element, parentkey.substr(1),'"'+localArray.join('" "')+'"');
				}
			} else {
				// if non string array
				elementSetAttribute(element, parentkey.substr(1),localArray.join(" "));
			}
		}
		isArray = false;
	}
	return element;
}

function fixXML(xmlstr) {
	// get rid of self-closing tags
	xmlstr = xmlstr.replace(/(<[ \t]*)([A-Za-z0-9]+)([^>]*)\/>/g, "$1$2$3></$2>");
	// strip out namespace
	xmlstr = xmlstr.replace(/xmlns="[^"]*"/g, "");

	// strip out schema
	xmlstr = xmlstr.replace(/xsd:noNamespaceSchemaLocation="[^"]*"/g, "");


	// Fix CDATA sections
	xmlstr = xmlstr.replace(/&lt;!\[CDATA\[/g, "<![CDATA[");
	xmlstr = xmlstr.replace(/\]\]&gt;/g, "]]>");
	do {
		var xmlstr2 = xmlstr;
		xmlstr = xmlstr2.replace(/(\<\!\[CDATA\[(.|\n)*)&lt;((.|\n)*\]\]\>)/g, "$1<$3");
	} while (xmlstr !== xmlstr2);
	do {
		xmlstr2 = xmlstr;
		xmlstr = xmlstr2.replace(/(\<\!\[CDATA\[(.|\n)*)&gt;((.|\n)*\]\]\>)/g, "$1>$3");
	} while (xmlstr !== xmlstr2);
	return xmlstr;
}


/*
 * Load X3D JSON into an element
 * json - the JSON to convert to XML and DOM
 * path - the path of the JSON file
 * xml - the output xml string array (optional)
 * NS - a namespace for cobweb (optional) -- stripped out
 * returns an element - the element to append or insert into the DOM
 */
function loadX3DJS(json, path, xml, NS) {
	x3djsonNS = NS;
	var child = CreateElement('X3D', NS);
	ConvertToX3DOM(json, "", child, path);
	if (typeof xml !== 'undefined' && typeof xml.push === 'function') {
		xml.push('<?xml version="1.0" encoding="UTF-8"?>');
		xml.push('<!DOCTYPE X3D PUBLIC "ISO//Web3D//DTD X3D 3.3//EN" "http://www.web3d.org/specifications/x3d-3.3.dtd">');

		var serializer = new XMLSerializer();
		var xmlstr = serializer.serializeToString(child);

		xmlstr = fixXML(xmlstr);
		xml.push(xmlstr);
	}
	return child;
}

if (typeof module === 'object')  {
	module.exports = {
		loadX3DJS : loadX3DJS,
		Browser : Browser,
		ConvertToX3DOM : ConvertToX3DOM,
		fixXML : fixXML,
		setDocument : function(doc) {
			document = doc;
		}
	}
}
