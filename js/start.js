let host = window.location.hostname;
if(host.match(/canvas|instructure/g)) {
chrome.storage.local.get(['dark_mode'], function(result) {
    if(result.dark_mode === true) {
        let elmHead = document.documentElement;
        let elmStyle = document.createElement('link');  
        elmStyle.type = 'text/css';
        elmStyle.rel = 'stylesheet';
        elmStyle.href = chrome.extension.getURL("css/dark.css");
        elmHead.appendChild(elmStyle);
    }
});
}