/**
 * Mini Banking – API Integration
 */

const API_BASE = 'http://localhost:5000/api';
const STORAGE_USER = "miniBankAuthUser";
const STORAGE_TOKEN = "miniBankAuthToken";

// ---------------------------------------------------------------------------
// Storage & state
// ---------------------------------------------------------------------------

function getToken() {
  return localStorage.getItem(STORAGE_TOKEN);
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(user, token) {
  if (user && token) {
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem(STORAGE_TOKEN);
  }
}

function updateLocalBalance(newBalance) {
  const user = getCurrentUser();
  if (user) {
    user.balance = newBalance;
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  }
}

// ---------------------------------------------------------------------------
// Auth (Login & Register)
// ---------------------------------------------------------------------------

async function register(name, email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message || 'Registration failed' };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: 'Server error. Is backend running?' };
  }
}

async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message || 'Login failed' };
    
    setSession(data.user, data.token);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: 'Server error. Is backend running?' };
  }
}

async function forgotPassword(email) {
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message || 'Action failed' };
    return { ok: true, message: data.message, token: data.token };
  } catch (error) {
    return { ok: false, message: 'Server error.' };
  }
}

async function resetPassword(token, newPassword) {
  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message || 'Reset failed' };
    return { ok: true, message: data.message };
  } catch (error) {
    return { ok: false, message: 'Server error.' };
  }
}

async function changePassword(oldPassword, newPassword) {
  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message || 'Change failed' };
    return { ok: true, message: data.message };
  } catch (error) {
    return { ok: false, message: 'Server error.' };
  }
}

async function deleteAccount(password) {
  try {
    const res = await fetch(`${API_BASE}/user/delete-account`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message || 'Delete failed' };
    return { ok: true, message: data.message };
  } catch (error) {
    return { ok: false, message: 'Server error.' };
  }
}

async function uploadPhoto(file) {
  try {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(`${API_BASE}/user/upload-photo`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message || 'Upload failed' };

    // Update local storage user profile photo
    const user = getCurrentUser();
    if (user) {
      user.profile_photo = data.profile_photo;
      localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    }

    return { ok: true, message: data.message, photoUrl: data.profile_photo };
  } catch (error) {
    return { ok: false, message: 'Server error.' };
  }
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Transaction logic
// ---------------------------------------------------------------------------

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "₹0.00";
  return parseFloat(amount).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function doDeposit(amount, note) {
  try {
    const res = await fetch(`${API_BASE}/transaction/deposit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ amount, note })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message };
    updateLocalBalance(data.balance);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: 'Server error' };
  }
}

async function doWithdraw(amount, note) {
  try {
    const res = await fetch(`${API_BASE}/transaction/withdraw`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ amount, note })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message };
    updateLocalBalance(data.balance);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: 'Server error' };
  }
}

async function doTransfer(receiverEmail, amount, note) {
  try {
    const res = await fetch(`${API_BASE}/transaction/transfer`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ receiverEmail, amount, note })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.message };
    updateLocalBalance(data.balance);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: 'Server error' };
  }
}

async function fetchHistory() {
  try {
    const res = await fetch(`${API_BASE}/transaction/history`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${getToken()}`
      }
    });
    const data = await res.json();
    if (!res.ok) return [];
    return data.transactions || [];
  } catch (error) {
    return [];
  }
}


// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function showAuthTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotForm = document.getElementById("forgotForm");
  const resetForm = document.getElementById("resetForm");

  if (loginForm) loginForm.classList.toggle("hidden", tab !== "login");
  if (registerForm) registerForm.classList.toggle("hidden", tab !== "register");
  if (forgotForm) forgotForm.classList.toggle("hidden", tab !== "forgot");
  if (resetForm) resetForm.classList.toggle("hidden", tab !== "reset");

  // Keep the auth tabs active states mapped only to login/register buttons
  document.querySelectorAll(".auth-tab").forEach((el) => {
    // If we're on forgot or reset, maybe un-highlight both tabs, or let login remain highlighted.
    // For simplicity, let's just highlight if there's a matching tab.
    el.classList.toggle("active", el.getAttribute("data-tab") === tab);
  });

  const msg = document.getElementById("authMessage");
  if (msg) msg.textContent = "";
}

function renderDashboard() {
  const user = getCurrentUser();
  const nameEl = document.getElementById("accountName");
  const balanceEl = document.getElementById("balance");
  const photoEl = document.getElementById("profilePhoto");

  if (nameEl) nameEl.textContent = user ? (user.name || "—") : "—";
  if (balanceEl) balanceEl.textContent = user ? formatCurrency(user.balance) : "₹0.00";
  
  if (photoEl && user && user.profile_photo) {
    photoEl.src = `http://localhost:5000${user.profile_photo}`;
    photoEl.style.display = "block";
  }
}

function showMessage(elId, text, kind) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.classList.remove("error", "success");
  if (kind) el.classList.add(kind);
}

