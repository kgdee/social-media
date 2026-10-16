const profileDisplay = document.querySelector(".profile-display");
const postList = document.querySelector(".post-list");

let targetUser = null;
let isOwner = false;
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

  loading(false);
}

async function checkUrl() {
  // 1. If user entered a URL with ?post_id=ID, load the data and show the modal
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("user_id");

  if (userId) {
    const user = await Firebase.getUser(userId);
    if (!user) return;

    Firebase.loadUser(user.id, onUserLoaded);
  } else {
    changePage("home");
  }
}

function onUserLoaded(user) {
  targetUser = user;
  isOwner = currentUser.id === user.id;

  Firebase.loadPosts(targetUser.id, onPostsLoaded);
  updateUI();
  updatePageUI();
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
  postList.innerHTML = posts.map((post) => PostCard.createHTML(post)).join("") || `<div class="message center">No posts</div>`;
}

async function updatePageUI() {
  const isUserFollowed = await Firebase.isUserFollowed(currentUser.id, targetUser.id);

  profileDisplay.innerHTML = `
    ${createAvatarHTML(targetUser)}
    <div class="info">
      <div class="name">${escapeHTML(getUserName(targetUser))}</div>
      <div class="subtitle">${targetUser?.followCount || 0} followers</div>
      <p class="bio">${escapeHTML(targetUser?.bio) || "No bio"}</p>
    </div>
    <div class="actions">
      <button class="button${isOwner ? " hidden" : ""}"><i class="bi bi-chat"></i> Message</button>
      <button class="button follow-btn${isOwner ? " hidden" : ""}" onclick="followUser('${targetUser.id}')">
      ${isUserFollowed ? "Unfollow" : "Follow"}</button>
      <button class="button${!isOwner ? " hidden" : ""}"><i class="bi bi-plus-lg"></i> Add to story</button>
      <button class="button${!isOwner ? " hidden" : ""}" onclick="ProfileModal.open()"><i class="bi bi-pencil"></i> Edit profile</button>
      <button class="button${!isOwner ? " hidden" : ""}"><i class="bi bi-chevron-up"></i></button>
    </div>
  `;
}
