const moment = require('moment');
const logger = require('../logger');
const log = logger.log.extend('SiteController');
const _ = require('lodash');
const createError = require('http-errors');
const BackendController = require('./backendcontroller');

function SiteController(backendService) {
    const backendController = BackendController(backendService);
    const instance = {
        initialize() {
            return (req, res, next) => {
                log('initialization: ' + req.path);

                // configure template locals
                // site title
                res.locals.siteTitle = state.siteTitle;
                // nav - note it's a copy for string replacement
                res.locals.nav = preProcessNav(req);
                // style - not sure if still used
                res.locals.style = state.style;
                // give the template a subset of the req object
                res.locals.req = {
                    path: req.path
                };
                // pass along the logged in user if any
                res.locals.user = req.user;

                // grab current page from nav
                let active = _.find(state.nav, {
                    path: req.path
                });
                if (!active) {
                    // match dynamic pages
                    state.dynamic.some((v, k, col) => {
                        log(`testing ${req.path} vs ${v.regex}`);
                        if (v.regex && v.regex.test(req.path)) {
                            // match!
                            log('matched!');
                            active = v;
                            //break loop
                            return true;
                        }
                    });
                }

                // process ACL
                if (active) {
                    if (active.acl == 'loggedIn' && !req.isAuthenticated()) {
                        if (req.path != '/')
                            req.flash('error', 'You must log in first.');
                        return res.redirect('/login');
                    }
                    if (active.acl == 'loggedOut' && req.isAuthenticated()) {
                        return res.redirect('/');
                    }

                    // set template variables for active page
                    res.locals.active = active;
                    if (active.title)
                        setPageTitle(res, active.title);

                    var breadcrumbs = [];
                    if (active.parent) {
                        var parent = _.find(state.nav, {
                            path: active.parent
                        });
                        // check dynamic pages - unfortunately this doesn't work cuz we can't process the title :/
                        // if(!parent) {
                        //     state.dynamic.some((v, k, col) => {
                        //         if (active.parent instanceof RegExp && v.regex && v.regex.source == active.parent.source) {
                        //             // match!
                        //             parent = v;
                        //             //break loop
                        //             return true;
                        //         }
                        //     });
                        // }
                        if (parent) {
                            breadcrumbs.push({
                                title: parent.title,
                                link: parent.path
                            });
                        }
                    }
                    if (breadcrumbs.length > 0)
                        res.locals.breadcrumbs = breadcrumbs;
                }

                setFlashMessages(res, req.flash());

                // log('locals: %o', res.locals);

                // pass some node module utility stuff along too!
                // res.locals.moment = moment;

                next();
            };
        },
        overview() {
            return (req, res, next) => {
                log('overview, getting datasets');
                // getDatasetsForUserSortedByUnit
                backendController.getGroupedDatasetsForUser(req.user._id, (err, groups) => {
                    if (err) return next(logger.verror(err, 'Error getting datasets'));

                    res.locals.groups = groups;
                    res.locals.keys = Object.keys(groups).sort();
                    res.render('overview');
                });
            };
        },
        register() {
            return (req, res, next) => {
                res.render('register');
            };
        },
        registerSuccess() {
            return (req, res, next) => {
                req.flash('success', 'You have successfully registered, please log in.');
                res.redirect('/login');
            };
        },
        login() {
            return (req, res, next) => {
                res.render('login');
            };
        },
        loginSuccess() {
            return (req, res, next) => {
                req.flash('success', 'Welcome, ' + req.user.username + '!');
                res.redirect('/');
            };
        },
        logout() {
            return (req, res, next) => {
                req.logout();
                if (req.xhr) {
                    return res.json({
                        success: true,
                        message: 'You have been logged out'
                    });
                }
                return res.redirect('/');
            };
        },
        newDataset() {
            return (req, res, next) => {
                res.render('set-form');
            };
        },
        viewDataset() {
            return (req, res, next) => {
                backendController.getDataset(req.params.id, (err, dataset) => {
                    if (err) {
                        logger.logError(err, 'Database error loading dataset %s', req.params.id);
                        return next(err);
                    }

                    if (!dataset) {
                        log('No dataset found for id %s', req.params.id);

                        // dataset not found
                        return next(new Error('Dataset not found'));
                    }

                    res.locals.dataset = dataset.toObject();
                    var title = replace_dataset_name(res.locals.active.title, dataset.name);
                    setPageTitle(res, title);
                    return res.render('dataset');
                });
            };
        },
        editDataset() {
            return (req, res, next) => {
                // grab the dataset from the db
                backendController.getDataset(req.params.id, (err, dataset) => {
                    if (err) {
                        logger.logError(err, 'Dataset not found for id %s', req.params.id);
                        return next(err);
                    }
        
                    if (!dataset) {
                        log('no dataset found for id %s', req.params.id);
        
                        // dataset not found
                        return next(new Error('Dataset not found'));
                    }
                    var result = dataset.toObject();
                    res.locals.dataset = result;
        
                    var title = replace_dataset_name(res.locals.active.title, dataset.name);
                    setPageTitle(res, title);
        
                    // we need custom breadcrumbs for this one lol, my code can't handle it automatically
                    res.locals.breadcrumbs = [{
                            title: 'Overview',
                            link: '/'
                        },
                        {
                            title: dataset.name,
                            link: '/set/' + req.params.id
                        }
                    ];
        
                    res.render('set-form');
                });
            };
        },
        multiList() {
            return (req, res, next) => {
                backendController.getDatasetsForUser(req.user._id, (err, datasets) => {
                    if (err) {
                        logger.logError(err, 'database error getting datasets for user %s', req.user._id);
                        return next(err);
                    }
        
                    // compute a list of unique units
                    var uniqueLabels = [];
                    for (let i = 0; i < datasets.length; i++) {
                        if (uniqueLabels.indexOf(datasets[i].yAxisLabel) < 0)
                            uniqueLabels.push(datasets[i].yAxisLabel);
                    }
        
                    res.locals.labels = uniqueLabels;
                    res.render('multi');
                });
            };
        },
        multiDetail() {
            return (req, res, next) => {
                backendController.getDatasetsForUserAndLabel(req.user._id, req.params.label, (err, datasets) => {
                    if (err) {
                        logger.logError(err, 'Database error getting datasets for user %s', req.user._id);
                        return next(err);
                    }
        
                    res.locals.datasets = datasets;
                    setPageTitle(res, replace_dataset_unit(res.locals.active.title, req.params.label));
                    res.render('multi');
                });
            };
        },
        create404() {
            return (req, res, next) => {
                next(createError(404, 'Page not found: ' + req.url));
            };
        },
        handleError() {
            return (err, req, res, next) => {
                logger.logError(err, 'error handler caught an error');

                // set locals, only providing error in development
                res.locals.message = err.message;
                res.locals.error = req.app.get('env') === 'development' ? err : {};
        
                res.locals.siteTitle = 'DailyTrackr - Error';
                res.locals.pageTitle = 'Error';
        
                var active = {
                    // noscroll: true
                };
        
                res.locals.active = active;
                res.locals.nav = [];
        
                // render the error page
                err.status = err.status || 500;
                res.status(err.status || 500);
                res.render('error');
            };
        }
    };
    return instance;
}

