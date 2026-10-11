const MenuModal = (() => {
  let element;

  async function render() {
    element = await replaceElement("menu-modal");
  }

  function toggle() {
    element.classList.toggle("hidden")
  }

  return { render, toggle };
})();
