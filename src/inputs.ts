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

import { getInput } from '@actions/core';

export interface Inputs {
    'include-prerelease': boolean;
    'bazel-version': string;
    'hash-files': string;
    token: string;
}

const truthy = new Set(['true', 'True', 'TRUE', 'yes', 'y', '1']);
const falsy = new Set(['false', 'False', 'FALSE', 'no', 'n', '0']);

export const getBooleanInput = <S extends keyof Inputs>(key: S, defaultValue = false) => {
    const value = getInput(key, { trimWhitespace: true });
    if (truthy.has(value)) return true;
    if (falsy.has(value)) return false;

    return defaultValue;
};

export const getInputs = (): Inputs => ({
    'include-prerelease': getBooleanInput('include-prerelease'),
    'bazel-version': getInput('bazel-version', { trimWhitespace: true }) || 'latest',
    'hash-files': getInput('hash-files', { trimWhitespace: true }) || 'BUILD\nWORKSPACE',
    token: getInput('token', { required: true, trimWhitespace: true })
});
