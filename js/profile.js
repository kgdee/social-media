const postList = document.querySelector(".post-list");

let currentPosts = [];

async function initPage() {
  await checkUrl();

  updateUI();
}

async function checkUrl() {
  loading(true);
  // 1. If user entered a URL with ?post_id=ID, load the data and show the modal
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("user_id");

  if (userId) {
    const user = await Firebase.getUser(userId);
    if (!user) {
      loading(false);
      return;
    }

    await Firebase.loadUser(userId);
    await Firebase.loadPosts(userId, onPostsLoaded);

    document.querySelector("main").innerHTML = `${JSON.stringify(user)}`;
  }

  // 2. Immediately reset address bar back to base URL without reloading
  window.history.replaceState({}, "", window.location.pathname);
  loading(false);
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
  postList.innerHTML = posts.map((post) => PostCard.createHTML(post)).join("") || `<div class="message center">No posts yet. Be the first to say something!</div>`;
}
