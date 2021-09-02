import { nanoid } from 'nanoid'

chrome.contextMenus.create({
  title: 'Save as note',
  id: 'SAVE_NOTE',
  contexts: ['selection'],
});

chrome.contextMenus.onClicked.addListener(save_note);

function save_note(info, tab) {
  const note_id = nanoid();

  const data = {};

  data[note_id] = {
    url: info.pageUrl,
    text: info.selectionText,
  }

  chrome.storage.sync.set(data, function () {
    console.log('Note ' + note_id + ' saved');
  });

  chrome.notifications.create({
    type: "basic",
    title: "Note Extension",
    message: "Note saved sucessfully",
    iconUrl: "./images/notes-icon_128.png"
  });
}
