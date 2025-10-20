import { CssTreeWalker } from "./CssTreeWalker";
import { SelectorFilter } from "./SelectorFilter";
import { getAllWordsInContent } from "./extractWordsUtils";

export interface PurifyOptions {
  info: boolean;
  rejected: boolean;
  whitelist: string[];
}

export type PurifyCallback = (result: string) => unknown;

const DEFAULT_OPTIONS: PurifyOptions = {
  info: false,
  rejected: false,
  whitelist: [],
};

const getOptions = (
  options: Partial<PurifyOptions> = ({} = {})
): PurifyOptions => {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
    whitelist: options.whitelist ?? DEFAULT_OPTIONS.whitelist,
  };
};

export const purify = (
  searchThrough: string,
  css: string,
  optionsOrCallback: Partial<PurifyOptions> | PurifyCallback,
  callbackMaybe: PurifyCallback
) => {
  let options: PurifyOptions;
  let callback: PurifyCallback | undefined;

  if (typeof optionsOrCallback === "function") {
    callback = optionsOrCallback;
    options = getOptions();
  } else {
    callback = callbackMaybe;
    options = getOptions(optionsOrCallback);
  }
  const wordsInContent = getAllWordsInContent(searchThrough);
  const selectorFilter = new SelectorFilter(wordsInContent, options.whitelist);
  const tree = new CssTreeWalker(css, [selectorFilter]);

  tree.beginReading();
  const source = tree.toString();

  if (options.info) {
    console.log("Size before", css.length);
    console.log("Size after: ", source.length);
  }

  if (options.rejected && selectorFilter.rejectedSelectors.length) {
    console.log("Rejected: ", selectorFilter.rejectedSelectors);
  }

  return callback ? callback(source) : source;
};
