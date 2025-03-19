(async function () {
  let template = document.createElement("template");
  template.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }
        div {
          margin: 20px auto;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .chat-container {
          flex-grow: 1;
          overflow-y: auto;
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 10px;
          background-color: #fafafa;
          height: calc(100% - 120px);
          max-height: 80%;
        }
        .user-message, .bot-message {
          margin-bottom: 15px;
          padding: 12px;
          border-radius: 8px;
          max-width: 80%;
          word-wrap: break-word;
        }
        .user-message {
          background-color: #e0f7fa;
          align-self: flex-end;
          text-align: right;
        }
        .bot-message {
          background-color: #f1f1f1;
          align-self: flex-start;
          text-align: left;
        }
        .input-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 10px;
          border-top: 1px solid #ccc;
          background-color: white;
          width: 100%;
          max-width: 100%;
        }
        #prompt-input {
          padding: 10px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 20px;
          width: 80%;
          margin-right: 10px;
          resize: vertical;
          min-height: 40px;
          max-width: 100%;
        }
        #generate-button {
          padding: 10px;
          font-size: 16px;
          background-color: #3cb6a9;
          color: #fff;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          width: 18%;
        }
      </style>
      <div>
        <div class="chat-container" id="chat-container"></div>
        <div class="input-container">
          <textarea id="prompt-input" placeholder="Nachricht eingeben..." rows="1"></textarea>
          <button id="generate-button">Senden</button>
        </div>
      </div>
  `;

  class Widget extends HTMLElement {
    constructor() {
      super();
      let shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(template.content.cloneNode(true));
      this._props = {};
    }

    async connectedCallback() {
      this.initMain();
    }

    async initMain() {
      const apiKey = "https://fastapi-app-886832348626.europe-west1.run.app/";  // ✅ Variable heißt wieder "apiKey"
      const generateButton = this.shadowRoot.getElementById("generate-button");
      const chatContainer = this.shadowRoot.getElementById("chat-container");

      generateButton.removeEventListener("click", this.handleGenerateButtonClick);
      generateButton.addEventListener("click", this.handleGenerateButtonClick.bind(this, apiKey, chatContainer, generateButton));
    }

    async handleGenerateButtonClick(apiKey, chatContainer, generateButton) {
      const promptInput = this.shadowRoot.getElementById("prompt-input");
      const prompt = promptInput.value;

      if (generateButton.disabled) return;

      this.addMessageToChat(prompt, 'user');
      generateButton.disabled = true;

      try {
        // ✅ Korrekte API-Anfrage mit GET und Query-Parametern
        const response = await fetch(apiKey, { method: "GET" });

        if (response.status === 200) {
          const data = await response.json();
          const generatedTextValue = data.message;

          if (generatedTextValue) {
            this.addMessageToChat(generatedTextValue, 'bot');
          } else {
            this.addMessageToChat("No response from API", 'bot');
          }
        } else {
          alert("API Response Error: " + response.status);
        }
      } catch (error) {
        console.error(error);
        this.addMessageToChat("An error occurred.", 'bot');
      } finally {
        generateButton.disabled = false;
      }
    }

    addMessageToChat(message, sender) {
      const chatContainer = this.shadowRoot.getElementById("chat-container");
      const messageDiv = document.createElement("div");
      messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
      messageDiv.textContent = message;
      chatContainer.appendChild(messageDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  customElements.define("com-rohitchouhan-sap-chatgptwidget", Widget);
})();
