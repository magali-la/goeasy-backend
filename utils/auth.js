const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const expiration = "2h";

// token creation/signing function for authentication
// destructuring - only take in the info needed to assign the token
function signToken({ username, email, _id}) {
    // use this object to get the token
    const payload = { username, email, _id };

    // sign the token with the user's info, secret and expiration
    return jwt.sign({ data: payload }, secret, { expiresIn: expiration});
}

module.exports = { signToken };