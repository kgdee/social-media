const SettingsModal = (() => {
  let element;

  async function render() {
    element = await replaceElement("settings-modal");
  }

  function toggle() {
    element.classList.toggle("hidden")
  }

  return { render, toggle };
})();
