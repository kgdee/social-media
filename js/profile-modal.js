const ProfileModal = (() => {
  const element = document.querySelector(".profile-modal");
  const avatarInput = element.querySelector(".avatar-input input");
  const avatarPreview = element.querySelector(".avatar-preview img");
  const nameInput = element.querySelector(".name-input input");
  const bioInput = element.querySelector(".bio-input textarea");

  avatarInput.addEventListener("change", async () => {
    avatarPreview.src = await handleImageFile(avatarInput.files[0]);
  });

  async function updateUser() {
    if (isLoading) return;
    loading(true);

    const data = {
      name: nameInput.value,
      avatar: await handleImageFile(avatarInput.files[0], 128),
      bio: bioInput.value,
    };
    await Firebase.setUser(currentUser.uid, data);

    close();
    loading(false);
  }

  async function open() {
    if (isLoading) return;
    loading(true);

    const user = await Firebase.getUser(currentUser.uid);

    avatarPreview.src = getAvatarImage(user) || "../assets/images/default-avatar.jpg";
    nameInput.value = user?.name || "";
    bioInput.value = user?.bio || "";

    element.classList.toggle("hidden", false);
    loading(false);
  }

  function close() {
    clear();
    element.classList.toggle("hidden", true);
  }

  function clear() {
    avatarInput.value = "";
    nameInput.value = "";
    bioInput.value = "";
  }

  function generateName() {
    const names = NAMES.filter((name) => name !== nameInput.value);
    nameInput.value = getRandomItem(names);
  }

  return { updateUser, open, close, generateName };
})();
