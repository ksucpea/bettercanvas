const syncedSwitches = ['full_width', 'auto_dark', 'assignments_due', 'gpa_calc', 'gradient_cards', 'disable_color_overlay', 'dashboard_grades', 'dashboard_notes', 'better_todo', 'condensed_cards'];
const syncedSubOptions = ['auto_dark', 'auto_dark_start', 'auto_dark_end', 'num_assignments', 'assignment_date_format', 'todo_hr24', 'grade_hover', 'hide_completed', 'num_todo_items', 'hover_preview'];
const localSwitches = ['dark_mode'];

sendFromPopup("getCards");

// refresh the cards if new ones were just recieved
chrome.storage.onChanged.addListener((changes) => {
    if (changes["custom_cards"]) {
        console.log(Object.keys(changes["custom_cards"].oldValue).length, Object.keys(changes["custom_cards"].newValue).length);
        if (Object.keys(changes["custom_cards"].oldValue).length !== Object.keys(changes["custom_cards"].newValue).length) {
            displayAdvancedCards();
        }
    }
})

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
    window.scrollTo(0, 0);
});

document.querySelector("#gpa-bounds-btn").addEventListener("click", function () {
    displayGPABounds();
    document.querySelector(".main").style.display = "none";
    document.querySelector(".gpa-bounds-container").style.display = "block";
    window.scrollTo(0, 0);
});

document.querySelector("#custom-font-btn").addEventListener("click", function () {
    displayCustomFont();
    document.querySelector(".main").style.display = "none";
    document.querySelector(".custom-font-container").style.display = "block";
    window.scrollTo(0, 0);
});

document.querySelector("#card-colors-btn").addEventListener("click", function () {
    document.querySelector(".main").style.display = "none";
    document.querySelector(".card-colors-container").style.display = "block";
    window.scrollTo(0, 0);
});

document.querySelector("#customize-dark-btn").addEventListener("click", function () {
    document.querySelector(".main").style.display = "none";
    document.querySelector(".customize-dark").style.display = "block";
    window.scrollTo(0, 0);
});

document.querySelector("#report-issue-btn").addEventListener("click", function () {
    document.querySelector(".main").style.display = "none";
    document.querySelector(".report-issue-container").style.display = "block";
    chrome.storage.local.get("errors", storage => {
        storage["errors"].forEach(e => {
            document.querySelector("#error_log_output").value += (e + "\n\n");
        })
    });
    window.scrollTo(0, 0);
});

document.querySelector("#import-export-btn").addEventListener("click", function () {
    document.querySelector(".main").style.display = "none";
    document.querySelector(".import-export").style.display = "block";
    window.scrollTo(0, 0);
});

document.querySelectorAll(".back-btn").forEach(btn => {
    btn.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(tab => {
            tab.style.display = "none";
        });
        document.querySelector(".main").style.display = "block";
    });
});

document.querySelectorAll('[data-i18n]').forEach(text => {
    text.innerText = chrome.i18n.getMessage(text.dataset.i18n);
});

document.querySelector("#rk_btn").addEventListener("click", () => {
    let key = document.querySelector("#rk_key").value;
    chrome.storage.sync.get(key, res => {
        document.querySelector("#rk_output").value = JSON.stringify(res[key]);
    })
})

document.querySelector("#import-input").addEventListener("input", (e) => {
    const obj = JSON.parse(e.target.value);
    importTheme(obj);
});

