var db = require('./models'),
    express = require('express'),
    methodOverride = require('method-override'),
    request = require('request'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    unirest = require('unirest'),
    env = process.env,
    app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: env.MY_SECRET,
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
});
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
    res.render('User/signup');
});
app.get('/profile', function(req, res) {
    res.render('User/profile');
});

app.get('/poems', function(req, res) {
    req.currentUser().then(function(user) {
        db.Poem.findAll({
                where: {
                    UserId: user.id
                }
            })
            .then(function(poems) {
                res.render("User/list", {
                    poemList: poems
                })
            })
    })
});
app.post('/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    db.User.authenticate(email, password)
        .then(function(dbUser) {
            if (dbUser) {
                req.login(dbUser);
                // This line should be res.render
                res.render('User/profile');
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
    req.currentUser().then(function(user) {
        db.Poem.create({
            title: req.body.title,
            content: req.body.content,
            UserId: user.id
        }).then(function(Poem) {
            res.redirect('poems');
        });
    });
});
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
        .header("X-Mashape-Key", env.MY_API_KEY)
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
        .header("X-Mashape-Key", env.MY_API_KEY)
        .header("Accept", "application/json")
        .end(function(result) {
            var body = JSON.parse(result.body);
            console.log(result.status, result.headers, result.body);
            res.render("listPoem", {
                poem: body
            });
        });
});
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
app.get('/poems/:id/edit', function(req, res) {
    db.Poem.find(req.params.id)
        .then(function(poem) {
            res.render("User/edit", {
                poem: poem
            })
        })
});
app.put('/poems/:id', function(req, res) {
    db.Poem.find(req.params.id)
        .then(function(poem) {
            console.log(poem);
            poem.updateAttributes({
                    title: req.body.title,
                    content: req.body.content
                })
                .then(function(poem) {
                    res.redirect('/poems')
                })
        })
});
app.delete('/poems/:id', function(req, res) {
    var id = req.params.id;
    db.Poem.find(id)
        .then(function(poem) {
            poem.destroy()
                .then(function(stuff) {
                    res.redirect('/poems')
                })
        })
});
app.listen(process.env.PORT || 3000, function() {
    console.log("We Rappin B");
});