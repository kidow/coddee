import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'

export const registerVue = (monaco: typeof Monaco) => {
  monaco.languages.register({ id: 'vue' })
  monaco.languages.setMonarchTokensProvider('vue', {
    defaultToken: '',
    tokenPostfix: '.html',
    ignoreCase: true,
    tokenizer: {
      root: [
        [/{{/, { token: 'comment', next: '@vueExp', nextEmbedded: 'js' }],
        [/<!DOCTYPE/, 'metatag', '@doctype'],
        [/<!--/, 'comment', '@comment'],
        [
          /(<)((?:[\w\-]+:)?[\w\-]+)(\s*)(\/>)/,
          ['delimiter', 'tag', '', 'delimiter']
        ],
        [
          /(<)(script)/,
          [{ token: 'delimiter' }, { token: 'tag', next: '@script' }]
        ],
        [
          /(<)(style)/,
          [{ token: 'delimiter' }, { token: 'tag', next: '@style' }]
        ],
        [
          /(<)((?:[\w\-]+:)?[\w\-]+)/,
          [{ token: 'delimiter' }, { token: 'tag', next: '@otherTag' }]
        ],
        [
          /(<\/)((?:[\w\-]+:)?[\w\-]+)/,
          [{ token: 'delimiter' }, { token: 'tag', next: '@otherTag' }]
        ],
        [/</, 'delimiter'],
        [/[^<{]+/, 'text']
      ],
      vueExp: [
        [/}}/, { nextEmbedded: '@pop', token: 'comment', next: '@root' }]
      ],
      doctype: [
        [/[^>]+/, 'metatag.content'],
        [/>/, 'metatag', '@pop']
      ],
      comment: [
        [/-->/, 'comment', '@pop'],
        [/[^-]+/, 'comment.content'],
        [/./, 'comment.content']
      ],
      otherTag: [
        [/[:@][\w\-]+/, { token: 'attribute.name', next: '@vueAttr' }],
        [/\/?>/, { token: 'delimiter', next: '@root' }],
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/[ \t\r\n]+/, 'white']
      ],
      vueAttr: [
        [/=/, 'delimiter'],
        ['"', { token: 'delimiter', next: '@vueAttrVal', nextEmbedded: 'js' }]
      ],
      vueAttrVal: [
        ['"', { token: 'delimiter', next: '@otherTag', nextEmbedded: '@pop' }]
      ],
      script: [
        [/type/, 'attribute.name', '@scriptAfterType'],
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [
          />/,
          { token: 'delimiter', next: '@scriptEmbedded', nextEmbedded: 'js' }
        ],
        [/[ \t\r\n]+/, 'white'],
        [
          /(<\/)(script\s*)(>)/,
          [
            { token: 'delimiter' },
            { token: 'tag' },
            { token: 'delimiter', next: '@pop' }
          ]
        ]
      ],
      scriptAfterType: [
        [/=/, 'delimiter', '@scriptAfterTypeEquals'],
        [
          />/,
          { token: 'delimiter', next: '@scriptEmbedded', nextEmbedded: 'js' }
        ],
        [/[ \t\r\n]+/, 'white'],
        [/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      scriptAfterTypeEquals: [
        [
          /"([^"]*)"/,
          { token: 'attribute.value', switchTo: '@scriptWithCustomType.$1' }
        ],
        [
          /'([^']*)'/,
          { token: 'attribute.value', switchTo: '@scriptWithCustomType.$1' }
        ],
        [
          />/,
          { token: 'delimiter', next: '@scriptEmbedded', nextEmbedded: 'js' }
        ],
        [/[ \t\r\n]+/, 'white'],
        [/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      scriptWithCustomType: [
        [
          />/,
          {
            token: 'delimiter',
            next: '@scriptEmbedded.$S2',
            nextEmbedded: '$S2'
          }
        ],
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/[ \t\r\n]+/, 'white'],
        [/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      scriptEmbedded: [
        [/<\/script/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }]
      ],
      style: [
        [/type/, 'attribute.name', '@styleAfterType'],
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [
          />/,
          {
            token: 'delimiter',
            next: '@styleEmbedded',
            nextEmbedded: 'text/css'
          }
        ],
        [/[ \t\r\n]+/, 'white'],
        [
          /(<\/)(style\s*)(>)/,
          [
            { token: 'delimiter' },
            { token: 'tag' },
            { token: 'delimiter', next: '@pop' }
          ]
        ]
      ],
      styleAfterType: [
        [/=/, 'delimiter', '@styleAfterTypeEquals'],
        [
          />/,
          {
            token: 'delimiter',
            next: '@styleEmbedded',
            nextEmbedded: 'text/css'
          }
        ],
        [/[ \t\r\n]+/, 'white'],
        [/<\/style\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      styleAfterTypeEquals: [
        [
          /"([^"]*)"/,
          { token: 'attribute.value', switchTo: '@styleWithCustomType.$1' }
        ],
        [
          /'([^']*)'/,
          { token: 'attribute.value', switchTo: '@styleWithCustomType.$1' }
        ],
        [
          />/,
          {
            token: 'delimiter',
            next: '@styleEmbedded',
            nextEmbedded: 'text/css'
          }
        ],
        [/[ \t\r\n]+/, 'white'],
        [/<\/style\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      styleWithCustomType: [
        [
          />/,
          {
            token: 'delimiter',
            next: '@styleEmbedded.$S2',
            nextEmbedded: '$S2'
          }
        ],
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/[ \t\r\n]+/, 'white'],
        [/<\/style\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      styleEmbedded: [
        [/<\/style/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
        [/[^<]+/, '']
      ]
    }
  })
}

export const registerSvelte = (monaco: typeof Monaco) => {
  monaco.languages.register({ id: 'svelte' })
  monaco.languages.setMonarchTokensProvider('svelte', {
    defaultToken: '',
    tokenPostfix: '.html',
    ignoreCase: true,
    tokenizer: {
      root: [
        [
          /{[#/]?(?:if|each)?/,
          { token: 'keyword', next: '@svelteExp', nextEmbedded: 'js' }
        ],
        [/<!DOCTYPE/, 'metatag', '@doctype'],
        [/<!--/, 'comment', '@comment'],
        [
          /(<)((?:[\w\-]+:)?[\w\-]+)(\s*)(\/>)/,
          ['delimiter', 'tag', '', 'delimiter']
        ],
        [
          /(<)(script)/,
          [{ token: 'delimiter' }, { token: 'tag', next: '@script' }]
        ],
        [
          /(<)(style)/,
          [{ token: 'delimiter' }, { token: 'tag', next: '@style' }]
        ],
        [
          /(<)((?:[\w\-]+:)?[\w\-]+)/,
          [{ token: 'delimiter' }, { token: 'tag', next: '@otherTag' }]
        ],
        [
          /(<\/)((?:[\w\-]+:)?[\w\-]+)/,
          [{ token: 'delimiter' }, { token: 'tag', next: '@otherTag' }]
        ],
        [/</, 'delimiter'],
        [/[^<{]+/, 'text'] // text
      ],
      svelteExp: [
        [/}/, { nextEmbedded: '@pop', token: 'keyword', next: '@root' }]
      ],
      doctype: [
        [/[^>]+/, 'metatag.content'],
        [/>/, 'metatag', '@pop']
      ],
      comment: [
        [/-->/, 'comment', '@pop'],
        [/[^-]+/, 'comment.content'],
        [/./, 'comment.content']
      ],
      otherTag: [
        [/{/, { token: 'keyword', next: '@svelteAttr', nextEmbedded: 'js' }],
        [/\/?>/, { token: 'delimiter', next: '@root' }],
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/[ \t\r\n]+/, 'white']
      ],
      svelteAttr: [
        [/}/, { token: 'keyword', next: '@otherTag', nextEmbedded: '@pop' }]
      ],
      script: [
        [/type/, 'attribute.name', '@scriptAfterType'],
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [
          />/,
          { token: 'delimiter', next: '@scriptEmbedded', nextEmbedded: 'js' }
        ],
        [/[ \t\r\n]+/, 'white'],
        [
          /(<\/)(script\s*)(>)/,
          [
            { token: 'delimiter' },
            { token: 'tag' },
            { token: 'delimiter', next: '@pop' }
          ]
        ]
      ],
      scriptAfterType: [
        [/=/, 'delimiter', '@scriptAfterTypeEquals'],
        [
          />/,
          { token: 'delimiter', next: '@scriptEmbedded', nextEmbedded: 'js' }
        ],
        [/[ \t\r\n]+/, 'white'],
        [/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      scriptAfterTypeEquals: [
        [
          /"([^"]*)"/,
          { token: 'attribute.value', switchTo: '@scriptWithCustomType.$1' }
        ],
        [
          /'([^']*)'/,
          { token: 'attribute.value', switchTo: '@scriptWithCustomType.$1' }
        ],
        [
          />/,
          { token: 'delimiter', next: '@scriptEmbedded', nextEmbedded: 'js' }
        ],
        [/[ \t\r\n]+/, 'white'],
        [/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      scriptWithCustomType: [
        [
          />/,
          {
            token: 'delimiter',
            next: '@scriptEmbedded.$S2',
            nextEmbedded: '$S2'
          }
        ],
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/[ \t\r\n]+/, 'white'],
        [/<\/script\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      scriptEmbedded: [
        [/<\/script/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }]
      ],
      style: [
        [/type/, 'attribute.name', '@styleAfterType'],
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [
          />/,
          {
            token: 'delimiter',
            next: '@styleEmbedded',
            nextEmbedded: 'text/css'
          }
        ],
        [/[ \t\r\n]+/, 'white'],
        [
          /(<\/)(style\s*)(>)/,
          [
            { token: 'delimiter' },
            { token: 'tag' },
            { token: 'delimiter', next: '@pop' }
          ]
        ]
      ],
      styleAfterType: [
        [/=/, 'delimiter', '@styleAfterTypeEquals'],
        [
          />/,
          {
            token: 'delimiter',
            next: '@styleEmbedded',
            nextEmbedded: 'text/css'
          }
        ],
        [/[ \t\r\n]+/, 'white'],
        [/<\/style\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      styleAfterTypeEquals: [
        [
          /"([^"]*)"/,
          { token: 'attribute.value', switchTo: '@styleWithCustomType.$1' }
        ],
        [
          /'([^']*)'/,
          { token: 'attribute.value', switchTo: '@styleWithCustomType.$1' }
        ],
        [
          />/,
          {
            token: 'delimiter',
            next: '@styleEmbedded',
            nextEmbedded: 'text/css'
          }
        ],
        [/[ \t\r\n]+/, 'white'],
        [/<\/style\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      styleWithCustomType: [
        [
          />/,
          {
            token: 'delimiter',
            next: '@styleEmbedded.$S2',
            nextEmbedded: '$S2'
          }
        ],
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/[ \t\r\n]+/, 'white'],
        [/<\/style\s*>/, { token: '@rematch', next: '@pop' }]
      ],
      styleEmbedded: [
        [/<\/style/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
        [/[^<]+/, '']
      ]
    }
  })
}
