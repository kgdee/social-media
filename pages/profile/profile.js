const postList = document.querySelector(".post-list");

let targetUser = null;
let currentPosts = [];

document.addEventListener("DOMContentLoaded", () => {
  loadResources(PROFILE_PAGE_RES);
});

async function initPage() {
  loading(true);
  for (const component of [Toast, Navbar, CreatePostModal, PostModal, ProfileModal, MenuModal, SettingsModal]) {
    await component.render();
  }

  await checkUrl();

  updateUI();
  updatePageUI();
  loading(false);
}

async function checkUrl() {
  // 1. If user entered a URL with ?post_id=ID, load the data and show the modal
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("user_id");

  if (userId) {
    const user = await Firebase.getUser(userId);
    if (!user) return;

    targetUser = user;

    await Firebase.loadPosts(targetUser.id, onPostsLoaded);
  }
}

function getPost(postId) {
  return currentPosts.filter((post) => post.id === postId)[0];
}

function onPostsLoaded(posts) {
  currentPosts = posts;
  renderPosts();
  PostModal.refresh();
}

function renderPosts(posts) {
  posts = posts || currentPosts;
  postList.innerHTML = posts.map((post) => PostCard.createHTML(post)).join("") || `<div class="message center">No posts yet. Be the first to say something!</div>`;
}

function updatePageUI() {
  const avatarEl = document.querySelector(".profile-display .avatar");
  avatarEl.innerHTML = createAvatarHTML(targetUser);

  const nameEl = document.querySelector(".profile-display .name");
  nameEl.textContent = getUserName(targetUser);

  const bioEl = document.querySelector(".profile-display .bio");
  bioEl.textContent = targetUser?.bio || "No bio";
}
