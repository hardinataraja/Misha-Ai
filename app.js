// app.js — Musa AI versi SweetAlert2

document.addEventListener("DOMContentLoaded", () => {
  // ===== ELEMENTS ===== //
  const welcomeScreen = document.getElementById("welcomeScreen");
  const chatHeader = document.getElementById("chatHeader");
  const chatContainer = document.getElementById("chatContainer");
  const chatMessages = document.getElementById("chatMessages");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const firstMsg = document.getElementById("firstMessage");
  const startBtn = document.getElementById("startChatBtn");

  const menuBtn = document.getElementById("menuBtn");
  const dropdown = document.getElementById("dropdownMenu");
  const newChatBtn = document.getElementById("newChat");
  const changeTokenBtn = document.getElementById("changeToken");
  const clearChatBtn = document.getElementById("clearChat");

  // ===== UI HANDLING ===== //
  function showChatUI() {
    welcomeScreen.style.display = "none";
    chatHeader.classList.remove("hidden");
    chatContainer.classList.remove("hidden");
  }
  function showWelcomeUI() {
    welcomeScreen.style.display = "flex";
    chatHeader.classList.add("hidden");
    chatContainer.classList.add("hidden");
  }

  // ===== THEME ===== //
  const THEME_KEY = "musa_theme";
  function applyTheme() {
    const t = localStorage.getItem(THEME_KEY) || "dark";
    document.body.classList.toggle("light-theme", t === "light");
  }
  applyTheme();

  // ===== TOKEN ===== //
  const TOKEN_KEY = "musa_token";
  async function setTokenFromPrompt() {
    const prev = localStorage.getItem(TOKEN_KEY) || "";
    const { value: token } = await Swal.fire({
      title: "Masukkan Token API",
      input: "text",
      inputLabel: "Token OpenRouter kamu",
      inputValue: prev,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      inputPlaceholder: "Masukkan token kamu di sini...",
    });

    if (token === undefined) return; // user cancel

    const trimmed = token.trim();
    if (trimmed === "") {
      localStorage.removeItem(TOKEN_KEY);
      Swal.fire("Token dihapus", "", "info");
    } else {
      localStorage.setItem(TOKEN_KEY, trimmed);
      Swal.fire("✅ Token tersimpan!", "", "success");
    }
    dropdown.classList.add("hidden");
  }
  changeTokenBtn?.addEventListener("click", setTokenFromPrompt);

  // ===== MENU ===== //
  menuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  });
  window.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== menuBtn) {
      dropdown.classList.add("hidden");
    }
  });

  // ===== HISTORY ===== //
  const HISTORY_KEY = "chatHistory";
  const SESSIONS_KEY = "chatSessions";
  const savedChat = localStorage.getItem(HISTORY_KEY);
  if (savedChat) {
    showChatUI();
    chatMessages.innerHTML = savedChat;
    setTimeout(() => (chatMessages.scrollTop = chatMessages.scrollHeight), 50);
  } else showWelcomeUI();

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, chatMessages.innerHTML);
  }

  // ===== CHAT MESSAGE ===== //
  function appendUserMessage(text) {
    const userMsg = document.createElement("div");
    userMsg.className = "user-msg";
    userMsg.textContent = text;
    chatMessages.appendChild(userMsg);
  }

  // Efek mengetik seperti ChatGPT //
  function appendBotMessage(text) {
    const botMsg = document.createElement("div");
    botMsg.className = "bot-msg";
    chatMessages.appendChild(botMsg);

    let i = 0;
    const speed = 25;
    function type() {
      if (i < text.length) {
        botMsg.textContent += text.charAt(i);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        i++;
        setTimeout(type, speed);
      } else {
        saveHistory();
      }
    }
    type();
  }

  function showTypingIndicator() {
    const el = document.createElement("div");
    el.className = "bot-msg typing";
    el.innerHTML =
      "Misha AI sedang mengetik<span class='dot'>.</span><span class='dot'>.</span><span class='dot'>.</span>";
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return el;
  }

  // ===== KIRIM PESAN KE OPENROUTER ===== //
  async function sendMessageToBot(message) {
    if (!message.trim()) return;
    appendUserMessage(message);
    userInput.value = "";
    saveHistory();
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const typingEl = showTypingIndicator();
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      typingEl.remove();
      appendBotMessage(
        "❌ Token belum diatur. Klik menu → Token untuk menambahkannya."
      );
      return;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Kamu adalah Misha AI, asisten cantik, imut, dan cerdas yang berbicara dalam bahasa Indonesia. Saat kamu menanyakan sesuatu kepada pengguna, gunakan gaya lembut dengan menyebut dirimu 'Misha', misalnya 'Bisa Musaa bantu?'",
            },
            { role: "user", content: message },
          ],
        }),
      });

      const data = await response.json();
      typingEl.remove();

      if (data.error) {
        appendBotMessage("⚠️ Terjadi error: " + data.error.message);
      } else {
        const reply =
          data.choices?.[0]?.message?.content || "(Tidak ada balasan)";
        appendBotMessage(reply);
      }

      saveHistory();
    } catch (err) {
      typingEl.remove();
      appendBotMessage("⚠️ Gagal terhubung ke server: " + err.message);
    }
  }

  // ===== WELCOME SCREEN START ===== //
  function startChatFromWelcome() {
    const msg = firstMsg.value.trim();
    if (!msg) return;
    showChatUI();
    setTimeout(() => sendMessageToBot(msg), 200);
  }

  startBtn.addEventListener("click", startChatFromWelcome);
  firstMsg.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startChatFromWelcome();
  });

  // ===== CHAT INPUT ===== //
  sendBtn.addEventListener("click", () => {
    const msg = userInput.value.trim();
    if (msg) sendMessageToBot(msg);
  });

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const msg = userInput.value.trim();
      if (msg) sendMessageToBot(msg);
    }
  });

  // ===== HAPUS SEMUA CHAT ===== //
  clearChatBtn?.addEventListener("click", async () => {
    const result = await Swal.fire({
      title: "Hapus semua chat?",
      text: "Semua pesan dan riwayat akan hilang permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    chatMessages.innerHTML = "";
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    showWelcomeUI();
    dropdown.classList.add("hidden");

    Swal.fire("Berhasil!", "Semua chat telah dihapus.", "success");
  });

  [newChatBtn, changeTokenBtn].forEach((btn) => {
    btn?.addEventListener("click", () => dropdown.classList.add("hidden"));
  });
});