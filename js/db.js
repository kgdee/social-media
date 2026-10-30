const Supabase = (() => {
  const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  const bucketName = "files";
  const basePath = `projects/${PROJECT_NAME}`;

  async function uploadFile(file, id, fileName) {
    const filePath = `${basePath}/${id}/${fileName}`;

    await supabase.storage.from(bucketName).upload(filePath, file, { upsert: true });

    // Get the Public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    const uploadedFileUrl = publicUrlData.publicUrl;
    console.log("File uploaded successfully.");
    return uploadedFileUrl;
  }

  async function removeFile(id, fileName) {
    const filePath = `${basePath}/${id}/${fileName}`;

    await supabase.storage.from(bucketName).remove([filePath]);

    console.log("File removed successfully.");
  }

  async function removeFolder(id) {
    const folderPath = `${basePath}/${id}`;

    await supabase.storage.from(bucketName).remove([folderPath]);

    console.log("Folder removed successfully.");
  }

  return { uploadFile, removeFile, removeFolder };
})();

const Firebase = (() => {
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: CONFIG.FIREBASE_API_KEY,
    authDomain: CONFIG.FIREBASE_AUTH_DOMAIN,
    projectId: CONFIG.FIREBASE_PROJECT_ID,
    storageBucket: CONFIG.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: CONFIG.FIREBASE_MESSAGING_SENDER_ID,
    appId: CONFIG.FIREBASE_APP_ID,
  };

  let app;
  let db;
  let auth;

  let unsubscribe = { posts: null, comments: null, users: null, user: null };

  globalThis.currentAuthUser = null;
  globalThis.currentUser = null;

  // const actionCodeSettings = {
  //   url: "http://127.0.0.1:5500/pages/auth/action.html",
  //   handleCodeInApp: false,
  // };

  // Initialize Firebase
  function init() {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();

    // Listen for auth state changes
    auth.onAuthStateChanged(onAuthStateChanged);
  }

  function collection(name) {
    return db.collection(`projects/${PROJECT_NAME}/${name}`);
  }

  async function docExists(collectionName, id) {
    const docSnap = await collection(collectionName).doc(id).get();
    if (!docSnap.exists) return false;
    return true;
  }

  function getUserName() {
    const user = currentUser;
    return user.name || user.displayName || user.email || "Anonymous User";
  }

  function getUserAvatarUrl() {
    return currentUser.avatarUrl || currentUser.photoURL || null;
  }

  async function syncCurrentUser() {
    try {
      const userId = currentAuthUser.uid;
      const userRef = collection("users").doc(userId);
      const docSnap = await userRef.get();

      let userData = {
        id: userId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (docSnap.exists) {
        const docData = docSnap.data();
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
      await user.sendEmailVerification();

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

  async function applyActionCode() {
    try {
      await auth.applyActionCode(oobCode);
    } catch (error) {
      handleError(error);
    }
  }

  async function sendPasswordResetEmail(email) {
    try {
      await auth.sendPasswordResetEmail(email);
      notify("Password reset email sent.");
    } catch (error) {
      handleError(error);
    }
  }

  async function resetPassword(oobCode, newPassword, confirmPassword) {
    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      await auth.confirmPasswordReset(oobCode, newPassword);

      notify("New password set successfully.");

      return true;
    } catch (error) {
      handleError(error);
    }
  }

  async function verifyPasswordResetCode(oobCode) {
    try {
      const email = await auth.verifyPasswordResetCode(oobCode);
      notify("Password reset code verified.");
      return email;
    } catch (error) {
      handleError(error);
    }
  }

  async function getUser(userId) {
    try {
      const docSnap = await collection("users").doc(userId).get();

      if (docSnap.exists) {
        const docData = docSnap.data();
        const user = { id: docSnap.id, ...docData };

        return user;
      }

      return null;
    } catch (error) {
      handleError(error);
    }
  }

  function loadUser(userId, onLoaded) {
    const userRef = collection("users").doc(userId);

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

  function loadCurrentUser() {
    const userId = currentUser.id;
    const userRef = collection("users").doc(userId);

    if (unsubscribe.currentUser) unsubscribe.currentUser();
    unsubscribe.currentUser = userRef.onSnapshot(
      (snapshot) => {
        if (snapshot.exists) {
          const docData = snapshot.data();
          const user = { id: snapshot.id, email: currentUser.email, ...docData };

          currentUser = user;
          updateUI();
        }
      },
      (error) => handleError(error),
    );
  }

  function loadUsers(onLoaded) {
    if (unsubscribe.users) unsubscribe.users();
    unsubscribe.users = collection("users")
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
    const userRef = collection("users").doc(userId);

    const { avatarFile, bannerFile, ...userData } = data;
    let avatarUrl = avatarFile ? await Supabase.uploadFile(avatarFile, userId, "avatar.png") : null;
    let bannerUrl = bannerFile ? await Supabase.uploadFile(bannerFile, userId, "banner.png") : null;

    try {
      // 3. Save user data and avatar URL to Firebase Firestore
      await userRef.set(
        {
          ...userData,
          ...(avatarUrl ? { avatarUrl } : {}),
          ...(bannerUrl ? { bannerUrl } : {}),
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
    const followsQS = await collection("follows").where("followerId", "==", followerId).where("followingId", "==", followingId).get();
    if (followsQS.empty) return false;
    return true;
  }

  async function followUser(followerId, followingId) {
    try {
      let followMode = true;
      const followingRef = collection("users").doc(followingId);

      const followsQS = await collection("follows").where("followerId", "==", followerId).where("followingId", "==", followingId).get();

      const batch = db.batch();

      if (!followsQS.empty) {
        // Unfollow
        batch.delete(followsQS.docs[0].ref);
        followMode = false;
      } else {
        // Follow
        const followRef = collection("follows").doc();
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
    const userRef = collection("users").doc(userId);

    try {
      // Query and delete all data associated with this user
      const postsQS = await collection("posts").where("authorId", "==", userId).get();

      const batch = db.batch();

      // Add all posts to the batch
      postsQS.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Add the user doc to the same batch
      batch.delete(userRef);

      // Commit all deletions together
      await batch.commit();

      // Delete the user from Firebase Authentication
      await auth.currentUser.delete();

      await Supabase.removeFolder(userId);

      notify("User deleted successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  function loadPosts(authorId, onLoaded) {
    let postsRef = collection("posts");

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
      const id = generateId();
      const { imageFile, ...postData } = data;

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await Supabase.uploadFile(imageFile, id, "post-image.png");
      }

      const postRef = await collection("posts")
        .doc(id)
        .set({
          content: postData.content,
          ...(imageUrl ? { imageUrl } : {}),
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
      const docSnap = await collection("posts").doc(postId).get();

      if (docSnap.exists) {
        const docData = docSnap.data();
        const post = { id: docSnap.id, ...docData };

        return post;
      }

      return null;
    } catch (error) {
      handleError(error);
    }
  }

  async function setPost(postId, data) {
    try {
      await collection("posts")
        .doc(postId)
        .set(
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
    const postRef = collection("posts").doc(postId);

    try {
      const reactionsQS = await collection("reactions").where("postId", "==", postId).where("userId", "==", userId).get();

      const existingDoc = !reactionsQS.empty ? reactionsQS.docs[0] : null;
      const reactionRef = existingDoc ? existingDoc.ref : collection("reactions").doc();
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
    const postRef = collection("posts").doc(postId);

    try {
      const sharesQS = await collection("shares").where("postId", "==", postId).where("userId", "==", userId).get();

      // If a share record already exists for this user and post, exit early
      if (!sharesQS.empty) return;

      const shareRef = collection("shares").doc();
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

      const postRef = collection("posts").doc(postId);
      const commentRef = collection("comments").doc();

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
      const postRef = collection("posts").doc(postId);
      const batch = db.batch();

      // Query and delete documents in root collections where postId matches
      const [commentsQS, reactionsQS, sharesQS] = await Promise.all([
        collection("comments").where("postId", "==", postId).get(),
        collection("reactions").where("postId", "==", postId).get(),
        collection("shares").where("postId", "==", postId).get(),
      ]);

      commentsQS.docs.forEach((doc) => batch.delete(doc.ref));
      reactionsQS.docs.forEach((doc) => batch.delete(doc.ref));
      sharesQS.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete the post document itself
      batch.delete(postRef);

      // Commit all deletions in a single batch
      await batch.commit();

      await Supabase.removeFolder(postId);

      notify("Post deleted successfully.");
    } catch (error) {
      handleError(error);
    }
  }

  function loadComments(postId, onLoaded) {
    if (unsubscribe.comments) unsubscribe.comments();
    unsubscribe.comments = collection("comments")
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
    const commentRef = collection("comments").doc(commentId);

    try {
      const reactionsQS = await collection("reactions").where("commentId", "==", commentId).where("userId", "==", userId).get();

      const existingDoc = !reactionsQS.empty ? reactionsQS.docs[0] : null;
      const reactionRef = existingDoc ? existingDoc.ref : collection("reactions").doc();
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
    syncCurrentUser,
    login,
    loginWithGoogle,
    signup,
    logout,
    applyActionCode,
    sendPasswordResetEmail,
    resetPassword,
    verifyPasswordResetCode,
    getUser,
    loadUser,
    loadCurrentUser,
    loadUsers,
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
