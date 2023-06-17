const syncedSwitches = ['auto_dark', 'assignments_due', 'gpa_calc', 'gradient_cards', 'disable_color_overlay', 'dashboard_grades', 'dashboard_notes', 'better_todo', 'condensed_cards'];
const syncedSubOptions = ['auto_dark', 'auto_dark_start', 'auto_dark_end', 'num_assignments', 'assignment_date_format', 'todo_hr24', 'grade_hover', 'hide_completed', 'num_todo_items', 'hover_preview'];
const localSwitches = ['dark_mode'];

sendFromPopup("getCards");

chrome.storage.sync.get(syncedSubOptions, function (result) {
    document.querySelector('#grade_hover').checked = result.grade_hover;
    document.querySelector('#hide_completed').checked = result.hide_completed;
    document.querySelector('#autodark_start').value = result.auto_dark_start["hour"] + ":" + result.auto_dark_start["minute"];
    document.querySelector('#autodark_end').value = result.auto_dark_end["hour"] + ":" + result.auto_dark_end["minute"];
    document.querySelector('#numAssignmentsSlider').value = result.num_assignments;
    document.querySelector("#numAssignments").textContent = result.num_assignments;
    document.querySelector("#numTodoItems").textContent = result.num_todo_items;
    document.querySelector("#numTodoItemsSlider").value = result.num_todo_items;
    document.querySelector("#assignment_date_format").checked = result.assignment_date_format == true;
    document.querySelector("#todo_hr24").checked = result.todo_hr24 == true;
    document.querySelector('#hover_preview').checked = result.hover_preview;
    toggleDarkModeDisable(result.auto_dark);
});

chrome.storage.local.get(["custom_domain"], storage => {
    document.querySelector("#customDomain").value = storage.custom_domain ? storage.custom_domain : "";
});

document.querySelector('#numAssignmentsSlider').addEventListener('input', function () {
    document.querySelector('#numAssignments').textContent = this.value;
    chrome.storage.sync.set({ "num_assignments": this.value });
});

document.querySelector('#numTodoItemsSlider').addEventListener('input', function () {
    document.querySelector('#numTodoItems').textContent = this.value;
    chrome.storage.sync.set({ "num_todo_items": this.value });
});

