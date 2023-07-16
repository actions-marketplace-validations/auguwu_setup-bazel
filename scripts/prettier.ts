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

import { getFileInfo, resolveConfig, format, check } from 'prettier';
import { dirname, relative, resolve } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { globby } from 'globby';
import getLogger from './util/logging';
import assert from 'assert';
import run from './util/run';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exts = ['js', 'ts', 'yaml', 'yml', 'json', 'md'] as const;
const isCI = process.env.CI !== undefined;
const log = getLogger('prettier');

run(async () => {
    const action = isCI ? 'Checking' : 'Formatting';
    log.info(`${action} all files!`);

    const config = await resolveConfig(resolve(process.cwd(), '.prettierrc.json'));
    assert(config !== null, ".prettierrc.json doesn't exist?");

    const files = await globby(
        exts.map((f) => `**/*.${f}`),
        {
            throwErrorOnBrokenSymbolicLink: true,
            gitignore: true
        }
    );

    const faultyFiles: string[] = [];
    for (const file of files) {
        const start = Date.now();
        log.await(relative(process.cwd(), file));

        const fileInfo = await getFileInfo(file, {
            withNodeModules: false,
            resolveConfig: true,
            ignorePath: [resolve(__dirname, '../.prettierignore'), resolve(__dirname, '../.gitignore')]
        });

        if (fileInfo.ignored || fileInfo.inferredParser === null) {
            log.info(`${relative(process.cwd(), file)} [skipped - ${Date.now() - start}ms]`);
            continue;
        }

        const contents = await readFile(file, 'utf-8');
        if (isCI) {
            const isFormattedProperly = await check(contents, {
                parser: fileInfo.inferredParser!,
                ...config
            });

            if (!isFormattedProperly) {
                log.error(
                    `${relative(
                        process.cwd(),
                        file
                    )} is not formatted properly: please run \`yarn fmt\` to fix this on non CI machine [${
                        Date.now() - start
                    }ms]`
                );

                faultyFiles.push(file);

                continue;
            }
        } else {
            const src = await format(contents, {
                parser: fileInfo.inferredParser!,
                ...config
            });

            await writeFile(file, src, { encoding: 'utf-8' });
        }

        log.success(`${relative(process.cwd(), file)} [${Date.now() - start}ms]`);
    }

    if (faultyFiles.length) {
        process.exit(1);
    }
});
