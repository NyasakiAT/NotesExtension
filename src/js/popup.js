let show_notes = document.getElementById('show-notes');
let clear_notes = document.getElementById('clear-notes');

show_notes.addEventListener('click', () => {
  const extension_id = chrome.runtime.id;
  let url = 'chrome-extension://' + extension_id + '/html/index.html';
  chrome.tabs.create({
    url: url,
  });
});

clear_notes.addEventListener('click', () => {
  chrome.storage.sync.clear();
});
