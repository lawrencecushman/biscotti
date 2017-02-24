/* jshint esversion:6 */
/* global chrome:true */

(function () {
'use strict';

let errorClassName = 'error',
    delimeter = '\t',
    messageElement = document.getElementById('message'),
    versionElement = document.getElementById('version'),
    useTitles = false,
    titles = {
        name: 'Name',
        domain: 'Domain',
        duration: 'Expiration Date'
    };

/**
 * This method displays a message in the popup window. Can also display
 * an error message by using the optional isError argument.
 * 
 * @param {string} message - the message to be displayed
 * @param {boolean} isError - indicates the message should be displayed as an 
 * error message
 */
function displayMessage(message, isError) {
    if (isError) {
        messageElement.classList.add(errorClassName);
    } else {
        messageElement.classList.remove(errorClassName);
    }

    messageElement.textContent = message;
}

/**
 * Cleans up the data, by extracting just the fields we need, and transforming the 
 * data to make it more readable.
 * 
 * @param {Cookie[]} cookies - the cookies. See https://developer.chrome.com/extensions/cookies
 * @returns the mapped, transformed and cleaned cookie data.
 */
function cleanCookies(cookies) {
    let resultCookies = cookies.map(function(cookie) {
        return {
            name: cookie.name,
            domain: cookie.domain,
            duration: cookie.expirationDate ? timeUntil(new Date(cookie.expirationDate*1000)) : null
        };
    }).sort(function(a, b) {
        let domainA = a.domain.toLowerCase(), 
            domainB = b.domain.toLowerCase();

        if (domainA < domainB) {
            return -1;
        }
        if (domainA > domainB) {
            return 1;
        }
        return 0;
    });

    // The cookies need to be deduped
    let resultSet = new Set(),
        keyFn = x => `${x.name}|${x.domain}`;

    return resultCookies.filter(function(cookie) {
        let key = keyFn(cookie), 
            isNew = !resultSet.has(key);
            if (isNew) resultSet.add(key);
        return isNew;
    });
}

/**
 * Calculates the number of years, or months, or days, or minutes until the provided 
 * date, from riiiight...now. The value is rounded to the largest whole period. 
 * 
 * Eg. Input Epoch corresponding to 380 days from now would simply output "1 year", while 
 * 270 days would output "270 days", since it isn't a whole year. A date 200 away 
 * minutes would output "3 hours".
 * 
 * @param {Date} then - the future date.
 * @returns - a string representing the duration until `then`
 */
function timeUntil(then) {
    let  now = new Date();
    let diff = then - now;

    let oneMinute = 1000 * 60;
    let   oneHour =   60 * oneMinute;
    let    oneDay =   24 * oneHour;
    let   oneYear =  364 * oneDay;

    let   years =  diff / oneYear;
    let    days = (diff % oneYear) / oneDay;
    let   hours = (diff % oneDay)  / oneHour;
    let minutes = (diff % oneHour) / oneMinute 

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

/**
 * Formats and pluralizes the value and period provided.
 * 
 * @param {number} value - the numerical duration.
 * @param {string} period - the kind of timespan. eg "day"
 * @returns
 */
function getDurationMessage(value, period){
    let fixedValue = Math.round(value);
    return fixedValue + ' ' + period + (fixedValue > 1 ? 's' : '');
}

/**
 * Returns the csv of the provided cookies. The cookies must have the form corresponding to
 * `titles`
 * 
 * @param {CleanedCookie} arr - the array of cleaned cookies
 * @returns a string of the cookies as CSV 
 */
function getCsv(arr) {
    if (useTitles){
        arr.unshift(titles);
    }
    
    let titleKeys = Object.getOwnPropertyNames(titles);
    return arr.map(function(obj) {
        return titleKeys.map(function(key) {
            return obj[key];
        }).join(delimeter);
    })
    .join('\n');
}

/**
 * Copies the provided text to the clipboard.
 * 
 * @param {string} text - the text to be copied to the clipboaord.
 */
function copyToClipboard(text) {
    let copyElement = document.createElement('textarea');
    copyElement.textContent = text;
    document.body.appendChild(copyElement, document.body.firstChild);
    copyElement.focus();
	copyElement.select();
	document.execCommand('Copy', false, null);
	document.body.removeChild(copyElement);
}

/// Main
try {
    chrome.cookies.getAll({}, function (cookies) {
        if (!cookies || !cookies.length) {
            displayMessage('No cookies found.', true);
            return;
        }

        let cleanedCookies = cleanCookies(cookies);
        let csv = getCsv(cleanedCookies);
        copyToClipboard(csv);
        let message = cleanedCookies.length + ' cookies copied to clipboard.';
        displayMessage(message);
    });
} catch (e) {
    displayMessage(e.message, true);
}


/// Display the version number of the app
versionElement.textContent = chrome.runtime.getManifest().version;
})();