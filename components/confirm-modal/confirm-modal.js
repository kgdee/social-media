const ConfirmModal = (() => {
  let element;
  let titleEl;
  let msgEl;
  let resolveConfirm = null;

  async function init() {
    element = await replaceElement("confirm-modal");
    titleEl = element.querySelector(".modal-title");
    msgEl = element.querySelector(".msg");
  }

  function confirmAction(title, message) {
    return new Promise((resolve) => {
      titleEl.textContent = title;
      msgEl.textContent = message;
      element.classList.toggle("hidden", false);

      resolveConfirm = resolve;
    });
  }

  function close(result = false) {
    element.classList.toggle("hidden", true);

    const resolve = resolveConfirm;
    resolveConfirm = null;

    if (resolve) resolve(result);
  }

  return { init, confirmAction, close };
})();
