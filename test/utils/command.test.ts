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
    expect(splitProcessCommand('"C:\\Program Files\\tool\\cred.exe" get --profile default')).to.eql([
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

  it('should support escaped spaces outside quotes', function () {
    expect(splitProcessCommand('tool arg\\ with\\ space')).to.eql([
      'tool',
      'arg with space',
    ]);
  });

  it('should support escaped quote inside double quotes', function () {
    expect(splitProcessCommand('tool "say \\"hi\\""')).to.eql([
      'tool',
      'say "hi"',
    ]);
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

  it('should reject trailing backslash', function () {
    expect(() => splitProcessCommand('tool\\')).to.throwError(/trailing backslash/);
  });
});
