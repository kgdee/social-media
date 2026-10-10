document.addEventListener("DOMContentLoaded", () => {
  // Initialize early authentication
  Firebase.initAuth();
});

function initPage() {
  changePage("home");
}
