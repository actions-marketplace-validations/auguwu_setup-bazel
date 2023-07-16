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

import { resetProcessEnv, setInput } from './utils/test-utils';
import { test, expect, beforeEach } from 'vitest';
import { getInputs } from '../src/inputs';

beforeEach(() => {
    resetProcessEnv();
});

test('resolve inputs', () => {
    expect(() => getInputs()).toThrowErrorMatchingInlineSnapshot('"Input required and not supplied: token"');

    setInput('token', 'arandomtoken');
    const testInputs = () => {
        const inputs = getInputs();
        return {
            ...inputs,
            'hash-files': inputs['hash-files'].replaceAll('\n', ';')
        };
    };

    expect(testInputs()).toMatchInlineSnapshot(`
      {
        "bazel-version": "latest",
        "hash-files": "BUILD;WORKSPACE",
        "include-prerelease": false,
        "token": "arandomtoken",
      }
    `);
});
