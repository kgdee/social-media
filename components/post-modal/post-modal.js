const PostModal = (() => {
  let element;
  let titleEl;
  let postCardContainer;

  let currentPost = null;

  async function init() {
    element = await replaceElement("post-modal");
    titleEl = element.querySelector(".modal-title");
    postCardContainer = document.querySelector(".post-card-container");

    await CommentsSection.init();
  }

  function refresh() {
    if (!currentPost) return;
    currentPost = getPost(currentPost.id);
    postCardContainer.innerHTML = PostCard.createHTML(currentPost);
  }

  async function open(authorId, postId, force = false) {
    await withLoading(
      async () => {
        currentPost = getPost(postId);
        const author = await Firebase.getUser(authorId);

        titleEl.textContent = `${getUserName(author)}'s post`;

        refresh();

        await CommentsSection.loadComments(currentPost.id);

        element.classList.toggle("hidden", false);
      },
      { isDisabled: force },
    );
  }

  function close() {
    element.classList.toggle("hidden", true);
    currentPost = null;
  }

  return { init, open, close, refresh };
})();
