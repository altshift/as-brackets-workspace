/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4 */
/*global define, $, brackets, window, js_beautify, style_html, css_beautify, localStorage */

define(function (require, exports, module) {
    "use strict";
    ////////////////////////////////////////////////////////////////////////////////

    var ext_utils, CodeInspection, registry, currentFileDesc, scanners;

    CodeInspection = brackets.getModule("language/CodeInspection");
    ext_utils = brackets.getModule('utils/ExtensionUtils');
    ext_utils.loadStyleSheet(module, 'main.css');

    // Load scanners
    scanners = [];
    scanners.push(require("./jsHint/jsHintScanner"));
    scanners.push(require("./cssLint/cssLintScanner"));

    registry = {};

    ////////////////////////////////////////////////////////////////////////////////

    brackets.getModule('utils/AppInit').appReady(function () {
        var editor = brackets.getModule('editor/EditorManager');

        $(editor).on('activeEditorChange', onActiveEditorChange);
        //$(brackets.getModule('document/DocumentManager')).on('documentSaved', onDocumentSaved);

        // Register Scanners
        $.each(scanners, function ($index, $scanner) {
            if (!Array.isArray($scanner.fileType)) {
                $scanner.fileType = [$scanner.fileType];
            }

            $.each($scanner.fileType, function ($index, $fileType) {

                CodeInspection.register($fileType, {
                    name: $scanner.name,
                    scanFile: function ($fileContent, $path) {
                        var result = $scanner.scan($fileContent, $path);

                        registry[$path] = registry[$path] || {
                            cm: null,
                            data: null,
                            errorsByLine: {}
                        };
                        currentFileDesc = registry[$path];

                        currentFileDesc.dataIsNew = true;
                        currentFileDesc.data = result && result.errors;

                        showScanOnGutter(currentFileDesc.data, $path);

                        return result;
                    }
                });
            });
        });

        onActiveEditorChange(null, editor.getActiveEditor());
    });

    function showScanOnGutter($scanResult, $path) {
        var i, gutter, lineError;

        // Init values if needed
        registry[$path] = registry[$path] || {
            cm: null,
            data: null,
            errorsByLine: {}
        };
        currentFileDesc = registry[$path];

        // Keep errors in memory, in case editor is not ready yet
        currentFileDesc.data = $scanResult;

        // If editor is ready
        if (currentFileDesc.cm && currentFileDesc.dataIsNew) {
            currentFileDesc.dataIsNew = false;

            // Clear previous markers
            currentFileDesc.cm.clearGutter('lintyai-gutter');

            // Remove all line errors and widget (if any)
            currentFileDesc.errorsByLine = currentFileDesc.errorsByLine || {};
            $.each(currentFileDesc.errorsByLine, function ($key, $lineErrors) {
                while ($lineErrors && $lineErrors.length) {
                    lineError = $lineErrors.pop();
                    if (lineError.lineWidget) {
                        lineError.lineWidget.clear();
                    }
                }
            });
            currentFileDesc.errorsByLine = {};

            if (currentFileDesc.data) {
                gutter = $('<div class="lintyai-gutter" />');

                // For every errors
                $.each($scanResult, function ($index, $oneResult) {
                    var line = $oneResult.pos.line;
                    
                    // Add line marker only once
                    if (!currentFileDesc.errorsByLine[line]) {
                        currentFileDesc.cm.setGutterMarker(
                            line,
                            'lintyai-gutter',
                            gutter.clone().addClass($oneResult.type).text(line + 1)[0]
                        );
                    }

                    // Add error to list
                    currentFileDesc.errorsByLine[line] = currentFileDesc.errorsByLine[line] || [];
                    currentFileDesc.errorsByLine[line].push({
                        description: $oneResult
                    });
                });
            }
        }
    }

    function onGutterClick($event, $line) {
        var lineErrorNode, lineErrorModelNode, errorsOnLine;

        errorsOnLine = currentFileDesc.errorsByLine[$line];
        lineErrorModelNode = $('<div class="lintyai-line-widget" />');

        $.each(errorsOnLine, function ($index, $error) {
            if ($error.lineWidget) {
                // already there, hide line widget
                $error.lineWidget.clear();
                delete $error.lineWidget;
            } else {
                // Show line widget
                lineErrorNode = lineErrorModelNode.clone().addClass($error.description.type).text($error.description.message.trim())[0];

                $error.lineWidget = currentFileDesc.cm.addLineWidget($line, lineErrorNode, {
                    coverGutter: true
                });
            }
        });
    }
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
            config: config[lang]
        };
        currentFileDesc = registry[file];
        currentFileDesc.cm = editor._codeMirror;

        gutters = editor._codeMirror.getOption('gutters');

        if (gutters.indexOf('lintyai-gutter') === -1) {
            gutters.push('lintyai-gutter');
            editor._codeMirror.setOption('gutters', gutters);

            currentFileDesc.cm.on('gutterClick', onGutterClick);
        }

        showScanOnGutter(currentFileDesc.data, file);
    }

    ////////////////////////////////////////////////////////////////////////////////

});