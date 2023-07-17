/*
 * 🐻‍❄️🍁 setup-bazel: GitHub action to setup Bazel with action cache support
 * Copyright (c) 2023 Noel Towa <cutie@floofy.dev>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { addPath, debug, endGroup, info, saveState, setFailed, setOutput, startGroup, warning } from '@actions/core';
import { generateBazelPowerShell, generateBazelShell } from './constants';
import { major, minor, patch } from 'semver';
import { dirname, resolve } from 'path';
import { chmod, writeFile } from 'fs/promises';
import { getInputs } from './inputs';
import { hashFiles } from '@actions/glob';
import * as cache from '@actions/cache';
import * as dl from './download';
import * as tc from '@actions/tool-cache';

async function main() {
    // const inputs = getInputs();
    const version = await dl.getBazelVersion();
    let bazelBinary = tc.find('bazel', version);
    if (!bazelBinary) {
        startGroup(`Installing Bazel v${version} from GitHub`);
        bazelBinary = await dl.resolveAndDownload(version);
        info(`Downloaded Bazel binary ~> ${bazelBinary}`);

        endGroup();
    }

    setOutput('binary', bazelBinary);

    info('Creating temporary cache directory and Bazel executable...');
    const cacheDir =
        process.platform === 'win32'
            ? `${process.env.RUNNER_TEMP}\\.bazelcache`
            : `${process.env.RUNNER_TEMP || '/tmp'}/cache/bazel`;

    debug(`cache dir => ${cacheDir}`);
    if (process.platform === 'win32') {
        await writeFile(
            resolve(dirname(bazelBinary), 'bazel'),
            generateBazelPowerShell({
                bazelCommand: bazelBinary,
                cacheDir
            })
        );
    } else {
        await writeFile(
            resolve(dirname(bazelBinary), 'bazel'),
            generateBazelShell({
                bazelCommand: bazelBinary,
                cacheDir
            })
        );

        await chmod(resolve(dirname(bazelBinary), 'bazel'), 0o755);
    }

    // Bazel binary didn't have executable permissions, so we need to do this
    // so the Bash/PowerShell scripts work
    await chmod(resolve(bazelBinary), 0o755);
    addPath(dirname(bazelBinary));
    info(`Bazel v${version} was installed! :tada:`);

    const inputs = getInputs();
    const hash = await hashFiles(inputs['hash-files']);

    debug(`computed hash for inputs [${inputs['hash-files'].split('\n').join(', ')}]: ${hash}`);
    const cachePrimaryKey = `bazel-${process.platform === 'win32' ? 'windows' : process.platform}-${
        process.arch === 'x64' ? 'x86_64' : process.arch
    }-${major(version)}.${minor(version)}.${patch(version)}-${hash}`;

    debug(`computed cache key: ${cachePrimaryKey}`);
    const key = await cache.restoreCache([cacheDir], cachePrimaryKey, [
        `bazel-${process.platform === 'win32' ? 'windows' : process.platform}-${
            process.arch === 'x64' ? 'x86_64' : process.arch
        }-${major(version)}.${minor(version)}.${patch(version)}-`
    ]);

    setOutput('cache-hit', Boolean(key));
    saveState('bazel:cachePrimaryKey', cachePrimaryKey);
}

main().catch((ex) => {
    setFailed(ex);
    process.exit(1);
});
