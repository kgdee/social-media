const CommentsSection = (() => {
  let element;
  let commentList;
  let textInput;

  let currentPostId = null;

  async function render() {
    element = await replaceElement("comments-section");

    commentList = element.querySelector(".comment-list");
    textInput = element.querySelector(".comment-input textarea");
  }

  function renderComments(comments) {
    commentList.innerHTML =
      comments
        .map(
          (comment) => `
      <div class="item" data-id="${comment.id}">
        ${createAvatarHTML(comment)}
        <div class="content">
          <div class="title">${comment.authorName} <span>${formatTime(comment.timestamp)}</span></div>
          <p class="text">${escapeHTML(comment.text)}</p>
          <div class="actions">
            <button class="like-btn" onclick="CommentsSection.reactComment('${comment.id}', 'like')">
              <i class="bi bi-hand-thumbs-up"></i>
              <span>${comment.reactions?.like || 0}</span>
            </button>
            <button class="dislike-btn" onclick="CommentsSection.reactComment('${comment.id}', 'dislike')">
              <i class="bi bi-hand-thumbs-down"></i>
              <span>${comment.reactions?.dislike || 0}</span>
            </button>
          </div>
        </div>
      </div>
    `,
        )
        .join("") || `<div class="message center">No comments</div>`;
  }

  async function loadComments(postId) {
    if (isLoading) return;
    loading(true);
    currentPostId = postId;

    await Firebase.loadComments(currentPostId, renderComments);

    loading(false);
  }

  async function commentPost() {
    if (isLoading) return;
    loading(true);

    const data = { text: textInput.value };
    await Firebase.commentPost(currentPostId, data);
    textInput.value = "";
    loading(false);
  }

  async function reactComment(commentId, reactType) {
    if (isLoading) return;
    loading(true);

    await Firebase.reactComment(commentId, reactType);

    loading(false);
  }

  return { render, loadComments, renderComments, commentPost, reactComment };
})();
