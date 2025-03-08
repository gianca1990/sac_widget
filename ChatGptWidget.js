(async function () {
  let template = document.createElement("template");
  template.innerHTML = `
      <style>
        :host {}
        div {
          margin: 50px auto;
          max-width: 800px;
        }

        .input-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          width: 100%;
        }

        #prompt-input {
          padding: 10px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 5px;
          flex-grow: 1;
          min-width: 0;
        }

        #generate-button {
          padding: 10px;
          font-size: 16px;
          background-color: #3cb6a9;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-left: 10px;
        }

        /* Style for the chat history */
        .chat-container {
          max-height: 500px;
          overflow-y: auto;
          margin-top: 20px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }

        .user-message, .bot-message {
          margin-bottom: 15px;
          padding: 10px;
          border-radius: 5px;
          max-width: 80%;
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
      </style>
      <div>
        <div class="chat-container" id="chat-container"></div>

        <div class="input-container">
          <input type="text" id="prompt-input" placeholder="Enter a prompt">
          <button id="generate-button">Generate Text</button>
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
