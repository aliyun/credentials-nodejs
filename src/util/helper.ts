import * as os from 'os';
import kitx from 'kitx';
import path from 'path';

const pkg = kitx.loadJSONSync(path.join(__dirname, '../../package.json'));

export const DEFAULT_UA = `AlibabaCloud (${os.platform()}; ${os.arch()}) ` +
    `Node.js/${process.version} Core/${pkg.version}`;

export const DEFAULT_CLIENT = `Node.js(${process.version}), ${pkg.name}: ${pkg.version}`;
