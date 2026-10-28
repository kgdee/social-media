const Navbar = (() => {
  let element;

  async function init() {
    element = await replaceElement("navbar");
  }

  return { init };
})();
