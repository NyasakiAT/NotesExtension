import {
  nanoid
} from 'nanoid'

chrome.contextMenus.create({
  title: 'Save as note',
  id: 'SAVE_NOTE',
  contexts: ['selection'],
});

chrome.contextMenus.onClicked.addListener(save_note);

function get_selection() {
  var selection = window.getSelection();
  return selection.toString();
}

async function save_note(info, tab) {
  const note_id = nanoid();

  const data = {};
  let selected_text = "";
  try {
    var content = await chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },
      func: get_selection,
    });
    selected_text = content[0].result;
  } catch (e) {
    console.log("Using fallback method to get selected text!\n" + e.message);
    selected_text = info.selectionText;
  }


  data[note_id] = {
    url: info.pageUrl,
    text: selected_text
  };

  chrome.storage.sync.set(data, function () {
    console.log("Saved note");
  });

  chrome.notifications.create({
    type: "basic",
    title: "Note Extension",
    message: "Note saved sucessfully",
    iconUrl: "./images/notes-icon_128.png"
  });
}