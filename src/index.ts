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

import { addPath, endGroup, info, setFailed, setOutput, startGroup } from '@actions/core';
import * as dl from './download';
import * as tc from '@actions/tool-cache';

async function main() {
    const version = await dl.getBazelVersion();
    let bazelBinary = tc.find('bazel', version);
    if (!bazelBinary) {
        startGroup(`Installing Bazel v${version} from GitHub`);
        bazelBinary = await dl.resolveAndDownload(version);
        info(`Downloaded Bazel binary ~> ${bazelBinary}`);

        endGroup();
    }

    setOutput('binary', bazelBinary);
    //addPath(bazelBinary);
}

main().catch((ex) => {
    setFailed(ex);
    process.exit(1);
});
