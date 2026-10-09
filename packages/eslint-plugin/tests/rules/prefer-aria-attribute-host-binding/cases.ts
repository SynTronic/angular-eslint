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
  `
    @Directive({})
    class Test {
      @HostBinding('attr.aria-keyshortcuts') keyShortcuts = 'Alt+K';
      @HostBinding('aria-valuetext') valueText = 'Medium';
      @HostBinding('attr.aria-busy') busy = true;
      @HostBinding('class.active') active = true;
      @HostBinding('attr.title') title = 'Title';
      @HostBinding() role = 'button';
      @HostBinding(name) dynamic = 'dynamic';
    }
  `,
  `
    @Component({})
    class Test {
      @HostBinding('ariaDescribedByElements') elements = [];
      @HostBinding('ATTR.ariaLabel') upperCasePrefix = 'label';
      @HostBinding('attr.arialabel') lowerCase = 'label';
    }
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
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail and autofix when a `@HostBinding` uses `attr.` followed by a camelCase ARIA name',
    annotatedSource: `
      @Directive({})
      class Test {
        @HostBinding('attr.ariaValueText') valueText = 'Medium';
                     ~~~~~~~~~~~~~~~~~~~~
      }
      `,
    messageId: messageIdInvalidAttrBindingName,
    data: { attribute: 'ariaValueText', suggested: 'aria-valuetext' },
    annotatedOutput: `
      @Directive({})
      class Test {
        @HostBinding('attr.aria-valuetext') valueText = 'Medium';
                     
      }
      `,
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should preserve the quote style when autofixing a `@HostBinding` name',
    annotatedSource: `
      @Directive({})
      class Test {
        @HostBinding("attr.ariaBusy") busy = true;
                     ~~~~~~~~~~~~~~~
      }
      `,
    messageId: messageIdInvalidAttrBindingName,
    data: { attribute: 'ariaBusy', suggested: 'aria-busy' },
    annotatedOutput: `
      @Directive({})
      class Test {
        @HostBinding("attr.aria-busy") busy = true;
                     
      }
      `,
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail without a fix when a `@HostBinding` uses `attr.` followed by an unknown camelCase ARIA name',
    annotatedSource: `
      @Directive({})
      class Test {
        @HostBinding('attr.ariaFoo') foo = 'foo';
                     ~~~~~~~~~~~~~~
      }
      `,
    messageId: messageIdInvalidAttrBindingName,
    data: { attribute: 'ariaFoo', suggested: 'aria-*' },
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail when a `@HostBinding` binds an ARIA DOM property instead of the ARIA attribute',
    annotatedSource: `
      @Component({})
      class Test {
        @HostBinding('ariaRoleDescription') roleDescription = 'slide';
                     ~~~~~~~~~~~~~~~~~~~~~
      }
      `,
    messageId: messageIdPreferAriaAttributeOverProperty,
    data: {
      attribute: 'aria-roledescription',
      property: 'ariaRoleDescription',
    },
    suggestions: [
      {
        messageId: 'suggestAriaAttribute',
        data: { attribute: 'aria-roledescription' },
        output: `
      @Component({})
      class Test {
        @HostBinding('aria-roledescription') roleDescription = 'slide';
                     
      }
      `,
      },
    ],
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should suggest an `attr.` `@HostBinding` when the ARIA attribute has no DOM property',
    annotatedSource: `
      @Component({})
      class Test {
        @HostBinding('ariaDropEffect') dropEffect = 'move';
                     ~~~~~~~~~~~~~~~~
      }
      `,
    messageId: messageIdPreferAriaAttributeOverProperty,
    data: { attribute: 'attr.aria-dropeffect', property: 'ariaDropEffect' },
    suggestions: [
      {
        messageId: 'suggestAriaAttribute',
        data: { attribute: 'attr.aria-dropeffect' },
        output: `
      @Component({})
      class Test {
        @HostBinding('attr.aria-dropeffect') dropEffect = 'move';
                     
      }
      `,
      },
    ],
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail when a `@HostBinding` binds an unknown hyphenated ARIA attribute with `attr.`',
    annotatedSource: `
      @Directive({})
      class Test {
        @HostBinding('attr.aria-labelby') labelledBy = 'id';
                     ~~~~~~~~~~~~~~~~~~~
      }
      `,
    messageId: messageIdUnknownAriaAttribute,
    data: { attribute: 'aria-labelby' },
  }),
  convertAnnotatedSourceToFailureCase({
    description:
      'should fail when a `@HostBinding` binds an unknown hyphenated ARIA attribute without `attr.`',
    annotatedSource: `
      @Directive({})
      class Test {
        @HostBinding('aria-labelby') labelledBy = 'id';
                     ~~~~~~~~~~~~~~
      }
      `,
    messageId: messageIdUnknownAriaAttribute,
    data: { attribute: 'aria-labelby' },
  }),
];
