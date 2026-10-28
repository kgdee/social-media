const mode = urlParams.get("mode");
const oobCode = urlParams.get("oobCode");

function toggleView(name) {
  document.querySelectorAll(".view").forEach((el) => el.classList.toggle("hidden", true));
  document.querySelector(`.view.${name}`).classList.toggle("hidden", false);
}

async function handleAuthAction() {
  switch (mode) {
    case "resetPassword":
      // Verify password reset code
      const email = await Firebase.verifyPasswordResetCode(oobCode);
      if (!email) {
        toggleView("invalid");
        break;
      }
      document.querySelector(".reset-password .title").innerHTML = `Change password for <span>${email}</span>`;

      toggleView("reset-password");
      break;

    case "verifyEmail":
      await Firebase.applyActionCode(oobCode);
      toggleView("verify-email");
      Toast.show("Your email address has been successfully verified! Thank you.");
      break;

    case "recoverEmail":
      await Firebase.applyActionCode(oobCode);
      toggleView("recover-email");
      Toast.show("Your email address change has been successfully reverted and secured.");
      break;

    default:
      toggleView("invalid");
      break;
  }
}

async function resetPassword(event) {
  event.preventDefault();

  if (isLoading) return;
  loading(true);

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);

  const succeeded = await Firebase.resetPassword(oobCode, data.newPassword, data.confirmPassword);

  if (succeeded) toggleView("reset-password-success");
  loading(false);
}
