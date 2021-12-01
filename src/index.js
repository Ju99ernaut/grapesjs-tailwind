import loadComponents from './components';
import loadBlocks from './blocks';
import loadCommands from './commands';
import en from './locale/en';

export default (editor, opts = {}) => {
  const options = {
    ...{
      i18n: {},
      // default options
      tailwindCssUrl: 'https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css',
      changeThemeText: 'Change Theme',
    }, ...opts
  };

  // TODO: Add dark mode, block editing, css addition, block styles

  // Add components
  loadComponents(editor, options);
  // Add blocks
  loadBlocks(editor, options);
  // Add commands
  loadCommands(editor, options);
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