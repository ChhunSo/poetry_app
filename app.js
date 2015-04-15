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
    req.session.userId = req.session.userId || null;

    req.login = function(User) {
        req.session.userId = User.id
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
app.get('/poems/all', function(req, res) {
    db.Poem.all().then(function(poems) {
        res.render('allPoems', {
            Poems: poems
        });
    })
})
app.get('/', function(req, res) {
    res.render('index');
});

app.get('/login', function(req, res) {
    if (req.session.userId) {
        res.redirect('/profile');
    } else {
        res.render('User/login');
    }
});

app.get('/User/post', function(req, res) {
    res.render('User/post');
})

app.get('/signup', function(req, res) {
    res.render('user/signup');
});
app.get('/profile', function(req, res) {
    db.Poem.findAll({
            where: {
                UserId: req.session.userId
            }
        })
        .then(function(poems) {
            res.render('User/profile', {
                postPoem: poems
            })
        })
})

app.get('/poems', function(req, res) {
    db.Poem.findAll({
        where: {
            UserId: req.session.userid
        }
        .then(function(poems) {
            res.render("User/list", {
                poemList: poems
            })

        })
    })
})
app.post('/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    db.User.authenticate(email, password)
        .then(function(dbUser) {
            if (dbUser) {
                req.login(dbUser);
                // This line should be res.render
                res.redirect('/profile');
            } else {
                res.redirect('/login');
            }

        })
});

// You're going to need a app.get() that goes to
// 'GET /poemts/new'

// Change this route path so your posting to
// POST '/poems
app.post('/poems', function(req, res) {
    db.Poem.create({
        title: req.body.title,
        content: req.body.content
    }).then(function(Poem) {
        res.redirect('/User/list');
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
app.get('/poemList', function(req, res) {
    // These code snippets use an open-source library.
    unirest.get("https://pafmon-walt-whitman-poems.p.mashape.com/poems/")
        .header("X-Mashape-Key", "XRH8IS07ojmshCSzA4Ffyk9l1RXKp18vSd1jsnyjRfNHzvbAAq")
        .header("Accept", "application/json")
        .end(function(result) {
            var body = JSON.parse(result.body);
            res.render('poemList', {
                List: body
            });
        });
});
app.get('/poemList/:poemSearch', function(req, res) {
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



app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


app.listen(3000, function() {
    console.log("We Rappin B");
})