//Adapted from https://www.codementor.io/mattgoldspink/integrate-mailchimp-with-nodejs-app-du10854xp

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var request = require('superagent');
require('dotenv').config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('views'));

app.set('port', process.env.PORT || 5000);

var server = app.listen(app.get('port'), function() {
	var port = server.address().port;
	console.info('Magic happens on port ${port}');
});

app.get('/', function (req, res) {
  return res.redirect('/signup.html');
});

app.post('/signup', function (req, res) {
    request
        .post('https://' + process.env.DB_mailchimpInstance + '.api.mailchimp.com/3.0/lists/' + process.env.DB_listUniqueId + '/members/')
        .set('Content-Type', 'application/json;charset=utf-8')
        .set('Authorization', 'Basic ' + new Buffer('any:' + process.env.DB_mailchimpApiKey ).toString('base64'))
        .send({
          'email_address': req.body.email,
          'status': 'subscribed',
          'merge_fields': {
            'FNAME': req.body.firstName,
            'LNAME': req.body.lastName,
            'MESSAGE': req.body.message
          }
        })
            .end(function(err, response) {
              if (response.status < 300 || (response.status === 400 && response.body.title === "Member Exists")) {
                return res.redirect('/thankyou.html');
              } else {
                res.send('Sign Up Failed :(');
              }
          });
});
