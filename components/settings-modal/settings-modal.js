const SettingsModal = (() => {
  let element;

  async function render() {
    element = await replaceElement("settings-modal");
  }

  function open() {
    element.classList.toggle("hidden", false);
  }

  function close() {
    element.classList.toggle("hidden", true);
  }

  return { render, open, close };
})();
