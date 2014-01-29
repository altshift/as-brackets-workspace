/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4 */
/*global define, $, brackets, window, js_beautify, style_html, css_beautify, localStorage */

define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        Menus = brackets.getModule("command/Menus"),
        COMMAND_SAVE_ID = "as.handlebars.autosave",
        COMMAND_ID = "as.handlebars.apply";

    var node = require("./node");

    function compile($fromSave) {
        var doc = DocumentManager.getCurrentDocument();

        // Only compile hbs files
        if (/^.*\.hbs$/.test(doc.file.name)) {
            node.pLoadDomain("asHbs").then(function ($domain) {
                $domain.compileFile(doc.file.fullPath);
            });
        } else if (!$fromSave) {
            alert("Unable to precompile template.\nHandlebars template files must have \"hbs\" extension.");
        }
    }
    function onSave() {
        compile(true);
    }

    var preferences = PreferencesManager.getPreferenceStorage(COMMAND_SAVE_ID, {
        enabled: false
    });
    var enabled = preferences.getValue('enabled');

    function toggle(command, fromCheckbox) {
        var newValue = (fromCheckbox === undefined) ? enabled : fromCheckbox;
        $(DocumentManager)[newValue ? 'on' : 'off']('documentSaved', onSave);
        preferences.setValue('enabled', newValue);
        command.setChecked(newValue);
    }

    CommandManager.register("Handlebars compile", COMMAND_ID, compile);
    var commandOnSave = CommandManager.register("Handlebars compile on Save", COMMAND_SAVE_ID, function () {
        toggle(this, !this.getChecked());
//        if (this.getChecked()) {
//            localStorage.setItem(COMMAND_TIMESTAMP, 0);
//        }
    });

    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);

    var windowsCommand = {
        key: "Ctrl-Alt-K",
        platform: "win"
    };
    var macCommand = {
        key: "Cmd-Alt-K",
        platform: "mac"
    };

    var command = [windowsCommand, macCommand];

    toggle(commandOnSave);

    menu.addMenuDivider();
    menu.addMenuItem(COMMAND_ID, command);
    menu.addMenuItem(COMMAND_SAVE_ID);

});