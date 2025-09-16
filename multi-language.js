// CodeMirror Init
let editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
    mode: "javascript",
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 4,
    tabSize: 4
});

// Language Change Event
document.getElementById('languageSelect').addEventListener('change', function () {
    let lang = this.value;
    editor.setOption("mode", lang);
});

// --- Auto-load snippet if ?snippet= is in URL ---
window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const snippetIndex = params.get("snippet");

    if (snippetIndex !== null) {
        let snippets = JSON.parse(localStorage.getItem("snippets")) || [];
        let s = snippets[snippetIndex];
        if (s) {
            editor.setValue(s.code);
            document.getElementById('languageSelect').value = s.language || "javascript";
            editor.setOption("mode", s.language || "javascript");
        }
    }
});

// Save Code Function
document.getElementById('saveCode').addEventListener('click', function () {
    let lang = document.getElementById('languageSelect').value;
    let code = editor.getValue();

    if (!code.trim()) {
        alert("⚠️ Please write some code before saving!");
        return;
    }

    let snippets = JSON.parse(localStorage.getItem("snippets")) || [];

    let snippetData = {
        name: `Snippet #${snippets.length + 1} (${lang})`,
        code: code,
        visibility: "Public",
        created: new Date(),
        language: lang
    };

    snippets.push(snippetData);
    localStorage.setItem("snippets", JSON.stringify(snippets));

    alert("💾 Code saved successfully to Secure Storage!");
});

// Copy Code Function
document.getElementById('copyCode').addEventListener('click', function () {
    navigator.clipboard.writeText(editor.getValue()).then(() => {
        alert("📋 Code copied to clipboard!");
    });
});

// Download Code Function
document.getElementById('downloadCode').addEventListener('click', function () {
    let lang = document.getElementById('languageSelect').value;
    let extensionMap = {
        "javascript": "js",
        "python": "py",
        "text/x-c++src": "cpp",
        "text/x-java": "java",
        "xml": "html"
    };
    let extension = extensionMap[lang] || "txt";
    let blob = new Blob([editor.getValue()], { type: "text/plain" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `code.${extension}`;
    link.click();
});

// Share Link Function
document.getElementById('shareCode').addEventListener('click', function () {
    let code = encodeURIComponent(editor.getValue());
    let shareLink = `${window.location.origin}${window.location.pathname}?code=${code}`;
    navigator.clipboard.writeText(shareLink).then(() => {
        alert("🔗 Share link copied to clipboard!");
    });
});