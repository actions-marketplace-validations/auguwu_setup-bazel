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

import { debug, info } from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { getInputs } from './inputs';
import { rcompare } from 'semver';
import * as tc from '@actions/tool-cache';
import { Lazy } from '@noelware/utils';

const inputs = new Lazy(getInputs);

// exported only for tests
export const normalizeVersionInput = (version: string) => {
    const parts = version.split('.');
    const originating = parts.shift();

    if (parts.length === 1) return `${originating}.0.0`;
    if (parts.length === 2)
        return `${originating}.${parts[0]}${`.${parts.at(1) === 'x' ? '0' : parts.at(1)!}` || '.0'}`;

    return version;
};

const requestReleasesPage = async (pageCursor = 1) => {
    debug('Resolving versions from repository bazelbuild/bazel');

    const token = inputs.get();
    const httpClient = new HttpClient('auguwu/setup-bazel', [], {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const releases = await httpClient
        .getJson<any[]>(`https://api.github.com/repos/bazelbuild/bazel/releases?page=${pageCursor}&per_page=100`)
        .then((r) => r.result ?? []);

    return releases
        .filter((tag) => tag.tag_name.match(/v\d+\.[\w\.]+/g))
        .filter((tag) => (inputs['include-prerelease'] ? true : tag.prerelease === false))
        .map((tag) => tag.tag_name)
        .sort((a, b) => rcompare(normalizeVersionInput(a), normalizeVersionInput(b)));
};

export const getBazelVersion = async (): Promise<string> => {
    if (inputs['bazel-version'] === 'latest') {
        const firstPage = await requestReleasesPage();
        return firstPage.at(0)!;
    }

    let cursor = 0;
    let versionToUse: string | undefined;
    let pages: string[];

    while ((pages = await requestReleasesPage(cursor++)).length > 0) {
        const version = pages.find((tag) => tag === normalizeVersionInput(inputs['bazel-version']));
        if (version !== undefined) {
            versionToUse = version;
            break;
        }
    }

    if (!versionToUse) {
        throw new Error(`Unable to resolve version "${inputs['bazel-version']}"`);
    }

    return versionToUse;
};

export const resolveAndDownload = async (version: string) => {
    let os: string | undefined;
    let arch: string | undefined;

    switch (process.platform) {
        case 'linux':
            os = 'linux';
            break;

        case 'darwin':
            os = 'darwin';
            break;

        case 'win32':
            os = 'windows';
            break;

        default:
            throw new Error(`Operating system [${process.platform}] is not supported by Bazel`);
    }

    switch (process.arch) {
        case 'x64':
            arch = 'x86_64';
            break;

        case 'arm64':
            arch = 'arm64';
            break;

        default:
            throw new Error(`CPU Architecture [${process.arch}] is not supported by Bazel`);
    }

    const downloadUrl = `https://github.com/bazelbuild/bazel/releases/download/${version}/bazel-${version}-${os}-${arch}${
        os === 'windows' ? '.exe' : ''
    }`;

    info(`Installing Bazel v${version}!`);
    const binary = await tc.downloadTool(downloadUrl);
    return tc.cacheFile(binary, `bazel-${version}-${os}-${arch}`, 'bazel', version);
};
