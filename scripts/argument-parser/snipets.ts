export function IndentLines(lines: string[], indent: string = '  ', copy: boolean = false): string[] {
  if (copy) {
    return lines.map((line: string) => (indent + line));
  } else {
    for (let i = 0, l = lines.length; i < l; i++) {
      lines[i] = indent + lines[i];
    }
    return lines;
  }
}

export function DedentLines(lines: string[], indent: string = '  ', copy: boolean = false): string[] {
  if (copy) {
    return lines.map((line: string) => (line.startsWith(indent) ? line.slice(indent.length) : line));
  } else {
    for (let i = 0, l = lines.length; i < l; i++) {
      if (lines[i].startsWith(indent)) {
        lines[i] = lines[i].slice(indent.length);
      }
    }
    return lines;
  }
}

export function JoinLikeLines(lines: string[], join: string = ',', copy: boolean = false): string[] {
  const lastIndex: number = lines.length - 1;
  if (copy) {
    return lines.map((line: string, index: number) => (line + ((index < lastIndex) ? join : '')));
  } else {
    for (let i = 0; i < lastIndex; i++) {
      lines[i] += join;
    }
    return lines;
  }
}

export function ScopeLines(lines: string[], copy: boolean = false): string[] {
  if (copy) {
    return ['{', ...IndentLines(lines, void 0, true), '}'];
  } else {
    IndentLines(lines);
    lines.unshift('{');
    lines.push('}');
    return lines;
  }
}

export function SplitToLines(input: string): string[] {
  return input.split(/\r?\n/g);
}

export function JoinLines(lines: string[]): string {
  return lines.join('\n');
}

export function InferIndent(lines: string[]): string {
  for (let i = 0, l = lines.length; i < l; i++) {
    if (lines[i].trim() !== '') {
      const match: RegExpExecArray | null = (/\s*/g).exec(lines[i]);
      if (match !== null) { // optional because match cannot be null
        return match[0];
      }
    }
  }
  return '';
}

export function NormalizeLines(lines: string[], copy: boolean = false): string[] {
  if (copy) {
    lines = lines.slice();
  }

  if ((lines.length > 0)  && (lines[0].trim() === '')) {
    lines.shift();
  }

  if ((lines.length > 0)  && (lines[lines.length - 1].trim() === '')) {
    lines.pop();
  }

  return DedentLines(lines, InferIndent(lines), false);
}


export function $lines(input: string): string[] {
  return NormalizeLines(SplitToLines(input), false);
}


// console.log(
//   $lines(`
//     PRIMARY KEY (contact_id, group_id),
//       SELECT
//     HELLO DEAR
//   `)
// );
