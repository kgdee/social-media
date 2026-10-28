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

  async function open(authorId, postId) {
    if (isLoading) return;
    loading(true);
    currentPost = getPost(postId) || (await Firebase.getPost(postId));
    const author = await Firebase.getUser(authorId);
    
    titleEl.textContent = `${getUserName(author)}'s post`;

    refresh();

    await CommentsSection.loadComments(currentPost.id);

    element.classList.toggle("hidden", false);
    loading(false);
  }

  function close() {
    element.classList.toggle("hidden", true);
    currentPost = null;
  }

  return { init, open, close, refresh };
})();
