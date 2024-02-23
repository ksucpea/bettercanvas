const syncedSwitches = ['hide_feedback', 'dark_mode', 'remlogo', 'full_width', 'auto_dark', 'assignments_due', 'gpa_calc', 'gradient_cards', 'disable_color_overlay', 'dashboard_grades', 'dashboard_notes', 'better_todo', 'condensed_cards'];
const syncedSubOptions = ['device_dark', 'relative_dues', 'card_overdues', 'todo_overdues', 'gpa_calc_prepend', 'auto_dark', 'auto_dark_start', 'auto_dark_end', 'num_assignments', 'assignment_date_format', 'todo_hr24', 'grade_hover', 'hide_completed', 'num_todo_items', 'hover_preview'];
const localSwitches = [];


sendFromPopup("getCards");

// refresh the cards if new ones were just recieved
chrome.storage.onChanged.addListener((changes) => {
    if (changes["custom_cards"]) {
        if (Object.keys(changes["custom_cards"].oldValue).length !== Object.keys(changes["custom_cards"].newValue).length) {
            displayAdvancedCards();
        }
    }
});

function displayErrors() {
    chrome.storage.local.get("errors", storage => {
        storage["errors"].forEach(e => {
            document.querySelector("#error_log_output").value += (e + "\n\n");
        })
    });
}

function displayDarkModeFixUrls() {
    let output = document.getElementById("dark-mode-fix-urls");
    output.textContent = "";
    chrome.storage.sync.get("dark_mode_fix", sync => {
        sync["dark_mode_fix"].forEach(url => {
            let div = makeElement("div", "customization-button", output, url);
            div.classList.add("fixed-url");
            let btn = makeElement("button", "dd", div, "x");
            btn.addEventListener("click", () => {
                chrome.storage.sync.get("dark_mode_fix", sync => {
                    for (let i = 0; i < sync["dark_mode_fix"].length; i++) {
                        if (sync["dark_mode_fix"][i] === url) {
                            sync["dark_mode_fix"].splice(i);
                            chrome.storage.sync.set({ "dark_mode_fix": sync["dark_mode_fix"] }).then(() => div.remove());
                        }
                    }
                });
            })
        })
    })
}

document.addEventListener("DOMContentLoaded", setup);

function setupAssignmentsSlider(initial) {
    let el = document.querySelector('#numAssignmentsSlider');
    el.value = initial;
    document.querySelector('#numAssignments').textContent = initial;
    el.addEventListener('input', function () {
        document.querySelector('#numAssignments').textContent = this.value;
        chrome.storage.sync.set({ "num_assignments": this.value });
    });
}

function setupTodoSlider(initial) {
    let el = document.querySelector('#numTodoItemsSlider');
    el.value = initial;
    document.querySelector('#numTodoItems').textContent = initial;
    document.querySelector('#numTodoItemsSlider').addEventListener('input', function () {
        document.querySelector('#numTodoItems').textContent = this.value;
        chrome.storage.sync.set({ "num_todo_items": this.value });
    });
}

function setupAutoDarkInput(initial, time) {
    let el = document.querySelector('#' + time);
    el.value = initial.hour + ":" + initial.minute;
    el.addEventListener('change', function () {
        let timeinput = { "hour": this.value.split(':')[0], "minute": this.value.split(':')[1] };
        time === "autodark_start" ? chrome.storage.sync.set({ auto_dark_start: timeinput }) : chrome.storage.sync.set({ auto_dark_end: timeinput });
    });
}

function setup() {

    const menu = {
        "switches": syncedSwitches,
        "checkboxes": ['device_dark', 'relative_dues', 'card_overdues', 'todo_overdues', 'gpa_calc_prepend', 'auto_dark', 'assignment_date_format', 'todo_hr24', 'grade_hover', 'hide_completed', 'hover_preview'],
        "tabs": {
            "advanced-settings": { "setup": displayAdvancedCards, "tab": ".advanced" },
            "gpa-bounds-btn": { "setup": displayGPABounds, "tab": ".gpa-bounds-container" },
            "custom-font-btn": { "setup": displayCustomFont, "tab": ".custom-font-container" },
            "card-colors-btn": { "setup": null, "tab": ".card-colors-container" },
            "customize-dark-btn": { "setup": displayDarkModeFixUrls, "tab": ".customize-dark" },
            "import-export-btn": { "setup": displayThemeList, "tab": ".import-export" },
            "report-issue-btn": { "setup": displayErrors, "tab": ".report-issue-container" },
        },
        "special": [
            { "identifier": "auto_dark_start", "setup": (initial) => setupAutoDarkInput(initial, "auto_dark_start") }, 
            { "identifier": "auto_dark_end", "setup": (initial) => setupAutoDarkInput(initial, "auto_dark_end") }, 
            { "identifier": "num_assignments", "setup": (initial) => setupAssignmentsSlider(initial) }, 
            { "identifier": "num_todo_items", "setup": (initial) => setupTodoSlider(initial) }],
    }

    chrome.storage.sync.get(menu.switches, sync => {
        menu.switches.forEach(option => {
            let optionSwitch = document.getElementById(option);
            let status = sync[option] === true ? "#on" : "#off";
            optionSwitch.querySelector(status).checked = true;
            optionSwitch.querySelector(status).classList.add('checked');

            optionSwitch.querySelector(".slider").addEventListener("mouseup", () => {
                let status = !optionSwitch.querySelector("#on").checked;
                optionSwitch.querySelector("#on").checked = status;
                optionSwitch.querySelector("#on").classList.toggle("checked");
                optionSwitch.querySelector("#off").classList.toggle("checked");
                chrome.storage.sync.set({ [option]: status });
                if (option === "auto_dark") {
                    toggleDarkModeDisable(status);
                }
            });
        });
    });

    chrome.storage.sync.get(menu.checkboxes, sync => {
        menu.checkboxes.forEach(option => {
            document.querySelector("#" + option).addEventListener("change", function(e) {
                let status = this.checked;
                chrome.storage.sync.set(JSON.parse(`{"${option}": ${status}}`));
            });
            document.querySelector("#" + option).checked = sync[option];
        });
        /*
        document.querySelector('#autodark_start').value = result.auto_dark_start["hour"] + ":" + result.auto_dark_start["minute"];
        document.querySelector('#autodark_end').value = result.auto_dark_end["hour"] + ":" + result.auto_dark_end["minute"];
        document.querySelector("#assignment_date_format").checked = result.assignment_date_format == true;
        document.querySelector("#todo_hr24").checked = result.todo_hr24 == true;
        */
        toggleDarkModeDisable(sync.auto_dark);
    });

    const specialOptions = menu.special.map(obj => obj.identifier);
    chrome.storage.sync.get(specialOptions, sync => {
        menu.special.forEach(option => {
            if (option.setup !== null) option.setup(sync[option.identifier]);
        });
    })

    /*
    // checkboxes
    menu.checkboxes.forEach(checkbox => {
        document.querySelector("#" + checkbox).addEventListener('change', function () {
            let status = this.checked;
            chrome.storage.sync.set(JSON.parse(`{"${checkbox}": ${status}}`));
        });
    });
    */

    // activate tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (menu.tabs[btn.id].setup !== null) menu.tabs[btn.id].setup();
            document.querySelector(".main").style.display = "none";
            document.querySelector(menu.tabs[btn.id].tab).style.display = "block";
            window.scrollTo(0, 0);
        });
    });

    // activate the back buttons on each tab
    document.querySelectorAll(".back-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".tab").forEach(tab => {
                tab.style.display = "none";
            });
            document.querySelector(".main").style.display = "block";
        });
    });

    // give everything the appropirate i18n text
    document.querySelectorAll('[data-i18n]').forEach(text => {
        text.innerText = chrome.i18n.getMessage(text.dataset.i18n);
    });

    // activate dark mode inspector button
    document.querySelector("#inspector-btn").addEventListener("click", async function () {
        document.querySelector("#inspector-output").textContent = (await sendFromPopup("inspect"))["selectors"];
    });

    // activate dark mode fixer button
    document.querySelector("#fix-dm-btn").addEventListener("click", async function () {
        let output = await sendFromPopup("fixdm");
        if (output.path === "bettercanvas-none" || output.path === "bettercanvas-darkmode_off") return;
        let rating = "bad";
        if (output.time < 100) {
            rating = "good";
        } else if (output.time < 250) {
            rating = "ok";
        }
        document.getElementById("fix-dm-output").textContent = "Fix took " + Math.round(output.time) + "ms (rating: " + rating + ")";
        chrome.storage.sync.get("dark_mode_fix", sync => {
            if (sync["dark_mode_fix"].includes(output.path)) return;
            sync["dark_mode_fix"].push(output.path);
            chrome.storage.sync.set({ "dark_mode_fix": sync["dark_mode_fix"] }).then(() => displayDarkModeFixUrls());
        })
    });

    // activate storage dump button
    document.querySelector("#rk_btn").addEventListener("click", () => {
        chrome.storage.local.get(null, local => {
            chrome.storage.sync.get(null, sync => {
                document.querySelector("#rk_output").value = JSON.stringify(local) + JSON.stringify(sync);
            })
        })
    });

    // activate custom url input
    document.querySelector('#customDomain').addEventListener('input', function () {
        let domains = this.value.split(",");
        domains.forEach((domain, index) => {
            let val = domain.replace(" ", "");
            if (val === "") return;
            //if (!val.includes("https://") && !val.includes("http://")) val = "https://" + val;
            try {
                let url = new URL(val);
                domains[index] = url.hostname;
                clearAlert();
            } catch (e) {
                domains[index] = val;
                displayAlert("The URL you entered appears to be invalid, so it might not work.");
            }
        });
        chrome.storage.sync.set({ custom_domain: domains });
    });

    // setup custom url
    chrome.storage.sync.get(["custom_domain"], storage => {
        document.querySelector("#customDomain").value = storage.custom_domain ? storage.custom_domain : "";
    });

    // activate import input box
    document.querySelector("#import-input").addEventListener("input", (e) => {
        const obj = JSON.parse(e.target.value);
        importTheme(obj);
    });

    // activate export checkbox
    document.querySelectorAll(".export-details input").forEach(input => {
        input.addEventListener("change", () => {
            chrome.storage.sync.get(syncedSwitches.concat(syncedSubOptions).concat(["dark_preset", "custom_cards", "custom_font", "gpa_calc_bounds"]), async storage => {
                //chrome.storage.local.get(["dark_preset"], async local => {
                let final = {};
                for await (item of document.querySelectorAll(".export-details input")) {
                    if (item.checked) {
                        switch (item.id) {
                            case "export-toggles":
                                final = { ...final, ...(await getExport(storage, syncedSwitches.concat(syncedSubOptions))) };
                                break;
                            case "export-dark":
                                final = { ...final, ...(await getExport(storage, ["dark_preset"])) };
                                break;
                            case "export-cards":
                                final = { ...final, ...(await getExport(storage, ["custom_cards"])) };
                                break;
                            case "export-font":
                                final = { ...final, ...(await getExport(storage, ["custom_font"])) };
                                break;
                            case "export-colors":
                                final = { ...final, ...(await getExport(storage, ["card_colors"])) }
                                break;
                            case "export-gpa":
                                final = { ...final, ...(await getExport(storage, ["gpa_calc_bounds"])) }
                                break;
                        }
                    }
                }
                document.querySelector("#export-output").value = JSON.stringify(final);
                //});
            });
        });
    });

    // activate revert to original button
    document.querySelector("#theme-revert").addEventListener("click", () => {
        chrome.storage.local.get("previous_theme", local => {
            if (local["previous_theme"] !== null) {
                importTheme(local["previous_theme"]);
            }
        });
    });

    document.querySelector("#alert").addEventListener("click", clearAlert);

    document.querySelectorAll(".preset-button.customization-button").forEach(btn => btn.addEventListener("click", changeToPresetCSS));

    // activate card color inputs
    document.querySelector("#singleColorInput").addEventListener("change", e => document.querySelector("#singleColorText").value = e.target.value);
    document.querySelector("#singleColorText").addEventListener("change", e => document.querySelector("#singleColorInput").value = e.target.value);
    document.querySelector("#gradientColorFrom").addEventListener("change", e => document.querySelector("#gradientColorFromText").value = e.target.value);
    document.querySelector("#gradientColorFromText").addEventListener("change", e => document.querySelector("#gradientColorFrom").value = e.target.value);
    document.querySelector("#gradientColorTo").addEventListener("change", e => document.querySelector("#gradientColorToText").value = e.target.value);
    document.querySelector("#gradientColorToText").addEventListener("change", e => document.querySelector("#gradientColorTo").value = e.target.value);
    document.querySelector("#setSingleColor").addEventListener("click", () => {
        let colors = [document.querySelector("#singleColorInput").value];;
        sendFromPopup("setcolors", colors);
    });
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
            sendFromPopup("setcolors", colors);
        });
    });

    // activate revert to original card colors button
    document.querySelector("#revert-colors").addEventListener("click", () => {
        chrome.storage.local.get("previous_colors", local => {
            if (local["previous_colors"] !== null) {
                sendFromPopup("setcolors", local["previous_colors"].colors);
            }
        })
    })

    // activate every card color palette button
    document.querySelectorAll(".preset-button.colors-button").forEach(btn => {
        const colors = getPalette(btn.querySelector("p").textContent);
        let preview = btn.querySelector(".colors-preview");
        colors.forEach(color => {
            let div = makeElement("div", "color-preview", preview);
            div.style.background = color;
        });
        btn.addEventListener("click", () => {
            sendFromPopup("setcolors", colors);
        })
    });

    /*
    ['autodark_start', 'autodark_end'].forEach(function (timeset) {
        document.querySelector('#' + timeset).addEventListener('change', function () {
            let timeinput = { "hour": this.value.split(':')[0], "minute": this.value.split(':')[1] };
            timeset === "autodark_start" ? chrome.storage.sync.set({ auto_dark_start: timeinput }) : chrome.storage.sync.set({ auto_dark_end: timeinput });
        });
    });
    */

    // activate sidebar tool radio
    ["#radio-sidebar-image", "#radio-sidebar-gradient", "#radio-sidebar-solid"].forEach(radio => {
        document.querySelector(radio).addEventListener("click", () => {
            chrome.storage.sync.get(["dark_preset"], storage => {
                let mode = radio === "#radio-sidebar-image" ? "image" : radio === "#radio-sidebar-gradient" ? "gradient" : "solid";
                displaySidebarMode(mode, storage["dark_preset"]["sidebar"]);
            });
        })
    });

    // activate left/right theme page buttons
    document.getElementById("premade-themes-left").addEventListener("click", () => displayThemeList(-1));
    document.getElementById("premade-themes-right").addEventListener("click", () => displayThemeList(1));

}


/*
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
    window.scrollTo(0, 0);
});

document.querySelector("#import-export-btn").addEventListener("click", function () {
    displayThemeList();
    document.querySelector(".main").style.display = "none";
    document.querySelector(".import-export").style.display = "block";
    window.scrollTo(0, 0);
});
*/

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
    return final;
}

/*
document.querySelectorAll(".theme-button").forEach(btn => {
    let theme = getTheme(btn.id);
    if (!btn.style.background) btn.style.backgroundImage = "linear-gradient(#0000008c, #0000008c), url(" + theme.preview + ")";

});
*/

let current_page_num = 1;
function displayThemeList(pageDir = 0) {
    let themes = getTheme("all");
    const keys = Object.keys(themes);
    const perPage = 24;
    const maxPage = Math.ceil(keys.length / perPage);
    if (pageDir === -1 && current_page_num > 1) current_page_num--;
    if (pageDir === 1 && current_page_num < maxPage) current_page_num++;
    let container = document.getElementById("premade-themes");
    container.textContent = "";
    let start = (current_page_num - 1) * perPage, end = start + perPage;
    keys.forEach((key, index) => {
        if (index < start || index >= end) return;
        let themeBtn = makeElement("button", "theme-button", container);
        themeBtn.classList.add("customization-button");
        themeBtn.id = key;
        if (!themeBtn.style.background) themeBtn.style.backgroundImage = "linear-gradient(#00000080, #00000080), url(" + themes[key].preview + ")";
        themeBtn.textContent = themes[key].title;
        themeBtn.addEventListener("click", () => {

            const allOptions = syncedSwitches.concat(syncedSubOptions).concat(["dark_preset", "custom_cards", "custom_font", "gpa_calc_bounds", "card_colors"]);
            chrome.storage.sync.get(allOptions, sync => {
                chrome.storage.local.get(["previous_theme"], async local => {
                    //const now = Date.now();
                    if (local["previous_theme"] === null) {
                        let previous = await getExport(sync, allOptions);
                        chrome.storage.local.set({ "previous_theme": previous });
                    }
                });
            });


            importTheme(themes[key].exports);
        });
    });
    //document.getElementById("premade-themes-pagenum").textContent = current_page_num + "/" + maxPage;
}

