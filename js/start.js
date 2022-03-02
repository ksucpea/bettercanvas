let darkcss, styleElementCreated = false;
let startHour, startMinute, endHour, endMinute, timeCheck = null;
let iframecheckinterval;
const thisDomain = window.location.origin;

domainIsCanvasPage();

function startDarkMode() {
    chrome.storage.local.get(['dark_mode', 'auto_dark', 'dark_css'], function (result) {
        darkcss = result.dark_css;
        if (result.dark_mode === true) toggleDarkMode();
        if (result.auto_dark === true) toggleAutoDarkMode();
    });
}

function domainIsCanvasPage() {
    if (thisDomain.includes("canvas") || thisDomain.includes("instructure") || thisDomain.includes("learn") || thisDomain.includes("canvaslms") || thisDomain.includes("schools")) {
        startDarkMode();
        return;
    } else {
        chrome.storage.local.get(['custom_domain'], function (result) {
            if (thisDomain.includes(result.custom_domain) && result.custom_domain != "") startDarkMode();
        });
    }
}

function toggleDarkMode() {
    chrome.storage.local.get(['dark_mode'], function (result) {
        if (result.dark_mode === true && styleElementCreated === false) {
            let style = document.createElement('style');
            style.id = 'darkcss';
            style.textContent = darkcss;
            document.documentElement.appendChild(style);
            styleElementCreated = true;
            checkForiFrame(darkcss, true);
        } else if (styleElementCreated === true) {
            let css = document.getElementById("darkcss").childNodes[0];
            css.textContent = result.dark_mode === true ? darkcss : " ";
            checkForiFrame(darkcss, result.dark_mode);
        }
    });
}

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
    chrome.storage.local.get(['auto_dark', 'dark_mode'], function (result) {
        if (result.dark_mode !== status && result.auto_dark === true) {
            chrome.storage.local.set({ dark_mode: status }, toggleDarkMode);
        }
    });
}

function toggleAutoDarkMode() {
    clearInterval(timeCheck);
    chrome.storage.local.get(['auto_dark', 'auto_dark_start', 'auto_dark_end'], function (result) {
        if (result.auto_dark === true) {
            startHour = parseInt(result.auto_dark_start["hour"]);
            startMinute = parseInt(result.auto_dark_start["minute"]);
            endHour = parseInt(result.auto_dark_end["hour"]);
            endMinute = parseInt(result.auto_dark_end["minute"]);
            autoDarkModeCheck();
            timeCheck = setInterval(autoDarkModeCheck, 60000);
        }
    });
}

function checkForiFrame(darkcss, enabled) {
    if (enabled === false) {
        clearInterval(iframecheckinterval);
        let iframes = document.querySelectorAll('iframe');
        iframes.forEach((frame) => {
            if (frame.contentDocument && frame.contentDocument.documentElement && frame.contentDocument.documentElement.querySelector('.bcdarkcss')) {
                frame.contentDocument.documentElement.querySelector('.bcdarkcss').textContent = '';
            }
        });
        return;
    } else if (enabled === true) {
        let numFrames = 0;
        iframecheckinterval = setInterval(() => {
            let iframes = document.querySelectorAll('iframe');
            if (iframes.length > numFrames) {
                console.log("new frames found");
                numFrames = iframes.length;
                iframes.forEach((frame) => {
                    if (frame.contentDocument && frame.contentDocument.documentElement) {
                        if (!frame.contentDocument.documentElement.querySelector('.bcdarkcss')) {
                            const new_style_element = document.createElement("style");
                            new_style_element.textContent = darkcss;
                            new_style_element.classList.add('bcdarkcss');
                            frame.contentDocument.documentElement.appendChild(new_style_element);
                        } else if (frame.contentDocument.documentElement.querySelector('.bcdarkcss')) {
                            frame.contentDocument.documentElement.querySelector('.bcdarkcss').textContent = darkcss;
                        }
                    }
                });
            }
        }, 1000);
    }
}

chrome.runtime.onMessage.addListener(function (request) {
    if (request.message === "darkmode") toggleDarkMode();
    if (request.message === "autodarkmode") toggleAutoDarkMode();
});