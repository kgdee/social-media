let currentUser = null;
let isLoading = false;

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
  avatarEls.forEach((el) => {
    const imageUrl = getAvatarImage(currentUser);
    const letter = getAvatarLetter(currentUser);

    el.innerHTML = imageUrl ? `<img src="${imageUrl}">` : letter;
  });
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
