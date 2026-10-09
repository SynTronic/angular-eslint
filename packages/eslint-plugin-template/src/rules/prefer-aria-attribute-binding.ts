import type {
  TmplAstElement,
  TmplAstTemplate,
} from '@angular-eslint/bundled-angular-compiler';
import {
  BindingType,
  TmplAstBoundAttribute,
} from '@angular-eslint/bundled-angular-compiler';
import {
  ATTR_PREFIX,
  getAriaAttributeBindingTarget,
  getAriaAttributeForProperty,
  getAriaBindingTargetName,
  getOriginalBindingType,
  getTemplateParserServices,
} from '@angular-eslint/utils';
import { createESLintRule } from '../utils/create-eslint-rule';
import { isNativeElement } from '../utils/is-native-element';

// Inputs hoisted onto a structural-directive template are shared with the
// child element, so the parser may overwrite `__originalType` with the
// constructor name. Fall back to inspecting the binding key in that case.
function isPropertyBinding(input: TmplAstBoundAttribute): boolean {
  const originalType = getOriginalBindingType<unknown>(input);
  if (typeof originalType === 'number') {
    return originalType === BindingType.Property;
  }
  const key = input.keySpan?.toString() ?? input.name;
  return key === input.name;
}

function isAttrBinding(input: TmplAstBoundAttribute): boolean {
  const originalType = getOriginalBindingType<unknown>(input);
  if (typeof originalType === 'number') {
    return originalType === BindingType.Attribute;
  }
  const key = input.keySpan?.toString() ?? '';
  return key.startsWith(ATTR_PREFIX);
}

export type Options = [{ readonly checkAttrPrefix?: boolean }];
export type MessageIds =
  | 'preferAriaAttributeOverProperty'
  | 'preferAriaAttributeOverAttrPrefix'
  | 'suggestAriaAttribute';
export const RULE_NAME = 'prefer-aria-attribute-binding';

export default createESLintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ensures ARIA bindings on native elements target the ARIA attribute rather than the ARIA reflection DOM property',
    },
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          checkAttrPrefix: {
            type: 'boolean',
            description:
              'Whether to report hyphenated `attr.`-prefixed ARIA bindings, such as `[attr.aria-label]`, on native elements',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferAriaAttributeOverProperty:
        'Use the `{{attribute}}` attribute binding instead of the `{{property}}` DOM property binding',
      preferAriaAttributeOverAttrPrefix:
        'Use the `{{attribute}}` attribute binding instead of the `attr.{{attribute}}` binding',
      suggestAriaAttribute: 'Replace with `[{{attribute}}]`',
    },
  },
  defaultOptions: [{ checkAttrPrefix: true }],
  create(context, [{ checkAttrPrefix }]) {
    const parserServices = getTemplateParserServices(context);
    const reportedOffsets = new Set<number>();

    function report(
      { sourceSpan, keySpan }: TmplAstBoundAttribute,
      messageId: Exclude<MessageIds, 'suggestAriaAttribute'>,
      data: Record<string, string>,
      attribute: string,
      replaceLength: number,
    ): void {
      const offset = sourceSpan.start.offset;
      if (reportedOffsets.has(offset)) return;
      reportedOffsets.add(offset);

      context.report({
        loc: parserServices.convertNodeSourceSpanToLoc(sourceSpan),
        messageId,
        data,
        suggest: keySpan
          ? [
              {
                messageId: 'suggestAriaAttribute',
                data: { attribute },
                fix: (fixer) =>
                  fixer.replaceTextRange(
                    [keySpan.end.offset - replaceLength, keySpan.end.offset],
                    attribute,
                  ),
              },
            ]
          : [],
      });
    }

    function checkInputs(
      tagName: string,
      inputs: readonly TmplAstBoundAttribute[],
    ): void {
      if (!isNativeElement(tagName)) return;

      for (const input of inputs) {
        if (checkAttrPrefix && isAttrBinding(input)) {
          checkAttrInput(input);
          continue;
        }
        if (!isPropertyBinding(input)) continue;

        const { name } = input;
        const target = getAriaAttributeForProperty(name);
        if (!target) continue;

        const attribute = getAriaBindingTargetName(target);
        report(
          input,
          'preferAriaAttributeOverProperty',
          { property: name, attribute },
          attribute,
          name.length,
        );
      }
    }

    function checkAttrInput(input: TmplAstBoundAttribute): void {
      const { name } = input;
      const target = getAriaAttributeBindingTarget(name);
      if (!target || target.attributeOnly) return;

      const attribute = target.attributeName;
      report(
        input,
        'preferAriaAttributeOverAttrPrefix',
        { attribute },
        attribute,
        ATTR_PREFIX.length + name.length,
      );
    }

    return {
      Element(element: TmplAstElement) {
        checkInputs(element.name, element.inputs);
      },
      Template(template: TmplAstTemplate) {
        const { tagName } = template;
        if (!tagName || tagName === 'ng-template') return;

        // Inputs of an element with a structural directive are hoisted onto the template.
        checkInputs(tagName, [
          ...template.inputs,
          ...template.templateAttrs.filter(
            (attr): attr is TmplAstBoundAttribute =>
              attr instanceof TmplAstBoundAttribute,
          ),
        ]);
      },
    };
  },
});

export const RULE_DOCS_EXTENSION = {
  rationale:
    'Angular maps hyphenated ARIA bindings such as `[aria-label]` to the attribute, while camelCase bindings such as `[ariaLabel]` set the ARIA reflection DOM property. Attribute bindings are the canonical, documented way to set ARIA in Angular templates, work consistently with server-side rendering and hydration (DOM properties are not serialized to HTML), and support every ARIA attribute, including ones that have no reflection property. This rule reports camelCase ARIA property bindings on native elements and suggests the equivalent attribute binding. By default it also reports hyphenated `attr.`-prefixed ARIA bindings, such as `[attr.aria-label]`, `bind-attr.aria-label`, and `attr.aria-label="{{ label }}"`, because the `attr.` prefix is redundant for ARIA attributes since Angular v20; set `checkAttrPrefix` to `false` to allow them. ARIA attributes without a reflection DOM property are not reported in their `attr.` form. Component and custom element inputs are not reported because they may intentionally accept camelCase inputs.',
};
