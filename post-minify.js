const $fs = require('fs').promises;

async function run(input, output) {
    const content = (await $fs.readFile(input)).toString();
    // console.log(content);

    const alphabet = Array.from({ length: 26 }, (v, i) => String.fromCodePoint('a'.codePointAt(0) + i))
        .concat(Array.from({ length: 26 }, (v, i) => String.fromCodePoint('A'.codePointAt(0) + i)));

    /**
     * PROBLEM
     * USAGE OF privates
     */
    function generateName(index) {
        let name = '';
        do {
            name += alphabet[index % alphabet.length];
            index = Math.floor(index / alphabet.length);
        } while (index > 0);
        return name
    }

    // console.log(generateName(1000));
    const map = new Map();
    const reg = /\[([\w]+)\]\.([\w]+)/g;
    let _content = content.replace(reg, (match, symbol, key) => {
        // console.log(symbol);

        let subMap;
        if (!map.has(symbol)) {
            subMap = new Map();
            map.set(symbol, subMap);
        } else {
            subMap = map.get(symbol);
        }

        let index;

        if (subMap.has(key)) {
            index = subMap.get(key);
        } else {
            index = subMap.size;
            subMap.set(key, index);
        }

        return `[${ symbol }].${ generateName(index) }`;
    });
    // console.log(reg.exec(content));

    await $fs.writeFile(output, _content);
}

Promise.all([
    run('./dist/bundle/public.core.umd.esnext.js', './dist/bundle/public.core.umd.esnext.pre-min.js'),
    run('./dist/bundle/public.umd.esnext.js', './dist/bundle/public.umd.esnext.pre-min.js'),
]).then(() => {
    console.log('finished');
});

