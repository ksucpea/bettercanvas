let darkcss, created = false;
const thisDomain = window.location.origin;

chrome.storage.local.get(['dark_mode', 'auto_dark', 'dark_css'], function(result) {
    darkcss = result.dark_css;
    if(result.dark_mode === true) toggleDarkMode();
    if(result.auto_dark === true) toggleAutoDarkMode();
});

function toggleDarkMode() {
    chrome.storage.local.get(['dark_mode'], function(result) {
        if (result.dark_mode === true && created === false && thisDomain.match(/canvas|instructure|learn/g)) {
            let style = document.createElement('style');
            style.id = 'darkcss';
            style.textContent = darkcss;
            document.documentElement.appendChild(style);
            created = true;
        } else if (created === true) {
            let css = document.getElementById("darkcss").childNodes[0];
            css.textContent = result.dark_mode === true ? darkcss : " ";
        }
    });
}

let startHour, startMinute, endHour, endMinute, timeCheck = null;
function autoDarkModeCheck() {
    let date = new Date();
    let currentHour = date.getHours();
    let currentMinute = date.getMinutes();
    let status = false;
    if (currentHour === startHour) {
        status = currentMinute >= startMinute ? true : false;
    } else if (currentHour === endHour) {
        status = currentMinute <= endMinute ? true : false;
    } else if (startHour > endHour) {
        status = currentHour > startHour || currentHour < endHour ? true : false;
    } else if (startHour < endHour) {
        status = currentHour > startHour && currentHour < endHour ? true : false;
    }
    chrome.storage.local.get(['auto_dark', 'dark_mode'], function(result) {
        if (result.dark_mode !== status && result.auto_dark === true) {
            chrome.storage.local.set({ dark_mode: status }, toggleDarkMode);
        }
    });
}

function toggleAutoDarkMode() {
    clearInterval(timeCheck);
    chrome.storage.local.get(['auto_dark', 'auto_dark_start', 'auto_dark_end'], function(result) {
        if(result.auto_dark === true) {
            startHour = parseInt(result.auto_dark_start["hour"]);
            startMinute = parseInt(result.auto_dark_start["minute"]);
            endHour = parseInt(result.auto_dark_end["hour"]);
            endMinute = parseInt(result.auto_dark_end["minute"]);
            autoDarkModeCheck();
            timeCheck = setInterval(autoDarkModeCheck, 60000);
        }
    });
}   

chrome.runtime.onMessage.addListener(function(request) {
    if (request.message === "darkmode") toggleDarkMode();
    if (request.message === "autodarkmode") toggleAutoDarkMode();
});
