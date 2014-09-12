/*
 * Copyright (c) 2012 Raymond Camden
 *
 * See the file LICENSE for copying permission.
 */

define(function (require, exports, module) {
    "use strict";

    var jscsDefaultConfig,
        AppInit = brackets.getModule("utils/AppInit"),
        CodeInspection = brackets.getModule("language/CodeInspection"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        JscsStringChecker = require("./jscs-browser"),
        configCache = {
            ".jscsrc": {
                "/.jscsrc": {}
            }
        };

    jscsDefaultConfig = FileSystem.getFileForPath(require.toUrl("./jscsConfig.json")).read(function ($error, $content) {
        var jscsDefaultConfig = JSON.parse($content);

        configCache[".jscsrc"]["/.jscsrc"] = jscsDefaultConfig;
    });

    require("./jshint");

    function handleHinter(text, fullPath, $callback) {
        var jsHintPromise, jscsPromise,
            response = new $.Deferred();

        jsHintPromise = loadConfigForFile(fullPath, ".jshintrc").then(function ($config) {
            var i, len, messageOb, type, message,
                errors = [],
                resultJH = JSHINT(text, $config),
                jsHintErrors = JSHINT.errors;

            //console.log("jsHintPromise", $config, resultJH)
            if (!resultJH) {
                for (i = 0, len = jsHintErrors.length; i < len; i++) {
                    messageOb = jsHintErrors[i];
                    //default
                    type = CodeInspection.Type.ERROR;

                    // encountered an issue when jshint returned a null err
                    if (messageOb) {
                        if (messageOb.type !== undefined) {
                            // default is ERROR, override only if it differs
                            if (messageOb.type === "warning") {
                                type = CodeInspection.Type.WARNING;
                            }
                        }

                        message = messageOb.reason;
                        if (messageOb.code) {
                            message += " (" + messageOb.code + ")";
                        }
                        message += " [jsh]";

                        errors.push({
                            pos: {
                                line: messageOb.line - 1,
                                ch: messageOb.character
                            },
                            message: message,
                            type: type
                        });
                    }
                }
            }

            return errors;
        });

        jscsPromise = loadConfigForFile(fullPath, ".jscsrc").then(function ($config) {
            var jscsErrors, checker, errList,
                errors = [];

            checker = new JscsStringChecker();
            checker.registerDefaultRules();
            checker.configure($config);

            jscsErrors = checker.checkString(text);
            errList = jscsErrors.getErrorList();

            errList.forEach(function (error) {
                errors.push({
                    pos: {
                        line: error.line - 1,
                        ch: error.column
                    },
                    message: error.message + " [jscs]",
                    type: CodeInspection.Type.WARNING
                });
            });

            return errors;
        });

        return $.when(jscsPromise, jsHintPromise).then(function ($jscsErrors, $jsHintErrors) {
            var joinedErrors = $jscsErrors.concat($jsHintErrors);
            return {
                errors: joinedErrors
            };
        });
    }

    function tryGetConfigAt($path) {
        var file,
            config = false,
            deferred = new $.Deferred();

        try {
            // Try to load config from file
            file = FileSystem.getFileForPath($path);
            file.read(function ($error, $content) {
                if ($error) {
                    deferred.resolve($path, false);
                } else {
                    try {
                        eval("config  = " + $content);
                        deferred.resolve($path, config);
                    } catch ($$error) {
                        deferred.resolve($path, false);
                        console.error("Parsing error for file:" + path);
                        console.error($$error.stack);
                    }
                }
            });
        } catch ($error) {
            // Unable to get config = no config
            deferred.resolve($path, false);
        }

        return deferred.promise();
    }

    function loadConfigForFile($path, $fileName) {
        var file, pathItems, curPath,
            readCount = 0,
            allPromises = [],
            myConfigCache = configCache[$fileName] = configCache[$fileName] ||  [],
            finalConfig = {};

        // Break up path parts
        pathItems = $path.split("/");

        // For every part of path, check presence of config file
        while (pathItems.length > 1) {
            pathItems.length -= 1;

            curPath = pathItems.join("/") + "/" + $fileName;
            if (myConfigCache[curPath] === undefined) {
                // Only get config if not already recovered (need refresh if any changes are made into config)
                allPromises.push(tryGetConfigAt(curPath).done(function ($path, $config) {
                    myConfigCache[$path] = $config;
                }));
            }
        }

        return $.when.apply($, allPromises).then(function () {
            // All config files are loaded, now merge all of them into one config
            var attName, curPath;

            pathItems = $path.split("/");
            while (pathItems.length > 1) {
                pathItems.length -= 1;
                curPath = pathItems.join("/") + "/" + $fileName;
                if (myConfigCache[curPath]) {
                    for (attName in myConfigCache[curPath]) {
                        if (myConfigCache[curPath].hasOwnProperty(attName) && !(attName in finalConfig)) {
                            finalConfig[attName] = myConfigCache[curPath][attName];
                        }
                    }
                }
            }

            // Return final config
            return finalConfig;
        });
    }

    exports.scanAsync = handleHinter;
    exports.fileType = "javascript";
    exports.name = "jsHint";

});
