const PostCard = (() => {
  function createHTML(post) {
    const authorName = escapeHTML(post.authorName || "Anonymous User");
    const timeString = formatTime(post.timestamp);
    const content = escapeHTML(post.content);
    const imageUrl = escapeHTML(post.imageUrl);

    return `
          <div class="post-card">
            <div class="post-header">
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
              <button onclick="PostCard.handleReact('${post.id}', 'like')">
                <i class="bi bi-hand-thumbs-up"></i>
                <span>${post.reactions?.like || 0}</span>
              </button>
              <button onclick="PostCard.handleReact('${post.id}', 'dislike')">
                <i class="bi bi-hand-thumbs-down"></i>
                <span>${post.reactions?.dislike || 0}</span>
              </button>
              <button onclick="PostModal.open('${post.authorId}', '${post.id}')">
                <i class="bi bi-chat"></i>
                <span>${post.commentCount || 0}</span>
              </button>
              <button onclick="PostCard.handleShare('${post.id}')">
                <i class="bi bi-share"></i>
                <span>${post.shareCount || 0}</span>
              </button>
            </div>
          </div>
        `;
  }

  async function handleReact(postId, type) {
    if (isLoading) return;
    loading(true);
    await Firebase.reactPost(postId, type);
    loading(false);
  }

  async function handleShare(postId) {
    const postLink = `${window.location.origin}${window.location.pathname}?post_id=${postId}`;
    await copyText(postLink);
    Toast.show("Share link copied successfully!");
  }

  return { createHTML, handleReact, handleShare };
})();
