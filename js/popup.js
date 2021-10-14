let switches = ['assignments_due', 'gpa_calc', 'dark_mode', 'gradient_cards', 'link_preview', 'assignment_potentials'];

chrome.storage.local.get(['auto_dark', 'auto_dark_start', 'auto_dark_end'], function(result) {
    document.querySelector('#autodark').checked = result.auto_dark;
    document.querySelector('#autodark_start').value = result.auto_dark_start["hour"] + ":" + result.auto_dark_start["minute"];
    document.querySelector('#autodark_end').value = result.auto_dark_end["hour"] + ":" + result.auto_dark_end["minute"];
    toggleDarkModeDisable(result.auto_dark);
});

document.querySelector('#autodark').addEventListener('change', function() {
    let status = this.checked;
    toggleDarkModeDisable(status);
    chrome.storage.local.set({auto_dark: status}, sendFromPopup("autodarkmode"));
});

switches.forEach(function(option){
    chrome.storage.local.get(option, function(result) {
        let status = result[option] === true ? "#on" : "#off";
        document.querySelector('#' + option + ' > '+status).setAttribute('checked', true);
        document.querySelector('#' + option + ' > '+status).classList.add('checked');
    });
    document.querySelector('#'+option+' > .slider').addEventListener('mouseup', function() {
        document.querySelectorAll('#'+option+' > input').forEach(function(box) { 
            box.toggleAttribute('checked');
            box.classList.toggle('checked');
        });
        let status = document.querySelector('#'+option+' > #on').checked;
        switch(option) {
            case 'gpa_calc': chrome.storage.local.set({gpa_calc: status}); break;
            case 'assignments_due': chrome.storage.local.set({assignments_due: status}); break;
            case 'gradient_cards': chrome.storage.local.set({gradient_cards: status}); break;
            case 'link_preview': chrome.storage.local.set({link_preview: status}); break;
            case 'assignment_potentials': chrome.storage.local.set({assignment_potentials: status}); break;
            case 'dark_mode': chrome.storage.local.set({dark_mode: status}); sendFromPopup("darkmode"); break;
        }
    });
});

['autodark_start', 'autodark_end'].forEach(function(timeset) {
    document.querySelector('#'+timeset).addEventListener('change', function() {
        let timeinput = {"hour": this.value.split(':')[0], "minute": this.value.split(':')[1]};
        timeset === "autodark_start" ? chrome.storage.local.set({auto_dark_start: timeinput}) : chrome.storage.local.set({auto_dark_end: timeinput});
        sendFromPopup("autodarkmode");
    });
});

function toggleDarkModeDisable(disabled) {
    let darkSwitch = document.querySelector('#dark_mode');
    if(disabled === true) {
        darkSwitch.classList.add('switch_disabled');
        darkSwitch.style.pointerEvents = "none";
    } else {
        darkSwitch.classList.remove('switch_disabled');
        darkSwitch.style.pointerEvents = "auto";
    }
}

function sendFromPopup(message) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
        let activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"message": message});
    });
}