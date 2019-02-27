
# EL-Bootstrapper
## The [Engagement Lab](https://elab.emerson.edu)'s library for web server API/[KeystoneJS](https://keystonejs.com/) CMS instance initialization.
![EL-Bootstrapper logo](https://res.cloudinary.com/engagement-lab-home/image/upload/c_scale,f_auto,w_150/v1551303051/logos/logo-bootstrapper.png "EL-Bootstrapper logo")

* BYO [expressjs](https://expressjs.com/) instance!
* Uses Auth0 for login to KeystoneJS via [Google connection](https://auth0.com/docs/connections/social/google). You will need to [create an Auth0 app](https://auth0.com/docs/flows/guides/regular-web-app-login-flow/add-login-using-regular-web-app-login-flow).
* Unlike the default KeystoneJS 'User' model, ours has no password field. Just add users' gmail address, and they can login via Auth0.
* Keystone admin panel is still entered via /keystone, but you're directed to /cms by default after login.
* Replaces our deprecated [el-web-sdk](https://github.com/engagementlab/el-web-sdk).

> **Known issue**
>
> When logged into KeystoneJS admin panel, user logged in will show as:
```json
{
    _id: user's id,
    __v: 0,
    email: 'user@domain.com',
    password: hash from auth0,
    isAdmin: true, 
    name: { last: 'Last', first: 'First' } 
}
```
> This is merely a visual bug for now.

### Install
```npm i --save @engagement-lab/el-bootstrapper```

### Environment
Node 10.14.0+ supported. Should work as low as 8.11.4.

You must specify the following in your _.env_ (reminder to never commit this):
```
DEV_EMAIL=[email to use for automatic keystone login on NODE_ENV=development]
COOKIE_SECRET=[random hash for keystone cookie]

(obtain following at https://manage.auth0.com/)
AUTH0_CLIENT_ID=[your id]
AUTH0_DOMAIN=[your domain].auth0.com
AUTH0_CLIENT_SECRET=[your secret]
AUTH0_CALLBACK_URL=[usually http://localhost:3000/callback]
```

And optionally:
```
PORT=[a port to run on, defaults to 3000]
```

You will also need a *config.json* in your app root dir:
```json
{
	"name": "Name of website",
	"database": "mongo-database-name",
	"adminPath": "cms"
}
```

### Usage
In your Node app main file (e.g. _app.js_, using [dotenv](https://www.npmjs.com/package/dotenv) in this example):
```javascript
// Load .env vars
if(process.env.NODE_ENV !== 'test')
	require('dotenv').load();

const bootstrap = require('el-bootstrapper'), 
      express = require('express');

let app = express();
bootstrap.start(
    // Path to config
    './config.json', 
    // Express
    app,
    // The root of this app on disk, needed for keystonejs
    __dirname + '/', 
    // Any additional config vars you want for keystonejs instance
    // See: https://keystonejs.com/documentation/configuration/
	{
		'name': 'Name of website CMS'
	},
	() => {
        // any logic to run after app is mounted
        // you need at least:
		app.listen(process.env.PORT);
	}
);

```