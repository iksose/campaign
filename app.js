
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var exphbs  = require('express3-handlebars') // "express3-handlebars"
var helpers = require('./lib/helpers')

var app = express();

var hbs;

// Create `ExpressHandlebars` instance with a default layout.
hbs = exphbs.create({
    defaultLayout: 'main',
    helpers      : helpers,

    // Uses multiple partials dirs, templates in "shared/templates/" are shared
    // with the client-side of the app (see below).
    partialsDir: [
        'shared/templates/',
        'views/partials/'
    ]
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
// app.set('view engine', 'jade');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Middleware to expose the app's shared templates to the cliet-side of the app
// for pages which need them.
function exposeTemplates(req, res, next) {
    // Uses the `ExpressHandlebars` instance to get the get the **precompiled**
    // templates which will be shared with the client-side of the app.
    hbs.loadTemplates('shared/templates/', {
        cache      : app.enabled('view cache'),
        precompiled: true
    }, function (err, templates) {
        if (err) { return next(err); }

        // RegExp to remove the ".handlebars" extension from the template names.
        var extRegex = new RegExp(hbs.extname + '$');

        // Creates an array of templates which are exposed via
        // `res.locals.templates`.
        templates = Object.keys(templates).map(function (name) {
            return {
                name    : name.replace(extRegex, ''),
                template: templates[name]
            };
        });

        // Exposes the templates during view rendering.
        if (templates.length) {
            res.locals.templates = templates;
        }

        next();
    });
}

app.get('/', function (req, res) {
    res.render('home', {
        title: 'Home'
    });
});

app.get('/yell', function (req, res) {
    res.render('yell', {
        title: 'Yell',

        // This `message` will be transformed by our `yell()` helper.
        message: 'hello world'
    });
});

app.get('/exclaim', function (req, res) {
    res.render('yell', {
        title  : 'Exclaim',
        message: 'hello world',

        // This overrides _only_ the default `yell()` helper.
        helpers: {
            yell: function (msg) {
                return (msg + '!!!');
            }
        }
    });
});

app.get('/echo/:message?', exposeTemplates, function (req, res) {
    res.render('echo', {
        title  : 'Echo',
        message: req.params.message,

        // Overrides which layout to use, instead of the defaul "main" layout.
        layout: 'shared-templates'
    });
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
