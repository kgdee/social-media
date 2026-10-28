async function initPage() {
  await window.handleAuthAction?.();
}

async function signup(event) {
  event.preventDefault();

  if (isLoading) return;
  loading(true);

  const email = document.querySelector(".email-input").value;
  const password = document.querySelector(".password-input").value;

  const user = await Firebase.signup({ email, password });

  if (user) changePage("home");
  event.target.reset();
  loading(false);
}

async function login(event) {
  event.preventDefault();

  if (isLoading) return;
  loading(true);

  const email = document.querySelector(".email-input").value;
  const password = document.querySelector(".password-input").value;

  const user = await Firebase.login({ email, password });

  if (user) changePage("home");
  event.target.reset();
  loading(false);
}

async function loginWithGoogle(event) {
  if (isLoading) return;
  loading(true);

  const user = await Firebase.loginWithGoogle();

  if (user) changePage("home");
  loading(false);
}

async function sendPasswordResetEmail(event) {
  event.preventDefault();
  
  if (isLoading) return;
  loading(true);

  const email = document.querySelector(".email-input").value;

  await Firebase.sendPasswordResetEmail(email);

  loading(false);
}
