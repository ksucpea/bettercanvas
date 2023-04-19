chrome.runtime.onInstalled.addListener(function () {
    let optionslist = ['new_install', 'assignments_due', 'gpa_calc', 'dark_mode', 'gradient_cards', 'link_preview', 'auto_dark', 'auto_dark_start', 'auto_dark_end', 'assignment_potentials', 'num_assignments', 'assignments_done', 'assignment_date_format', 'assignments_quizzes', 'assignments_discussions', 'dashboard_notes', 'dashboard_notes_text', 'improved_todo', 'todo_hr24', 'condensed_cards', 'custom_cards', 'custom_assignments', 'grade_hover', 'hide_completed'];
    chrome.storage.local.get(optionslist, function (result) {
        let newOptions = {};
        optionslist.forEach(function (option) {
            console.log(result);
            if (result[option] === undefined) { // checking for empty keys
                switch (option) {
                    case 'new_install':
                        chrome.runtime.openOptionsPage();
                        newOptions.new_install = true;
                        newInstallCSS();
                        break;
                    case 'assignments_due': newOptions.assignments_due = true; break;
                    case 'gpa_calc': newOptions.gpa_calc = false; break;
                    case 'link_preview': newOptions.link_preview =false; break;
                    case 'dark_mode': newOptions.dark_mode = true; break;
                    case 'gradient_cards': newOptions.gradient_cards = false; break;
                    case 'assignment_potentials': newOptions.assignment_potentials = false; break;
                    case 'auto_dark': newOptions.auto_dark =false; break;
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
                    case 'improved_todo': newOptions.improved_todo = true; break;
                    case 'todo_hr24': newOptions.todo_hr24 = false; break;
                    case 'condensed_cards': newOptions.condensed_cards = false; break;
                    case 'custom_cards': newOptions.custom_cards = {}; newOptions.custom_domain = ""; break;
                    case 'custom_assignments': newOptions.custom_assignments = []; break;
                    case 'grade_hover': newOptions.grade_hover = false; break;
                    case 'hide_completed': newOptions.hide_completed = false; break;
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
    chrome.storage.local.set({ new_install: false });
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