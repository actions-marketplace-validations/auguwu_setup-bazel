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

import { error, startGroup, warning } from '@actions/core';
import { execa } from 'execa';
import getLogger from './util/logging';
import { noop } from '@noelware/utils';
import run from './util/run';
import { relative } from 'path';

const isCI = process.env.CI !== undefined;
const log = getLogger('test');

run(async () => {
    // Only do this with CI, normal runs should only use `yarn vitest run!`
    if (!isCI) {
        return execa('yarn', ['vitest', 'run'], {
            stdio: ['ignore', 'inherit', 'inherit']
        })
            .then(noop)
            .catch(noop);
    }

    log.await('Starting test runner...');
    const result = await execa('yarn', ['vitest', 'run', '--reporter=json'])
        .then((res) => JSON.parse(res.stdout.trim()))
        .catch((ex) => JSON.parse(ex.stdout.trim()));

    log[result.success ? 'success' : 'error'](
        `Took ${Date.now() - result.startTime}ms to complete with ${result.numTotalTestSuites} test suites, ${
            result.numFailedTestSuites
        } failed suites, and ${result.numPassedTestSuites} passed suites (${result.numTotalTestSuites} total tests, ${
            result.numPassedTests
        } passed tests, ${result.numFailedTests} failed tests)`
    );

    for (const testResults of result.testResults) {
        log[testResults.status === 'failed' ? 'error' : 'success'](relative(process.cwd(), testResults.name));
        for (const assertionResult of testResults.assertionResults) {
            if (assertionResult.status === 'passed') {
                log.success(`    ${assertionResult.fullName.trim()} [${assertionResult.duration}ms]`);
                continue;
            }

            error(`${assertionResult.fullName.trim()} in ${relative(process.cwd(), testResults.name)}`, {
                file: testResults.name,
                startLine: assertionResult.location.line,
                startColumn: assertionResult.location.column
            });
        }
    }
});
