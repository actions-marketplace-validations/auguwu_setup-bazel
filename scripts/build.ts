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

import { mkdir, writeFile } from 'fs/promises';
import { JS_BANNER } from './util/constants';
import { resolve } from 'path';
import { rimraf } from 'rimraf';
import getLogger from './util/logging';
import run from './util/run';
import ncc from '@vercel/ncc';

const BANNER = `/* eslint-ignore */\n//prettier-ignore\n${JS_BANNER}\n` as const;
const log = getLogger('build');

run(async () => {
    await rimraf(resolve(process.cwd(), 'build'));
    await mkdir(resolve(process.cwd(), 'build'));

    log.await('Building build/action.js');
    const actionResult = await ncc(resolve(process.cwd(), 'src/index.ts'), {
        cache: false,
        minify: true,
        license: 'LICENSE'
    });

    const took = actionResult.stats.compilation.endTime - actionResult.stats.compilation.startTime;
    log.success(`Built build/action.js [${took}ms]`);

    await writeFile(resolve(process.cwd(), 'build/action.js'), BANNER + actionResult.code);
    for (const [file, { source }] of Object.entries(actionResult.assets)) {
        await writeFile(resolve(process.cwd(), 'build', file), source);
    }

    log.await('Building build/save_action.js');
    const saveResult = await ncc(resolve(process.cwd(), 'src/save.ts'), {
        cache: false,
        minify: true
    });

    const saveTook = actionResult.stats.compilation.endTime - actionResult.stats.compilation.startTime;
    log.success(`Built build/save_action.js [${saveTook}ms]`);

    await writeFile(resolve(process.cwd(), 'build/save_action.js'), BANNER + saveResult.code);
    for (const [file, { source }] of Object.entries(saveResult.assets)) {
        await writeFile(resolve(process.cwd(), 'build', file), source);
    }
});
