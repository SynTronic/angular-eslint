import { convertAnnotatedSourceToFailureCase } from '@angular-eslint/test-utils';
import type { MessageIds } from '../../../src/rules/prefer-aria-attribute-host-binding';

const messageIdInvalidAttrBindingName: MessageIds = 'invalidAttrBindingName';
const messageIdInvalidStaticAttrPrefix: MessageIds = 'invalidStaticAttrPrefix';
const messageIdPreferAriaAttributeOverProperty: MessageIds =
  'preferAriaAttributeOverProperty';
const messageIdUnknownAriaAttribute: MessageIds = 'unknownAriaAttribute';

export const valid = [
  `
    @Component({
      host: {
        '[aria-label]': 'label',
      },
    })
    class Test {}
  `,
  `
    @Directive({
      host: {
        '[attr.aria-label]': 'label',
        '[attr.aria-busy]': 'busy',
        '[attr.aria-roledescription]': 'description',
        'aria-hidden': 'true',
        role: 'button',
        '[class.active]': 'active',
        '(click)': 'onClick()',
        '[attr.title]': 'title',
      },
    })
    class Test {}
  `,
  `
    @Component({
      host: {
        '[ariaDescribedByElements]': 'elements',
        '[ATTR.ariaLabel]': 'label',
        'ATTR.aria-label': 'label',
        '[attr.arialabel]': 'label',
      },
    })
    class Test {}
  `,
  `
    @Injectable({
      host: {
        '[attr.ariaLabel]': 'label',
      },
    })
    class Test {}
  `,
];

export const invalid = [
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail and autofix when `attr.` is followed by a camelCase ARIA name',
    annotatedSource: `
      @Component({
        host: {
          '[attr.ariaRoleDescription]': 'description',
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        },
      })
      class Test {}
      `,
    messageId: messageIdInvalidAttrBindingName,
    data: {
      attribute: 'ariaRoleDescription',
      suggested: 'aria-roledescription',
    },
    annotatedOutput: `
      @Component({
        host: {
          '[attr.aria-roledescription]': 'description',
          
        },
      })
      class Test {}
      `,
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail without a fix when `attr.` is followed by an unknown camelCase ARIA name',
    annotatedSource: `
      @Component({
        host: {
          '[attr.ariaFoo]': 'foo',
          ~~~~~~~~~~~~~~~~
        },
      })
      class Test {}
      `,
    messageId: messageIdInvalidAttrBindingName,
    data: { attribute: 'ariaFoo', suggested: 'aria-*' },
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail when binding an ARIA DOM property instead of the ARIA attribute',
    annotatedSource: `
      @Component({
        host: {
          '[ariaLabel]': 'label',
          ~~~~~~~~~~~~~
        },
      })
      class Test {}
      `,
    messageId: messageIdPreferAriaAttributeOverProperty,
    data: { attribute: 'aria-label', property: 'ariaLabel' },
    suggestions: [
      {
        messageId: 'suggestAriaAttribute',
        data: { attribute: 'aria-label' },
        output: `
      @Component({
        host: {
          '[aria-label]': 'label',
          
        },
      })
      class Test {}
      `,
      },
    ],
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail when using `attr.` as a static attribute prefix for a hyphenated ARIA attribute',
    annotatedSource: `
      @Component({
        host: {
          'attr.aria-label': 'Close',
          ~~~~~~~~~~~~~~~~~
        },
      })
      class Test {}
      `,
    messageId: messageIdInvalidStaticAttrPrefix,
    data: { attribute: 'attr.aria-label', suggested: 'aria-label' },
    suggestions: [
      {
        messageId: 'suggestRemoveAttrPrefix',
        data: { suggested: 'aria-label' },
        output: `
      @Component({
        host: {
          'aria-label': 'Close',
          
        },
      })
      class Test {}
      `,
      },
    ],
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail when using `attr.` as a static attribute prefix for a camelCase ARIA name',
    annotatedSource: `
      @Component({
        host: {
          'attr.ariaLabel': 'Close',
          ~~~~~~~~~~~~~~~~
        },
      })
      class Test {}
      `,
    messageId: messageIdInvalidStaticAttrPrefix,
    data: { attribute: 'attr.ariaLabel', suggested: 'aria-label' },
    suggestions: [
      {
        messageId: 'suggestRemoveAttrPrefix',
        data: { suggested: 'aria-label' },
        output: `
      @Component({
        host: {
          'aria-label': 'Close',
          
        },
      })
      class Test {}
      `,
      },
    ],
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail without a suggestion when using `attr.` as a static attribute prefix for an unknown ARIA attribute',
    annotatedSource: `
      @Component({
        host: {
          'attr.aria-foo': 'foo',
          ~~~~~~~~~~~~~~~
        },
      })
      class Test {}
      `,
    messageId: messageIdInvalidStaticAttrPrefix,
    data: { attribute: 'attr.aria-foo', suggested: 'aria-foo' },
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail when binding an unknown hyphenated ARIA attribute with `attr.`',
    annotatedSource: `
      @Component({
        host: {
          '[attr.aria-labelby]': 'id',
          ~~~~~~~~~~~~~~~~~~~~~
        },
      })
      class Test {}
      `,
    messageId: messageIdUnknownAriaAttribute,
    data: { attribute: 'aria-labelby' },
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail when binding an unknown hyphenated ARIA attribute without `attr.`',
    annotatedSource: `
      @Component({
        host: {
          '[aria-labelby]': 'id',
          ~~~~~~~~~~~~~~~~
        },
      })
      class Test {}
      `,
    messageId: messageIdUnknownAriaAttribute,
    data: { attribute: 'aria-labelby' },
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should suggest an `attr.` binding when the ARIA attribute has no DOM property',
    annotatedSource: `
      @Component({
        host: {
          '[ariaDropEffect]': 'description',
          ~~~~~~~~~~~~~~~~~~
        },
      })
      class Test {}
      `,
    messageId: messageIdPreferAriaAttributeOverProperty,
    data: { attribute: 'attr.aria-dropeffect', property: 'ariaDropEffect' },
    suggestions: [
      {
        messageId: 'suggestAriaAttribute',
        data: { attribute: 'attr.aria-dropeffect' },
        output: `
      @Component({
        host: {
          '[attr.aria-dropeffect]': 'description',
          
        },
      })
      class Test {}
      `,
      },
    ],
  }),
];
