// https://github.com/saary/heurdist/blob/master/index.js
// http://siderite.blogspot.com/2014/11/super-fast-and-accurate-string-distance.html
// https://www.npmjs.com/package/sift-distance
// https://github.com/jhermsmeier/node-sift-distance/blob/SIFT4/lib/sift.js
// https://gist.github.com/inquisitiveSoft/c28cc2ebca0585eac35c

export interface SIFT4Options {
  maxDistance?: number;
  maxOffset?: number; // default: 5
}

function StringToUint32Array(str: string): Uint32Array {
  return new Uint32Array(Array.from<string, number>(str, char => char.codePointAt(0) as number));
}

function ToCodePoints(input: any): Uint32Array {
  if (typeof input === 'string') {
    return StringToUint32Array(input);
  } else if (input instanceof Uint32Array) {
    return input;
  } else {
    throw new TypeError(`Expected string or Uint32Array as input`);
  }
}

export interface SIFT4Offset {
  c1: number;
  c2: number;
  trans: boolean;
}

export function SIFT4(string1: string | Uint32Array, string2: string | Uint32Array, options: SIFT4Options = {}) {

  const codePoints1 = ToCodePoints(string1);
  const codePoints2 = ToCodePoints(string2);

  const codePointsLength1: number = codePoints1.length;
  const codePointsLength2: number = codePoints2.length;

  if (codePointsLength1 === 0) {
    return codePointsLength2;
  } else if (codePointsLength2 === 0) {
    return codePointsLength1;
  }

  const maxDistance: number = options.maxDistance || 0;
  const maxOffset: number = options.maxOffset || 5;

  let c1: number = 0; // cursor for string 1
  let c2: number = 0; // cursor for string 2
  let lcss: number = 0; // largest common subsequence
  let localCS: number = 0; // local common substring
  let numberOfTranspositions: number = 0; // number of transpositions
  const offsets: SIFT4Offset[] = []; // offset array

  while ((c1 < codePointsLength1) && (c2 < codePointsLength2)) {
    if (codePoints1[c1] === codePoints2[c2]) {
      localCS++;
      let isTransposition: boolean = false;
      let i: number = 0;

      while (i < offsets.length) {
        const offset: SIFT4Offset = offsets[i];
        if ((c1 <= offset.c1) || (c2 <= offset.c2)) {
          isTransposition = Math.abs(c2 - c1) >= Math.abs(offset.c2 - offset.c1);
          if (isTransposition) {
            numberOfTranspositions++;
          } else if (!offset.trans) {
            offset.trans = true;
            numberOfTranspositions++;
          }
          break;
        } else if ((c1 > offset.c2) && (c2 > offset.c1)) {
          offsets.splice(i, 1);
        } else {
          i++;
        }
      }
      offsets.push({
        c1,
        c2,
        trans: isTransposition
      });
    } else {
      lcss += localCS;
      localCS = 0;
      if (c1 !== c2) {
        c1 = c2 = Math.min(c1, c2);
      }
      for (let i = 0; (i < maxOffset) && (((c1 + i) < codePointsLength1) || ((c2 + i) < codePointsLength2)); i++) {
        if (((c1 + i) < codePointsLength1) && (codePoints1[c1 + i] === codePoints2[c2])) {
          c1 += i - 1;
          c2--;
          break;
        }
        if (((c2 + i) < codePointsLength2) && (codePoints1[c1] === codePoints2[c2 + i])) {
          c1--;
          c2 += i - 1;
          break;
        }
      }
    }

    c1++;
    c2++;

    if (maxDistance > 0) {
      const distance: number = Math.max(c1, c2) - lcss + numberOfTranspositions;
      if (distance >= maxDistance) {
        return Math.round(distance);
      }
    }

    // this covers the case where the last match is on the last token in list, so that it can compute transpositions correctly
    if ((c1 >= codePointsLength1) || (c2 >= codePointsLength2)) {
      lcss += localCS;
      localCS = 0;
      c1 = c2 = Math.min(c1, c2);
    }

  }

  lcss += localCS;

  return Math.round(
    Math.max(codePointsLength1, codePointsLength2) - lcss + numberOfTranspositions
  );
}



