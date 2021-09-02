let notes_container = document.getElementById("notes-container");

window.onload = display_notes;
chrome.storage.onChanged.addListener((changes, area) => {
  display_notes();
});

async function display_notes() {
  notes_container.innerHTML = '';
  
  let notes = await get_notes();
  
  console.log("Notes length: " + notes.length);

  let columns = build_columns(2, notes);

  notes_container.appendChild(columns);
}

async function get_notes() {
  let notes = [];

  return new Promise((res) => {
    chrome.storage.sync.get(null, function (items) {
      for (var item in items) {
        let note = build_note(item, items[item].text, items[item].url);

        notes.push(note);
      }

      res(notes);
    });
  });
}

function build_columns(col_amount, notes) {
  let column_wrapper = document.createElement("div");
  column_wrapper.className = "columns";

  let notes_amount = notes.length;
  let notes_per_column = (Math.round(notes_amount / col_amount));

  console.log("Notes amount: " + notes_amount + " NPC: " + notes_per_column);

  let added_notes = 0;

  for (let col_count = 0; col_count < col_amount; col_count++) {

    var column = document.createElement("div");
    column.className = "column";

    for (let note_count = 0; note_count < notes_per_column; note_count++) {
      console.log("note:" + note_count + " col:" + col_count + " added:" + added_notes);

      if (added_notes >= notes_amount){
        break;
      }

      column.appendChild(notes[added_notes]);
      added_notes++;
    }

    column_wrapper.appendChild(column);
    column = null;
  }

  console.log(column_wrapper);

  return column_wrapper;
}

function build_note(id, text, url) {
  let note_wrapper = document.createElement("div");
  note_wrapper.className = "notification is-warning";

  let close_button = document.createElement("button");
  close_button.onclick = () => {
    chrome.storage.sync.remove(id);
    display_notes();
  };
  close_button.className = "delete";

  let content_text = document.createElement("p");
  content_text.textContent = text;
  content_text.style = "white-space: pre-wrap;";

  let content_url = document.createElement("a");
  content_url.href = url;
  content_url.innerText = "Link";
  content_url.target = "_blank";

  note_wrapper.appendChild(close_button);
  note_wrapper.appendChild(content_text);
  note_wrapper.appendChild(content_url);

  return note_wrapper;
}