/**
 * Developed by Engagement Lab, 2018
 * ==============
 * App boot logic
 *
 * @author Johnny Richardson
 *
 * ==========
 */

const SiteFactory = require('./factory'),
  bodyParser = require('body-parser'),
  passport = require('passport'),
  Auth0Strategy = require('passport-auth0');

module.exports = {

  start: (configPath, expressApp, rootPath, keystoneOptions, callback) => {

    require('fs').readFile(configPath, {
      encoding: 'utf8'
    }, (err, data) => {

      if (err) throw err;
      var configData = JSON.parse(data);

      // expressApp.get('*', function(req, res, next) {
      //   console.log(res.headers)
      //   next();
      //   });

        // expressApp.get('/cms/js/fields.js', function(req, res, next) {
        // console.log('fields')
        // next();
        // });

      // support json encoded bodies
      expressApp.use(bodyParser.json());
      expressApp.use(bodyParser.urlencoded({
        extended: true
      }));

      // Enable view template compilation caching
      expressApp.enable('view cache');

      expressApp.use(passport.initialize());
      expressApp.use(passport.session());

      // Configure Passport to use Auth0
      var strategy = new Auth0Strategy({
          domain: process.env.AUTH0_DOMAIN,
          clientID: process.env.AUTH0_CLIENT_ID,
          clientSecret: process.env.AUTH0_CLIENT_SECRET,
          callbackURL: process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback'
        },
        function (accessToken, refreshToken, extraParams, profile, done) {
          return done(null, profile);
        });

      passport.use(strategy);

      // You can use this section to keep a smaller payload
      passport.serializeUser(function (user, done) {
        done(null, user);
      });

      passport.deserializeUser(function (user, done) {
        done(null, user);
      });

      new SiteFactory({
          config: configData,
          root: rootPath,
          app: expressApp
        },
        keystoneOptions,
        () => {
          callback();
        }
      );

    });

  }

};