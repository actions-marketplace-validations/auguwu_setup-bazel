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

import { endGroup, error, startGroup, warning } from '@actions/core';
import { dirname, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { ESLint } from 'eslint';
import getLogger from './util/logging';
import run from './util/run';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isCI = process.env.CI !== undefined;
const log = getLogger('eslint');

const DIRS = ['src/**/*.ts', 'scripts/**/*.ts'] as const;
run(async () => {
    for (const dir of DIRS) {
        isCI ? startGroup(`Linting pattern [${dir}]`) : log.info(`Linting pattern [${dir}]`);
        let needsExitEarly = false;

        {
            const eslint = new ESLint({
                useEslintrc: true,
                fix: !isCI
            });

            const results = await eslint.lintFiles([dir]);

            for (const result of results) {
                const relativePath = relative(resolve(__dirname, '..'), result.filePath);
                const hasWarnings = result.warningCount > 0;
                const hasErrors = result.errorCount > 0;

                log[hasErrors ? 'error' : hasWarnings ? 'warn' : 'success'](relativePath);
                if (hasErrors) {
                    needsExitEarly = true;
                }

                for (const message of result.messages) {
                    if (isCI) {
                        const method = message.severity === 1 ? warning : error;
                        method(`[${message.ruleId}] ${message.message}`, {
                            endColumn: message.endColumn,
                            endLine: message.endLine,
                            file: result.filePath,
                            startLine: message.line,
                            startColumn: message.column
                        });
                    } else {
                        const method = message.severity === 1 ? log.warn : log.error;
                        method(`${message.message} [${message.ruleId}]`);
                    }
                }

                // Break early
                if (hasErrors) break;
            }
        }

        isCI && endGroup();
        if (needsExitEarly) process.exit(1);
    }
});
