const notes_container = document.getElementById('notes-container')

window.onload = display_notes

function display_notes() {
  notes_container.innerHTML = ''

  chrome.storage.sync.get(null, function (items) {
    for (const item in items) {
      let note = build_note(item, items[item].text, items[item].url)
      notes_container.appendChild(note)

      console.log(item)
    }
  })
}

function build_note(id, text, url) {
  const note_wrapper = document.createElement('div')
  note_wrapper.className = 'notification is-warning'

  const close_button = document.createElement('button')
  close_button.onclick = () => {
    chrome.storage.sync.remove(id)
    display_notes()
  }
  close_button.className = 'delete'

  const content_text = document.createElement('p')
  content_text.textContent = text

  const content_url = document.createElement('a')
  content_url.href = url
  content_url.innerText = 'Link'
  content_url.target = '_blank'

  note_wrapper.appendChild(close_button)
  note_wrapper.appendChild(content_text)
  note_wrapper.appendChild(content_url)

  return note_wrapper
}
