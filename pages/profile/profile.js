const postList = document.querySelector(".post-list");

let currentTarget = null;
let currentPosts = [];

document.addEventListener("DOMContentLoaded", () => {
  loadResources(PROFILE_PAGE_RES);
});

async function initPage() {
  for (const component of [Toast, Navbar, CreatePostModal, PostModal, ProfileModal, MenuModal]) {
    await component.render();
  }

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

    await Firebase.loadPosts(user.id, onPostsLoaded);

    console.log("Profile page:", user);
  }

  loading(false);
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
