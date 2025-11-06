# Publishing wtlink to npm

## Prerequisites

### 1. npm Account
- Create account at https://www.npmjs.com/signup if you don't have one
- Verify your email address

### 2. Authentication
```bash
npm login
# Follow prompts to enter:
# - Username
# - Password
# - Email
# - One-time password (if 2FA enabled)
```

Verify authentication:
```bash
npm whoami
# Should output your npm username
```

### 3. Package Name Availability
Check if `wtlink` is available:
```bash
npm view wtlink
# Should return 404 if available
```

If taken, you'll need to:
- Use a scoped package name: `@yourusername/wtlink`
- Choose a different name
- Update package.json `name` field

## Publishing Steps

### Manual Publish (Recommended for first release)

1. **Ensure you're on main branch with latest code:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Verify package contents:**
   ```bash
   npm pack --dry-run
   # Review the 10 files that will be included
   ```

3. **Run tests and build:**
   ```bash
   npm install
   npm test
   npm run build
   ```

4. **Publish to npm:**
   ```bash
   npm publish
   ```

   For scoped packages (if needed):
   ```bash
   npm publish --access public
   ```

5. **Verify publication:**
   ```bash
   npm view wtlink
   # Should show your package details
   ```

6. **Test installation:**
   ```bash
   npm install -g wtlink@2.0.0
   wtlink --version
   # Should show: 2.0.0
   ```

### Automated Publish (After first release)

The repository includes GitHub Actions workflow (`.github/workflows/publish.yml`) that auto-publishes on releases.

#### Setup:

1. **Create NPM_TOKEN secret in GitHub:**
   - Go to https://www.npmjs.com/settings/[yourusername]/tokens
   - Click "Generate New Token" → "Automation"
   - Copy the token
   - Go to https://github.com/chrissena/wtlink/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: [paste token]

2. **Create a GitHub Release:**
   ```bash
   # Tag the release
   git tag -a v2.0.0 -m "Release v2.0.0"
   git push origin v2.0.0

   # Or use GitHub CLI
   gh release create v2.0.0 \
     --title "v2.0.0 - Initial Public Release" \
     --notes "See CHANGELOG.md for full details"
   ```

3. **Workflow will automatically:**
   - Run tests
   - Build the package
   - Publish to npm
   - Update release with package info

## Version Bumping

For future releases, follow semantic versioning:

```bash
# Patch release (bug fixes): 2.0.0 → 2.0.1
npm version patch

# Minor release (new features): 2.0.0 → 2.1.0
npm version minor

# Major release (breaking changes): 2.0.0 → 3.0.0
npm version major
```

Then push the tag:
```bash
git push origin main --follow-tags
```

## Troubleshooting

### Package name already taken
- Check: `npm view wtlink`
- Solutions:
  - Use scoped name: `@chrissena/wtlink`
  - Contact current owner to transfer
  - Choose different name

### Authentication fails
```bash
# Clear npm cache and retry
npm cache clean --force
npm login
```

### Publish fails with 402 Payment Required
- Your npm account may need verification
- Check https://www.npmjs.com/settings/[username]/billing

### 2FA issues
- Ensure you have 2FA set up correctly
- Use `npm login` instead of manually editing .npmrc

## Post-Publish Checklist

- [ ] Verify package page: https://www.npmjs.com/package/wtlink
- [ ] Test global installation: `npm install -g wtlink`
- [ ] Update README with installation instructions
- [ ] Announce release (Twitter, blog, etc.)
- [ ] Monitor https://github.com/chrissena/wtlink/issues for feedback

## Package Details

**Current version**: 2.0.0
**Package name**: wtlink
**Package size**: 35.1 kB compressed, 144.4 kB unpacked
**Files included**: 10 (source, docs, license)
**Node requirement**: >=16.0.0
**npm requirement**: >=7.0.0

## Resources

- npm documentation: https://docs.npmjs.com/
- Semantic versioning: https://semver.org/
- GitHub Actions publishing guide: https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages
