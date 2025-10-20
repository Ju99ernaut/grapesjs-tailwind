import {
  Charset,
  Comment,
  CustomMedia,
  Declaration,
  Document,
  FontFace,
  Host,
  Import,
  KeyFrame,
  KeyFrames,
  Media,
  Namespace,
  Page,
  Rule,
  StringifyOptions,
  Stylesheet,
  Supports,
} from "../types";
import { Compiler } from "./compiler";

export class Identity extends Compiler {
  private indentation?: string;
  private level = 1;

  constructor(options: StringifyOptions = {}) {
    super(options);
    this.indentation = options.indent;
  }

  compile(node: Stylesheet) {
    return this.stylesheet(node);
  }

  stylesheet(node: Stylesheet) {
    return this.mapVisit(node.stylesheet?.rules, "\n\n");
  }

  comment(node: Comment) {
    return this.emit(this.indent() + "/*" + node.comment + "*/");
  }

  import(node: Import) {
    return this.emit(`@import ${node.import};`);
  }

  media(node: Media) {
    return (
      this.emit(`@media ${node.media}`) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(node.rules, "\n\n") +
      this.emit(this.indent(-1) + "\n}")
    );
  }

  document(node: Document) {
    const doc = `@${node.vendor || ""}document ${node.document}`;
    return (
      this.emit(doc) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(node.rules, "\n\n") +
      this.emit(this.indent(-1) + "\n}")
    );
  }

  charset(node: Charset) {
    return this.emit(`@charset ${node.charset};`);
  }

  namespace(node: Namespace) {
    return this.emit(`@namespace ${node.namespace};`);
  }

  supports(node: Supports) {
    return (
      this.emit(`@supports ${node.supports}`) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(node.rules, "\n\n") +
      this.emit(this.indent(-1) + "\n}")
    );
  }

  keyframes(node: KeyFrames) {
    const head = `@${node.vendor || ""}keyframes ${node.name}`;
    return (
      this.emit(head) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(node.keyframes, "\n") +
      this.emit(this.indent(-1) + "}")
    );
  }

  keyframe(node: KeyFrame) {
    const decls = node.declarations;
    return (
      this.emit(this.indent()) +
      this.emit((node.values ?? []).join(", ")) +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(decls, "\n") +
      this.emit(this.indent(-1) + "\n" + this.indent() + "}\n")
    );
  }

  page(node: Page) {
    const sel = node.selectors?.length ? node.selectors.join(", ") + " " : "";
    return (
      this.emit(`@page ${sel}`) +
      this.emit("{\n") +
      this.emit(this.indent(1)) +
      this.mapVisit(node.declarations, "\n") +
      this.emit(this.indent(-1)) +
      this.emit("\n}")
    );
  }

  ["font-face"](node: FontFace): string {
    return (
      this.emit("@font-face ") +
      this.emit("{\n") +
      this.emit(this.indent(1)) +
      this.mapVisit(node.declarations, "\n") +
      this.emit(this.indent(-1)) +
      this.emit("\n}")
    );
  }

  host(node: Host): string {
    return (
      this.emit("@host") +
      this.emit(" {\n" + this.indent(1)) +
      this.mapVisit(node.rules, "\n\n") +
      this.emit(this.indent(-1) + "\n}")
    );
  }

  ["custom-media"](node: CustomMedia): string {
    return this.emit(`@custom-media ${node.name} ${node.media};`);
  }

  rule(node: Rule): string {
    const decls = node.declarations;
    if (!decls?.length) return "";
    const indent = this.indent();
    const head = (node.selectors ?? []).map((s) => indent + s).join(",\n");
    return (
      this.emit(head) +
      this.emit(" {\n") +
      this.emit(this.indent(1)) +
      this.mapVisit(decls, "\n") +
      this.emit(this.indent(-1)) +
      this.emit("\n" + this.indent() + "}")
    );
  }

  declaration(node: Declaration): string {
    return (
      this.emit(this.indent()) +
      this.emit(`${node.property}: ${node.value}`) +
      this.emit(";")
    );
  }

  private indent(level?: number): string {
    if (level != null) {
      this.level += level;
      return "";
    }
    const unit = this.indentation || "  ";
    return Array(this.level).join(unit);
  }
}
