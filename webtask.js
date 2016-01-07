"use strict";

var request = require('request');

/**
 * Sends a thank you as comment to the pull request that is made to this repo.
 * Hooked up via webtask.io and github webhooks.
 *
 * @param {object} context
 * @param {callback} done
 * @returns {*}
 */
return function (context, done) {
    // Easify github webhook payload
    var payload = context.webhook;
    if (payload.action != "opened") {
        return done("The pull request was not opened.");
    }

    var username = payload.pull_request.user.login;

    // Get random chuck norris joke with custom name
    var requestUrl = 'http://api.icndb.com/jokes/random?firstName=&lastName=' + username;
    request(requestUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            // Prepare comment data
            var joke = JSON.parse(body);
            var jokeMessage = "Thank you for your pull request, " + username + "!\n\n" +
                "Please take the below joke as a sign of appreciation:\n" +
                // Double spaces may occur because we leave the firstName blank
                joke.value.joke.replace('  ', ' ');

            var requestData = {
                url: payload.pull_request.comments_url,
                method: 'POST',
                headers: {
                    'User-Agent': 'ArSn/chuckNorrisThanker',
                    'Authorization': 'token ' + context.data.token
                },
                json: {
                    'body': jokeMessage
                }
            };

            // Actually create the comment
            request(requestData, function (error, response, body) {
                if (!error && response.statusCode == 201) {
                    return done(null, {"success": "Successfully created thank you comment at: " + body.html_url});
                } else {
                    return done("Posting the thank you failed.");
                }
            });

        } else {
            return done("Getting a random joke failed.");
        }
    });
};
