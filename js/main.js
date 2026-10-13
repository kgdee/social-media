let currentUser = null;
let isLoading = false;
const currentSettings = load("currentSettings", {
  privateAccount: false,
  notifications: true,
  dataSaver: false,
  darkTheme: false,
});

document.addEventListener("DOMContentLoaded", () => {
  updateUI();
});

function changePage(name, params = "") {
  const targetPath = `/pages/${name}/${name}.html`;
  if (window.location.pathname.includes(targetPath)) return;
  window.location.replace(`${targetPath}${params}`);
}

function loading(state = true) {
  isLoading = state;
}

function updateUI() {
  document.body.classList.toggle("dark-theme", currentSettings.darkTheme);

  if (currentUser) {
    const avatarEls = document.querySelectorAll(".self-avatar");
    avatarEls?.forEach((el) => (el.innerHTML = createAvatarHTML(currentUser)));

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

function handleUnavailable() {
  Toast.show("Coming soon!");
}

function getUserName(user) {
  return user.name || user.displayName || user.email || "Anonymous User";
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

function createAvatarHTML(data) {
  const imageUrl = getAvatarImage(data);

  if (imageUrl) return `<img class="avatar" src="${imageUrl}">`;

  const letter = getAvatarLetter(data);
  return `<div class="avatar">${letter}</div>`;
}

function goToProfilePage(userId) {
  userId = userId || currentUser.uid;
  changePage("profile", `?user_id=${userId}`);
}

function toggleSetting(name, force) {
  currentSettings[name] = force !== undefined ? force : !currentSettings[name];
  save("currentSettings", currentSettings);
  updateUI();
}

function protectPage() {
  const currentPath = window.location.pathname;
  const publicPages = ["/login.html", "/signup.html"];

  // If the user is logged in, do nothing—let them stay anywhere.
  // If they are NOT logged in and NOT on a public page, redirect to login.
  if (!currentUser && !publicPages.some((item) => currentPath.includes(item))) {
    changePage("login");
  }
}

function debug() {
  console.log("currentPosts", currentPosts);
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
