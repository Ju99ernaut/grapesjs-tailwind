import {
  StringifyOptions,
  Stylesheet,
  Comment,
  Import,
  Media,
  Document,
  Charset,
  Namespace,
  Supports,
  KeyFrames,
  KeyFrame,
  Page,
  FontFace,
  Host,
  CustomMedia,
  Rule,
  Declaration,
} from "../types";
import { Compiler } from "./compiler";

export class Compressed extends Compiler {
  constructor(options: StringifyOptions = {}) {
    super(options);
  }

  compile(node: Stylesheet) {
    return node.stylesheet?.rules.map(this.visit, this).join("") || "";
  }

  comment(_node: Comment) {
    return this.emit("");
  }

  import(node: Import) {
    return this.emit(`@import ${node.import};`);
  }

  media(node: Media) {
    return (
      this.emit(`@media ${node.media}`) +
      this.emit("{") +
      this.mapVisit(node.rules) +
      this.emit("}")
    );
  }

  document(node: Document) {
    const doc = `@${node.vendor || ""}document ${node.document}`;
    return (
      this.emit(doc) +
      this.emit("{") +
      this.mapVisit(node.rules) +
      this.emit("}")
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
      this.emit("{") +
      this.mapVisit(node.rules) +
      this.emit("}")
    );
  }

  keyframes(node: KeyFrames) {
    const head = `@${node.vendor || ""}keyframes ${node.name}`;
    return (
      this.emit(head) +
      this.emit("{") +
      this.mapVisit(node.keyframes) +
      this.emit("}")
    );
  }

  keyframe(node: KeyFrame) {
    const decls = node.declarations;
    return (
      this.emit((node.values ?? []).join(",")) +
      this.emit("{") +
      this.mapVisit(decls) +
      this.emit("}")
    );
  }

  page(node: Page) {
    const sel = node.selectors?.length ? node.selectors.join(", ") : "";
    return (
      this.emit(`@page ${sel}`) +
      this.emit("{") +
      this.mapVisit(node.declarations) +
      this.emit("}")
    );
  }

  ["font-face"](node: FontFace) {
    return (
      this.emit("@font-face") +
      this.emit("{") +
      this.mapVisit(node.declarations) +
      this.emit("}")
    );
  }

  host(node: Host) {
    return (
      this.emit("@host") +
      this.emit("{") +
      this.mapVisit(node.rules) +
      this.emit("}")
    );
  }

  ["custom-media"](node: CustomMedia) {
    return this.emit(`@custom-media ${node.name} ${node.media};`);
  }

  rule(node: Rule) {
    const decls = node.declarations;
    if (!decls?.length) return "";
    return (
      this.emit((node.selectors ?? []).join(",")) +
      this.emit("{") +
      this.mapVisit(decls) +
      this.emit("}")
    );
  }

  declaration(node: Declaration) {
    return this.emit(`${node.property}:${node.value}`) + this.emit(";");
  }
}
