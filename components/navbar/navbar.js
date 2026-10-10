const Navbar = (() => {
  let element;

  async function render() {
    element = await replaceElement("navbar");
  }

  return { render };
})();