async function renderHistory() {
  const tbody = document.getElementById("historyBody");
  if (!tbody) return;

  const typeLabels = {
    deposit: "Deposit",
    withdraw: "Withdraw",
    transfer: "Transfer",
  };
  const typeClasses = {
    deposit: "type-deposit",
    withdraw: "type-withdraw",
    transfer: "type-transfer-out",
  };

  tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

  const transactions = await fetchHistory();
  const user = getCurrentUser();

  tbody.innerHTML = "";
  if (!transactions.length) {
    const row = document.createElement("tr");
    row.className = "empty";
    row.innerHTML = '<td colspan="5">No transactions found.</td>';
    tbody.appendChild(row);
    return;
  }

  transactions.forEach((tx) => {
    let typeLabel = typeLabels[tx.type] || tx.type;
    let typeClass = typeClasses[tx.type] || "";
    let amountSign = "";

    if (tx.type === "transfer") {
      if (tx.user_id === user.id) {
        typeLabel = "Transfer Out";
        typeClass = "type-transfer-out";
        amountSign = "-";
      } else {
        typeLabel = "Transfer In";
        typeClass = "type-transfer-in";
        amountSign = "+";
      }
    } else if (tx.type === "withdraw") {
      amountSign = "-";
    } else if (tx.type === "deposit") {
      amountSign = "+";
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(tx.created_at).toLocaleString()}</td>
      <td class="${typeClass}">${typeLabel}</td>
      <td class="amount">${amountSign}${formatCurrency(tx.amount)}</td>
      <td class="amount">—</td> 
      <td>${tx.note || "—"}</td>
    `;
    // Balance After is not exposed in the API directly right now, so emitting visual dashes.
    tbody.appendChild(row);
  });
}

function setHeaderUser() {
  const user = getCurrentUser();
  const el = document.getElementById("headerUserName");
  if (el) el.textContent = user ? (user.name || "User") : "User";
}

// ---------------------------------------------------------------------------
// Init per page
// ---------------------------------------------------------------------------

function initAuth() {
  if (getToken()) {
    window.location.href = "dashboard.html";
    return;
  }
  document.querySelectorAll(".auth-tab").forEach((btn) => {
    btn.addEventListener("click", () => showAuthTab(btn.getAttribute("data-tab")));
  });
  
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailEl = document.getElementById("loginEmail");
      const passwordEl = document.getElementById("loginPassword");
      const email = emailEl ? emailEl.value : "";
      const password = passwordEl ? passwordEl.value : "";
      
      const submitBtn = loginForm.querySelector('button');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Loading...";
      submitBtn.disabled = true;

      const result = await login(email, password);
      
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;

      const msgEl = document.getElementById("authMessage");
      if (result.ok) {
        window.location.href = "dashboard.html";
      } else {
        if (msgEl) {
          msgEl.textContent = result.message || "Login failed.";
          msgEl.className = "message error";
        }
      }
    });
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameEl = document.getElementById("regName");
      const emailEl = document.getElementById("regEmail");
      const passwordEl = document.getElementById("regPassword");
      const name = nameEl ? nameEl.value : "";
      const email = emailEl ? emailEl.value : "";
      const password = passwordEl ? passwordEl.value : "";
      
      const submitBtn = registerForm.querySelector('button');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Loading...";
      submitBtn.disabled = true;

      const result = await register(name, email, password);
      
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;

      const msgEl = document.getElementById("authMessage");
      if (result.ok) {
        if (msgEl) {
          msgEl.textContent = "Account created. You can sign in now.";
          msgEl.className = "message success";
        }
        showAuthTab("login");
        const loginEmailEl = document.getElementById("loginEmail");
        if (loginEmailEl) loginEmailEl.value = email;
      } else {
        if (msgEl) {
          msgEl.textContent = result.message || "Registration failed.";
          msgEl.className = "message error";
        }
      }
    });
  }

  // Show Forgot Form
  const showForgotBtn = document.getElementById("showForgotBtn");
  if (showForgotBtn) {
    showForgotBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showAuthTab("forgot");
    });
  }

  const backToLoginBtn = document.getElementById("backToLoginBtn");
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showAuthTab("login");
    });
  }

  const forgotForm = document.getElementById("forgotForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("forgotEmail").value;
      const submitBtn = forgotForm.querySelector('button');
      submitBtn.textContent = "Loading...";
      submitBtn.disabled = true;

      const result = await forgotPassword(email);

      submitBtn.textContent = "Send Reset Link";
      submitBtn.disabled = false;

      const msgEl = document.getElementById("authMessage");
      if (result.ok) {
        msgEl.textContent = `Token generated: ${result.token}`;
        msgEl.className = "message success";
        
        console.log("Your Password Reset Token is:", result.token);
        
        // Auto-fill the reset form for demo purposes
        const resetTokenInput = document.getElementById("resetToken");
        if (resetTokenInput) resetTokenInput.value = result.token;
        
        // Since we don't have email sending configured natively, we switch directly to reset form 
        showAuthTab("reset");
      } else {
        msgEl.textContent = result.message;
        msgEl.className = "message error";
      }
    });
  }

  const resetForm = document.getElementById("resetForm");
  if (resetForm) {
    resetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = document.getElementById("resetToken").value;
      const password = document.getElementById("resetPassword").value;
      
      const submitBtn = resetForm.querySelector('button');
      submitBtn.textContent = "Loading...";
      submitBtn.disabled = true;

      const result = await resetPassword(token, password);

      submitBtn.textContent = "Reset Password";
      submitBtn.disabled = false;

      const msgEl = document.getElementById("authMessage");
      if (result.ok) {
        msgEl.textContent = "Password reset successfully. Please login.";
        msgEl.className = "message success";
        showAuthTab("login");
      } else {
        msgEl.textContent = result.message;
        msgEl.className = "message error";
      }
    });
  }
}

function initAppPages() {
  if (!requireAuth()) return;
  setHeaderUser();

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      setSession(null, null);
      window.location.href = "index.html";
    });
  }

  const page = document.body.getAttribute("data-page");

  if (page === "dashboard") {
    renderDashboard();

    const photoUploadForm = document.getElementById("photoUploadForm");
    if (photoUploadForm) {
      photoUploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById("photoInput");
        if (!fileInput.files.length) return;

        const result = await uploadPhoto(fileInput.files[0]);
        if (result.ok) {
          showMessage("photoMessage", "Photo uploaded!", "success");
          
          const photoEl = document.getElementById("profilePhoto");
          if (photoEl) {
            photoEl.src = `http://localhost:5000${result.photoUrl}`;
            photoEl.style.display = "block";
          }
          photoUploadForm.reset();
        } else {
          showMessage("photoMessage", result.message, "error");
        }
      });
    }

    const changePasswordForm = document.getElementById("changePasswordForm");
    if (changePasswordForm) {
      changePasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const oldPass = document.getElementById("oldPassword").value;
        const newPass = document.getElementById("newPassword").value;

        const result = await changePassword(oldPass, newPass);
        if (result.ok) {
          showMessage("passwordMessage", result.message, "success");
          changePasswordForm.reset();
        } else {
          showMessage("passwordMessage", result.message, "error");
        }
      });
    }

    const deleteAccountForm = document.getElementById("deleteAccountForm");
    if (deleteAccountForm) {
      deleteAccountForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        if (!confirm("Are you sure you want to permanently delete your account?")) return;

        const deletePass = document.getElementById("deletePassword").value;

        const result = await deleteAccount(deletePass);
        if (result.ok) {
          setSession(null, null);
          window.location.href = "index.html"; // Redirect to login
        } else {
          showMessage("deleteMessage", result.message, "error");
        }
      });
    }
  }

  if (page === "deposit") {
    const form = document.getElementById("depositForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById("depositAmount").value);
        const noteEL = document.getElementById("depositNote");
        const note = noteEL ? noteEL.value.trim() : "";
        
        const submitBtn = form.querySelector('button');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Processing...";
        submitBtn.disabled = true;

        const result = await doDeposit(amount, note);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        if (result.ok) {
          showMessage("depositMessage", "Deposit successful. Go to Dashboard to see balance.", "success");
          form.reset();
        } else {
          showMessage("depositMessage", result.message, "error");
        }
      });
    }
  }

  if (page === "withdraw") {
    const form = document.getElementById("withdrawForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById("withdrawAmount").value);
        const noteEL = document.getElementById("withdrawNote");
        const note = noteEL ? noteEL.value.trim() : "";
        
        const submitBtn = form.querySelector('button');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Processing...";
        submitBtn.disabled = true;

        const result = await doWithdraw(amount, note);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        if (result.ok) {
          showMessage("withdrawMessage", "Withdrawal successful. Go to Dashboard to see balance.", "success");
          form.reset();
        } else {
          showMessage("withdrawMessage", result.message, "error");
        }
      });
    }
  }

  if (page === "transfer") {
    const form = document.getElementById("transferForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const to = document.getElementById("transferTo").value;
        const amount = parseFloat(document.getElementById("transferAmount").value);
        const noteEL = document.getElementById("transferNote");
        const note = noteEL ? noteEL.value.trim() : "";
        
        const submitBtn = form.querySelector('button');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Processing...";
        submitBtn.disabled = true;

        const result = await doTransfer(to, amount, note);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        if (result.ok) {
          showMessage("transferMessage", "Transfer successful.", "success");
          form.reset();
        } else {
          showMessage("transferMessage", result.message, "error");
        }
      });
    }
  }

  if (page === "history") {
    renderHistory();
  }
}

function init() {
  const page = document.body.getAttribute("data-page");
  if (page === "auth") {
    initAuth();
  } else if (page) {
    initAppPages();
  }
}

init();
