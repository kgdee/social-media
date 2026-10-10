const CreatePostModal = (() => {
  let element;
  let contentInput;
  let imageInput;

  async function render() {
    element = await replaceElement("create-post-modal");

    contentInput = element.querySelector(".content-input");
    imageInput = element.querySelector(".image-input input");
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

    try {
      const postData = { content, imageUrl };

      await Firebase.createPost(postData);

      clear();
      loading(false);
    } catch (error) {
      handleError(error);
    }
  }

  function toggle() {
    clear();
    element.classList.toggle("hidden");
  }

  function clear() {
    contentInput.value = "";
    imageInput.value = "";
  }

  return { render, toggle, createPost };
})();
