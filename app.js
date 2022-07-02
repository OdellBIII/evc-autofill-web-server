const express = require('express');
const {google} = require('googleapis');
const gmail = google.gmail('v1');

const app = express();
const port = process.env.PORT || 3000;

const OAuth2Client = new google.auth.OAuth2(
    // TODO: Have Client ID and Client secret be read from a file
    // Client ID
    '122228461155-l5dgh6ta5qkmlub17gg2bc7s71k31dt1.apps.googleusercontent.com',
    // Client Secret
    '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',
    // Redirect url
    'https://evc-web.herokuapp.com/welcome'

);

const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly"
];

google.options({auth: OAuth2Client});

const oauthUrl = OAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
});

app.get('/home', (req, res) => {

    res.send('Hello World!');
});

app.get('/', (req, res) => {

    res.redirect(oauthUrl);
});

app.get('/auth', (req, res) => {

});

app.get('/welcome', async function (req, res) {
    
    const code = req.query.code;
    console.log(code);

    const {tokens} = await OAuth2Client.getToken(code);
    OAuth2Client.setCredentials(tokens);

    await getEmail().then(emailaddress => {

        console.log(emailaddress);
    });

    res.redirect("welcome.html");
});

app.get('/thankyou', (req, res) =>{

    console.log(req.query.email);
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

async function getEmail(){

    const result = await gmail.users.getProfile({
        userId: 'me'
    });

    return result;
}