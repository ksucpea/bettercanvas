document.addEventListener("DOMContentLoaded", function () {
    chrome.storage.local.get(['dark_css'], function (result) {
        getColors(result.dark_css);
    });
    document.querySelector("#setToDefaults").addEventListener("click", setToDefaults);
    document.querySelector("#lighter").addEventListener("click", changeToPresetCSS);
    document.querySelector("#darker").addEventListener("click", changeToPresetCSS);
    document.querySelector("#burn").addEventListener("click", changeToPresetCSS);
    document.querySelector("#blue").addEventListener("click", changeToPresetCSS);
    document.querySelector("#extreme").addEventListener("click", changeToPresetCSS);
});

function getColors(data) {
    const colors = data.split(":root")[1].split("--bcstop")[0];
    const backgroundcolors = document.querySelector("#option-background");
    const textcolors = document.querySelector("#option-text");
    colors.split(";").forEach(function (color) {
        const type = color.split(":")[0].replace("{", "").replace("}", "");
        const currentColor = color.split(":")[1];
        let option;
        if (type) {
            if (document.querySelector("." + type)) changePreview(type, currentColor);
            if (type.includes("background")) {
                option = makeElement("div", "option", backgroundcolors);
            } else if (type.includes("text")) {
                option = makeElement("div", "option", textcolors);
            }
            option.style.background = currentColor;
            option.dataset.name = type;
            let colorChange = makeElement("input", "option-input", option);
            colorChange.value = currentColor.replace("#", "");
            colorChange.addEventListener("input", function (e) {
                changeAdjacentCSSColor(option.dataset.name, e.target.value);
                option.style.background = "#" + e.target.value;
                if (document.querySelector("." + type)) changePreview(type, "#" + e.target.value);
            });
        }
    })
}

function changePreview(type, color) {
    console.log(document.querySelector("." + type));
    if (type.includes('background')) {
        document.querySelectorAll("." + type).forEach((el) => {
            el.style.background = color;
        });
    } else if (type.includes('text')) {
        document.querySelectorAll("." + type).forEach((el) => {
            el.style.color = color;
        });
    }
}

function changeAdjacentCSSColor(name, color) {
    chrome.storage.local.get(['dark_css'], function (result) {
        const leftText = result.dark_css.split(name + ":#")[0];
        const [changing, ...rest] = result.dark_css.split(name + ":#")[1].split(";");
        const done = leftText.concat(name, ":#", color, ";", rest.join(";"));
        chrome.storage.local.set({ dark_css: done });
    });
}

function changeToPresetCSS(e) {
    chrome.storage.local.get(['dark_css'], function (result) {
        const right = result.dark_css.split("--bcstop:#000}")[1];
        let css;
        switch (e.target.id) {
            case ('lighter'):
                css = ":root{--bcbackgrounddark0:#272727;--bcbackgrounddark1:#353535;--bcbackgrounddark2:#404040;--bcbackgrounddark3:#454545;--bcbackgrounddark4:#4b4b4b;--bctextlight0:#f5f5f5;--bctextlight1:#e2e2e2;--bctextlight2:#ababab;--bctextlink:#5ca5f6;--bctextgreen:#74c69d;--bcstop:#000}";
                break;
            case ('darker'):
                css = ":root{--bcbackgrounddark0:#040404;--bcbackgrounddark1:#121212;--bcbackgrounddark2:#1a1a1a;--bcbackgrounddark3:#272727;--bcbackgrounddark4:#353535;--bctextlight0:#f5f5f5;--bctextlight1:#e2e2e2;--bctextlight2:#ababab;--bctextlink:#5ca5f6;--bctextgreen:#74c69d;--bcstop:#000}";
                break;
            case ('burn'):
                css = ":root{--bcbackgrounddark0:#fff;--bcbackgrounddark1:#fff;--bcbackgrounddark2:#fff;--bcbackgrounddark3:#000;--bcbackgrounddark4:#000;--bctextlight0:#000;--bctextlight1:#000;--bctextlight2:#000;--bctextlink:#000;--bctextgreen:#74c69d;--bcstop:#000}";
                break;
            case ('blue'):
                css = ":root{--bcbackgrounddark0:#14181d;--bcbackgrounddark1:#1a2026;--bcbackgrounddark2:#212930;--bcbackgrounddark3:#2e3943;--bcbackgrounddark4:#34414c;--bctextlight0:#f5f5f5;--bctextlight1:#e2e2e2;--bctextlight2:#ababab;--bctextlink:#5ca5f6;--bctextgreen:#74c69d;--bcstop:#000}";
                break;
            case ('extreme'):
                css = ":root{--bcbackgrounddark0:#000;--bcbackgrounddark1:#000;--bcbackgrounddark2:#000;--bcbackgrounddark3:#000;--bcbackgrounddark4:#000;--bctextlight0:#c5c5c5;--bctextlight1:#c5c5c5;--bctextlight2:#c5c5c5;--bctextlink:#c5c5c5;--bctextgreen:#74c69d;--bcstop:#000}";
                break;
        }
        const new_css = css + right;
        chrome.storage.local.set({ dark_css: new_css });
        ['.option-background', '.option-color'].forEach(function (selector) {
            document.querySelector(selector).textContent = "";
        });
        getColors(new_css);
    });
}

function setToDefaults() {
    fetch(chrome.extension.getURL('js/darkcss.json'))
        .then((resp) => resp.json())
        .then(function (result) {
            chrome.storage.local.set({ dark_css: result.dark_css });
            ['.option-background', '.option-color'].forEach(function (selector) {
                document.querySelector(selector).textContent = "";
            });
            getColors(result.dark_css);
        });
}

function makeElement(element, elclass, location, text) {
    let creation = document.createElement(element);
    creation.classList.add(elclass);
    creation.textContent = text;
    location.appendChild(creation);
    return creation
}