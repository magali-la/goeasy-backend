// utility to remove sensitive user data before its sent to the client
function sanitizeUser(userDoc) {
    // convert the mongoose document retrieved from the db into a plain js object
    const userObj = userDoc.toObject();

    // delete these fields - if the field doesnt exist for local or google users, it will be ignored
    delete userObj.password;
    delete userObj.googleId;

    // return user without sensitive data for responses to client
    return userObj;
}

module.exports = { sanitizeUser }