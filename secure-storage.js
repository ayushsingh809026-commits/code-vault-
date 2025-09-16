// CodeVault - Secure Storage (Patched)
// Stores snippets in localStorage under key "snippets". Provides add/edit/delete, filters, profile, and view modal.

(function(){
  const el = (id) => document.getElementById(id);

  // Profile
  let profile = {};
  try { profile = JSON.parse(localStorage.getItem("profile")) || {}; } catch(e){ profile = {}; }
  profile = Object.assign({
    name: "Ayush Singh",
    work: "💻 Full-stack Developer | 🚀 Loves solving problems",
    photo: "https://via.placeholder.com/100"
  }, profile);

  // Snippets
  let snippets = [];
  try { snippets = JSON.parse(localStorage.getItem("snippets")) || []; } catch(e){ snippets = []; }

  // Elements
  const addBtn = el("addSnippetBtn");
  const modal = el("snippetModal");
  const closeModal = document.querySelector(".close");
  const saveBtn = el("saveSnippetBtn");
  const snippetTableBody = el("snippetTableBody");
  const searchBox = el("searchBox");
  const filterVisibility = el("filterVisibility");

  const viewModal = el("viewSnippetModal");
  const closeView = document.querySelector(".close-view");

  let editingIndex = null;

  function timeAgo(date){
    const seconds = Math.floor((new Date() - new Date(date))/1000);
    const map = {year:31536000, month:2592000, week:604800, day:86400, hour:3600, minute:60};
    for (const k in map){ const v = Math.floor(seconds/map[k]); if (v>=1) return `${v} ${k}${v>1?'s':''} ago`; }
    return "Just now";
  }

  function saveSnippets(){ localStorage.setItem("snippets", JSON.stringify(snippets)); renderSnippets(); }

  function renderProfile() {
    if (el("profileName")) el("profileName").innerText = profile.name;
    if (el("profileWork")) el("profileWork").innerText = profile.work;
    if (el("profileAvatar")) el("profileAvatar").src = profile.photo;

    const total = snippets.length;
    const publicCount = snippets.filter(s => s.visibility === "Public").length;
    const privateCount = snippets.filter(s => s.visibility === "Private").length;

    if (el("totalSnippets")) el("totalSnippets").innerText = total;
    if (el("publicSnippets")) el("publicSnippets").innerText = publicCount;
    if (el("privateSnippets")) el("privateSnippets").innerText = privateCount;
  }

  function renderSnippets() {
    if (!snippetTableBody) return;
    const q = (searchBox?.value || "").toLowerCase();
    const vis = (filterVisibility?.value || "all");

    snippetTableBody.innerHTML = "";
    snippets
      .map((s,i)=>({s,i}))
      .filter(({s}) => (vis==="all"||s.visibility===vis) && (s.name.toLowerCase().includes(q)))
      .forEach(({s, i}) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><a href="#" onclick="openSnippet(${i});return false;">${s.name}</a></td>
          <td><span class="badge ${s.visibility.toLowerCase()}">${s.visibility}</span></td>
          <td>${timeAgo(s.created)}</td>
          <td class="actions">
            <button onclick="copySnippet(${i})" class="btn-action">📋 Copy Link</button>
            <button onclick="editSnippet(${i})" class="btn-action">✏️ Edit</button>
            <button onclick="downloadSnippet(${i})" class="btn-action">⬇️ Download</button>
            <button onclick="deleteSnippet(${i})" class="btn-action danger">🗑️ Delete</button>
          </td>`;
        snippetTableBody.appendChild(row);
      });

    renderProfile();
  }

  // Expose a few helpers for inline onclicks
  window.openSnippet = function(index){
    const s = snippets[index];
    if (!s || !viewModal) return;
    if (el("viewSnippetTitle")) el("viewSnippetTitle").innerText = s.name;
    if (el("viewSnippetLang")) el("viewSnippetLang").innerText = `🌐 Language: ${s.language||"Unknown"}`;
    if (el("viewSnippetCode")) el("viewSnippetCode").textContent = s.code;
    viewModal.style.display = "block";
  };

  window.copySnippet = function(i){
    const link = `${location.origin}/multi-language.html?snippet=${i}`;
    navigator.clipboard.writeText(link).then(()=>alert("Snippet link copied!"));
  };

  window.downloadSnippet = function(i){
    const blob = new Blob([snippets[i].code], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${snippets[i].name}.txt`; a.click();
  };

  window.deleteSnippet = function(i){
    if (!confirm("Delete this snippet?")) return;
    snippets.splice(i,1); saveSnippets();
  };

  window.editSnippet = function(i){
    if (!modal) return;
    editingIndex = i;
    if (el("modalTitle")) el("modalTitle").innerText = "Edit Snippet";
    if (el("snippetName")) el("snippetName").value = snippets[i].name;
    if (el("snippetCode")) el("snippetCode").value = snippets[i].code;
    if (el("snippetVisibility")) el("snippetVisibility").value = snippets[i].visibility;
    modal.style.display = "block";
  };

  function bindProfileEditing(){
    const btn = el("editProfileBtn");
    const modalP = el("profileModal");
    if (!btn || !modalP) return;

    btn.addEventListener("click", () => {
      if (el("editName")) el("editName").value = profile.name;
      if (el("editWork")) el("editWork").value = profile.work;
      if (el("editAvatar")) el("editAvatar").value = profile.photo;
      modalP.style.display = "block";
    });

    const saveP = el("saveProfileBtn");
    if (saveP) saveP.addEventListener("click", () => {
      profile.name = el("editName")?.value || profile.name;
      profile.work = el("editWork")?.value || profile.work;
      profile.photo = el("editAvatar")?.value || profile.photo;
      localStorage.setItem("profile", JSON.stringify(profile));
      renderProfile();
      modalP.style.display = "none";
    });

    const closeP = document.querySelector(".close-profile");
    if (closeP) closeP.addEventListener("click", () => modalP.style.display = "none");
    window.addEventListener("click", (e)=> { if (e.target===modalP) modalP.style.display="none"; });
  }

  function bindSnippetModal(){
    if (!addBtn || !modal) return;
    addBtn.addEventListener("click", ()=> {
      editingIndex = null;
      if (el("modalTitle")) el("modalTitle").innerText = "Add New Snippet";
      if (el("snippetName")) el("snippetName").value = "";
      if (el("snippetCode")) el("snippetCode").value = "";
      if (el("snippetVisibility")) el("snippetVisibility").value = "Public";
      modal.style.display = "block";
    });

    if (saveBtn) saveBtn.addEventListener("click", ()=> {
      const name = el("snippetName")?.value.trim();
      const code = el("snippetCode")?.value.trim();
      const visibility = el("snippetVisibility")?.value || "Public";
      if (!name || !code) { alert("Please fill in all fields"); return; }

      const now = new Date();
      if (editingIndex===null){
        snippets.push({ name, code, visibility, created: now });
      } else {
        Object.assign(snippets[editingIndex], { name, code, visibility, created: now });
      }
      localStorage.setItem("snippets", JSON.stringify(snippets));
      renderSnippets();
      modal.style.display = "none";
    });

    if (closeModal) closeModal.addEventListener("click", ()=> modal.style.display="none");
    window.addEventListener("click", (e)=> { if (e.target===modal) modal.style.display="none"; });
  }

  function bindFilters(){
    if (searchBox) searchBox.addEventListener("input", renderSnippets);
    if (filterVisibility) filterVisibility.addEventListener("change", renderSnippets);
    if (closeView && viewModal) closeView.addEventListener("click", ()=> viewModal.style.display="none");
    window.addEventListener("click", (e)=> { if (e.target===viewModal) viewModal.style.display="none"; });
  }

  // Init
  bindProfileEditing();
  bindSnippetModal();
  bindFilters();
  renderSnippets();
  renderProfile();
})();