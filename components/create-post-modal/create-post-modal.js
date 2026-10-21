const CreatePostModal = (() => {
  let element;
  let contentInput;
  let imageInput;
  let imagePreviewEl;

  async function init() {
    element = await replaceElement("create-post-modal");
    contentInput = element.querySelector(".content-input");
    imageInput = element.querySelector(".image-input input");
    imagePreviewEl = element.querySelector(".image-preview img");

    imageInput.onchange = () => {
      const file = imageInput.files[0];
      if (file) imagePreviewEl.src = file;
      imagePreviewEl.classList.toggle("hidden", !file);
    };
  }

  async function createPost() {
    event.preventDefault();

    if (isLoading) return;
    if (!currentUser) return; // Guard operation
    loading(true);

    const content = contentInput.value.trim();
    const imageUrl = await handleImageFile(imageInput.files[0], 512);

    if (!content && !imageUrl) {
      Toast.show("Post cannot be empty.");
      loading(false);
      return;
    }

    const postData = { content, imageUrl };

    await Firebase.createPost(postData);

    clear();
    toggle();
    loading(false);
  }

  function toggle() {
    clear();
    element.classList.toggle("hidden");
  }

  function clear() {
    contentInput.value = "";
    imageInput.value = "";
  }

  return { init, toggle, createPost };
})();
