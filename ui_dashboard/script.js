/* ===== Voicely Dashboard — Vanilla JS Logic ===== */

document.addEventListener("DOMContentLoaded", () => {
    // ——————————————————————————————————————————————
    // 1. Header date
    // ——————————————————————————————————————————————
    const dateEl = document.getElementById("header-date");
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric",
        });
    }

    // ——————————————————————————————————————————————
    // 2. Sidebar navigation
    // ——————————————————————————————————————————————
    const navBtns = document.querySelectorAll("#sidebar-nav .nav-btn");
    const sections = document.querySelectorAll(".section-panel");
    const headerTitle = document.getElementById("header-title");
    const labelMap = { dashboard: "Dashboard", conversations: "Conversations", voicelab: "Voice Lab", scoring: "Pronunciation Scoring" };

    navBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.section;
            navBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            sections.forEach((s) => s.classList.remove("active"));
            document.getElementById("section-" + id).classList.add("active");
            if (headerTitle) headerTitle.textContent = labelMap[id] || id;

            // On mobile, clicking a nav item should also close the sidebar
            if (window.innerWidth < 768) {
                sidebar.classList.add("-translate-x-full");
            }
        });
    });

    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebar-toggle");
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const collapseIcon = document.getElementById("collapse-icon");

    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            // Desktop toggle
            if (window.innerWidth >= 768) {
                sidebar.classList.toggle("collapsed");
                sidebar.classList.toggle("expanded");
                if (sidebar.classList.contains("collapsed")) collapseIcon.textContent = "chevron_right";
                else collapseIcon.textContent = "chevron_left";
            } else {
                // Mobile close button fallback
                sidebar.classList.add("-translate-x-full");
            }
        });
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("-translate-x-full");
        });
    }

    // ——————————————————————————————————————————————
    // 3. Dashboard — Text & Voice Module
    // ——————————————————————————————————————————————

    // Build waveform bars
    const waveContainer = document.getElementById("waveform-container");
    if (waveContainer) {
        for (let i = 0; i < 32; i++) {
            const bar = document.createElement("div");
            bar.style.cssText = `width:4px;border-radius:999px;background:rgba(74,74,74,0.45);transition:all 0.3s;height:${Math.sin(i * 0.6) * 40 + 50}%;`;
            bar.className = "waveform-bar";
            bar.style.animationDelay = `${(i * 0.04).toFixed(2)}s`;
            waveContainer.appendChild(bar);
        }
    }

    let isPlaying = false;
    const voiceResult = document.getElementById("voice-result");

    document.getElementById("btn-generate")?.addEventListener("click", () => {
        voiceResult?.classList.remove("hidden");
        setPlaying(true);
        setTimeout(() => setPlaying(false), 3000);
    });

    function setPlaying(state) {
        isPlaying = state;
        const icon = document.getElementById("play-icon");
        const label = document.getElementById("play-label");
        if (icon) icon.textContent = state ? "pause" : "play_arrow";
        if (label) label.textContent = state ? "Pause" : "Play";
        document.querySelectorAll(".waveform-bar").forEach((b) => {
            if (state) b.classList.add("wave-bar");
            else b.classList.remove("wave-bar");
        });
    }

    document.getElementById("btn-play")?.addEventListener("click", () => setPlaying(!isPlaying));
    document.getElementById("btn-replay")?.addEventListener("click", () => {
        setPlaying(true);
        setTimeout(() => setPlaying(false), 3000);
    });



    // ——————————————————————————————————————————————
    // 5. Conversations — tab switching
    // ——————————————————————————————————————————————
    const convModes = {
        casual: {
            label: "Casual Chat", desc: "Relaxed, everyday conversation practice", tone: "Casual",
            messages: [
                { role: "ai", text: "Hey! How's your day going? Did you do anything fun over the weekend?" },
                { role: "user", text: "It was pretty good! I went hiking and tried a new restaurant." },
                { role: "ai", text: "Oh nice! What kind of food was it? I love trying new places." },
            ],
        },
        academic: {
            label: "Academic Lecture", desc: "Structured academic discourse and presentations", tone: "Formal",
            messages: [
                { role: "ai", text: "Today we'll examine the linguistic theory of second language acquisition, specifically Krashen's Input Hypothesis." },
                { role: "user", text: "Could you elaborate on the distinction between acquisition and learning?" },
                { role: "ai", text: "Certainly. Krashen argues that acquisition is subconscious, while learning is conscious rule internalization." },
            ],
        },
        business: {
            label: "Business Meeting", desc: "Corporate communication and meeting etiquette", tone: "Professional",
            messages: [
                { role: "ai", text: "Let's begin the Q3 review. Could you walk us through the key metrics and your team's performance?" },
                { role: "user", text: "Sure. Revenue was up 18% year-over-year, driven primarily by the enterprise segment." },
                { role: "ai", text: "Excellent. What were the main challenges your team faced this quarter?" },
            ],
        },
        interview: {
            label: "Job Interview", desc: "Practice answering common interview questions", tone: "Formal",
            messages: [
                { role: "ai", text: "Tell me about yourself and what makes you the ideal candidate for this position." },
                { role: "user", text: "I have five years of experience in product development with a focus on user-centered design." },
                { role: "ai", text: "Interesting. Can you describe a challenging project and how you overcame the obstacles?" },
            ],
        },
        presentation: {
            label: "Presentation Mode", desc: "Public speaking, slides, audience engagement", tone: "Professional",
            messages: [
                { role: "ai", text: "Welcome, everyone. Today I'll be presenting our findings on AI-driven language learning outcomes." },
                { role: "user", text: "Our study tracked 2,400 learners over six months across three different methodologies." },
                { role: "ai", text: "The results clearly demonstrate a 40% improvement in pronunciation accuracy with AI coaching." },
            ],
        },
    };

    let selectedMode = "casual";

    function renderConvMessages() {
        const container = document.getElementById("conv-messages");
        if (!container) return;
        const mode = convModes[selectedMode];
        document.getElementById("conv-mode-label")?.textContent && (document.getElementById("conv-mode-label").textContent = mode.label);
        document.getElementById("conv-mode-desc")?.textContent && (document.getElementById("conv-mode-desc").textContent = mode.desc);
        container.innerHTML = "";
        mode.messages.forEach((msg, i) => {
            const row = document.createElement("div");
            row.className = `flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`;
            row.style.animationDelay = `${i * 0.1}s`;
            const bubble = document.createElement("div");
            bubble.className = msg.role === "ai" ? "msg-ai" : "msg-user";
            bubble.style.cssText = "max-width:320px;padding:12px 16px;font-size:14px;line-height:1.6;";
            bubble.textContent = msg.text;
            row.appendChild(bubble);
            container.appendChild(row);
        });
    }

    // Mode selector buttons
    document.querySelectorAll("#mode-selector button").forEach((btn) => {
        btn.addEventListener("click", () => {
            selectedMode = btn.dataset.mode;
            const modeInfo = convModes[selectedMode];
            document.querySelectorAll("#mode-selector button").forEach((b) => {
                b.style.borderColor = "var(--border)";
                b.style.background = "#fff";
                b.classList.remove("shadow-primary");
                b.classList.add("shadow-card");
                b.querySelector("span:last-child").style.color = "var(--foreground)";
            });
            btn.style.borderColor = "var(--primary)";
            btn.style.background = "var(--accent)";
            btn.classList.remove("shadow-card");
            btn.classList.add("shadow-primary");
            btn.querySelector("span:last-child").style.color = "var(--primary)";
            // Sync settings panel display
            const settingsMode = document.getElementById("settings-mode");
            const settingsTone = document.getElementById("settings-tone");
            if (settingsMode) settingsMode.textContent = modeInfo.label;
            if (settingsTone) settingsTone.textContent = modeInfo.tone;
            renderConvMessages();
        });
    });

    // Conv tab toggle
    document.querySelectorAll("[data-conv-tab]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const tab = btn.dataset.convTab;
            document.querySelectorAll("[data-conv-tab]").forEach((b) => {
                b.classList.remove("bg-white", "shadow-card");
                b.style.color = "var(--muted-foreground)";
            });
            btn.classList.add("bg-white", "shadow-card");
            btn.style.color = "var(--foreground)";
            document.getElementById("conv-simulator").classList.toggle("hidden", tab !== "simulator");
            document.getElementById("conv-history").classList.toggle("hidden", tab !== "history");
        });
    });

    // Difficulty buttons
    document.querySelectorAll("#difficulty-btns button").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#difficulty-btns button").forEach((b) => {
                b.className = "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all";
                b.style.cssText = "background:var(--muted);border-color:var(--border);color:var(--muted-foreground);";
            });
            btn.className = "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all gradient-brand text-white shadow-primary";
            btn.style.cssText = "border-color:transparent;";
            const el = document.getElementById("settings-level");
            if (el) el.textContent = btn.dataset.diff;
        });
    });

    // Build history list
    window.renderHistory = function(chats) {
        const historyList = document.getElementById("history-list");
        if (!historyList) return;
        historyList.innerHTML = "";
        
        // Handle cases where the backend returns a dictionary instead of an array (e.g. {"msg": "No chats"})
        if (!chats || typeof chats !== 'object' || !Array.isArray(chats) || chats.length === 0) {
            historyList.innerHTML = "<div class='p-6 text-center text-sm text-gray-500'>No past conversations found.</div>";
            return;
        }
        
        chats.forEach((conv) => {
            let title = "Chat Session";
            let preview = "";
            let msgCount = 0;

            try {
                // Parse the string which might be an array of objects
                let parsed = conv.chat;
                if (typeof parsed === "string") {
                    parsed = JSON.parse(parsed);
                }
                
                if (Array.isArray(parsed)) {
                    msgCount = parsed.length;
                    const firstUser = parsed.find(m => m.role === 'user');
                    if (firstUser && firstUser.content) {
                        title = firstUser.content;
                    }
                    const firstAssistant = parsed.find(m => m.role === 'assistant' || m.role === 'model');
                    if (firstAssistant && firstAssistant.content) {
                        preview = firstAssistant.content;
                    }
                    
                    // Fallbacks if roles aren't strictly 'user'/'assistant'
                    if (title === "Chat Session" && parsed.length > 0) {
                        title = parsed[0].content || "Chat Record";
                    }
                } else if (parsed && typeof parsed === "object") {
                    title = parsed.user || "Chat Session";
                    preview = parsed.assistant || "";
                    msgCount = 2; // Assuming user + assistant pingpong
                }
            } catch(e) {
                title = conv.chat || "Chat Record";
            }

            const btn = document.createElement("button");
            btn.className = "w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-all text-left group";
            btn.style.borderBottom = "1px solid var(--border)";
            btn.innerHTML = `
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#4A4A4A;">
                <span class="material-symbols-outlined text-white">chat</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <p class="text-sm font-semibold truncate">${title}</p>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0" style="background:rgba(74,74,74,0.15);color:#4A4A4A;border-color:rgba(74,74,74,0.3);">${msgCount} messages</span>
                </div>
                ${preview ? `<p class="text-xs truncate" style="color:var(--muted-foreground);">${preview}</p>` : ''}
              </div>
              <div class="flex items-center gap-3 flex-shrink-0">
                <span class="material-symbols-outlined text-base" style="color:var(--muted-foreground);">chevron_right</span>
              </div>
            `;
            btn.onclick = () => {
                if (typeof sendDataToStreamlit === "function") {
                    sendDataToStreamlit({ action: "view_chat", chat: conv.chat });
                }
            };
            historyList.appendChild(btn);
        });
    };

    // Init conversation messages on load
    renderConvMessages();

    // We defer the fetch to `streamlit-component-lib.js` which receives user_details dynamically,
    // but if user_details is present right now, we can fetch independently.
    const udStr = localStorage.getItem('user_details');
    if (udStr) {
        try {
            const ud = JSON.parse(udStr);
            if (ud && ud.id) {
                fetch('https://voicely-backend.vercel.app/retrieve_chats', {
                    headers: { 'user_id': String(ud.id) }
                }).then(r => r.json()).then(data => {
                    localStorage.setItem('past_chats', JSON.stringify(data));
                    if (typeof window.renderHistory === "function") window.renderHistory(data);
                }).catch(e => console.error("Error fetching chats:", e));
            }
        } catch(e) {}
    }

    // Voice selector sync
    document.getElementById("voice-select")?.addEventListener("change", (e) => {
        const el = document.getElementById("settings-voice");
        if (el) el.textContent = e.target.value;
    });

    // ——————————————————————————————————————————————
    // 6. Voice Lab
    // ——————————————————————————————————————————————

    // Sample mini-bars
    for (let s = 1; s <= 3; s++) {
        const el = document.getElementById("sample-bars-" + s);
        if (el) {
            for (let j = 0; j < 12; j++) {
                const bar = document.createElement("div");
                bar.style.cssText = `width:2px;border-radius:999px;background:rgba(74,74,74,0.4);height:${Math.random() * 70 + 30}%;`;
                el.appendChild(bar);
            }
        }
    }

    // Record button — records from mic for 10 seconds
    let labRecorder = null;
    let labChunks = [];
    let recordCountdown = null;
    document.getElementById("btn-record")?.addEventListener("click", async function () {
        const btn = this;
        const label = document.getElementById("record-label");
        // If already recording, do nothing
        if (labRecorder && labRecorder.state === "recording") return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            labRecorder = new MediaRecorder(stream);
            labChunks = [];
            labRecorder.ondataavailable = e => { if (e.data.size > 0) labChunks.push(e.data); };
            labRecorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                clearInterval(recordCountdown);
                const blob = new Blob(labChunks, { type: "audio/webm" });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = reader.result.split(',')[1];
                    sendDataToStreamlit({
                        action: "record_sample",
                        request_id: Date.now().toString() + Math.random().toString(36).slice(2),
                        audio: base64data
                    });
                };
                btn.classList.remove("animate-pulse");
                btn.classList.add("gradient-brand", "shadow-primary");
                btn.style.cssText = "border-color:transparent;";
                if (label) label.textContent = "Record Sample";
            };
            // Start recording
            labRecorder.start();
            btn.classList.remove("gradient-brand", "shadow-primary");
            btn.style.cssText = "background:rgba(239,68,68,0.1);color:#EF4444;border:1px solid rgba(239,68,68,0.3);";
            btn.classList.add("animate-pulse");
            let remaining = 10;
            if (label) label.textContent = `Recording... ${remaining}s`;
            recordCountdown = setInterval(() => {
                remaining--;
                if (label) label.textContent = `Recording... ${remaining}s`;
                if (remaining <= 0) {
                    clearInterval(recordCountdown);
                    if (labRecorder && labRecorder.state === "recording") labRecorder.stop();
                }
            }, 1000);
        } catch (e) {
            console.error("Mic access denied for Voice Lab:", e);
            if (label) label.textContent = "Mic Denied";
            setTimeout(() => { if (label) label.textContent = "Record Sample"; }, 2000);
        }
    });

    // Upload button — triggers file picker and sends audio to Streamlit
    document.getElementById("btn-upload")?.addEventListener("click", () => {
        document.getElementById("upload-audio-input")?.click();
    });
    document.getElementById("upload-audio-input")?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            sendDataToStreamlit({
                action: "upload_sample",
                request_id: Date.now().toString() + Math.random().toString(36).slice(2),
                audio: base64data,
                filename: file.name
            });
        };
        // Reset input so the same file can be re-selected
        e.target.value = "";
    });


    // ——————————————————————————————————————————————
    // 6.5 Pronunciation Scoring
    // ——————————————————————————————————————————————
    
    document.getElementById("btn-generate-paragraph")?.addEventListener("click", () => {
        const icon = document.getElementById("icon-generate-paragraph");
        if (icon) icon.classList.add("animate-spin");
        const pEl = document.getElementById("scoring-paragraph-text");
        if (pEl) pEl.textContent = "Loading new topic...";
        
        sendDataToStreamlit({
            action: "generate_paragraph",
            request_id: Date.now().toString() + Math.random().toString(36).slice(2)
        });
    });

    let scoreRecorder = null;
    let scoreChunks = [];
    document.getElementById("btn-score-mic")?.addEventListener("click", async function () {
        const btn = this;
        const label = document.getElementById("score-mic-label");
        
        if (scoreRecorder && scoreRecorder.state === "recording") {
            // Stop recording
            scoreRecorder.stop();
            return;
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            scoreRecorder = new MediaRecorder(stream);
            scoreChunks = [];
            scoreRecorder.ondataavailable = e => { if (e.data.size > 0) scoreChunks.push(e.data); };
            scoreRecorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(scoreChunks, { type: "audio/webm" });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    if (label) label.textContent = "Analyzing...";
                    const base64data = reader.result.split(',')[1];
                    sendDataToStreamlit({
                        action: "score_pronunciation",
                        request_id: Date.now().toString() + Math.random().toString(36).slice(2),
                        audio: base64data
                    });
                };
                btn.classList.remove("animate-pulse");
                btn.classList.add("gradient-brand", "shadow-primary");
                btn.style.cssText = "border-color:transparent;";
            };
            
            // Start recording
            scoreRecorder.start();
            btn.classList.remove("gradient-brand", "shadow-primary");
            btn.style.cssText = "background:rgba(239,68,68,0.1);color:#EF4444;border:1px solid rgba(239,68,68,0.3);";
            btn.classList.add("animate-pulse");
            if (label) label.textContent = "Recording... (Click to Stop)";
        } catch (e) {
            console.error("Mic access denied for Scoring:", e);
        }
    });

