import { Compressed } from "./compress";
import { Identity } from "./identity";
import type { Stylesheet, StringifyOptions } from "../types";

export function stringify(node: Stylesheet, options: StringifyOptions) {
  options = options || {};

  const compiler = options.compress
    ? new Compressed(options)
    : new Identity(options);

  return compiler.compile(node);
}
