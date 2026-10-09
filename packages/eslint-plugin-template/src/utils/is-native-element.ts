import { getDomElements } from './get-dom-elements';

/**
 * Returns `true` when the given tag name is a native HTML element, or an
 * element within the SVG or MathML namespaces.
 */
export function isNativeElement(tagName: string): boolean {
  const normalized = tagName.toLowerCase();
  return getDomElements().has(normalized) || /^:(svg|math):/.test(normalized);
}
