const oobCode = urlParams.get("oobCode");
const mode = urlParams.get("mode");

function toggleView(name) {
  document.querySelectorAll(".view").classList.toggle("hidden", true);
  document.querySelector(`.view.${name}`).classList.toggle("hidden", false);
}

function toggleSuccessView(desc) {
  // document.querySelector(".view.success .desc").textContent = desc;
  // toggleView("success");
}

async function handleAuthAction() {
  switch (mode) {
    case "resetPassword":
      // Verify password reset code
      const email = await auth.verifyPasswordResetCode(oobCode);
      emailInput.value = email;

      toggleView("reset-password");
      break;

    case "verifyEmail":
      toggleView("verify-email");

      await auth.applyActionCode(oobCode);

      toggleSuccessView("Your email address has been successfully verified! Thank you.");
      break;

    case "recoverEmail":
      toggleView("recover-email");

      await auth.applyActionCode(oobCode);

      toggleSuccessView("Your email address change has been successfully reverted and secured.");
      break;

    default:
      toggleView("invalid");
      break;
  }
}

// Submit the new password
async function resetPassword(event) {
  event.preventDefault();

  if (isLoading) return;
  loading(true);

  // Extract the oobCode from the URL query string
  const oobCode = urlParams.get("mode") === "resetPassword" ? urlParams.get("oobCode") : null;

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);

  await Firebase.resetPassword(oobCode, data.newPassword, data.confirmPassword);

  // await sleep(3000);
  // changePage("login");
  // event.target.reset();
  loading(false);
}
