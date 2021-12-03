import CssTreeWalker from "./CssTreeWalker"
import SelectorFilter from "./SelectorFilter"
import { getAllWordsInContent } from "./ExtractWordsUtil"

const OPTIONS = {
    info: false,
    rejected: false,
    whitelist: []
}

const getOptions = (options = {}) => {
    let opt = {}
    for (let option in OPTIONS) {
        opt[option] = options[option] || OPTIONS[option]
    }
    return opt
}

const purify = (searchThrough, css, options, callback) => {
    if (typeof options === "function") {
        callback = options
        options = {}
    }
    options = getOptions(options)
    let wordsInContent = getAllWordsInContent(searchThrough),
        selectorFilter = new SelectorFilter(wordsInContent, options.whitelist),
        tree = new CssTreeWalker(css, [selectorFilter])
    tree.beginReading()
    let source = tree.toString()

    // Option info = true
    if (options.info) {
        console.log('Size before', css.length)
        console.log('Size after: ', source.length)
    }

    // Option rejected = true
    if (options.rejected && selectorFilter.rejectedSelectors.length) {
        console.log('Rejected: ', selectorFilter.rejectedSelectors)
    }

    return callback ? callback(source) : source
}

export default purify