let notes_container = document.getElementById("notes-container");

window.onload = () => {
    console.log('Notes loaded')

    chrome.storage.sync.get(null, function (items) {

        for (item in items) {
            let note = build_card(items[item].text, items[item].url)
            notes_container.appendChild(note)

            console.log(item)
        }
        
        

        
    });
};

function build_card(text, url){
    let card_wrapper = document.createElement("div")
    card_wrapper.className = "card"

    let card_content = document.createElement("div")
    card_content.className = "card-content"

    let content = document.createElement("div")
    content.className = "content"

    let content_text = document.createElement("p")
    content_text.textContent = text

    let content_url = document.createElement("a")
    content_url.href = url
    content_url.innerText = "Link"
    content_url.target = "_blank"

    card_wrapper.appendChild(card_content)
    card_content.appendChild(content)
    content.appendChild(content_text)
    content.appendChild(content_url)

    return card_wrapper
}