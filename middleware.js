/*!
 * Engagement Lab Site Bootsrapper
 * Developed by Engagement Lab, 2016-18
 * ==============
 */
'use strict';

var AppMiddleware = (function () {

	/**
		Handle CMS auth via Auth0 and passport
	*/
	this.authentication = {

		// Perform the login, after login Auth0 will redirect to callback
		login: require('passport').authenticate('auth0', { scope: 'openid email profile' }),

		// Handle Auth0 callback and direct to CMS backend if success
		callback: (req, res, next) => {
			if(process.env.NODE_ENV === 'development') {
				res.redirect('/cms');
				return;
			}

			require('passport').authenticate('auth0', function (err, user, info) {

				if (err) {
					return next(err);
				}
				if (!user) {
					return res.redirect('/');
				}

				req.logIn(user, function (err) {
					if (err) {
						return next(err);
					}
					const returnTo = req.session.returnTo;
					delete req.session.returnTo;

					res.redirect(returnTo || '/cms');
				});
			

			})(req, res, next);
			
		}

	};

	/**
	 * Common middleware for URL whitelisting. Prevents clickjacking.
	 * @param {Array} domains to allow as site masks, or embed-friendly domains.
	 */
	this.urlWhitelist = function (domains) {

		console.log('Using URL whitelist: '.white + domains.join(',').bgWhite.black);

		return function (req, res, next) {

			// Allow certain domains to frame site
			res.setHeader('Content-Security-Policy', 'frame-ancestors ' + domains.join(' '));
			res.setHeader('Access-Control-Allow-Origin', domains.join(' '));

			next();

		};

	};

});

module.exports = AppMiddleware;