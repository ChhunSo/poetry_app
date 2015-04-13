var db = require('./models'),
    express = require('express'),
    methodOverride = require('method-override'),
    request = require('request'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
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
            res.render('user/login');
        }
    });
});

app.get('/signup', function(req, res) {
    res.render('user/signup');
});
app.get('/profile', function(req, res) {
    res.send("Holla if ya hear me")
})
app.post('/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password_digest;
    db.User.authenticate(email, password)
        .then(function(dbUser) {
            if (dbUser) {
                req.login(dbUser);
                res.redirect('/profile');
            } else {
                res.redirect('/login');
            }

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
// app.get('/search', function(req, res) {
//     var poemSearch= req.query.q;
//     if (!poemSearch){
//         res.render('search',{poems:[], })
//     }
// })
// app.delete('/logout', function(req, res) {
//     req.logout();
//     res.redirect('/login');
// });


app.listen(3000, function() {
    console.log("We Rappin B");
})