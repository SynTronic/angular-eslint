import { convertAnnotatedSourceToFailureCase } from '@angular-eslint/test-utils';
import type {
  InvalidTestCase,
  ValidTestCase,
} from '@typescript-eslint/rule-tester';
import type {
  MessageIds,
  Options,
} from '../../../src/rules/prefer-aria-attribute-binding';

const preferAriaAttributeOverProperty: MessageIds =
  'preferAriaAttributeOverProperty';
const suggestAriaAttribute: MessageIds = 'suggestAriaAttribute';

export const valid: readonly (string | ValidTestCase<Options>)[] = [
  '<div [aria-selected]="selected"></div>',
  '<div aria-label="{{ label }}"></div>',
  '<div aria-label="Static label"></div>',
  '<div [attr.aria-label]="label"></div>',
  '<div [attr.ariaLabel]="label"></div>',
  '<div [title]="title"></div>',
  '<div [class.ariaLabel]="isActive"></div>',
  '<div (ariaLabel)="onChange()"></div>',
  '<app-widget [ariaLabel]="label"></app-widget>',
  '<my-element [ariaSelected]="selected"></my-element>',
  '<ng-template [ariaLabel]="label"></ng-template>',
  '<div [ariaActiveDescendantElement]="element"></div>',
  '<div [ariaLabelledByElements]="elements"></div>',
  '<div [ariaLabelledBy]="ids"></div>',
  '<div [ariaDescribedBy]="ids"></div>',
  '<div [ariaDragged]="dragged"></div>',
  '<div [ariaCurrentWhenActive]="value"></div>',
  '<div [ariaLabelby]="typo"></div>',
  '<div [arialabel]="lowercase"></div>',
  // IDREF reflection properties map to `*Element(s)` DOM properties, which take elements rather than IDs.
  '<button [ariaActiveDescendant]="id"></button>',
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail if an ARIA DOM property is bound on a native element',
    annotatedSource: `
        <div [ariaSelected]="selected"></div>
             ~~~~~~~~~~~~~~~~~~~~~~~~~
      `,
    messageId: preferAriaAttributeOverProperty,
    data: { property: 'ariaSelected', attribute: 'aria-selected' },
    suggestions: [
      {
        messageId: suggestAriaAttribute,
        data: { attribute: 'aria-selected' },
        output: `
        <div [aria-selected]="selected"></div>
             
      `,
      },
    ],
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail if an ARIA DOM property with a multi-word name is bound on a native element',
    annotatedSource: `
        <input [ariaValueText]="text" />
               ~~~~~~~~~~~~~~~~~~~~~~
      `,
    messageId: preferAriaAttributeOverProperty,
    data: {
      property: 'ariaValueText',
      attribute: 'aria-valuetext',
    },
    suggestions: [
      {
        messageId: suggestAriaAttribute,
        data: { attribute: 'aria-valuetext' },
        output: `
        <input [aria-valuetext]="text" />
               
      `,
      },
    ],
  }),
  convertAnnotatedSourceToFailureCase({
    description: 'should fail if the native element name is uppercase',
    annotatedSource: `
        <DIV [ariaLabel]="label"></DIV>
             ~~~~~~~~~~~~~~~~~~~
      `,
    messageId: preferAriaAttributeOverProperty,
    data: { property: 'ariaLabel', attribute: 'aria-label' },
    suggestions: [
      {
        messageId: suggestAriaAttribute,
        data: { attribute: 'aria-label' },
        output: `
        <DIV [aria-label]="label"></DIV>
             
      `,
      },
    ],
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail once if an ARIA DOM property is bound on an element with a structural directive',
    annotatedSource: `
        <span *ngIf="show" [ariaHidden]="hidden"></span>
                           ~~~~~~~~~~~~~~~~~~~~~
      `,
    messageId: preferAriaAttributeOverProperty,
    data: { property: 'ariaHidden', attribute: 'aria-hidden' },
    suggestions: [
      {
        messageId: suggestAriaAttribute,
        data: { attribute: 'aria-hidden' },
        output: `
        <span *ngIf="show" [aria-hidden]="hidden"></span>
                           
      `,
      },
    ],
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail if an ARIA DOM property is bound on an `svg` element',
    annotatedSource: `
        <svg [ariaLabel]="label"></svg>
             ~~~~~~~~~~~~~~~~~~~
      `,
    messageId: preferAriaAttributeOverProperty,
    data: { property: 'ariaLabel', attribute: 'aria-label' },
    suggestions: [
      {
        messageId: suggestAriaAttribute,
        data: { attribute: 'aria-label' },
        output: `
        <svg [aria-label]="label"></svg>
             
      `,
      },
    ],
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail if an ARIA DOM property is bound on a namespaced SVG element',
    annotatedSource: `
        <svg><g [ariaLabel]="label"></g></svg>
                ~~~~~~~~~~~~~~~~~~~
      `,
    messageId: preferAriaAttributeOverProperty,
    data: { property: 'ariaLabel', attribute: 'aria-label' },
    suggestions: [
      {
        messageId: suggestAriaAttribute,
        data: { attribute: 'aria-label' },
        output: `
        <svg><g [aria-label]="label"></g></svg>
                
      `,
      },
    ],
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail if a DOM property that Angular does not map is bound and suggest an `attr.` binding',
    annotatedSource: `
        <div [ariaRelevant]="relevant"></div>
             ~~~~~~~~~~~~~~~~~~~~~~~~~
      `,
    messageId: preferAriaAttributeOverProperty,
    data: { property: 'ariaRelevant', attribute: 'attr.aria-relevant' },
    suggestions: [
      {
        messageId: suggestAriaAttribute,
        data: { attribute: 'attr.aria-relevant' },
        output: `
        <div [attr.aria-relevant]="relevant"></div>
             
      `,
      },
    ],
  }),
  ...(
    [
      ['ariaBrailleLabel', 'aria-braillelabel'],
      ['ariaBrailleRoleDescription', 'aria-brailleroledescription'],
      ['ariaDropEffect', 'aria-dropeffect'],
      ['ariaGrabbed', 'aria-grabbed'],
    ] as const
  ).map(([property, attribute]) =>
    convertAnnotatedSourceToFailureCase<MessageIds, Options>({
      description: `should fail if \`${property}\` is bound and suggest an \`attr.\` binding`,
      annotatedSource: `
        <div [${property}]="value"></div>
             ${'~'.repeat(property.length + 10)}
      `,
      messageId: preferAriaAttributeOverProperty,
      data: { property, attribute: `attr.${attribute}` },
      suggestions: [
        {
          messageId: suggestAriaAttribute,
          data: { attribute: `attr.${attribute}` },
          output: `
        <div [attr.${attribute}]="value"></div>
             
      `,
        },
      ],
    }),
  ),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail for each ARIA DOM property bound on the same element',
    annotatedSource: `
        <input [ariaLabel]="label" [ariaRequired]="required" />
               ~~~~~~~~~~~~~~~~~~~ ^^^^^^^^^^^^^^^^^^^^^^^^^
      `,
    messages: [
      {
        char: '~',
        messageId: preferAriaAttributeOverProperty,
        data: { property: 'ariaLabel', attribute: 'aria-label' },
        suggestions: [
          {
            messageId: suggestAriaAttribute,
            data: { attribute: 'aria-label' },
            output: `
        <input [aria-label]="label" [ariaRequired]="required" />
                                   
      `,
          },
        ],
      },
      {
        char: '^',
        messageId: preferAriaAttributeOverProperty,
        data: { property: 'ariaRequired', attribute: 'aria-required' },
        suggestions: [
          {
            messageId: suggestAriaAttribute,
            data: { attribute: 'aria-required' },
            output: `
        <input [ariaLabel]="label" [aria-required]="required" />
                                   
      `,
          },
        ],
      },
    ],
  }),
];
