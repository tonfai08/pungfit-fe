import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';

const privateImage = /^\/bk-api\/files\/[a-f\d]{24}$/i;
const sourceImage = (element: HTMLElement) => element.tagName === 'IMG' ? element : element.querySelector('img');
const ArticleImage = Image.extend({
  addAttributes() {
    return {
      src: { default: null, parseHTML: (el) => sourceImage(el)?.getAttribute('src') },
      alt: { default: '', parseHTML: (el) => sourceImage(el)?.getAttribute('alt') || '' },
      title: { default: null, parseHTML: (el) => sourceImage(el)?.getAttribute('title') },
      width: { default: null, parseHTML: (el) => {
        const width = Number(sourceImage(el)?.getAttribute('width'));
        return width >= 50 && width <= 2400 ? width : null;
      } },
      caption: { default: '', parseHTML: (el) => el.querySelector('figcaption')?.textContent || '' },
    };
  },
  parseHTML() {
    return ['figure', 'img[src]'].map((tag) => ({ tag, getAttrs: (node: HTMLElement) =>
      privateImage.test(sourceImage(node)?.getAttribute('src') || '') ? {} : false }));
  },
  renderHTML({ node }) {
    const { src, alt, title, width, caption } = node.attrs;
    return ['figure', { class: 'bk-article-image' },
      ['img', { src: privateImage.test(src || '') ? src : '', alt, title, ...(width ? { width } : {}) }],
      ...(caption ? [['figcaption', {}, String(caption)]] : []),
    ];
  },
});
export const articleExtensions = () => [
  StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, defaultProtocol: 'https',
    protocols: ['http', 'https', 'mailto'], HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } } }),
  TextStyleKit.configure({ fontFamily: false, fontSize: false, lineHeight: false }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TableKit.configure({ table: { resizable: false } }),
  ArticleImage.configure({ allowBase64: false }),
];
