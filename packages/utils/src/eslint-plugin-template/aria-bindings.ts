import { DomElementSchemaRegistry } from '@angular-eslint/bundled-angular-compiler';
import { getAriaAttributeKeys } from '../eslint-plugin/get-aria-attribute-keys';

export interface AriaAttributeForProperty {
  readonly attributeName: string;
  readonly attributeOnly: boolean;
}

const ADDITIONAL_ARIA_ATTRIBUTE_KEYS: readonly string[] = [
  'aria-braillelabel',
  'aria-brailleroledescription',
  'aria-colindextext',
  'aria-description',
  'aria-grabbed',
  'aria-keyshortcuts',
  'aria-roledescription',
  'aria-rowindextext',
];

const EXCLUDED_ARIA_ATTRIBUTE_KEYS: ReadonlySet<string> = new Set([
  'aria-dragged',
]);

let registry: DomElementSchemaRegistry | null = null;
let propertyToAttribute: Map<string, string> | null = null;
let attributeOnlyKeys: Set<string> | null = null;

function getRegistry(): DomElementSchemaRegistry {
  return (registry ??= new DomElementSchemaRegistry());
}

function buildMappings(): void {
  if (propertyToAttribute && attributeOnlyKeys) return;
  const schema = getRegistry();
  const mappings = new Map<string, string>();
  const attributeOnly = new Set<string>();
  const keys = new Set([
    ...getAriaAttributeKeys(),
    ...ADDITIONAL_ARIA_ATTRIBUTE_KEYS,
  ]);

  for (const key of keys) {
    if (EXCLUDED_ARIA_ATTRIBUTE_KEYS.has(key)) continue;
    const mapped = schema.getMappedPropName(key);
    if (mapped === key) {
      attributeOnly.add(key);
    } else if (
      !/Elements?$/.test(mapped) &&
      schema.hasProperty('div', mapped, [])
    ) {
      mappings.set(mapped, key);
    }
  }

  propertyToAttribute = mappings;
  attributeOnlyKeys = attributeOnly;
}

/**
 * Returns the ARIA attribute that should be used instead of binding to the
 * given ARIA DOM property on the given native element, or `null` when the
 * element is not a known native element or the property is not an ARIA
 * reflection property.
 */
export function getAriaAttributeForProperty(
  tagName: string,
  propertyName: string,
): AriaAttributeForProperty | null {
  if (!/^aria[A-Z]/.test(propertyName)) return null;
  if (!getRegistry().hasElement(tagName.toLowerCase(), [])) return null;

  buildMappings();

  const attributeName = propertyToAttribute?.get(propertyName);
  if (attributeName) {
    return { attributeName, attributeOnly: false };
  }

  const candidate = `aria-${propertyName.slice(4).toLowerCase()}`;
  if (attributeOnlyKeys?.has(candidate)) {
    return { attributeName: candidate, attributeOnly: true };
  }

  return null;
}

/**
 * Returns the ARIA attribute targeted by the given attribute name on the given
 * native element, or `null` when the element is not a known native element or
 * the name is not a known ARIA attribute. `attributeOnly` is `true` when the
 * attribute has no ARIA reflection DOM property.
 */
export function getAriaAttributeBindingTarget(
  tagName: string,
  attributeName: string,
): AriaAttributeForProperty | null {
  const normalized = attributeName.toLowerCase();
  if (!normalized.startsWith('aria-')) return null;
  if (!getRegistry().hasElement(tagName.toLowerCase(), [])) return null;

  buildMappings();

  if (attributeOnlyKeys?.has(normalized)) {
    return { attributeName: normalized, attributeOnly: true };
  }
  for (const mapped of propertyToAttribute?.values() ?? []) {
    if (mapped === normalized) {
      return { attributeName: normalized, attributeOnly: false };
    }
  }

  return null;
}
