const PostEditorModal = (() => {
  let element;
  let titleEl;
  let contentInput;
  let imageInput;
  let imagePreview;

  let currentPost = null;

  async function init() {
    element = await replaceElement("post-editor-modal");
    titleEl = element.querySelector(".modal-title");
    contentInput = element.querySelector(".content-input");
    imageInput = element.querySelector(".image-input input");
    imagePreview = element.querySelector(".image-preview");

    imageInput.onchange = () => updateImagePreview();
  }

  function open(postId) {
    clear();
    if (postId) {
      currentPost = getPost(postId);
      titleEl.textContent = `Edit post`;
      contentInput.value = currentPost.content;
      updateImagePreview();
    } else {
      titleEl.textContent = `Create post`;
    }
    element.classList.toggle("hidden", false);
  }

  function close() {
    clear();
    element.classList.toggle("hidden", true);
  }

  async function handleSubmit() {
    await withLoading(async () => {
      const content = contentInput.value.trim();
      const imageFile = imageInput.files[0];

      if (!content && !imageFile) {
        Toast.show("Post cannot be empty.");
        loading(false);
        return;
      }

      if (currentPost) {
        const data = { content, imageUrl: currentPost.imageUrl, imageFile };
        await Firebase.setPost(currentPost.id, data);
      } else {
        const data = { content, imageFile };
        await Firebase.createPost(data);
      }

      close();
    });
  }

  function clear() {
    currentPost = null;
    contentInput.value = "";
    imageInput.value = "";
  }

  function clearImage() {
    if (currentPost?.imageUrl) currentPost.imageUrl = null;
    imageInput.value = "";
    updateImagePreview();
  }

  function updateImagePreview() {
    const file = imageInput.files[0];
    const imageUrl = currentPost?.imageUrl;
    const img = imagePreview.querySelector("img");

    if (file) {
      img.src = URL.createObjectURL(file);
    } else if (imageUrl) {
      img.src = getFreshUrl(imageUrl);
    }
    imagePreview.classList.toggle("hidden", !(file || imageUrl));
  }

  return { init, open, close, handleSubmit, clearImage };
})();
