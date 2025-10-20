import type { Rule, Media } from "css";
import { rework, Rework } from "./rework";
import { SelectorFilter } from "./SelectorFilter";

type CssTreeWalkerEvents = {
  readRule: (selectors: string[], rule: Rule) => void;
};

class Emitter<EvtMap extends Record<string, (...args: any[]) => void>> {
  private listeners = new Map<keyof EvtMap, Set<EvtMap[keyof EvtMap]>>();

  on<K extends keyof EvtMap>(event: K, cb: EvtMap[K]): this {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return this;
  }

  off<K extends keyof EvtMap>(event: K, cb: EvtMap[K]): this {
    this.listeners.get(event)?.delete(cb);
    return this;
  }

  protected emit<K extends keyof EvtMap>(
    event: K,
    ...args: Parameters<EvtMap[K]>
  ) {
    this.listeners.get(event)?.forEach((cb) => {
      cb(...args);
    });
  }
}

type AnyRule = Rule | Media | { type: string; [key: string]: any };

interface ReworkTree {
  rules: AnyRule[];
}

type CssTreePlugin = InstanceType<typeof SelectorFilter>;

type ReworkAst = InstanceType<typeof Rework>;

const RULE_TYPE = "rule";
const MEDIA_TYPE = "media";

export class CssTreeWalker extends Emitter<CssTreeWalkerEvents> {
  private startingSource: string;
  private ast: ReworkAst | null = null;

  constructor(code: string, plugins: CssTreePlugin[]) {
    super();
    this.startingSource = code;

    plugins.forEach((plugin) => {
      plugin.initialize(this);
    });
  }

  beginReading() {
    this.ast = rework(this.startingSource).use(this.readPlugin.bind(this));
  }

  readPlugin(tree: ReworkTree) {
    this.readRules(tree.rules);
    this.removeEmptyRules(tree.rules);
  }

  readRules(rules: AnyRule[]) {
    for (const rule of rules) {
      if (rule.type === RULE_TYPE) {
        const cssRule = rule as Rule;
        this.emit("readRule", cssRule.selectors ?? [], cssRule);
      }
      if (rule.type === MEDIA_TYPE) {
        this.readRules((rule as Media).rules ?? []);
      }
    }
  }

  removeEmptyRules(rules: AnyRule[]) {
    let emptyRules = [];

    for (let rule of rules) {
      const ruleType = rule.type;

      if (ruleType === RULE_TYPE && rule.selectors.length === 0) {
        emptyRules.push(rule);
      }
      if (ruleType === MEDIA_TYPE) {
        this.removeEmptyRules(rule.rules);
        if (rule.rules.length === 0) {
          emptyRules.push(rule);
        }
      }
    }

    emptyRules.forEach((emptyRule) => {
      const index = rules.indexOf(emptyRule);
      rules.splice(index, 1);
    });
  }

  toString() {
    if (this.ast) {
      return this.ast.toString().replace(/,\n/g, ",");
    }
    return "";
  }
}
