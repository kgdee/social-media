const MenuModal = (() => {
  let element;
  let themeCheckbox;
  let themeDescEl;

  async function render() {
    element = await replaceElement("menu-modal");
    themeCheckbox = element.querySelector(".item-theme input");
    themeDescEl = element.querySelector(".item-theme .desc");
  }

  function open() {
    element.classList.toggle("hidden", false);
    updateUI();
  }

  function close() {
    element.classList.toggle("hidden", true);
  }

  function handleThemeToggle() {
    toggleTheme();
    updateUI();
  }

  return { render, updateUI, open, close, handleThemeToggle };
})();
