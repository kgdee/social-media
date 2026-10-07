const Toast = (() => {
  const element = document.querySelector(".toast");

  const currentItems = [];
  let max = 5;
  let time = 3;

  async function show(message) {
    element.classList.remove("hidden");

    element.insertAdjacentHTML(
      "beforeend",
      `
      <div class="item">
        ${message}
      </div>
    `,
    );
    const itemEl = element.lastElementChild;

    if (element.children.length > max) element.firstElementChild.remove();

    await sleep(1000 * time);

    itemEl.remove();
    if (element.children.length <= 0) element.classList.add("hidden");
  }

  return { show };
})();
