/*chrome.storage.local.get(["reduction"], function(result) {
    if(result.reduction === true) {
chrome.webNavigation.onCommitted.addListener(function(e) {
    if(e.url.match(/canvas|instructure|learn/g)) {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            let activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {"message": "darkmode"});
            chrome.tabs.sendMessage(activeTab.id, {"message": "autodarkmode"});
        });
    } 
});
    }
}); */

chrome.runtime.onInstalled.addListener(function(){
    let optionslist = ['new_install','assignments_due', 'gpa_calc', 'dark_mode', 'gradient_cards', 'link_preview', 'auto_dark', 'auto_dark_start', 'auto_dark_end', 'assignment_potentials'];
    optionslist.forEach(function(option) {
        chrome.storage.local.get([option], function(result) {
            if(Object.keys(result).length === 0) {
                switch(option) {
                    case 'new_install': 
                        chrome.runtime.openOptionsPage();
                        chrome.storage.local.set({new_install: true}); 
                        break;
                    case 'assignments_due': chrome.storage.local.set({assignments_due: true}); break;
                    case 'gpa_calc': chrome.storage.local.set({gpa_calc: false}); break;
                    case 'link_preview': chrome.storage.local.set({link_preview: false}); break;
                    case 'dark_mode': chrome.storage.local.set({dark_mode: true}); break;
                    case 'gradient_cards': chrome.storage.local.set({gradient_cards: false}); break;
                    case 'assignment_potentials': chrome.storage.local.set({assignment_potentials: false}); break;
                    case 'auto_dark': chrome.storage.local.set({auto_dark: false}); break;
                    case 'auto_dark_start': chrome.storage.local.set({auto_dark_start: {"hour": "20", "minute": "00"}}); break;
                    case 'auto_dark_end': chrome.storage.local.set({auto_dark_end: {"hour": "08", "minute": "00"}}); break;
                }
            }
        });
    });
    newInstallCSS();
});

function newInstallCSS() {
    fetch(chrome.extension.getURL('js/darkcss.json'))
    .then((resp) => resp.json())
    .then(function (result) {
        chrome.storage.local.set({dark_css: result.dark_css});
    });
    chrome.storage.local.set({new_install: false});
}