# 🐻‍❄️🍁 Setup [Bazel](https://bazel.build) GitHub Action

> _GitHub action to setup [Bazel](https://bazel.build) with [actions/cache](https://github.com/actions/cache) support_

**setup-bazel** is a simple GitHub action to setup any version of [Bazel](https://bazel.build) from a `.bazel-version` file in the root directory of your project, or specified via the [`bazel-version`](#bazel-version) action input.

This action was made to make it easy to do CI builds for multiple Bazel versions, useful for doing CI for Bazel rules.

## Setup

```yml
name: Bazel CI
on:
    push: {}
jobs:
    bazel:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout repository
              uses: actions/checkout@v3

            - name: Setup Bazel!
              uses: auguwu/setup-bazel@v1.0.0
              with:
                  token: ${{github.token}} # token is required to grab bazel releases
                  bazel-version: latest # semver is supported (>=6.2), "6.x" is supported, "6.2.x" is supported

            - name: Run tests
              run: bazel test //...
```

## Inputs

### token

GitHub token to use for grabbing [Bazel releases](https://github.com/bazelbuild/bazel) without hitting with ratelimits.

-   Required: True
-   Type: String

### bazel-version

Version of Bazel to pull. This input supports using SemVer tags (>=6.2), or using `.x` as placeholders to use a major or major.minor version with the patch being detected automatically.

-   Required: False
-   Default: "latest"
-   Type: SemVer | String

## Outputs

### binary

The absolute location to the downloaded Bazel binary by this action.

-   Type: Path

### cache-hit

Whether if the Bazel cache was hit by `actions/cache` or not.

-   Type: Boolean

## License

**setup-bazel** is released under the [**MIT** License](https://github.com/auguwu/setup-bazel/blob/master/LICENSE) with love by [Noel](https://floofy.dev)! :polar_bear::purple_heart:
