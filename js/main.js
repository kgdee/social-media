const urlParams = new URLSearchParams(window.location.search);
let isLoading = false;
let currentUser = null;
let currentPosts = [];
let currentSettings = load("currentSettings", {
  privateAccount: false,
  notifications: true,
  dataSaver: false,
  darkTheme: false,
});

document.addEventListener("DOMContentLoaded", async () => {
  loading(true);
  await loadResources(RESOURCES.utils);
  for (const component of [LoadingOverlay, Toast]) {
    await component.init();
  }

  loadingWithOverlay(true);

  Firebase.init();
  updateUI();
});

async function onAuthStateChanged(user) {
  currentAuthUser = user;

  if (currentAuthUser) {
    Supabase.init();
    await Firebase.syncCurrentUser();
  } else currentUser = null;

  const isPassed = protectPage();
  if (!isPassed) return;
  await window.initPage?.();

  if (currentUser) await Firebase.loadCurrentUser();

  loadingWithOverlay(false);
}

function navigate(name, params = "") {
  if (!name) {
    window.location.href = "/";
    return;
  }
  const isAuth = ["signup", "login", "password-reset", "action"].includes(name);
  const targetPath = `/pages/${isAuth ? "auth" : name}/${name}.html`;
  // if (window.location.pathname.includes(targetPath)) return;
  window.location.href = `${targetPath}${params}`;
}

function protectPage() {
  const currentPath = window.location.pathname;
  const publicPages = ["signup", "login", "password-reset", "action"];

  // If the user is logged in, do nothing—let them stay anywhere.
  // If they are NOT logged in and NOT on a public page, redirect to login.
  if (!currentAuthUser && !publicPages.some((item) => currentPath.includes(`/${item}.html`))) {
    navigate("login");
    return false;
  }
  return true;
}

function loading(state = true) {
  isLoading = state;
}

function loadingWithOverlay(state = true) {
  isLoading = state;
  LoadingOverlay.toggle(state);
}

async function withLoading(action, { shouldShow = false, isDisabled = false } = {}) {
  if (!isDisabled) {
    if (isLoading) return;
  }

  try {
    if (!isDisabled) {
      loading(true);
      if (shouldShow) LoadingOverlay.toggle(true);
    }

    return await action();
  } finally {
    if (!isDisabled) {
      loading(false);
      if (shouldShow) LoadingOverlay.toggle(false);
    }
  }
}

function updateUI() {
  document.body.classList.toggle("dark-theme", currentSettings.darkTheme);

  if (currentUser) {
    const avatarEls = document.querySelectorAll(".self-avatar");
    avatarEls?.forEach((el) => (el.innerHTML = createAvatarHTML(currentUser, false)));

    const usernameEls = document.querySelectorAll(".self-username");
    usernameEls?.forEach((el) => (el.textContent = getUserName(currentUser)));
  }

  const settingEls = document.querySelectorAll(`[data-setting-id]`);
  settingEls.forEach((el) => {
    const setting = currentSettings[el.dataset.settingId];

    const checkbox = el.querySelector("input");
    if (checkbox) checkbox.checked = setting;

    const descEl = el.querySelector(".desc");
    if (descEl) descEl.textContent = setting ? "Enabled" : "Disabled";
  });
}

function getUserName(data) {
  return data.name || data.displayName || data.email || data.authorName || "Anonymous User";
}

function generateUserName(userId) {
  return `${getRandomItem(USERNAMES)}_${userId.slice(0, 4)}`;
}

function getAvatarUrl(data) {
  const imageUrl = data.photoUrl || data.avatarUrl;
  if (imageUrl) return imageUrl;
}

function getAvatarLetter(data) {
  const userName = data.name || data.displayName || data.email || data.authorName || "Anonymous User";
  const letter = escapeHTML(userName.charAt(0).toUpperCase());

  return letter;
}

function createAvatarHTML(data, isOuter = true) {
  const imageUrl = getAvatarUrl(data);

  if (imageUrl) return `<img${isOuter ? ` class="avatar"` : ""} src="${imageUrl}">`;

  const letter = getAvatarLetter(data);
  return `<div${isOuter ? ` class="avatar"` : ""}>${letter}</div>`;
}

function goToProfilePage(userId) {
  userId = userId || currentUser.id;
  navigate("profile", `?user_id=${userId}`);
}

function getPost(postId) {
  return structuredClone(currentPosts.filter((post) => post.id === postId)[0]);
}

function toggleSetting(name, force) {
  currentSettings[name] = force !== undefined ? force : !currentSettings[name];
  save("currentSettings", currentSettings);
  updateUI();
}

async function logout() {
  await withLoading(async () => {
    await Firebase.logout();
  });
}

async function followUser(userId) {
  await withLoading(async () => {
    await Firebase.followUser(currentUser.id, userId);
  });
}

async function deleteAccount() {
  if (isLoading) return;

  const confirmed = await ConfirmModal.confirmAction(`Delete account?`, "This action cannot be undone.");
  if (!confirmed) return;

  loading(true);
  await Firebase.deleteUser(currentUser.id);
  loading(false);
}

const SupabaseUtils = (() => {
  async function deleteStorageItem(supabase, bucketName, path) {
    // 1. Try deleting the path directly as a file.
    // If it's a file, this will delete it. If it's a folder, Supabase ignores it safely.
    await supabase.storage.from(bucketName).remove([path]);

    const limit = 100; // Supabase default list limit per request

    while (true) {
      // 2. List contents at the current path (offset 0 because items are deleted iteratively)
      const { data: listData, error: listError } = await supabase.storage.from(bucketName).list(path, {
        limit,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

      if (listError) {
        throw new Error(listError.message);
        break;
      }

      if (!listData || listData.length === 0) {
        break; // Directory is empty or doesn't exist
      }

      const filesToDelete = [];
      const subfolders = [];

      for (const item of listData) {
        // Format full item path correctly (avoiding double slashes)
        const cleanPath = path.replace(/\/+$/, "");
        const itemPath = `${cleanPath}/${item.name}`;

        // In Supabase storage, folders have a `null` id, files have a string id
        if (item.id === null) {
          subfolders.push(itemPath);
        } else {
          filesToDelete.push(itemPath);
        }
      }

      // 3. Recursively clear subfolders first
      for (const subfolder of subfolders) {
        await deleteStorageItem(supabase, bucketName, subfolder);
      }

      // 4. Batch delete files found in the current directory level
      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage.from(bucketName).remove(filesToDelete);

        if (deleteError) {
          throw new Error(deleteError.message);
          break;
        }
      }

      // If fewer than the limit items were returned and no subfolders are left, we're done here
      if (listData.length < limit && subfolders.length === 0) {
        break;
      }
    }
  }

  return { deleteStorageItem };
})();

function debug() {
  if (typeof currentUser !== "undefined") console.log("currentUser", currentUser);
  if (typeof targetUser !== "undefined") console.log("targetUser", targetUser);
  if (typeof currentPosts !== "undefined") console.log("currentPosts", currentPosts);
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
