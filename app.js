process.env.REDIS_URL = 'rediss://:p0106415537bbfe9794f75f12bec9d7a7647bec4d6554a215adcdf69bebe0613b@ec2-3-221-25-176.compute-1.amazonaws.com:30750'

const express = require('express');

// Redis database setup
const redis = require('redis');
const client = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
        tls: true,
        rejectUnauthorized: false
      }
});
client.connect();

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


const oauthUrl = OAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
});

/*
// Need to handle refresh tokens
oauth2Client.on('tokens', (tokens) => {

    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      console.log(tokens.refresh_token);
    }
    console.log(tokens.access_token);
});
*/

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

    google.options({auth: OAuth2Client});

    await getEmail().then(emailaddress => {

        console.log(emailaddress);
        storeEmailAndTokens(emailaddress, tokens);
    });

    res.redirect("thankyou");
});

app.get('/thankyou', (req, res) =>{

    res.redirect("./welcome.html");
});

app.get('/checkEmail', async function (req, res) { 

    // This endpoint is for retrieving a verification code from a user's email

    const senderEmailAddress = req.query.senderEmail;
    const receiverEmailAddress = req.query.receiverEmail;
    const tokens = await getTokens(receiverEmailAddress);

    if(tokens != null){

        OAuth2Client.setCredentials(tokens);
        google.options({auth: OAuth2Client});

        await getVerificationCode(senderEmailAddress, receiverEmailAddress).then(verificationCode => {

            res.json({code : verificationCode});
        });
    }else{

        res.json({code : "", message : "user's email not found"});
    }

});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

async function getEmail(){

    const result = await gmail.users.getProfile({
        userId: 'me'
    });

    return result.data.emailAddress;
}

function storeEmailAndTokens(emailAddress, tokens){

    // Convert the tokens to a string and save to database

    const tokensString = JSON.stringify(tokens);
    console.log(tokensString);

    client.set(emailAddress, tokensString, (err, reply) => {

        if(err) throw err;
        console.log(reply);
    });
}

async function getTokens(emailAddress){

    const tokens = await client.get(emailAddress, (err, tokens) => {

        if(err) throw err;
        return tokens;
    });

    return JSON.parse(tokens);
}

function getMessageId(messageList){

    if(messageList.data.messages == null){

        return ""
    }

    return messageList.data.messages[0].id;
}

function parseMessageForCode(message){

    console.log("Verification Message: " + message);

    if(message != null){

        let buffer = Buffer.from(message.payload.body.data, "base64");
        let messageBody = buffer.toString("utf8");
        console.log(messageBody);
    }

    return messageBody;
}

async function getVerificationCode(senderEmailAddress, receiverEmailAddress){

    // Use Gmail API to retrieve email with verification code in it
    let date_ob = new Date();
    const year = date_ob.getFullYear();
    const month = date_ob.getMonth();
    const date = date_ob.getDate();
    const afterDate = year + "/" + month + "/" + date;
    const listParameters = {
        userId : receiverEmailAddress,
        maxResults : 1,
        q : `from:${senderEmailAddress} after:${afterDate}`
    };
    let verificationMessageRequestParams = {

                userId :receiverEmailAddress,
                id : "",
                format : 'full'
    }
    /*
    const listParametersDummy = {
        userId : receiverEmailAddress,
        maxResults : 10
    };
    */

    await gmail.users.messages.list(listParameters, async function (err, messageList) {

        if(err) throw err;
        const verificationMessageID = getMessageId(messageList);
        if(verificationMessageID != null){

            console.log("Verification Message ID: " + verificationMessageID);
            verificationMessageRequestParams.id = verificationMessageID
            await gmail.users.messages.get(verificationMessageRequestParams, (err, verificationMessage) => {

                if(err) throw err;
                console.log("Verification Message in callback: " + JSON.stringify(verificationMessage));
                const verificationCode = parseMessageForCode(verificationMessage);

                return verificationCode;
            });

        }else{

            return "";
        }

    });

}