/**
 * Developed by Engagement Lab, 2018
 * ==============
 * App boot logic
 *
 * @author Johnny Richardson
 *
 * ==========
 */

const SiteFactory = require('./factory');

module.exports = {

  start: (configPath, expressApp, rootPath, keystoneOptions, callback) => {

    require('fs').readFile(configPath, {encoding: 'utf8'}, (err, data) => {

      if (err) throw err;
      var configData = JSON.parse(data);

      new SiteFactory(
        {
          config: configData,
          root: rootPath,
          app: expressApp
        },
        keystoneOptions,
        () => {
          console.log('2')
          callback();
        }
      );

    });

  }

};