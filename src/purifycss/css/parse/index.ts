import {
  ParserOptions,
  Stylesheet,
  Node,
  Comment,
  Declaration,
  KeyFrame,
  KeyFrames,
  Supports,
  Host,
  Media,
  CustomMedia,
  Page,
  Document,
  FontFace,
  Import,
  Charset,
  Namespace,
  Rule,
  Position,
  ParserError,
} from "../types";

const commentre = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;

function trim(str: string): string {
  return str ? str.replace(/^\s+|\s+$/g, "") : "";
}

/** Adds non-enumerable parent node reference to each node. */
function addParent<T extends Node | Record<string, any>>(
  obj: T,
  parent?: Node | null
): T {
  const isNode = obj && typeof (obj as Node).type === "string";
  const childParent = isNode ? (obj as Node) : parent ?? null;

  for (const k in obj) {
    const value = (obj as any)[k];
    if (Array.isArray(value)) {
      value.forEach((v) => addParent(v, childParent || null));
    } else if (value && typeof value === "object") {
      addParent(value, childParent || null);
    }
  }

  if (isNode) {
    Object.defineProperty(obj, "parent", {
      configurable: true,
      writable: true,
      enumerable: false,
      value: parent ?? null,
    });
  }

  return obj;
}

export function parse(
  cssInput: string,
  options: ParserOptions = {}
): Stylesheet {
  let css = cssInput;
  let lineno = 1;
  let column = 1;

  function updatePosition(str: string) {
    const lines = str.match(/\n/g);
    if (lines) lineno += lines.length;
    const i = str.lastIndexOf("\n");
    column = ~i ? str.length - i : column + str.length;
  }

  function PositionFactory(start: Position) {
    return function <T extends Node>(node: T): T {
      node.position = {
        start,
        end: { line: lineno, column },
        source: options.source,
        content: cssInput,
      };
      whitespace();
      return node;
    };
  }

  const errorsList: ParserError[] = [];

  function error(msg: string): never | false {
    const err = new Error(
      `${options.source || "<input>"}:${lineno}:${column}: ${msg}`
    ) as ParserError;
    err.reason = msg;
    err.filename = options.source;
    err.line = lineno;
    err.column = column;
    err.source = css;

    if (options.silent) {
      errorsList.push(err);
      return false as never;
    } else {
      throw err;
    }
  }

  function position() {
    const start = { line: lineno, column };
    return PositionFactory(start);
  }

  function match(re: RegExp) {
    const m = re.exec(css);
    if (!m) return;
    const str = m[0];
    updatePosition(str);
    css = css.slice(str.length);
    return m;
  }

  function whitespace() {
    match(/^\s*/);
  }

  function open() {
    return match(/^{\s*/);
  }

  function close() {
    return match(/^}/);
  }

  function comments(rules: Node[] = []) {
    let c: Comment | false | undefined;
    while ((c = comment())) {
      if (c) rules.push(c);
    }
    return rules;
  }

  function comment(): Comment | false | undefined {
    const pos = position();
    if (css.charAt(0) !== "/" || css.charAt(1) !== "*") return;

    let i = 2;
    while (
      css.charAt(i) !== "" &&
      (css.charAt(i) !== "*" || css.charAt(i + 1) !== "/")
    )
      ++i;
    i += 2;

    if (css.charAt(i - 1) === "") {
      return error("End of comment missing");
    }

    const str = css.slice(2, i - 2);
    column += 2;
    updatePosition(str);
    css = css.slice(i);
    column += 2;

    return pos({
      type: "comment",
      comment: str,
    } as Comment);
  }

  function selector(): string[] | undefined {
    const m = match(/^([^{]+)/);
    if (!m) return;
    return (
      trim(m[0])
        // remove all comments from selectors
        .replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g, "")
        // protect commas in quoted strings
        .replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, (mm) =>
          mm.replace(/,/g, "\u200C")
        )
        // split by commas outside parentheses
        .split(/\s*(?![^(]*\)),\s*/)
        .map((s) => s.replace(/\u200C/g, ","))
    );
  }

  function declaration(): Declaration | false | undefined {
    const pos = position();

    // prop
    let prop = match(/^(\*?[-#\/\*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);
    if (!prop) return;
    const propStr = trim(prop[0]);

    // :
    if (!match(/^:\s*/)) return error("property missing ':'");

    // val
    const val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/);

    const ret = pos({
      type: "declaration",
      property: propStr.replace(commentre, ""),
      value: val ? trim(val[0]).replace(commentre, "") : "",
    } as Declaration);

    // ;
    match(/^[;\s]*/);

    return ret;
  }

  function declarations(): Declaration[] {
    const decls: Declaration[] = [];

    if (!open()) {
      error("missing '{'");
      return decls;
    }
    comments(decls as unknown as Node[]);

    let decl: Declaration | false | undefined;
    while ((decl = declaration())) {
      if (decl) {
        decls.push(decl);
        comments(decls as unknown as Node[]);
      }
    }

    if (!close()) error("missing '}'");
    return decls;
  }

  function keyframe(): KeyFrame | undefined {
    let m: RegExpExecArray | undefined;
    const vals: string[] = [];
    const pos = position();

    while ((m = match(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/))) {
      vals.push(m[1]);
      match(/^,\s*/);
    }

    if (!vals.length) return;

    return pos({
      type: "keyframe",
      values: vals,
      declarations: declarations(),
    } as KeyFrame);
  }

  function atkeyframes(): KeyFrames | undefined | false {
    const pos = position();
    let m = match(/^@([-\w]+)?keyframes\s*/);
    if (!m) return;

    const vendor = m[1];

    m = match(/^([-\w]+)\s*/);
    if (!m) return error("@keyframes missing name");
    const name = m[1];

    if (!open()) return error("@keyframes missing '{'");

    let frame: KeyFrame | undefined;
    let frames = comments() as Node[];
    while ((frame = keyframe())) {
      frames.push(frame);
      frames = frames.concat(comments());
    }

    if (!close()) return error("@keyframes missing '}'");

    return pos({
      type: "keyframes",
      name,
      vendor,
      keyframes: frames as KeyFrame[],
    } as KeyFrames);
  }

  function atsupports(): Supports | undefined | false {
    const pos = position();
    const m = match(/^@supports *([^{]+)/);
    if (!m) return;

    const supports = trim(m[1]);

    if (!open()) return error("@supports missing '{'");

    const style = comments().concat(rules());

    if (!close()) return error("@supports missing '}'");

    return pos({
      type: "supports",
      supports,
      rules: style,
    } as Supports);
  }

  function athost(): Host | undefined | false {
    const pos = position();
    const m = match(/^@host\s*/);
    if (!m) return;

    if (!open()) return error("@host missing '{'");

    const style = comments().concat(rules());

    if (!close()) return error("@host missing '}'");

    return pos({
      type: "host",
      rules: style,
    } as Host);
  }

  function atmedia(): Media | undefined | false {
    const pos = position();
    const m = match(/^@media *([^{]+)/);
    if (!m) return;

    const media = trim(m[1]);

    if (!open()) return error("@media missing '{'");

    const style = comments().concat(rules());

    if (!close()) return error("@media missing '}'");

    return pos({
      type: "media",
      media,
      rules: style,
    } as Media);
  }

  function atcustommedia() {
    const pos = position();
    const m = match(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);
    if (!m) return;

    return pos({
      type: "custom-media",
      name: trim(m[1]),
      media: trim(m[2]),
    } as CustomMedia);
  }

  function atpage() {
    const pos = position();
    const m = match(/^@page */);
    if (!m) return;

    const sel = selector() || [];

    if (!open()) return error("@page missing '{'");
    let decls = comments() as Node[];

    let decl: Declaration | false | undefined;
    while ((decl = declaration())) {
      if (decl) {
        decls.push(decl);
        decls = decls.concat(comments());
      }
    }

    if (!close()) return error("@page missing '}'");

    return pos({
      type: "page",
      selectors: sel,
      declarations: decls as Declaration[],
    } as Page);
  }

  function atdocument() {
    const pos = position();
    const m = match(/^@([-\w]+)?document *([^{]+)/);
    if (!m) return;

    const vendor = trim(m[1]);
    const doc = trim(m[2]);

    if (!open()) return error("@document missing '{'");

    const style = comments().concat(rules());

    if (!close()) return error("@document missing '}'");

    return pos({
      type: "document",
      document: doc,
      vendor,
      rules: style,
    } as Document);
  }

  function atfontface() {
    const pos = position();
    const m = match(/^@font-face\s*/);
    if (!m) return;

    if (!open()) return error("@font-face missing '{'");
    let decls = comments() as Node[];

    let decl: Declaration | false | undefined;
    while ((decl = declaration())) {
      if (decl) {
        decls.push(decl);
        decls = decls.concat(comments());
      }
    }

    if (!close()) return error("@font-face missing '}'");

    return pos({
      type: "font-face",
      declarations: decls as Declaration[],
    } as FontFace);
  }

  const atimport = _compileAtrule("import");
  const atcharset = _compileAtrule("charset");
  const atnamespace = _compileAtrule("namespace");

  function _compileAtrule(name: "import" | "charset" | "namespace") {
    const re = new RegExp("^@" + name + "\\s*([^;]+);");
    return function (): Import | Charset | Namespace | undefined {
      const pos = position();
      const m = match(re);
      if (!m) return;
      const ret: any = { type: name };
      ret[name] = m[1].trim();
      return pos(ret);
    };
  }

  function atrule() {
    if (css[0] !== "@") return;

    return (
      atkeyframes() ||
      atmedia() ||
      atcustommedia() ||
      atsupports() ||
      atimport() ||
      atcharset() ||
      atnamespace() ||
      atdocument() ||
      atpage() ||
      athost() ||
      atfontface()
    );
  }

  function declarationsOrError(): Declaration[] {
    return declarations();
  }

  function rule() {
    const pos = position();
    const sel = selector();
    if (!sel) return error("selector missing");

    comments();

    return pos({
      type: "rule",
      selectors: sel,
      declarations: declarationsOrError(),
    } as Rule);
  }

  function rules() {
    let node: Node | false | undefined;
    const out: Node[] = [];
    whitespace();
    comments(out);

    while (css.length && css.charAt(0) !== "}" && (node = atrule() || rule())) {
      if (node) {
        out.push(node);
        comments(out);
      }
    }
    return out;
  }

  function stylesheet(): Stylesheet {
    const rulesList = rules();
    return {
      type: "stylesheet",
      stylesheet: {
        source: options.source,
        rules: rulesList,
        parsingErrors: errorsList,
      },
    };
  }

  return addParent(stylesheet());
}
