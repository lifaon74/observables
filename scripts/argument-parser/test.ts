import { ArgumentParser } from './implementation';
import { CommandArgument } from './command/argument/implementation';
import { Command } from './command/implementation';


export function testArgumentParser() {
  const parser = new ArgumentParser({ programName: 'build.js', version: '1.0.0' });

  parser.add(new Command({
    aliases: ['command', '-c', '--command'],
    description: 'Test command',
    args: [
      new CommandArgument({
        aliases: ['--key0', '-k0'],
        type: 'string',
        description: 'Key0',
        required: true,
      }),
      new CommandArgument({
        aliases: ['--key1', '-k1'],
        type: 'number',
        description: 'Key1',
        required: false,
        defaultValue: 14,
      }),
    ],
  }));

  // console.log(parser.help());
  // console.log(parser.help('version'));

  let args: string[];

  // args = ['command', 'value0', '123']; // inline notation
  // args = ['command', '--key0', 'value0', '--key1', '123']; // standard notation
  // args = ['command', '--key0="value0"', '--key1=123']; // equal notation
  // args = ['command', '-k0="value0"', '123']; // mix

  // args = ['command', 'value0'];

  /* ERROR */
  // args = []; // missing command's name
  // args = ['bad-command']; // invalid command's name
  // args = ['command', '--key2', 'value0']; // invalid command's argument name
  // args = ['command', '--key1', 'value0']; // missing required '--key0'
  // args = ['command', '--key0', 'value0', '--key1']; // missing value for '--key1'
  // args = ['command', 'value0', '123', '456']; // too much arguments
  // args = ['command', '--key0', 'value0', '--key0', 'value3']; // '--key0' already used

  args = ['help', 'version']; // inline arg
  // args = ['help', '-c', 'version']; // named arg
  // args = ['help', '-c=version']; // named arg with assignment
  // args = ['help', '-c="version"']; // named arg with assignment

  // args = process.argv.slice(2);
  // console.log(process.argv.slice(2));

  console.log(parser.parseArgs(args).toJSON());
}
