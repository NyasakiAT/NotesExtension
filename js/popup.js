let showNotes = document.getElementById("showNotes");

showNotes.addEventListener("click", () => {
    extension_id = chrome.runtime.id
    let url = "chrome-extension://" + extension_id + "/html/index.html"
    window.open(url, '_blank').focus();
    chrome.tabs.create({
        url: url
    });
});