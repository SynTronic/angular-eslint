import { DomElementSchemaRegistry } from '@angular-eslint/bundled-angular-compiler';
import { getAriaAttributeKeys } from './eslint-plugin/get-aria-attribute-keys';

export const ATTR_PREFIX = 'attr.';

export interface AriaBindingTarget {
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

let knownAriaAttributeKeys: ReadonlySet<string> | null = null;
let propertyToAttribute: Map<string, string> | null = null;
let attributeOnlyKeys: Set<string> | null = null;

function getKnownAriaAttributeKeys(): ReadonlySet<string> {
  return (knownAriaAttributeKeys ??= new Set(
    [...getAriaAttributeKeys(), ...ADDITIONAL_ARIA_ATTRIBUTE_KEYS].filter(
      (key) => !EXCLUDED_ARIA_ATTRIBUTE_KEYS.has(key),
    ),
  ));
}

/**
 * Returns `true` when the given (case-insensitive) name is a known hyphenated
 * ARIA attribute name.
 */
export function isKnownAriaAttribute(name: string): boolean {
  return getKnownAriaAttributeKeys().has(name.toLowerCase());
}

function buildMappings(): {
  propertyToAttribute: Map<string, string>;
  attributeOnlyKeys: Set<string>;
} {
  if (!propertyToAttribute || !attributeOnlyKeys) {
    const schema = new DomElementSchemaRegistry();
    propertyToAttribute = new Map<string, string>();
    attributeOnlyKeys = new Set<string>();

    for (const key of getKnownAriaAttributeKeys()) {
      const mapped = schema.getMappedPropName(key);
      if (mapped === key) {
        attributeOnlyKeys.add(key);
      } else if (
        !/Elements?$/.test(mapped) &&
        // ARIA reflection properties are defined on `Element`, so any element works.
        schema.hasProperty('div', mapped, [])
      ) {
        propertyToAttribute.set(mapped, key);
      }
    }
  }

  return { propertyToAttribute, attributeOnlyKeys };
}

/**
 * Returns the ARIA attribute that should be used instead of binding to the
 * given ARIA reflection DOM property, or `null` when the property is not an
 * ARIA reflection property.
 */
export function getAriaAttributeForProperty(
  propertyName: string,
): AriaBindingTarget | null {
  if (!/^aria[A-Z]/.test(propertyName)) return null;

  const mappings = buildMappings();

  const attributeName = mappings.propertyToAttribute.get(propertyName);
  if (attributeName) {
    return { attributeName, attributeOnly: false };
  }

  const candidate = `aria-${propertyName.slice('aria'.length).toLowerCase()}`;
  if (mappings.attributeOnlyKeys.has(candidate)) {
    return { attributeName: candidate, attributeOnly: true };
  }

  return null;
}

/**
 * Returns the ARIA attribute targeted by the given (case-insensitive)
 * attribute name, or `null` when the name is not a known ARIA attribute.
 * `attributeOnly` is `true` when the attribute has no ARIA reflection DOM
 * property.
 */
export function getAriaAttributeBindingTarget(
  attributeName: string,
): AriaBindingTarget | null {
  const normalized = attributeName.toLowerCase();
  if (!normalized.startsWith('aria-')) return null;

  const mappings = buildMappings();

  if (mappings.attributeOnlyKeys.has(normalized)) {
    return { attributeName: normalized, attributeOnly: true };
  }
  for (const mapped of mappings.propertyToAttribute.values()) {
    if (mapped === normalized) {
      return { attributeName: normalized, attributeOnly: false };
    }
  }

  return null;
}

/**
 * Returns the binding name to use for the given ARIA binding target, adding
 * the `attr.` prefix when the attribute has no ARIA reflection DOM property.
 */
export function getAriaBindingTargetName({
  attributeName,
  attributeOnly,
}: AriaBindingTarget): string {
  return attributeOnly ? `${ATTR_PREFIX}${attributeName}` : attributeName;
}

/**
 * Returns the binding type as written in the source. The template parser
 * normalizes some bindings (e.g. `[attr.aria-label]`) and keeps the original
 * type in `__originalType`.
 */
export function getOriginalBindingType<T>(binding: {
  readonly type: T;
  readonly __originalType?: T;
}): T {
  return binding.__originalType ?? binding.type;
}
