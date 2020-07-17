// SITE ROUTER /////////////////////////////
const express = require('express');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const ensureLoggedOut = require('connect-ensure-login').ensureLoggedOut;
const SiteController = require('../controllers/sitecontroller');

function SiteRouter({
    backendService
}) {
    const siteController = SiteController(backendService);

    const siteRouter = express.Router();

    siteRouter.use(express.urlencoded({
        extended: true
    }));
    siteRouter.use(express.json());

    // prep state
    siteRouter.use(siteController.initialize());

    // show overview page
    siteRouter.get('/', siteController.overview());

    // register
    siteRouter.get('/register', siteController.register());
    siteRouter.get('/register/success', siteController.registerSuccess());

    // login
    siteRouter.get('/login', siteController.login());
    siteRouter.get('/login/success', siteController.loginSuccess());

    // logout
    siteRouter.get('/logout', siteController.logout());

    // new dataset
    siteRouter.get('/set/new', siteController.newDataset());

    // view dataset
    siteRouter.get('/set/:id', siteController.viewDataset());

    // edit dataset
    siteRouter.get('/set/:id/edit', siteController.editDataset());

    // view multiple datasets on the same chart
    siteRouter.get('/multi', siteController.multiList());
    siteRouter.get('/multi/:label', siteController.multiDetail());

    // catch 404 and forward to error handler
    siteRouter.use(siteController.create404());

    // error handler
    siteRouter.use(siteController.handleError());

    return siteRouter;

}

module.exports = SiteRouter;
