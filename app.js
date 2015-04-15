var db = require('./models'),
    express = require('express'),
    methodOverride = require('method-override'),
    request = require('request'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    unirest = require('unirest'),
    app = express();


app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: "Mission Impossible",
    resave: false,
    save: {
        uninitialize: true
    }
}));

app.use('/', function(req, res, next) {
    req.login = function(user) {
        req.session.userId = user.id
    };
    req.currentUser = function() {
        return db.User.find(req.session.userId)
            .then(function(dbUser) {
                req.user = dbUser;
                return dbUser;
            });
    };
    req.logout = function() {
        req.session.userId = null;
        req.user = null;
    };
    next();
});

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/login', function(req, res) {
    req.currentUser().then(function(user) {
        if (user) {
            res.redirect('/profile');
        } else {
            res.render('User/login');
        }
    });
});

app.get('/User/post', function(req, res) {
    res.render('User/post');
})

app.get('/signup', function(req, res) {
    res.render('user/signup');
});
app.get('/User/profile', function(req, res) {
    db.Poem.findAll({
            include: db.User
        })
        .then(function(poems) {
            res.render('User/profile', {
                postPoem: poems
            })
        })
})

app.post('/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password_digest;
    db.User.authenticate(email, password)
        .then(function(dbUser) {
            if (dbUser) {
                req.login(dbUser);
                res.redirect('User/profile');
            } else {
                res.redirect('/login');
            }

        })
});
app.post('/profile', function(req, res) {
    db.Poem.create({
        title: req.body.title,
        content: req.body.content
    }).then(function(Poem) {
        res.redirect('User/profile');
    })
})

app.post('/signup', function(req, res) {
    var email = req.body.email;
    var password = req.body.password_digest;
    db.User.createSecure(email, password)
        .then(function(user) {
            res.redirect('/login');
        });
});
app.get('/search', function(req, res) {
    // These code snippets use an open-source library.
    unirest.get("https://pafmon-walt-whitman-poems.p.mashape.com/poems/")
        .header("X-Mashape-Key", "XRH8IS07ojmshCSzA4Ffyk9l1RXKp18vSd1jsnyjRfNHzvbAAq")
        .header("Accept", "application/json")
        .end(function(result) {
            var body = JSON.parse(result.body);
            res.render('search', {
                List: body
            });
        });
});
app.get('/search/:poemSearch', function(req, res) {
    var poemSearch = req.params.poemSearch;
    var url = "https://pafmon-walt-whitman-poems.p.mashape.com/poems/" + poemSearch;
    unirest.get(url)
        .header("X-Mashape-Key", "XRH8IS07ojmshCSzA4Ffyk9l1RXKp18vSd1jsnyjRfNHzvbAAq")
        .header("Accept", "application/json")
        .end(function(result) {
            var body = JSON.parse(result.body);
            console.log(result.status, result.headers, result.body);
            res.render("poems", {
                poem: body
            });
        });
});



app.delete('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


app.listen(3000, function() {
    console.log("We Rappin B");
});