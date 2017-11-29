const express       = require("express");
const bodyParser    = require("body-parser");
const rateLimit     = require('express-rate-limit');
const crypto        = require('crypto');

const app           = express();

const limiter       = new rateLimit({
    windowMs    : process.env.RATE_LIMIT_WINDOW * 1000 || 15*60*1000, // 15 minutes
    max         : process.env.RATE_LIMIT_MAX || 100, // limit each IP to x requests per windowMs
    delayMs     : 0 // disable delaying - full speed until the max limit is reached
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(limiter);

const checkip = (req, res, next) => {
    // check incoming IP addr is white-listed

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

    res.sendStatus(200)
};

app.post("/leads",      checkip, validate, reply);
app.post("/missed",     checkip, validate, reply);
app.post("/recurring",  checkip, validate, reply);
app.post("/session",    checkip, validate, reply);

const server = app.listen(process.env.PORT || 3000, function () {
    console.log("Listening on port %s...", server.address().port);
});