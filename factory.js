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
var SiteFactory = (function (params, vars, callback) {

	// Global dependencies
	const AppMiddleware = require('./middleware'),
		colors = require('colors'),
		compression = require('compression'),
		siteConfig = params.config,
		moduleRoot = params.root,
		appInst = params.app,
		winston = require('winston'),
		keystoneInst = require('keystone');

	const logFormat = winston.format.combine(
		winston.format.colorize(),
		winston.format.timestamp(),
		winston.format.align(),
		winston.format.printf((info) => {
			const {
				timestamp,
				level,
				message,
				...args
			} = info;

			const ts = timestamp.slice(0, 19).replace('T', ' ');
			return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
		}),
	);

	const logger = winston.createLogger({
		level: 'info',
		format: logFormat,
		transports: [
			new winston.transports.Console()
		]
	});
	let adminPath = 'cms';
	// Cache reference to keystone from bootstrapper globally
	global.keystone = keystoneInst;

	// If not on dev use specified admin path, if defined
	if (process.env.NODE_ENV !== 'development') {
		if (siteConfig.adminPath)
			adminPath = siteConfig.adminPath;

		siteConfig.name += ' (' + ((process.env.NODE_ENV === 'staging') ? 'QA' : 'Production') + ')';
	}

	logger.info('Initializing ' + colors.bold.bgYellow.black.underline(siteConfig.name).underline + ' backend server...');
	logger.info(`Using database string defined from ${(process.env.MONGO_URI || process.env.MONGO_URI_CI) ? 'MONGO_URI | MONGO_URI_CI' : 'configData.database'}`);

	// Init the keystone instance when it is opened
	keystoneInst.init({

		'brand': siteConfig.name,
		'module root': moduleRoot,
		'model prefix': (siteConfig.db_prefix !== undefined) ? siteConfig.db_prefix : null,
		'mongo': params.dbPath,

		'frame guard': false,
		'auto update': true,
		'session': true,
		'auth': function (req, res, next) {
			let email;
			// Bypass login for dev
			if (process.env.NODE_ENV === 'development') {
				email = process.env.DEV_EMAIL;
			} else {
				if (!req.session.passport) {
					res.redirect('/keystone');
					return;
				}

				email = req.session.passport.user.emails[0].value;
			}

			global.keystone.list('User').model.find({
					email: email
				})
				.exec((err, result) => {

					if (result.length < 1) {
						res.redirect('/');
						return;
					}
					req.user = {
						get: () => {
							return `${result[0].name.first} ${result[0].name.last}`;
						}
					};
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

	var middleware = new AppMiddleware();
	// CMS auth middleware
	// Bypass login for dev
	if (process.env.NODE_ENV === 'development') {
		appInst.get('/keystone', (req, res) => {
			res.redirect('/callback');
		});
	}
	appInst.get('/keystone', middleware.authentication.login, (req, res) => {
		res.redirect('/');
	});
	appInst.get('/callback', middleware.authentication.callback);

	// Load this site's models
	keystoneInst.import('models');

	// Set any other site-specified keystone vars
	if (vars) {
		for (var key in vars)
			keystoneInst.set(key, vars[key])
	}

	// Session implementation (created when app mounted, via connect-mongo)
	keystoneInst.initExpressSession(params.session);
	appInst.use(keystoneInst.expressSession);

	// Admin route mount
	appInst.use(compression());
	appInst.use('/' + adminPath, keystoneInst.Admin.Server.createStaticRouter(keystoneInst));
	appInst.use('/' + adminPath, keystoneInst.Admin.Server.createDynamicRouter(keystoneInst));

	keystoneInst.import('models');
	keystoneInst.set('wysiwyg additional buttons', 'blockquote');

	// Load this site's routes
	keystoneInst.set('routes', require(moduleRoot + 'routes'));
	appInst.use(require(moduleRoot + 'routes'));

	// Configure Admin UI
	keystoneInst.set('admin path', adminPath);
	if (siteConfig.admin_nav !== undefined)
		keystoneInst.set('nav', siteConfig.admin_nav);

	if (siteConfig.allowed_domains !== undefined)
		keystoneInst.pre('routes', middleware.urlWhitelist(siteConfig.allowed_domains));
	else
		keystoneInst.set('cors allow origin', true);

	keystoneInst.openDatabaseConnection(() => {
		if (callback) callback();
		logger.info(colors.bgBlack.yellow('Backend server initialized successfully!'));
		logger.info(colors.bgWhite.black('> CMS path is at /' + adminPath));
		logger.info(colors.bgWhite.black("> Using database '" + siteConfig.database + "'"));

	});

});

module.exports = SiteFactory;