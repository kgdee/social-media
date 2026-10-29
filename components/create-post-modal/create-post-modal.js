const CreatePostModal = (() => {
  let element;
  let contentInput;
  let imageInput;
  let imagePreview;

  async function init() {
    element = await replaceElement("create-post-modal");
    contentInput = element.querySelector(".content-input");
    imageInput = element.querySelector(".image-input input");
    imagePreview = element.querySelector(".image-preview");

    imageInput.onchange = updateImagePreview;
  }

  async function createPost() {
    event.preventDefault();

    if (isLoading) return;
    if (!currentUser) return; // Guard operation
    loading(true);

    const content = contentInput.value.trim();
    const imageFile = imageInput.files[0];

    if (!content && !imageFile) {
      Toast.show("Post cannot be empty.");
      loading(false);
      return;
    }

    const data = { content, imageFile };
    await Firebase.createPost(data);

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

  function clearImage() {
    imageInput.value = "";
    updateImagePreview();
  }

  function updateImagePreview() {
    const file = imageInput.files[0];
    if (file) {
      const img = imagePreview.querySelector("img");
      img.src = URL.createObjectURL(file);
    }
    imagePreview.classList.toggle("hidden", !file);
  }

  return { init, toggle, createPost, clearImage };
})();
