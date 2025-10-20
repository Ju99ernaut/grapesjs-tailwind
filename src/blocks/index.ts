import type { Plugin } from "grapesjs";
import type { PluginOptions } from "..";
import { loadTailwindBlocks } from "./tailwind";

export const blocks: Plugin<PluginOptions> = (editor, opts = {}) => {
  loadTailwindBlocks(editor, opts);
};
