const express       = require("express");
const basicAuth     = require('express-basic-auth');
const bodyParser    = require("body-parser");
const rateLimit     = require('express-rate-limit');
const crypto        = require('crypto');

const app           = express();

const limiter       = new rateLimit({
    windowMs    : process.env.RATE_LIMIT_WINDOW * 1000 || 15*60*1000, // 15 minutes
    max         : process.env.RATE_LIMIT_MAX || 100, // limit each IP to x requests per windowMs
    delayMs     : 0 // disable delaying - full speed until the max limit is reached
});

let requestsSinceStartup = 0;

const user = process.env.USER || null;
const pass = process.env.PASS || null;

if (user && pass) {
    app.use(basicAuth({
        users: { [user]: pass },
        unauthorizedResponse: 'No valid credentials provided'
    }));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(limiter);

const checkip = (req, res, next) => {
    // check incoming IP addr is white-listed
    requestsSinceStartup++;

    console.log('requests since startup: %s', requestsSinceStartup);

    next();
};

const validate = (req, res, next) => {
    if (process.env.SECRET) {
        // get signature.
        const retrievedSignature = req.headers["x-signature"];

        // recalculate signature.
        const computedSignature = crypto.createHmac("sha256", process.env.SECRET).update(JSON.stringify(req.body)).digest("hex");

        // compare signatures.
        if (computedSignature !== retrievedSignature)
            return res.status(403).send('X-Signature validation failed.')
    }

    next();
};

const reply = (req, res) => {
    console.log(req.body);
    console.log('-----------------------------------');

    if (process.env.DELAY)
        setTimeout(() => res.sendStatus(200), process.env.DELAY);
    else
        res.sendStatus(200);
};

app.post("/leads",      checkip, validate, reply);
app.post("/missed",     checkip, validate, reply);
app.post("/recurring",  checkip, validate, reply);
app.post("/session",    checkip, validate, reply);

const server = app.listen(process.env.PORT || 3000, function () {
    console.log("Listening on port %s...", server.address().port);
});