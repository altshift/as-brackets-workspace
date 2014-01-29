/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4 */
/*global define, $, brackets, window, js_beautify, style_html, css_beautify, localStorage */
define(function (require, exports, module) {
    "use strict";

    var AppInit        = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeConnection = brackets.getModule("utils/NodeConnection");

    AppInit.appReady(function () {
        var nodeConnection = new NodeConnection();

        // Helper function to connect to node
        function pConnect() {
            var connectionPromise = nodeConnection.connect(true);
            connectionPromise.fail(function () {
                console.error("[as-brackets-node] failed to connect to node");
            });
            return connectionPromise;
        }

        /** Helper function that loads our domain into the node server
        *
        * @params {string} $domainFile filename in node folder to load
        **/
        function pLoadDomain($domainFile, $domainName) {
            $domainName = $domainName || $domainFile;

            return pConnect().then(function () {
                var path = ExtensionUtils.getModulePath(module, "node/" + $domainFile),
                    loadPromise = nodeConnection.loadDomains([path], true);

                loadPromise.fail(function () {
                    console.error("[as-brackets-node] failed to load domain " + $domainFile);
                });

                return loadPromise.then(function () {
                    return nodeConnection.domains[$domainName];
                });
            });
        }

        exports.pLoadDomain = pLoadDomain;
    });
});