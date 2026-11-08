const blockTags = new Set('address article aside blockquote br caption dd div dl dt figcaption figure footer h1 h2 h3 h4 h5 h6 header hr li main ol p pre section table td th tr ul'.split(' '));
const ignoredTags = new Set('audio head iframe nav noscript object rp rt script style svg template title video'.split(' '));

export function decodeText(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
  return new TextDecoder().decode(bytes);
}

export function textFromHTML(markup, preferMainContent = false) {
  // Parse in an inert fragment without adding file markup to the reader page.
  const template = document.createElement('template');
  template.innerHTML = markup;
  const fragment = template.content;
  const mainContent = preferMainContent && (fragment.querySelector('main') || fragment.querySelector('article'));
  const pieces = [];
  function readNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      pieces.push(node.data);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || ignoredTags.has(node.localName) ||
        node.hasAttribute('hidden') || node.getAttribute('aria-hidden') === 'true') return;
    const block = blockTags.has(node.localName);
    if (block) pieces.push(' ');
    for (const child of node.childNodes) readNode(child);
    if (block) pieces.push(' ');
  }
  if (mainContent) readNode(mainContent);
  else for (const node of fragment.childNodes) readNode(node);
  return pieces.join('').trim();
}
