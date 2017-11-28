const express       = require("express");
const bodyParser    = require("body-parser");
const rateLimit     = require('express-rate-limit');

const app           = express();

const limiter       = new rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW * 1000 || 15*60*1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to x requests per windowMs
    delayMs: 0 // disable delaying - full speed until the max limit is reached
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(limiter);

const checkip = (req, res, next) => {
    // check incoming IP addr is white-listed

    next();
};

const validate = (req, res, next) => {
    // validate 'X-Signature' header is given
    // drop response if invalid?

    next();
};

const reply = (req, res) => {
    console.log('-----------------------------------');
    console.log(req.body);
    console.log('-----------------------------------');

    res.sendStatus(200)
};

app.post("/leads",      checkip, validate, reply);
app.post("/missed",     checkip, validate, reply);
app.post("/recurring",  checkip, validate, reply);
app.post("/session",    checkip, validate, reply);

const server = app.listen(process.env.PORT || 3000, function () {
    console.log("Listening on port %s...", server.address().port);
});