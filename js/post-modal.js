const PostModal = (() => {
  const element = document.querySelector(".post-modal");
  const titleEl = element.querySelector(".modal-title");
  const postCardContainer = document.querySelector(".post-card-container");

  let currentPost = null;

  async function open(authorId, postId) {
    currentPost = getPost(postId) || await Firebase.getPost(postId);
    const author = await Firebase.getUser(authorId);

    titleEl.textContent = `${getUserName(author)}'s post`;

    postCardContainer.innerHTML = PostCard.createHTML(currentPost);

    await CommentsSection.init(currentPost.id);

    element.classList.toggle("hidden", false);
  }

  function close() {
    element.classList.toggle("hidden", true);
    currentPost = null;
  }

  return { open, close };
})();