var state = {
    siteTitle: 'DailyTrack',
    nav: [{
            title: 'Overview',
            icon: 'fa-list',
            path: '/',
            acl: 'loggedIn',
            nochart: true,
        },
        {
            title: 'New Dataset',
            icon: 'fa-plus-square',
            path: '/set/new',
            // noscroll: true,
            acl: 'loggedIn',
            parent: '/',
            nochart: true,
        },
        {
            title: 'Multi-View',
            icon: 'fa-chart-pie',
            path: '/multi',
            // noscroll: true,
            acl: 'loggedIn',
            nochart: true,
        },
        {
            title: 'Log Out ${USERNAME}',
            path: '/logout',
            icon: 'fa-sign-out-alt',
            acl: 'loggedIn',
            nochart: true,
        },
        {
            title: 'Sign Up',
            path: '/register',
            // nolink: true,
            acl: 'loggedOut',
            nochart: true,
        },
        {
            title: 'Log In',
            path: '/login',
            // nolink: true,
            acl: 'loggedOut',
            nochart: true,
        }
    ],
    dynamic: [{
            regex: /^\/set\/.+\/edit/, //match /set/id/edit
            title: 'Edit ${DATASET_NAME}',
            icon: '',
            // noscroll: true,
            acl: 'loggedIn',
            parent: /^\/set\/.+/,
            nochart: true,
        }, {
            regex: /^\/set\/.+/, //match /set/id
            title: '${DATASET_NAME}',
            notitle: true,
            icon: '',
            // noscroll: true,
            acl: 'loggedIn',
            parent: '/'
        },
        {
            regex: /^\/multi\/.+/, //match /multi/:label
            title: '${DATASET_UNIT}',
            notitle: true,
            icon: '',
            // noscroll: true,
            acl: 'loggedIn',
            parent: '/multi'
        },
    ],
    style: {
        chartRowHeight: '320px'
    }
};

/**
 * add flash messages to res.locals
 */
function setFlashMessages(res, messages) {
    // add flash messages to locals, rewrite passport's "error" to "danger" for bootstrap classes
    res.locals.messages = {};
    for (var k in messages) {
        res.locals.messages[k == 'error' ? 'danger' : k] = messages[k];
    }
    if (!_.isEmpty(res.locals.messages))
        log('res.locals.messages: %j', res.locals.messages);
}

/**
 * preprocess the nav object, do string replacement etc
 */
function preProcessNav(req) {
    var retval = [];
    for (let i = 0; i < state.nav.length; i++) {
        let current = JSON.parse(JSON.stringify(state.nav[i]));

        // determine whether to include this link
        if (typeof current.acl === 'undefined' ||
            (current.acl == 'loggedIn' && req.isAuthenticated()) ||
            (current.acl == 'loggedOut' && !req.isAuthenticated())
        ) {
            // do some string replacements
            current.title = current.title.replace('${USERNAME}', req.user ? req.user.username : '');

            retval.push(current);
        }
    }

    return retval;
}

/**
 * add page title to res.locals
 * @param {*} res 
 * @param {*} title 
 */
function setPageTitle(res, title) {
    res.locals.pageTitle = title;
    res.locals.siteTitle = state.siteTitle + ' - ' + title;
}

function replace_dataset_unit(str, label) {
    if(!str) return str;
    str = str.replace('${DATASET_UNIT}', label ? label : '');
    return str;
}

function replace_dataset_name(str, name) {
    if(!str) return str;
    str = str.replace('${DATASET_NAME}', name ? name : '');
    return str;
}

SiteController.setPageTitle = setPageTitle;
module.exports = SiteController;