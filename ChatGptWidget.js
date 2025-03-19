(async function () {
  let template = document.createElement("template");
  template.innerHTML = `
      <style>
        :host { display: block; padding: 10px; font-family: Arial, sans-serif; }
        #message-container { padding: 10px; border: 1px solid #ccc; border-radius: 5px; background: #f9f9f9; }
        #fetch-button { margin-top: 10px; padding: 5px 10px; cursor: pointer; }
      </style>
      <div>
        <div id="message-container">Warten auf Nachricht...</div>
        <button id="fetch-button">Nachricht abrufen</button>
      </div>
  `;

  class Widget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
      this.shadowRoot.getElementById("fetch-button").addEventListener("click", async () => {
        const response = await fetch("https://fastapi-app-886832348626.europe-west1.run.app/");
        const data = await response.json();
        this.shadowRoot.getElementById("message-container").textContent = data.message || "Keine Nachricht erhalten";
      });
    }
  }

  customElements.define("simple-message-widget", Widget);
})();
