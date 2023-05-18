chrome.runtime.onInstalled.addListener(function () {
    const syncedOptions = ['new_install', 'hover_preview', 'num_todo_items', 'assignments_due', 'gpa_calc', 'gpa_calc_bounds', 'gradient_cards', 'disable_color_overlay', 'link_preview', 'auto_dark', 'auto_dark_start', 'auto_dark_end', 'num_assignments', 'assignments_done', 'assignment_date_format', 'assignments_quizzes', 'assignments_discussions', 'dashboard_notes', 'dashboard_notes_text', 'better_todo', 'todo_hr24', 'condensed_cards', 'custom_cards', 'custom_cards_2', 'custom_assignments', 'custom_assignments_overflow', 'grade_hover', 'hide_completed', 'custom_font'];
    const localOptions = ['dark_mode', 'dark_css'];

    chrome.storage.sync.get(syncedOptions, function (result) {
        let newOptions = {};
        syncedOptions.forEach(function (option) {
            if (result[option] === undefined) { // checking for empty keys
                switch (option) {
                    case 'new_install':
                        newOptions.new_install = true;
                        break;
                    case 'assignments_due': newOptions.assignments_due = true; break;
                    case 'gpa_calc': newOptions.gpa_calc = false; break;
                    case 'link_preview': newOptions.link_preview = false; break;
                    case 'dark_mode': newOptions.dark_mode = true; break;
                    case 'gradient_cards': newOptions.gradient_cards = false; break;
                    case 'disable_color_overlay': newOptions.disable_color_overlay = false; break;
                    case 'assignment_potentials': newOptions.assignment_potentials = false; break;
                    case 'auto_dark': newOptions.auto_dark = false; break;
                    case 'auto_dark_start': newOptions.auto_dark_start = { "hour": "20", "minute": "00" }; break;
                    case 'auto_dark_end': newOptions.auto_dark_end = { "hour": "08", "minute": "00" }; break;
                    case 'num_assignments': newOptions.num_assignments = 5; break;
                    case 'custom_domain': newOptions.custom_domain = ""; break;
                    case 'assignments_done': newOptions.assignments_done = []; break;
                    case 'dashboard_grades': newOptions.dashboard_grades = false; break;
                    case 'assignment_date_format': newOptions.assignment_date_format = false; break;
                    case 'assignments_quizzes': newOptions.assignments_quizzes = true; break;
                    case 'assignments_discussions': newOptions.assignments_discussions = true; break;
                    case 'dashboard_notes': newOptions.dashboard_notes = false; break;
                    case 'dashboard_notes_text': newOptions.dashboard_notes_text = ""; break;
                    case 'better_todo': newOptions.better_todo = false; break;
                    case 'todo_hr24': newOptions.todo_hr24 = false; break;
                    case 'condensed_cards': newOptions.condensed_cards = false; break;
                    case 'custom_cards': newOptions.custom_cards = {}; newOptions.custom_domain = ""; break;
                    case 'custom_cards_2': newOptions.custom_cards_2 = {}; newOptions.custom_domain = ""; break;
                    case 'custom_assignments': newOptions.custom_assignments = []; break;
                    case 'custom_assignments_overflow': newOptions.custom_assignments_overflow = ["custom_assignments"]; break;
                    case 'grade_hover': newOptions.grade_hover = false; break;
                    case 'hide_completed': newOptions.hide_completed = false; break;
                    case 'num_todo_items': newOptions.num_todo_items = 5; break;
                    case 'custom_font': newOptions.custom_font = {"link": "", "family": ""};
                    case 'hover_preview': newOptions.hover_preview = true; break;
                    case 'gpa_calc_bounds': newOptions.gpa_calc_bounds = {
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
                    };
                    break;
                }
            }
        });
        if (Object.keys(newOptions).length > 0) {
            console.log(newOptions);
            chrome.storage.sync.set(newOptions).then(() => {
                if (newOptions.new_install === true) {
                    chrome.runtime.openOptionsPage();
                }
            });
        }
    });

    chrome.storage.local.get(localOptions, storage => {
        let newOptions = {};
        localOptions.forEach(option => {
            if (storage[option] === undefined) {
                switch (option) {
                    case ("dark_mode"): newOptions.dark_mode = true; break;
                    case ("dark_css"): newInstallCSS(); break;
                }
            }
        });
        if (Object.keys(newOptions).length > 0) {
            console.log(newOptions);
            chrome.storage.local.set(newOptions);
        }
    });

    updateNewCSS();
});

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