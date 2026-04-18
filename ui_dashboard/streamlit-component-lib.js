
function sendDataToStreamlit(data) {
    window.parent.postMessage({
        isStreamlitMessage: true,
        type: "streamlit:setComponentValue",
        value: data
    }, "*");
}
const Streamlit = {
    setFrameHeight: function() {
        window.parent.postMessage({
            isStreamlitMessage: true,
            type: "streamlit:setFrameHeight",
            height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
        }, "*");
    }
};

// Track the last played audio and last appended reply to prevent duplicates
let _lastPlayedAudioHash = null;
let _lastAppendedReply = null;

function _simpleHash(str) {
    if (!str) return null;
    // Use first 64 chars + length as a fast fingerprint
    return str.substring(0, 64) + ":" + str.length;
}
let _hasFetchedChats = false;

// Global audio element to bypass autoplay restrictions on iOS/Safari/Chrome
const globalAudioPlayer = new Audio();
// A tiny, valid silent MP3 file to properly unlock the AudioContext
const silentAudio = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjkxLjEwMAAAAAAAAAAAAAAAAEQAAAAALv/zZAAAABAAABkAAAAAADyAEKAAAAAAzMzMyv/zZAAASxAAQkAAAAAAzMzMyv/zZAAASxAAQkAAAAAAzMzMyv/zZAAASxAAQkAAAAAAzMzMw==";

window.addEventListener("message", function(event) {
    if (event.data.type === "streamlit:render") {
        const args = event.data.args;

        // ... keeping audio logic intact up to the handle sync ...

        // --- Handle TTS audio from Voice Lab (generate_voice) ---
        if (args && args.audio_b64 && !args.reply_text) {
            const audioHash = _simpleHash(args.audio_b64);
            if (audioHash !== _lastPlayedAudioHash) {
                _lastPlayedAudioHash = audioHash;
                globalAudioPlayer.src = "data:audio/mpeg;base64," + args.audio_b64;
                globalAudioPlayer.play().catch(e => console.error("Audio Playback Error:", e));
            }
            const voiceResult = document.getElementById("voice-result");
            if (voiceResult) {
                const icon = document.getElementById("play-icon");
                const label = document.getElementById("play-label");
                if (icon) icon.textContent = "play_arrow";
                if (label) label.textContent = "Play";
                document.querySelectorAll(".waveform-bar").forEach(b => b.classList.remove("wave-bar"));
            }
        }

        // --- Handle conversation reply (reply_text + optional audio) ---
        if (args && args.reply_text) {
            const replyHash = _simpleHash(args.reply_text);
            if (replyHash !== _lastAppendedReply) {
                _lastAppendedReply = replyHash;

                // Append the user's transcribed text if provided
                if (args.user_transcript && typeof window.appendMsg === "function") {
                    window.appendMsg("user", args.user_transcript);
                }

                // Append bot reply
                if (typeof window.appendMsg === "function") {
                    window.appendMsg("bot", args.reply_text);
                }

                // Play the conversation audio response (only once)
                if (args.audio_b64) {
                    globalAudioPlayer.src = "data:audio/wav;base64," + args.audio_b64;
                    globalAudioPlayer.play().catch(e => console.error("Conv Audio Error:", e));
                }

                // Reset status to idle
                if (typeof window.setConvStatus === "function") {
                    window.setConvStatus("Idle", "rgba(107,114,128,0.5)");
                }
            }
        }

        // --- Handle Past Chats Payload From Python (If any) ---
        if (args && args.past_chats && typeof window.renderHistory === "function") {
            window.renderHistory(args.past_chats);
        }

        // --- Handle user_details sync ---
        if (args && args.user_details) {
            localStorage.setItem('user_details', JSON.stringify(args.user_details));
            if (!_hasFetchedChats) {
                _hasFetchedChats = true;
                fetch('https://voicely-backend.vercel.app/retrieve_chats', {
                    headers: { 'user_id': String(args.user_details.id) }
                }).then(r => r.json()).then(data => {
                    localStorage.setItem('past_chats', JSON.stringify(data));
                    if (typeof window.renderHistory === "function") window.renderHistory(data);
                }).catch(e => console.error("Error fetching chats:", e));
            }
        }
        
        // --- Handle Scoring Payload Updates ---
        if (args && args.scoring_paragraph) {
            const pEl = document.getElementById("scoring-paragraph-text");
            if (pEl && pEl.textContent !== args.scoring_paragraph) {
                pEl.textContent = args.scoring_paragraph;
            }
            const icon = document.getElementById("icon-generate-paragraph");
            if (icon) icon.classList.remove("animate-spin");
        }
        
        if (args && args.scoring_results) {
            const results = args.scoring_results;
            
            ['fluency', 'accuracy', 'intonation', 'rhythm'].forEach(metric => {
                const val = results[metric] || 0;
                const txt = document.getElementById("txt-" + metric);
                const bar = document.getElementById("bar-" + metric);
                if (txt) txt.textContent = val + "%";
                if (bar) bar.style.width = val + "%";
            });
            
            const overall = document.getElementById("score-overall");
            if (overall) {
                const oldVal = parseInt(overall.textContent) || 0;
                const newVal = parseInt(results.score) || 0;
                // simple anim
                overall.textContent = newVal;
            }
            
            const circle = document.getElementById("score-circle-path");
            if (circle) {
                const totalDash = 376.99;
                const offset = totalDash - (totalDash * (results.score || 0) / 100);
                circle.style.strokeDashoffset = offset;
            }
            
            const label = document.getElementById("score-mic-label");
            if (label && label.textContent === "Analyzing...") {
                label.textContent = "Start Reading";
            }
        }

        Streamlit.setFrameHeight();
    }
});

window.addEventListener("load", function() {
    window.parent.postMessage({
        isStreamlitMessage: true,
        type: "streamlit:componentReady",
        apiVersion: 1
    }, "*");
    setTimeout(() => Streamlit.setFrameHeight(), 100);
    const observer = new MutationObserver(() => Streamlit.setFrameHeight());
    observer.observe(document.body, { childList: true, subtree: true });
    
    document.getElementById("btn-generate")?.addEventListener("click", () => {
        // Unlock audio context on user interaction with silent audio
        if (!globalAudioPlayer.src || globalAudioPlayer.src === window.location.href) {
            globalAudioPlayer.src = silentAudio;
            globalAudioPlayer.play().catch(e => {});
        }
        const text = document.getElementById("voice-text")?.value;
        const lang = document.getElementById("voice-language")?.value;
        sendDataToStreamlit({ action: "generate_voice", request_id: Date.now().toString() + Math.random().toString(36).slice(2), text: text, lang: lang });
    });
    
    document.getElementById("btn-start-conv")?.addEventListener("click", () => {
        // Unlock audio context on user interaction with silent audio
        if (!globalAudioPlayer.src || globalAudioPlayer.src === window.location.href) {
            globalAudioPlayer.src = silentAudio;
            globalAudioPlayer.play().catch(e => {});
        }
    });
});
