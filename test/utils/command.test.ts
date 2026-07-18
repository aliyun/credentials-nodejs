import expect from 'expect.js';
import { splitProcessCommand } from '../../src/utils/command';

describe('splitProcessCommand', function () {
  it('should split simple command', function () {
    expect(splitProcessCommand('cmd arg1 arg2')).to.eql(['cmd', 'arg1', 'arg2']);
  });

  it('should trim extra whitespace', function () {
    expect(splitProcessCommand('  cmd   arg1\targ2  ')).to.eql(['cmd', 'arg1', 'arg2']);
  });

  it('should keep windows path with spaces inside double quotes', function () {
    expect(splitProcessCommand('"C:\\Program Files\\tool\\cred.exe" get --profile default', true)).to.eql([
      'C:\\Program Files\\tool\\cred.exe',
      'get',
      '--profile',
      'default',
    ]);
  });

  it('should support single-quoted unix paths', function () {
    expect(splitProcessCommand("'/usr/local/my tools/cred' arg")).to.eql([
      '/usr/local/my tools/cred',
      'arg',
    ]);
  });

  it('should support quoted arguments', function () {
    expect(splitProcessCommand('tool --name "First Last"')).to.eql([
      'tool',
      '--name',
      'First Last',
    ]);
  });

  it('should keep JSON double-quotes inside single-quoted arg', function () {
    expect(splitProcessCommand('/bin/echo \'{"mode":"AK","access_key_id":"ak"}\'')).to.eql([
      '/bin/echo',
      '{"mode":"AK","access_key_id":"ak"}',
    ]);
  });

  it('should keep backslashes inside single-quoted arg on unix', function () {
    expect(splitProcessCommand('/usr/bin/printf \'\\173\\042mode\\042\\175\'', false)).to.eql([
      '/usr/bin/printf',
      '\\173\\042mode\\042\\175',
    ]);
  });

  it('should support escaped spaces outside quotes on unix', function () {
    expect(splitProcessCommand('tool arg\\ with\\ space', false)).to.eql([
      'tool',
      'arg with space',
    ]);
  });

  it('should support escaped quote inside double quotes on unix', function () {
    expect(splitProcessCommand('tool "say \\"hi\\""', false)).to.eql([
      'tool',
      'say "hi"',
    ]);
  });

  it('should keep unquoted windows path backslashes on windows', function () {
    expect(splitProcessCommand('C:\\tools\\cred.exe get', true)).to.eql([
      'C:\\tools\\cred.exe',
      'get',
    ]);
  });

  it('should support escaped quote inside double quotes on windows', function () {
    expect(splitProcessCommand('tool "say \\"hi\\""', true)).to.eql([
      'tool',
      'say "hi"',
    ]);
  });

  it('should keep backslashes inside double quotes on windows', function () {
    expect(splitProcessCommand('"C:\\Program Files\\tool.exe"', true)).to.eql([
      'C:\\Program Files\\tool.exe',
    ]);
  });

  it('should keep empty double-quoted argument', function () {
    expect(splitProcessCommand('tool "" arg')).to.eql(['tool', '', 'arg']);
  });

  it('should keep empty single-quoted argument', function () {
    expect(splitProcessCommand("tool '' arg")).to.eql(['tool', '', 'arg']);
  });

  it('should merge adjacent quoted segments into one argument', function () {
    expect(splitProcessCommand('tool "a b"\'c d\'')).to.eql(['tool', 'a bc d']);
  });

  it('should treat backslash-newline outside quotes as line continuation on unix', function () {
    expect(splitProcessCommand('tool arg1 \\\n arg2', false)).to.eql(['tool', 'arg1', 'arg2']);
  });

  it('should treat backslash-newline inside double quotes as line continuation on unix', function () {
    expect(splitProcessCommand('tool "a\\\nb"', false)).to.eql(['tool', 'ab']);
  });

  it('should reject empty command', function () {
    expect(() => splitProcessCommand('   ')).to.throwError(/process_command is empty/);
  });

  it('should reject empty quoted argv0', function () {
    expect(() => splitProcessCommand('""')).to.throwError(/process_command is empty/);
  });

  it('should reject unclosed quote', function () {
    expect(() => splitProcessCommand('"C:\\Program Files\\tool.exe')).to.throwError(/unclosed quote/);
  });

  it('should reject trailing backslash on unix', function () {
    expect(() => splitProcessCommand('tool\\', false)).to.throwError(/trailing backslash/);
  });
});
