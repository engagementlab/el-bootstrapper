/*!
 * Engagement Lab Site Bootsrapper
 * Developed by Engagement Lab, 2016-2018
 * ==============
*/

 /**
 * Initialize an instance of KeystoneJS and mounts it to the pre-defined ExpressJS app.
 *
 * ### Examples:
 *
 *    siteFactory( { name: siteName, config: configData, app: appInstance, keystone: siteInst.keystone } );
 *
 * @class Sites
 * @name sites/factory
 * @param {Object} params The needed site config and Keystone, Express app, and Mongoose instance refs.
 * @param {Function} callback 
 * @return {Object} keystone.app Keystone's Express app reference
 * @see http://www.keystonejs.com/docs/configuration/
 */
 var SiteFactory = (function(params, vars, callback) { 

	// Global dependencies
	const AppMiddleware = require('./middleware'), 
			colors = require('colors'),			
			compression = require('compression'),
			express = require('express');

	const siteConfig = params.config, 
			moduleRoot = params.root,
			appInst = params.app,
			logger = require('winston'),
			keystoneInst = require('keystone');

	// Cache reference to keystone from bootstrapper globally
	global.keystone = keystoneInst;

	logger.info('Initializing ' + colors.cyan.underline(siteConfig.name).underline);

	// Init the keystone instance when it is opened
	keystoneInst.init({

		'brand': siteConfig.name,
		'module root': moduleRoot,
		'model prefix': (siteConfig.db_prefix !== undefined) ? siteConfig.db_prefix : null,
		'mongo': 'mongodb://localhost/' + siteConfig.database,

		'frame guard': false,
		'auto update': true,
		'session': true,
		'auth':  function(req, res, next) {
			let email = req.session.passport.user.emails[0].value;	
			global.keystone.list('User').model.find({ email: email })
			.exec((err, result) => {
						
				if(result.length < 1) {
					res.redirect('/');
					return;
				}					
				req.user = {get: () => { return result[0]; }};
				next();

			});
		},
		'user model': 'User',
		'locals': {
			
			_: require('lodash'),
			env: process.env.NODE_ENV,
			utils: keystoneInst.utils,
			editable: keystoneInst.content.editable

		},

		// prefix all built-in tags with name of app's db
		'cloudinary prefix': siteConfig.database,

		// prefix each image public_id with [{prefix}]/{list.path}/{field.path}/
		'cloudinary folders': true,
		'cloudinary secure': true

	});

	appInst.use(express.static(__dirname  + '/../public'));
	appInst.use(express.static(moduleRoot + '/public'));

	appInst.set('views', moduleRoot + 'templates/views/');

	// Load this site's models
	keystoneInst.import('models');

	// Set any other site-specified keystone vars
	if(vars) {
		for(var key in vars)
			keystoneInst.set(key, vars[key])
	}

	// keystoneInst.initDatabaseConfig();
	keystoneInst.initExpressSession();

	appInst.use(compression());	
	appInst.use('/cms', keystoneInst.Admin.Server.createStaticRouter(keystoneInst));

	appInst.use(keystoneInst.get('session options').cookieParser);

	appInst.use(keystoneInst.expressSession);
	appInst.use(keystoneInst.session.persist);
	appInst.use(require('connect-flash')());

	appInst.use('/cms', keystoneInst.Admin.Server.createDynamicRouter(keystoneInst));

	// Used only for production, otherwise sessions are stored in-memory
	if (process.env.NODE_ENV === 'production') {

		keystoneInst.set('session store', 'connect-mongo');
		keystoneInst.set('session store options', {
			"db": {
				"name": siteConfig.database,
				"servers": [
					{ "host": "127.0.0.1", "port": 27017 }
				]
			}
		});

	}

	keystoneInst.import('models');
	keystoneInst.set('wysiwyg additional buttons', 'blockquote');
	
	// Load this site's routes
	keystoneInst.set('routes', require(moduleRoot + 'routes'));
	appInst.use(require(moduleRoot + 'routes'));

	// Configure Admin UI
	keystoneInst.set('nav', siteConfig.admin_nav);
 	keystoneInst.set('admin path', 'cms');
	if(siteConfig.admin_nav !== undefined)
		keystoneInst.set('nav', siteConfig.admin_nav);

	var middleware = new AppMiddleware();
	
	if(siteConfig.allowed_domains !== undefined)
		keystoneInst.pre('routes', middleware.urlWhitelist(siteConfig.allowed_domains));
	else
		keystoneInst.set('cors allow origin', true);

	// CMS auth middleware
	appInst.get('/keystone', middleware.authentication.login, (req, res) => {
		res.redirect('/');
	});
	appInst.get('/callback', middleware.authentication.callback);

	// keystoneInst.start
	keystoneInst.openDatabaseConnection(() => {
		if(callback) callback();
	});
		
});

module.exports = SiteFactory;