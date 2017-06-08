# mailchimp-newsletter-signup

[MailChimp](https://mailchimp.com/) is a well-known email marketing SaaS product. With its generous free tier option, it's seen as the perfect solution for many startups and small businesses who want to set up and build up their mailing lists.

But what many fail to notice is how rich it's REST API is.

That's why in this tutorial, I'd like to walk you through a few use  
cases for how you may want to integrate MailChimp into your own Node.JS application, focusing on:

1.  Adding new users to your own mailing list in MailChimp.
2.  Allowing users to import an existing list of contacts from their MailChimp account into your application and sync them back.

We'll be using the following Node.js libraries:

*   [Express](https://expressjs.com/) for our backend
*   [Superagent](https://visionmedia.github.io/superagent/) to make REST requests to MailChimp
*   A few other small libraries for performing OAuth

## [](#1-adding-new-users-to-mailchimp)1\. Adding new users to MailChimp

First let's start by setting up a very simple project on the command line:

    $ npm init // feel free to enter whatever for these
    $ npm install --save express body-parser superagent
    $ touch index.js

This will install our core dependencies and create our launch file. Open `index.js` in your text editor of choice and paste the following:

    var express = require('express');
    var bodyParser = require('body-parser');
    var app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    app.get('/', function (req, res) {
      res.send('Hello World!');
    });

    app.listen(3000, function () {
      console.log('Example app listening on port 3000!');
    });

Then on the command line type:

    $ node index.js
    Example app listening on port 3000!

If you go into your browser to `http://localhost:3000/`, you should see a simple page which says "Hello World!". With that set up, we can now start integrating a bit deeper.

### [](#adding-a-signup-form)Adding a signup form

We'll create a very simple HTML page in `views/signup.html` which takes the first name, last name, and email address:

    <!doctype html>
    <html>
        <head>
            <title>Sign Up</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/spectre.css/0.1.25/spectre.min.css" rel="stylesheet" crossorigin="anonymous">
        </head>
        <body>
            <form action="/signup" method="POST" class="centered mt-10 ml-10 mr-10">
                <div class="form-group">
                    <label class="form-label" for="firstName">First Name</label>
                    <input class="form-input" type="text" name="firstName" id="firstname"/>
                </div>
                <div class="form-group">
                    <label class="form-label" for="lastname">Last Name</label>
                    <input class="form-input" type="text" name="lastname" id="lastname"/>
                </div>
                <div class="form-group">
                    <label class="form-label" for="email">Email</label>
                    <input class="form-input" type="text" name="email" id="email"/>
                </div>
                <input type="submit" class="btn btn-primary" value="Submit"/>
            </form>
        </body>
    </html>

In our `index.js` we need to serve up static files, so please add the following line:

    app.use(express.static('views'));

We also want to handle the form submission; so for now add the following to `index.js`

    app.post('/signup', function (req, res) {
      // save user details to your database.
      res.send('Signed Up!');
    });

Now when you re-run the app and signup, you should see the following:

![Our Sign Up Page](https://process.filestackapi.com/cache=expiry:max/knQGdelCSNuqnRYbo052)

### [](#saving-our-new-user-to-mailchimp)Saving our new user to MailChimp

I'm going to assume you have a database somewhere to save this user to, so let's skip straight to saving this user to a new list in MailChimp.

We'll need the following information from MailChimp to make the calls:

*   **Your API token** - Log in to your MailChimp account and go to `Profile` in the top right. Then on the `Profile` page go to `Extras` -> `API Keys`. Scroll down and if you don't have any available then click `Create A Key`:![Generate MailChimp API Key](https://process.filestackapi.com/cache=expiry:max/tuWz2QtLR3OUBA2IifMC)
*   **Your Server Instance** - This is also embedded in your API token. It is taken from the last characters after the `-`. For example my API token is `637274b5ab272affbf7df7d3723ea2a1-us6`, therefore my server instance is `us6`.
*   **The Unique List Id** - this is for the list you want to add people to. For this, click on `Lists`, find your list, then on the right hand side click the dropdown arrow, then choose `Settings` and scroll down on this page to the bottom where you should see `Unique id for list <your list name>`:![Get List Unique ID](https://process.filestackapi.com/cache=expiry:max/A64hWWQ4WbTGSNLUUgbg)

With all of these, we're ready to make some REST calls! I personally prefer using a library called **[SuperAgent](https://visionmedia.github.io/superagent/)** to make rest calls (we installed it with our initial `npm` modules).

At the top of our `index.js` load superagent:

    var request = require('superagent');

Then we'll update our `signup` method:

    var mailchimpInstance   = 'us6',
        listUniqueId        = 'b6a82d89f0',
        mailchimpApiKey     = '637274b5ab272affbf7df7d3723ea2a1-us6';

    app.post('/signup', function (req, res) {
        request
            .post('https://' + mailchimpInstance + '.api.mailchimp.com/3.0/lists/' + listUniqueId + '/members/')
            .set('Content-Type', 'application/json;charset=utf-8')
            .set('Authorization', 'Basic ' + new Buffer('any:' + mailchimpApiKey ).toString('base64'))
            .send({
              'email_address': req.body.email,
              'status': 'subscribed',
              'merge_fields': {
                'FNAME': req.body.firstName,
                'LNAME': req.body.lastName
              }
            })
                .end(function(err, response) {
                  if (response.status < 300 || (response.status === 400 && response.body.title === "Member Exists")) {
                    res.send('Signed Up!');
                  } else {
                    res.send('Sign Up Failed :(');
                  }
              });
    });

Here we've added variables for our three important pieces of information: MailChimp instance, unique list ID, and our API key. Then in our `post` handler, we're making a `POST` request to the MailChimp list management REST API. We set the following HTTP Headers:

*   `Content-Type` - to be JSON and utf-8 characters
*   `Authorization` - we base64 encode our MailChimp API key and pass it as the Basic auth token.

Next we send the data for the new contact we want to add, including:

*   Their email address;
*   What we want their status to be on the mailing list. This can be one-off: `subscribed`, `unsubscribed`, `pending`, and `cleaned`; and
*   The values we want to set for the `merge_fields` on this list. Merge fields allow you to add extra data to a contact in a mailing list. For example you could store phone numbers, dates of births, company names, etc. In this example we'll just add the first name and last name

Finally we listen for the response by registering an `end` handler. In here we check for two states initially. If the status is less than 300 it means the user was successfully added, or if we get back a HTTP status 400 but the title in the response says `Member Exists`, then the email address is already in this list. In both cases we can report back to the user that they have successfully signed up. If we get any other status code then something went wrong. In this situation, you'd likely want to let the user try again or raise an alert to yourself and manually fix it.

![Testing Sign Up](https://process.filestackapi.com/cache=expiry:max/S42W4UmSTeKAFlVe4wxg)

And if we go check out our MailChimp list, we should see one new member:

![New Member Added To MailChimp](https://process.filestackapi.com/cache=expiry:max/5KioYOBQ6HDvKlqLcRsQ)
