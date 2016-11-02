(function(module) {
    'use strict';
    /* globals module, require */

    var user = module.parent.require('./user'),
        meta = module.parent.require('./meta'),
        db = module.parent.require('../src/database'),
        nconf = module.parent.require('nconf'),
        async = module.parent.require('async'),
        winston = module.parent.require('winston'),
        emailer = module.parent.require('./emailer'),
        socketAdmin = module.parent.require('../src/socket.io/admin')
        ;


    var constants = Object.freeze({
        'name': 'Bulk Users',
        'admin': {
            'route': '/plugins/bulk-users-bf',
            'icon': 'fa-facebook-square'
        }
    });

    var BF = {
        settings: undefined
    };

    BF.init = function(params, callback) {
        function render(req, res) {
            res.render('admin/plugins/bulk-users-bf', {});
        }

        params.router.get('/admin/plugins/bulk-users-bf', params.middleware.admin.buildHeader, render);
        params.router.get('/api/admin/plugins/bulk-users-bf', render);

        socketAdmin.bulkUsers = {
            create : BF.bulkCreate
        };

        callback();
    };

    BF.getEmails = function(callback) {
        async.waterfall([
            function (next) {
                db.getSortedSetRangeWithScores('username:uid', 0, -1, next);
            },
            function (users, next) {
                var uids = users.map(function(user) {
                    return user.score;
                });
                user.getUsersFields(uids, ['email'], next);
            },
            function (usersData, next) {
                var result = [];
                usersData.forEach(function(user) {
                    if (user) {
                        result.push(user.email.toLowerCase());
                    }
                });
                next(null, result);
            }
        ], callback);
    };

    BF.bulkCreate = function (socket, data, next) {
        var lines = data.text.split("\n");
        var nameEmails = [];
        for (var i = 0; i < lines.length; i++)
        {
            var line = lines[i].trim();
            if (line.length == 0) continue;
            var nameEmail = lines[i].split(";");
            if (nameEmail.length != 2)
            {
                return next(new Error('Invalid name+email on line ' + (i + 1)));
            }
            if (!nameEmail[1].match(/[^@]+@[^@]+/))
            {
                return next(new Error('Invalid e-mail on line ' + (i + 1)));
            }
            nameEmails.push({"line": i + 1, name: nameEmail[0].trim(), email:nameEmail[1].trim().toLowerCase() });
        }
        async.waterfall([
            BF.getEmails,
            function(emails, next) {
                for (var i = 0; i < nameEmails.length; i++) {
                    var entry = nameEmails[i];
                    if (emails.indexOf(entry.email) != -1)
                    {
                        return next(new Error('E-mail ' + entry.email + ' at ' + entry.line + " already used."));
                    }
                }
                next();
            },
            function() {
                for (var i = 0; i < nameEmails.length; i++) {
                    BF.createUserAndSend(nameEmails[i]);
                }
                next();
            }
            ], next);
    };

    BF.createUserAndSend = function(entry){
        var characters = '01234567890abcdefghijklmonopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        console.log("Creating " + entry.name + " " + entry.email);
        var pw = '';
        for (var j = 0; j < 10; j++)
        {
            pw += characters[Math.floor(Math.random() * characters.length)];
        }
        user.create({username: entry.name, fullname: entry.name, password:pw, email: entry.email}, function(err, uid) {
            if (err) {
                console.log("Creating " + entry.email + " failed " + err.message);
                return;
            }
            user.setUserField(uid, 'passwordExpiry', -1);
            var data = {
                subject: "Välkommen till Medborgerlig Samlings interna forum",
                template: 'newuser',
                password: pw,
                email: entry.email,
                uid: uid
            };
            emailer.send('newuser', uid, data, function(err) {
                if (err) {
                    console.log("Sending " + entry.email + " failed " + err.message);
                    return;
                }
                console.log("Mail sent to " + entry.email);
            });

            console.log("Creating " + entry.email + " succeeded pw: " + pw);
        });
    };

    BF.addMenuItem = function(custom_header, callback) {
        custom_header.plugins.push({
            'route': '/plugins/bulk-users-bf',
            'icon': constants.admin.icon,
            'name': 'Bulk Users'
        });

        callback(null, custom_header);
    };

    module.exports = BF;
}(module));
