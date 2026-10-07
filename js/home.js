const postList = document.querySelector(".post-list");

let currentPosts = [];

document.addEventListener("DOMContentLoaded", async () => {
  await Firebase.loadUsers();
  await loadPostFromLink();
});

async function loadPostFromLink() {
  // 1. If user entered a URL with ?post_id=ID, load the data and show the modal
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("post_id");
  if (!postId) return;

  loading(true);

  const post = await Firebase.getPost(postId);
  if (!post) {
    loading(false);
    return;
  }

  await Firebase.countPostShare(post.id);

  await PostModal.open(post.authorId, post.id);

  // 2. Immediately reset address bar back to base URL without reloading
  window.history.replaceState({}, "", window.location.pathname);
  loading(false);
}

function updateUI() {
  const avatarEls = document.querySelectorAll(".self-avatar");
  avatarEls.forEach((el) => {
    const imageUrl = getAvatarImage(currentUser);
    const letter = getAvatarLetter(currentUser);

    el.innerHTML = imageUrl ? `<img src="${imageUrl}">` : letter;
  });
}

function getPost(postId) {
  return currentPosts.filter((post) => post.id === postId)[0];
}

function setPosts(posts) {
  currentPosts = posts;
  renderPosts();
}

function renderPosts(posts) {
  posts = posts || currentPosts;
  postList.innerHTML = posts.map((post) => PostCard.createHTML(post)).join("") || `<div class="message center">No posts yet. Be the first to say something!</div>`;
}

async function renderUsers(users) {
  const itemList = document.querySelector(".people-widget .item-list");

  itemList.innerHTML =
    users
      .map((user) => {
        return `
      <div class="item">
        <button class="close-btn btn-icon">
          <i class="bi bi-x-lg"></i>
        </button>
        <div class="avatar-container">
          ${createAvatarHTML(user)}
        </div>
        <div class="name">${user.name}</div>
        <button class="button add-btn"><i class="bi bi-person-fill-add"></i>Add friend</button>
      </div>
    `;
      })
      .join("") || `<div class="message center">No Users found</div>`;
}
