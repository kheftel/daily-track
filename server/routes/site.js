// SITE ROUTER /////////////////////////////
const express = require('express');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const ensureLoggedOut = require('connect-ensure-login').ensureLoggedOut;
const siteController = require('../controllers/sitecontroller');

function siteRouter({
    backend
}) {
    const site = siteController(backend);

    const siteRouter = express.Router();

    siteRouter.use(express.urlencoded({
        extended: true
    }));
    siteRouter.use(express.json());

    // prep state
    siteRouter.use(site.initialize());

    // show overview page
    siteRouter.get('/', site.overview());

    // register
    siteRouter.get('/register', site.register());
    siteRouter.get('/register/success', site.registerSuccess());

    // login
    siteRouter.get('/login', site.login());
    siteRouter.get('/login/success', site.loginSuccess());

    // logout
    siteRouter.get('/logout', site.logout());

    // new dataset
    siteRouter.get('/set/new', site.newDataset());

    // view dataset
    siteRouter.get('/set/:id', site.viewDataset());

    // edit dataset
    siteRouter.get('/set/:id/edit', site.editDataset());

    // view multiple datasets on the same chart
    siteRouter.get('/multi', site.multiList());
    siteRouter.get('/multi/:label', site.multiDetail());

    // catch 404 and forward to error handler
    siteRouter.use(site.create404());

    // error handler
    siteRouter.use(site.handleError());

    return siteRouter;

}

module.exports = siteRouter;
