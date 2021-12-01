import loadComponents from './components';
import loadBlocks from './blocks';
import en from './locale/en';

export default (editor, opts = {}) => {
  const options = { ...{
    i18n: {},
    // default options
  },  ...opts };

  // Add components
  loadComponents(editor, options);
  // Add blocks
  loadBlocks(editor, options);
  // Load i18n files
  editor.I18n && editor.I18n.addMessages({
      en,
      ...options.i18n,
  });

  // TODO Remove
  editor.on('load', () =>
    editor.addComponents(
        `<div style="margin:100px; padding:25px;">
            Content loaded from the plugin
        </div>`,
        { at: 0 }
    ))
};