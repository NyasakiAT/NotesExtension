chrome.contextMenus.create({
    title: "Save as note",
    id: "SAVE_NOTE",
    contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener(save_note);


function save_note(info, tab) {
    let note_id = make_id(20);

    data = {}

    data[note_id] = {
        url: info.pageUrl,
        text: info.selectionText
    }


    chrome.storage.sync.set(data, function () {
        console.log("Note " + note_id + " saved");
    });

    print_data();
    clear_data();
}

function print_data() {
    chrome.storage.sync.get(null, function (items) {
        console.log(items)
    });
}

function clear_data() {
    chrome.storage.sync.clear();
}

function make_id(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    return result;
}