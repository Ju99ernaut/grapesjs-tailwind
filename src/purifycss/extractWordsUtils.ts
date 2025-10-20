const addWord = (words: string[], word?: string): void => {
  if (word) words.push(word);
};

export const getAllWordsInContent = (
  content: string
): Record<string, boolean> => {
  const lower = content.toLowerCase();

  const used: Record<string, boolean> = {
    html: true,
    body: true,
  };

  const words = lower.split(/[^a-z]/g);
  for (const word of words) {
    if (word) used[word] = true;
  }
  return used;
};

export const getAllWordsInSelector = (selector: string): string[] => {
  // Remove attr selectors. "a[href...]"" will become "a".
  let sel = selector.replace(/\[(.+?)\]/g, "").toLowerCase();
  // If complex attr selector (has a bracket in it) just leave
  // the selector in. ¯\_(ツ)_/¯
  if (sel.includes("[") || sel.includes("]")) return [];

  let skipNextWord = false;
  let word = "";
  const words: string[] = [];

  for (const letter of sel) {
    if (skipNextWord && !/[ #.]/.test(letter)) continue;

    // If pseudoclass ":" or universal selector "*", finish current word
    // and skip until a delimiter
    if (/[:*]/.test(letter)) {
      addWord(words, word);
      word = "";
      skipNextWord = true;
      continue;
    }

    if (/[a-z]/.test(letter)) {
      word += letter;
    } else {
      addWord(words, word);
      word = "";
      skipNextWord = false;
    }
  }

  addWord(words, word);
  return words;
};
