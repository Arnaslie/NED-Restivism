// Tiny view switcher: renders one screen into <main> and moves focus to its heading.
const main = document.getElementById('view');
let token = 0;

export async function show(screen, ctx) {
  const mine = ++token;
  main.setAttribute('aria-busy', 'true');
  try {
    const node = await screen.render(ctx);
    if (mine !== token) return; // a newer navigation (e.g. auto-lock) won
    main.replaceChildren(node);
    window.scrollTo(0, 0);
    main.querySelector('.screen-heading')?.focus();
  } finally {
    if (mine === token) main.removeAttribute('aria-busy');
  }
}

// Drop whatever is on screen (used when locking so no entries stay in the DOM).
export function clear() {
  token++;
  main.replaceChildren();
}
