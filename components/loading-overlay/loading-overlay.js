const LoadingOverlay = (() => {
  let element;

  async function init() {
    element = await replaceElement("loading-overlay");
  }

  function toggle(force) {
    const shouldHide = force !== undefined ? !force : undefined;
    element.classList.toggle("hidden", shouldHide);
  }

  return { init, toggle };
})();
