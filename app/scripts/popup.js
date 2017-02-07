'use strict';
(function () {

var errorClassName = 'error',
    delimeter = '\t',
    messageElement = document.getElementById('message'),
    versionElement = document.getElementById('version'),
    useTitles = true,
    titles = {
        name: 'Name',
        path: 'Path',
        domain: 'Domain',
        expirationDate: 'Expiration Date'
    };

function getAllCookies(done) {
    chrome.cookies.getAll({}, function (cookies) {
        if (!cookies || !cookies.length) {
            throw new Error('No cookies found.');
        }
        done(cookies);
    });
}

function displayMessage(message, isError) {
    if (isError) {
        messageElement.classList.add(errorClassName);
    } else {
        messageElement.classList.remove(errorClassName);
    }

    messageElement.textContent = message;
}

function cleanCookies(cookies) {
    return cookies.map(function(cookie) {
        return {
            name: cookie.name,
            path: cookie.path,
            domain: cookie.domain,
            expirationDate: cookie.expirationDate ? new Date(cookie.expirationDate).toUTCString() : null
        }
    });
}

function getCsv(arr) {
    if (useTitles){
        arr.unshift(titles);
    }
    
    var titleKeys = Object.getOwnPropertyNames(titles);
    return arr.map(function(obj) {
        return titleKeys.map(function(key) {
            return obj[key];
        }).join(delimeter)
    }).join('\n');
}

function copyToClipboard(text) {
    var copyElement = document.createElement('textarea');
    copyElement.textContent = text;
    document.body.appendChild(copyElement, document.body.firstChild);
    copyElement.focus();
	copyElement.select();
	document.execCommand('Copy', false, null);
	document.body.removeChild(copyElement);
}

try {
    getAllCookies(function (cookies) {
        var cleanedCookies = cleanCookies(cookies);
        var csv = getCsv(cleanedCookies);
        copyToClipboard(csv);
        var message = cookies.length + ' cookies copied to clipboard.';
        displayMessage(message);
    });
} catch (e) {
    displayMessage(e.message, true);
}


/// Display the version number of the app
versionElement.textContent = chrome.runtime.getManifest().version;
})();