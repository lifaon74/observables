const $fs = require('fs').promises;
const $path = require('path');

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
    const reg = /((?:\[[\w_PRIVATE]+\])|(?:[pP]rivates))\.([\w]+)/g;
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

async function compressErrors(content, output) {
    const texts = [];
    content = content.replace(/Error\(['`](.*?)['`]\)/g, (match, string) => {
        texts.push(string);
        return `Error('#${ texts.length }')`;
    });
    await $fs.writeFile(output, JSON.stringify(Object.fromEntries(texts.map((v, i) => [i, v])), null, '  '));
    return content;
}

function compressSymbols(content) {
    return content.replace(/Symbol\((.*?)\)/g, `Symbol()`);
}



function compressGlobals(content) {
    const constants = new Set([
        `TypeError`,
        `RangeError`,
        `Symbol`,
        `Array.isArray`,
        `Array.from`,
        `setTimeout`,
        `Object.defineProperty`,
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
    console.log('input', input);
    let content = (await $fs.readFile(input)).toString();
    // console.log(content);

    // content = compressPrivates(content);
    content = await compressErrors(content, output + '.errors.json');
    content = compressSymbols(content);
    content = compressGlobals(content);

    await $fs.writeFile(output, content);
}

const root = $path.join(__dirname, '../');
const bundlePath = $path.join(root, './dist/bundle');

Promise.all([
    run($path.join(bundlePath, './public.core.umd.esnext.js'), $path.join(bundlePath, './public.core.umd.esnext.pre-min.js')),
    run($path.join(bundlePath, './public.umd.esnext.js'), $path.join(bundlePath, './public.umd.esnext.pre-min.js')),
]).then(() => {
    console.log('done');
});

