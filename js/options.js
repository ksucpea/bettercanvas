let noRepeats = [];

document.addEventListener("DOMContentLoaded", function() {
    chrome.storage.local.get(['dark_css'], function(result) {
        JSONtoCSS(result.dark_css);
    });
    document.querySelector("#setToDefaults").addEventListener("click", setToDefaults);
});

function JSONtoCSS(result) {
    let colors = result.split("{");
    colors.forEach(function(style) {
        let css = style.split("}")[0];
        if (css.includes("#") && css.includes("!important")) {
            let color = css.split('#').pop().split('!important')[0];
            if(css.includes("background") || css.includes("border")) {
                checkForRepeats("background", color);
            } else if(css.includes("color") || css.includes("fill")) {
                checkForRepeats("color", color);
            }
        }
    });
    displayOptions();
}

function checkForRepeats(type, color) {
    let found = false;
    noRepeats.forEach(function(option) {
        if (option["color"] === color) {
            found = true;
            return;
        }
    });
    if(found === false || noRepeats.length === 0) {
        noRepeats.push({ "type": type, "color": color });
    }
}

function displayOptions() {
    for (let i = 0; i < noRepeats.length; i++) {
        let option = makeElement("div", "option", document.querySelector('.option-' + noRepeats[i].type));
        option.style.background = "#" + noRepeats[i].color;
        let colorChange = makeElement("input", "option-input", option);
        colorChange.addEventListener('change', updateBackground);
        colorChange.value = colorChange.dataset.color = noRepeats[i].color;
    }
    noRepeats = [];
}

function updateCSS(oldColor, newColor) {
    chrome.storage.local.get(['dark_css'], function(result) {
        let newCSS = result["dark_css"];
        let allOccurences = new RegExp(oldColor, "gi");
        newCSS = newCSS.replace(allOccurences, newColor);
        chrome.storage.local.set({dark_css: newCSS});
    });
}

function updateBackground() {
    updateCSS(this.dataset.color, this.value);
    this.parentNode.style.background = "#" + this.value;
    this.dataset.color = this.value;
}

function setToDefaults() {
    fetch(chrome.extension.getURL('js/darkcss.json'))
    .then((resp) => resp.json())
    .then(function(result) {
        chrome.storage.local.set({dark_css: result.dark_css});
        ['.option-background', '.option-color'].forEach(function(selector) {
            document.querySelector(selector).textContent = "";
        });
        JSONtoCSS(result["dark_css"]);
    });
}

function makeElement(element, elclass, location, text) {
    let creation = document.createElement(element);
    creation.classList.add(elclass);
    creation.textContent = text;
    location.appendChild(creation);
    return creation
}