// Tiny element builder. Strings become text nodes, never HTML.
// Props: class, text, on<event> (listener), anything else becomes an attribute (true = present, false/null = absent).
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child != null && child !== false) el.append(child);
  }
  return el;
}

let uid = 0;
export const nextId = (prefix) => `${prefix}-${++uid}`;

// Screen heading that receives focus on navigation.
export const heading = (text) => h('h2', { tabindex: '-1', class: 'screen-heading', text });

// Assertive error region; set .textContent to announce.
export const errorBox = () => h('p', { class: 'error', role: 'alert' });

// Disable a button and swap its label while an async task runs.
export async function busy(button, label, task) {
  const idle = button.textContent;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = label;
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = idle;
  }
}
