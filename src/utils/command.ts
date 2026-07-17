/**
 * Split process_command into argv with quote support (POSIX shlex-like).
 * Allows quoted Windows paths such as "C:\\Program Files\\tool.exe".
 */
export function splitProcessCommand(command: string): string[] {
  const input = (command || '').trim();
  if (!input) {
    throw new Error('process_command is empty');
  }

  const args: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  const flush = () => {
    if (current.length > 0) {
      args.push(current);
      current = '';
    }
  };

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inSingle) {
      if (c === "'") {
        inSingle = false;
      } else {
        current += c;
      }
      continue;
    }
    if (inDouble) {
      if (c === '"') {
        inDouble = false;
        continue;
      }
      if (c === '\\' && i + 1 < input.length) {
        const next = input[i + 1];
        if (next === '"' || next === '\\' || next === '$' || next === '`' || next === '\n') {
          current += next;
          i++;
          continue;
        }
      }
      current += c;
      continue;
    }
    if (c === '\\') {
      if (i + 1 >= input.length) {
        throw new Error('invalid process_command: trailing backslash');
      }
      current += input[++i];
      continue;
    }
    if (c === "'") {
      inSingle = true;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      continue;
    }
    if (/\s/.test(c)) {
      flush();
      continue;
    }
    current += c;
  }

  if (inSingle || inDouble) {
    throw new Error('invalid process_command: unclosed quote');
  }
  flush();
  if (args.length === 0) {
    throw new Error('process_command is empty');
  }
  return args;
}
