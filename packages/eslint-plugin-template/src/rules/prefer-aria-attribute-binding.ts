import type {
  TmplAstElement,
  TmplAstTemplate,
} from '@angular-eslint/bundled-angular-compiler';
import {
  BindingType,
  TmplAstBoundAttribute,
} from '@angular-eslint/bundled-angular-compiler';
import {
  getAriaAttributeForProperty,
  getTemplateParserServices,
} from '@angular-eslint/utils';
import { createESLintRule } from '../utils/create-eslint-rule';

type BoundAttributeWithOriginalType = TmplAstBoundAttribute & {
  __originalType?: BindingType;
};

// Inputs hoisted onto a structural-directive template are shared with the
// child element, so the parser may overwrite `__originalType` with the
// constructor name. Fall back to inspecting the binding key in that case.
function isPropertyBinding(input: BoundAttributeWithOriginalType): boolean {
  const originalType = input.__originalType ?? input.type;
  if (typeof originalType === 'number') {
    return originalType === BindingType.Property;
  }
  const key = input.keySpan?.toString() ?? input.name;
  return key === input.name;
}

export type Options = [];
export type MessageIds =
  'preferAriaAttributeOverProperty' | 'suggestAriaAttribute';
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
    schema: [],
    messages: {
      preferAriaAttributeOverProperty:
        'Use the `{{attribute}}` attribute binding instead of the `{{property}}` DOM property binding',
      suggestAriaAttribute: 'Replace with `[{{attribute}}]`',
    },
  },
  defaultOptions: [],
  create(context) {
    const parserServices = getTemplateParserServices(context);
    const reportedOffsets = new Set<number>();

    function checkInputs(
      tagName: string,
      inputs: readonly BoundAttributeWithOriginalType[],
    ): void {
      for (const input of inputs) {
        if (!isPropertyBinding(input)) continue;

        const { name, sourceSpan, keySpan } = input;
        const ariaAttribute = getAriaAttributeForProperty(tagName, name);
        if (!ariaAttribute) continue;

        const offset = sourceSpan.start.offset;
        if (reportedOffsets.has(offset)) continue;
        reportedOffsets.add(offset);

        const attribute = ariaAttribute.attributeOnly
          ? `attr.${ariaAttribute.attributeName}`
          : ariaAttribute.attributeName;

        context.report({
          loc: parserServices.convertNodeSourceSpanToLoc(sourceSpan),
          messageId: 'preferAriaAttributeOverProperty',
          data: { property: name, attribute },
          suggest: keySpan
            ? [
                {
                  messageId: 'suggestAriaAttribute',
                  data: { attribute },
                  fix: (fixer) =>
                    fixer.replaceTextRange(
                      [keySpan.end.offset - name.length, keySpan.end.offset],
                      attribute,
                    ),
                },
              ]
            : [],
        });
      }
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
    'Angular maps hyphenated ARIA bindings such as `[aria-label]` to the attribute, while camelCase bindings such as `[ariaLabel]` set the ARIA reflection DOM property. Attribute bindings are the canonical, documented way to set ARIA in Angular templates, work consistently with server-side rendering and hydration (DOM properties are not serialized to HTML), and support every ARIA attribute, including ones that have no reflection property. This rule reports camelCase ARIA property bindings on native elements and suggests the equivalent attribute binding. Component and custom element inputs are not reported because they may intentionally accept camelCase inputs.',
};
