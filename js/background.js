chrome.runtime.onInstalled.addListener(function () {

    let default_options = {
        "local": {
            "previous_colors": null,
            "previous_theme": null,
            "errors": [],
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
            "dashboard_grades": false,
            "assignment_date_format": false,
            "dashboard_notes": false,
            "dashboard_notes_text": "",
            "better_todo": false,
            "todo_hr24": false,
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
            "todo_overdues": false,
            "card_overdues": false,
            "relative_dues": false,
            "hide_feedback": false,
            "dark_mode_fix": [],
            "assignment_states": {},
            "tab_icons": false,
            "todo_colors": false,
            "device_dark": false,
            "cumulative_gpa": { "name": "Cumulative GPA", "hidden": false, "weight": "dnc", "credits": 999, "gr": 3.21 },
            "show_updates": false,
            "card_method_date": false,
            "card_method_dashboard": false,
            "card_limit": 25,
        }
    };

    const updateMsg = "Better Canvas was just updated!\nThis version added new themes, cumulative GPA into the GPA calculator, and a new sorting function for themes.";

    chrome.storage.local.get(null, local => {
        chrome.storage.sync.get(null, sync => {
            let newSyncOptions = {"update_msg": updateMsg};
            let newLocalOptions = {};
            Object.keys(default_options["sync"]).forEach(option => {
                if (sync[option] !== undefined) return;
                newSyncOptions[option] = default_options["sync"][option];
            });
            Object.keys(default_options["local"]).forEach(option => {
                if (local[option] !== undefined) return;
                newLocalOptions[option] = default_options["local"][option];
            })

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
});

chrome.runtime.setUninstallURL("https://diditupe.dev/bettercanvas/goodbye");


/*
const syncedOptions = [
    'full_width',
    'new_install',
    'hover_preview',
    'num_todo_items',
    'assignments_due',
    'gpa_calc',
    'gpa_calc_bounds',
    'gradient_cards',
    'disable_color_overlay',
    'auto_dark',
    'auto_dark_start',
    'auto_dark_end',
    'num_assignments',
    'assignments_done',
    'assignment_date_format',
    'dashboard_notes',
    'dashboard_notes_text',
    'better_todo',
    'todo_hr24',
    'condensed_cards',
    'custom_cards',
    'custom_cards_2',
    'custom_assignments',
    'custom_assignments_overflow',
    'grade_hover',
    'hide_completed',
    'hide_completed_cards',
    'custom_font',
    'todo_overdues',
    'card_overdues',
    'relative_dues',
    'remlogo',
    'device_dark',
    'dark_mode',
    'dark_preset',
    'custom_domain',
    'hide_feedback',
    'dark_mode_fix',
    "assignment_states",
];
const localOptions = [
    'previous_colors',
    'previous_theme',
    'errors',
    /*
    'dark_mode',
    'dark_css',
    'dark_preset',
    'custom_domain
];
*/

/*
function moveLocalToSync() {
    if (local[option] !== undefined) {
        if (option === "new_install") {
            default_options["new_install"] = false;
        } else {
            default_options[option] = local[option];
        }
        chrome.storage.local.remove(option);
    }
}
*/

// add custom grade
            /*
            let old_cc = sync["custom_cards"] ? Object.keys(sync["custom_cards_2"]) : [] 
            if (old_cc.length > 0) {
                newSyncOptions["custom_cards"] = sync["custom_cards"];
                old_cc.forEach(id => {
                    if (newSyncOptions["custom_cards"][id]["gr"] === undefined) newSyncOptions["custom_cards"][id]["gr"] = null;
                });
            }
            */

            // converting old links to new system REMOVE IN > 5.8.0
            /*
            try {
                let old_cc2 = sync["custom_cards_2"] ? Object.keys(sync["custom_cards_2"]) : [];
                if (old_cc2.length > 0) {
                    newSyncOptions["custom_cards_2"] = sync["custom_cards_2"];
                    // CHECK IF THE 5.7.3 SYSTEM STILL EXISTS
                    old_cc2.forEach(id => {
                        if (sync["custom_cards_2"][id] && sync["custom_cards_2"][id]["links"] && sync["custom_cards_2"][id]["links"]["custom"]) {
                            let links = [
                                { "is_default": true, "path": "default" },
                                { "is_default": true, "path": "default" },
                                { "is_default": true, "path": "default" },
                                { "is_default": true, "path": "default" }
                            ];
                            for (let i = 0; i < sync["custom_cards_2"][id]["links"]["custom"].length; i++) {
                                if (sync["custom_cards_2"][id]["links"]["custom"][i].default === false) {
                                    links[i].is_default = false;
                                    links[i].path = sync["custom_cards_2"][id]["links"]["custom"][i].path;
                                }
                            }
                            newSyncOptions["custom_cards_2"][id]["links"] = links;
                            // REMAP THE 5.7.6 SYSTEM TO REMOVE UNNECCESARY STUFF
                        } else if (sync["custom_cards_2"][id] && sync["custom_cards_2"][id]["links"]) {
                            newSyncOptions["custom_cards_2"][id]["links"] = sync["custom_cards_2"][id]["links"].map(link => { return { "is_default": link.is_default, "path": link.path } });
                        }
                    });
                }
            } catch (e) {
                console.log("ERROR CONVERTING OLD LINKS...");
            }
            /// end conversion
            */

            /*
            let preset = local["dark_preset"] || default_options["dark_preset"];

            // converting dark mode to new system REMOVE IN > 5.8.0 
            if (local["dark_css"]) {
                try {
                    const colors = local["dark_css"].split(":root{")[1].split("--bcstop:#000}")[0];
                    colors.split(";").forEach(color => {
                        const [key, code] = color.split(":");
                        console.log(key, code, preset);
                        switch (key) {
                            case "--bcbackgrounddark0": preset["background-0"] = code; break;
                            case "--bcbackgrounddark1": preset["background-1"] = code; preset["sidebar"] = code; break;
                            case "--bcbackgrounddark2": preset["background-2"] = code; break;
                            case "--bcbackgrounddark3": preset["borders"] = code; break;
                            case "--bctextlight0": preset["text-0"] = code; preset["sidebar-text"] = code; break;
                            case "--bctextlight1": preset["text-1"] = code; break;
                            case "--bctextlight2": preset["text-2"] = code; break;
                            case "--bctextlink": preset["links"] = code; break;
                        }
                    });
                } catch (e) {
                    preset = default_options["dark_preset"];
                }
                local["dark_preset"] = preset;
                
            } else {
                console.log("no darkcss detected...");
            }
            */
            // end conversion
