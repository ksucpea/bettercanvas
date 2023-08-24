chrome.runtime.onInstalled.addListener(function () {
    const syncedOptions = ['full_width', 'new_install', 'hover_preview', 'num_todo_items', 'assignments_due', 'gpa_calc', 'gpa_calc_bounds', 'gradient_cards', 'disable_color_overlay', 'auto_dark', 'auto_dark_start', 'auto_dark_end', 'num_assignments', 'assignments_done', 'assignment_date_format', 'dashboard_notes', 'dashboard_notes_text', 'better_todo', 'todo_hr24', 'condensed_cards', 'custom_cards', 'custom_cards_2', 'custom_assignments', 'custom_assignments_overflow', 'grade_hover', 'hide_completed', 'custom_font'];
    const localOptions = ['dark_mode', 'dark_css', 'custom_domain'];
    let default_options = {
        "new_install": true,
        "assignments_due": true,
        "gpa_calc": false,
        "dark_mode": true,
        "gradent_cards": false,
        "disable_color_overlay": false,
        "auto_dark": false,
        "auto_dark_start": { "hour": "20", "minute": "00" },
        "auto_dark_end": { "hour": "08", "minute": "00" },
        "num_assignments": 5,
        "custom_domain": [""],
        "assignments_done": [],
        "dashboard_grades": false,
        "assignment_date_format": false,
        "dashboard_notes": false,
        "dashboard_notes_text": "",
        "better_todo": false,
        "todo_hr24": false,
        "condensed_cards": false,
        "custom_cards": {},
        "custom_cards_2": {},
        "custom_assignments": [],
        "custom_assignments_overflow": ["custom_assignments"],
        "grade_hover": false,
        "hide_completed": false,
        "num_todo_items": 5,
        "custom_font": { "link": "", "family": "" },
        "hover_preview": true,
        "full_width": false,
        "gpa_calc_bounds": {
            "A+": { "cutoff": 97, "gpa": 4.3 },
            "A": { "cutoff": 93, "gpa": 4 },
            "A-": { "cutoff": 90, "gpa": 3.7 },
            "B+": { "cutoff": 87, "gpa": 3.3 },
            "B": { "cutoff": 83, "gpa": 3 },
            "B-": { "cutoff": 80, "gpa": 2.7 },
            "C+": { "cutoff": 77, "gpa": 2.3 },
            "C": { "cutoff": 73, "gpa": 2 },
            "C-": { "cutoff": 70, "gpa": 1.7 },
            "D+": { "cutoff": 67, "gpa": 1.3 },
            "D": { "cutoff": 63, "gpa": 1 },
            "D-": { "cutoff": 60, "gpa": .7 },
            "F": { "cutoff": 0, "gpa": 0 }
        }
    };

    chrome.storage.local.get([...syncedOptions, "improved_todo"], local => {
        // moving relevant local options to sync
        chrome.storage.sync.get(syncedOptions, sync => {

            let newOptions = {};
            // renamed this option
            if (local["improved_todo"] !== undefined) {
                default_options["better_todo"] = local["improved_todo"];
                chrome.storage.local.remove("improved_todo");
            }

            // every other option
            syncedOptions.forEach(function (option) {
                if (local[option] !== undefined) {
                    if (option === "new_install") {
                        default_options["new_install"] = false;
                    } else {
                        default_options[option] = local[option];
                    }
                    chrome.storage.local.remove(option);
                }

                if (sync[option] === undefined) { // checking for empty keys
                    newOptions[option] = default_options[option];
                }
            });

            if (Object.keys(newOptions).length > 0) {
                chrome.storage.sync.set(newOptions).then(() => {
                    if (newOptions.new_install === true) {
                        chrome.runtime.openOptionsPage();
                        chrome.storage.sync.set({ new_install: false });
                    }
                });
            }
        });
    });

    chrome.storage.local.get(localOptions, storage => {
        let newOptions = {};
        localOptions.forEach(option => {
            if (storage[option] === undefined) {
                switch (option) {
                    case ("custom_domain"): newOptions.custom_domain = default_options["custom_domain"];
                    case ("dark_mode"): newOptions.dark_mode = default_options["dark_mode"]; break;
                    case ("dark_css"): newInstallCSS(); break;
                }
            }
        });
        if (Object.keys(newOptions).length > 0) {
            chrome.storage.local.set(newOptions);
        }
    });

    updateNewCSS();
});

chrome.runtime.setUninstallURL("https://diditupe.dev/bettercanvas/goodbye");

function newInstallCSS() {
    fetch(chrome.runtime.getURL('js/darkcss.json'))
        .then((resp) => resp.json())
        .then(function (result) {
            chrome.storage.local.set({ dark_css: result.dark_css });
        });
    chrome.storage.sync.set({ new_install: false });
}


function updateNewCSS() {
    fetch(chrome.runtime.getURL('js/darkcss.json'))
        .then((resp) => resp.json())
        .then(function (updated) {
            chrome.storage.local.get(['dark_css'], function (current) {
                if (!current.dark_css) return;
                const old = current.dark_css.split('--bcstop:#000}')[0];
                const cur = updated.dark_css.split('--bcstop:#000}')[1];
                const new_dark_css = old + "--bcstop:#000}" + cur;
                chrome.storage.local.set({ dark_css: new_dark_css });
            });
        });
}