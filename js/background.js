chrome.runtime.onInstalled.addListener(function () {
    let optionslist = ['new_install', 'assignments_due', 'gpa_calc', 'dark_mode', 'gradient_cards', 'link_preview', 'auto_dark', 'auto_dark_start', 'auto_dark_end', 'assignment_potentials', 'num_assignments', 'assignments_done'];
    optionslist.forEach(function (option) {
        chrome.storage.local.get([option], function (result) {
            if (Object.keys(result).length === 0) { // checking for empty keys
                switch (option) {
                    case 'new_install':
                        chrome.runtime.openOptionsPage();
                        chrome.storage.local.set({ new_install: true });
                        newInstallCSS();
                        break;
                    case 'assignments_due': chrome.storage.local.set({ assignments_due: true }); break;
                    case 'gpa_calc': chrome.storage.local.set({ gpa_calc: false }); break;
                    case 'link_preview': chrome.storage.local.set({ link_preview: false }); break;
                    case 'dark_mode': chrome.storage.local.set({ dark_mode: true }); break;
                    case 'gradient_cards': chrome.storage.local.set({ gradient_cards: false }); break;
                    case 'assignment_potentials': chrome.storage.local.set({ assignment_potentials: false }); break;
                    case 'auto_dark': chrome.storage.local.set({ auto_dark: false }); break;
                    case 'auto_dark_start': chrome.storage.local.set({ auto_dark_start: { "hour": "20", "minute": "00" } }); break;
                    case 'auto_dark_end': chrome.storage.local.set({ auto_dark_end: { "hour": "08", "minute": "00" } }); break;
                    case 'num_assignments': chrome.storage.local.set({ num_assignments: 5 });
                    case 'custom_domain': chrome.storage.local.set({ custom_domain: "" });
                    case 'dashboard_grades': chrome.storage.local.set({ dashboard_grades: false }); break;
                    case 'assignments_done': chrome.storage.local.set({ assignments_done: [] }); break;
                }
            }
        });
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