const PostEditorModal = (() => {
  let element;
  let titleEl;
  let contentInput;
  let imageInput;
  let imagePreview;

  async function init() {
    element = await replaceElement("post-editor-modal");
    titleEl = element.querySelector(".modal-title");
    contentInput = element.querySelector(".content-input");
    imageInput = element.querySelector(".image-input input");
    imagePreview = element.querySelector(".image-preview");

    imageInput.onchange = updateImagePreview;
  }

  function open(postId) {
    if (postId) {
      titleEl.textContent = `Edit post`;
    } else {
      titleEl.textContent = `Create post`;
    }

    element.classList.toggle("hidden", false);
  }

  function close() {
    clear();
    element.classList.toggle("hidden", true);
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
    close();
    loading(false);
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

  return { init, open, close, createPost, clearImage };
})();
