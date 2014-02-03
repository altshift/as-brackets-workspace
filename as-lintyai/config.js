/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4 */
/*global define, $, brackets, window, js_beautify, style_html, css_beautify, localStorage */

define(function (require, exports) {
    "use strict";
    ////////////////////////////////////////////////////////////////////////////////

    // http://jshint.com/
    exports.javascript = {};
    exports.javascript.cmd = 'node "%s/jshint/bin/jshint"';
    exports.javascript.re = function (data) {
        var result = [];

        data.split('\n').forEach(function (element) {
            var match;

            element += '\n';
            match = /^(.+): line (\d+), col (\d+), /.exec(element);

            match && result.push({
                line: match[2],
                message: element.replace(match[0], '')
            });
        });

        return result;
    };
    exports.javascript.type = {};
    exports.javascript.type.warning = /(Missing\s|Unnecessary\s)/;
    exports.javascript.type.notice = /\sbut never used/;

    // Call jslint
    //    exports.javascript = {};
    //    exports.javascript.cmd = 'node "%s/jslint/bin/jslint"';
    //    exports.javascript.re = function (data) {
    //        var result = [];
    //
    //        data.split(/\n( *)#/).forEach(function (element) {
    //            var match;
    //
    //            element = '#' + element;
    //            match = /\/\/ Line (\d+), Pos (\d+)/.exec(element);
    //            if (match) {
    //                result.push({
    //                    line: parseInt(match[1], 10),
    //                    message: element.replace(match[0], '')
    //                });
    //            }
    //        });
    //
    //        return result;
    //    };
    //    exports.javascript.type = {};
    //    exports.javascript.type.warning = /^#(\d*) (Missing\s|Unnecessary\s|Unused)/;
    //    exports.javascript.type.notice = /^#(\d*) Expected '.*' at column/;

    ////////////////////////////////////////////////////////////////////////////////

    // http://lesscss.org/
    exports.css =
        exports.less = {};
    exports.css.cmd = 'node "%s/less/bin/lessc" -l --no-color';
    exports.css.re = function (data) {
        var match = / in (.+) on line (\d+), column (\d+):/m.exec(data);

        return {
            line: match[2],
            message: data.replace(match[0])
        };
    };

    ////////////////////////////////////////////////////////////////////////////////

    // https://github.com/zaach/jsonlint/
    exports.json = {};
    exports.json.cmd = 'node "%s/jsonlint/lib/cli.js" -q';
    exports.json.re = function (data) {
        var match = /(.+) on line (\d+):/.exec(data);

        return {
            line: match[2],
            message: data.replace(match[0], '').trim().slice(0, -1)
        };
    };

    ////////////////////////////////////////////////////////////////////////////////

    // http://php.net/
    exports.php = {};
    exports.php.cmd = 'D:/bin/lang/php/php -l';
    exports.php.re = function (data) {
        var match = /(.+) in (.+) on line (\d+)/.exec(data);

        if (data.indexOf('No syntax errors detected') === -1) {
            return {
                line: match[3],
                message: match[1]
            };
        }
    };

    ////////////////////////////////////////////////////////////////////////////////

    // http://lua.org/
    exports.lua = {};
    exports.lua.cmd = 'D:/bin/lang/lua/bin/luac -p';
    exports.lua.re = function (data) {
        var match = /(.+): (.+):(\d+): /.exec(data);

        return {
            line: match[3],
            message: data.replace(match[0], '')
        };
    };

    ////////////////////////////////////////////////////////////////////////////////

    // http://xmlsoft.org/
    exports.xml = {};
    exports.xml.cmd = 'D:/bin/lang/xmllint/xmllint --noout --debug';
    exports.xml.re = function (data) {
        var result = [];

        data.split('^\r\n').forEach(function (element) {
            var match;

            element += '^';
            match = /^(.+):(\d+): /m.exec(element);

            if (match) {
                result.push({
                    line: match[2],
                    message: element.replace(match[0], '')
                });
            }
        });

        return result;
    };

    ////////////////////////////////////////////////////////////////////////////////

    // http://xmlsoft.org/
    exports.html = {};
    exports.html.cmd = 'D:/bin/lang/xmllint/xmllint --noout --debug --html';
    exports.html.re = exports.xml.re;

    ////////////////////////////////////////////////////////////////////////////////

});