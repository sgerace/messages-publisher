# Messages Publisher

A tool for publishing Apple Messages as a PDF


## Table of Contents

- [Getting Started](#getting-started)
- [Publishing a New Release](#publishing-a-new-release)
- [References](#references)


## Getting Started

The Messages Publisher is a standard [Electron](https://www.electronjs.org/) application. To develop the Messages Publisher, begin by cloning the repository and then run the following command to install the necessary packages (please note you must have a suitable version of [Node.js](https://nodejs.org/) installed on your system:

```
$ npm install
```

Once installed, you can start Messages Publisher with the following command:

```
$ npm start
```


## Publishing a New Release

Release management is performed using GitHub Releases and Actions and is very straightforward. The following steps describe the process in detail:

1. All releases are performed from the `main` branch. As such, the first step is to ensure that the `main` branch represents the code to deploy. Specifically, ensure that the `package.json` file references the correct version. If you need to update the version specified in the package.json file, you can use the following steps from a terminal in the source directory:

```
$ git checkout main
$ git pull  # To ensure you have the latest changes
$ # Manually edit package.json to reflect the target version
$ npm install  # To update the package-lock.json
$ git commit -a -m "Bump version to vX.Y.Z"  # Where X.Y.Z is the target version
$ git push
```

2. Once the `main` branch contains the code to be released, the next step is to tag the release, which will cause the installers to be built and published to a corresponding GitHub Release. To create a release, log into GitHub, and navigate to the repository's Releases page.
3. From the Releases page, click the **Draft a new release** button.
4. Once the page loads, begin by selecting "main" as the target branch. This will ensure that the correct commit will be tagged when creating the release.
5. Set the tag name (i.e., "Tag version") and "Release title" to the target version when creating a new release in GitHub (e.g., `vX.Y.Z`). Please note that all version release tag names should be prefixed with a lowercase "v" character.
6. The description of the release in GitHub should contain the release notes of the version. Use the **Generate release notes** button to automatically generate appropriate release notes based on the included commit messages.
7. With the release notes complete and entered into the release description, check the "This is a pre-release" button to mark the release as pre-release. This will allow the `electron-builder` package to publish the artifacts of the tagged build directly to the release in GitHub as an asset.
8. Once the release is ready, click the "Publish release" button which will both publish the release notes and create the corresponding tag in the git repository.
9. Once the release tag has been created, the corresponding GitHub Actions will automatically begin publishing the release installers.
10. Monitor the actions workflow to ensure that the release is published properly to the GitHub Release. Once complete, navigate to the release, uncheck the "This is a pre-release" checkbox and click "Update release" to complete the release process.


## References

- [FontForge](https://fontforge.org) was used to create the combined NotoSans-NotoEmoji font, as described in the following post: https://superuser.com/a/491086

```
SELECT a.*
FROM attachment a
LEFT JOIN message_attachment_join maj ON maj.attachment_id = a.ROWID
WHERE maj.message_id IN (
SELECT maj.message_id
FROM attachment a
LEFT JOIN message_attachment_join maj ON maj.attachment_id = a.ROWID
WHERE mime_type == 'image/heic') ORDER BY original_guid
```
