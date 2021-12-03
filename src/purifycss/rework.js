/**
 * Module dependencies.
 */

import parse from 'css/lib/parse';
import stringify from './stringify';

/**
 * Initialize a new stylesheet `Rework` with `str`.
 *
 * @param {String} str
 * @param {Object} options
 * @return {Rework}
 * @api public
 */

export default function rework(str, options) {
    return new Rework(parse(str, options));
}

/**
 * Initialize a new stylesheet `Rework` with `obj`.
 *
 * @param {Object} obj
 * @api private
 */

class Rework {
    constructor(obj) {
        this.obj = obj;
    }
    /**
     * Use the given plugin `fn(style, rework)`.
     *
     * @param {Function} fn
     * @return {Rework}
     * @api public
     */
    use(fn) {
        fn(this.obj.stylesheet, this);
        return this;
    }

    toString(options) {
        options = options || {};
        return stringify(this.obj, options);;
    }
}