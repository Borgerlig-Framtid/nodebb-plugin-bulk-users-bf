define('admin/plugins/bulk-users-bf', ['settings'], function(Settings) {
    'use strict';
    /* globals $, app, socket, require */

    var ACP = {};


    ACP.init = function() {

        $('#bulk-create').on('click', function() {
            var bulkUsers = $('#bulk-users').val();
            if (bulkUsers == '') return false;
            socket.emit('admin.bulkUsers.create', {text:bulkUsers},
                function (err, payload) {

                    // Something bad happened, alert the user and don't save.
                    if (err) return app.alert({
                        type: 'Error',
                        alert_id: 'fail-create',
                        title: 'Bulk invitation failed',
                        message: err.message,
                        timeout: 15000
                    });
                    app.alert({
                        type: 'success',
                        alert_id: 'success-create',
                        title: 'Users created',
                        message: 'All users created',
                        clickfn: function () {
                        }
                    });
                }
            );
        });
    };

    return ACP;
});