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
    if (this._id == null) this._id = 1;

    // doesn't work on update!
    FakeDataset.sets.push(this);

    cb();
};

FakeDataset._nextId = 1;
FakeDataset.find = function (filter) {
    this.filter = filter;
    return this;
};
FakeDataset.sort = function () {
    return this;
};
FakeDataset.exec = function (cb) {
    let result = _exec(FakeDataset.sets, this.filter);
    this.filter = null;
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
    if (this._id == null) this._id = 1;

    // doesn't work on update!
    FakeDatapoint.points.push(this);

    cb();
};

FakeDatapoint._nextId = 1;
FakeDatapoint.find = function (filter) {
    this.filter = filter;
    return this;
};
FakeDatapoint.sort = function () {
    return this;
};
FakeDatapoint.exec = function (cb) {
    let result = _exec(FakeDatapoint.points, this.filter);
    this.filter = null;
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
                name: 'dataset 1'
            }),
            new FakeDataset({
                owner: 1,
                name: 'dataset 2'
            }),
            new FakeDataset({
                owner: 2,
                name: 'dataset 3'
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
                y: 1
            }),
            new FakeDatapoint({
                dataset: 1,
                x: '2019-01-02',
                y: 2
            }),
            new FakeDatapoint({
                dataset: 1,
                x: '2019-01-03',
                y: 3
            }),
        ]
    },
});

// test data used by tests

testdata.apiroottest = () => ({
    ...getTestData('loggedin'),
});

testdata.createdataset = () => ({
    ...getTestData('loggedin'),
});

testdata.getdatasets = () => ({
    ...getTestData('loggedin'),
    ...getTestData('testdatasets'),
});

testdata.getdataset = () => ({
    ...getTestData('loggedin'),
    ...getTestData('testdatasets'),
    ...getTestData('testdatapoints')
});

module.exports = {
    ...logs,
    ...user,
    ...dataset,
    ...server,
    ...datapoint,
    ...testdata
};