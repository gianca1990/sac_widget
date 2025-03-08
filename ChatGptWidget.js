(async function () {
  let template = document.createElement("template");
  template.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%; /* Widget soll die volle Breite des Containers einnehmen */
          height: 100%; /* Widget soll die volle Höhe des Containers einnehmen */
        }
        
        div {
          margin: 20px auto;
          width: 100%;  /* Setze die Breite auf 100%, um den Container zu füllen */
          height: 100%; /* Setze die Höhe auf 100%, um den Container zu füllen */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* Style für den Chat-Verlauf */
        .chat-container {
          flex-grow: 1; /* Damit der Chat-Verlauf den verfügbaren Platz einnimmt */
          overflow-y: auto;
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 10px;
          background-color: #fafafa;
          height: calc(100% - 120px); /* Berechnet die Höhe, damit der Eingabebereich auch Platz hat */
          max-height: 80%; /* Maximalhöhe von 80% des Widgets */
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

        /* Eingabebereich */
        .input-container {
          display: flex;
          justify-content: space-between; /* Damit Input und Button nebeneinander sind */
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
          resize: vertical; /* Ermöglicht das Vergrößern des Textfeldes */
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
      const { apiKey } = this._props || "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";
      const { max_tokens } = this._props || 1024;
      const generateButton = this.shadowRoot.getElementById("generate-button");
      const chatContainer = this.shadowRoot.getElementById("chat-container");

      // Entferne den Event-Listener, falls bereits hinzugefügt
      generateButton.removeEventListener("click", this.handleGenerateButtonClick);

      // Füge den Event-Listener hinzu
      generateButton.addEventListener("click", this.handleGenerateButtonClick.bind(this, apiKey, max_tokens, chatContainer, generateButton));
    }

    async handleGenerateButtonClick(apiKey, max_tokens, chatContainer, generateButton) {
      const promptInput = this.shadowRoot.getElementById("prompt-input");
      const prompt = promptInput.value;

      // Verhindern, dass mehrere Anfragen gleichzeitig gesendet werden
      if (generateButton.disabled) return;

      // Add user message to chat
      this.addMessageToChat(prompt, 'user');

      // Deaktiviere den Button während der Anfrage
      generateButton.disabled = true;

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: prompt },
            ],
            max_tokens: parseInt(max_tokens),
            n: 1,
            temperature: 0.5,
          }),
        });

        if (response.status === 200) {
          const { choices } = await response.json();
          const generatedTextValue = choices[0].message.content;

          if (generatedTextValue) {
            // Add bot response to chat
            this.addMessageToChat(generatedTextValue.replace(/^\n+/, ''), 'bot');
          } else {
            this.addMessageToChat("No response from API", 'bot');
          }
        } else {
          const error = await response.json();
          alert("OpenAI Response: " + error.error.message);
        }
      } catch (error) {
        console.error(error);
        this.addMessageToChat("An error occurred.", 'bot');
      } finally {
        // Stelle den Button wieder her
        generateButton.disabled = false;
      }
    }

    // Method to add messages to the chat container
    addMessageToChat(message, sender) {
      const chatContainer = this.shadowRoot.getElementById("chat-container");

      const messageDiv = document.createElement("div");
      messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
      messageDiv.textContent = message;

      chatContainer.appendChild(messageDiv);

      // Scroll to the bottom of the chat container
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    onCustomWidgetBeforeUpdate(changedProperties) {
      this._props = { ...this._props, ...changedProperties };
    }

    onCustomWidgetAfterUpdate(changedProperties) {
      this.initMain();
    }
  }

  customElements.define("com-rohitchouhan-sap-chatgptwidget", Widget);
})();
