const express = require('express');
const {google} = require('googleapis');

const app = express();
const port = 3000;

const oauth2Cleint = new google.auth.OAuth2(
    // TODO: Have Client ID and Client secret be read from a file
    // Client ID
    '122228461155-l5dgh6ta5qkmlub17gg2bc7s71k31dt1.apps.googleusercontent.com',
    // Client Secret
    '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',
    // Redirect url
    'https://www.google.com'

);

const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly"
];

const oauthUrl = oauth2Cleint.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
});

app.get('/home', (req, res) => {

    res.send('Hello World!');
});

app.get('/', (req, res) => {

    res.redirect(oauthUrl);
});

app.get('/welcome', (req, res) => {

    res.send("Welcome to EVC!");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});