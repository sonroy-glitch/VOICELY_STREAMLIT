
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
window.addEventListener("message", function(event) {
    if (event.data.type === "streamlit:render") {
        const args = event.data.args;
        if (args && args.audio_b64) {
            const audio = new Audio("data:audio/wav;base64," + args.audio_b64);
            audio.play();
            const voiceResult = document.getElementById("voice-result");
            if (voiceResult) {
                const icon = document.getElementById("play-icon");
                const label = document.getElementById("play-label");
                if (icon) icon.textContent = "play_arrow";
                if (label) label.textContent = "Play";
                document.querySelectorAll(".waveform-bar").forEach(b => b.classList.remove("wave-bar"));
            }
        }
        if (args && args.reply_text) {
             if(typeof appendMsg === "function") appendMsg("bot", args.reply_text);
             if(typeof setConvStatus === "function") setConvStatus("Idle", "rgba(107,114,128,0.5)");
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
    
    // Auto Login Feature
    const udStr = localStorage.getItem('user_details');
    if (udStr) {
        try {
            const ud = JSON.parse(udStr);
            if (ud && ud.id) {
                // If we are at the login screen and user details exist, push login state
                sendDataToStreamlit({ action: 'login', user: ud });
            }
        } catch(e) {}
    }

    
    document.getElementById("btn-generate")?.addEventListener("click", () => {
        const text = document.getElementById("voice-text")?.value;
        const lang = document.getElementById("voice-language")?.value;
        sendDataToStreamlit({ action: "generate_voice", text: text, lang: lang });
    });
});
