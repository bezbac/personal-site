# Local setup

1. Install [proto](https://moonrepo.dev/proto)
2. Run `proto use` to install the correct versions of the required tools
3. (optional) Run `moon sync hooks` to enable pre-commit hooks

# Deploying

## Cloudflare pages configuration

<!-- The cli version should match that in .prototools -->

Build command: `pnpm --package=@moonrepo/cli@1.41.5 dlx moon run build`  
Build output directory: `dist`
