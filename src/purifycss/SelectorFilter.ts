import type { Rule } from "css";
import { getAllWordsInSelector } from "./extractWordsUtils";

export interface CssSyntaxTreeLike {
  on(event: "readRule", cb: (selectors: string[], rule: Rule) => void): void;
}

const isWildcardWhitelistSelector = (selector: string): boolean => {
  return selector[0] === "*" && selector[selector.length - 1] === "*";
};

const hasWhitelistMatch = (selector: string, whitelist: string[]): boolean => {
  for (const el of whitelist) {
    if (selector.includes(el)) return true;
  }
  return false;
};

export class SelectorFilter {
  private contentWords: Record<string, boolean>;
  public rejectedSelectors: string[] = [];
  private wildcardWhitelist: string[] = [];

  constructor(contentWords: Record<string, boolean>, whitelist: string[]) {
    this.contentWords = contentWords;
    this.parseWhitelist(whitelist);
  }

  initialize(CssSyntaxTree: CssSyntaxTreeLike) {
    CssSyntaxTree.on("readRule", this.parseRule.bind(this));
  }

  private parseWhitelist(whitelist: string[]) {
    whitelist.forEach((whitelistSelector) => {
      const lower = whitelistSelector.toLowerCase();

      if (isWildcardWhitelistSelector(lower)) {
        this.wildcardWhitelist.push(lower.substring(1, lower.length - 2));
      } else {
        getAllWordsInSelector(lower).forEach((word) => {
          this.contentWords[word] = true;
        });
      }
    });
  }

  private parseRule(selectors: string[], rule: Rule) {
    rule.selectors = this.filterSelectors(selectors);
  }

  private filterSelectors(selectors: string[]) {
    let contentWords = this.contentWords,
      rejectedSelectors = this.rejectedSelectors,
      wildcardWhitelist = this.wildcardWhitelist,
      usedSelectors: string[] = [];

    selectors.forEach((selector) => {
      if (hasWhitelistMatch(selector, wildcardWhitelist)) {
        usedSelectors.push(selector);
        return;
      }
      let words = getAllWordsInSelector(selector),
        usedWords = words.filter((word) => contentWords[word]);

      if (usedWords.length === words.length) {
        usedSelectors.push(selector);
      } else {
        rejectedSelectors.push(selector);
      }
    });

    return usedSelectors;
  }
}
