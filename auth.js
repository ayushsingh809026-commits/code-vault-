// auth.js - robust client-side auth for CodeVault (overwrite)
(function () {
  'use strict';

  const LS_USERS = 'cv_users_v1';
  const LS_CURRENT = 'cv_current_user_v1';

  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(LS_USERS) || '[]'); }
    catch (e) { console.error('loadUsers parse error', e); return []; }
  }
  function saveUsers(users) { localStorage.setItem(LS_USERS, JSON.stringify(users || [])); }

  function setCurrent(user) {
    try {
      if (user) localStorage.setItem(LS_CURRENT, JSON.stringify(user));
      else localStorage.removeItem(LS_CURRENT);
    } catch (e) { console.error('setCurrent error', e); }
    // update nav immediately if available
    try { if (typeof renderNavbar === 'function') renderNavbar(); } catch(e){}
  }

  function getCurrent() {
    try { return JSON.parse(localStorage.getItem(LS_CURRENT) || 'null'); }
    catch (e) { return null; }
  }

  // expose logout globally
  window.logout = function () {
    setCurrent(null);
    // redirect to home
    window.location.href = 'index.html';
  };

  // Render navbar user menu (safe guards)
  function buildUserMenu(cur) {
    if (!cur) return '<a class="nav-link" href="login.html">Login</a> <a class="nav-link" href="signup.html">Signup</a>';
    var initials = (cur.name || cur.email || 'U').split(' ').map(s => s.charAt(0)).join('').slice(0,2).toUpperCase();
    var avatar = cur.profileImage ? ('<img src="' + cur.profileImage + '" alt="avatar" style="width:28px;height:28px;border-radius:50%;object-fit:cover;margin-right:8px;vertical-align:middle;">') : ('<span class="drop-avatar">'+initials+'</span>');
    var display = cur.name ? cur.name : cur.email;
    return '<div class="dropdown" id="cv_user_dropdown"><button class="dropbtn" id="cv_dropbtn">' + avatar + '<span style="vertical-align:middle;">' + display + ' ▾</span></button><div class="dropdown-content" id="cv_dropdown_content"><a href="profile.html">Profile</a><a href="#" id="cv_logout_link">Logout</a></div></div>';
  }

  function renderNavbar() {
    var container = document.getElementById('userMenuContainer');
    if (!container) return;
    var cur = getCurrent();
    container.innerHTML = buildUserMenu(cur);
    // attach handlers if logged in
    var logoutLink = document.getElementById('cv_logout_link');
    if (logoutLink) logoutLink.addEventListener('click', function(e){ e.preventDefault(); window.logout(); });
    var dd = document.getElementById('cv_user_dropdown');
    var btn = document.getElementById('cv_dropbtn');
    if (btn && dd) {
      btn.addEventListener('click', function(e){ e.stopPropagation(); dd.classList.toggle('show'); });
      document.addEventListener('click', function(){ dd.classList.remove('show'); });
    }
  }
  window.renderNavbar = renderNavbar;

  // Signup handler - attach when DOM ready
  function initSignup() {
    var signupForm = document.getElementById('signupForm');
    if (!signupForm) return;
    signupForm.addEventListener('submit', function(ev){
      ev.preventDefault();
      var name = (document.getElementById('name').value || '').trim();
      var email = (document.getElementById('email').value || '').toLowerCase().trim();
      var password = document.getElementById('password').value || '';
      var confirm = document.getElementById('confirmPassword').value || '';
      if (!name || !email || !password) { alert('Please fill all required fields.'); return; }
      if (password.length < 6) { alert('Password should be at least 6 characters.'); return; }
      if (password !== confirm) { alert('Passwords do not match.'); return; }
      var users = loadUsers();
      if (users.some(u => u.email === email)) { alert('An account with this email already exists.'); return; }
      var newUser = { id: Date.now(), name: name, email: email, password: password, profileImage: null };
      users.push(newUser); saveUsers(users);
      setCurrent({ id: newUser.id, name: newUser.name, email: newUser.email, profileImage: null });
      // redirect to index (home)
      window.location.href = 'index.html';
    });
  }

  // Login handler - attach when DOM ready
  function initLogin() {
    var loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    loginForm.addEventListener('submit', function(ev){
      ev.preventDefault();
      var email = (document.getElementById('loginEmail').value || '').toLowerCase().trim();
      var password = document.getElementById('loginPassword').value || '';
      if (!email || !password) { alert('Please enter email and password.'); return; }
      var users = loadUsers();
      var user = users.find(u => u.email === email && u.password === password);
      if (!user) { alert('Invalid email or password.'); return; }
      setCurrent({ id: user.id, name: user.name, email: user.email, profileImage: user.profileImage || null });
      window.location.href = 'index.html';
    });
  }

  // Profile page init (populate form & handle save)
  function initProfile() {
    var profileForm = document.getElementById('profileForm');
    if (!profileForm) return;
    var avatarPreview = document.getElementById('avatarPreview');
    var cur = getCurrent();
    if (!cur) { window.location.href = 'login.html'; return; }
    document.getElementById('p_name').value = cur.name || '';
    document.getElementById('p_email').value = cur.email || '';
    document.getElementById('p_image').value = cur.profileImage || '';
    function renderAvatar(url, name) {
      if (!avatarPreview) return;
      if (url) {
        var img = new Image();
        img.onload = function(){ avatarPreview.innerHTML = ''; avatarPreview.appendChild(img); img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; };
        img.onerror = function(){ avatarPreview.textContent = (name || 'U').split(' ').map(s=>s.charAt(0)).join('').slice(0,2).toUpperCase(); };
        img.src = url;
      } else {
        avatarPreview.innerHTML = ''; avatarPreview.textContent = (name || 'U').split(' ').map(s=>s.charAt(0)).join('').slice(0,2).toUpperCase();
      }
    }
    renderAvatar(cur.profileImage, cur.name);
    var imageInput = document.getElementById('p_image');
    if (imageInput) {
      imageInput.addEventListener('input', function(){ var v=this.value.trim(); setTimeout(function(){ renderAvatar(v, document.getElementById('p_name').value); }, 250); });
    }
    profileForm.addEventListener('submit', function(ev){
      ev.preventDefault();
      var newName = document.getElementById('p_name').value.trim();
      var newImage = document.getElementById('p_image').value.trim() || null;
      var oldPass = document.getElementById('old_pass').value || '';
      var newPass = document.getElementById('new_pass').value || '';
      var newPassConfirm = document.getElementById('new_pass_confirm').value || '';
      if (!newName) { document.getElementById('profileMsg').textContent = 'Name is required.'; return; }
      if (newPass || newPassConfirm) {
        if (!oldPass) { document.getElementById('profileMsg').textContent = 'Enter current password to change it.'; return; }
        var users = loadUsers();
        var u = users.find(function(u){ return u.email === cur.email; });
        if (!u || u.password !== oldPass) { document.getElementById('profileMsg').textContent = 'Current password is incorrect.'; return; }
        if (newPass.length < 6) { document.getElementById('profileMsg').textContent = 'New password must be at least 6 characters.'; return; }
        if (newPass !== newPassConfirm) { document.getElementById('profileMsg').textContent = 'New passwords do not match.'; return; }
      }
      // update users list
      try {
        var users = loadUsers();
        var idx = users.findIndex(function(u){ return u.id === cur.id; });
        if (idx === -1) { document.getElementById('profileMsg').textContent = 'User not found.'; return; }
        users[idx].name = newName;
        users[idx].profileImage = newImage || null;
        if (newPass) users[idx].password = newPass;
        saveUsers(users);
        // update current
        setCurrent({ id: users[idx].id, name: users[idx].name, email: users[idx].email, profileImage: users[idx].profileImage || null });
        document.getElementById('profileMsg').textContent = 'Profile updated successfully.';
        document.getElementById('old_pass').value=''; document.getElementById('new_pass').value=''; document.getElementById('new_pass_confirm').value='';
      } catch(e) {
        console.error('profile save error', e); document.getElementById('profileMsg').textContent = 'Failed to save profile.';
      }
    });
  }

  // Init: attach handlers after DOM ready and render navbar
  document.addEventListener('DOMContentLoaded', function(){
    try {
      renderNavbar();
      initSignup();
      initLogin();
      initProfile();
    } catch (e) { console.error('auth init error', e); }
  });

})();