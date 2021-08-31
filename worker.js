chrome.contextMenus.create({
    title: "Save as note",
    id: "SAVE_NOTE",
    contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener(save_note)


function save_note(info, tab) {
    let note_id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

    let data = {
        note_id: {
            url: info.url,
            text: info.selectionText
        }
    }

    chrome.storage.sync.set(data, function () {
        console.log("Note" + note_id + "saved");
    });

    dbg()
}

function dbg(){
    chrome.storage.sync.get(null, function(items) {
        var allKeys = Object.keys(items);
        console.log(allKeys);
    });
}