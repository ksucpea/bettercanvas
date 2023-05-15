let switches = ['assignments_due', 'gpa_calc', 'dark_mode', 'gradient_cards', 'coloroverlay_cards', 'dashboard_grades', 'dashboard_notes', 'improved_todo', 'condensed_cards', 'auto_dark'];

sendFromPopup("getCards");

chrome.storage.local.get(['auto_dark', 'auto_dark_start', 'auto_dark_end', 'num_assignments', 'custom_domain', 'assignment_date_format', 'todo_hr24', 'grade_hover', 'hide_completed'], function (result) {
    document.querySelector('#grade_hover').checked = result.grade_hover;
    document.querySelector('#hide_completed').checked = result.hide_completed;
    document.querySelector('#autodark_start').value = result.auto_dark_start["hour"] + ":" + result.auto_dark_start["minute"];
    document.querySelector('#autodark_end').value = result.auto_dark_end["hour"] + ":" + result.auto_dark_end["minute"];
    document.querySelector('#numAssignmentsSlider').value = result.num_assignments;
    document.querySelector("#numAssignments").textContent = result.num_assignments;
    document.querySelector("#customDomain").value = result.custom_domain ? result.custom_domain : "";
    document.querySelector("#assignment_date_format").checked = result.assignment_date_format == true;
    document.querySelector("#todo_hr24").checked = result.todo_hr24 == true;
    toggleDarkModeDisable(result.auto_dark);
});

document.querySelector('#grade_hover').addEventListener('change', function () {
    let status = this.checked;
    chrome.storage.local.set({ grade_hover: status });
});

document.querySelector('#hide_completed').addEventListener('change', function () {
    let status = this.checked;
    chrome.storage.local.set({ hide_completed: status });
});

document.querySelector('#numAssignmentsSlider').addEventListener('input', function () {
    document.querySelector('#numAssignments').textContent = this.value;
    chrome.storage.local.set({ num_assignments: this.value });
});

['assignment_date_format', 'todo_hr24'].forEach(checkbox => {
    document.querySelector("#" + checkbox).addEventListener('change', function () {
        let status = this.checked;
        chrome.storage.local.set(JSON.parse(`{"${checkbox}": ${status}}`));
    });
});

document.querySelector('#customDomain').addEventListener('input', function () {
    let domains = this.value.split(",");
    domains.forEach((domain, index) => {
        let val = domain.replace(" ", "");
        if (val.charAt(val.length - 1) === "/") {
            val = val.slice(0, -1);
        }
        domains[index] = val;
    });
    chrome.storage.local.set({ custom_domain: domains });
});

document.querySelector("#advanced-settings").addEventListener("click", function () {
    displayAdvancedCards();
    document.querySelector(".main").style.display = "none";
    document.querySelector(".advanced").style.display = "block";
});

document.querySelector("#advanced-back").addEventListener("click", function () {
    document.querySelector(".main").style.display = "block";
    document.querySelector(".advanced").style.display = "none";
});

function updateCards(key, value) {
    chrome.storage.local.get(["custom_cards"], result => {
        console.log({ [key]: { ...result["custom_cards"][key], ...value } });
        chrome.storage.local.set({ "custom_cards": { ...result["custom_cards"], [key]: { ...result["custom_cards"][key], ...value } } });
    });
}

function displayAdvancedCards() {
    chrome.storage.local.get(["custom_cards"], storage => {
        document.querySelector(".advanced-cards").textContent = "";
        if (storage["custom_cards"] && Object.keys(storage["custom_cards"]).length > 0) {
            Object.keys(storage["custom_cards"]).forEach(key => {
                let card = storage["custom_cards"][key];
                let container = makeElement("div", "custom-card", document.querySelector(".advanced-cards"));
                container.classList.add("option-container");
                container.innerHTML = '<p class="custom-card-title"></p><div class="custom-card-image"><span class="custom-key">Image</span></div><div class="custom-card-name"><span class="custom-key">Name</span></div><div class="custom-card-hide"><p class="custom-key">Hide</p></div>';
                let imgInput = makeElement("input", "card-input", container.querySelector(".custom-card-image"));
                imgInput.placeholder = "Image url";
                let nameInput = makeElement("input", "card-input", container.querySelector(".custom-card-name"));
                nameInput.placeholder = "Custom name";
                let hideInput = makeElement("input", "card-input-checkbox", container.querySelector(".custom-card-hide"));
                hideInput.type = "checkbox";
                imgInput.value = card.img;
                nameInput.value = card.name;
                hideInput.checked = card.hidden;
                imgInput.addEventListener("change", function (e) { updateCards(key, { "img": e.target.value }) });
                nameInput.addEventListener("change", function (e) { updateCards(key, { "name": e.target.value }) });
                hideInput.addEventListener("change", function (e) { updateCards(key, { "hidden": e.target.checked }) });
                container.querySelector(".custom-card-title").textContent = card.default;
            });
        } else {
            document.querySelector(".advanced-cards").innerHTML = "<h3>No cards found... make sure to open this menu on your Canvas page first. Please ontact me if this issue persists! (ksucpea@gmail.com)</h3>";
        }
    });
}

