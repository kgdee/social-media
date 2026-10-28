const postList = document.querySelector(".post-list");

let currentPosts = [];

async function initPage() {
  await loadResources(RESOURCES.home);

  for (const component of [Navbar, CreatePostModal, PostModal, ProfileModal, ConfirmModal, MenuModal, SettingsModal]) {
    await component.init();
  }

  await Firebase.loadUsers(renderUsers);
  await Firebase.loadPosts(null, onPostsLoaded);

  await checkUrl();

  updateUI();
}

async function checkUrl() {
  const postId = urlParams.get("post_id");

  if (postId) {
    const post = await Firebase.getPost(postId);
    if (!post) return;

    await Firebase.countPostShare(post.id);

    await PostModal.open(post.authorId, post.id);
  }

  // 2. Immediately reset address bar back to base URL without reloading
  window.history.replaceState({}, "", window.location.pathname);
}

function getPost(postId) {
  return currentPosts.filter((post) => post.id === postId)[0];
}

function setPosts(posts) {
  currentPosts = posts;
  renderPosts();
}

function onPostsLoaded(posts) {
  setPosts(posts);
  PostModal.refresh();
}

function renderPosts(posts) {
  posts = posts || currentPosts;
  postList.innerHTML = posts.map((post) => PostCard.createHTML(post)).join("") || `<div class="message center">No posts</div>`;
}

async function renderUsers(users) {
  users = users.filter((user) => user.id !== currentUser.id);
  const itemList = document.querySelector(".people-widget .item-list");

  let usersHTML = "";
  for (const user of users) {
    const isFollowed = await Firebase.isUserFollowed(currentUser.id, user.id);

    usersHTML += `
      <div class="item">
        <button class="close-btn btn-icon">
          <i class="bi bi-x-lg"></i>
        </button>
        <div class="avatar-container" onclick="goToProfilePage('${user.id}')">
          ${createAvatarHTML(user)}
        </div>
        <div class="name">${escapeHTML(user.name)}</div>
        <button class="button action-btn" onclick="followUser('${user.id}')">${!isFollowed ? "Follow" : "Unfollow"}</button>
      </div>
    `;
  }

  itemList.innerHTML = usersHTML || `<div class="message center">No Users found</div>`;
}
