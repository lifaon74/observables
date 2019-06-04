const $fs = require('fs').promises;

function escape(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

const alphabet = Array.from({ length: 26 }, (v, i) => String.fromCodePoint('a'.codePointAt(0) + i))
    .concat(Array.from({ length: 26 }, (v, i) => String.fromCodePoint('A'.codePointAt(0) + i)));

function generateName(index) {
    let name = '';
    do {
        name += alphabet[index % alphabet.length];
        index = Math.floor(index / alphabet.length);
    } while (index > 0);
    return name
}

function escapeVariableName(name) {
    return name.replace(/[^\w]/g, '_');
}


function compressPrivates(content) {


    // console.log(generateName(1000));
    const map = new Map();
    const reg = /((?:\[[\w]+\])|(?:[pP]rivates))\.([\w]+)/g;
    const _content = content.replace(reg, (match, key1, key2) => {
        // console.log(symbol);

        let subMap;
        if (!map.has(key1)) {
            subMap = new Map();
            map.set(key1, subMap);
        } else {
            subMap = map.get(key1);
        }

        let index;

        if (subMap.has(key2)) {
            index = subMap.get(key2);
        } else {
            index = subMap.size;
            subMap.set(key2, index);
        }

        return `${ key1 }.${ generateName(index) }`;
    });

    // for (const key of map.keys()) {
    //     if (_content.includes(key)) {
    //         console.log(`possible leak of ${ key }`);
    //     }
    // }

    const keys = new Set();
    for (const subMap of map.values()) {
        for (const key of subMap.keys()) {
            keys.add(key);
        }
    }


    for (const key of keys.values()) {
        const reg = new RegExp(`[\\w\\]]\\.${ escape(key) }[^\\w]`, 'g');
        if (reg.test(_content)) {
            console.log(`possible leak of ${ key }:\n`);
            let match;
            while ((match = reg.exec(_content)) !== null) {
                console.log(`${ _content.slice(Math.max(0, match.index - 20), match.index + 1) } -- ${ key } -- ${ _content.slice(match.index + match[0].length - 1, match.index + match[0].length - 1 + 20) }`);
                console.log(`------\n`);
            }
        }
    }

    return _content;
}

function compressGlobals(content) {
    const constants = new Set([
        `TypeError`,
        `RangeError`,
        `Symbol`,
        `Array.isArray`,
        `Array.from`,
        `setTimeout`,
        `Object.defineProperty`
    ]);

    const functions = new Set([
        // `Array.isArray`
    ]);

    const prefix = '__compressed__';

    const constantsLines = Array.from(constants).map((name) => {
        const newName = prefix + escapeVariableName(name);
        content = content.replace(new RegExp(escape(name), 'g'), newName);
        return `const ${ newName } = ${ name };`;
    });

    const functionsLines = Array.from(functions).map((name) => {
        const newName = prefix + escapeVariableName(name);
        content = content.replace(new RegExp(`${ escape(name) }[\s]*\\(`, 'g'), `${ newName }(`);
        return `function ${ newName } (...args) {
            ${ name }(...args);
        }`;
    });

    return [
        `((() => {`,
        ...constantsLines,
        ...functionsLines,
        content,
        `})());`,
    ].join('\n');

}

async function run(input, output) {
    let content = (await $fs.readFile(input)).toString();
    // console.log(content);

    content = compressPrivates(content);
    content = compressGlobals(content);

    await $fs.writeFile(output, content);
}

Promise.all([
    run('./dist/bundle/public.core.umd.esnext.js', './dist/bundle/public.core.umd.esnext.pre-min.js'),
    run('./dist/bundle/public.umd.esnext.js', './dist/bundle/public.umd.esnext.pre-min.js'),
]).then(() => {
    console.log('done');
});