chrome.runtime.onMessage.addListener(message => {
    if (message === "getCardsComplete") {
        displayAdvancedCards();
    }
});

switches.forEach(function (option) {
    chrome.storage.local.get(option, function (result) {
        let status = result[option] === true ? "#on" : "#off";
        document.querySelector('#' + option + ' > ' + status).setAttribute('checked', true);
        document.querySelector('#' + option + ' > ' + status).classList.add('checked');
    });
    document.querySelector('#' + option + ' > .slider').addEventListener('mouseup', function () {
        document.querySelectorAll('#' + option + ' > input').forEach(function (box) {
            box.toggleAttribute('checked');
            box.classList.toggle('checked');
        });
        let status = document.querySelector('#' + option + ' > #on').checked;
        switch (option) {
            case 'gpa_calc': chrome.storage.local.set({ gpa_calc: status }); break;
            case 'assignments_due': chrome.storage.local.set({ assignments_due: status }); break;
            case 'gradient_cards': chrome.storage.local.set({ gradient_cards: status }); break;
            case 'coloroverlay_cards': chrome.storage.local.set({ coloroverlay_cards: status }); break;
            case 'dark_mode': chrome.storage.local.set({ dark_mode: status }); sendFromPopup("darkmode"); break;
            case 'auto_dark': chrome.storage.local.set({ auto_dark: status }); toggleDarkModeDisable(status); sendFromPopup("autodarkmode"); break;
            case 'dashboard_grades': chrome.storage.local.set({ dashboard_grades: status }); break;
            case 'dashboard_notes': chrome.storage.local.set({ dashboard_notes: status }); break;
            case 'improved_todo': chrome.storage.local.set({ improved_todo: status }); break;
            case 'condensed_cards': chrome.storage.local.set({ condensed_cards: status }); break;
        }
    });
});

['autodark_start', 'autodark_end'].forEach(function (timeset) {
    document.querySelector('#' + timeset).addEventListener('change', function () {
        let timeinput = { "hour": this.value.split(':')[0], "minute": this.value.split(':')[1] };
        timeset === "autodark_start" ? chrome.storage.local.set({ auto_dark_start: timeinput }) : chrome.storage.local.set({ auto_dark_end: timeinput });
        sendFromPopup("autodarkmode");
    });
});

function toggleDarkModeDisable(disabled) {
    let darkSwitch = document.querySelector('#dark_mode');
    if (disabled === true) {
        darkSwitch.classList.add('switch_disabled');
        darkSwitch.style.pointerEvents = "none";
    } else {
        darkSwitch.classList.remove('switch_disabled');
        darkSwitch.style.pointerEvents = "auto";
    }
}

// customization tab

document.querySelector("#setToDefaults").addEventListener("click", setToDefaults);

document.querySelectorAll(".preset-button.customization-button").forEach(btn => btn.addEventListener("click", changeToPresetCSS));

chrome.storage.local.get(['dark_css'], result => getColors(result.dark_css));




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
                option = makeElement("div", "changer", backgroundcolors);
            } else if (type.includes("text")) {
                option = makeElement("div", "changer", textcolors);
            }
            option.style.background = currentColor;
            option.dataset.name = type;
            let colorChange = makeElement("input", "color-changer", option);
            colorChange.value = currentColor.replace("#", "");
            colorChange.addEventListener("change", function (e) {
                changeAdjacentCSSColor(option.dataset.name, e.target.value);
                option.style.background = "#" + e.target.value;
                if (document.querySelector("." + type)) changePreview(type, "#" + e.target.value);
            });
        }
    })
}

