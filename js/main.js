let currentUser = null;
let isLoading = false;
let darkTheme = load("darkTheme", false);

document.addEventListener("DOMContentLoaded", () => {
  toggleTheme(darkTheme);
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
  const avatarEls = document.querySelectorAll(".self-avatar");
  avatarEls?.forEach((el) => {
    const imageUrl = getAvatarImage(currentUser);
    const letter = getAvatarLetter(currentUser);

    el.innerHTML = imageUrl ? `<img src="${imageUrl}">` : letter;
  });

  const usernameEls = document.querySelectorAll(".self-username");
  usernameEls?.forEach((el) => {
    el.textContent = getUserName(currentUser);
  });

  const themeCheckboxes = document.querySelectorAll(".item-theme input");
  const themeDescEls = document.querySelectorAll(".item-theme .desc");
  themeCheckboxes?.forEach((el) => (el.checked = darkTheme));
  themeDescEls?.forEach((el) => (el.textContent = darkTheme ? "Enabled" : "Disabled"));
}

function handleUnavailable() {
  Toast.show("Coming soon!");
}

function getUserName(user) {
  return user.displayName || user.email || "Anonymous User";
}

function getAvatarImage(data) {
  const imageUrl = data.photoUrl || data.avatar;
  if (imageUrl) return imageUrl;
}

function getAvatarLetter(data) {
  const userName = data.displayName || data.email || data.authorName || "Anonymous User";
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

function toggleTheme(force) {
  darkTheme = force !== undefined ? force : !darkTheme;
  save("darkTheme", darkTheme);
  document.body.classList.toggle("dark-theme", darkTheme);
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