function getTheme(name) {
    const themes = {
        "theme-capybara": { "title": "Capybara by ksucpea", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "card_colors": ["#755215"], "custom_font": { "family": "'Rubik'", "link": "Rubik:wght@400;700" }, "dark_preset": { "background-0": "#170d03", "background-1": "#251c04", "background-2": "#0c0c0c", "borders": "#1e1e1e", "links": "#dfa581", "sidebar": "linear-gradient(#9b5a32, #1e1506)", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/originals/ca/93/0c/ca930c4f2edd5012863a38182759bfb5.gif", "https://i.ytimg.com/vi/FWcoYPoD6us/maxresdefault.jpg", "https://i.redd.it/kc2xbmo8kiy71.jpg", "https://i.gifer.com/7Luh.gif", "https://media.tenor.com/fdT-j77p2D4AAAAd/capybara-eating.gif", "https://media.tenor.com/1kZ2j73pGDUAAAAC/capybara-ok-he-pull-up.gif"] }, "preview": "https://i.redd.it/kc2xbmo8kiy71.jpg" },
        "theme-minecraft": { "title": "Minecraft by ksucpea", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#29180a", "background-1": "#23651a", "background-2": "#20691b", "borders": "#584628", "links": "#88df81", "sidebar": "#478906", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/564x/68/86/fc/6886fcfaeb5a4f8f6812e5828be48a8b.jpg", "https://i.pinimg.com/236x/3b/d7/24/3bd7241c49a73faa34ab9fd143c6aeab.jpg", "https://i.pinimg.com/236x/13/65/be/1365be0d1dfb50fd029b7263ebbac4cb.jpg", "https://i.pinimg.com/236x/00/ea/44/00ea44a404526888ca7f97177dc425bb.jpg", "https://i.pinimg.com/236x/4c/af/e4/4cafe411bec7d26e709fa60a5f8b60d3.jpg", "https://i.pinimg.com/564x/55/77/f0/5577f03d6369372c6a411812eedf61f8.jpg"], "card_colors": ["#88df81"], "custom_font": { "family": "'Silkscreen'", "link": "Silkscreen:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/00/ea/44/00ea44a404526888ca7f97177dc425bb.jpg" },
        "theme-ocean": { "title": "Ocean by Grant", "exports": { "disable_color_overlay": false, "gradient_cards": true, "dark_mode": true, "dark_preset": { "background-0": "#212838", "background-1": "#1a2026", "background-2": "#212930", "borders": "#2e3943", "sidebar": "#1a2026", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" }, "custom_cards": ["https://gifdb.com/images/high/shark-school-swarming-ocean-8zqd4b90h7j8r8is.gif", "https://media1.giphy.com/media/Y4K9JjSigTV1FkgiNE/200w.webp?cid=ecf05e47qvqduufaxfzre6akpzg4ikbdx9f8f779krrkb89n&ep=v1_gifs_search&rid=200w.webp&ct=g", "https://media4.giphy.com/media/htdnXEhlPDVDZI3CMu/200w.webp?cid=ecf05e47qvqduufaxfzre6akpzg4ikbdx9f8f779krrkb89n&ep=v1_gifs_search&rid=200w.webp&ct=g", "https://i.gifer.com/6jDi.gif", "https://i.redd.it/2p9in2g3va2b1.gif"], "card_colors": ["#32f6cc", "#31eece", "#30e7cf", "#2fdfd1", "#2ed8d2"], "custom_font": { "link": "Comfortaa:wght@400;700", "family": "'Comfortaa'" }, }, "preview": "https://media4.giphy.com/media/htdnXEhlPDVDZI3CMu/200w.webp?cid=ecf05e47qvqduufaxfzre6akpzg4ikbdx9f8f779krrkb89n&ep=v1_gifs_search&rid=200w.webp&ct=g" },
        "theme-pokemon": { "title": "Pokemon by Jason", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#110c12", "background-1": "#704776", "background-2": "#5b3960", "borders": "#836487", "links": "#f5a8ff", "sidebar": "linear-gradient(#000000c7, #000000c7), url(\"https://64.media.tumblr.com/c6e4deca70a7e430d8ebe7a6266c4cc1/tumblr_n6gqw4EGiW1tvub8wo1_500.png\")", "sidebar-text": "#ffffff", "text-0": "#ffffff", "text-1": "#c7c7c7", "text-2": "#adadad" }, "custom_cards": ["https://i.pinimg.com/564x/94/29/67/942967bd1f4651e00f019aeddaf10851.jpg", "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRZGt2iwyDxBuKJmIalhxlkUM_a_PRUpqEqAcbqO_ZXToer3x9Z", "https://i.pinimg.com/originals/96/c1/65/96c1651cc85f05e22390eac2a7e76978.png", "https://i.pinimg.com/originals/62/a6/1c/62a61c78a2228e23c14fb5b27951c5df.jpg", "https://i.pinimg.com/564x/2f/75/11/2f751137735438b81e3abd3bd954b901.jpg"], "card_colors": ["#e0aaff", "#c77dff", "#9d4edd", "#7b2cbf", "#5a189a"], "custom_font": { "family": "'Rubik'", "link": "Rubik:wght@400;700" } }, "preview": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRZGt2iwyDxBuKJmIalhxlkUM_a_PRUpqEqAcbqO_ZXToer3x9Z" },
        "theme-kirby": { "title": "Kirby by Siri", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#fbc1cf", "background-1": "#ae2d45", "background-2": "#5b3960", "borders": "#ae2d45", "links": "#ae2d45", "sidebar": "#ae2d45", "sidebar-text": "#ffffff", "text-0": "#292929", "text-1": "#000000", "text-2": "#000000" }, "custom_cards": ["https://i.pinimg.com/236x/30/19/ab/3019ab7b9f6d2b230a6178231ba3817a.jpg", "https://i.pinimg.com/236x/f0/52/d9/f052d9d8867b66ca7942cf4a2a6c968b.jpg", "https://i.pinimg.com/564x/2e/f0/70/2ef0705eb021d59065239dd553661d4f.jpg", "https://i.pinimg.com/236x/36/a4/73/36a47369afbdb6e91544af173fb0e92d.jpg", "https://i.pinimg.com/236x/6a/9c/60/6a9c604d4070e6d03e15717472851356.jpg"], "card_colors": ["#ae2d45"], "custom_font": { "family": "'Rubik'", "link": "Rubik:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/30/19/ab/3019ab7b9f6d2b230a6178231ba3817a.jpg" },
        "theme-mcdonalds": { "title": "McDonalds by cmoon3611", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#CB2115", "background-1": "#FFC72C", "background-2": "#FFC72C", "borders": "#FFC72C", "links": "#FFC72C", "sidebar": "#FFC72C", "sidebar-text": "#514010", "text-0": "#ffffff", "text-1": "#ffffff", "text-2": "#ffffff" }, "custom_cards": ["https://i.pinimg.com/236x/03/c3/b7/03c3b7ce47480a7dc6f2fbbb4eee730f.jpg", "https://i.pinimg.com/236x/3e/39/ef/3e39ef786197b2694b34c51ab511dddb.jpg", "https://i.pinimg.com/236x/f8/31/bd/f831bd305b19e9d67471afb4f778e697.jpg", "https://i.pinimg.com/236x/a6/5d/ee/a65dee0c9aeea08bc850f9be5eb8d4dc.jpg", "https://i.pinimg.com/236x/27/a9/5c/27a95c0aefc2d5f260088fd409bb6dd0.jpg", "https://i.pinimg.com/236x/90/9c/eb/909ceb03715e98844f0d617b34740157.jpg"], "card_colors": ["#ffc72c"], "custom_font": { "family": "'Poppins'", "link": "Poppins:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/03/c3/b7/03c3b7ce47480a7dc6f2fbbb4eee730f.jpg" },
        "theme-wavy": { "title": "Wavy by Siri", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#080808", "background-1": "#0a0a0a", "background-2": "#0a0a0a", "borders": "#2e2b3b", "links": "#b1a2fb", "sidebar": "linear-gradient(#101010c7, #101010c7), url(\"https://i.pinimg.com/236x/80/f6/1f/80f61fadd498cd8201b678a8cdee2746.jpg\")", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/236x/b2/ff/99/b2ff994c598a5916ca250fd6429a3c01.jpg", "https://i.pinimg.com/236x/34/41/9d/34419d09e540d062a6b43df26c626c20.jpg", "https://i.pinimg.com/236x/c0/d4/cc/c0d4cc0d7041fec03fa21f856a33431c.jpg", "https://i.pinimg.com/236x/bf/46/67/bf4667a532b874050eb477bd891f0551.jpg", "https://i.pinimg.com/236x/ce/0b/8b/ce0b8baaea85445b86d87a610231cf82.jpg", "https://i.pinimg.com/236x/65/c4/ca/65c4ca10b0270634404f2614f30ad684.jpg",], "card_colors": ["#267282", "#d53825", "#1bb0b7", "#c94b43", "#8ebaa6", "#4c8cc4"], "custom_font": { "family": "'Chakra Petch'", "link": "Chakra+Petch:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/34/41/9d/34419d09e540d062a6b43df26c626c20.jpg" },
        "theme-totoro": { "title": "Totoro by Matt", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#102623", "background-1": "#204744", "background-2": "#35573c", "borders": "#35573c", "text-0": "#9dd0d4", "text-1": "#fafcfb", "text-2": "#fafcfb", "links": "#72a06f", "sidebar": "#204744", "sidebar-text": "#9dd0d4" }, "custom_cards": ["https://i.pinimg.com/originals/0e/d9/7b/0ed97b4de4a7ebd19192dca03bac0ced.gif", "https://i.pinimg.com/564x/b1/af/4a/b1af4a2171930f55dbb625a86676751a.jpg", "https://i.pinimg.com/originals/46/a4/b8/46a4b82ea673d390348309cb65e3b357.gif", "https://i.pinimg.com/564x/a5/a6/f5/a5a6f5446e9366d6c40f0bef29fe1f1a.jpg", "https://i.pinimg.com/originals/7d/04/0e/7d040e94931427709008aaeda14db9c8.gif", "https://i.pinimg.com/originals/fd/b7/b1/fdb7b175cd15b48429fa97bbaa817b08.gif", "https://i.pinimg.com/originals/d8/aa/d9/d8aad938f2beea672124ebf1309584c7.gif", "https://i.pinimg.com/originals/07/96/ba/0796badd897daf8b7230da64a97c612c.gif", "https://i.pinimg.com/originals/46/f7/39/46f7399d22f0f45c14bffd2586691fe0.gif"], "card_colors": ["#023047", "#856003", "#4b6979", "#187288", "#b56000"], "custom_font": { "link": "Jost:wght@400;700", "family": "'Jost'" } }, "preview": "https://i.pinimg.com/originals/0e/d9/7b/0ed97b4de4a7ebd19192dca03bac0ced.gif" },
        "theme-cinnamoroll": { "title": "Cinnamoroll by Melina", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#e0e2ff", "background-1": "#b4b9fe", "background-2": "#5b3960", "borders": "#b4b9fe", "links": "#707aff", "sidebar": "#b4b9fe", "sidebar-text": "#ffffff", "text-0": "#292929", "text-1": "#000000", "text-2": "#000000" }, "custom_cards": ["https://i.pinimg.com/564x/0d/bd/ed/0dbdedfd3febc08b4f5bdba114175c10.jpg", "https://i.pinimg.com/564x/f7/b4/d3/f7b4d3f23d63fea99b32c4fcd1c169a1.jpg", "https://i.pinimg.com/564x/00/ad/d4/00add4dc2b6a7af6a13232ceec5252bf.jpg", "https://i.pinimg.com/564x/44/a6/41/44a641d70ef3d2e46ba8c95c25517287.jpg", "https://i.pinimg.com/564x/89/9e/62/899e62954d087597fc3b88f6e07b3640.jpg"], "card_colors": ["#707aff"], "custom_font": { "family": "'Poppins'", "link": "Poppins:wght@400;700" } }, "preview": "https://i.pinimg.com/564x/00/ad/d4/00add4dc2b6a7af6a13232ceec5252bf.jpg" },
        "theme-ghibli": { "title": "Ghibli by Francine", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#e6e6e6", "background-1": "#f5f5f5", "background-2": "#d4d4d4", "borders": "#c7cdd1", "links": "#738678", "sidebar": "#738678", "sidebar-text": "#ffffff", "text-0": "#4d5d53", "text-1": "#777e72", "text-2": "#a5a5a5" }, "custom_cards": ["https://media1.tenor.com/m/d_Yb1KEUhgEAAAAC/lvrnjm-warawara.gif", "https://media.tenor.com/JYgEKjfi3uIAAAAM/anim-howls-moving-castle.gif", "https://media.tenor.com/oABoYJfl05kAAAAM/majonotakkyubin-kikisdelivery.gif", "https://media1.tenor.com/m/QeNq3_I5-owAAAAC/green-studio-ghibli.gif", "https://media1.tenor.com/m/YjCqkJ7kQRkAAAAC/my-neighbor-totoro.gif", "https://media.tenor.com/ax94CJ1L_IoAAAAM/cute.gif", "https://media.tenor.com/faPlGUjSrggAAAAM/totoro-chibi-totoro.gif"], "card_colors": ["#6b705c", "#a5a58d", "#b7b7a4", "#4d5d53", "#b7c9af", "#738678", "#6b705c"], "custom_font": { "family": "'Playfair Display'", "link": "Playfair+Display:wght@400;700" } }, "preview": "https://media.tenor.com/ax94CJ1L_IoAAAAM/cute.gif" },
        "theme-purple": { "title": "Purple by otulpp", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#0f0f0f", "background-1": "#0c0c0c", "background-2": "#141414", "borders": "#1e1e1e", "links": "#f5f5f5", "sidebar": "#0c0c0c", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.imgur.com/HSR9yIV.jpg", "https://i.imgur.com/y2q6zwV.jpg", "https://i.imgur.com/H2v1YWD.jpg", "https://i.imgur.com/D2mHuH2.jpg", "https://i.imgur.com/HgcgCrr.jpg", "https://i.imgur.com/wvkvzTb.jpg", "https://i.imgur.com/Q6KKKe1.jpg"], "card_colors": ["#6f34f9"], "custom_font": { "family": "'Roboto Mono'", "link": "Roboto+Mono:wght@400;700" } }, "preview": "https://i.imgur.com/D2mHuH2.jpg" },
        "theme-flowers": { "title": "Flowers by Claire", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#fff0f0", "background-1": "#ffafbd", "background-2": "#ffafbd", "borders": "#ffafbd", "links": "#e56182", "sidebar": "#ffafbd", "sidebar-text": "#fbeef2", "text-0": "#e56182", "text-1": "#e56183", "text-2": "#ffafbd" }, "custom_cards": ["https://i.pinimg.com/564x/e6/9f/1d/e69f1dd00ade9de2ee056237b32cfd31.jpg", "https://i.pinimg.com/564x/b4/64/6e/b4646e96b2fad3a816bbc001e96974b1.jpg", "https://i.pinimg.com/564x/a3/60/36/a36036af9412b7271c371e8d5fa7b4ba.jpg", "https://i.pinimg.com/736x/7c/7a/c8/7c7ac8b643b750da71bb998bef593b58.jpg", "https://i.pinimg.com/564x/ce/c9/d1/cec9d1b3757b98894ab90182f15b7b33.jpg", "https://i.pinimg.com/736x/65/70/de/6570deac9ff58a9bde044cc62803a0e8.jpg", "https://i.pinimg.com/564x/5f/9f/9a/5f9f9aebee92c88d916137cafc717d4e.jpg"], "card_colors": ["#e56182",], "custom_font": { "family": "'Caveat'", "link": "Caveat:wght@400;700" } }, "preview": "https://i.pinimg.com/564x/b4/64/6e/b4646e96b2fad3a816bbc001e96974b1.jpg" },
        "theme-snoopy": { "title": "Snoopy by Lauren", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#f5f1d6", "background-1": "#dda15e", "background-2": "#bc6c25", "borders": "#283618", "links": "#dda15e", "sidebar": "#606c38", "sidebar-text": "#ffffff", "text-0": "#273517", "text-1": "#283618", "text-2": "#a5a5a5" }, "custom_cards": ["https://i.pinimg.com/564x/04/f9/a5/04f9a5b70b4bd04b6045baf1f6dc0d47.jpg", "https://i.pinimg.com/564x/14/b9/87/14b987e0800e2f0b2a74cef4b4ad3742.jpg", "https://i.pinimg.com/564x/e3/a4/ab/e3a4aba2f25d953e9b476c9d4723eede.jpg", "https://i.pinimg.com/564x/c0/e9/74/c0e9743735a91884bb04e52a876760a4.jpg", "https://i.pinimg.com/564x/ac/4c/f2/ac4cf2e780df3a3759e787d315d53097.jpg"], "card_colors": ["#e3b505", "#95190c", "#610345", "#107e7d", "#044b7f"], "custom_font": { "family": "'Jost'", "link": "Jost:wght@400;700" } }, "preview": "https://i.pinimg.com/564x/ac/4c/f2/ac4cf2e780df3a3759e787d315d53097.jpg" },
        "theme-pinkjapan": { "title": "PinkJapan by Claire", "exports": { "disable_color_overlay": false, "gradient_cards": true, "dark_mode": true, "dark_preset": { "background-0": "#fff0f5", "background-1": "#ffc7dd", "background-2": "#ffc7dd", "borders": "#ffc7dd", "links": "#ff80bd", "sidebar": "linear-gradient(#ffc7ddc7, #ffc7ddc7), url(\"https://i.pinimg.com/474x/f9/1f/ce/f91fced51498b3456b80312fdd953ce1.jpg\")", "sidebar-text": "#ffffff", "text-0": "#ff80bd", "text-1": "#ff80bd", "text-2": "#ff80bd" }, "custom_cards": ["https://i.pinimg.com/474x/92/d8/d4/92d8d4e9d0b61e5f9574c00976725a28.jpg", "https://i.pinimg.com/474x/c6/52/f0/c652f0253c8ec6c794add92329e21369.jpg", "https://i.pinimg.com/474x/d2/df/02/d2df02bd7a5946045814fd5700b323f1.jpg", "https://i.pinimg.com/474x/95/46/63/954663a3d108406009a26dab1142e520.jpg", "https://i.pinimg.com/474x/69/51/db/6951db7b8ba65c468b1d5cc1b8055546.jpg", "https://i.pinimg.com/474x/dd/51/b4/dd51b466f93d2bb733d42efb97476224.jpg", "https://i.pinimg.com/474x/8a/cc/11/8acc111b37b4d1cdfee89ab7e48ee548.jpg", "https://i.pinimg.com/474x/60/fb/47/60fb47640a25fca8d9f0db8ee7a538b4.jpg", "https://i.pinimg.com/474x/30/5d/a8/305da88a22614323a1c449c7692f6204.jpg", "https://i.pinimg.com/474x/44/8b/d0/448bd0957ec3b2da842312461e069fcc.jpg"], "card_colors": ["#ff80bd"], "custom_font": { "family": "'DM Sans'", "link": "DM+Sans:wght@400;700" } }, "preview": "https://i.pinimg.com/474x/95/46/63/954663a3d108406009a26dab1142e520.jpg" },
        "theme-shark": { "title": "Shark by Myles", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#0a272e", "background-1": "#103842", "background-2": "#103842", "borders": "#1a5766", "links": "#3bb9d8", "sidebar": "#103842", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/originals/0b/9e/a3/0b9ea33d064d84a40ef294728c41f85b.jpg", "https://i.pinimg.com/736x/6b/ee/df/6beedf5c1258a1ab3c2b244bcb8cf9d1.jpg", "https://i.pinimg.com/474x/ef/06/eb/ef06eb139d8e8d1300e2a6f4a2e352af.jpg", "https://p16-va.lemon8cdn.com/tos-maliva-v-ac5634-us/oUoyiAz4EgBhAAG1N6BoIRAfDOR60jIyX062E2~tplv-tej9nj120t-origin.webp", "https://p16-va.lemon8cdn.com/tos-maliva-v-ac5634-us/oANyp42A6TziDRJhR2fy6EAXghAoIoBGOIAE6B~tplv-tej9nj120t-origin.webp"], "card_colors": ["#1770ab", "#74c69d", "#74c69d", "#74c69d", "#52b788"], "custom_font": { "family": "'Silkscreen'", "link": "Silkscreen:wght@400;700" } }, "preview": "https://p16-va.lemon8cdn.com/tos-maliva-v-ac5634-us/oANyp42A6TziDRJhR2fy6EAXghAoIoBGOIAE6B~tplv-tej9nj120t-origin.webp" },
        "theme-kuromi": { "title": "Kuromi by Melissa", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#391d3e", "background-1": "#a077a6", "background-2": "#a58fa8", "borders": "#836487", "links": "#e1bce6", "sidebar": "linear-gradient(#352537c7, #352537c7), url(\"https://static.vecteezy.com/system/resources/thumbnails/018/939/219/small/pastel-purple-hearts-seamless-geometric-pattern-with-diagonal-circle-line-background-free-vector.jpg\")", "sidebar-text": "#ffffff", "text-0": "#ffffff", "text-1": "#ffffff", "text-2": "#ffffff" }, "custom_cards": ["https://i.pinimg.com/originals/90/df/66/90df6664fb0bf88a11fec12e34caf53d.gif", "https://i.pinimg.com/originals/bc/59/15/bc5915d9e2b7e43e6531cc6a81cbef4d.gif"], "card_colors": ["#e0aaff", "#177b63"], "custom_font": { "family": "'Silkscreen'", "link": "Silkscreen:wght@400;700" } }, "preview": "https://i.pinimg.com/originals/90/df/66/90df6664fb0bf88a11fec12e34caf53d.gif" },
        "theme-pompompurin": { "title": "pompompurin by Kendelyn", "exports": {"disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#f8fea9","background-1":"#fed886","background-2":"#ffe8b8","borders":"#ffd952","links":"#ca8612","sidebar":"#d2772d","sidebar-text":"#ffda9e","text-0":"#b46027","text-1":"#a95c28","text-2":"#c69b24"},  "custom_cards":["https://i.pinimg.com/736x/ea/18/10/ea1810fba54012ef67a945021dd035a6.jpg","https://i.pinimg.com/564x/dd/9a/76/dd9a76d2faaeb9c6a8198ff9ecf1c309.jpg","https://i.pinimg.com/564x/7f/1a/df/7f1adfb72d69972e2bfdae0e7dbcaa3f.jpg","https://i.pinimg.com/736x/1b/14/67/1b1467e4466f6eb324854229b7e4ffe7.jpg","https://i.pinimg.com/564x/09/91/29/09912908d31713bdd5c556ae5e5e9c90.jpg"],"card_colors":["#f6bd60","#f28482","#f5cac3","#84a59d","#f7ede2","#f6bd60","#f28482","#f5cac3","#84a59d","#f7ede2","#f6bd60"],"custom_font":{"family":"'Silkscreen'","link":"Silkscreen:wght@400;700"}}, "preview": "https://i.pinimg.com/736x/ea/18/10/ea1810fba54012ef67a945021dd035a6.jpg"},
        "theme-dark": { "title": "Dark by Liz", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#131515", "background-1": "#1f2323", "background-2": "#1f2323", "borders": "#2a3232", "links": "#6c95a7", "sidebar": "#1f2323", "sidebar-text": "#dedede", "text-0": "#c7c7c7", "text-1": "#b0b0b0", "text-2": "#9c9c9c" }, "custom_cards": ["https://i.pinimg.com/236x/c2/09/bc/c209bc5e71df606082deae962cee0e78.jpg", "https://i.pinimg.com/236x/21/54/9f/21549f96b7173fe2c9dc6507dcd4c193.jpg", "https://i.pinimg.com/236x/5b/a2/c2/5ba2c203ce3c1968bdb80c3bbe568520.jpg", "https://i.pinimg.com/236x/da/ab/2c/daab2c18fc3910e3419f8dbc8b4d0acb.jpg", "https://i.pinimg.com/236x/6b/5c/90/6b5c90c34191a3a1ee9c7ca64d822389.jpg", "https://i.pinimg.com/236x/28/a8/fb/28a8fbcde35257c8117e31f502f0b64b.jpg"], "card_colors": ["#284057", "#3e589b", "#3f626f", "#2c4c58", "#2d3e3f", "#535c73"], "custom_font": { "family": "'Merriweather'", "link": "Merriweather:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/21/54/9f/21549f96b7173fe2c9dc6507dcd4c193.jpg" },
        "theme-onepiece": { "title": "OnePiece by Allison", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#fef6d7", "background-1": "#942222", "background-2": "#1a1a1a", "borders": "#272727", "links": "#942222", "sidebar": "#feefb4", "sidebar-text": "#000000", "text-0": "#000000", "text-1": "#000000", "text-2": "#000000" }, "custom_cards": ["https://preview.redd.it/goofy-frames-v0-gcoti56dlltb1.jpg?width=567&format=pjpg&auto=webp&s=3b44cbcc94cdcc360e07115dc17d1f9a23c7c2e1", "https://i.pinimg.com/236x/df/c0/74/dfc074b259975bc010100eb36439fe18.jpg", "https://preview.redd.it/if-zoro-got-lost-and-ended-up-in-the-back-rooms-do-you-v0-404t0gtyebcb1.png?auto=webp&s=f188b2b5be9e79886d78bab59e03f9eb3cb0a331", "https://4.bp.blogspot.com/-11EYfCo7EB4/TwNYx_cDKmI/AAAAAAAAJy4/5eZn-GElZkY/s1600/luffy%2Bpeace%2Bsign.jpeg"], "card_colors": ["#942222"], "custom_font": { "family": "'Caveat'", "link": "Caveat:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/df/c0/74/dfc074b259975bc010100eb36439fe18.jpg" },
        "theme-forest": { "title": "Forest By Varun", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#102623", "background-1": "#102623", "background-2": "#102623", "borders": "#3d714b", "links": "#8fffad", "sidebar": "#3d714b", "sidebar-text": "#ffffff", "text-0": "#ffffff", "text-1": "#ffffff", "text-2": "#fff" }, "custom_cards": ["https://c4.wallpaperflare.com/wallpaper/443/482/424/studio-ghibli-forest-clearing-forest-landscape-oak-hd-wallpaper-thumb.jpg", "https://imagedelivery.net/9sCnq8t6WEGNay0RAQNdvQ/UUID-cl9cmhu9i0107qioxvdh37mw7/public", "https://i.pinimg.com/564x/a5/a6/f5/a5a6f5446e9366d6c40f0bef29fe1f1a.jpg", "https://imagedelivery.net/9sCnq8t6WEGNay0RAQNdvQ/UUID-cl9d7s5k51356r9os6m9w70yn/public", "https://pbs.twimg.com/media/EPjktX8U4AA__Cu?format=jpg&name=large"], "card_colors": ["#008400"], "custom_font": { "family": "'Nanum Myeongjo'", "link": "Nanum+Myeongjo:wght@400;700" } }, "preview": "https://c4.wallpaperflare.com/wallpaper/443/482/424/studio-ghibli-forest-clearing-forest-landscape-oak-hd-wallpaper-thumb.jpg" },
        "theme-pastelpink": { "title": "PastelPink by Kai", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#fae3ef", "background-1": "#f5a2cb", "background-2": "#f78bc1", "borders": "#f78bc1", "links": "#802a55", "sidebar": "#db76a9", "sidebar-text": "#000000", "text-0": "#000000", "text-1": "#000000", "text-2": "#000000" }, "custom_cards": ["https://m.media-amazon.com/images/I/61SDXeSVUXL._AC_UF894,1000_QL80_.jpg", "https://64.media.tumblr.com/d4a13a446aa5e5f289e20814e0a94235/tumblr_or32x0dlHD1wp29mto1_1280.jpg", "https://i.pinimg.com/originals/9f/77/6f/9f776fe088d31b850058c4bc5fcc52cc.jpg", "https://i.pinimg.com/564x/ee/6d/5c/ee6d5c9693406c3d90555efd9cd2fdb9.jpg", "https://t3.ftcdn.net/jpg/05/70/74/80/360_F_570748088_ggUWmbyHXAJwVuSgkXwUHaCldPFMLv32.jpg"], "card_colors": ["#db93aa", "#f7b2de", "#de87be", "#f29bbe", "#f7b2c8"], "custom_font": { "family": "'Poppins'", "link": "Poppins:wght@400;700" } }, "preview": "https://m.media-amazon.com/images/I/61SDXeSVUXL._AC_UF894,1000_QL80_.jpg" },
        "theme-eras": { "title": "Eras Tour by Brady", "exports": { "dark_mode": true, "dark_preset": { "background-0": "#151c37", "background-1": "#303554", "background-2": "#303554", "borders": "#494e74", "links": "#eeb4df", "sidebar": "#303554", "sidebar-text": "#ffffff", "text-0": "#ffffff", "text-1": "#ededed", "text-2": "#a5a5a5" }, "custom_cards": ["https://images.foxtv.com/static.fox5dc.com/www.fox5dc.com/content/uploads/2023/08/932/524/GettyImages-1604744167.jpg?ve=1&tl=1", "https://media1.popsugar-assets.com/files/thumbor/ygMeK-Rm0QEm86LW6Fd3CIBSciU=/fit-in/6000x4000/top/filters:format_auto():extract_cover():upscale()/2023/04/11/843/n/1922283/63fa5bca89225ec5_GettyImages-1474304446.jpg", "https://imageio.forbes.com/specials-images/imageserve/64823ba3758d2d944c2a569a/Taylor-Swift--The-Eras-Tour-/960x0.jpg?format=jpg&width=960", "https://media.cnn.com/api/v1/images/stellar/prod/230318120226-03-taylor-swift-eras-tour-0317.jpg?c=original", "https://pbs.twimg.com/media/F0fOjZzacAYEr08.jpg:large", "https://image.cnbcfm.com/api/v1/image/107278487-1690547920875-gettyimages-1564524396-haywardphoto261856_trsqwu49_jyefddip.jpeg?v=1696873880", "https://graziamagazine.com/es/wp-content/uploads/sites/12/2023/09/Foggatt-Taylor-Swift-Eras-copia.jpg", "https://i.abcnewsfe.com/a/93b560e6-45df-4a00-9d6a-f0f3a0165f72/taylor-swift-brazil-gty-jt-231118_1700327206575_hpMain.jpg", "https://images.foxtv.com/static.fox5dc.com/www.fox5dc.com/content/uploads/2023/08/932/524/GettyImages-1604744167.jpg?ve=1&tl=1", "https://media1.popsugar-assets.com/files/thumbor/ygMeK-Rm0QEm86LW6Fd3CIBSciU=/fit-in/6000x4000/top/filters:format_auto():extract_cover():upscale()/2023/04/11/843/n/1922283/63fa5bca89225ec5_GettyImages-1474304446.jpg", "https://imageio.forbes.com/specials-images/imageserve/64823ba3758d2d944c2a569a/Taylor-Swift--The-Eras-Tour-/960x0.jpg?format=jpg&width=960", "https://media.cnn.com/api/v1/images/stellar/prod/230318120226-03-taylor-swift-eras-tour-0317.jpg?c=original", "https://pbs.twimg.com/media/F0fOjZzacAYEr08.jpg:large"], "card_colors": ["#eeb4df"], "custom_font": { "family": "'DM Sans'", "link": "DM+Sans:wght@400;700" } }, "preview": "https://imageio.forbes.com/specials-images/imageserve/64823ba3758d2d944c2a569a/Taylor-Swift--The-Eras-Tour-/960x0.jpg?format=jpg&width=960" },
        "theme-pastelgreen": { "title": "PastelGreen by Kai", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#ebfcef", "background-1": "#a2f5b3", "background-2": "#8bf79d", "borders": "#8bf7a4", "links": "#2d802a", "sidebar": "#76db8a", "sidebar-text": "#000000", "text-0": "#000000", "text-1": "#000000", "text-2": "#000000" }, "custom_cards": ["https://ih0.redbubble.net/image.3235809503.1667/raf,360x360,075,t,fafafa:ca443f4786.jpg", "https://img.freepik.com/free-vector/hand-drawn-olive-green-background_23-2149724849.jpg?size=626&ext=jpg&ga=GA1.1.632798143.1705536000&semt=ais", "https://p16-va.lemon8cdn.com/tos-alisg-v-a3e477-sg/7d047e85ab274eaabe32e3ac27337e90~tplv-tej9nj120t-origin.webp", "https://ih1.redbubble.net/image.2945978530.3100/flat,750x1000,075,f.jpg", "https://img.freepik.com/premium-photo/green-aesthetic-classic-simple-floral-background-cover-journal-spiral_873036-53.jpg"], "card_colors": ["#60ba5d", "#92e88e", "#286b25", "#4ec248", "#6fbf6b"], "custom_font": { "family": "'Poppins'", "link": "Poppins:wght@400;700" } }, "preview": "https://p16-va.lemon8cdn.com/tos-alisg-v-a3e477-sg/7d047e85ab274eaabe32e3ac27337e90~tplv-tej9nj120t-origin.webp" },
        "theme-advtime": { "title": "AdvTime by Myles", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#91c5b4", "background-1": "#d8ad5c", "background-2": "#4b7b80", "borders": "#d8ad5c", "links": "#c5624c", "sidebar": "#d8ad5c", "sidebar-text": "#ffffff", "text-0": "#1d2c3a", "text-1": "#1d2c3a", "text-2": "#1d2c3a" }, "custom_cards": ["https://i.pinimg.com/originals/fd/55/9b/fd559ba05f7a8d5c07e198705c5385ea.gif", "https://media1.giphy.com/media/pO4UHglOY2vII/giphy.gif", "https://i.pinimg.com/originals/37/2d/fb/372dfb2003333955e666adf880a7ba44.gif", "https://i.pinimg.com/originals/b8/a5/d6/b8a5d6ff341676bdb249192a90ff012d.gif", "https://i.pinimg.com/originals/3c/35/6a/3c356aa3fa44e42edca87bb6f99c8102.gif"], "card_colors": ["#4b7b80"], "custom_font": { "family": "'Silkscreen'", "link": "Silkscreen:wght@400;700" } }, "preview": "https://media1.giphy.com/media/pO4UHglOY2vII/giphy.gif" },
        "theme-waveform": { "title": "Waveform by Evan", "exports": { "disable_color_overlay": false, "gradient_cards": true, "dark_mode": true, "dark_preset": { "background-0": "#212838", "background-1": "#1a2026", "background-2": "#212930", "borders": "#2e3943", "links": "#56Caf0", "sidebar": "#1a2026", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://64.media.tumblr.com/8b8355866f27dcfc2cf61c4635b97403/tumblr_p0dhkklO2K1txe8seo1_500.gif", "https://i.imgur.com/HEMgWMm.gif", "https://i.pinimg.com/originals/6a/a2/91/6aa291a29c9ff0674e0777f86e6f4bf8.gif", "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXB2aHR4aXU1YTU1YnY1NHplcHgwOHBycHZndnpqbnUxZXlrbzhxciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1YiJ9qOYgWPCQKhRjj/giphy.gif", "https://i.pinimg.com/originals/46/03/97/460397c66c7e383f03a0f06cbb9060bd.gif", "https://64.media.tumblr.com/f53c69d759bc119edda51e3eb4e6074b/tumblr_oxa6a3Faj31txe8seo1_500.gif"], "card_colors": ["#e0aaff", "#ffcce9", "#da70d6", "#fc9c54", "#65499d", "#f25b43", "#e0aaff", "#ffe373"], "custom_font": { "family": "'Montserrat'", "link": "Montserrat:wght@400;700" } }, "preview": "https://i.pinimg.com/originals/46/03/97/460397c66c7e383f03a0f06cbb9060bd.gif" },
        "theme-THEME": { "title": "THEME by Dalila", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#f8a382", "background-1": "#F67280", "background-2": "#C06C84", "borders": "#C5E7B", "links": "#355C7D", "sidebar": "#355C7D", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/originals/87/87/b4/8787b48e6e7f084b71cff1fd11cc5e73.gif", "https://media1.giphy.com/media/l3vRdDjIXS9dmt2Vi/giphy.gif", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsis9hJTKJXZheHchbF10kXRZKYjRlsXkZrw&usqp=CAU", "https://media4.giphy.com/media/Y8AeLA5ZRSREY/giphy.gif?cid=6c09b952apmfzj9gmfzjatex930izsrbu83xagkziv1ahw9x&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g", "https://gifdb.com/images/high/emma-stone-crying-ft5r7z63iuyox4ov.gif", "https://media.tenor.com/1kZ2j73pGDUAAAAC/capybara-ok-he-pull-up.gif", "https://i.pinimg.com/originals/b1/90/87/b1908765be9fad1cee19fcb4c0156aea.gif", "https://media1.giphy.com/media/h1QI7dgjZUJO60nu2X/giphy.gif"], "card_colors": ["#355C7D"], "custom_font": { "family": "'Corben'", "link": "Corben:wght@400;700" } }, "preview": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsis9hJTKJXZheHchbF10kXRZKYjRlsXkZrw&usqp=CAU" },
        "theme-royalty": { "title": "Royalty by Kat", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#adb7db", "background-1": "#838caf", "background-2": "#838caf", "borders": "#080821", "links": "#121131", "sidebar": "#838caf", "sidebar-text": "#080821", "text-0": "#080821", "text-1": "#080821", "text-2": "#242461" }, "custom_cards": ["https://images.unsplash.com/photo-1585231474241-c8340c2b2c65?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1580677616212-2fa929e9c2cd?w=600&auto=format&fit=crop&q=60", "https://images.unsplash.com/photo-1577493327436-6b54af0aabb3?w=600&auto=format&fit=crop&q=60", "https://images.unsplash.com/photo-1571301092535-61a418b457dd?w=600&auto=format&fit=crop&q=60", "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=60", "https://images.unsplash.com/photo-1598902596597-728cb15eeb3f?w=600&auto=format&fit=crop&q=60", "https://images.unsplash.com/photo-1437751068958-82e6fccc9360?w=600&auto=format&fit=crop&q=60", "https://images.unsplash.com/photo-1543143519-b2ee4b77524e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", "https://images.unsplash.com/photo-1571224602141-9428962fc095?w=600&auto=format&fit=crop&q=60", "https://images.unsplash.com/photo-1491156855053-9cdff72c7f85?w=600&auto=format&fit=crop&q=60", "https://images.unsplash.com/photo-1531762948975-73032b7b61f4?w=600&auto=format&fit=crop&q=60"], "card_colors": ["#e56b6f", "#b56576", "#6d597a", "#355070"], "custom_font": { "family": "'Playfair Display'", "link": "Playfair+Display:wght@400;700" } }, "preview": "https://images.unsplash.com/photo-1571301092535-61a418b457dd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
        "theme-lilac": { "title": "Lilac by Jacee", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#adb7db", "background-1": "#838caf", "background-2": "#838caf", "borders": "#080821", "links": "#121131", "sidebar": "#838caf", "sidebar-text": "#080821", "text-0": "#080821", "text-1": "#080821", "text-2": "#242461" }, "custom_cards": ["https://i.pinimg.com/474x/17/92/c1/1792c16af2c210cce4280d03e8a97396.jpg", "https://i.pinimg.com/474x/1c/af/9b/1caf9bd8c7b683ecd684a866e8227baf.jpg", "https://i.etsystatic.com/21095131/r/il/0e4ddd/3584401402/il_fullxfull.3584401402_f867.jpg", "https://64.media.tumblr.com/d180947a80af3fd0e25453c89cb8d222/tumblr_pqdi8vwbkQ1si78dx_1280.jpg", "https://wallpapers.com/images/hd/periwinkle-aesthetic-dandelion-field-qtcn9i6giu0yn3a3.jpg", "https://i.pinimg.com/474x/8a/76/5a/8a765ae11cfb0749f9c0e0a9fab35582.jpg", "https://i.pinimg.com/474x/fb/c1/98/fbc198da9827fc89a189a55cf0c0ce64.jpg"], "card_colors": ["#080821"], "custom_font": { "family": "'Comfortaa'", "link": "Comfortaa:wght@400;700" } }, "preview": "https://wallpapers.com/images/hd/periwinkle-aesthetic-dandelion-field-qtcn9i6giu0yn3a3.jpg" },
        "theme-forest2": { "title": "Forest by Virginia", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#042f0e", "background-1": "#6f5c38", "background-2": "#8bf79d", "borders": "#a08a5a", "links": "#cecc88", "sidebar": "linear-gradient(#a08a5a, #251504)", "sidebar-text": "#000000", "text-0": "#ffffff", "text-1": "#ffffff", "text-2": "#ffffff" }, "custom_cards": ["https://media4.giphy.com/media/l0Exh0jvgGY43qKPe/200w.webp?rid=200w.webp&ct=g", "https://media3.giphy.com/media/xUA7b4arnbo3THfzi0/200w.webp?rid=200w.webp&ct=g", "https://media0.giphy.com/media/XAe9aDBIv3arS/giphy.webp?rid=giphy.webp&ct=g", "https://media1.giphy.com/media/Qgfz2N36MgUBG/200.webp?rid=200.webp&ct=g", "https://media0.giphy.com/media/uf3jumi0zzUv6/200.webp?rid=200.webp&ct=g", "https://media4.giphy.com/media/xT0xeMhvHEAm72SXBe/200w.webp?rid=200w.webp&ct=g", "https://media4.giphy.com/media/Fyh2GnAMYtK3HTlklo/200w.webp?rid=200w.webp&ct=g", "https://media0.giphy.com/media/xUA7b1AZjL2fQNUp8s/giphy.gif?rid=giphy.gif&ct=g", "https://media3.giphy.com/media/l0Ex3SyTrdOTUgPte/giphy.gif?rid=giphy.gif&ct=g"], "card_colors": ["#a08a5a"], "custom_font": { "family": "'Happy Monkey'", "link": "Happy+Monkey:wght@400;700" } }, "preview": "https://media4.giphy.com/media/l0Exh0jvgGY43qKPe/200w.webp?rid=200w.webp&ct=g" },
        "theme-bloodprime": { "title": "Blood Prime by Aidan", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#000000", "background-1": "#000000", "background-2": "#000000", "borders": "#ff0000", "links": "#ff0000", "sidebar": "#000000", "sidebar-text": "#ff0000", "text-0": "#ff0000", "text-1": "#ff0000", "text-2": "#ff0000" }, "custom_cards": ["https://i.ytimg.com/vi/EGYI_9FSi4s/maxresdefault.jpg", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaluUymvRIt5MTnyMPf4dfporZZk5eaFZ7jqIWAOKIldDW-zfpz3R1RvxZ8FG-16fEmNU&usqp=CAU5577f03d6369372c6a411812eedf61f8.jpg", "https://i.ytimg.com/vi/6U5aKJmLRRI/hqdefault.jpg?sqp=-oaymwEmCOADEOgC8quKqQMa8AEB-AH-BIAC6AKKAgwIABABGGUgYChLMA8=&rs=AOn4CLAKcBM8SNhfV6fXE7Oe4gszKbIEVw", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDoNqI-wUofVjmp1NyZh88aZIaAQ4phaYQ0jrMCsjcQ&s", "https://i.ytimg.com/vi/atSD-bXGBFo/hqdefault.jpg", "https://i.ytimg.com/vi/r95mGoVVreU/maxresdefault.jpg"], "card_colors": ["#ff0000"], "custom_font": { "family": "'Tektur'", "link": "Tektur:wght@400;700" } }, "preview": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDoNqI-wUofVjmp1NyZh88aZIaAQ4phaYQ0jrMCsjcQ&s" },
        "theme-sapphic": { "title": "Sapphic Dreams by Elaine", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#3c2a38", "background-1": "#856693", "background-2": "#8a6a8a", "borders": "#81657b", "links": "#dba4be", "sidebar": "#856693", "sidebar-text": "#f5f5f5", "text-0": "#ddb6db", "text-1": "#c78faf", "text-2": "#392232" }, "custom_cards": ["https://i.pinimg.com/564x/92/5f/3c/925f3ca41b2046070dd3d2bc8cfad2bb.jpg", "https://i.pinimg.com/564x/f0/52/05/f0520533892e52e8418ee387132da77c.jpg", "https://i.pinimg.com/564x/f7/1d/ef/f71defa1317a1900c33e8a367f7f9c46.jpg", "https://i.pinimg.com/564x/40/99/1b/40991b2b1a00766b1e7d2ac705f4c8e8.jpg", "https://i.pinimg.com/564x/f5/1f/bf/f51fbf4a5498be82bc8ec5c931a38135.jpg", "https://i.pinimg.com/474x/18/d8/a5/18d8a56d4074762c356f2dd6de3744ec.jpg", "https://i.pinimg.com/564x/33/ad/c0/33adc0aa7de72a8d01961b787f42c507.jpg"], "card_colors": ["#856693"], "custom_font": { "family": "'Corben'", "link": "Corben:wght@400;700" } }, "preview": "https://i.pinimg.com/564x/f5/1f/bf/f51fbf4a5498be82bc8ec5c931a38135.jpg" },
        "theme-onepiece2": { "title": "OnePiece by Alex", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#131b25", "background-1": "#1a2026", "background-2": "#212930", "borders": "#2e3943", "links": "#b9c1ca", "sidebar": "#1d273a", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/736x/fd/b6/13/fdb6130db7338af852fd17fa854aeed7.jpg", "https://simkl.net/episodes/45/4587110ce85cea735_0.jpg", "https://ricedigital.co.uk/wp-content/uploads/2022/05/1-7-1024x576.jpg", "https://i.pinimg.com/originals/19/74/9f/19749f58b53fbf0ac9eb91166d418341.jpg", "https://media.tenor.com/KNSYmkSCgGQAAAAe/one-piece-monkey-d-luffy.png", "https://i.pinimg.com/originals/ba/f1/cc/baf1cc280bc69b16b8171ac594171805.jpg"], "card_colors": ["#c44963", "#f1d265", "#2367b4", "#7ae4a2", "#cd2d36", "#fa8d30"], "custom_font": { "family": "'Comfortaa'", "link": "Comfortaa:wght@400;700" } }, "preview": "https://i.pinimg.com/736x/fd/b6/13/fdb6130db7338af852fd17fa854aeed7.jpg" },
        "theme-darkside": { "title": "DarkSide by Whitney", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#922020", "background-1": "#922020", "background-2": "#000000", "borders": "#000000", "links": "#000000", "sidebar": "#000000", "sidebar-text": "#922020", "text-0": "#000000", "text-1": "#000000", "text-2": "#000000" }, "custom_cards": ["https://media0.giphy.com/media/1HPUSulSOHDpe/200w.webp?cid=ecf05e478c5mdsl8uhcr9yj35p01vmuk5m4rflibey76ke14&ep=v1_gifs_search&rid=200w.webp&ct=g", "https://media2.giphy.com/media/voKRB2g96S8q4/giphy.webp?cid=ecf05e478c5mdsl8uhcr9yj35p01vmuk5m4rflibey76ke14&ep=v1_gifs_search&rid=giphy.webp&ct=g", "https://media4.giphy.com/media/mZAL1GTRA8VnkRaU47/200w.webp?cid=ecf05e47frhquzpazkdzjkapdyionh70512xx37fddji4736&ep=v1_gifs_search&rid=200w.webp&ct=g", "https://media1.giphy.com/media/1FZqAOn4hzGO4/giphy.webp?cid=ecf05e478c5mdsl8uhcr9yj35p01vmuk5m4rflibey76ke14&ep=v1_gifs_search&rid=giphy.webp&ct=g", "https://media4.giphy.com/media/GIIC4jmmUlXZS/100.webp?cid=ecf05e478c5mdsl8uhcr9yj35p01vmuk5m4rflibey76ke14&ep=v1_gifs_search&rid=100.webp&ct=g"], "card_colors": ["#000000"], "custom_font": { "family": "'Orbitron'", "link": "Orbitron:wght@400;700" } }, "preview": "https://media4.giphy.com/media/mZAL1GTRA8VnkRaU47/200w.webp?cid=ecf05e47frhquzpazkdzjkapdyionh70512xx37fddji4736&ep=v1_gifs_search&rid=200w.webp&ct=g" },
        "theme-melody": { "title": "Melody by Dean", "exports": { "disable_color_overlay": false, "gradient_cards": true, "dark_mode": true, "dark_preset": { "background-0": "#ffebf2", "background-1": "#fcbce8", "background-2": "#ae808c", "borders": "#fca3d8", "links": "#cc85af", "sidebar": "linear-gradient(#e1e0e0c7, #c89797c7), center url(\"https://th.bing.com/th/id/OIP.L79DXEf-CLSDrCpUMAvGRwHaLH?rs=1&pid=ImgDetMain\")", "sidebar-text": "#ffffff", "text-0": "#a77287", "text-1": "#fb88c8", "text-2": "#cc619f" }, "custom_cards": ["https://media1.tenor.com/m/1buQJI4o9vAAAAAd/cute-pink.gif", "https://media1.tenor.com/m/khnJakVn5TEAAAAd/melody-my-melody.gif   ", "https://media1.tenor.com/m/WSqyJfV0_nwAAAAC/my-melody.gif", "https://media1.tenor.com/m/vYjxeV2WjFAAAAAC/my-melody-step-on.gif", "https://media1.tenor.com/m/VKFKDiweiyAAAAAC/my-melody-piano.gif", "https://media1.tenor.com/m/YYhMbnpGJ_4AAAAC/my-melody-melody-mark.gif", "https://media1.tenor.com/m/z78WKgKo75sAAAAC/my-melody.gif"], "card_colors": ["#db93aa", "#f7b2de", "#de87be", "#f29bbe", "#f7b2c8"], "custom_font": { "family": "'Playfair Display'", "link": "Playfair+Display:wght@400;700" } }, "preview": "https://i.pinimg.com/564x/df/f5/91/dff591e2609bfb340bc55e99fd2f3465.jpg" },
        "theme-sisyphus": { "title": "Sisyphus by spampotato", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#EFDFC9", "background-1": "#1a2026", "background-2": "#212930", "borders": "#2e3943", "sidebar": "#152A19", "text-0": "#C57725", "text-1": "#D3995B", "text-2": "#210F04", "links": "#C57880", "sidebar-text": "#f5f5f5" }, "custom_cards": ["https://media.tenor.com/8RV39jK3VxMAAAAM/sisyphus-cat.gif", "https://assets-global.website-files.com/607950a39edbce2cf6c08d42/6192443166cde78cda5c5b57_Untitled.png", "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcSOMz8spYa8H9kEfHScJt5WYjG-ANdYV089MvFfWEqz0-rzVmgO", "https://media.tenor.com/8RV39jK3VxMAAAAM/sisyphus-cat.gif", "https://www.davelabowitz.com/wp-content/uploads/Sisyphus-e1557869810488.jpg", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8W7HmRbHVozDxpt5JPIBAKBlyRQkIgrCffg&usqp=CAU"], "card_colors": ["#1e453e", "#306844", "#455b55", "#182c25", "#2c4c3b"], "custom_font": { "link": "Jost:wght@400;700", "family": "'Jost'" } }, "preview": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8W7HmRbHVozDxpt5JPIBAKBlyRQkIgrCffg" },
        "theme-trees": { "title": "Trees by Aleena", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#000000", "background-1": "#353535", "background-2": "#404040", "borders": "#454545", "links": "#1a6b27", "sidebar": "#353535", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://images.fineartamerica.com/images-medium-large-5/spring-green-trees-with-reflections-sharon-freeman.jpg", "https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/orange-grove-of-citrus-fruit-trees-jane-small.jpg", "https://images.saatchiart.com/saatchi/1012151/art/8622866/7686548-HSC00001-7.jpg", "https://i.etsystatic.com/22883174/r/il/a8ca5d/2844715041/il_570xN.2844715041_1dz2.jpg", "https://img.freepik.com/premium-photo/painting-purple-tree-with-wisteria-flowers_899870-12590.jpg", "https://images.saatchiart.com/saatchi/967155/art/4703159/3772991-HSC00001-7.jpg", "https://images.fineartamerica.com/images-medium-large-5/spring-green-trees-with-reflections-sharon-freeman.jpg", "https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/orange-grove-of-citrus-fruit-trees-jane-small.jpg"], "card_colors": ["#d92114", "#3c4f36", "#9c5800", "#9c5800", "#ad4769", "#65499d"], "custom_font": { "family": "'Jost'", "link": "Jost:wght@400;700" } }, "preview": "https://img.freepik.com/premium-photo/painting-purple-tree-with-wisteria-flowers_899870-12590.jpg" },
        "theme-beatsaber": { "title": "Beatsaber by Caleb", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#212838", "background-1": "#212930", "background-2": "#212930", "borders": "#333e48", "links": "#ff0000", "sidebar": "#212838", "sidebar-text": "#e2e2e2", "text-0": "#e2e2e2", "text-1": "#e2e2e2", "text-2": "#e2e2e2" }, "custom_cards": ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvBf_2yGsnPK9hBz2sbhSJG7MQ3rmRfNMb9Nr1DSYMHg&s", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2gQESdL2EUEHFZP4LnA0ZVPIQq5abpF-mJlmBn3avpg&s", "https://wallpapercave.com/wp/wp4370402.jpg"], "card_colors": ["#4554a4", "#ff2717", "#7d69dd"], "custom_font": { "family": "", "link": "" } }, "preview": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2gQESdL2EUEHFZP4LnA0ZVPIQq5abpF-mJlmBn3avpg&s" },
        "theme-greek": { "title": "Greek by Kaleigh", "exports": { "dark_mode": true, "dark_preset": { "background-0": "#4a4a4a", "background-1": "#4a4a4a", "background-2": "#d4d4d4", "borders": "#c7cdd1", "links": "#b28148", "sidebar": "linear-gradient(#ffffffc7, #ffffbfc7), center url(\"https://i.pinimg.com/474x/0c/83/07/0c8307a476975dca3432d17d5788f964.jpg\")", "sidebar-text": "#4a4a4a", "text-0": "#b2acae", "text-1": "#efe1c7", "text-2": "#a5a5a5" }, "custom_cards": ["https://i.pinimg.com/474x/d7/96/79/d79679e4c80b3875948d569852a151ee.jpg", "https://i.pinimg.com/474x/17/ec/41/17ec41a5247c8a88eec3a5a12c46ae66.jpg", "https://i.pinimg.com/474x/05/4d/fd/054dfddd0c440b876db9a806320f3086.jpg", "https://i.pinimg.com/474x/e0/09/69/e009699605e96c0acd5ecea759caf789.jpg", "https://i.pinimg.com/474x/a3/35/ef/a335ef4a1ce119244ed693ccdf9d70e1.jpg", "https://i.pinimg.com/474x/67/52/21/675221b14a679cdd7c87d030dce63f11.jpg", "https://i.pinimg.com/474x/9e/e1/40/9ee1404c3b71ecf1d22e418c361a53ce.jpg", "https://i.pinimg.com/474x/2f/74/2b/2f742b2ef6fa24666436179d2e992de0.jpg", "https://i.pinimg.com/474x/45/0c/80/450c803573477118245135ce6395f6a0.jpg", "https://i.pinimg.com/474x/7d/14/d1/7d14d187926bdb4aa8d5347b331aec41.jpg", "https://i.pinimg.com/474x/2d/62/59/2d625954d03fe6ea663bbdd700d14082.jpg"], "card_colors": ["#b2acae"], "custom_font": { "family": "'Nanum Myeongjo'", "link": "Nanum+Myeongjo:wght@400;700" } }, "preview": "https://i.pinimg.com/474x/d7/96/79/d79679e4c80b3875948d569852a151ee.jpg" },
        "theme-vintageanime": { "title": "VintageAnime by Santiago", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#1f1e1e", "background-1": "#4d2c63", "background-2": "#285b8a", "borders": "#a36124", "links": "#f5f5f5", "sidebar": "linear-gradient(#000000c7, #3f213bc7), center url(\"https://i.pinimg.com/originals/5c/40/be/5c40be22b66800c8b821b9e9caa2dc90.gif\")", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#9370a4", "text-2": "#6a22a5" }, "custom_cards": ["https://i.pinimg.com/originals/de/17/ca/de17ca3f1e135eff83325f84868c1fba.gif", "https://media1.tenor.com/m/lxUZJpE7uXMAAAAC/city-lights-night-life.gif", "https://i.pinimg.com/originals/89/25/5a/89255a62a84dc4099b99bedfa8ea46fb.gif", "https://64.media.tumblr.com/53b924a6f8479c28945b597d777ea77f/tumblr_pa8dyabRjL1taibz9o1_500.gif", "https://64.media.tumblr.com/4c186daa9e6ea15e87130d87cf6ccdf7/tumblr_owumziZURe1re6nxeo2_r1_500.gif", "https://i.pinimg.com/originals/e1/f0/40/e1f04019b178b5a933bcd95802909a2b.gif", "https://i.imgur.com/GQtGOd9.gif", "https://media.tenor.com/9vi4zj-RddEAAAAC/aesthetic-anime.gif", "https://media.tenor.com/rp0Ixyk3J3gAAAAC/1980s-80s.gif", "https://vignette.wikia.nocookie.net/f2b942c1-4e68-488f-a1c6-a26cc57756a1/scale-to-width-down/1200"], "card_colors": ["#6f34f9"], "custom_font": { "family": "'Quicksand'", "link": "Quicksand:wght@400;700" } }, "preview": "https://i.imgur.com/GQtGOd9.gif" },
        "theme-plants": { "title": "Plants by Michael", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#001b00", "background-1": "#002b00", "background-2": "#389466", "borders": "#84a98c", "links": "#3aa207", "sidebar": "#002b00", "sidebar-text": "#3ded97", "text-0": "#99edc3", "text-1": "#b3e694", "text-2": "#afcd98" }, "custom_cards": ["https://i.pinimg.com/564x/54/f9/60/54f960e94a69cdab692f317ee42102f8.jpg", "https://i.pinimg.com/564x/e5/8d/1c/e58d1cd408adf298f335a737b916defe.jpg", "https://i.pinimg.com/564x/47/fa/4e/47fa4eedd6f954d47fd64fb4e9fe2cad.jpg", "https://i.pinimg.com/564x/f7/22/50/f722502a91b0c32ee2630ef7925d73cc.jpg"], "card_colors": ["#29a250", "#1f8c3d", "#167629", "#0c6016"], "custom_font": { "family": "'Nanum Myeongjo'", "link": "Nanum+Myeongjo:wght@400;700" } }, "preview": "https://i.pinimg.com/564x/47/fa/4e/47fa4eedd6f954d47fd64fb4e9fe2cad.jpg" },
        "theme-motivational": { "title": "Motivational by Kartavya", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#175a92", "background-1": "#f49030", "background-2": "#093C54", "borders": "#d2c4ae", "links": "#f49030", "sidebar": "linear-gradient(#00237c, #165117)", "sidebar-text": "#d2d2d2", "text-0": "#f0d6bb", "text-1": "#f0d6bb", "text-2": "#d2c4ae" }, "custom_cards": ["https://64.media.tumblr.com/33b0165bfb7563b2fde0cd1691a99bee/tumblr_oruiqnVcq51wpyv3go1_1280.gif", "https://i.pinimg.com/originals/09/7b/ec/097becdc539b05e12ad93ba4012e5887.gif", "https://media1.tenor.com/m/5RAZQqo3MokAAAAC/ego-kinpachi-blue-lock.gif", "https://i.pinimg.com/originals/1a/84/d9/1a84d9433d4e38aca666b44531623d0d.gif", "https://media0.giphy.com/media/3o7bugwhhJE9WhxkYw/giphy.gif", "https://i.pinimg.com/originals/20/30/05/203005c4ae0b199ecc8469697716c40e.gif", "https://i.pinimg.com/originals/d8/6b/54/d86b54b83cea8c149c98de9a2ef87f0b.gif", "https://media.tenor.com/Rn-_5B4Xx04AAAAM/eren-transform-eren-yeager.gif", "https://64.media.tumblr.com/5dfd496c9d65bf690ed716fb69508dba/cff7ad98d8acae21-5e/s540x810/c2816132a689ade70654565f6e31e8ad61d29d92.gif", "https://media.tenor.com/hJs4nS3iSxwAAAAM/hinata-shouyou-hinata.gif", "https://media1.tenor.com/m/2WKT3Xfp_BEAAAAd/blue-lock-anime.gif", "https://64.media.tumblr.com/a9799122b21df4918af75ef8584d34b5/5b9f3ef081a78430-f2/s540x810/aec2e712f2a54a6b395ba9862243e7eb1ce185f0.gifv"], "card_colors": ["#59a5ac"], "custom_font": { "family": "'Poiret One'", "link": "Poiret+One:wght@400;700" } }, "preview": "https://media.tenor.com/Rn-_5B4Xx04AAAAM/eren-transform-eren-yeager.gif" },
        "theme-forest3": { "title": "Forest by Alia", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#272727", "background-1": "#353535", "background-2": "#404040", "borders": "#454545", "links": "#56Caf0", "sidebar": "#353535", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/originals/aa/33/d5/aa33d5bf71e6d8fdb050b1e104b7c437.gif", "https://i.pinimg.com/originals/eb/54/d4/eb54d4191a91f9ff3c2f9a198471136b.gif", "https://i.pinimg.com/originals/3b/a0/87/3ba0876e7f971ba78fb3b8b329003576.gif", "https://i.pinimg.com/originals/aa/33/d5/aa33d5bf71e6d8fdb050b1e104b7c437.gif"], "card_colors": ["#124229", "#3a4c40", "#b7b7a4"], "custom_font": { "family": "'Tektur'", "link": "Tektur:wght@400;700" } }, "preview": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQ-1LXVIfQ3A3B1QcRuF8DVHF13ekVFBrvd8MDD0eYPodDbVMcS" },
        "theme-shady": { "title": "Shady by Kayla", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#272727", "background-1": "#353535", "background-2": "#404040", "borders": "#454545", "links": "#d2d2d2", "sidebar": "#353535", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdXVsanIyZ3BvNTh6ZXRnNzkzYzE4djV3Y245YmRvenoyYzJvdWFkdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/13BybT4Y2ZgRcQ/giphy.gif", "https://media.giphy.com/media/1wqpBuDDQegJk5R4IJ/giphy.gif", "https://i.pinimg.com/564x/0a/6f/86/0a6f863e0b175f28a289a42cf849304c.jpg", "https://i.pinimg.com/564x/8d/e6/cf/8de6cfcfb79ccb412c96592a3c6f7ca8.jpg", "https://i.pinimg.com/564x/9b/dd/72/9bdd72e985182c5d659edfd3a049d926.jpg", "https://i.pinimg.com/564x/5b/a9/34/5ba934e5e0f5179dd339595c59ca350d.jpg", "https://i.pinimg.com/564x/f3/a4/5a/f3a45a552201540be1e6cad239a23b81.jpg", "https://i.pinimg.com/736x/95/f4/8c/95f48c3ac654b2a7e752ed29e578034b.jpg", "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWVianZwc3JxbGNha3B3Mzd5MGc0c2JiY2J0Ymhmem9pZDFxZ25lcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/fteNbiLizxry0AwgMR/giphy.gif", "https://media.giphy.com/media/RW2h8vSa20JCU/giphy.gif", "https://i.pinimg.com/564x/a0/74/5f/a0745f7a9f41a39956280033b30e7e1e.jpg", "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExamxnM2djYjd3MDZzcmJzN3pzMjhhZ215MXFxM202MWg4M2xybmFjYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2UJo0BzLw3W9MEchTF/giphy.gif", "https://i.pinimg.com/564x/41/41/e7/4141e7569a9acc3ffeb54d20beba97da.jpg", "https://i.pinimg.com/564x/44/05/90/44059060f115d09f50d6b4c074784888.jpg"], "card_colors": ["#b8b8b8", "#d4d4d4", "#9c9c9c", "#d4d4d4", "#d4d4d4", "#9c9c9c", "#b8b8b8", "#b8b8b8", "#b8b8b8", "#7f7f7f", "#9c9c9c", "#9c9c9c", "#b8b8b8", "#7f7f7f"], "custom_font": { "family": "'Playfair Display'", "link": "Playfair+Display:wght@400;700" } }, "preview": "https://i.pinimg.com/564x/0a/6f/86/0a6f863e0b175f28a289a42cf849304c.jpg" },
        "theme-kpop": { "title": "Straykids by Colleen", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#000000", "background-1": "#000000", "background-2": "#000000", "borders": "#000000", "links": "#ffffff", "sidebar": "#000000", "sidebar-text": "#ffffff", "text-0": "#ffffff", "text-1": "#ffffff", "text-2": "#ffffff" }, "custom_cards": ["https://64.media.tumblr.com/b8e45978086b1b5863b7861d926e0943/ec8e507813ae7ba2-6c/s540x810/1822e2a791e19991060f56d7769f0454c7ab34f1.gif", "https://i.pinimg.com/originals/15/20/2b/15202b4f2e91f2f68bda2563fec0e361.gif", "https://pa1.aminoapps.com/7296/2fc98dea32de4135ee231961ea3ce8ed89472877r1-540-240_hq.gif", "https://64.media.tumblr.com/ddb0c918146af823b2cd3d7be74ce787/c22c01c4b4bcb64c-3e/s540x810/85eac2d9916cd1adf00cd39b10c380c694b6188b.gifv"], "card_colors": ["#f6bd60", "#f28482", "#f5cac3", "#84a59d"], "custom_font": { "family": "'Poppins'", "link": "Poppins:wght@400;700" } }, "preview": "https://i.pinimg.com/564x/9a/77/ef/9a77ef6d46ea8cb559381c66bf54f121.jpg" },
        "theme-journey": { "title": "Journey by egg", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#360e02", "background-1": "#832525", "background-2": "#f6b731", "borders": "#febd4d", "links": "#ede9e9", "sidebar": "linear-gradient(#820808, #420000)", "sidebar-text": "#d37a31", "text-0": "#fec834", "text-1": "#ecc741", "text-2": "#dfb400" }, "custom_cards": ["https://i.imgur.com/13WmOcc.gif", "https://i.imgur.com/btFSNMs.gif", "https://64.media.tumblr.com/c02aa41729dc59fe2e88b53011778ba2/6f0dec9a6f459b6c-11/s640x960/176b088f471571f4018934baf919610aede51a99.gifv", "https://78.media.tumblr.com/69e4c37bdab0197f17eefb559e0fa455/tumblr_pacs7o9E5B1qcy62fo3_r1_500.gif", "https://www.kissmygeek.com/wp-content/uploads/2018/05/journey.gif", "https://i.pinimg.com/originals/4b/bd/8a/4bbd8a83074e8c5ca6cb0c389bf4b1fa.gif", "https://64.media.tumblr.com/8a797054ecfe065bccce5330f4dfe9b6/d79bf7349919150b-44/s640x960/2beb3597864163a25a48513e8e83cc95d27570ae.gifv"], "card_colors": ["#a05519", "#934715", "#863911", "#792a0c", "#6c1c08", "#5f0e04", "#520000"], "custom_font": { "family": "'Tektur'", "link": "Tektur:wght@400;700" } }, "preview": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTxg3h3BAMJ9P-r6LfhpuZ5iZS5HFSSaWQpyj09XiPVFsOJT9cB" },
        "theme-hidden": { "title": "Hidden by Roman", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#363b45", "background-1": "#1a2026", "background-2": "#334352", "borders": "#1a2026", "links": "#657276", "sidebar": "linear-gradient(#1a2026, #363b45)", "sidebar-text": "#a0a3ab", "text-0": "#bec7cb", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["none"], "card_colors": ["#000000"], "custom_font": { "family": "'Jost'", "link": "Jost:wght@400;700" } }, "preview": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Black.png/220px-Black.png" },
        "theme-virgil": { "title": "Vergil by nickolas", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#101010", "background-1": "#121212", "background-2": "#1a1a1a", "borders": "#272727", "links": "#db334c", "sidebar": "#121212", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHgwYzd2eXU3cnc5ajY5bDZuODh6aGtzNnI4NG0yYzNxMDhsdTNndCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ZRouJhQpbhPzTJ2eBU/giphy.gif", "https://media.giphy.com/media/uFxXhqkaGuhvzlOXNb/giphy.gif?cid=790b76110x0c7vyu7rw9j69l6n88zhks6r84m2c3q08lu3gt&ep=v1_gifs_search&rid=giphy.gif&ct=g", "https://media.giphy.com/media/9VtZa3W3UjmQgFTY4I/giphy.gif?cid=790b76110x0c7vyu7rw9j69l6n88zhks6r84m2c3q08lu3gt&ep=v1_gifs_search&rid=giphy.gif&ct=g", "https://media.giphy.com/media/KzQ8OChBq9EBSMf1f7/giphy.gif?cid=790b7611bhvvqwfl4oarmtqijtrb8zw4qx24bkhh5hxeg0wq&ep=v1_gifs_search&rid=giphy.gif&ct=g", "https://media.giphy.com/media/n1DsSMIPUO5TfUcpML/giphy.gif?cid=790b7611bhvvqwfl4oarmtqijtrb8zw4qx24bkhh5hxeg0wq&ep=v1_gifs_search&rid=giphy.gif&ct=g"], "card_colors": ["#c71f37"], "custom_font": { "family": "'Comfortaa'", "link": "Comfortaa:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/90/0a/d6/900ad68e98b661ed72d9260639bd06b0.jpg" },
        "theme-jujukai": { "title": "Jujutsu Kaizen by Keanu", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#000000", "background-1": "#000000", "background-2": "#000000", "borders": "#000000", "links": "#8400f0", "sidebar": "#8400f0", "sidebar-text": "#000000", "text-0": "#c5c5c5", "text-1": "#c5c5c5", "text-2": "#c5c5c5" }, "custom_cards": ["https://giffiles.alphacoders.com/221/221248.gif", "https://i.pinimg.com/originals/73/d8/59/73d859fee54bf9548cd43dd76f59746c.gif", "https://media.tenor.com/images/e9d2e81bbfab46f31717efbd71021e38/tenor.gif", "https://i.pinimg.com/originals/a9/c0/5f/a9c05f7eb99cc939fbf58b751c3993f3.gif", "https://giffiles.alphacoders.com/221/221248.gif", "https://i.pinimg.com/originals/4a/fc/9b/4afc9b072b54a7e23b750bccf5d941cc.gif", "https://i.imgur.com/kOWcfEm.gif", "https://i.imgur.com/aPHfL3F.gif", "https://i.pinimg.com/originals/4a/fc/9b/4afc9b072b54a7e23b750bccf5d941cc.gif"], "card_colors": ["#e00024", "#c20048", "#a4006d", "#850091", "#6700b6", "#4900da", "#2b00ff", "#e00024", "#c20048", "#a4006d"], "custom_font": { "family": "'Tektur'", "link": "Tektur:wght@400;700" } }, "preview": "https://media.tenor.com/images/e9d2e81bbfab46f31717efbd71021e38/tenor.gif" },
        "theme-red": { "title": "RED by Vitor", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#000000", "background-1": "#0f0000", "background-2": "#410101", "borders": "#750000", "links": "#780808", "sidebar": "#0c0c0c", "sidebar-text": "#ff0000", "text-0": "#8a0000", "text-1": "#b80000", "text-2": "#db0000" }, "custom_cards": ["https://i.pinimg.com/236x/95/a7/ee/95a7ee6150054b0fff6ea63031f9262a.jpg", "https://i.pinimg.com/236x/f4/37/22/f43722e9e3d3bd793d3622e61d54cf9c.jpg", "https://i.pinimg.com/236x/ba/ca/9c/baca9cffa808a0aeec427f42bda60e29.jpg", "https://i.pinimg.com/564x/7d/23/e0/7d23e000870e1f34ad2806b0efac5b17.jpg", "https://i.pinimg.com/564x/8f/1c/b7/8f1cb778eb1e00b9e2e04205dec363db.jpg", "https://i.pinimg.com/236x/4b/53/a8/4b53a82c408116cb623b87945b21de43.jpg", "https://i.pinimg.com/564x/0a/5e/21/0a5e2130ae6a8cc74cda7642ab0a4fdc.jpg", "https://i.pinimg.com/236x/e3/63/51/e363511163abf7b500af7f4bd8b7e579.jpg", "https://i.pinimg.com/564x/66/92/80/669280f29cfd7a29084b128d6d2484cd.jpg", "https://i.pinimg.com/236x/98/cc/81/98cc817ab86b49c07dca8fe16e70451b.jpg", "https://i.pinimg.com/564x/34/52/e7/3452e7682e6ea339b36ebe1a52763002.jpg"], "card_colors": ["#1a0101"], "custom_font": { "family": "'Lora'", "link": "Lora:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/95/a7/ee/95a7ee6150054b0fff6ea63031f9262a.jpg" },
        "theme-masters": { "title": "Masters by Todd", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#016545","background-1":"#353535","background-2":"#404040","borders":"#454545","links":"#fffb00","sidebar":"#f2ec02","sidebar-text":"#016545","text-0":"#f5f5f5","text-1":"#e2e2e2","text-2":"#ababab"}, "custom_cards":["https://golfdigest.sports.sndimg.com/content/dam/images/golfdigest/fullset/2017/07/07/595fbd4e867dc5386b58b718_jack-nicklaus-masters-1986-sunday-17th-green-yes-sir-putt.jpg.rend.hgtvcom.1280.1920.suffix/1573332408680.jpeg","https://wp.usatodaysports.com/wp-content/uploads/sites/87/2020/02/gettyimages-85836947.jpg","https://dynaimage.cdn.cnn.com/cnn/c_fill,g_auto,w_1200,h_675,ar_16:9/https%3A%2F%2Fcdn.cnn.com%2Fcnnnext%2Fdam%2Fassets%2F220410183110-01-scottie-scheffler-masters-winner-2022.jpg","https://photo-assets.masters.com/images/pics/large/h__04PMGJ_.jpg","https://static01.nyt.com/images/2015/04/13/sports/13masters-hp/13masters-hp-superJumbo.jpg","https://people.com/thmb/tgygpY8UiSUZtqNWxAilYU4zUSM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(659x289:661x291)/Masters-Tiger-Woods-1995-926b2b8b547448178aa60db791a257d9.jpg"],"card_colors":["#fffb00"],"custom_font":{"family":"'https'","link":"https:wght@400;700"}}, "preview": "https://dynaimage.cdn.cnn.com/cnn/c_fill,g_auto,w_1200,h_675,ar_16:9/https%3A%2F%2Fcdn.cnn.com%2Fcnnnext%2Fdam%2Fassets%2F220410183110-01-scottie-scheffler-masters-winner-2022.jpg"},
        "theme-shadow": { "title": "Shadow by Angela", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#0b0b0a", "background-1": "#a30a0a", "background-2": "#711919", "borders": "#ff0000", "links": "#ff0000", "sidebar": "linear-gradient(#000000c7, #000000c7), center url(\"https://st3.depositphotos.com/3336339/13622/i/450/depositphotos_136228590-stock-photo-red-pattern-with-chaotic-triangles.jpg\")", "sidebar-text": "#f5f5f5", "text-0": "#ffbb00", "text-1": "#e2e2e2", "text-2": "#c2c2c2" }, "custom_cards": ["https://community-cdn.topazlabs.com/original/3X/8/a/8a3e6beea70b99787cf78dd5f35b3d71f288d08c.jpeg", "https://cdn.staticneo.com/p/2012/1/sonic_adventure_2_image3.jpg", "https://images.nintendolife.com/screenshots/4358/900x.jpg", "https://cubemedia.ign.com/cube/image/article/645/645487/shadow-the-hedgehog-20050825004604252.jpg", "https://cdn.staticneo.com/p/2005/2/shadow_the_hedgehog_image_QHR62B8Di5YvykQ.jpg", "https://www.vgchartz.com/games/pics/1192318aaa.jpg"], "card_colors": ["#ff0000"], "custom_font": { "family": "'Roboto Mono'", "link": "Roboto+Mono:wght@400;700" } }, "preview": "https://cdn.staticneo.com/p/2012/1/sonic_adventure_2_image3.jpg" },
        "theme-western": { "title": "Western by Addisun", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#d0ece9", "background-1": "#a4ccc9", "background-2": "#e04a3d", "borders": "#f37664", "links": "#0d0d0d", "sidebar": "linear-gradient(#fb9178c7, #fdf7f7c7), center url(\"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8pMzTcM4m6JKmxe4ETzGyzIOy3vHaIRA5wC4dmyGXTeUGj9iefCOYb4cHzUQ4-W2mcsU\")", "sidebar-text": "#57635a", "text-0": "#050505", "text-1": "#0a0a0a", "text-2": "#0d0c0c" }, "custom_cards": ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcQ_peGGbM7Hv-mBqougGObMff0qwG_zOXfA&s", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDKwvJldAd8gEAW0zrROpusT22AtgYH60yqG89vgQ5LRmCyI3gnqd7ItBJV9tt5LDa0dU&usqp=CAU", "https://i.pinimg.com/originals/64/c9/b8/64c9b87d71fbb04eb1077d1ff8d04189.jpg", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYTIhrSWvwHNVUlC9sKeltJPL28M5VlFfV5SOC7xroVEIhFUveVauVbI41n1RclpKkheI&usqp=CAU", "https://i.pinimg.com/736x/8d/61/67/8d6167ca6f9cd935d80b43452a6b1b60.jpg"], "card_colors": ["#e71f63", "#fd5d10", "#ff9770", "#ffd670", "#009688"], "custom_font": { "family": "'Happy Monkey'", "link": "Happy+Monkey:wght@400;700" } }, "preview": "https://i.pinimg.com/originals/64/c9/b8/64c9b87d71fbb04eb1077d1ff8d04189.jpg" },
        "theme-foxes": { "title": "Foxes by Quix", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#000000","background-1":"#000000","background-2":"#0c0c0c","borders":"#1e1e1e","links":"#822101","sidebar":"linear-gradient(#000000c7, #000000c7), center url(\"https://st4.depositphotos.com/2595103/26276/v/450/depositphotos_262761216-stock-illustration-fox-seamless-pattern-drawing-animals.jpg\")","sidebar-text":"#f5f5f5","text-0":"#f5f5f5","text-1":"#e2e2e2","text-2":"#ababab"},"custom_cards":["https://media1.tenor.com/m/Or8phd3kP8gAAAAd/cute-fox-pet-a-fox.gif","https://media1.tenor.com/m/epF1RX2O8G0AAAAd/fox-pets.gif","https://media1.tenor.com/m/LdNHlS5tndQAAAAd/fox-scared-face.gif","https://media1.tenor.com/m/9BgAdAlV1UMAAAAd/heliflelfon-fox.gif","https://media1.tenor.com/m/HPQABc8aSrQAAAAC/trickmint.gif","https://media1.tenor.com/m/KM0nQ709PM0AAAAC/fox-fail.gif"],"card_colors":["#636363"],"custom_font":{"link":"Jost:wght@400;700","family":"'Jost'"}}, "preview": "https://i.chzbgr.com/thumb1200/1924614/h4E7ABEDB"},
        "theme-purple2": {"title": "Purple by Caylee", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#080808","background-1":"#0a0a0a","background-2":"#0a0a0a","borders":"#2e2b3b","links":"#b1a2fb","sidebar":"linear-gradient(#101010c7, #101010c7), center url(\"https://i.pinimg.com/236x/80/f6/1f/80f61fadd498cd8201b678a8cdee2746.jpg\")","sidebar-text":"#f5f5f5","text-0":"#f5f5f5","text-1":"#e2e2e2","text-2":"#ababab"}, "custom_cards":["https://i.pinimg.com/564x/5d/5d/57/5d5d575b787857f9479b1cd0dbb9de60.jpg","https://i.pinimg.com/564x/32/96/da/3296daa057132ef9c097b8d3c246fc2d.jpg","https://i.pinimg.com/564x/11/aa/e8/11aae862af937617009c98e642f32f17.jpg","https://i.pinimg.com/564x/fb/6a/3f/fb6a3f11bd127617121d61848bd86324.jpg","https://i.pinimg.com/564x/8e/f6/cb/8ef6cbf3ab15e143177c89c577aacdc9.jpg","https://i.pinimg.com/564x/51/72/a0/5172a0ba42b64b6a340ec46730718632.jpg"],"card_colors":["#e0aaff","#c77dff","#9d4edd","#7b2cbf","#5a189a","#e0aaff"],"custom_font":{"family":"'Happy Monkey'","link":"Happy+Monkey:wght@400;700"}}, "preview": "https://i.pinimg.com/564x/fb/6a/3f/fb6a3f11bd127617121d61848bd86324.jpg"},
        "theme-sillycats": { "title": "Silly Cats by Stephanie", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset": { "background-0": "#0d0d21", "background-1": "#0d0d21", "background-2": "#341849", "borders": "#0c466c", "links": "#56Caf0", "sidebar": "#0c466c", "sidebar-text": "#3f7eaa", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/564x/46/88/1d/46881dbea1181428c18eb49f60212bd5.jpg", "https://i.pinimg.com/474x/0e/9f/5a/0e9f5a491305242147907ad86539f010.jpg", "https://i.pinimg.com/236x/74/51/d5/7451d50902dddb215e193734ac49981b.jpg", "https://i.pinimg.com/236x/cf/88/6a/cf886ad3d12477b4dee8f98072806dbd.jpg", "https://i.pinimg.com/736x/6d/e0/4e/6de04e262c56dc9a9b733eec9a16e5b3.jpg", "https://i.pinimg.com/236x/b3/d9/1e/b3d91e35684a51f3afa5abefae1a7ce5.jpg"], "card_colors": ["#3f7eaa"], "custom_font": { "family": "'Comfortaa'", "link": "Comfortaa:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/b3/d9/1e/b3d91e35684a51f3afa5abefae1a7ce5.jpg" },
        "theme-ascension": { "title": "Ascension by Jhil", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#272625","background-1":"#282624","background-2":"#1e1a1a","borders":"#423e3e","links":"#ebe0cb","sidebar":"linear-gradient(#ffeed6c7, #000000c7), center url(\"https://i.imgur.com/RnMvKQi.png\")","sidebar-text":"#2a1818","text-0":"#ffffff","text-1":"#d3c5c5","text-2":"#f7cfcf"}, "custom_cards":["https://i.imgur.com/b3MP58J.png","https://i.imgur.com/qDzMvof.png","https://images.squarespace-cdn.com/content/v1/54faf78ce4b04da0abdfbde8/9810940c-4781-40de-933e-01420b65744d/2.jpg?format=2500w%22,%22https://media.discordapp.net/attachments/947921061595467776/1206708709665935370/rain949_n.png?ex=65dcfe0f&is=65ca890f&hm=8b691e208dd4761573ffdee003a534293e2903f48cea8aab74cafce7333c6195&=&format=webp&quality=lossless&width=956&height=671%22,%22https://cdn.discordapp.com/attachments/947921061595467776/1206698634243211304/butterflyn2.jpg?ex=65dcf4ad&is=65ca7fad&hm=766cc3bea639c8f5c61b61cbd8d7a46c7184a2585a7d9df83ad7238a512331b6&%22,%22https://cdn.discordapp.com/attachments/947921061595467776/1206710271897505792/339665896_165676709697829_3001458454272430325_n.png?ex=65dcff84&is=65ca8a84&hm=866542409bfe9b44270a75c8c918ec737e6eaea0346b1fd1f993749686f57b46&%22,%22https://cdn.discordapp.com/attachments/947921061595467776/1206700487303503902/323502205_1266160280911065_2959231277940101662_n.png?ex=65dcf667&is=65ca8167&hm=03f9c02322e47d763f3112371b135000772101a93840beffc8aae1b95c380de0&%22]%7D","https://i.imgur.com/stx45Sj.png","https://i.imgur.com/jYYp07W.png","https://i.imgur.com/uwga9LC.png","https://i.imgur.com/Zmjn2qX.png"],"card_colors":["#7a7069","#6e645e","#736861","#776b63","#786b61","#65584f","#52463d"],"custom_font":{"family":"","link":""}}, "preview": "https://i.imgur.com/jYYp07W.png"},
        "theme-yosemite": { "title": "Yosemite by Edmund", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#415336","background-1":"#893924","background-2":"#182618","borders":"#1a371c","links":"#28342a","sidebar":"#182618","sidebar-text":"#e2e2e2","text-0":"#83bebd","text-1":"#e2e2e2","text-2":"#ababab"}, "custom_cards":["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU08qbkZR9pBgJqm5f1uq-KtbxRc79BINX0A&usqp=CAU","https://share.america.gov/wp-content/uploads/2014/09/2_6944696871_4a53be209e_k.jpg","https://www.yosemite.com/wp-content/uploads/2023/04/yosemite-falls-1024x600-AdobeStock_504046427.jpg","https://hikebiketravel.com/wp-content/uploads/2013/12/Sequoia-1.jpg","https://madera.objects.liquidweb.services/photos/18885-img_4826.jpg","https://madera.objects.liquidweb.services/photos/16842-half-dome-closeup-from-glacier-point-steve-montalto-hmi-Rectangle-600x400.jpg","https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU08qbkZR9pBgJqm5f1uq-KtbxRc79BINX0A&usqp=CAU"],"card_colors":["#009463","#007b52","#006242","#004a31","#003121","#001810","#000000"],"custom_font":{"family":"'Happy Monkey'","link":"Happy+Monkey:wght@400;700"}}, "preview": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU08qbkZR9pBgJqm5f1uq-KtbxRc79BINX0A"},
        "theme-HTTYD": { "title": "HTTYD by Caillie", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#0f0f0f","background-1":"#0c0c0c","background-2":"#141414","borders":"#1e1e1e","links":"#a0a089","sidebar":"#0c0c0c","sidebar-text":"#f5f5f5","text-0":"#f5f5f5","text-1":"#e2e2e2","text-2":"#ababab"}, "custom_cards":[" https://i.pinimg.com/564x/e9/2d/c8/e92dc858130702892d67e4534bc44bea.jpg","https://i.pinimg.com/564x/a6/bd/fa/a6bdfac8f9d457e2297d7324d61f0d42.jpg","https://i.pinimg.com/736x/5a/08/47/5a0847ec23d1f7be70a5080ca44968d4.jpg","https://i.pinimg.com/564x/bd/af/f9/bdaff9a79ac51eaa6102805024c7f9cc.jpg","https://i.pinimg.com/564x/15/fc/27/15fc27e4bdc77b3d6de8a5a5cba08b93.jpg","https://i.pinimg.com/564x/ef/18/74/ef1874a062e7552bfa16bf4a13936bac.jpg","https://i.pinimg.com/564x/c4/98/de/c498def36e55c484b7f3f08a7b7334c9.jpg"],"card_colors":["#a5a58d","#626e7b","#626e7b","#626e7b","#626e7b","#626e7b","#626e7b"],"custom_font":{"family":"'Playfair Display'","link":"Playfair+Display:wght@400;700"}}, "preview": "https://i.pinimg.com/564x/e9/2d/c8/e92dc858130702892d67e4534bc44bea.jpg"},
        "theme-neon": { "title": "Neon by Gabriel", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#161616","background-1":"#56c2bb","background-2":"#4be285","borders":"#00d0fa","links":"#ff80ca","sidebar":"linear-gradient(#6bd3e1, #fe6794)","sidebar-text":"#f5f5f5","text-0":"#9ae5fe","text-1":"#ff7ac8","text-2":"#70ffb5"}, "custom_cards":["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTwmWMKqKcq9-amzPxhVRVp9nBCk2_NmpK_g"],"card_colors":["#975bc9"],"custom_font":{"family":"'Nova Script'","link":"Nova Script:wght@400;700"}}, "preview": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTwmWMKqKcq9-amzPxhVRVp9nBCk2_NmpK_g"},
        "theme-evergarden": { "title": "Evergarden by Junichiro", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#05061e","background-1":"#0b0c28","background-2":"#090920","borders":"#1a2442","links":"#ebc380","sidebar":"#1a2442","sidebar-text":"#7f849c","text-0":"#ebc380","text-1":"#ae906d","text-2":"#ebc380"},  "custom_cards":["https://bakkunyan.files.wordpress.com/2017/11/d.gif","https://i.redd.it/evbs7mmpnwz41.gif","https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/c2a4fd09-561a-4019-b2c9-6461fa3db151/dem3ja1-77d39576-2e9a-40a4-ae2a-3fe05459e35b.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2MyYTRmZDA5LTU2MWEtNDAxOS1iMmM5LTY0NjFmYTNkYjE1MVwvZGVtM2phMS03N2QzOTU3Ni0yZTlhLTQwYTQtYWUyYS0zZmUwNTQ1OWUzNWIuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.eX3ftBHLJtJ4Ebvp-VhS6V6mKKQIaRFYwBrLubL3dhM","https://giffiles.alphacoders.com/209/209205.gif","https://i.pinimg.com/originals/24/a6/7c/24a67c194d27536801d15f95cc4b3c02.gif","https://mishatventures.files.wordpress.com/2018/03/tumblr_p2qwguuiqb1t0lt8go1_540.gif?w=761","https://i.pinimg.com/originals/9f/92/62/9f926273bd71f6efde59a6f6c1e8b96f.gif","https://gifdb.com/images/high/violet-evergarden-brooch-necklace-hold-0xmduinane3kdv7g.gif","https://giffiles.alphacoders.com/115/115841.gif"],"card_colors":["#ebc380"],"custom_font":{"family":"'EB Garamond'","link":"EB+Garamond:wght@400;700"}}, "preview": "https://static.wikia.nocookie.net/violet-evergarden/images/a/ae/Violet_Evergarden.png/revision/latest?cb=20180209195829"},
        "theme-cyberpunk": { "title": "Cyberpunk by Hadley", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#170005","background-1":"#170005","background-2":"#170005","borders":"#ff003c","links":"#ff003c","sidebar":"#170005","sidebar-text":"#f5f5f5","text-0":"#72eaf8","text-1":"#d6d6d6","text-2":"#72eaf8"}, "custom_cards":["https://i.pinimg.com/originals/de/14/fe/de14fe3a0837dd198411c12b16d3278e.gif","https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdW5jZ2Nxc2docnBrYTh6bjM1MXF5emN1azU1aXl0M2U1NDhreW5nbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZkUMyzW7Q7quI/giphy.gif","https://i.pinimg.com/originals/ca/b2/46/cab2463eccff08174ce7fe410b71da26.gif","https://i.pinimg.com/originals/38/3e/0e/383e0edf60a2ae892a686b18acdcb148.gif","https://i.pinimg.com/originals/8c/dc/13/8cdc13272525d79e858afba733529235.gif","https://i.pinimg.com/originals/d1/e4/53/d1e45335d3511b17438ac850654d6c36.gif"],"card_colors":["#417b8c","#524298","#5171a2","#5864ab","#497997","#4c2185"],"custom_font":{"family":"'Rajdhani'","link":"Rajdhani:wght@400;700"}}, "preview": "https://i.pinimg.com/originals/8c/dc/13/8cdc13272525d79e858afba733529235.gif"},
        "theme-ghibliflower": { "title": "Ghibliflowers by Annie", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#ffffff","background-1":"#ffe0ed","background-2":"#ff0066","borders":"#ff007b","links":"#ff0088","sidebar":"#f490b3","sidebar-text":"#ffffff","text-0":"#ff0095","text-1":"#ff8f8f","text-2":"#ff5c5c"},"custom_cards":["https://64.media.tumblr.com/3ea30da4f56c34ccb1141d9691390423/tumblr_p9t2ksYv8r1qa9gmgo10_r2_1280.jpg","https://imagedelivery.net/9sCnq8t6WEGNay0RAQNdvQ/UUID-cl90fjfhv184494vmqyclfo49yv/public","https://64.media.tumblr.com/273783fd75b836f7aa73d7ac55e39e5e/tumblr_p9t2ksYv8r1qa9gmgo4_r1_1280.jpg","https://i.pinimg.com/736x/e4/ec/ae/e4ecae599a35af716ff4e31fd12952f1.jpg","https://i.redd.it/wbfuh9xeimpb1.jpg","https://i.pinimg.com/564x/92/ae/5a/92ae5ad0b4fb601d14de5c1805324a2c.jpg"],"card_colors":["#ff0095"],"custom_font":{"link":"Inria+Sans:wght@400;700","family":"'Inria Sans'"}}, "preview": "https://imagedelivery.net/9sCnq8t6WEGNay0RAQNdvQ/UUID-cl90fjfhv184494vmqyclfo49yv/public"},
        "theme-yotsuba": {"title": "Yotsuba by Rosanna", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#E3ECDD","background-1":"#e7e7a5","background-2":"#ea5757","borders":"#87bb60","links":"#ea5757","sidebar":"linear-gradient(#8EC884, #6B936E)","sidebar-text":"#E3ECDD","text-0":"#151a56","text-1":"#328c95","text-2":"#151a56"}, "custom_cards":["https://qph.cf2.quoracdn.net/main-qimg-c6c1e9f33bafa535420867c9e769177e-lq","https://mangabrog.files.wordpress.com/2015/08/ytbheadeer.jpg?w=640","https://imgix.ranker.com/list_img_v2/8134/2768134/original/manga-like-yotsuba-recommendations","https://i.pinimg.com/736x/e9/4c/5e/e94c5e40d9ebfbfc9d6a63886cf7ff44.jpg","https://mangabrog.files.wordpress.com/2015/08/cover1.jpg"],"card_colors":["#ea5757"],"custom_font":{"family":"'Corben'","link":"Corben:wght@400;700"}}, "preview": "https://qph.cf2.quoracdn.net/main-qimg-c6c1e9f33bafa535420867c9e769177e-lq"},
        "theme-cleangreen": { "title": "Cleangreen by Victoria", "exports": { "disable_color_overlay":true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#c2c5aa","background-1":"#a4ac86","background-2":"#a4ac86","borders":"#a4ac86","links":"#656d4a","sidebar":"linear-gradient(#333d29, #a4ac86)","sidebar-text":"#c2c5aa","text-0":"#333d29","text-1":"#333d29","text-2":"#333d29"}, "custom_cards":["https://i.pinimg.com/474x/e3/d1/89/e3d189730e159acbd9b6a5e1f70a77b4.jpg","https://i.pinimg.com/564x/ef/4f/56/ef4f56f6d701fbb0e865009343036623.jpg","https://i.pinimg.com/474x/fa/62/1c/fa621c222352df35e79641ac909bfecb.jpg","https://i.pinimg.com/564x/62/36/71/623671ce9709c260686c26be2e67bf07.jpg","https://i.pinimg.com/564x/9c/d9/37/9cd937fe6bc552c5610486ffb65aedea.jpg","https://i.pinimg.com/474x/8e/44/ed/8e44eddf85abfd0b12dc211ea27428db.jpg","https://i.pinimg.com/564x/42/ed/32/42ed32e2a701c13485fb37718083a15f.jpg"],"card_colors":["#333d29"],"custom_font":{"family":"'Playfair Display'","link":"Playfair+Display:wght@400;700"}}, "preview": "https://i.pinimg.com/474x/e3/d1/89/e3d189730e159acbd9b6a5e1f70a77b4.jpg"},
        "theme-purplewurple": { "title": "Purplewurple by Salomon", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#2e285d","background-1":"#2e285d","background-2":"#e9c3e2","borders":"#e9c3e2","links":"#e9c3e2","sidebar":"#2e285d","sidebar-text":"#e9c3e2","text-0":"#ffffff","text-1":"#ffffff","text-2":"#ffffff"}, "custom_cards":["https://i.pinimg.com/originals/29/f6/1c/29f61c6393a0cfd3bd1e577789150867.gif","https://i.pinimg.com/originals/6d/ca/cf/6dcacf1b62d1d46006e558c41c1e8f88.gif","https://i.pinimg.com/originals/ea/4d/66/ea4d66b32d8edf097d65924416022b1a.gif","https://i.pinimg.com/originals/2e/73/f5/2e73f54bfd969a264820b1b9f5253db8.gif","https://i.pinimg.com/originals/28/82/3d/28823dd54ece10453a17f2bbd8f015d3.gif","https://i.pinimg.com/originals/f9/e7/22/f9e722d939d49636ea9bbfe0d0516df7.gif","https://i.pinimg.com/originals/69/1f/48/691f48e7e3675020b2ba28b373a8915d.gif","https://i.pinimg.com/originals/ab/ec/de/abecde4f61cca6c7ad413af0c097276a.gif","https://i.pinimg.com/564x/c5/dd/c4/c5ddc4452ac52cad34a97439d220ed94.jpg","https://i.pinimg.com/originals/0e/64/3e/0e643e1015b0f01d2de68b54554bc95f.gif","https://i.pinimg.com/originals/ef/7a/42/ef7a420440306ae74ef664f2df513851.gif","https://i.pinimg.com/originals/ef/7a/42/ef7a420440306ae74ef664f2df513851.gif"],"card_colors":["#e9c3e2","#177b63","#794101","#e9c3e2","#e9c3e2","#0076b8","#008400","#e9c3e2","#e9c3e2","#e9c3e2","#e9c3e2","#e9c3e2","#e9c3e2","#e9c3e2","#e9c3e2"],"custom_font":{"family":"'Happy Monkey'","link":"Happy+Monkey:wght@400;700"}}, "preview": "https://i.pinimg.com/564x/c5/dd/c4/c5ddc4452ac52cad34a97439d220ed94.jpg"},
        "theme-roccoco": { "title": "Roccoco by Linai", "exports":{ "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#ffe0f5","background-1":"#ffccef","background-2":"#fed7fd","borders":"#f9bee0","links":"#fe71a9","sidebar":"linear-gradient(#f3ddef, #ff0095)","sidebar-text":"#ffccf8","text-0":"#ff0059","text-1":"#fe8bc2","text-2":"#ffa3c3"}, "custom_cards":["https://i.pinimg.com/originals/b4/71/65/b47165a64779ddae7d33c98d175e863a.jpg","https://i.pinimg.com/originals/e8/96/e1/e896e15094030a4602bae14db30e2713.jpg","https://i.pinimg.com/originals/39/d5/83/39d583616237939700e0a3563a81a892.jpg","https://i.pinimg.com/originals/1b/ff/f0/1bfff03b495f72b4d7afe01443fff830.jpg","https://i.pinimg.com/originals/f6/83/48/f6834860d77b9f5cb89d51597646dd5b.jpg"],"card_colors":["#e56182","#e56182","#e56182","#e56182","#e56182"],"custom_font":{"family":"'Caveat'","link":"Caveat:wght@400;700"}}, "preview": "https://i.pinimg.com/originals/f6/83/48/f6834860d77b9f5cb89d51597646dd5b.jpg"},
        "theme-waves": { "title": "Waves by Pia", "exports": {"disable_color_overlay": false, "gradient_cards":false, "dark_mode": true, "dark_preset":{"background-0":"#adbfcd","background-1":"#2e2e2e","background-2":"#4e4e4e","borders":"#404040","links":"#9394ae","sidebar":"#aeafcd","sidebar-text":"#f5f5f5","text-0":"#7e7f9a","text-1":"#70718f","text-2":"#9b9cb0"}, "custom_cards":["https://i.pinimg.com/236x/cc/f7/aa/ccf7aae97e72deb487f05dd2157c3941.jpg","https://w0.peakpx.com/wallpaper/702/891/HD-wallpaper-wave-blue-ocean-sea-thumbnail.jpg","https://i.pinimg.com/236x/94/1b/9c/941b9c6296e053d99225bf6b4442f0a0.jpg","https://i.pinimg.com/236x/4e/4e/72/4e4e72a411e829ee47dd3e3c96450b1a.jpg","https://i.pinimg.com/236x/1f/f2/b7/1ff2b7ac82f535e501b020b3cb5909ff.jpg","https://i.pinimg.com/236x/4e/4e/72/4e4e72a411e829ee47dd3e3c96450b1a.jpg","https://cff2.earth.com/uploads/2022/07/12110923/Chago-whale-960x640.jpg","https://i.pinimg.com/236x/29/f2/56/29f2560a91da3dab7597637dcf513607.jpg","https://i.pinimg.com/474x/24/fa/ec/24faece37646a33d3309ac5f94b1cbe2.jpg"],"card_colors":["#adbdcd","#adbbcd","#adb9cd","#adb7cd","#adb6cd","#adb4cd","#adb2cd","#adb0cd","#aeafcd"],"custom_font":{"family":"'Expletus Sans'","link":"Expletus+Sans:wght@400;700"}}, "preview": "https://i.pinimg.com/236x/1f/f2/b7/1ff2b7ac82f535e501b020b3cb5909ff.jpg"},
        "theme-salshrine": { "title": "SalShrine by not12fish", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#355eda","background-1":"#00C1FF","background-2":"#FFFF00","borders":"#fffffff","sidebar":"linear-gradient(#01c7, #0fc7), center url(\"https://4.bp.blogspot.com/-s7Ca91AdrUo/UmVc7kfCK-I/AAAAAAAAoLY/aukCMATg2tU/s1600/1882+Cliff+at+Varengeville+oil+on+canvas+Private+Collection.jpg\")","text-0":"#ffffff","text-1":"#ffffff","text-2":"#ffffff","links":"#fffffff","sidebar-text":"#ffffff"},"custom_cards":["https://artsdot.com/ADC/Art-ImgScreen-2.nsf/O/A-8XXRZM/$FILE/Claude_monet-water_lily_pond_8_.Jpg","https://images.fineartamerica.com/images/artworkimages/mediumlarge/1/5-the-artists-garden-at-giverny-claude-monet.jpg","https://3.bp.blogspot.com/-r9YfIOruALQ/WKDVLrokjeI/AAAAAAAANDI/fsWc_TTFkc0cRtqzQPMS3ELgicrcbVKPwCLcB/s1600/Claude%2BMonet%2BTutt%2527Art%2540%2B%25283%2529.jpg","https://www.paintingmania.com/arts/claude-monet/large/pathway-monets-garden-giverny-1902-7_4407.jpg?version=11.11.20","https://3.bp.blogspot.com/-IkIE84qrz1c/UttwMT0ME-I/AAAAAAAADoc/2ibI46M6ucI/s1600/sunflowers.jpg","https://upload.wikimedia.org/wikipedia/commons/3/37/Claude_Monet_-_Springtime_-_Walters_3711.jpg","https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fmastereducacionsecundaria.files.wordpress.com%2F2012%2F03%2Fpuente.jpg&f=1&nofb=1&ipt=3c9954c9de3b403745e9e1faa942af326303ae2712df98c52aa624a29de5bf7d&ipo=images","https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fartsdot.com%2FADC%2FArt-ImgScreen-4.nsf%2FO%2FA-8XXRVK%2F%24FILE%2FClaude-monet-irises-in-monet-s-garden.Jpg&f=1&nofb=1&ipt=82f8da68dd741a52dca02641cd590c7ccd1a78b12d23139550d97b7fccd9d8e2&ipo=images","https://upload.wikimedia.org/wikipedia/commons/2/29/Claude_Monet_037.jpg","https://i.pinimg.com/originals/b9/84/63/b9846328c61f9059b7cbb9d90474fa0f.jpg","https://upload.wikimedia.org/wikipedia/commons/9/9f/Claude_Monet_010.jpg","https://www.christies.com/img/LotImages/2018/NYR/2018_NYR_16718_0010_000(claude_monet_nympheas_en_fleur).jpg"],"card_colors":["#00C1FF"],"custom_font":{"link":"Open+Sans:wght@400;700","family":"'Open Sans'"}}, "preview": "https://i.pinimg.com/originals/b9/84/63/b9846328c61f9059b7cbb9d90474fa0f.jpg"},
        "theme-towerofgod": { "title": "TowerOfGod by Gabriela", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#adb9c2","background-1":"#9199a1","background-2":"#313030","borders":"#434242","links":"#484956","sidebar":"linear-gradient(#000000c7, #000000c7), center url(\"https://pbs.twimg.com/media/GGuTnnqbIAAKKSZ.jpg\")","sidebar-text":"#ffffff","text-0":"#030303","text-1":"#050505","text-2":"#171616"}, "custom_cards":["https://www.pockettactics.com/wp-content/sites/pockettactics/2023/02/tower-of-god-tier-list-3.jpg","https://pbs.twimg.com/media/E1y40hpXsAMxd3E.jpg:large","https://www.gamespot.com/a/uploads/screen_kubrick/1581/15811374/4032493-towerofgod.jpg","https://pbs.twimg.com/media/EY_dEFvXsAAD_87.jpg:large","https://forumcdn.ngelgames.com/board/image/17332773-81c0-426b-89f5-70771a5734d2.png","https://forumcdn.ngelgames.com/board/image/adba0314-e50a-4fe2-9553-eed10a370c4a.png","https://pbs.twimg.com/media/F2WF4QebUAAR62_.jpg:large","https://i.pinimg.com/originals/83/d9/aa/83d9aa54aa52b58943bcb94f168960b7.jpg","https://dlhc.ngelgames.net/e/wbpc_23012003.png"],"card_colors":["#3d3654","#3c3a56","#3b3e58","#3a415a","#39455c","#38495e","#374c60","#365062","#355464"],"custom_font":{"family":"'Comfortaa'","link":"Comfortaa:wght@400;700"}}, "preview": "https://i.pinimg.com/originals/83/d9/aa/83d9aa54aa52b58943bcb94f168960b7.jpg"},
        "theme-periwink": { "title": "Periwink by Mary", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#fff5f7","background-1":"#e6e7ef","background-2":"#fff5f7","borders":"#445472","links":"#3f4e6b","sidebar":"#969ab7","sidebar-text":"#455573","text-0":"#455573","text-1":"#455573","text-2":"#7387b0"}, "custom_cards":["https://i.pinimg.com/564x/6d/c2/bc/6dc2bcd61e2f14d34ca0e5a27d159c9c.jpg","https://i.pinimg.com/236x/a2/a4/67/a2a46702d04d2fbf02dca5b23ef4228d.jpg","https://i.pinimg.com/564x/f3/20/80/f32080c839509736c2a79bfbbb74d7ef.jpg","https://i.pinimg.com/236x/de/5e/09/de5e090f98505cf23f46da9ce8f4e7f5.jpg","https://i.pinimg.com/236x/aa/e8/2a/aae82a63f75b9baae07a283226541bfc.jpg","https://i.pinimg.com/236x/ff/47/d9/ff47d9db4c89e7173688f9b097edbc75.jpg","https://i.pinimg.com/236x/96/d1/18/96d118766f0a59b633bf54b6581c5ae4.jpg","https://i.pinimg.com/236x/26/9b/c9/269bc9de489b91993e3128dec6c50591.jpg","https://i.pinimg.com/236x/0f/ad/81/0fad810613fdaefce169bc52872e9c8b.jpg","https://i.pinimg.com/236x/e7/63/a9/e763a9dde21262f6d677778e9a3ec51f.jpg","https://i.pinimg.com/236x/8e/02/0d/8e020dfa27dc7a0b07dd945d9e796dd4.jpg","https://i.pinimg.com/564x/d7/94/d3/d794d3854ca3fe9cb42e15ef129a1da5.jpg","https://i.pinimg.com/236x/e5/48/65/e548655a4b04d42f3e3407be8f65ade2.jpg","https://i.pinimg.com/736x/ad/a9/ec/ada9ecd25ad571dbd931a9ab340d555c.jpg","https://i.pinimg.com/564x/40/50/b4/4050b4be61446fab140809da11aa5c02.jpg"],"card_colors":["#5e6989"],"custom_font":{"family":"'Comfortaa'","link":"Comfortaa:wght@400;700"}}, "preview": "https://i.pinimg.com/236x/a2/a4/67/a2a46702d04d2fbf02dca5b23ef4228d.jpg"},
        "theme-serene": { "title": "Serene by Aubrey", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#f0fff1","background-1":"#81a78a","background-2":"#779c78","borders":"#91c099","links":"#010902","sidebar":"#81a78a","sidebar-text":"#010902","text-0":"#000501","text-1":"#000501","text-2":"#000500"}, "custom_cards":["https://gifdb.com/images/thumbnail/green-aesthetic-anime-tea-pouring-vspd1gl3wrsfwgc0.gif","https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtRmrFbmUgOABnkeALiFTDuy4cn1O1fub5Jg&usqp=CAU","https://img.wattpad.com/c7fb0bb0554d036f45df61433d055b5d7ef10d62/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f776174747061642d6d656469612d736572766963652f53746f7279496d6167652f6332496f55786b616246646676673d3d2d313134363638353832352e3136623139303965353435363039653836373132323035353130372e676966","https://images.nightcafe.studio/jobs/W4Pj3A6sSzeYp2uL6Lyw/W4Pj3A6sSzeYp2uL6Lyw.jpg?tr=w-1600,c-at_max","https://64.media.tumblr.com/c6ab20de228a8aa509d3f8e1fb9654e8/tumblr_pdkhpkxNcE1t08lggo2_1280.png","https://custom-doodle.com/wp-content/uploads/doodle/cat-in-the-gardent-green-anime-aesthetic/cat-in-the-gardent-green-anime-aesthetic-doodle.gif"],"card_colors":["#808080"],"custom_font":{"family":"'Rakkas'","link":"Rakkas:wght@400;700"}}, "preview": "https://images.nightcafe.studio/jobs/W4Pj3A6sSzeYp2uL6Lyw/W4Pj3A6sSzeYp2uL6Lyw.jpg?tr=w-1600,c-at_max"},
        "theme-frogtoad": { "title": "Frog&Toad by Grungemuffin", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#e6e6e6","background-1":"#f5f5f5","background-2":"#d4d4d4","borders":"#c7cdd1","links":"#738678","sidebar":"#668326","sidebar-text":"#ffffff","text-0":"#9c5c1c","text-1":"#668326","text-2":"#a5a5a5"},"custom_cards":["https://i1.wp.com/www.slaphappylarry.com/wp-content/uploads/2020/04/Frog-and-Toad-riding-a-bicycle-built-for-two.jpeg?resize=525%2C387&ssl=1","http://3.bp.blogspot.com/-dBtjgNQXS5I/T9Z1NHBtICI/AAAAAAAAU1Q/7CG3WdZSxRU/s1600/frog-and-toad.jpg","https://i.pinimg.com/originals/30/96/59/30965954ef03454d3bab9153f6f5e33f.png","https://i0.wp.com/avdi.codes/wp-content/uploads/2019/05/Frog-and-Toad-illustratio-007.jpg?resize=460%2C276&ssl=1","https://media.newyorker.com/photos/5909772b1c7a8e33fb38f8dc/master/w_1600%2Cc_limit/FrogandToad2.jpg","https://i.pinimg.com/originals/03/cc/e9/03cce99bf3e0361ecd2a1b07ec32d470.jpg"],"card_colors":["#668326"],"custom_font":{"link":"Corben:wght@400;700","family":"'Corben'"}}, "preview": "https://i0.wp.com/avdi.codes/wp-content/uploads/2019/05/Frog-and-Toad-illustratio-007.jpg?resize=460%2C276&ssl=1"},
        "theme-tron": { "title": "Tron by Angel", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#000000","background-1":"#000000","background-2":"#000000","borders":"#000000","links":"#7dfdfe","sidebar":"#000000","sidebar-text":"#7dfdfe","text-0":"#7dfdfe","text-1":"#7dfdfe","text-2":"#7dfdfe"}, "custom_cards":["https://www.hollywoodreporter.com/wp-content/uploads/2023/08/MCDTRLE_EC040-H-2023.jpg","https://m0vie.files.wordpress.com/2010/12/tronlegacy3.jpg?w=584","https://images-prod.dazeddigital.com/862/0-0-862-575/azure/dazed-prod/610/2/612885.jpg","https://i.ytimg.com/vi/YyoKXfBQgXw/maxresdefault.jpg","https://lh3.googleusercontent.com/proxy/xso8Y-CNIWDVk9Nt6Kj5-icIcJgEH2jYCmS08hZeNxWvZ7DSL0UNBa2qMCciLo8QH2Htpv2b","https://i0.wp.com/www.artofvfx.com/wp-content/uploads/2011/03/TRONLEGACY_PF_VFX_05.jpg?fit=1200%2C675&ssl=1","https://m0vie.files.wordpress.com/2010/12/tronlegacy2.jpg?w=584","https://4.bp.blogspot.com/-utv3M4YQbRI/Vv7twW1o69I/AAAAAAAAWFA/wyONVSS4cwQKTv6dasSL1K15alu-T6E1g/s640/tron%2Blegacy%2B4.jpg"],"card_colors":["#7dfdfe"],"custom_font":{"family":"'Orbitron'","link":"Orbitron:wght@400;700"}}, "preview": "https://m0vie.files.wordpress.com/2010/12/tronlegacy2.jpg?w=584"},
        "theme-ultrakill": { "title": "ULTRAKILL by cringej0seph", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#000000","background-1":"#000000","background-2":"#000000","borders":"#ff0000","links":"#850000","sidebar":"linear-gradient(#000000, #850000)","sidebar-text":"#ff0000","text-0":"#ff0000","text-1":"#ff0000","text-2":"#ff0000"}, "custom_cards":["https://media1.tenor.com/m/fvPIoxOZfpYAAAAd/ultrakill-panopticon.gif","https://media.tenor.com/pppxt-J_UHEAAAAi/naptrix-ultrakill.gif","https://media.tenor.com/7w05Vx0dohgAAAAi/ultrakill-v1.gif","https://media.tenor.com/dkihW5ZeWREAAAAi/v2-ultrakill.gif","https://media1.tenor.com/m/ZIVst33YluUAAAAC/ultrakill-v1.gif","https://media1.tenor.com/m/EPCwkA7pU0YAAAAd/ultrakill-v1.gif","https://media1.tenor.com/m/SPwPzD2b4jIAAAAC/hop-on-ultrakill.gif","https://media1.tenor.com/m/gjJ961YDII4AAAAd/ultrakill.gif"],"card_colors":["#d90000","#d90000","#d90000","#d90000"],"custom_font":{"family":"'Silkscreen'","link":"Silkscreen:wght@400;700"}}, "preview": "https://media.tenor.com/dkihW5ZeWREAAAAi/v2-ultrakill.gif"},
        "theme-rainbow": { "title": "Rainbow by Olivia", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": true, "dark_preset":{"background-0":"#dbe4ff","background-1":"#838caf","background-2":"#88caf","borders":"#080821","links":"#121131","sidebar":"#c0c8f2","sidebar-text":"#424242","text-0":"#080821","text-1":"#080821","text-2":"#242461"}, "custom_cards":["https://i.pinimg.com/originals/cc/bf/3e/ccbf3e72eaa871a756997c8845b51b07.jpg", "https://i.etsystatic.com/11173961/r/il/888ec5/2778294284/il_fullxfull.2778294284_odl3.jpg", "https://e0.pxfuel.com/wallpapers/89/515/desktop-wallpaper-yellow-cute-cute-laptop-aesthetic-iphone-yellow-collage.jpg", "https://i.pinimg.com/originals/82/c2/f9/82c2f9a49fe2314c888d3e97337063f5.jpg", "https://wallpapers.com/images/hd/aesthetic-blue-collage-ix4imyjrgqsfdwv5.jpg", "https://static-01.daraz.pk/p/26e9404d3665f2702adf5b2c04c6db69.jpg", "https://i.pinimg.com/originals/f1/e0/1a/f1e01a671085d1978fe75096c2b36bf6.jpg", "https://parodyartprints.com/cdn/shop/products/p1_ba31958a-bab8-491b-bcfd-e28a2d069e28_1024x1024.jpg?v=1622569803"],"card_colors":["#080821"],"custom_font":{"family":"'Comfortaa'","link":"Comfortaa:wght@400;700"}}, "preview": "https://e0.pxfuel.com/wallpapers/89/515/desktop-wallpaper-yellow-cute-cute-laptop-aesthetic-iphone-yellow-collage.jpg"},

        "theme-hutcherson": { "title": "Hutcherson by Rachel", "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_mode": false, "custom_cards":["https://media1.tenor.com/m/b7PcCEZRv08AAAAC/josh-hutcherson.gif"],"card_colors":["#e1d5d7","#f06291","#65499d","#009688","#0b9be3","#ff2717","#d97900"],"custom_font":{"family":"'Oswald'","link":"Oswald:wght@400;700"}}, "preview": "https://media1.tenor.com/m/b7PcCEZRv08AAAAC/josh-hutcherson.gif"},
        "theme-bugs": { "title": "Bugs by Avery", "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_mode": false, "custom_cards": ["https://i.pinimg.com/564x/e4/0a/ef/e40aefac57a2318fdd89655c46c72edb.jpg", "https://i.pinimg.com/564x/f6/f2/eb/f6f2eb8fae2a1f1dd5fb0da549d7a9b4.jpg", "https://i.pinimg.com/564x/23/69/96/236996b8212a2141cb3d6f717fbce870.jpg", "https://i.pinimg.com/564x/ea/39/60/ea396036cfa456bcc86cb357adf0c899.jpg"], "card_colors": ["#f2f230", "#c2f261", "#91f291", "#61f2c2"], "custom_font": { "family": "'Corben'", "link": "Corben:wght@400;700" } }, "preview": "https://i.pinimg.com/564x/f6/f2/eb/f6f2eb8fae2a1f1dd5fb0da549d7a9b4.jpg" },
        "theme-affection": { "title": "Affection by Maggie", "exports": { "disable_color_overlay": false, "gradient_cards": true, "dark_mode": false, "custom_cards":["https://inasianspaces.files.wordpress.com/2024/01/itsuomi-charming-yuki-while-holding-tea-a-sign-of-affection-episode-3.png?w=1200","https://i.imgur.com/teoUw5s.png","https://i0.wp.com/anitrendz.net/news/wp-content/uploads/2023/10/asignofaffection_pv1screenshot.png","https://i.imgur.com/teoUw5s.png","https://rabujoi.files.wordpress.com/2024/01/soa41.jpg","https://i.imgur.com/qcmICyR.png","https://a.storyblok.com/f/178900/750x422/b8cde0dca4/a-sign-of-affection.jpg/m/filters:quality(95)format(webp)"],"card_colors":["#cdb4db","#ffc8dd","#ffafcc","#bde0fe","#a2d2ff","#cdb4db"],"custom_font":{"link":"Rakkas:wght@400;700","family":"'Rakkas'"}}, "preview": "https://rabujoi.files.wordpress.com/2024/01/soa41.jpg"},
        /*"theme-ghibli2": { "title": "Ghibli by Miranda", "exports": {  "disable_color_overlay": false, "gradient_cards": false, "dark_mode": false, "custom_cards":["https://i.pinimg.com/originals/25/ea/ca/25eaca70f864d594696ba342aef48dbf.gif","https://i.pinimg.com/originals/25/67/6e/25676e487e8f2ae81933863bc27f7712.gif","https://i.pinimg.com/564x/c5/05/4f/c5054fe8a45350aacea6b9d7931e23b2.jpg","https://i.pinimg.com/originals/0b/ce/49/0bce4952cb74ca61523207fcd1bb1323.gif","https://i.pinimg.com/originals/43/92/30/43923068f79f5093e5571dc82970a7c3.gif","https://i.pinimg.com/originals/9f/04/8a/9f048a908ac3d6765494c50f7b6860e1.gif"],"card_colors":["#9ea1ca","#858ae3","#bd959f","#856088","#8eb5f0","#4d3d4d"],"custom_font":{"family":"'Playfair Display'","link":"Playfair+Display:wght@400;700"}}, "preview": "https://i.pinimg.com/564x/c5/05/4f/c5054fe8a45350aacea6b9d7931e23b2.jpg"},*/
    }
    if (name === "all") return themes;
    return themes[name] || {};
}

function importTheme(theme) {
    try {
        let keys = Object.keys(theme);
        let final = {};
        chrome.storage.sync.get("custom_cards", sync => {
            keys.forEach(key => {
                switch (key) {
                    case "dark_preset":
                        changeToPresetCSS(null, theme["dark_preset"]);
                        break;
                    case "card_colors":
                        sendFromPopup("setcolors", theme["card_colors"]);
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

function updateCards(key, value) {
    chrome.storage.sync.get(["custom_cards"], result => {
        chrome.storage.sync.set({ "custom_cards": { ...result["custom_cards"], [key]: { ...result["custom_cards"][key], ...value } } }, () => {
            if (chrome.runtime.lastError) {
                displayAlert("The data you're entering is exceeding the storage limit, so it won't save. Try using shorter links, and make sure to press \"copy image address\" and not \"copy image\" for links.");
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

        const popularFonts = ["Arimo", "Barriecito", "Barlow", "Caveat", "Cinzel", "Comfortaa", "Corben", "DM Sans", "Expletus Sans", "Happy Monkey", "Inconsolata", "Inria Sans", "Jost", "Kanit", "Karla", "Lobster", "Lora", "Montserrat", "Nanum Myeongjo", "Open Sans", "Oswald", "Permanent Marker", "Playfair Display", "Poppins", "Quicksand", "Rakkas", "Redacted Script", "Roboto Mono", "Rubik", "Silkscreen", "Tektur"];
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

let removeAlert = null;

function clearAlert() {
    clearTimeout(removeAlert);
    document.querySelector("#alert").style.bottom = "-400px";
}

function displayAlert(msg) {
    clearTimeout(removeAlert);
    document.querySelector("#alert").style.bottom = "0";
    document.querySelector("#alert").textContent = msg;
    removeAlert = setTimeout(() => {
        clearAlert();
    }, 15000);
}

function setCustomImage(key, val) {
    if (val !== "" && val !== "none") {
        let test = new Image();
        test.onerror = () => {
            displayAlert("It seems that the image link you provided isn't working. Make sure to right click on any images you want to use and select \"copy image address\" to get the correct link.");

            // ensures storage limit error will override previous error
            updateCards(key, { "img": val });
        }
        test.onload = clearAlert;
        test.src = val;
    }
    updateCards(key, { "img": val });
}

function displayAdvancedCards() {
    sendFromPopup("getCards");
    chrome.storage.sync.get(["custom_cards", "custom_cards_2"], storage => {
        document.querySelector(".advanced-cards").innerHTML = '<div id="advanced-current"></div><div id="advanced-past"><h2>Past Courses</h2></div>';
        const keys = storage["custom_cards"] ? Object.keys(storage["custom_cards"]) : [];
        if (keys.length > 0) {
            let currentEnrollment = keys.reduce((max, key) => storage["custom_cards"][key]?.eid > max ? storage["custom_cards"][key].eid : max, -1);
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
                    container.innerHTML = '<div class="custom-card-header"><p class="custom-card-title"></p><div class="custom-card-hide"><p class="custom-key">Hide</p></div></div><div class="custom-card-inputs"><div class="custom-card-left"><div class="custom-card-image"><span class="custom-key">Image</span></div><div class="custom-card-name"><span class="custom-key">Name</span></div><div class="custom-card-code"><span class="custom-key">Code</span></div></div><div class="custom-links-container"><p class="custom-key">Links</p><div class="custom-links"></div></div></div>';
                    let imgInput = makeElement("input", "card-input", container.querySelector(".custom-card-image"));
                    let nameInput = makeElement("input", "card-input", container.querySelector(".custom-card-name"));
                    let codeInput = makeElement("input", "card-input", container.querySelector(".custom-card-code"));
                    let hideInput = makeElement("input", "card-input-checkbox", container.querySelector(".custom-card-hide"));
                    imgInput.placeholder = "Image url";
                    nameInput.placeholder = "Custom name";
                    codeInput.placeholder = "Custom code";
                    hideInput.type = "checkbox";
                    imgInput.value = card.img;
                    nameInput.value = card.name;
                    codeInput.value = card.code;
                    hideInput.checked = card.hidden;
                    if (card.img && card.img !== "") container.style.background = "linear-gradient(155deg, #1e1e1ef2 20%, #1e1e1ebf), url(\"" + card.img + "\") center / cover no-repeat";
                    imgInput.addEventListener("change", e => {
                        setCustomImage(key, e.target.value);
                        container.style.background = e.target.value === "" ? "#1e1e1e" : "linear-gradient(155deg, #1e1e1ef2 20%, #1e1e1ebf), url(\"" + e.target.value + "\") center / cover no-repeat";
                    });
                    nameInput.addEventListener("change", function (e) { updateCards(key, { "name": e.target.value }) });
                    codeInput.addEventListener("change", function (e) { updateCards(key, { "code": e.target.value }) });
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
            document.querySelector(".advanced-cards").innerHTML = `<div class="option-container"><h3>Couldn't find your cards!<br/>You may need to refresh your Canvas page and/or this menu page.<br/><br/>If you're having issues please contact me - ksucpea@gmail.com</h3></div>`;
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

/*
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
        chrome.storage.sync.set({ [option]: status });
        if (option === "auto_dark") {
            toggleDarkModeDisable(status);
        }
    });
});
*/

/*
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
        chrome.storage.local.set({ [option]: status });

        /*
        switch (option) {
            case 'dark_mode': chrome.storage.local.set({ dark_mode: status }); sendFromPopup("darkmode"); break;
        }
        /
    });
});
*/

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

//document.querySelector("#setToDefaults").addEventListener("click", setToDefaults);


function getPalette(name) {
    const colors = {
        "Blues": ["#ade8f4", "#90e0ef", "#48cae4", "#00b4d8", "#0096c7"],
        "Reds": ["#e01e37", "#c71f37", "#b21e35", "#a11d33", "#6e1423"],
        "Rainbow": ["#ff0000", "#ff5200", "#efea5a", "#3cf525", "#147df5", "#be0aff"],
        "Candy": ["#cdb4db", "#ffc8dd", "#ffafcc", "#bde0fe", "#a2d2ff"],
        "Purples": ["#e0aaff", "#c77dff", "#9d4edd", "#7b2cbf", "#5a189a"],
        "Pastels": ["#fff1e6", "#fde2e4", "#fad2e1", "#bee1e6", "#cddafd"],
        "Ocean": ["#22577a", "#38a3a5", "#57cc99", "#80ed99", "#c7f9cc"],
        "Sunset": ["#eaac8b", "#e56b6f", "#b56576", "#6d597a", "#355070"],
        "Army": ["#6b705c", "#a5a58d", "#b7b7a4", "#ffe8d6", "#ddbea9", "#cb997e"],
        "Pinks": ["#ff0a54", "#ff5c8a", "#ff85a1", "#ff99ac", "#fbb1bd"],
        "Watermelon": ["#386641", "#6a994e", "#a7c957", "#f2e8cf", "#bc4749"],
        "Popsicle": ["#70d6ff", "#ff70a6", "#ff9770", "#ffd670", "#e9ff70"],
        "Chess": ["#ffffff", "#000000"],
        "Greens": ["#d8f3dc", "#b7e4c7", "#95d5b2", "#74c69d", "#52b788"],
        "Fade": ["#ff69eb", "#ff86c8", "#ffa3a5", "#ffbf81", "#ffdc5e"],
        "Oranges": ["#ffc971", "#ffb627", "#ff9505", "#e2711d", "#cc5803"],
        "Mesa": ["#f6bd60", "#f28482", "#f5cac3", "#84a59d", "#f7ede2"],
        "Berries": ["#4cc9f0", "#4361ee", "#713aed", "#9348c3", "#f72585"],
        "Fade2": ["#f2f230", "#C2F261", "#91f291", "#61F2C2", "#30f2f2"],
        "Muted": ["#E7E6F7", "#E3D0D8", "#AEA3B0", "#827081", "#C6D2ED"],
        "Base": ["#e3b505", "#95190C", "#610345", "#107E7D", "#044B7F"],
        "Fruit": ["#7DDF64", "#C0DF85", "#DEB986", "#DB6C79", "#ED4D6E"],
        "Night": ["#25171A", "#4B244A", "#533A7B", "#6969B3", "#7F86C6"]
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

function showd() {

}

function displaySidebarMode(mode, style) {
    style = style.replace(" ", "");
    let match = style.match(/linear-gradient\((?<color1>\#\w*),(?<color2>\#\w*)\)/);
    let c1 = c2 = "#000000";

    if (mode === "image") {
        document.querySelector("#radio-sidebar-image").checked = true;
        document.querySelector("#sidebar-color2").style.display = "flex";
        document.querySelector("#sidebar-image").style.display = "flex";
        if (style.includes("url") && match) {
            if (match.groups.color1) c1 = match.groups.color1.replace("c7", "");
            if (match.groups.color2) c2 = match.groups.color2.replace("c7", "");
        }
        let url = style.match(/url\(\"(?<url>.*)\"\)/);
        document.querySelector('#sidebar-image input[type="text"]').value = url && url.groups.url ? url.groups.url : "";
    } else if (mode === "gradient") {
        document.querySelector("#radio-sidebar-gradient").checked = true;
        document.querySelector("#sidebar-color2").style.display = "flex";
        document.querySelector("#sidebar-image").style.display = "none";
        if (!style.includes("url") && match) {
            if (match.groups.color1) c1 = match.groups.color1;
            if (match.groups.color2) c2 = match.groups.color2;
        }
    } else {
        document.querySelector("#radio-sidebar-solid").checked = true;
        document.querySelector("#sidebar-color2").style.display = "none";
        document.querySelector("#sidebar-image").style.display = "none";
        c1 = match ? "#000000" : style;
    }

    document.querySelector('#sidebar-color1 input[type="text"]').value = c1;
    document.querySelector('#sidebar-color1 input[type="color"]').value = c1;
    document.querySelector('#sidebar-color2 input[type="text"]').value = c2;
    document.querySelector('#sidebar-color2 input[type="color"]').value = c2;
}

let presetChangeTimeout = null;

chrome.storage.sync.get(["dark_preset"], storage => {
    let tab = document.querySelector(".customize-dark");
    Object.keys(storage["dark_preset"]).forEach(key => {
        if (key !== "sidebar") {
            let c = tab.querySelector("#dp_" + key);
            let color = c.querySelector('input[type="color"]');
            let text = c.querySelector('input[type="text"]');
            [color, text].forEach(changer => {
                changer.value = storage["dark_preset"][key];
                changer.addEventListener("input", function (e) {
                    clearTimeout(presetChangeTimeout);
                    presetChangeTimeout = setTimeout(() => changeCSS(key, e.target.value), 200);
                });
            });
        } else {
            let mode = storage["dark_preset"][key].includes("url") ? "image" : storage["dark_preset"][key].includes("gradient") ? "gradient" : "solid";
            displaySidebarMode(mode, storage["dark_preset"][key]);
            let changeSidebar = () => {
                let c1 = tab.querySelector('#sidebar-color1 input[type="text"]').value.replace("c7", "");
                let c2 = tab.querySelector('#sidebar-color2 input[type="text"]').value.replace("c7", "");
                let url = tab.querySelector('#sidebar-image input[type="text"]').value;
                if (tab.querySelector("#radio-sidebar-image").checked) {
                    changeCSS(key, `linear-gradient(${c1}c7, ${c2}c7), center url("${url}")`);
                } else if (tab.querySelector("#radio-sidebar-gradient").checked) {
                    changeCSS(key, `linear-gradient(${c1}, ${c2})`);
                } else {
                    changeCSS(key, c1);
                }
            }
            ["#sidebar-color1", "#sidebar-color2"].forEach(group => {
                ['input[type="text"]', 'input[type="color"]'].forEach(input => {
                    document.querySelector(group + " " + input).addEventListener("input", e => {
                        ['input[type="text"]', 'input[type="color"]'].forEach(i => {
                            document.querySelector(group + " " + i).value = e.target.value;
                        });
                        clearTimeout(presetChangeTimeout);
                        presetChangeTimeout = setTimeout(() => changeSidebar(), 200);
                    });
                });
            });
            document.querySelector('#sidebar-image input[type="text"').addEventListener("change", () => changeSidebar());
        }
    });
});

function refreshColors() {
    chrome.storage.sync.get(["dark_preset"], storage => {
        Object.keys(storage["dark_preset"]).forEach(key => {
            let c = document.querySelector("#dp_" + key);
            let color = c.querySelector('input[type="color"]');
            let text = c.querySelector('input[type="text"]');
            color.value = storage["dark_preset"][key];
            text.value = storage["dark_preset"][key];
        });
        let mode = storage["dark_preset"]["sidebar"].includes("url") ? "image" : storage["dark_preset"]["sidebar"].includes("gradient") ? "gradient" : "solid";
        displaySidebarMode(mode, storage["dark_preset"]["sidebar"]);
    });
}

function changeCSS(name, color) {
    chrome.storage.sync.get("dark_preset", storage => {
        storage["dark_preset"][name] = color;
        /*
        let chopped = storage["dark_css"].split("--bcstop:#000}")[1];
        let css = "";
        Object.keys(storage["dark_preset"]).forEach(key => {
            css += ("--bc" + key + ":" + storage["dark_preset"][key] + ";");
        });
        */
        chrome.storage.sync.set({ /*"dark_css": ":root{" + css + "--bcstop:#000}" + chopped,*/ "dark_preset": storage["dark_preset"] }).then(() => refreshColors());
    });
}

function changeToPresetCSS(e, preset = null) {
    //chrome.storage.local.get(['dark_css'], function (result) {
    const presets = {
        "dark-lighter": { "background-0": "#272727", "background-1": "#353535", "background-2": "#404040", "borders": "#454545", "sidebar": "#353535", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
        "dark-light": { "background-0": "#202020", "background-1": "#2e2e2e", "background-2": "#4e4e4e", "borders": "#404040", "sidebar": "#2e2e2e", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
        "dark-default": { "background-0": "#161616", "background-1": "#1e1e1e", "background-2": "#262626", "borders": "#3c3c3c", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar": "#1e1e1e", "sidebar-text": "#f5f5f5" },
        "dark-dark": { "background-0": "#101010", "background-1": "#121212", "background-2": "#1a1a1a", "borders": "#272727", "sidebar": "#121212", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
        "dark-darker": { "background-0": "#000000", "background-1": "#000000", "background-2": "#000000", "borders": "#000000", "sidebar": "#000000", "text-0": "#c5c5c5", "text-1": "#c5c5c5", "text-2": "#c5c5c5", "links": "#c5c5c5", "sidebar-text": "#c5c5c5" },
        "dark-blue": { "background-0": "#14181d", "background-1": "#1a2026", "background-2": "#212930", "borders": "#2e3943", "sidebar": "#1a2026", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
        "dark-mint": { "background-0": "#0f0f0f", "background-1": "#0c0c0c", "background-2": "#141414", "borders": "#1e1e1e", "sidebar": "#0c0c0c", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#7CF3CB", "sidebar-text": "#f5f5f5" },
        "dark-burn": { "background-0": "#ffffff", "background-1": "#ffffff", "background-2": "#ffffff", "borders": "#cccccc", "sidebar": "#ffffff", "text-0": "#cccccc", "text-1": "#cccccc", "text-2": "#cccccc", "links": "#cccccc", "sidebar-text": "#cccccc" },
        "dark-unicorn": { "background-0": "#ff6090", "background-1": "#00C1FF", "background-2": "#FFFF00", "borders": "#FFFF00", "sidebar": "#00C1FF", "text-0": "#ffffff", "text-1": "#ffffff", "text-2": "#ffffff", "links": "#000000", "sidebar-text": "#ffffff" },
        "dark-lightmode": { "background-0": "#ffffff", "background-1": "#f5f5f5", "background-2": "#d4d4d4", "borders": "#c7cdd1", "links": "#04ff00", "sidebar": "#04ff00", "sidebar-text": "#ffffff", "text-0": "#2d3b45", "text-1": "#919191", "text-2": "#a5a5a5" },
        "dark-catppuccin": { "background-0": "#11111b", "background-1": "#181825", "background-2": "#1e1e2e", "borders": "#4f5463", "text-0": "#cdd6f4", "text-1": "#7f849c", "text-2": "#a6e3a1", "links": "#f5c2e7", "sidebar": "#181825", "sidebar-text": "#7f849c" },
        "dark-sage": { "background-0": "#2f3e46", "background-1": "#354f52", "background-2": "#52796f", "borders": "#84a98c", "links": "#d8f5c7", "sidebar": "#354f52", "sidebar-text": "#e2e8de", "text-0": "#e2e8de", "text-1": "#cad2c5", "text-2": "#adb1aa" },
        "dark-pink": { "background-0": "#ffffff", "background-1": "#ffe0ed", "background-2": "#ff0066", "borders": "#ff007b", "links": "#ff0088", "sidebar": "#f490b3", "sidebar-text": "#ffffff", "text-0": "#ff0095", "text-1": "#ff8f8f", "text-2": "#ff5c5c" },
    }
    if (preset === null) preset = presets[e.target.id] || presets["default"];
    applyPreset(preset);
    //});
}

function applyPreset(preset) {
    /*
    chrome.storage.local.get(["dark_preset", "dark_css"], storage => {
        let chopped = storage["dark_css"].split("--bcstop:#000}")[1];
        let css = "";
        Object.keys(preset).forEach(key => {
            css += ("--bc" + key + ":" + preset[key] + ";");
        });
        */
    chrome.storage.sync.set({ /*"dark_css": ":root{" + css + "--bcstop:#000}" + chopped,*/ "dark_preset": preset }).then(() => refreshColors());
    //});
}

/*
function setToDefaults() {
    fetch(chrome.runtime.getURL('js/darkcss.json'))
        .then((resp) => resp.json())
        .then(function (result) {
            chrome.storage.local.set({ "dark_css": result["dark_css"], "dark_preset": { "background-0": "#161616", "background-1": "#1e1e1e", "background-2": "#262626", "borders": "#3c3c3c", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar": "#1e1e1e", "sidebar-text": "#f5f5f5" } }).then(() => refreshColors());
        });
}
*/

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