function changeAdjacentCSSColor(name, color) {
    chrome.storage.local.get(['dark_css'], function (result) {
        const leftText = result.dark_css.split(name + ":#")[0];
        const [changing, ...rest] = result.dark_css.split(name + ":#")[1].split(";");
        const done = leftText.concat(name, ":#", color, ";", rest.join(";"));
        changeColors(done);
    });
}

function changeToPresetCSS(e) {
    chrome.storage.local.get(['dark_css'], function (result) {
        const right = result.dark_css.split("--bcstop:#000}")[1];
        let css;
        switch (e.target.id) {
            case ('lighter'):
                css = ":root{--bcbackgrounddark0:#272727;--bcbackgrounddark1:#353535;--bcbackgrounddark2:#404040;--bcbackgrounddark3:#454545;--bctextlight0:#f5f5f5;--bctextlight1:#e2e2e2;--bctextlight2:#ababab;--bctextlink:#5ca5f6;--bcstop:#000}";
                break;
            case ('light'):
                css = ":root{--bcbackgrounddark0:#202020;--bcbackgrounddark1:#2e2e2e;--bcbackgrounddark2:#4e4e4e;--bcbackgrounddark3:#404040;--bctextlight0:#f5f5f5;--bctextlight1:#e2e2e2;--bctextlight2:#ababab;--bctextlink:#5ca5f6;--bcstop:#000}";
                break;
            case ('dark'):
                css = ":root{--bcbackgrounddark0:#101010;--bcbackgrounddark1:#121212;--bcbackgrounddark2:#1a1a1a;--bcbackgrounddark3:#272727;--bctextlight0:#f5f5f5;--bctextlight1:#e2e2e2;--bctextlight2:#ababab;--bctextlink:#5ca5f6;--bcstop:#000}";
                break;
            case ('darker'):
                css = ":root{--bcbackgrounddark0:#000;--bcbackgrounddark1:#000;--bcbackgrounddark2:#000;--bcbackgrounddark3:#000;--bctextlight0:#c5c5c5;--bctextlight1:#c5c5c5;--bctextlight2:#c5c5c5;--bctextlink:#c5c5c5;--bcstop:#000}";
                break;
            case ('blue'):
                css = ":root{--bcbackgrounddark0:#14181d;--bcbackgrounddark1:#1a2026;--bcbackgrounddark2:#212930;--bcbackgrounddark3:#2e3943;--bctextlight0:#f5f5f5;--bctextlight1:#e2e2e2;--bctextlight2:#ababab;--bctextlink:#5ca5f6;--bcstop:#000}";
                break;
            case ('burn'):
                css = ":root{--bcbackgrounddark0:#fff;--bcbackgrounddark1:#fff;--bcbackgrounddark2:#fff;--bcbackgrounddark3:#ccc;--bctextlight0:#ccc;--bctextlight1:#ccc;--bctextlight2:#ccc;--bctextlink:#ccc;--bcstop:#000}";
                break;
            case ('unicorn'):
                css = ":root{--bcbackgrounddark0:#ff6090;--bcbackgrounddark1:#00C1FF;--bcbackgrounddark2:#FFFF00;--bcbackgrounddark3:#FFFF00;--bctextlight0:#fff;--bctextlight1:#fff;--bctextlight2:#fff;--bctextlink:#000;--bcstop:#000}";
                break;
        }
        let new_css = css + right;
        changeColors(new_css);
    });
}

function setToDefaults() {
    fetch(chrome.runtime.getURL('js/darkcss.json'))
        .then((resp) => resp.json())
        .then(function (result) {
            changeColors(result.dark_css);
        });
}

function changeColors(dark_css) {
    chrome.storage.local.set({ dark_css: dark_css });
    ['.option-background', '.option-color'].forEach(function (selector) {
        document.querySelector(selector).textContent = "";
    });
    getColors(dark_css);
    sendFromPopup("darkmode");
}

function makeElement(element, elclass, location, text) {
    let creation = document.createElement(element);
    creation.classList.add(elclass);
    creation.textContent = text;
    location.appendChild(creation);
    return creation
}

function sendFromPopup(message) {
    try {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            let activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { "message": message });
        });
    } catch (e) {
    }
}