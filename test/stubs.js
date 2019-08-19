const express = require('express');

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

        function FakeUser(options) {
            this.username = options.username;
            this.password = options.password;
        }

        // convenience departure from spec
        FakeUser.users = options.users || [];

        FakeUser.register = function (user, password, cb) {
            user.password = password;

            // only supports 1!
            user._id = 1;

            FakeUser.users.push(user);
            if (cb) cb();
        };
        return FakeUser;
    }
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
    if(pos < 0) return;
    arr.splice(pos, 1);
}

// Dataset model helpers
var dataset = {
    stubDatasetModel(options) {
        options = options || {};

        // convenience departure from spec
        FakeDataset.sets = options.sets || [];

        FakeDataset._nextId = 1;

        return FakeDataset;
    }
};

function FakeDataset(options) {
    options = options || {};
    for (let k in options)
        this[k] = options[k];
    this._id = FakeDataset._nextId;
    FakeDataset._nextId++;
    // this._id = options._id;
    // this.owner = options.owner;
    // this.name = options.name;
}

FakeDataset.prototype.toObject = function () {
    return this;
};

FakeDataset.prototype.save = function (cb) {
    _save(FakeDataset.sets, this);

    cb();
};

FakeDataset.prototype.delete = function(cb) {
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
    let result = _exec(FakeDataset.sets, this.filter);
    if(this.one)
        result = result.length >= 1 ? result[0] : null;
    delete this.filter;
    delete this.one;
    cb(null, result);
};
FakeDataset.findById = function (id, cb) {
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

    cb();
};

FakeDatapoint.prototype.delete = function(cb) {
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
    let result = _exec(FakeDatapoint.points, this.filter);
    if(this.one)
        result = result.length >= 1 ? result[0] : null;
    delete this.filter;
    delete this.one;
    cb(null, result);
};
FakeDatapoint.findById = function (id, cb) {
    let result = _findById(FakeDatapoint.points, id);
    cb(null, result);
};

// server helpers //////////
var server = {

    stubServer(options) {
        options = options || {};
        var backend = {
            User: user.stubUserModel(options.userOptions),
            Dataset: dataset.stubDatasetModel(options.datasetOptions),
            Datapoint: datapoint.stubDatapointModel(options.datapointOptions),
        };
        router = options.createRouter({
            backend: backend
        });
        app = express();
        if (options.stubAuth) {
            app.use((req, res, next) => {
                req.user = options.user;
                req.isAuthenticated = function () {
                    return req.user != null;
                };
                next();
            });
        }
        app.use(router);
        var server = app.listen(3000, function () {});

        // convenience departure from spec
        server.backend = backend;

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

testdata.loggedin = {
    stubAuth: true,
    user: getTestData('testuser'),
    userOptions: {
        users: [getTestData('testuser')],
    },
};

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

module.exports = {
    ...logs,
    ...user,
    ...dataset,
    ...server,
    ...datapoint,
    ...testdata
};