/**
 * Split process_command into argv with quote support.
 * Allows quoted Windows paths such as "C:\\Program Files\\tool.exe".
 *
 * On Unix, escape rules follow POSIX shlex: outside quotes, '\' escapes the
 * next char; inside double quotes, '\' only escapes '"', '\', '$', '`' and
 * newline; inside single quotes, all characters are literal.
 *
 * On Windows, '\' is a path separator and is treated as a literal (except
 * '\"' inside double quotes), so unquoted paths like C:\tools\cred.exe keep
 * their backslashes.
 */
export function splitProcessCommand(command: string, windows: boolean = process.platform === 'win32'): string[] {
  const input = (command || '').trim();
  if (!input) {
    throw new Error('process_command is empty');
  }

  const args: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  // Tracks that a token has started even if it is empty, so quoted empty
  // arguments like `tool "" arg` keep their empty argv element.
  let hasToken = false;

  const flush = () => {
    if (hasToken) {
      args.push(current);
      current = '';
      hasToken = false;
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
        if (windows) {
          // On Windows only \" is an escape inside double quotes.
          if (next === '"') {
            current += next;
            i++;
            continue;
          }
        } else if (next === '"' || next === '\\' || next === '$' || next === '`' || next === '\n') {
          current += next;
          i++;
          continue;
        }
      }
      current += c;
      continue;
    }
    if (c === '\\') {
      if (windows) {
        // Path separator — keep literal.
        hasToken = true;
        current += c;
        continue;
      }
      if (i + 1 >= input.length) {
        throw new Error('invalid process_command: trailing backslash');
      }
      hasToken = true;
      current += input[++i];
      continue;
    }
    if (c === "'") {
      inSingle = true;
      hasToken = true;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      hasToken = true;
      continue;
    }
    if (/\s/.test(c)) {
      flush();
      continue;
    }
    hasToken = true;
    current += c;
  }

  if (inSingle || inDouble) {
    throw new Error('invalid process_command: unclosed quote');
  }
  flush();
  if (args.length === 0 || args[0] === '') {
    throw new Error('process_command is empty');
  }
  return args;
}
