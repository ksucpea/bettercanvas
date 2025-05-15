/******/ (() => { // webpackBootstrap
chrome.runtime.onInstalled.addListener(function () {

    let default_options = {
        "local": {
            "previous_colors": null,
            "previous_theme": null,
            "errors": [],
            "saved_themes": {},
            "liked_themes": [],
            "last_search": 0,
            "search_cache": { "files": [], "pages": [], "modules": [] },
        },
        "sync": {
            "dark_preset": {
                "background-0": "#161616",
                "background-1": "#1e1e1e",
                "background-2": "#262626",
                "borders": "#3c3c3c",
                "text-0": "#f5f5f5",
                "text-1": "#e2e2e2",
                "text-2": "#ababab",
                "links": "#56Caf0",
                "sidebar": "#1e1e1e",
                "sidebar-text": "#f5f5f5"
            },
            "new_install": true,
            "assignments_due": true,
            "gpa_calc": false,
            "dark_mode": true,
            "gradent_cards": false,
            "disable_color_overlay": false,
            "auto_dark": false,
            "auto_dark_start": { "hour": "20", "minute": "00" },
            "auto_dark_end": { "hour": "08", "minute": "00" },
            "num_assignments": 4,
            "custom_domain": [""],
            "assignments_done": [],
            "dashboard_grades": true,
            "assignment_date_format": false,
            "dashboard_notes": false,
            "dashboard_notes_text": "",
            "better_todo": true,
            "condensed_cards": false,
            "custom_cards": {},
            "custom_cards_2": {},
            "custom_cards_3": {},
            "custom_assignments": [],
            "custom_assignments_overflow": ["custom_assignments"],
            "grade_hover": false,
            "hide_completed": false,
            "num_todo_items": 4,
            "custom_font": { "link": "", "family": "" },
            "hover_preview": true,
            "full_width": null,
            "remlogo": null,
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
            },
            "card_overdues": false,
            "relative_dues": false,
            "hide_feedback": false,
            "dark_mode_fix": [],
            "assignment_states": {},
            "tab_icons": false,
            "device_dark": false,
            "cumulative_gpa": { "name": "Cumulative GPA", "hidden": false, "weight": "dnc", "credits": 999, "gr": 3.21 },
            "show_updates": false,
            "card_method_date": false,
            "card_method_dashboard": false,
            "card_limit": 25,
            "remind": false,
            "reminders": [],
            "reminder_count": 1,
            "multi_remind": false,
            "id": "",
            "new_browser": null,
            "gpa_calc_cumulative": false,
            "gpa_calc_weighted": true,
            "browser_show_likes": false,
            "custom_styles": "",
            "semester_recap": true,
            "onboard": false,
            "token": "",

            "editor_last": null,
            "timer_open": false,
            "timer_focus": { "min": 25, "sec": 0 },
            "timer_break": { "min": 5, "sec": 0 },
            "timer_start": 0,
            "timer_type": "focus",
            "timer_pause": 0,
            "todo_hr24": false,
            "todo_overdues": true,
            "todo_time": "week",
            "todo_type": "assignments",
            "todo_colors": true,
            "todo_openall": false,
            "todo_completed": [],
            "todo_style": "circle",
            "todo_history": [],
            "todo_read": [],
            "todo_confetti": "normal",
            "todo_question": false,
            "clean_sidebar": false,
            "sidebar_pages": { "init": false, "active": ["Perks"], "hidden": [] },
            "sidebar_collapsed": [],
            "sidebar_small": false,
            "global_search": false,
            "screen_border": true,
            "update_messagev1": false,
            "rounder_cards": true,
            "perks_popup": false,

            "todo_style_general": "modern"
        }
    };

    const updateMsg = "Better Canvas was just updated!\nThis version added new themes, cumulative GPA into the GPA calculator, and a new sorting function for themes.";

    chrome.storage.local.get(null, local => {
        chrome.storage.sync.get(null, async sync => {
            let newSyncOptions = { "update_msg": updateMsg };
            let newLocalOptions = {};
            Object.keys(default_options["sync"]).forEach(option => {
                if (sync[option] !== undefined) return;
                newSyncOptions[option] = default_options["sync"][option];
            });
            Object.keys(default_options["local"]).forEach(option => {
                if (local[option] !== undefined) return;
                newLocalOptions[option] = default_options["local"][option];
            })

            // if there are no custom cards OR there are card_ids then skip this
            if (!sync["custom_cards"] || (sync["card_ids"] && sync["card_ids"].length > 0)) {
                //good to go
            } else {
                newSyncOptions["card_ids"] = [];
                newSyncOptions["todo_style_general"] = sync["better_todo"] === true ? "minimal" : "modern";

                Object.keys(sync["custom_cards"]).forEach(key => {
                    try {
                        newSyncOptions["card_ids"].push(key);
                        newSyncOptions["card_" + key] = { ...sync["custom_cards"][key], ...sync["custom_cards_2"][key], ...sync["custom_cards_3"][key] };
                    } catch (e) {
                        console.error(e);
                    }
                });
    
            }

            if (Object.keys(newLocalOptions).length > 0) {
                chrome.storage.local.set(newLocalOptions);
            }

            if (Object.keys(newSyncOptions).length > 0) {
                chrome.storage.sync.set(newSyncOptions).then(() => {
                    console.log(newSyncOptions);
                    if (newSyncOptions.new_install === true) {
                        chrome.runtime.openOptionsPage();
                        chrome.storage.sync.set({ new_install: false });
                    }
                });
            }
        });
    });

    /*
    // update old custom cards to new system (will only work if the user was on a previous version)
    chrome.storage.sync.get(["card_ids", "custom_cards", "custom_cards_2", "custom_cards_3", "better_todo"], storage => {
        if (!storage["custom_cards"] || (storage["card_ids"] && storage["card_ids"].length > 0)) return;
        console.log("storage here", storage);
        const updates = {
            "card_ids": [],
            "todo_style_general": storage["better_todo"] === true ? "minimal" : "modern",
        };
        Object.keys(storage["custom_cards"]).forEach(key => {
            try {
                updates["card_ids"].push(key);
                updates["card_" + key] = { ...storage["custom_cards"][key], ...storage["custom_cards_2"][key], ...storage["custom_cards_3"][key] };
            } catch (e) {
                console.error(e);
            }
        });

        console.log("updates here", updates);

        chrome.storage.sync.set(updates);
    });
    */
});

chrome.runtime.onMessage.addListener(async (message) => {
    /*
    if (message.type === "recap_update") {
        const storage = await chrome.storage.sync.get(message.data.map(item => item.statistic));
        message.data.forEach(item => {
            if (item.statistic === "recap_themesCount") {
                storage["recap_themesCount"] += item.value;
            }
        });
    } else if (message.type === "elapsedTime") {
        const storage = await chrome.storage.sync.get("recap_elapsedTime");
        console.log(storage);
        await chrome.storage.sync.set({ "recap_elapsedTime": storage["recap_elapsedTime"] + (message?.time || 0) });
    } else if (message.type === "openCalculator") {
        await chrome.action.openPopup();
        await chrome.runtime.sendMessage({ "type": "openEditorTab" });
    }
        */
});

chrome.runtime.setUninstallURL("https://diditupe.dev/bettercanvas/goodbye");

/******/ })()
;