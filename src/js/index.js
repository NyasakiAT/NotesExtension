let notes_container = document.getElementById("notes-container");

window.onload = display_notes;
chrome.storage.onChanged.addListener((changes, area) => {
  display_notes();
});

async function display_notes() {
  notes_container.innerHTML = "";

  let notes = await get_notes();

  let columns = build_columns(2, notes);

  notes_container.appendChild(columns);
}

async function get_notes() {
  let notes = [];

  return new Promise((res) => {
    chrome.storage.sync.get(null, function (items) {
      for (var item in items) {
        let note = build_note(item, items[item].text, items[item].url, items[item].comments);

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

  let added_notes = 0;

  for (let col_count = 0; col_count < col_amount; col_count++) {

    var column = document.createElement("div");
    column.className = "column";

    for (let note_count = 0; note_count < notes_per_column; note_count++) {

      if (added_notes >= notes_amount) {
        break;
      }

      column.appendChild(notes[added_notes]);
      added_notes++;
    }

    column_wrapper.appendChild(column);
    column = null;
  }

  return column_wrapper;
}

function build_note(id, text, url, comments) {

  let note_wrapper = document.createElement("div");
  note_wrapper.className = "card has-background-warning";

  let note_content_wrapper = document.createElement("div");
  note_content_wrapper.className = "card-content";

  let note_content = document.createElement("div");
  note_content.className = "content";
  note_content.innerHTML = text.replaceAll("\n", "<br>");

  let note_comments = document.createElement("div");
  note_comments.className = "comments has-text-grey is-italic";
  note_comments.innerHTML = '<div class="has-text-weight-medium">Comments</div>';

  let note_comments_editable = document.createElement("textarea");
  note_comments_editable.className = "textarea comments-editable";

  let note_comments_content = document.createElement('p');
  if (comments) {
    note_comments_content.innerText = comments.replaceAll("\n", "<br>");
    note_comments.appendChild(note_comments_content);
  }
  note_content.onclick = () => {

    if (Array.from(note_comments.childNodes).includes(note_comments_editable)) return;
    if (Array.from(note_comments.childNodes).includes(note_comments_content)) note_comments.removeChild(note_comments_content);

    share_button.classList.add('is-success');
    share_button.innerText = "Save";

    note_comments_editable.value = comments ?? '';
    note_comments.appendChild(note_comments_editable);
  }

  let note_footer = document.createElement("footer");
  note_footer.className = "card-footer";

  let delete_button = document.createElement("button");
  delete_button.onclick = () => {
    chrome.storage.sync.remove(id);
  };
  delete_button.className = "card-footer-item button is-danger";
  delete_button.innerText = "Delete";

  let share_button = document.createElement("button");
  share_button.onclick = async () => {

    if (share_button.classList.contains('is-success')) {

      const note = await get_single_note(id);
      const data = {}

      note.comments = note_comments_editable.value;

      data[id] = note;

      chrome.storage.sync.set(data, function () {
        console.log("Added comments to note");
      });

      note_comments.removeChild(note_comments_editable);
      if (note_comments_editable.value && note_comments_editable.value !== '') {
        note_comments_content.innerText = note_comments_editable.value.replaceAll("\n", "<br>");
        note_comments.appendChild(note_comments_content);
      }

      share_button.classList.remove('is-success');
      share_button.innerText = "Share";
    } else {

      share_button.setAttribute('disabled', true);
      share_button.innerText = "Sharing...";

      const share_link = await share(id, text);

      share_button.removeAttribute('disabled');
      share_button.innerText = "Share";

      const note = await get_single_note(id);
      const data = {}

      note.share_link = share_link;

      data[id] = note;

      chrome.storage.sync.set(data, function () {
        console.log("Added share link to note");
      });

      chrome.tabs.create({
        url: share_link
      });

      console.log(share_link);
    }
  };
  share_button.className = "card-footer-item button is-info";
  share_button.innerText = "Share";

  let page_button = document.createElement("a");
  page_button.className = "card-footer-item button is-info";
  page_button.innerText = "Page";
  page_button.href = url;
  page_button.target = "_blank";

  note_wrapper.appendChild(note_content_wrapper);
  note_wrapper.appendChild(note_footer);

  note_content_wrapper.appendChild(note_content);
  note_content.appendChild(note_comments);

  note_footer.appendChild(share_button);
  note_footer.appendChild(page_button);
  note_footer.appendChild(delete_button);

  return note_wrapper;
}

async function get_single_note(id) {
  return new Promise((res) => {
    chrome.storage.sync.get(id, function (item) {
      res(item[id]);
    });
  });
}

async function share(id, data) {

  const note = await get_single_note(id);

  return new Promise((resolve) => {

    if (note.share_link) {
      resolve(note.share_link);
    } else {

      fetch("https://paste.rs", {
        method: "POST",
        headers: {
          'Content-Type': 'text/plain'
        },
        body: data

      }).then(res => {

        resolve(res.text());

      }).catch(ex => {

        console.error("A error occured: " + ex);

      });
    }
  });
}
