const ProfileModal = (() => {
  let element;
  let avatarInput;
  let avatarPreview;
  let nameInput;
  let bioInput;

  async function init() {
    element = await replaceElement("profile-modal");
    avatarInput = element.querySelector(".avatar-input input");
    avatarPreview = element.querySelector(".avatar-preview img");
    nameInput = element.querySelector(".name-input input");
    bioInput = element.querySelector(".bio-input textarea");
  }

  async function updateUser() {
    if (isLoading) return;
    loading(true);

    const data = {
      name: nameInput.value,
      avatarUrl: await handleImageFile(avatarInput.files[0], 128),
      bio: bioInput.value,
    };
    await Firebase.setUser(currentUser.id, data);

    close();
    loading(false);
  }

  async function open() {
    if (isLoading) return;
    loading(true);

    const user = (await Firebase.getUser(currentUser.id)) || currentUser;

    avatarPreview.src = getAvatarImage(user) || "/assets/images/default-avatar.jpg";
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
    const names = USERNAMES.filter((name) => name !== nameInput.value);
    nameInput.value = getRandomItem(names);
  }

  async function updateAvatarPreview() {
    avatarPreview.src = await handleImageFile(avatarInput.files[0]);
  }

  return { init, updateUser, open, close, generateName, updateAvatarPreview };
})();
