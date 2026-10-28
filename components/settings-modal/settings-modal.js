const SettingsModal = (() => {
  let element;

  async function init() {
    element = await replaceElement("settings-modal");
  }

  function open() {
    element.classList.toggle("hidden", false);
  }

  function close() {
    element.classList.toggle("hidden", true);
  }

  return { init, open, close };
})();