['assignment_date_format', 'todo_hr24', 'grade_hover', 'hide_completed', 'hover_preview'].forEach(checkbox => {
    document.querySelector("#" + checkbox).addEventListener('change', function () {
        let status = this.checked;
        chrome.storage.sync.set(JSON.parse(`{"${checkbox}": ${status}}`));
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

document.querySelector("#gpa-bounds-btn").addEventListener("click", function () {
    displayGPABounds();
    document.querySelector(".main").style.display = "none";
    document.querySelector(".gpa-bounds-container").style.display = "block";
});

document.querySelector("#custom-font-btn").addEventListener("click", function () {
    displayCustomFont();
    document.querySelector(".main").style.display = "none";
    document.querySelector(".custom-font-container").style.display = "block";
});

document.querySelector("#customize-dark-btn").addEventListener("click", function () {
    document.querySelector(".main").style.display = "none";
    document.querySelector(".customize-dark").style.display = "block";
});

document.querySelectorAll(".back-btn").forEach(btn => {
    btn.addEventListener("click", function () {
        document.querySelector(".main").style.display = "block";
        document.querySelector(".gpa-bounds-container").style.display = "none";
        document.querySelector(".advanced").style.display = "none";
        document.querySelector(".custom-font-container").style.display = "none";
        document.querySelector(".customize-dark").style.display = "none";
    });
});

function updateCards(key, value) {
    chrome.storage.sync.get(["custom_cards"], result => {
        console.log({ [key]: { ...result["custom_cards"][key], ...value } });
        chrome.storage.sync.set({ "custom_cards": { ...result["custom_cards"], [key]: { ...result["custom_cards"][key], ...value } } }, () => {
            console.log(chrome.runtime.lastError);
            if (chrome.runtime.lastError) {
                let err = document.createElement("p");
                err.textContent = "Error: " + chrome.runtime.lastError.message + " - contact ksucpea@gmail.com if this error persists";
                err.style.color = "red";
                err.style.fontSize = "20px";
                document.body.prepend(err);
                console.log(err);
            }
        })
    });
}

function displayCustomFont() {
    chrome.storage.sync.get(["custom_font"], storage => {
        let el = document.querySelector(".custom-font");
        el.textContent = "";
        let linkContainer = makeElement("div", "custom-font-flex", el);
        linkContainer.innerHTML = '<span>https://fonts.googleapis.com/css2?family=</span><input class="card-input" id="custom-font-link"></input><span>&display=swap</span>';
        let link = linkContainer.querySelector("#custom-font-link");
        link.value = storage.custom_font.link;

        link.addEventListener("change", function (e) {
            let linkVal = e.target.value.split(":")[0];
            let familyVal = linkVal.replace("+", " ");
            linkVal += linkVal === "" ? "" : ":wght@400;700";
            familyVal = linkVal === "" ? "" : "'" + familyVal + "'";
            chrome.storage.sync.set({ "custom_font": { "link": linkVal, "family": familyVal } });
            link.value = linkVal;
        });

        const popularFonts = ["Caveat", "Comfortaa", "Happy Monkey", "Inconsolata", "Jost", "Lobster", "Montserrat", "Open Sans", "Oswald", "Poppins", "Redacted Script", "Rubik", "Silkscreen"];
        let quickFonts = document.querySelector(".quick-fonts");
        quickFonts.textContent = "";
        popularFonts.forEach(font => {
            let btn = makeElement("button", "customization-button", quickFonts, font);
            btn.addEventListener("click", () => {
                let linkVal = font.replace(" ", "+") + ":wght@400;700";
                chrome.storage.sync.set({ "custom_font": { "link": linkVal, "family": "'" + font + "'" } });
                link.value = linkVal;
            });
        });
    });
}

function displayGPABounds() {
    chrome.storage.sync.get(["gpa_calc_bounds"], storage => {
        const order = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];
        const el = document.querySelector(".gpa-bounds");
        el.textContent = "";
        order.forEach(key => {
            let inputs = makeElement("div", "gpa-bounds-item", el);
            inputs.innerHTML += '<div><span class="gpa-bounds-grade"></span><input class="gpa-bounds-input gpa-bounds-cutoff" type="text"></input><span style="margin-left:6px;margin-right:6px;">%</span><input class="gpa-bounds-input gpa-bounds-gpa" type="text" value=></input><span style="margin-left:6px">GPA</span></div>';
            el.querySelector(".gpa-bounds-grade").textContent = key;
            el.querySelector(".gpa-bounds-cuttoff").value = storage["gpa_calc_bounds"][key].cutoff;
            el.querySelector(".gpa-bounds-gpa").value = storage["gpa_calc_bounds"][key].gpa;

            inputs.querySelector(".gpa-bounds-cutoff").addEventListener("change", function (e) {
                chrome.storage.sync.get(["gpa_calc_bounds"], existing => {
                    chrome.storage.sync.set({ "gpa_calc_bounds": { ...existing["gpa_calc_bounds"], [key]: { ...existing["gpa_calc_bounds"][key], "cutoff": parseFloat(e.target.value) } } });
                });
            });

            inputs.querySelector(".gpa-bounds-gpa").addEventListener("change", function (e) {
                chrome.storage.sync.get(["gpa_calc_bounds"], existing => {
                    chrome.storage.sync.set({ "gpa_calc_bounds": { ...existing["gpa_calc_bounds"], [key]: { ...existing["gpa_calc_bounds"][key], "gpa": parseFloat(e.target.value) } } });
                });
            });
        });
    });
}

function displayAdvancedCards() {
    chrome.storage.sync.get(["custom_cards", "custom_cards_2"], storage => {
        document.querySelector(".advanced-cards").textContent = "";
        if (storage["custom_cards"] && Object.keys(storage["custom_cards"]).length > 0) {
            Object.keys(storage["custom_cards"]).forEach(key => {
                let card = storage["custom_cards"][key];
                let card_2 = storage["custom_cards_2"][key];
                let container = makeElement("div", "custom-card", document.querySelector(".advanced-cards"));
                container.classList.add("option-container");
                container.innerHTML = '<p class="custom-card-title"></p><div class="custom-card-inputs"><div class="custom-card-left"><div class="custom-card-image"><span class="custom-key">Image</span></div><div class="custom-card-name"><span class="custom-key">Name</span></div><div class="custom-card-hide"><p class="custom-key">Hide</p></div></div><div class="custom-links-container"><p class="custom-key">Links</p><div class="custom-links"></div></div></div>';
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

                for (let i = 0; i < 4; i++) {
                    let customLink = makeElement("input", "card-input", container.querySelector(".custom-links"));
                    customLink.value = card_2.links.custom[i].default ? card_2.links.custom[i].type : card_2.links.custom[i].path;
                    customLink.addEventListener("change", function (e) {
                        chrome.storage.sync.get("custom_cards_2", storage => {
                            let newLinks = storage.custom_cards_2[key].links.custom;
                            if (e.target.value === "") {
                                newLinks[i] = { "type": storage.custom_cards_2[key].links.default[i].type, "default": true };
                            } else {
                                newLinks[i] = { "type": getLinkType(e.target.value), "path": e.target.value, "default": false };
                            }
                            console.log(newLinks);
                            chrome.storage.sync.set({ "custom_cards_2": { ...storage.custom_cards_2, [key]: { ...storage.custom_cards_2[key], "links": { ...storage.custom_cards_2[key].links, "custom": newLinks } } } })
                        });
                    });
                }
            });
        } else {
            document.querySelector(".advanced-cards").innerHTML = "<h3>No cards found... make sure to open this menu on your Canvas page first. Please ontact me if this issue persists! (ksucpea@gmail.com)</h3>";
        }
    });
}

function getLinkType(path) {
    if (path === "none") {
        return "none";
    } else if (path.includes("piazza")) {
        return "piazza";
    } else if (path.includes("gradescope")) {
        return "gradescope";
    } else if (path.includes("drive.google")) {
        return "google_drive";
    } else if (path.includes("youtube")) {
        return "youtube";
    } else if (path.includes("docs.google")) {
        return "google_docs";
    } else if (path.includes("webassign")) {
        return "webassign";
    }
    return "custom";
}

chrome.runtime.onMessage.addListener(message => {
    if (message === "getCardsComplete") {
        displayAdvancedCards();
    }
});

syncedSwitches.forEach(function (option) {
    let optionSwitch = document.querySelector('#' + option);
    chrome.storage.sync.get(option, function (result) {
        let status = result[option] === true ? "#on" : "#off";
        optionSwitch.querySelector(status).checked = true;
        optionSwitch.querySelector(status).classList.add('checked');
    });

    optionSwitch.querySelector(".slider").addEventListener('mouseup', function () {
        optionSwitch.querySelector("#on").checked = !optionSwitch.querySelector("#on").checked;
        optionSwitch.querySelector("#on").classList.toggle('checked');
        optionSwitch.querySelector("#off").classList.toggle('checked');
        let status = optionSwitch.querySelector("#on").checked;
        console.log({ [option]: status});
        chrome.storage.sync.set({ [option]: status });
        if (option === "auto_dark") {
            toggleDarkModeDisable(status);
            sendFromPopup("autodarkmode");
        }
    });
});

localSwitches.forEach(option => {
    let optionSwitch = document.querySelector('#' + option);
    chrome.storage.local.get(option, function (result) {
        let status = result[option] === true ? "#on" : "#off";
        optionSwitch.querySelector(status).checked = true;
        optionSwitch.querySelector(status).classList.add('checked');
    });
    optionSwitch.querySelector(".slider").addEventListener('mouseup', function () {
        optionSwitch.querySelector("#on").checked = !optionSwitch.querySelector("#on").checked;
        optionSwitch.querySelector("#on").classList.toggle('checked');
        optionSwitch.querySelector("#off").classList.toggle('checked');
        let status = optionSwitch.querySelector("#on").checked;

        switch (option) {
            case 'dark_mode': chrome.storage.local.set({ dark_mode: status }); sendFromPopup("darkmode"); break;
        }
    });
});

['autodark_start', 'autodark_end'].forEach(function (timeset) {
    document.querySelector('#' + timeset).addEventListener('change', function () {
        let timeinput = { "hour": this.value.split(':')[0], "minute": this.value.split(':')[1] };
        timeset === "autodark_start" ? chrome.storage.sync.set({ auto_dark_start: timeinput }) : chrome.storage.sync.set({ auto_dark_end: timeinput });
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
            let container = makeElement("div", "changer-container", type.includes("background") ? backgroundcolors : textcolors);
            if (document.querySelector("." + type)) changePreview(type, currentColor);
            if (type.includes("background")) {
                option = makeElement("div", "changer", container);
            } else if (type.includes("text")) {
                option = makeElement("div", "changer", container);
            }
            option.style.background = currentColor;
            option.dataset.name = type;
            let colorChange = makeElement("input", "card-input", container);
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