var fs = require('fs');
var path = require('path');
var parser = require('../lib');
var assert = require('assert');

var fixturesPath = './fixtures';

fs.readdir(fixturesPath, function(err, files) {
    for (var i in files) {
        var file = files[i];
        var ext = path.extname(file);

        if (ext == '.xml') {
            var basename = path.basename(file, '.xml');

            var data = fs.readFileSync(fixturesPath + '/' + file);
            var result = parser.toJson(data, {reversible: true});

            var  data2 =  fs.readFileSync(fixturesPath + '/' + file);
            result = parser.toJson(data2);

            var jsonFile = basename + '.json';
            var expected = fs.readFileSync(fixturesPath + '/' + jsonFile) + '';

            if (expected) {
                expected = expected.trim();
            }
            assert.deepEqual(result, expected, jsonFile + ' and ' + file + ' are different');
            console.log('[xml2json: ' + file + '->' + jsonFile + '] passed!');
        } else if( ext == '.json') {
            var basename = path.basename(file, '.json');
            if (basename.match('reversible')) {
                var data = fs.readFileSync(fixturesPath + '/' + file);
                var result = parser.toXml(data);
                
                var xmlFile = basename.split('-')[0] + '.xml';
                var expected = fs.readFileSync(fixturesPath + '/' + xmlFile) + '';
               
                if (expected) {
                    expected = expected.trim();
                }
                //console.log(result + '<---');
                assert.deepEqual(result, expected, xmlFile + ' and ' + file + ' are different');
                console.log('[json2xml: ' + file + '->' + xmlFile + '] passed!');
            }
        }
    }
});

// test options.textNodeKey custom value
var xml = '<a href="http://example.com">Example Site</a>';
var actual = parser.toJson(xml, {object: true, textNodeKey: 'hi'});
var json = '{"a":{"href":"http://example.com","hi":"Example Site"}}';
assert.deepEqual(actual, JSON.parse(json));

// test options.textNodeKey default value
var actual = parser.toJson(xml, {object: true});
var json = json.replace('"hi":', '"$t":');
assert.deepEqual(actual, JSON.parse(json));

console.log('[xml2json options.textNodeKey] passed');

// test options.attributes = false
var actual = parser.toJson(xml, {object: true, attributes: false});
var json = '{"a": "Example Site"}'
assert.deepEqual(actual, JSON.parse(json));
console.log('[xml2json options.attributes] passed');
