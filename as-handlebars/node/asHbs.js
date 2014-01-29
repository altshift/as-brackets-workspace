/*jslint nomen: true, node: true */

"use strict";

var hbs = require("handlebars"),
    exec = require('child_process').exec;


function hbsCompile($filePath) {
    var outputPath;
    outputPath = $filePath.replace(".hbs", ".html.js");

    exec(__dirname + "/node_modules/ember-precompile/bin/ember-precompile " + $filePath + " -f " + outputPath);
}

/**
 * Initializes the test domain with several test commands.
 * @param {DomainManager} DomainManager The DomainManager for the server
 */
function init(DomainManager) {
    if (!DomainManager.hasDomain("asHbs")) {
        DomainManager.registerDomain("asHbs", {major: 0, minor: 1});
    }
    DomainManager.registerCommand(
        "asHbs",       // domain name
        "compileFile",    // command name
        hbsCompile,   // command handler function
        true,          // this command is synchronous
        "Compile the hbs content given to the function", // comment
        [],             // param doc
        [] // return doc
    );
}

exports.init = init;