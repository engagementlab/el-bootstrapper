module.exports = function(grunt, options) {

	var siteModules = [];
	var ignoreFilter = [];
	var watchFilter = [];

	ignoreFilter.push('../node_modules/.bin/');
	ignoreFilter.push('../node_modules/**/.git/');
	watchFilter.push('../node_modules/**');
	watchFilter.push('../node_modules/**/**');

	return {
	
		debug: {
			script: 'app.js',
			options: {
				nodeArgs: ['--inspect'],
				verbose: true,
				env: {
					port: 3000
				},
	      callback: function (nodemon) {
	        nodemon.on('log', function (event) {
	          console.log(event.colour);
	        });
	      },
			}
		},

		serve: {
			script: 'app.js',
		}

	}

};