document.querySelectorAll(".export-details input").forEach(input => {
    input.addEventListener("change", () => {
        let final = {};
        chrome.storage.sync.get(syncedSwitches.concat(syncedSubOptions).concat(["custom_cards", "custom_font", "gpa_calc_bounds"]), sync => {
            chrome.storage.local.get(["dark_preset"], async local => {
                for await (item of document.querySelectorAll(".export-details input")) {
                    if (item.checked) {
                        switch (item.id) {
                            case "export-toggles":
                                final = { ...final, ...(await getExport(sync, syncedSwitches.concat(syncedSubOptions))) };
                                break;
                            case "export-dark":
                                final = { ...final, ...(await getExport(local, ["dark_preset"])) };
                                break;
                            case "export-cards":
                                final = { ...final, ...(await getExport(sync, ["custom_cards"])) };
                                break;
                            case "export-font":
                                final = { ...final, ...(await getExport(sync, ["custom_font"])) };
                                break;
                            case "export-colors":
                                final = { ...final, ...(await getExport(null, ["card_colors"])) }
                                break;
                            case "export-gpa":
                                final = { ...final, ...(await getExport(sync, ["gpa_calc_bounds"])) }
                                break;
                        }
                    }
                }
                console.log("final = ", final);
                document.querySelector("#export-output").value = JSON.stringify(final);
            });
        });
    });
});

async function getExport(storage, options) {
    let final = {};
    for (const option of options) {
        switch (option) {
            case "custom_cards":
                let arr = [];
                Object.keys(storage["custom_cards"]).forEach(key => {
                    if (storage["custom_cards"][key].img !== "") arr.push(storage["custom_cards"][key].img);
                });
                if (arr.length === 0) {
                    arr = ["none"];
                }
                final["custom_cards"] = arr;
                break;
            case "card_colors":
                final["card_colors"] = [];
                try {
                    final["card_colors"] = await sendFromPopup("getcolors");
                } catch (e) {
                    console.log(e);
                }
                break;
            default:
                final[option] = storage[option];
        }
    }
    console.log("OK DONE!", final);
    return final;
}

document.querySelectorAll(".theme-button").forEach(btn => {
    let theme = getTheme(btn.id);
    btn.style.backgroundImage = "linear-gradient(#0000008c, #0000008c), url(" + theme.preview + ")";
    btn.addEventListener("click", () => {
        const allOptions = syncedSwitches.concat(syncedSubOptions).concat(["custom_cards", "custom_font", "gpa_calc_bounds", "card_colors"]);
        chrome.storage.sync.get(allOptions, sync => {
            chrome.storage.local.get(["dark_preset", "previous_theme"], async local => {
                const now = Date.now();
                if (local["previous_theme"] === null || now >= local["previous_theme"].expire) {
                    let previous = { ...(await getExport(sync, allOptions)), ...(await getExport(local, ["dark_preset"])) };
                    chrome.storage.local.set({ "previous_theme": { "theme": previous, "expire": now + 86400000 } });
                }
            });
        });

        importTheme(theme.exports);
    });
});

document.querySelector("#theme-revert").addEventListener("click", () => {
    chrome.storage.local.get("previous_theme", local => {
        if (local["previous_theme"] !== null) {
            importTheme(local["previous_theme"]["theme"]);
        }
    });
})

