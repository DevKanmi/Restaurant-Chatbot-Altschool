const sendButton = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatArea = document.getElementById('chat-area');

// Initialize a session ID (in a real app, generate or fetch from backend)
let sessionId = 'user-session-id';  // This would be dynamic in a production app

// Function to add messages to the chat
function addMessageToChat(message, sender) {
  const messageElem = document.createElement('div');
  messageElem.classList.add('message', sender);

  // Replace newline characters with <br> for formatting
  messageElem.innerHTML = message.replace(/\n/g, '<br>');

  chatArea.appendChild(messageElem);
  chatArea.scrollTop = chatArea.scrollHeight;  // Ensure chat auto-scrolls to bottom
}

// Function to simulate a loading state (when the bot is typing)
function showLoading() {
  const loader = document.createElement('div');
  loader.classList.add('loader');
  loader.id = 'loading';
  chatArea.appendChild(loader);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Function to remove the loading indicator once response is ready
function removeLoading() {
  const loader = document.getElementById('loading');
  if (loader) {
    loader.remove();
  }
}

// Handle message sending to backend
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessageToChat(message, 'user');
  userInput.value = '';
  showLoading();

  try {
    const res = await fetch('http://localhost:3000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message }),
    });

    const data = await res.json();
    removeLoading();

    const formattedMessage = data.reply.replace(/\n/g, '<br>');

    // Check if message contains the PAY_NOW_BUTTON placeholder
    if (formattedMessage.includes('PAY_NOW_BUTTON')) {
      // Replace PAY_NOW_BUTTON with an actual button
      addMessageToChat(
        formattedMessage.replace('PAY_NOW_BUTTON', '<button id="pay-now-btn">Pay Now</button>'),
        'bot'
      );

      // Attach click event to the "Pay Now" button after it's been added to the DOM
      setTimeout(() => {
        const payBtn = document.getElementById('pay-now-btn');
        if (payBtn) {
          payBtn.addEventListener('click', async () => {
            showLoading();
            try {
              const res = await fetch('http://localhost:3000/chat/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
              });
              const data = await res.json();
              removeLoading();

              if (data.reply && data.reply.includes('http')) {
                // Extract the payment URL and open in a new tab
                const link = data.reply.match(/https?:\/\/\S+/)[0];
                window.open(link, '_blank');
                addMessageToChat('Redirecting you to Paystack payment...', 'bot');
              } else {
                addMessageToChat('⚠️ Something went wrong with payment link.', 'bot');
              }
            } catch (err) {
              removeLoading();
              console.error(err);
              addMessageToChat('⚠️ Error processing payment.', 'bot');
            }
          });
        }
      }, 100); // Timeout to ensure button is available in the DOM
    } else {
      // Handle normal message replies from the bot
      addMessageToChat(formattedMessage, 'bot');
    }
  } catch (error) {
    removeLoading();
    console.error('Error:', error);
    addMessageToChat("Sorry, something went wrong. Please try again.", 'bot');
  }
}

// Event listener for the send button
sendButton.addEventListener('click', sendMessage);

// Allow user to press "Enter" to send the message
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Function to load welcome message on page load
async function loadWelcomeMessage() {
  showLoading();

  try {
    const res = await fetch('http://localhost:3000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: 'hi' }),  // simulate "hi"
    });

    const data = await res.json();
    removeLoading();

    if (Array.isArray(data.reply)) {
      data.reply.forEach(line => addMessageToChat(line, 'bot'));
    } else {
      addMessageToChat(data.reply, 'bot');
    }
  } catch (error) {
    removeLoading();
    console.error('Error:', error);
    addMessageToChat("Oops! Couldn't load welcome message.", 'bot');
  }
}

// Run on page load
window.onload = loadWelcomeMessage;

