const PostCard = (() => {
  function createHTML(post) {
    const isOwner = post.authorId === currentUser.id;
    const authorName = getUserName(post);
    const timeString = formatTime(post.timestamp);
    const content = escapeHTML(post.content);
    const imageUrl = escapeHTML(post.imageUrl);

    return `
          <div class="post-card">
            <div class="post-header" onclick="goToProfilePage('${post.authorId}')">
                ${createAvatarHTML(post)}
                <div class="author-info">
                    <span class="name">${authorName}</span>
                    <span class="time">${timeString}</span>
                </div>
            </div>
            <div class="post-body">
              ${content ? `<div class="content">${content}</div>` : ""}
              ${imageUrl ? `<img src="${imageUrl}" class="image">` : ""}
            </div>
            <div class="actions">
              <button onclick="PostCard.reactPost('${post.id}', 'like')">
                <i class="bi bi-hand-thumbs-up"></i>
                <span>${post.reactions?.like || 0}</span>
              </button>
              <button onclick="PostCard.reactPost('${post.id}', 'dislike')">
                <i class="bi bi-hand-thumbs-down"></i>
                <span>${post.reactions?.dislike || 0}</span>
              </button>
              <button onclick="PostModal.open('${post.authorId}', '${post.id}')">
                <i class="bi bi-chat"></i>
                <span>${post.commentCount || 0}</span>
              </button>
              <button onclick="PostCard.sharePost('${post.id}')">
                <i class="bi bi-share"></i>
                <span>${post.shareCount || 0}</span>
              </button>
              <button class="${!isOwner ? "hidden" : ""}" onclick="PostCard.deletePost('${post.id}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        `;
  }

  async function reactPost(postId, type) {
    if (isLoading) return;
    loading(true);
    await Firebase.reactPost(postId, type);
    loading(false);
  }

  async function sharePost(postId) {
    const postLink = `${window.location.origin}${window.location.pathname}?post_id=${postId}`;
    await copyText(postLink);
    Toast.show("Share link copied successfully!");
  }

  async function deletePost(postId) {
    if (isLoading) return;
    const confirmed = await ConfirmModal.confirmAction(`Delete post?`, "This action cannot be undone.");
    if (!confirmed) return;
    loading(true);

    await Firebase.deletePost(postId);
    loading(false);
  }

  return { createHTML, reactPost, sharePost, deletePost };
})();
