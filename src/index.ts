import type { Component, Plugin } from "grapesjs";
import { blocks } from "./blocks";
import { commands } from "./commands";

export interface PluginOptions {
  tailwindPlayCdn?: string;
  tailwindPlugins?: string[];
  tailwindConfig?: Record<string, any>;
  changeThemeText?: string;
  openCategory?: string;
  loadBlocks?: boolean;
}

export const plugin: Plugin<PluginOptions> = (editor, opts = {}) => {
  const options = {
    ...{
      tailwindPlayCdn: "https://cdn.tailwindcss.com",
      tailwindPlugins: [],
      tailwindConfig: {},
      openCategory: "Blog",
      loadBlocks: true,
    },
    ...opts,
  };

  if (options.loadBlocks) blocks(editor, options);
  commands(editor, options);

  const appendTailwindCss = async (frame: Component) => {
    // @ts-ignore
    const iframe = frame.view?.getEl();

    if (!iframe) return;

    const { tailwindPlayCdn, tailwindPlugins, tailwindConfig } = options;
    const init = () => {
      iframe.contentWindow.tailwind.config = tailwindConfig;
    };

    const script = document.createElement("script");
    script.src =
      tailwindPlayCdn +
      (tailwindPlugins.length ? `?plugins=${tailwindPlugins.join()}` : "");
    script.onload = init;

    const cssStyle = document.createElement("style");

    // checks iframe is ready before loading Tailwind CSS - issue with firefox
    const frameInterval = setInterval(() => {
      const doc = iframe.contentDocument;
      if (doc && doc.readyState && doc.readyState === "complete") {
        doc.head.appendChild(script);
        doc.head.appendChild(cssStyle);
        clearInterval(frameInterval);
      }
    }, 100);
  };

  editor.Canvas.getModel()["on"]("change:frames", (_, frames: Component[]) => {
    frames.forEach((frame) =>
      frame.once("loaded", () => appendTailwindCss(frame))
    );
  });
};

export default plugin;
