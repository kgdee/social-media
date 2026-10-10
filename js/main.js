let currentUser = null;
let isLoading = false;

function changePage(name) {
  const targetPath = `/pages/${name}.html`;
  if (window.location.pathname.includes(targetPath)) return;
  window.location.replace(`/pages/${name}.html`);
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

async function signup(event) {
  event.preventDefault();

  if (isLoading) return;
  loading(true);

  const email = document.querySelector(".email-input").value;
  const password = document.querySelector(".password-input").value;

  await Firebase.signup({ email, password });

  event.target.reset();
  loading(false);
}

async function login(event) {
  event.preventDefault();

  if (isLoading) return;
  loading(true);

  const email = document.querySelector(".email-input").value;
  const password = document.querySelector(".password-input").value;

  await Firebase.login({ email, password });

  event.target.reset();
  loading(false);
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
