async function initPage() {
  await window.handleAuthAction?.();
}

async function signup(event) {
  event.preventDefault();

  await withLoading(async () => {
    const email = document.querySelector(".email-input").value;
    const password = document.querySelector(".password-input").value;

    const user = await Firebase.signup({ email, password });

    if (user) navigate("home");
    event.target.reset();
  });
}

async function login(event) {
  event.preventDefault();

  await withLoading(async () => {
    const email = document.querySelector(".email-input").value;
    const password = document.querySelector(".password-input").value;

    const user = await Firebase.login({ email, password });

    if (user) navigate("home");
    event.target.reset();
  });
}

async function loginWithGoogle(event) {
  await withLoading(async () => {
    const user = await Firebase.loginWithGoogle();
    if (user) navigate("home");
  });
}

async function sendPasswordResetEmail(event) {
  event.preventDefault();

  await withLoading(async () => {
    const email = document.querySelector(".email-input").value;
    await Firebase.sendPasswordResetEmail(email);
  });
}
