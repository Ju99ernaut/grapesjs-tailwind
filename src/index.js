import loadBlocks from './blocks';
import loadCommands from './commands';
import en from './locale/en';

export default (editor, opts = {}) => {
  const options = {
    ...{
      i18n: {},
      // default options
      tailwindCssUrl: 'https://unpkg.com/tailwindcss/dist/tailwind.min.css',
      changeThemeText: 'Change Theme',
    }, ...opts
  };

  // Add blocks
  loadBlocks(editor, options);
  // Add commands
  loadCommands(editor, options);
  // Load i18n files
  editor.I18n && editor.I18n.addMessages({
    en,
    ...options.i18n,
  });

  const appendTailwindCss = async (ed) => {
    const iframe = ed.Canvas.getFrameEl();

    if (!iframe) return;

    const cssLink = document.createElement('link');
    cssLink.href = options.tailwindCssUrl;
    cssLink.rel = 'stylesheet';

    const cssStyle = document.createElement('style');
    cssStyle.innerHTML = `img.object-cover { filter: sepia(1) hue-rotate(190deg) opacity(.46) grayscale(.7) !important; }`;

    // checks iframe is ready before loading Tailwind CSS - issue with firefox
    const f = setInterval(() => {
      const doc = iframe.contentDocument;
      if (doc.readyState === 'complete') {
        doc.head.appendChild(cssLink);
        doc.head.appendChild(cssStyle);
        clearInterval(f);
      }
    }, 100)
  }

  editor.on('load', () => {
    appendTailwindCss(editor);
  });
};
