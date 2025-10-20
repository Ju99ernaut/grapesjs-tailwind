import { purify } from "./purifycss";

import type { Component, Editor, Plugin } from "grapesjs";
import type { PluginOptions } from ".";

const themeList = [
  { name: "slate", color: "#64748b" },
  { name: "gray", color: "#6b7280" },
  { name: "zinc", color: "#71717a" },
  { name: "neutral", color: "#737373" },
  { name: "stone", color: "#78716c" },
  { name: "red", color: "#ef4444" },
  { name: "orange", color: "#f97316" },
  { name: "amber", color: "#f59e0b" },
  { name: "yellow", color: "#eab308" },
  { name: "lime", color: "#84cc16" },
  { name: "green", color: "#22c55e" },
  { name: "emerald", color: "#10b981" },
  { name: "teal", color: "#14b8a6" },
  { name: "cyan", color: "#06b6d4" },
  { name: "sky", color: "#0ea5e9" },
  { name: "blue", color: "#3b82f6" },
  { name: "indigo", color: "#6366f1" },
  { name: "violet", color: "#8b5cf6" },
  { name: "purple", color: "#a855f7" },
  { name: "fuchsia", color: "#d946ef" },
  { name: "pink", color: "#ec4899" },
  { name: "rose", color: "#f43f5e" },
] as const;

const colorRegex = new RegExp(
  /(bg|text|border|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emarald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(\d\d\d)/,
  "g"
);

const getUpdateThemeModal = (editor: Editor) => {
  const md = editor.Modal;
  const pfx = editor.getConfig().stylePrefix;

  const container = document.createElement("div");

  const containerBody = document.createElement("div");
  containerBody.style.padding = "40px 0px";
  containerBody.style.display = "flex";
  containerBody.style.justifyContent = "center";
  containerBody.style.flexWrap = "wrap";

  let selectedTheme: { name: string; color: string };
  themeList.forEach((theme) => {
    const btnColor = document.createElement("button");
    btnColor.className = "change-theme-button";
    btnColor.style.backgroundColor = theme.color;
    btnColor.onclick = () => (selectedTheme = theme);

    containerBody.appendChild(btnColor);
  });

  const containerFooter = document.createElement("div");

  const btnEdit = document.createElement("button");
  btnEdit.innerHTML = "Update";
  btnEdit.className = pfx + "btn-prim " + pfx + "btn-import";
  btnEdit.style.float = "right";
  btnEdit.onclick = () => {
    updateThemeColor(editor, selectedTheme.name);
    md.close();
  };

  // box-shadow: 0 0 0 2pt #c5c5c575
  containerFooter.appendChild(btnEdit);

  container.appendChild(containerBody);
  container.appendChild(containerFooter);
  return container;
};

const getAllComponents = (model: Component, result: Component[] = []) => {
  result.push(model);
  model.components().each((mod) => getAllComponents(mod, result));
  return result;
};

const updateThemeColor = (editor: Editor, color: string) => {
  const wrapper = editor.DomComponents.getWrapper();
  if (!wrapper) return;
  const componentsAll = getAllComponents(wrapper, []);
  componentsAll.forEach((component) => {
    const cls = component.getAttributes().class;
    if (typeof cls === "string" && cls.match(colorRegex)) {
      component.setClass(cls.replace(colorRegex, `$1-${color}-$3`));
    }
  });
};

export const commands: Plugin<PluginOptions> = (editor, opts = {}) => {
  const cm = editor.Commands;

  cm.add("open-update-theme", {
    run(_, sender) {
      sender?.set && sender.set("active", 0);
      const md = editor.Modal;
      md.setTitle(opts.changeThemeText ?? "Change Theme");
      const container = getUpdateThemeModal(editor);
      md.setContent(container);
      md.open();
    },
  });

  cm.add("get-tailwindCss", {
    run(editor, sender, options = {}) {
      sender?.set && sender.set("active", 0);
      const { html = editor.getHtml(), purifyOpts = {}, callback } = options;
      let tailwindCss = "";
      const doc = editor.Canvas.getDocument();

      if (!doc) return;

      doc.head.querySelectorAll("style").forEach((el) => {
        el.innerText.includes("tailwind") && (tailwindCss += el.innerText);
      });
      purify(html, tailwindCss, purifyOpts, callback);
    },
  });
};
