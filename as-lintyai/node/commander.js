(function(){

////////////////////////////////////////////////////////////////////////////////

var child_process;

child_process = require('child_process');

////////////////////////////////////////////////////////////////////////////////

exports.init = function(manager){
    if (!manager.hasDomain('lintyai'))
        manager.registerDomain('lintyai', {
            major: 1,
            minor: 0
        });

    manager.registerCommand('lintyai', 'commander', commander, true);
};

////////////////////////////////////////////////////////////////////////////////

function commander(exec, cb){
    child_process.exec(exec, function(err, stdout, stderr){
        cb(null, stderr + stdout);
    });
}

////////////////////////////////////////////////////////////////////////////////

}());
