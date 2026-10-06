// Points git at the committed hooks in .githooks (D-023). Runs on `npm install`; outside a git checkout it does nothing.
import { execFileSync } from 'node:child_process';

try {
  execFileSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
} catch {
  // No git or not a repository (e.g. an unpacked tarball): nothing to install.
}