function getTheme(name) {
    const themes = {
        "theme-capybara": { "exports": { "card_colors": ["#755215"], "custom_font": { "family": "'Rubik'", "link": "Rubik:wght@400;700" }, "dark_preset": { "background-0": "#170d03", "background-1": "#251c04", "background-2": "#0c0c0c", "borders": "#1e1e1e", "links": "#dfa581", "sidebar": "linear-gradient(#9b5a32, #1e1506)", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/originals/ca/93/0c/ca930c4f2edd5012863a38182759bfb5.gif", "https://i.ytimg.com/vi/FWcoYPoD6us/maxresdefault.jpg", "https://i.redd.it/kc2xbmo8kiy71.jpg", "https://i.gifer.com/7Luh.gif", "https://media.tenor.com/fdT-j77p2D4AAAAd/capybara-eating.gif", "https://media.tenor.com/1kZ2j73pGDUAAAAC/capybara-ok-he-pull-up.gif"] }, "preview": "https://i.redd.it/kc2xbmo8kiy71.jpg" },

        "theme-minecraft": { "exports": { "dark_preset": { "background-0": "#29180a", "background-1": "#23651a", "background-2": "#20691b", "borders": "#6bc224", "links": "#88df81", "sidebar": "#478906", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/736x/5a/2b/40/5a2b4046f9bd72ff53632c7b063030b8.jpg", "https://64.media.tumblr.com/044b799cba1013a0514dc209ee310bd5/tumblr_psvamh8RlM1y7ei2ho2_500.png", "https://media.tenor.com/0SkyG9KeSGEAAAAC/minecraft-aesthetic.gif", "https://i.pinimg.com/originals/fe/2f/1c/fe2f1c4b6741a1b0e0c866df71eedd97.jpg", "https://i.pinimg.com/originals/5f/fd/b1/5ffdb1c3e2ce80ce1d129e9ff06714f1.png", "https://www.gearfuse.com/wp-content/uploads/2022/02/Barn-Crop-Land-600x338.jpg"], "card_colors": ["#23651a"], "custom_font": { "family": "'Silkscreen'", "link": "Silkscreen:wght@400;700" } }, "preview": "https://i.pinimg.com/736x/5a/2b/40/5a2b4046f9bd72ff53632c7b063030b8.jpg" },

    }
    return themes[name] || {};
}

function importTheme(theme) {
    console.log(theme);
    try {
        let keys = Object.keys(theme);
        let final = {};
        console.log(theme, keys);
        chrome.storage.sync.get("custom_cards", sync => {
            keys.forEach(key => {
                switch (key) {
                    case "dark_preset":
                        changeToPresetCSS(null, theme["dark_preset"]);
                        break;
                    case "card_colors":
                        sendFromPopup("colors", theme["card_colors"]);
                        break;
                    case "custom_cards":
                        if (theme["custom_cards"].length > 0) {
                            let pos = 0;
                            Object.keys(sync["custom_cards"]).forEach(key => {
                                sync["custom_cards"][key].img = theme["custom_cards"][pos];
                                pos = (pos === theme["custom_cards"].length - 1) ? 0 : pos + 1;
                            });
                        }
                        final["custom_cards"] = sync["custom_cards"];
                        break;
                    default:
                        final[key] = theme[key];
                        break;
                }
            });
            chrome.storage.sync.set(final);
        });
    } catch (e) {
        console.log(e);
    }
}

function setAlert(msg) {
    document.querySelector("#dev-alert").textContent = msg;
    setTimeout(() => {
        document.querySelector("#dev-alert").textContent = "";
    }, 4000);
}

function updateCards(key, value) {
    chrome.storage.sync.get(["custom_cards"], result => {
        console.log({ [key]: { ...result["custom_cards"][key], ...value } });
        chrome.storage.sync.set({ "custom_cards": { ...result["custom_cards"], [key]: { ...result["custom_cards"][key], ...value } } }, () => {
            console.log(chrome.runtime.lastError);
            if (chrome.runtime.lastError) {
                let err = document.createElement("p");
                err.className = "error-message";
                err.textContent = "Error: " + chrome.runtime.lastError.message + "... The data you're entering is exceeding the storage limit. Try using shorter links. If this isn't the issue, please contact me at ksucpea@gmail.com";
                document.body.prepend(err);
            }
        })
    });
}

function displayCustomFont() {
    chrome.storage.sync.get(["custom_font"], storage => {
        let el = document.querySelector(".custom-font");
        let linkContainer = document.querySelector(".custom-font-flex") || makeElement("div", "custom-font-flex", el);
        linkContainer.innerHTML = '<span>https://fonts.googleapis.com/css2?family=</span><input class="card-input" id="custom-font-link"></input>';
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
        let quickFonts = document.querySelector("#quick-fonts");
        quickFonts.textContent = "";
        let noFont = makeElement("button", "customization-button", quickFonts, "None");
        noFont.addEventListener("click", () => {
            chrome.storage.sync.set({ "custom_font": { "link": "", "family": "" } });
            link.value = "";
        })
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
            inputs.querySelector(".gpa-bounds-grade").textContent = key;
            inputs.querySelector(".gpa-bounds-cutoff").value = storage["gpa_calc_bounds"][key].cutoff;
            inputs.querySelector(".gpa-bounds-gpa").value = storage["gpa_calc_bounds"][key].gpa;

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
    sendFromPopup("getCards");
    chrome.storage.sync.get(["custom_cards", "custom_cards_2"], storage => {
        console.log(storage["custom_cards"]);
        document.querySelector(".advanced-cards").innerHTML = '<div id="advanced-current"></div><div id="advanced-past"><h2>Past</h2></div>';
        const keys = storage["custom_cards"] ? Object.keys(storage["custom_cards"]) : [];
        if (keys.length > 0) {
            let currentEnrollment = keys.reduce((max, key) => storage["custom_cards"][key]?.eid > max ? storage["custom_cards"][key].eid : max, -1);
            console.log(currentEnrollment);
            keys.forEach(key => {
                let term = document.querySelector("#advanced-past");
                if (storage["custom_cards"][key].eid === currentEnrollment) {
                    term = document.querySelector("#advanced-current");
                }
                let card = storage["custom_cards"][key];
                let card_2 = storage["custom_cards_2"][key] || {};
                if (!card || !card_2 || !card_2["links"] || card_2["links"]["custom"]) {
                    console.log(key + " error...");
                    console.log("card = ", card, "card_2", card_2, "links", card_2["links"]);
                } else {
                    let container = makeElement("div", "custom-card", term);
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
                        customLink.value = card_2.links[i].is_default ? "default" : card_2.links[i].path;
                        customLink.addEventListener("change", function (e) {
                            chrome.storage.sync.get("custom_cards_2", storage => {
                                let newLinks = storage.custom_cards_2[key].links;
                                if (e.target.value === "" || e.target.value === "default") {
                                    console.log("this value is empty....")
                                    //newLinks[i] = { "type": storage.custom_cards_2[key].links.default[i].type, "default": true };
                                    newLinks[i] = { "default": newLinks[i].default, "is_default": true, "path": newLinks[i].default };
                                    customLink.value = "default";
                                } else {
                                    //newLinks[i] = { "type": getLinkType(e.target.value), "path": e.target.value, "default": false };
                                    let val = e.target.value;
                                    if (!e.target.value.includes("https://") && e.target.value !== "none") val = "https://" + val;
                                    newLinks[i] = { "default": newLinks[i].default, "is_default": false, "path": val };
                                    customLink.value = val;
                                }
                                chrome.storage.sync.set({ "custom_cards_2": { ...storage.custom_cards_2, [key]: { ...storage.custom_cards_2[key], "links": newLinks } } })
                            });
                        });
                    }
                };
            });
        } else {
            document.querySelector(".advanced-cards").innerHTML = "<h3>Make sure to open this menu on your Canvas page first/refresh both your canvas page to begin setup.<br /><br />If you're having issues please contact me - ksucpea@gmail.com</h3>";
        }
    });
}

/*
chrome.runtime.onMessage.addListener(message => {
    if (message === "getCardsComplete") {
        displayAdvancedCards();
    }
});
*/

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
        console.log({ [option]: status });
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

document.querySelector("#singleColorInput").addEventListener("change", e => document.querySelector("#singleColorText").value = e.target.value);
document.querySelector("#singleColorText").addEventListener("change", e => document.querySelector("#singleColorInput").value = e.target.value);

document.querySelector("#gradientColorFrom").addEventListener("change", e => document.querySelector("#gradientColorFromText").value = e.target.value);
document.querySelector("#gradientColorFromText").addEventListener("change", e => document.querySelector("#gradientColorFrom").value = e.target.value);

document.querySelector("#gradientColorTo").addEventListener("change", e => document.querySelector("#gradientColorToText").value = e.target.value);
document.querySelector("#gradientColorToText").addEventListener("change", e => document.querySelector("#gradientColorTo").value = e.target.value);

document.querySelector("#revert-colors").addEventListener("click", () => {
    chrome.storage.local.get("previous_colors", local => {
        if (local["previous_colors"] !== null) {
            sendFromPopup("colors", local["previous_colors"].colors);
        }
    })
})

document.querySelectorAll(".preset-button.colors-button").forEach(btn => {
    const colors = getPalette(btn.querySelector("p").textContent);
    let preview = btn.querySelector(".colors-preview");
    colors.forEach(color => {
        let div = makeElement("div", "color-preview", preview);
        div.style.background = color;
    });
    btn.addEventListener("click", () => {
        sendFromPopup("colors", colors);
    })
});

document.querySelector("#setSingleColor").addEventListener("click", () => {
    let colors = [document.querySelector("#singleColorInput").value];;
    sendFromPopup("colors", colors);
});

function getPalette(name) {
    const colors = {
        "Blues": ["#ade8f4", "#90e0ef", "#48cae4", "#00b4d8", "#0096c7"],
        "Reds": ["#e01e37", "#c71f37", "#b21e35", "#a11d33", "#6e1423"],
        "Rainbow": ["#ff0000", "#ff5200", "#efea5a", "#3cf525", "#147df5", "#be0aff"],
        "Cotton Candy": ["#cdb4db", "#ffc8dd", "#ffafcc", "#bde0fe", "#a2d2ff"],
        "Purples": ["#e0aaff", "#c77dff", "#9d4edd", "#7b2cbf", "#5a189a"],
        "Pastels": ["#fff1e6", "#fde2e4", "#fad2e1", "#bee1e6", "#cddafd"],
        "Ocean": ["#22577a", "#38a3a5", "#57cc99", "#80ed99", "#c7f9cc"],
        "Sunset": ["#eaac8b", "#e56b6f", "#b56576", "#6d597a", "#355070"],
        "Army": ["#6b705c", "#a5a58d", "#b7b7a4", "#ffe8d6", "#ddbea9", "#cb997e"],
        "Pinks": ["#ff0a54", "#ff5c8a", "#ff85a1", "#ff99ac", "#fbb1bd"],
        "Watermelon": ["#386641", "#6a994e", "#a7c957", "#f2e8cf", "#bc4749"],
        "Popsicle": ["#70d6ff", "#ff70a6", "#ff9770", "#ffd670", "#e9ff70"],
        "Chess Board": ["#ffffff", "#000000"],
        "Greens": ["#d8f3dc", "#b7e4c7", "#95d5b2", "#74c69d", "#52b788"],
        "Fade": ["#ff69eb", "#ff86c8", "#ffa3a5", "#ffbf81", "#ffdc5e"],
        "Oranges": ["#ffc971", "#ffb627", "#ff9505", "#e2711d", "#cc5803"],
        "Mesa": ["#f6bd60", "#f28482", "#f5cac3", "#84a59d", "#f7ede2"],
        "Berries": ["#4cc9f0", "#4361ee", "#713aed", "#9348c3", "#f72585"],
        "Abyss": ["#56e39f", "#59C9A5", "#5B6C5D", "#3B2C35", "#2A1F2D"]
    }
    return colors[name] || [];
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function getColorInGradient(d, from, to) {
    let pat = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    var exec1 = pat.exec(from);
    var exec2 = pat.exec(to);
    let a1 = [parseInt(exec1[1], 16), parseInt(exec1[2], 16), parseInt(exec1[3], 16)];
    let a2 = [parseInt(exec2[1], 16), parseInt(exec2[2], 16), parseInt(exec2[3], 16)];
    let rgb = a1.map((x, i) => Math.floor(a1[i] + d * (a2[i] - a1[i])));
    return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}

document.querySelector("#setGradientColor").addEventListener("click", () => {
    chrome.storage.sync.get("custom_cards", sync => {
        length = 0;
        Object.keys(sync["custom_cards"]).forEach(key => {
            if (sync["custom_cards"][key].hidden !== true) length++;
        });
        let colors = [];
        let from = document.querySelector("#gradientColorFrom").value;
        let to = document.querySelector("#gradientColorTo").value;
        for (let i = 1; i <= length; i++) {
            colors.push(getColorInGradient(i / length, from, to));
        }
        sendFromPopup("colors", colors);
    });
});

/*
function getColors(preset) {
    console.log(preset)
    Object.keys(preset).forEach(key => {
        try {
            let c = document.querySelector("#dp_" + key);
            let color = c.querySelector('input[type="color"]');
            let text = c.querySelector('input[type="text"]');
            [color, text].forEach(changer => {
                changer.value = preset[key];
                changer.addEventListener("change", function (e) {
                    changeCSS(key, e.target.value);
                });
            });
        } catch (e) {
            console.log("couldn't get " + key)
            console.log(e);
        }
    });
}
*/

/*
function getColors2(data) {
    const colors = data.split(":root")[1].split("--bcstop")[0];
    const backgroundcolors = document.querySelector("#option-background");
    const textcolors = document.querySelector("#option-text");
    colors.split(";").forEach(function (color) {
        const type = color.split(":")[0].replace("{", "").replace("}", "");
        const currentColor = color.split(":")[1];
        if (type) {
            let container = makeElement("div", "changer-container", type.includes("background") ? backgroundcolors : textcolors);
            let colorChange = makeElement("input", "card-input", container);
            let colorChangeText = makeElement("input", "card-input", container);
            colorChangeText.type = "text";
            colorChangeText.value = currentColor;
            colorChange.type = "color";
            colorChange.value = currentColor;
            [colorChange, colorChangeText].forEach(changer => {
                changer.addEventListener("change", function (e) {
                    changeCSS(type, e.target.value);
                });
            });
        }
    })
}
*/


chrome.storage.local.get(["dark_preset"], storage => {
    Object.keys(storage["dark_preset"]).forEach(key => {
        let c = document.querySelector("#dp_" + key);
        let color = c.querySelector('input[type="color"]');
        let text = c.querySelector('input[type="text"]');
        [color, text].forEach(changer => {
            changer.value = storage["dark_preset"][key];
            changer.addEventListener("change", function (e) {
                changeCSS(key, e.target.value);
            });
        });
    });
});

function refreshColors() {
    chrome.storage.local.get(["dark_preset"], storage => {
        Object.keys(storage["dark_preset"]).forEach(key => {
            let c = document.querySelector("#dp_" + key);
            let color = c.querySelector('input[type="color"]');
            let text = c.querySelector('input[type="text"]');
            color.value = storage["dark_preset"][key];
            text.value = storage["dark_preset"][key];
        });
    });
}

function changeCSS(name, color) {
    chrome.storage.local.get(["dark_preset", "dark_css"], storage => {
        storage["dark_preset"][name] = color;
        let chopped = storage["dark_css"].split("--bcstop:#000}")[1];
        let css = "";
        Object.keys(storage["dark_preset"]).forEach(key => {
            css += ("--bc" + key + ":" + storage["dark_preset"][key] + ";");
        });
        chrome.storage.local.set({ "dark_css": ":root{" + css + "--bcstop:#000}" + chopped, "dark_preset": storage["dark_preset"] }).then(() => refreshColors());
    });
}

/*
function changeCSS2(name, color) {
    chrome.storage.local.get(['dark_css'], function (result) {
        const leftText = result.dark_css.split(name + ":#")[0];
        const [changing, ...rest] = result.dark_css.split(name + ":#")[1].split(";");
        const done = leftText.concat(name, ":", color, ";", rest.join(";"));
        changeColors(done);
    });
}
*/

function changeToPresetCSS(e, preset = null) {
    chrome.storage.local.get(['dark_css'], function (result) {
        const presets = {
            "lighter": { "background-0": "#272727", "background-1": "#353535", "background-2": "#404040", "borders": "#454545", "sidebar": "#353535", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
            "light": { "background-0": "#202020", "background-1": "#2e2e2e", "background-2": "#4e4e4e", "borders": "#404040", "sidebar": "#2e2e2e", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
            "dark": { "background-0": "#101010", "background-1": "#121212", "background-2": "#1a1a1a", "borders": "#272727", "sidebar": "#121212", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
            "darker": { "background-0": "#000000", "background-1": "#000000", "background-2": "#000000", "borders": "#000000", "sidebar": "#000000", "text-0": "#c5c5c5", "text-1": "#c5c5c5", "text-2": "#c5c5c5", "links": "#c5c5c5", "sidebar-text": "#c5c5c5" },
            "blue": { "background-0": "#14181d", "background-1": "#1a2026", "background-2": "#212930", "borders": "#2e3943", "sidebar": "#1a2026", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
            "mint": { "background-0": "#0f0f0f", "background-1": "#0c0c0c", "background-2": "#141414", "borders": "#1e1e1e", "sidebar": "#0c0c0c", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#7CF3CB", "sidebar-text": "#f5f5f5" },
            "burn": { "background-0": "#ffffff", "background-1": "#ffffff", "background-2": "#ffffff", "borders": "#cccccc", "sidebar": "#ffffff", "text-0": "#cccccc", "text-1": "#cccccc", "text-2": "#cccccc", "links": "#cccccc", "sidebar-text": "#cccccc" },
            "unicorn": { "background-0": "#ff6090", "background-1": "#00C1FF", "background-2": "#FFFF00", "borders": "#FFFF00", "sidebar": "#00C1FF", "text-0": "#ffffff", "text-1": "#ffffff", "text-2": "#ffffff", "links": "#000000", "sidebar-text": "#ffffff" }
        }
        if (preset === null) preset = presets[e.target.id] || presets["default"];
        applyPreset(preset);
    });
}

function applyPreset(preset) {
    console.log("preset here -> ", preset);
    chrome.storage.local.get(["dark_preset", "dark_css"], storage => {
        let chopped = storage["dark_css"].split("--bcstop:#000}")[1];
        let css = "";
        Object.keys(preset).forEach(key => {
            css += ("--bc" + key + ":" + preset[key] + ";");
        });
        chrome.storage.local.set({ "dark_css": ":root{" + css + "--bcstop:#000}" + chopped, "dark_preset": preset }).then(() => refreshColors());
    });
}

function setToDefaults() {
    fetch(chrome.runtime.getURL('js/darkcss.json'))
        .then((resp) => resp.json())
        .then(function (result) {
            chrome.storage.local.set({ "dark_css": result["dark_css"], "dark_preset": { "background-0": "#161616", "background-1": "#1e1e1e", "background-2": "#262626", "borders": "#3c3c3c", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar": "#1e1e1e", "sidebar-text": "#f5f5f5" } }).then(() => refreshColors());
        });
}

function makeElement(element, elclass, location, text) {
    let creation = document.createElement(element);
    creation.classList.add(elclass);
    creation.textContent = text;
    location.appendChild(creation);
    return creation
}

async function sendFromPopup(message, options = {}) {

    let response = new Promise((resolve, reject) => {
        chrome.tabs.query({ currentWindow: true }).then(async tabs => {
            for (let i = 0; i < tabs.length; i++) {
                try {
                    let res = await chrome.tabs.sendMessage(tabs[i].id, { "message": message, "options": options });
                    if (res) resolve(res);
                } catch (e) {
                }
            }
            resolve(null);
        });
    })

    return await response;
}