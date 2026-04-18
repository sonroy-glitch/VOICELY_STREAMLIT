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
        if (args && args.chat_data) {
             if (typeof window.renderDetailedChat === "function") {
                 window.renderDetailedChat(args.chat_data);
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
});
