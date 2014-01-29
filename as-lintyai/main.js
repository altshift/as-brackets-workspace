/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4 */
/*global define, $, brackets, window, js_beautify, style_html, css_beautify, localStorage */

define(function (require, exports, module) {
    "use strict";
    ////////////////////////////////////////////////////////////////////////////////

    var ext_utils;
    var registry;
    var current;

    ext_utils = brackets.getModule('utils/ExtensionUtils');
    ext_utils.loadStyleSheet(module, 'main.css');

    registry = {};

    ////////////////////////////////////////////////////////////////////////////////

    brackets.getModule('utils/AppInit').appReady(function () {
        var editor = brackets.getModule('editor/EditorManager');

        $(editor).on('activeEditorChange', onActiveEditorChange);
        $(brackets.getModule('document/DocumentManager')).on('documentSaved', onDocumentSaved);

        onActiveEditorChange(null, editor.getActiveEditor());
    });

    ////////////////////////////////////////////////////////////////////////////////

    var config = require('./config');

    function onActiveEditorChange(event, editor) {
        var file, lang;
        var gutters;

        if (!editor || !editor.document) {
            return;
        }

        file = editor.document.file.fullPath;
        lang = editor.document.getLanguage().getId();

        registry[file] = registry[file] || {
            cm: null,
            data: null,
            widget: {},
            _widget: {},
            config: config[lang],
            check: davayProveryai
        };
        current = registry[file];
        current.cm = editor._codeMirror;

        gutters = editor._codeMirror.getOption('gutters');

        if (gutters.indexOf('lintyai-gutter') === -1) {
            gutters.push('lintyai-gutter');
            editor._codeMirror.setOption('gutters', gutters);

            current.cm.on('gutterClick', onGutterClick);
        }

        onDocumentSaved(null, editor.document);
    }

    ////////////////////////////////////////////////////////////////////////////////

    function onDocumentSaved(event, document) {
        if (document.file.isDirty || !current.config) {
            return;
        }

        if (!event && current.data !== null) {
            return current.check();
        }

        lintyai(function () {
            var dir, cmd;

            dir = ext_utils.getModulePath(module, 'node/node_modules/');
            cmd = current.config.cmd.replace('%s', dir);

            this.commander(cmd + ' "' + document.file.fullPath + '"').
                done(function (data) {
                    current.data = data;
                    current.check();
                });
        });
    }

    ////////////////////////////////////////////////////////////////////////////////

    function davayProveryai() {
        var i, lint,
            gutter, widget;

        this.cm.clearGutter('lintyai-gutter');

        for (i in this._widget) {
            while (this._widget[i].length)
                this._widget[i].pop().clear();
        }

        this.widget = {};
        this._widget = {};

        if (!this.data || !(lint = this.config.re(this.data)))
            return;

        lint = (lint.line ? [lint] : lint);

        gutter = $('<div class="lintyai-gutter" />');
        widget = $('<div class="lintyai-line-widget" />');

        for (var i in lint) {
            var type;
            var line;

            if (this.config.type) {
                for (type in this.config.type) {
                    if (this.config.type[type].test(lint[i].message))
                        break;

                    type = null;
                }
            }

            line = (lint[i].line - 1);

            this.widget[line] = this.widget[line] || [];
            this._widget[line] = [];

            !this.widget[line].length &&
                this.cm.setGutterMarker(
                    line, 'lintyai-gutter',
                    gutter.clone().addClass(type).text(lint[i].line)[0]
            );

            this.widget[line].push(
                widget.clone().addClass(type).text(lint[i].message.trim())[0]
            );
        }
    }

    ////////////////////////////////////////////////////////////////////////////////

    function onGutterClick(event, line) {
        var widget, _widget;

        widget = current.widget[line];
        _widget = current._widget[line];

        if (!widget)
            return;

        if (_widget.length) {
            while (_widget.length)
                _widget.pop().clear();

            return;
        }

        for (var i in widget)
            _widget.push(current.cm.addLineWidget(line, widget[i], {
                coverGutter: true
            }));
    }

    ////////////////////////////////////////////////////////////////////////////////

    var node = new(brackets.getModule('utils/NodeConnection'));

    function lintyai(cb) {
        if (node.domains.lintyai)
            return cb.call(node.domains.lintyai);

        node.connect(true).done(function () {
            var path = ext_utils.getModulePath(module, 'node/commander.js');

            node.loadDomains([path], true).done(function () {
                cb.call(node.domains.lintyai);
            });
        });
    }

    ////////////////////////////////////////////////////////////////////////////////

});