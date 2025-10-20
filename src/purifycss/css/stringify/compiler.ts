import { Node, StringifyOptions } from "../types";

type Visitor = (node: Node) => string;

export class Compiler {
  public options: StringifyOptions;

  constructor(opts: StringifyOptions = {}) {
    this.options = opts;
  }

  emit(str: string): string {
    return str;
  }

  visit<T extends Node>(node: T): string {
    const fn = (this as unknown as Record<string, Visitor>)[node.type];
    if (typeof fn !== "function") {
      throw new Error(`Compiler: no visitor for node type "${node.type}"`);
    }
    return fn.call(this, node);
  }

  mapVisit(nodes?: Node[], delim = ""): string {
    if (!nodes) return "";
    let buf = "";
    const { length } = nodes;

    for (let i = 0; i < length; i++) {
      buf += this.visit(nodes[i]);
      if (delim && i < length - 1) buf += this.emit(delim);
    }

    return buf;
  }
}
