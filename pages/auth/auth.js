async function signup(event) {
  event.preventDefault();

  if (isLoading) return;
  loading(true);

  const email = document.querySelector(".email-input").value;
  const password = document.querySelector(".password-input").value;

  await Firebase.signup({ email, password });

  event.target.reset();
  loading(false);
}

async function login(event) {
  event.preventDefault();

  if (isLoading) return;
  loading(true);

  const email = document.querySelector(".email-input").value;
  const password = document.querySelector(".password-input").value;

  await Firebase.login({ email, password });

  event.target.reset();
  loading(false);
}
