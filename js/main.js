const urlParams = new URLSearchParams(window.location.search);
let isLoading = false;
let currentUser = null;
let currentSettings = load("currentSettings", {
  privateAccount: false,
  notifications: true,
  dataSaver: false,
  darkTheme: false,
});

document.addEventListener("DOMContentLoaded", async () => {
  loading(true);
  await loadResources(RESOURCES.utils);
  for (const component of [LoadingOverlay, Toast]) {
    await component.init();
  }

  loadingWithOverlay(true);

  Firebase.init();
  updateUI();
});

async function onAuthStateChanged(user) {
  currentAuthUser = user;

  if (currentAuthUser) await Firebase.syncCurrentUser();
  else currentUser = null;

  const isPassed = protectPage();
  if (!isPassed) return;
  await window.initPage?.();

  if (currentUser) await Firebase.loadCurrentUser();

  loadingWithOverlay(false);
}

function changePage(name, params = "") {
  if (!name) {
    window.location.href = "/";
    return;
  }
  const isAuth = ["signup", "login", "password-reset", "action"].includes(name);
  const targetPath = `/pages/${isAuth ? "auth" : name}/${name}.html`;
  if (window.location.pathname.includes(targetPath)) return;
  window.location.href = `${targetPath}${params}`;
}

function protectPage() {
  const currentPath = window.location.pathname;
  const publicPages = ["signup", "login", "password-reset", "action"];

  // If the user is logged in, do nothing—let them stay anywhere.
  // If they are NOT logged in and NOT on a public page, redirect to login.
  if (!currentAuthUser && !publicPages.some((item) => currentPath.includes(`/${item}.html`))) {
    changePage("login");
    return false;
  }
  return true;
}

function loading(state = true) {
  isLoading = state;
}

function loadingWithOverlay(state = true) {
  isLoading = state;
  LoadingOverlay.toggle(state);
}

function updateUI() {
  document.body.classList.toggle("dark-theme", currentSettings.darkTheme);

  if (currentUser) {
    const avatarEls = document.querySelectorAll(".self-avatar");
    avatarEls?.forEach((el) => (el.innerHTML = createAvatarHTML(currentUser, false)));

    const usernameEls = document.querySelectorAll(".self-username");
    usernameEls?.forEach((el) => (el.textContent = getUserName(currentUser)));
  }

  const settingEls = document.querySelectorAll(`[data-setting-id]`);
  settingEls.forEach((el) => {
    const setting = currentSettings[el.dataset.settingId];

    const checkbox = el.querySelector("input");
    if (checkbox) checkbox.checked = setting;

    const descEl = el.querySelector(".desc");
    if (descEl) descEl.textContent = setting ? "Enabled" : "Disabled";
  });
}

function getUserName(data) {
  return data.name || data.displayName || data.email || data.authorName || "Anonymous User";
}

function getAvatarImage(data) {
  const imageUrl = data.photoUrl || data.avatarUrl;
  if (imageUrl) return imageUrl;
}

function getAvatarLetter(data) {
  const userName = data.name || data.displayName || data.email || data.authorName || "Anonymous User";
  const letter = escapeHTML(userName.charAt(0).toUpperCase());

  return letter;
}

function createAvatarHTML(data, isOuter = true) {
  const imageUrl = getAvatarImage(data);

  if (imageUrl) return `<img${isOuter ? ` class="avatar"` : ""} src="${imageUrl}">`;

  const letter = getAvatarLetter(data);
  return `<div${isOuter ? ` class="avatar"` : ""}>${letter}</div>`;
}

function goToProfilePage(userId) {
  userId = userId || currentUser.id;
  changePage("profile", `?user_id=${userId}`);
}

function toggleSetting(name, force) {
  currentSettings[name] = force !== undefined ? force : !currentSettings[name];
  save("currentSettings", currentSettings);
  updateUI();
}

async function logout() {
  if (isLoading) return;
  loading(true);
  await Firebase.logout();
  loading(false);
}

async function followUser(userId) {
  if (isLoading) return;
  loading(true);
  await Firebase.followUser(currentUser.id, userId);
  loading(false);
}

async function deleteAccount() {
  if (isLoading) return;

  const confirmed = await ConfirmModal.confirmAction(`Delete account?`, "This action cannot be undone.");
  if (!confirmed) return;

  loading(true);
  await Firebase.deleteUser(currentUser.id);
  loading(false);
}

function debug() {
  if (typeof currentUser !== "undefined") console.log("currentUser", currentUser);
  if (typeof targetUser !== "undefined") console.log("targetUser", targetUser);
  if (typeof currentPosts !== "undefined") console.log("currentPosts", currentPosts);
}

const keyActions = {
  Space: debug,
  KeyF: toggleFullscreen,
};

document.addEventListener("keydown", (event) => {
  const action = keyActions[event.code];
  const isFocus = document.activeElement.matches("input, textarea");

  if (action && !isFocus) {
    event.preventDefault();
    action();
  }
});
