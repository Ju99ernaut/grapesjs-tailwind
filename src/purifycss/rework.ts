import {
  stringify,
  parse,
  type ParserOptions,
  type Stylesheet,
  type StringifyOptions,
} from "css";

export function rework(str: string, options?: ParserOptions) {
  return new Rework(parse(str, options));
}

export class Rework {
  private stylesheet: Stylesheet;

  constructor(stylesheet: Stylesheet) {
    this.stylesheet = stylesheet;
  }
  use(fn: Function) {
    fn(this.stylesheet.stylesheet, this);
    return this;
  }
  toString(options?: StringifyOptions) {
    options = options || {};
    return stringify(this.stylesheet, options);
  }
}
