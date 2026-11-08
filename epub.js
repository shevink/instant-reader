import { unzipSync } from './vendor/fflate-0.8.3.js';
import { decodeText, textFromHTML } from './text.js';

const archiveRoot = new URL('https://epub.invalid/');
const MiB = 1024 * 1024;
const containerPath = 'META-INF/container.xml';
const encryptionPath = 'META-INF/encryption.xml';

function archivePath(reference, base = archiveRoot) {
  if (!reference) return null;
  const url = new URL(reference, base);
  return url.origin === archiveRoot.origin ? decodeURIComponent(url.pathname.slice(1)) : null;
}

function readEntries(bytes, paths) {
  let totalSize = 0;
  return unzipSync(bytes, {filter: entry => {
    if (!paths.has(entry.name)) return false;
    const size = Math.max(entry.size, entry.originalSize);
    totalSize += size;
    if (size > 8 * MiB || totalSize > 32 * MiB) {
      throw new Error('This EPUB contains too much reading text to load.');
    }
    return true;
  }});
}

function readXML(bytes, label) {
  if (!bytes) throw new Error(`This EPUB is missing its ${label}.`);
  const doc = new DOMParser().parseFromString(decodeText(bytes), 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error(`This EPUB has an invalid ${label}.`);
  }
  return doc;
}

export async function extractEPUB(file, onChapter) {
  if (file.size > 50 * MiB) throw new Error('Choose an EPUB smaller than 50 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const metadata = readEntries(bytes, new Set([containerPath, encryptionPath]));
  const container = readXML(metadata[containerPath], 'container file');
  const packageReference = container.getElementsByTagNameNS('*', 'rootfile')[0]?.getAttribute('full-path');
  const packagePath = archivePath(packageReference);
  if (!packagePath) throw new Error('This EPUB does not identify its book package.');

  const packageFiles = readEntries(bytes, new Set([packagePath]));
  const book = readXML(Object.hasOwn(packageFiles, packagePath) ? packageFiles[packagePath] : null, 'book package');
  const packageURL = new URL(packageReference, archiveRoot);
  const manifest = book.getElementsByTagNameNS('*', 'manifest')[0];
  const spine = book.getElementsByTagNameNS('*', 'spine')[0];
  if (!manifest || !spine) throw new Error('This EPUB does not define a reading order.');

  const textItems = new Map();
  for (const item of manifest.getElementsByTagNameNS('*', 'item')) {
    if (!['application/xhtml+xml', 'text/html'].includes(item.getAttribute('media-type'))) continue;
    if ((item.getAttribute('properties') || '').split(/\s+/).includes('nav')) continue;
    const path = archivePath(item.getAttribute('href'), packageURL);
    if (path) textItems.set(item.getAttribute('id'), path);
  }

  const paths = Array.from(spine.getElementsByTagNameNS('*', 'itemref'))
    .filter(item => item.getAttribute('linear') !== 'no')
    .map(item => textItems.get(item.getAttribute('idref')))
    .filter(Boolean);
  if (!paths.length) throw new Error('This EPUB has no readable chapters.');

  if (metadata[encryptionPath]) {
    const encryption = readXML(metadata[encryptionPath], 'encryption information');
    const encryptedPaths = new Set(Array.from(encryption.getElementsByTagNameNS('*', 'CipherReference'),
      item => archivePath(item.getAttribute('URI'))));
    if (paths.some(path => encryptedPaths.has(path))) {
      throw new Error('This EPUB has encrypted chapters. Choose a DRM-free copy.');
    }
  }

  const chapterFiles = readEntries(bytes, new Set(paths));
  const chapters = [];
  for (const [index, path] of paths.entries()) {
    if (onChapter(index + 1, paths.length) === false) return null;
    if (!Object.hasOwn(chapterFiles, path)) throw new Error(`Chapter ${index + 1} is missing from this EPUB.`);
    const text = textFromHTML(decodeText(chapterFiles[path]));
    if (text) chapters.push(text);
    if (index % 4 === 3) await new Promise(resolve => setTimeout(resolve, 0));
  }
  return chapters;
}
