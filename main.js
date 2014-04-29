/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function (require, exports, module) {
    "use strict";

    require("./as-beautify/main");
    require("./as-lintyai/main");
    require("./as-handlebars/main");

    $("body").addClass("altShift");
    CodeMirror.defaults.theme = "altShift";
    //$(ExtensionUtils).trigger("Themes.themeChanged", ["altShift"]);
    //CodeMirror.refresh();
    
    var ext_utils = brackets.getModule('utils/ExtensionUtils'),
        EditorManager       = brackets.getModule("editor/EditorManager");

    ext_utils.loadStyleSheet(module, 'reset.css');
    ext_utils.loadStyleSheet(module, 'altShift.css');

    var prevMode;
    $(EditorManager).on("activeEditorChange", function () {
        var editor = EditorManager.getActiveEditor();
        if (!editor || !editor._codeMirror) {
            return;
        }

        var cm = editor._codeMirror,
            mode = cm.getDoc().getMode().name;

        // CodeMirror treats json as javascript, so we gotta do
        // an extra check just to make we are not feeding json
        // into jshint/jslint.  Let's leave that to json linters
        if (cm.getDoc().getMode().jsonMode) {
            mode = "json";
        }

        // Add the document mode the the body so that we can actually
        // style based on document type
        $("body").removeClass("doctype-" + prevMode).addClass("doctype-" + mode);
        prevMode = mode;
    });
});