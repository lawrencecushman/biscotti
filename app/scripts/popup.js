(function () {
'use strict';
/* global chrome:true*/

var errorClassName = 'error',
    delimeter = '\t',
    messageElement = document.getElementById('message'),
    versionElement = document.getElementById('version'),
    useTitles = false,
    titles = {
        name: 'Name',
        domain: 'Domain',
        duration: 'Expiration Date'
    };

function getAllCookies(done) {
    chrome.cookies.getAll({}, function (cookies) {
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
            domain: cookie.domain,
            duration: cookie.expirationDate ? timeUntil(new Date(cookie.expirationDate*1000)) : null
        };
    }).sort(function(a, b) {
        var domainA=a.domain.toLowerCase(), 
            domainB = b.domain.toLowerCase();

        if (domainA < domainB) {
            return -1;
        }
        if (domainA > domainB) {
            return 1;
        }
        return 0;
    });
}

function timeUntil(then) {
    var  now = new Date();
    var diff = then - now;

    var oneMinute = 1000 * 60;
    var   oneHour =   60 * oneMinute;
    var    oneDay =   24 * oneHour;
    var   oneYear =  364 * oneDay;

    var   years =  diff / oneYear;
    var    days = (diff % oneYear) / oneDay;
    var   hours = (diff % oneDay)  / oneHour;
    var minutes = (diff % oneHour) / oneMinute 

    if (years >= 1){
        return getDurationMessage(years, 'year');
    } else if (days >= 1 ){
        return getDurationMessage(days, 'day');
    } else if (hours >= 1){
        return getDurationMessage(hours, 'hour');
    } else {
        return getDurationMessage(minutes, 'minute');
    }
}

function getDurationMessage(value, period){
    var fixedValue = Math.round(value);
    return fixedValue + ' ' + period + (fixedValue > 1 ? 's' : '');
}

function getCsv(arr) {
    if (useTitles){
        arr.unshift(titles);
    }
    
    var titleKeys = Object.getOwnPropertyNames(titles);
    return arr.map(function(obj) {
        return titleKeys.map(function(key) {
            return obj[key];
        }).join(delimeter);
    })
    .join('\n');
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
        if (!cookies || !cookies.length) {
            displayMessage('No cookies found.', true);
            return;
        }

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