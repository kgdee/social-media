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
  // const firebaseConfig = {
  //   apiKey: "AIzaSyADXieGpNZftFKRnch6debqG9APhF96MoU",
  //   authDomain: "social-media-cb41e.firebaseapp.com",
  //   projectId: "social-media-cb41e",
  //   storageBucket: "social-media-cb41e.firebasestorage.app",
  //   messagingSenderId: "951423891523",
  //   appId: "1:951423891523:web:93efa354cb87b863cfbcf6",
  // };

  // Initialize Firebase
  let app;
  let db;
  let auth;

  let unsubscribe = { posts: null, comments: null, users: null, user: null };

  globalThis.currentAuthUser = null;
  globalThis.currentUser = null;

  const actionCodeSettings = {
    url: "http://127.0.0.1:5500/pages/auth/action.html",
    handleCodeInApp: true,
  };

  function init() {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();

    // Listen for auth state changes
    auth.onAuthStateChanged(onAuthStateChanged);
  }

  function getUserName() {
    const user = currentUser;
    return user.name || user.displayName || user.email || "Anonymous User";
  }

  function getUserAvatarUrl() {
    return currentUser.avatarUrl || currentUser.photoURL || null;
  }

  async function docExists(collectionName, id) {
    const docRef = db.collection(collectionName).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    return true;
  }

  async function syncUser() {
    try {
      const userId = currentAuthUser.uid;
      const userRef = db.collection("users").doc(userId);
      const doc = await userRef.get();

      let userData = {
        id: userId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (doc.exists) {
        const docData = doc.data();
        userData = { ...userData, ...docData };
      } else {
        userData = {
          ...userData,
          name: currentAuthUser.displayName || getRandomItem(USERNAMES),
          email: currentAuthUser.email,
        };
      }

      await userRef.set(userData, { merge: true });
      currentUser = userData;
    } catch (error) {
      handleError(error);
    }
  }

  async function login(data) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(data.email, data.password);
      notify("Logged in successfully.");
      return userCredential.user;
    } catch (error) {
      handleError(error);
    }
  }

  async function loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const userCredential = await auth.signInWithPopup(provider);

      notify("Logged in successfully.");
      return userCredential.user;
    } catch (error) {
      handleError(error);
    }
  }

  async function signup(data) {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(data.email, data.password);
      const user = userCredential.user;
      await user.sendEmailVerification(actionCodeSettings);

      notify("Account created successfully.");
      return user;
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

  async function sendPasswordResetEmail(email) {
    try {
      await auth.sendPasswordResetEmail(email, actionCodeSettings);
      notify("Password reset email sent.");
    } catch (error) {
      handleError(error);
    }
  }

  async function resetPassword(oobCode, newPassword, confirmPassword) {
    if (newPassword !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    if (!oobCode) {
      throw new Error("Invalid or missing password reset code.");
    }

    try {
      await auth.confirmPasswordReset(oobCode, newPassword);

      notify("New password set successfully.");

      return true;
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

  function loadUser(userId, onLoaded) {
    const userRef = db.collection("users").doc(userId);

    if (unsubscribe[`user${userId}`]) unsubscribe[`user${userId}`]();
    unsubscribe[`user${userId}`] = userRef.onSnapshot(
      (snapshot) => {
        if (snapshot.exists) {
          const docData = snapshot.data();
          const user = { id: snapshot.id, email: currentUser.email, ...docData };

          onLoaded(user);
        }
      },
      (error) => handleError(error),
    );
  }

  function loadUsers(onLoaded) {
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

          onLoaded(users);
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

  async function isUserFollowed(followerId, followingId) {
    const followsQS = await db.collection("follows").where("followerId", "==", followerId).where("followingId", "==", followingId).get();
    if (followsQS.empty) return false;
    return true;
  }

  async function followUser(followerId, followingId) {
    try {
      let followMode = true;
      const followingRef = db.collection("users").doc(followingId);

      const followsQS = await db.collection("follows").where("followerId", "==", followerId).where("followingId", "==", followingId).get();

      const batch = db.batch();

      if (!followsQS.empty) {
        // Unfollow
        batch.delete(followsQS.docs[0].ref);
        followMode = false;
      } else {
        // Follow
        const followRef = db.collection("follows").doc();
        batch.set(followRef, {
          followerId: followerId,
          followingId: followingId,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }

      batch.update(followingRef, {
        followCount: firebase.firestore.FieldValue.increment(followMode ? 1 : -1),
      });

      await batch.commit();

      notify(`User ${!followMode ? "un" : ""}followed successfully.`);
    } catch (error) {
      handleError(error);
    }
  }

  async function deleteUser(userId) {
    const userRef = db.collection("users").doc(userId);

    try {
      await userRef.delete();

      await auth.currentUser.delete();

      notify("User deleted successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  function loadPosts(authorId, onLoaded) {
    let postsRef = db.collection("posts");

    if (authorId) {
      postsRef = postsRef.where("authorId", "==", authorId);
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
        authorId: currentUser.id,
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
    const userId = currentUser.id;
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
    const userId = currentUser.id;
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
        authorId: currentUser.id,
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
    const userId = currentUser.id;
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

  return {
    init,
    syncUser,
    login,
    loginWithGoogle,
    signup,
    logout,
    sendPasswordResetEmail,
    resetPassword,
    getUser,
    loadUsers,
    loadUser,
    setUser,
    isUserFollowed,
    followUser,
    deleteUser,
    createPost,
    getPost,
    loadPosts,
    setPost,
    deletePost,
    reactPost,
    countPostShare,
    commentPost,
    loadComments,
    reactComment,
  };
})();
