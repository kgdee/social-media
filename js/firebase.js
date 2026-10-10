const Firebase = (() => {
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBI2oALBTbtbEeyZqH-z1yp4l8DPlxYJWw",
    authDomain: "social-media-75b1b.firebaseapp.com",
    projectId: "social-media-75b1b",
    storageBucket: "social-media-75b1b.firebasestorage.app",
    messagingSenderId: "939854753119",
    appId: "1:939854753119:web:ae1685226a6d08c4c2daea",
  };

  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();

  let unsubscribe = { posts: null, comments: null, users: null, user: null };

  globalThis.currentUser = null;

  // Mandatory Auth Before Queries Rule Implementation
  async function initAuth() {
    if (initialAuthToken) {
      try {
        await auth.signInWithCustomToken(initialAuthToken);
      } catch (error) {
        console.error("Custom token login failed", error);
        // Let onAuthStateChanged handle the unauthenticated state
      }
    }
  }

  // Listen for auth state changes
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (currentUser) {
      // User is signed in
      initPage();
    } else {
      // User is signed out
      changePage("signup");

      // Optional: Unsubscribe from real-time listener if exists
    }
  });

  function getUserName() {
    return currentUser.displayName || currentUser.email || "Anonymous User";
  }

  function getUserAvatarUrl() {
    return currentUser.avatarUrl || currentUser.photoURL || null;
  }

  async function login(data) {
    try {
      await auth.signInWithEmailAndPassword(data.email, data.password);
      notify("Logged in successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  async function signup(data) {
    try {
      await auth.createUserWithEmailAndPassword(data.email, data.password);
      notify("Account created successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  async function logout() {
    try {
      await auth.signOut();
      notify("Logged out successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  async function getUser(userId) {
    try {
      const userRef = db.collection("users").doc(userId);
      const doc = await userRef.get();

      if (doc.exists) {
        const docData = doc.data();
        const user = { id: doc.id, ...docData };

        return user;
      }

      return null;
    } catch (error) {
      handleError(error);
    }
  }

  function loadUser(userId) {
    userId = userId || currentUser.uid;
    const userRef = db.collection("users").doc(userId);

    if (unsubscribe.user) unsubscribe.user();
    unsubscribe.user = userRef.onSnapshot(
      (snapshot) => {
        if (snapshot.exists) {
          const docData = snapshot.data();
          const user = { id: snapshot.id, ...docData };

          currentUser = { uid: userId, email: currentUser.email, ...user };
          updateUI();
        }
      },
      (error) => handleError(error),
    );
  }

  function loadUsers() {
    if (unsubscribe.users) unsubscribe.users();
    unsubscribe.users = db
      .collection("users")
      .orderBy("timestamp", "desc")
      .limit(10)
      .onSnapshot(
        (snapshot) => {
          const users = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          renderUsers(users);
        },
        (error) => handleError(error),
      );
  }

  async function setUser(userId, data) {
    const userRef = db.collection("users").doc(userId);

    try {
      await userRef.set(
        {
          ...data,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      notify("User updated successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  async function deleteUser(userId) {
    const userRef = db.collection("users").doc(userId);

    try {
      await userRef.delete();

      notify("User deleted successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  function loadPosts(userId, onLoaded) {
    let postsRef = db.collection("posts");

    if (userId) {
      postsRef = postsRef.where("userId", "==", userId);
    }

    if (unsubscribe.posts) unsubscribe.posts();
    unsubscribe.posts = postsRef.orderBy("timestamp", "desc").onSnapshot(
      (snapshot) => {
        let posts = [];
        snapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() });
        });

        onLoaded(posts);
      },
      (error) => {
        handleError(error);
      },
    );
  }

  async function createPost(data) {
    try {
      const postRef = await db.collection("posts").add({
        content: data.content,
        imageUrl: data.imageUrl,
        authorId: currentUser.uid,
        authorName: getUserName(),
        avatarUrl: getUserAvatarUrl(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      notify("Post created successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  async function getPost(postId) {
    try {
      const postRef = db.collection("posts").doc(postId);
      const doc = await postRef.get();

      if (doc.exists) {
        const docData = doc.data();
        const post = { id: doc.id, ...docData };

        return post;
      }

      return null;
    } catch (error) {
      handleError(error);
    }
  }

  async function setPost(postId, data) {
    const postRef = db.collection("posts").doc(postId);

    try {
      await postRef.set(
        {
          ...data,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      notify("Post updated successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  async function reactPost(postId, reactType) {
    const userId = currentUser.uid;
    const postRef = db.collection("posts").doc(postId);

    try {
      const reactionsQS = await db.collection("reactions").where("postId", "==", postId).where("userId", "==", userId).get();

      const existingDoc = !reactionsQS.empty ? reactionsQS.docs[0] : null;
      const reactionRef = existingDoc ? existingDoc.ref : db.collection("reactions").doc();
      const prevReactType = existingDoc ? existingDoc.data().type : null;

      const batch = db.batch();
      const updates = {};

      if (prevReactType === reactType) {
        // Toggle off / remove reaction
        batch.delete(reactionRef);
        updates[`reactions.${reactType}`] = firebase.firestore.FieldValue.increment(-1);
      } else {
        // Add or update reaction
        batch.set(reactionRef, {
          postId: postId,
          userId: userId,
          type: reactType,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        if (prevReactType) {
          updates[`reactions.${prevReactType}`] = firebase.firestore.FieldValue.increment(-1);
        }

        updates[`reactions.${reactType}`] = firebase.firestore.FieldValue.increment(1);
      }

      batch.update(postRef, updates);
      await batch.commit();

      notify("Post reacted successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  async function countPostShare(postId) {
    const userId = currentUser.uid;
    const postRef = db.collection("posts").doc(postId);

    try {
      const sharesQS = await db.collection("shares").where("postId", "==", postId).where("userId", "==", userId).get();

      // If a share record already exists for this user and post, exit early
      if (!sharesQS.empty) return;

      const shareRef = db.collection("shares").doc();
      const batch = db.batch();

      batch.set(shareRef, {
        postId: postId,
        userId: userId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      batch.update(postRef, {
        shareCount: firebase.firestore.FieldValue.increment(1),
      });

      await batch.commit();

      notify("Share counted successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  async function commentPost(postId, data) {
    try {
      const batch = db.batch();

      const postRef = db.collection("posts").doc(postId);
      const commentRef = db.collection("comments").doc();

      batch.set(commentRef, {
        postId: postId,
        parentId: null,
        authorId: currentUser.uid,
        authorName: getUserName(),
        avatarUrl: getUserAvatarUrl(),
        text: data.text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      batch.update(postRef, {
        commentCount: firebase.firestore.FieldValue.increment(1),
      });

      await batch.commit();

      notify("Comment added successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  async function deletePost(postId) {
    try {
      const postRef = db.collection("posts").doc(postId);
      const batch = db.batch();

      // Query and delete documents in root collections where postId matches
      const [commentsQS, reactionsQS, sharesQS] = await Promise.all([
        db.collection("comments").where("postId", "==", postId).get(),
        db.collection("reactions").where("postId", "==", postId).get(),
        db.collection("shares").where("postId", "==", postId).get(),
      ]);

      commentsQS.docs.forEach((doc) => batch.delete(doc.ref));
      reactionsQS.docs.forEach((doc) => batch.delete(doc.ref));
      sharesQS.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete the post document itself
      batch.delete(postRef);

      // Commit all deletions in a single batch
      await batch.commit();

      notify("Post deleted successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  function loadComments(postId, onLoaded) {
    if (unsubscribe.comments) unsubscribe.comments();
    unsubscribe.comments = db
      .collection("comments")
      .where("postId", "==", postId)
      .orderBy("timestamp", "desc")
      .onSnapshot(
        (snapshot) => {
          const comments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          onLoaded(comments);
        },
        (error) => handleError(error),
      );
  }

  async function reactComment(commentId, reactType) {
    const userId = currentUser.uid;
    const commentRef = db.collection("comments").doc(commentId);

    try {
      const reactionsQS = await db.collection("reactions").where("commentId", "==", commentId).where("userId", "==", userId).get();

      const existingDoc = !reactionsQS.empty ? reactionsQS.docs[0] : null;
      const reactionRef = existingDoc ? existingDoc.ref : db.collection("reactions").doc();
      const prevReactType = existingDoc ? existingDoc.data().type : null;

      const batch = db.batch();
      const updates = {};

      if (prevReactType === reactType) {
        // Toggle off / remove reaction
        batch.delete(reactionRef);
        updates[`reactions.${reactType}`] = firebase.firestore.FieldValue.increment(-1);
      } else {
        // Add or update reaction
        batch.set(reactionRef, {
          commentId: commentId,
          userId: userId,
          type: reactType,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        if (prevReactType) {
          updates[`reactions.${prevReactType}`] = firebase.firestore.FieldValue.increment(-1);
        }

        updates[`reactions.${reactType}`] = firebase.firestore.FieldValue.increment(1);
      }

      batch.update(commentRef, updates);
      await batch.commit();

      notify("Comment reacted successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  return { initAuth, login, signup, logout, getUser, loadUsers, loadUser, setUser, deleteUser, createPost, getPost, loadPosts, setPost, deletePost, reactPost, countPostShare, commentPost, loadComments, reactComment };
})();
