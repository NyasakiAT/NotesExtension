import '../js/bulma-tagsinput.min';

let isModeDark = isCacheModeDark();  // 0 -> light, 1 -> dark

let html = document.getElementsByTagName('html')[0];
let app_header = document.getElementById('app-header');
let dark_mode_toggle = document.getElementById('dark-mode-toggle');
let notes_container = document.getElementById("notes-container");
let tags_container = document.getElementById("tags-container");
let tag_input = new BulmaTagsInput(
  document.getElementById('tag-search-input'),
  {
    delimiter: ' ',
    selectable: false
  }
);
let tags_search_section = document.getElementsByClassName('tags-input')[0];
let tag_search_clear = document.getElementById('tag-search-clear');
let tags = [];

window.onload = () => {

  if (isModeDark) {
    dark_mode_toggle.setAttribute('checked', '');
    app_header.classList.add('has-text-grey-lighter');
    html.classList.add('has-background-black-ter');
    tag_input.input.classList.add('has-background-grey-darker', 'has-text-grey-lighter', 'is-dark');
    tags_search_section.classList.add('has-background-grey-darker');
  } else dark_mode_toggle.removeAttribute('checked');

  dark_mode_toggle.onchange = () => {
    setCacheMode(!isModeDark);
    window.location.reload();
  }

  display_notes();

  tag_input.on('after.add', function (item) {
    tags.push(item.item);
    display_notes(tags, true);
  });

  tag_input.on('after.remove', function (item) {
    tags.splice(tags.indexOf(item), 1);
    display_notes(tags, true);
  });

  tag_input.input.onkeydown = (event) => {
    if (event.key === 'Backspace')
      tag_input.items.length !== 0 && tag_input.remove(tag_input.items[tag_input.items.length - 1]);
  }

  tag_search_clear.onclick = () => {
    tag_input.flush();
    tags = [];
    display_notes();
  };
}
chrome.storage.onChanged.addListener((changes, area) => {
  display_notes(tags);
});

function isCacheModeDark() {
  return localStorage.getItem('is_mode_dark') === '1';
}

function setCacheMode(isDark) {
  return localStorage.setItem('is_mode_dark', isDark ? '1' : '0');
}

async function display_notes(tags, doNotUpdateTagsList) {
  notes_container.innerHTML = "";

  let { notes, _tags } = await get_notes_and_tags(tags);

  let columns = build_columns(2, notes);

  notes_container.appendChild(columns);

  if (!doNotUpdateTagsList) {
    tags_container.innerHTML = "";
    _tags.forEach((tag) => {
      tags_container.appendChild(tag);
    });
  }
}

async function get_notes_and_tags(tags) {
  let notes = [];
  let _tags = [];
  let tags_text = [];

  return new Promise((res) => {
    chrome.storage.sync.get(null, async function (items) {
      for (var item in items) {
        if (!tags || tags.length === 0 || items[item].tags && do_tags_match(tags, items[item].tags)) {
          let note = build_note(item, items[item].text, items[item].url, items[item].comments, items[item].tags);
          notes.push(note);
        }
        if (items[item].tags) {
          items[item].tags.forEach((tag) => {
            if (!tags_text.includes(tag)) {
              _tags.push(build_tag(tag));
              tags_text.push(tag);
            }
          });
        }
      }

      res({ notes, _tags });
    });
  });
}

function do_tags_match(search_tags, curr_note_tags) {
  let qualifies = true;
  search_tags.forEach((search_tag) => {
    if (!curr_note_tags.includes(search_tag)) {
      qualifies = false;
      return;
    }
  });
  return qualifies;
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

function build_note(id, text, url, comments, tags) {

  let note_wrapper = document.createElement("div");
  note_wrapper.className = `card ${isModeDark ? 'has-background-grey-dark' : 'has-background-warning'}`;

  let note_content_wrapper = document.createElement("div");
  note_content_wrapper.className = "card-content";

  let note_content = document.createElement("div");
  note_content.className = `content ${isModeDark && 'has-text-white-bis'}`;
  note_content.innerHTML = text.replaceAll("\n", "<br>");

  let note_comments = document.createElement("div");
  note_comments.className = `mt is-italic ${isModeDark ? 'has-text-grey-light' : 'has-text-grey'}`;
  note_comments.innerHTML = '<div class="has-text-weight-medium">Comments</div>';

  let note_comments_editable = document.createElement("textarea");
  note_comments_editable.className = "textarea mt";

  let note_comments_content = document.createElement('p');
  if (comments) {
    note_comments_content.innerHTML = comments.replaceAll("\n", "<br>");
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

  let tags_container = document.createElement('div');
  tags_container.className = "tags mt";
  tags && tags.forEach((tag) => {
    tags_container.appendChild(build_tag(tag));
  });

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

      let this_comment = note_comments_editable.value;
      note.comments = this_comment;

      let tags = get_tags(this_comment);
      note.tags = tags;

      data[id] = note;

      chrome.storage.sync.set(data, function () {
        console.log("Added comments to note");
      });

      note_comments.removeChild(note_comments_editable);
      if (note_comments_editable.value && note_comments_editable.value !== '') {
        note_comments_content.innerHTML = this_comment.replaceAll("\n", "<br>");
        note_comments.appendChild(note_comments_content);
      }

      tags_container.innerHTML = "";
      tags.forEach((tag) => {
        tags_container.appendChild(build_tag(tag));
      });

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
  note_content.appendChild(tags_container);

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

function get_tags(text) {
  let hash_i = 0;
  let searching = false;
  let tags = [];
  for (let i = 0; i < text.length; i++) {
    if (!searching && text.charAt(i) === '#') {
      hash_i = i;
      searching = true;
    } else if (searching && (i === text.length - 1 || text.charAt(i) === ' ' || text.charAt(i) === '\n' || text.charAt(i) === '#')) {
      let tag = text.substring(hash_i, i === text.length - 1 ? i + 1 : i);
      if (tag.length !== 0) tags.push(tag.toLowerCase());
      searching = false;
    }
  }
  return tags;
}

function build_tag(tag) {
  let tag_element = document.createElement('div');
  tag_element.className = `tag ${isModeDark ? 'is-dark' : 'is-light is-warning'}`;
  tag_element.innerText = tag;
  tag_element.onclick = (event) => {
    event.stopPropagation();
    tag_input.add(event.target.innerText);
  }
  return tag_element;
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
