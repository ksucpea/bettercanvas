'use strict';

let optionslist = ['assignments_due', 'gpa_calc', 'dark_mode', 'gradient_cards', 'link_preview'];
chrome.storage.local.get(['link_preview'], function(result) {
    if(result.link_preview == null) {
        chrome.storage.local.set({assignments_due: true});
        chrome.storage.local.set({gpa_calc: true});
        chrome.storage.local.set({link_preview: true});
        chrome.storage.local.set({dark_mode: false});
        chrome.storage.local.set({gradient_cards: false});
    }
    checkthem();
});
function checkthem() {
    optionslist.forEach(function(option) {
        chrome.storage.local.get(option, function(result) {
            if(result[option] === true) {
                document.querySelector('#'+option+' > #on').setAttribute('checked', true);
                document.querySelector('#'+option+' > #on').classList.add('checked');
            } else if(result[option] === false) {
                document.querySelector('#'+option+' > #off').setAttribute('checked', true);
                document.querySelector('#'+option+' > #off').classList.add('checked');
            }
        });
        document.querySelector('#'+option).addEventListener('mouseup', function() {
            document.querySelectorAll('#'+option+' > input').forEach(function(box) { 
                box.toggleAttribute('checked');box.classList.toggle('checked');
            });
            let status = document.querySelector('#'+option+' > #on').checked;
            switch(option) {
                case 'dark_mode': chrome.storage.local.set({dark_mode: status}); break;
                case 'gpa_calc': chrome.storage.local.set({gpa_calc: status}); break;
                case 'assignments_due': chrome.storage.local.set({assignments_due: status}); break;
                case 'gradient_cards': chrome.storage.local.set({gradient_cards: status}); break;
                case 'link_preview': chrome.storage.local.set({link_preview: status}); break;
            }
        });
    });
}
document.querySelector('#explanationsbtn').addEventListener('click', function() {
    document.querySelector('.explanations').style.display = document.querySelector('.explanations').style.display == 'none' ? 'block' : 'none';
});