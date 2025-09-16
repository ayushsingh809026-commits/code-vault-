// CodeVault - Common Script (Patched)
// Guards for DOM availability; editor features trigger only when present; normalize "snippets" key

(function(){
  const byId = (id) => document.getElementById(id);

  // CodeMirror editor (only if textarea exists and CodeMirror is available)
  let editor;
  const codeEditorEl = byId('codeEditor');
  if (codeEditorEl && window.CodeMirror) {
    editor = CodeMirror.fromTextArea(codeEditorEl, {
      mode: "javascript",
      theme: "dracula",
      lineNumbers: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      indentUnit: 4,
      tabSize: 4
    });
  }

  const languageSelect = byId('languageSelect');
  if (languageSelect && editor){
    languageSelect.addEventListener('change', () => editor.setOption("mode", languageSelect.value));
  }

  // Buttons (guarded)
  const copyBtn = byId('copyCode');
  if (copyBtn && editor){
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(editor.getValue()).then(() => alert("✅ Code copied!"));
    });
  }

  const dlBtn = byId('downloadCode');
  if (dlBtn && editor){
    dlBtn.addEventListener('click', () => {
      const map = { "javascript":"js","python":"py","text/x-c++src":"cpp","text/x-java":"java","xml":"html" };
      const ext = map[(languageSelect?.value)||""] || "txt";
      const blob = new Blob([editor.getValue()], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `code.${ext}`;
      a.click();
    });
  }

  const shareBtn = byId('shareCode');
  if (shareBtn && editor){
    shareBtn.addEventListener('click', () => {
      const code = encodeURIComponent(editor.getValue());
      const link = `${location.origin}${location.pathname}?code=${code}`;
      navigator.clipboard.writeText(link).then(() => alert("🔗 Share link copied!"));
    });
  }

  // Storage helpers (normalize to "snippets")
  function getSnippets(){ try { return JSON.parse(localStorage.getItem("snippets")||"[]"); } catch(e){ return []; } }
  function setSnippets(v){ localStorage.setItem("snippets", JSON.stringify(v)); }

  // Optional: migrate from "codeVaultSnippets" if exists
  try {
    const legacy = localStorage.getItem("codeVaultSnippets");
    if (legacy && !localStorage.getItem("snippets")){
      localStorage.setItem("snippets", legacy);
    }
  } catch(e){}

  // If URL has ?snippet=<index>, try to load into editor (on editor page)
  const params = new URLSearchParams(location.search);
  if (params.has("snippet") && editor){
    const idx = parseInt(params.get("snippet"), 10);
    const arr = getSnippets();
    if (!isNaN(idx) && arr[idx]){
      editor.setValue(arr[idx].code || "");
      if (languageSelect && arr[idx].language){
        editor.setOption("mode", arr[idx].language);
        languageSelect.value = arr[idx].language;
      }
    }
  }

  // If URL has ?code=<encoded>, import into editor
  if (params.has("code") && editor){
    try {
      editor.setValue(decodeURIComponent(params.get("code")));
    } catch(e){ /* ignore */ }
  }
})();