// 7. Streamlit Integrated Logic
let mediaRecorder = null;
let audioChunks = [];
async function startMic() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
        mediaRecorder.onstop = async () => {
            const blob = new Blob(audioChunks, { type: "audio/webm" });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result.split(',')[1];
                
                // Extract visual chat history
                let chatHistory = [];
                const convMessagesContainer = document.getElementById("conv-messages");
                if (convMessagesContainer) {
                    const rows = convMessagesContainer.querySelectorAll(":scope > .flex");
                    rows.forEach(row => {
                        const isUser = row.classList.contains("justify-end");
                        const textNode = row.querySelector(".msg-ai, .msg-user, span.inline-block");
                        if (textNode) {
                            chatHistory.push({ role: isUser ? "user" : "assistant", content: textNode.textContent.trim() });
                        }
                    });
                }
                
                sendDataToStreamlit({
                    action: "conversation_audio",
                    request_id: Date.now().toString() + Math.random().toString(36).slice(2),
                    audio: base64data,
                    mode: document.getElementById("settings-mode")?.textContent || "Casual Chat",
                    difficulty: document.getElementById("settings-level")?.textContent || "Intermediate",
                    voice: document.getElementById("voice-select")?.value || "Bakari",
                    history: chatHistory
                });
                window.setConvStatus("Thinking...", "rgba(234,179,8,0.7)");
            };
        };
        mediaRecorder.start();
        window.setConvStatus("Listening", "rgba(34,197,94,0.7)");
        window.appendMsg("bot", "Hi! I'm Voicely. Start speaking and I will listen.");
    } catch (e) {
        window.appendMsg("bot", "⚠️ Microphone access denied.");
    }
}
function stopMic() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
}
const btnStartConv = document.getElementById("btn-start-conv");
btnStartConv?.addEventListener("click", () => {
    const label = document.getElementById("conv-btn-label")?.textContent;
    if (label === "Start Conversation" || label === "Start Session") { startMic(); } 
    else { stopMic(); }
});
window.setConvStatus = function setConvStatus(label, color) {
    const convStatusBadge = document.getElementById("conv-status-badge");
    const btnL = document.getElementById("conv-btn-label");
    if (convStatusBadge) { convStatusBadge.textContent = label; convStatusBadge.style.background = color; }
    if (btnL) { btnL.textContent = label === "Idle" ? "Start Conversation" : "Stop"; }
}
window.appendMsg = function appendMsg(role, text) {
    const convMessages = document.getElementById("conv-messages");
    if (!convMessages) return;
    const isUser = role === "user";
    const bubble = document.createElement("div");
    bubble.className = `flex ${isUser ? "justify-end" : "justify-start"} animate-fade-up`;
    const styles = isUser ? "background:linear-gradient(135deg,#4A4A4A,#6B6B6B);color:#fff;" : "background:rgba(74,74,74,0.07);color:var(--foreground);";
    bubble.innerHTML = `
        <div class="flex items-end gap-2 max-w-[78%] ${isUser ? "flex-row-reverse" : ""}">
            ${!isUser ? `<div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background:var(--primary);"><span class="material-symbols-outlined text-white text-sm">smart_toy</span></div>` : ""}
            <span class="inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed" style="${styles}">${text}</span>
        </div>`;
    convMessages.appendChild(bubble);
    convMessages.scrollTop = convMessages.scrollHeight;
}

// ——————————————————————————————————————————————
// Sign Out Handler
// ——————————————————————————————————————————————
document.getElementById("btn-signout")?.addEventListener("click", () => {
    localStorage.removeItem("user_details");
    localStorage.removeItem("past_chats");
    sendDataToStreamlit({
        action: "signout",
        request_id: Date.now().toString() + Math.random().toString(36).slice(2)
    });
});
}); // Closes the window.addEventListener DOMContentLoaded
