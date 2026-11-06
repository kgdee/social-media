const profileBanner = document.querySelector(".profile-banner");
const profileCard = document.querySelector(".profile-card");
const postList = document.querySelector(".post-list");
const msgOverlay = document.querySelector(".msg-overlay");

let targetUser = null;
let isOwner = false;

async function initPage() {
  await loadResources(RESOURCES.profile);
  for (const component of [Navbar, PostEditorModal, PostModal, ProfileModal, ConfirmModal, MenuModal, SettingsModal]) {
    await component.init();
  }

  await checkUrl();
}

async function checkUrl() {
  const userId = urlParams.get("user_id");

  if (userId) {
    const user = await Firebase.getUser(userId);
    if (!user) {
      msgOverlay.classList.toggle("hidden", false);
      return;
    }

    Firebase.loadUser(user.id, onUserLoaded);
  } else {
    navigate("home");
  }
}

function onUserLoaded(user) {
  targetUser = user;
  isOwner = currentUser.id === user.id;

  Firebase.loadPosts(targetUser.id, onPostsLoaded);
  updateUI();
  updatePageUI();
}

async function updateUserBanner(file) {
  if (!file) return;

  await withLoading(async () => {
    await Firebase.setUser(currentUser.id, { bannerFile: file });
  });
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

  profileBanner.innerHTML = `
    <img src="${getFreshUrl(targetUser.bannerUrl) || "/assets/images/post-image.png"}" />
    <label class="banner-input circle-btn${isOwner ? "" : " hidden"}">
      <i class="bi bi-pencil"></i>
      <input type="file" accept="image/*" onchange="updateUserBanner(this.files[0])" hidden />
    </label>
  `;

  profileCard.innerHTML = `
    <div class="details">
      ${createAvatarHTML(targetUser)}
      <div class="info">
        <div class="name">${escapeHTML(getUserName(targetUser))}</div>
        <div class="subtitle">${formatQuantity(targetUser?.followerCount || 0, "follower")}</div>
        <p class="bio">${escapeHTML(targetUser?.bio) || "No bio"}</p>
      </div>
    </div>
    <div class="actions">
      <button class="button${isOwner ? " hidden" : ""}">Message</button>
      <button class="button follow-btn${isOwner ? " hidden" : ""}" onclick="followUser('${targetUser.id}')">
      ${isUserFollowed ? "Unfollow" : "Follow"}</button>
      <button class="button${!isOwner ? " hidden" : ""}">Add to story</button>
      <button class="button${!isOwner ? " hidden" : ""}" onclick="ProfileModal.open()">Edit profile</button>
      <button class="button${!isOwner ? " hidden" : ""}"><i class="bi bi-chevron-up"></i></button>
    </div>
  `;
}
