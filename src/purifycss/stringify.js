/**
 * Module dependencies.
 */

import Compressed from 'css/lib/stringify/compress';
import Identity from 'css/lib/stringify/identity';

/**
 * Stringfy the given AST `node`.
 *
 * Options:
 *
 *  - `compress` space-optimized output
 *  - `sourcemap` return an object with `.code` and `.map`
 *
 * @param {Object} node
 * @param {Object} [options]
 * @return {String}
 * @api public
 */

export default function (node, options) {
    options = options || {};

    const compiler = options.compress
        ? new Compressed(options)
        : new Identity(options);

    return compiler.compile(node);
};