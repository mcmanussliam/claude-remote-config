# Changelog

## [1.0.0] - 2026-05-20

### Features

- **release**: add release workflow, version-bump and changelog scripts
- **commands**: add slash commands for sync, explain, doctor, and print
- **Plugin**: Add `marketplace.json` to repository
- **Plugin**: Remove `packageAny` from requirements
- **Plugin**: Rework project to be simpler and cleaner

### Bug Fixes

- **release**: use annotated tag and push explicitly instead of --follow-tags
- **release**: force-add dist/ to release commit, keep it gitignored otherwise
- **changelog**: fix biome template literal and formatting violations
- **plugin**: Run lint and formatting fixing on the plugin
- **tests**: Fix left over `packageJson` field in tests
- **docs**: Fix plugin name in `README.md`
- **Plugin**: Remove leftover `profile.md` docs
- **Plugin**: Remove `.claude-remote-config.lock.yml` from output to ensure no code changes
- **Plugin**: Make plugin pull all rules by default
- **Plugin**: Fix command for plugin hook
- **Plugin**: Remove profiles and `CLAUDE.md` from init

### Performance

- **tree**: parallelise walkDirectory, discoverSkills, and collectSkillFiles with Promise.all
- **init**: replace sequential access loop with Promise.any in hasGeneratedOutput
- **doctor**: include hasGeneratedSkills in the existing Promise.all
- **assets**: parallelise clean, write, and skill rm operations with Promise.all

### Refactors

- **paths**: remove unused REMOTE_FILES.claudeDir constant
- **rules**: strip to collectProjectFacts, remove dead rule selection system
- remove dead compiler, settings, and ruleGeneratedComment
- replace split try-catch variable declarations with .catch() chaining
- **init**: early return on dryRun, simplify gitignore guard
- **paths**: add commandsDir and skillsDir constants, replace hardcoded strings
- **types**: tighten gitignore option to boolean instead of boolean | undefined
- **assets**: extract RemoteSkillFile as named interface
- **rules**: remove unused legacy loadRules loader

### Documentation

- **readme**: add header gif, enrich tagline, tighten copy
- **Plugin**: Remove irrelevant and overly verbose documentation
- Set-up

### Chores

- **release**: v1.0.0
- add MIT license
- remove prepare script silenced by ignore-scripts
- **pkg**: add license, keywords, repository, homepage, and prepare script
