const express = require('express');
const VError = require('verror');
const EventEmitter = require('events');

// log helpers /////////////////////
var _logs = [];

var logs = {
    stubLog(log, name) {
        log.enabled = true;
        _logs[name] = [];
        log._oldLogFunction = log.log;
        log.log = function (msg) {
            _logs[name].push(msg);
        };
    },

    unStubLog(log) {
        log.enabled = false;
        log.log = log._oldLogFunction;
        delete log._oldLogFunction;
    },

    getStubbedMessages(name) {
        return _logs[name];
    },
};

// User model helpers ///////////////
var user = {
    stubUserModel(options) {
        options = options || {};

        // convenience departure from spec
        FakeUser.users = options.users || [];

        delete FakeUser.alwaysFail;
        if (options.alwaysFail)
            FakeUser.alwaysFail = true;

        return FakeUser;
    }
};

function FakeUser(options) {
    options = options || {};
    this.username = options.username;
    this.password = options.password;
    this.options = options;
}

FakeUser.register = function (user, password, cb) {
    if (FakeUser.alwaysFail) {
        let err = new VError('database error');
        return cb(err);
    }

    user.password = password;

    // only supports 1!
    user._id = 1;

    FakeUser.users.push(user);
    if (cb) cb(null, this);
};

// generic stub helpers
function _filterMatch(o, filter = null) {
    filter = filter || this.filter;

    if (!filter) return true;

    var match = true;
    for (let k in filter) {
        if (filter[k] != o[k]) {
            match = false;
            break;
        }
    }

    return match;
}

function _findById(arr, id) {
    let filter = {
        _id: id
    };
    let result = null;
    for (let i = 0; i < arr.length; i++) {
        let o = arr[i];
        if (_filterMatch(o, filter)) {
            result = o;
            break;
        }
    }
    return result;
}

// function _findOne(arr, filter) {
//     let result = _exec(arr, filter);
//     if(result.length >= 1)
//         return result[0];
//     return null;
// }

function _exec(arr, filter) {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
        let o = arr[i];
        if (_filterMatch(o, filter)) {
            result.push(o);
            continue;
        }
    }
    return result;
}

function _save(arr, o) {
    let exists = _findById(arr, o._id);
    if (!exists)
        arr.push(o);
}

function _delete(arr, o) {
    let pos = arr.indexOf(o);
    if (pos < 0) return;
    arr.splice(pos, 1);
}

// Dataset model helpers
var dataset = {
    stubDatasetModel(options) {
        options = options || {};

        // convenience departure from spec
        FakeDataset.sets = options.sets || [];

        FakeDataset._nextId = 1;

        delete FakeDataset.alwaysFail;
        if (options.alwaysFail)
            FakeDataset.alwaysFail = true;

        return FakeDataset;
    }
};

function FakeDataset(options) {
    options = options || {};
    for (let k in options)
        this[k] = options[k];
    this._id = FakeDataset._nextId;
    this.options = options;
    FakeDataset._nextId++;
    // this._id = options._id;
    // this.owner = options.owner;
    // this.name = options.name;
}

FakeDataset.prototype.toObject = function () {
    return this;
};

FakeDataset.prototype.save = function (cb) {
    if (FakeDataset.alwaysFail) {
        let err = new VError('database error');
        return cb(err);
    }

    _save(FakeDataset.sets, this);

    cb(null);
};

FakeDataset.prototype.delete = function (cb) {
    _delete(FakeDataset.sets, this);

    cb();
};

FakeDataset._nextId = 1;
FakeDataset.find = function (filter) {
    this.filter = filter;
    return this;
};
FakeDataset.findOne = function (filter) {
    this.filter = filter;
    this.one = true;
    return this;
};
FakeDataset.sort = function () {
    return this;
};
FakeDataset.exec = function (cb) {
    if (FakeDataset.alwaysFail) {
        let err = new VError('database error');
        return cb(err);
    }

    let result = _exec(FakeDataset.sets, this.filter);
    if (this.one)
        result = result.length >= 1 ? result[0] : null;
    delete this.filter;
    delete this.one;
    cb(null, result);
};
FakeDataset.findById = function (id, cb) {
    if (FakeDataset.alwaysFail) {
        let err = new VError('database error');
        return cb(err);
    }

    let result = _findById(FakeDataset.sets, id);
    cb(null, result);
};

// Datapoint model helpers
var datapoint = {
    stubDatapointModel(options) {
        options = options || {};

        FakeDatapoint._nextId = 1;

        // convenience departure from spec
        FakeDatapoint.points = options.points || [];

        delete FakeDatapoint.alwaysFail;
        if (options.alwaysFail)
            FakeDatapoint.alwaysFail = true;

        return FakeDatapoint;
    }
};

function FakeDatapoint(options) {
    options = options || {};
    for (let k in options)
        this[k] = options[k];
    this._id = FakeDatapoint._nextId;
    FakeDatapoint._nextId++;
}

FakeDatapoint.prototype.toObject = function () {
    return this;
};

FakeDatapoint.prototype.save = function (cb) {
    _save(FakeDatapoint.points, this);

    cb(null);
};

FakeDatapoint.prototype.delete = function (cb) {
    _delete(FakeDatapoint.points, this);

    cb();
};

FakeDatapoint._nextId = 1;
FakeDatapoint.find = function (filter) {
    this.filter = filter;
    return this;
};
FakeDatapoint.findOne = function (filter) {
    this.filter = filter;
    this.one = true;
    return this;
};
FakeDatapoint.sort = function () {
    return this;
};
FakeDatapoint.exec = function (cb) {
    if (FakeDatapoint.alwaysFail) {
        let err = new VError('database error');
        return cb(err);
    }

    let result = _exec(FakeDatapoint.points, this.filter);
    if (this.one)
        result = result.length >= 1 ? result[0] : null;
    delete this.filter;
    delete this.one;
    cb(null, result);
};
FakeDatapoint.findById = function (id, cb) {
    let result = _findById(FakeDatapoint.points, id);
    cb(null, result);
};

// backend helpers /////////

var backendHelpers = {

    stubBackend(options) {
        options = options || {};

        let backend = {
            connection: new EventEmitter(),
            createSession(options) {
                return options.secret;
            },
            initAuthentication(options) {
                return 'success';
            },
            connect(url) {
                return (new Promise((resolve, reject) => {
                    setTimeout(function () {
                        resolve();
                    }, 50);
                }));
            },
            getModel(model) {
                return this.models[model];
            },
            models: {},
            registerUser(options, cb) {
                let User = this.models.User;
                User.register(new User({
                    username: options.username
                }), options.password, cb);
            },
            create(model, options, cb) {
                let Model = this.getModel(model);
                let result = new Model();
                for (let k in options) {
                    result[k] = options[k];
                }
                result.save(cb);
                return result;
            },
            authenticate: options.authenticate || function () {}
        };

        for (let k in options.models) {
            backend.models[k] = options.models[k];
        }

        return backend;
    },

    stubBackendService(options) {
        options = options || {};
        return {
            backend: backendHelpers.stubBackend({
                models: {
                    User: user.stubUserModel(options.userOptions),
                    Dataset: dataset.stubDatasetModel(options.datasetOptions),
                    Datapoint: datapoint.stubDatapointModel(options.datapointOptions),
                },
            }),
            getModel(model) {
                return this.backend.getModel(model);
            },
            registerUser(options, cb) {
                this.backend.registerUser(options, cb);
            },
            authenticate() {
                return function (req, res, next) {
                    // console.dir(req.body);
                    if (req.body.username != 'test' || req.body.password != 'password') {
                        req.flash = function (e) {
                            if (e == 'error')
                                return ['incorrect username or password'];
                        };
                        return next(new VError('incorrect username or password'));
                    }

                    req.user = {
                        username: req.body.username,
                        password: req.body.password,
                    };
                    req.isAuthenticated = function () {
                        return req.user != null;
                    };

                    return next();
                };
            },
            create(model, options, cb) {
                return this.backend.create(model, options, cb);
            }
        };
    }
};

// server helpers //////////
var server = {

    stubServer(options) {
        options = options || {};
        var backendService = backendHelpers.stubBackendService(options);
        router = options.createRouter({
            backend: backendService
        });
        app = express();
        app.use((req, res, next) => {
            if (options.stubAuth) req.user = options.user;
            req.isAuthenticated = function () {
                return req.user != null;
            };
            next();
        });
        app.use(router);
        var server = app.listen(3000, function () {});

        // convenience departure from spec
        server.backend = backendService;

        return server;
    }
};

// get test data!

function getTestData(key) {
    return typeof testdata[key] !== 'function' ? testdata[key] : testdata[key]();
}

var testdata = {
    getTestData: getTestData,
};

// test data pieces

testdata.testuser = () => ({
    username: 'test',
    password: 'password',
    _id: 1,
});

testdata.testusers = () => ({
    userOptions: {
        users: [getTestData('testuser')],
    },
});

testdata.loggedin = () => ({
    stubAuth: true,
    user: getTestData('testuser'),
    userOptions: {
        users: [getTestData('testuser')],
    },
});

testdata.testdatasets = () => ({
    datasetOptions: {
        sets: [
            new FakeDataset({
                owner: 1,
                name: 'dataset 1',
                yAxisLabel: 'hours',
            }),
            new FakeDataset({
                owner: 1,
                name: 'dataset 2',
                yAxisLabel: 'hours',
            }),
            new FakeDataset({
                owner: 2,
                name: 'dataset 3',
                yAxisLabel: 'hours',
            }),
        ]
    },
});

testdata.testdatapoints = () => ({
    datapointOptions: {
        points: [
            new FakeDatapoint({
                dataset: 1,
                x: '2019-01-01',
                y: 1,
            }),
            new FakeDatapoint({
                dataset: 1,
                x: '2019-01-02',
                y: 2,
            }),
            new FakeDatapoint({
                dataset: 1,
                x: '2019-01-03',
                y: 3,
            }),
        ]
    },
});

testdata.dberror = {
    stubAuth: true,
    user: getTestData('testuser'),
    userOptions: {
        alwaysFail: true,
    },
    datasetOptions: {
        alwaysFail: true,
    },
    datapointOptions: {
        alwaysFail: true,
    },
};

module.exports = {
    ...logs,
    ...user,
    ...dataset,
    ...backendHelpers,
    ...server,
    ...datapoint,
    ...testdata
};