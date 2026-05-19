# Troubleshooting

This guide is for project users fixing common `claude-remote-config` setup and sync problems.

## Missing manifest

If commands say the project is not configured, create `.claude-remote-config.yml`:

```bash
claude-remote-config setup --remote <repo> --ref <ref> --profile <profile>
```

## Remote clone or fetch failure

Check that the remote URL is correct and your shell can access it:

```bash
git ls-remote <repo>
```

If the remote was previously cached in a bad state, run `init` again. The cache sync will retry with a fresh clone when needed.

## Offline mode without a cache

`--offline` requires the remote repository to already exist in the plugin data cache. Run once without `--offline`, then use offline mode later.

## Missing profile

The selected `profile` must be listed in the remote `claude-remote-manifest.yml` and must have a matching `profiles/<profile>.yml` file.

## Missing parameter

If generated memory or rules use `{{ parameter_name }}`, the consuming project must define that value in `.claude-remote-config.yml` unless the rule parameter has a default.

```yaml
params:
  package_manager: pnpm
```

## Rule conflict

If two selected rules conflict, remove one using `exclude.rules` or adjust the remote profile and tags.

```yaml
exclude:
  rules:
    - testing.playwright
```

## Required rule fails `requires`

A required rule is always selected first, but it must still pass its `requires` checks. Add the required file or dependency, or remove the rule from the remote profile's required list.

## Frozen lockfile mismatch

`--frozen-lockfile` fails when the generated lockfile would differ from the committed one. Run without `--frozen-lockfile`, inspect the lockfile change, and commit it if the new remote commit or selected output is intended.

## Generated files are not updating

Check the manifest `ref`, run without `--offline`, and confirm the selected profile and tags:

```bash
claude-remote-config explain
claude-remote-config init
```
