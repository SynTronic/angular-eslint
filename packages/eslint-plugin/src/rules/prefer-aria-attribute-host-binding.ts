import type { TSESTree } from '@typescript-eslint/utils';
import {
  ATTR_PREFIX,
  getAriaAttributeBindingTarget,
  getAriaAttributeForProperty,
  getAriaBindingTargetName,
  isKnownAriaAttribute,
  Selectors,
} from '@angular-eslint/utils';
import { createESLintRule } from '../utils/create-eslint-rule';

export type Options = [{ readonly checkAttrPrefix?: boolean }];

export type MessageIds =
  | 'invalidAttrBindingName'
  | 'invalidStaticAttrPrefix'
  | 'suggestRemoveAttrPrefix'
  | 'preferAriaAttributeOverProperty'
  | 'preferAriaAttributeOverAttrPrefix'
  | 'suggestAriaAttribute'
  | 'unknownAriaAttribute';
export const RULE_NAME = 'prefer-aria-attribute-host-binding';

const BOUND_KEY_PATTERN = /^\[(attr\.)?(aria[-A-Z].*)\]$/i;
const HOST_BINDING_NAME_PATTERN = /^(attr\.)?(aria[-A-Z].*)$/i;
const STATIC_ATTR_KEY_PATTERN = /^attr\.(aria[-A-Z].*)$/i;
const HYPHENATED_ARIA_PATTERN = /^aria-/i;
const CAMEL_CASE_ARIA_PATTERN = /^aria[A-Z]/;

/**
 * Resolves a camelCase ARIA name (e.g. `ariaRoleDescription`) to its
 * hyphenated ARIA attribute name, or `null` when it cannot be resolved.
 */
function resolveCamelCaseAriaName(name: string): string | null {
  if (!CAMEL_CASE_ARIA_PATTERN.test(name)) return null;
  const mapped = getAriaAttributeForProperty(name);
  if (!mapped || !isKnownAriaAttribute(mapped.attributeName)) return null;
  return mapped.attributeName;
}

function getKeyText(key: TSESTree.Node): string | null {
  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value;
  }
  if (key.type === 'Identifier') {
    return key.name;
  }
  return null;
}

export default createESLintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ensures that ARIA host bindings in `host` metadata and `@HostBinding` decorators use hyphenated ARIA attribute names',
    },
    fixable: 'code',
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          checkAttrPrefix: {
            type: 'boolean',
            description:
              'Whether to report `attr.aria-*` host bindings that can be replaced by the shorter `aria-*` attribute binding.',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidAttrBindingName:
        '`attr.{{attribute}}` sets a literal attribute named `{{attribute}}`; use the hyphenated `attr.{{suggested}}` instead',
      invalidStaticAttrPrefix:
        '`{{attribute}}` is a static attribute literally named `{{attribute}}`; use `{{suggested}}` instead',
      suggestRemoveAttrPrefix: 'Rename to `{{suggested}}`',
      preferAriaAttributeOverProperty:
        'Use the `{{attribute}}` attribute binding instead of the `{{property}}` DOM property binding',
      preferAriaAttributeOverAttrPrefix:
        'Use the `{{attribute}}` attribute binding instead of the `attr.{{attribute}}` binding',
      suggestAriaAttribute: 'Replace with `[{{attribute}}]`',
      unknownAriaAttribute: '`{{attribute}}` is not a known ARIA attribute',
    },
    defaultOptions: [{ checkAttrPrefix: false }],
  },
  create(context, [{ checkAttrPrefix }]) {
    function checkBoundAriaName(
      node: TSESTree.Node,
      attrPrefix: string | undefined,
      name: string,
      formatReplacement: (bindingName: string) => string,
    ): void {
      if (HYPHENATED_ARIA_PATTERN.test(name)) {
        if (!isKnownAriaAttribute(name)) {
          context.report({
            node,
            messageId: 'unknownAriaAttribute',
            data: { attribute: name },
          });
          return;
        }
        if (!attrPrefix || !checkAttrPrefix) return;

        const target = getAriaAttributeBindingTarget(name);
        if (!target || target.attributeOnly) return;
        const attribute = target.attributeName;
        context.report({
          node,
          messageId: 'preferAriaAttributeOverAttrPrefix',
          data: { attribute },
          suggest: [
            {
              messageId: 'suggestAriaAttribute',
              data: { attribute },
              fix: (fixer) =>
                fixer.replaceText(node, formatReplacement(attribute)),
            },
          ],
        });
        return;
      }

      if (!CAMEL_CASE_ARIA_PATTERN.test(name)) return;

      if (attrPrefix) {
        const suggested = resolveCamelCaseAriaName(name);
        context.report({
          node,
          messageId: 'invalidAttrBindingName',
          data: { attribute: name, suggested: suggested ?? 'aria-*' },
          ...(suggested && {
            fix: (fixer) =>
              fixer.replaceText(
                node,
                formatReplacement(`${ATTR_PREFIX}${suggested}`),
              ),
          }),
        });
        return;
      }

      const mapped = getAriaAttributeForProperty(name);
      if (!mapped) return;
      const attribute = getAriaBindingTargetName(mapped);
      context.report({
        node,
        messageId: 'preferAriaAttributeOverProperty',
        data: { attribute, property: name },
        suggest: [
          {
            messageId: 'suggestAriaAttribute',
            data: { attribute },
            fix: (fixer) =>
              fixer.replaceText(node, formatReplacement(attribute)),
          },
        ],
      });
    }

    return {
      [Selectors.HOST_BINDING_DECORATOR]({ expression }: TSESTree.Decorator) {
        if (expression.type !== 'CallExpression') return;
        const [argument] = expression.arguments;
        if (
          argument?.type !== 'Literal' ||
          typeof argument.value !== 'string'
        ) {
          return;
        }

        const match = HOST_BINDING_NAME_PATTERN.exec(argument.value);
        if (!match || (match[1] && match[1] !== ATTR_PREFIX)) return;

        const quote = context.sourceCode.getText(argument)[0];
        checkBoundAriaName(
          argument,
          match[1],
          match[2],
          (n) => `${quote}${n}${quote}`,
        );
      },
      [`${Selectors.COMPONENT_OR_DIRECTIVE_CLASS_DECORATOR} ${Selectors.metadataProperty(
        'host',
      )} > ObjectExpression > Property`]({ key }: TSESTree.Property) {
        const keyText = getKeyText(key);
        if (keyText === null) return;

        const boundMatch = BOUND_KEY_PATTERN.exec(keyText);
        if (boundMatch && (!boundMatch[1] || boundMatch[1] === ATTR_PREFIX)) {
          const [, attrPrefix, name] = boundMatch;

          checkBoundAriaName(key, attrPrefix, name, (n) => `'[${n}]'`);
          return;
        }

        const staticMatch = STATIC_ATTR_KEY_PATTERN.exec(keyText);
        if (!staticMatch || !keyText.startsWith(ATTR_PREFIX)) return;

        const [, name] = staticMatch;
        const suggested = HYPHENATED_ARIA_PATTERN.test(name)
          ? isKnownAriaAttribute(name)
            ? name.toLowerCase()
            : null
          : resolveCamelCaseAriaName(name);

        context.report({
          node: key,
          messageId: 'invalidStaticAttrPrefix',
          data: { attribute: keyText, suggested: suggested ?? name },
          ...(suggested && {
            suggest: [
              {
                messageId: 'suggestRemoveAttrPrefix',
                data: { suggested },
                fix: (fixer) => fixer.replaceText(key, `'${suggested}'`),
              },
            ],
          }),
        });
      },
    };
  },
});

export const RULE_DOCS_EXTENSION = {
  rationale:
    "Angular `host` metadata keys of the form `[attr.name]` set a literal attribute with exactly that name, so `[attr.ariaLabel]` creates an `arialabel` attribute that assistive technologies ignore. The same applies to `@HostBinding('attr.ariaLabel')`, and `@HostBinding('ariaLabel')` binds the DOM property rather than the ARIA attribute. Likewise, a static key such as `attr.aria-label` creates an attribute literally named `attr.aria-label`. Binding the hyphenated ARIA attribute (for example `[aria-label]` or `[attr.aria-label]`) makes the intent explicit, works for every ARIA attribute (including those without a DOM reflection property), and avoids silently broken accessibility. Misspelled ARIA attribute names are also reported because they have no effect.",
};
