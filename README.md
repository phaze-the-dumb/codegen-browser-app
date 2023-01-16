# Codegen Browser

## How to install

- Open the latest release and download the `.exe` file
- Run the installer, the window will open and then restart, you can then use it

## How to use
 
The app follows 2 main themes:
- Menus on the sidebar
- Logs / Control Buttons on the top

The menus on the side:
- Settings
- Help
- Add Version
- Browser

While you are adding a new version there will be a new menu called "Version Installer" below the "Add Version" menu

## How to add a new version

[Old Version of Documentation](https://docs.phazed.xyz/codegenbrowser/)

**Installing a new version REQUIRES dotnet**

1) Click the "Add Version" menu on the sidebar
2) There are multiple ways to get the beatsaber apk although we suggest using ComputerElite's OculusDB and the link is provided in-app
3) Enter the version number in the text input it should follow the format `X.X.X` if not a warning will show but it shouldn't stop you from adding that as a version
4) Click the blue file input button and find the file in your files to select it
5) Click the next button on the side of the page
6) Wait for the file to finish computing **Note: The application may freeze multiple times while installing the new version**
7) If you encounter any errors (text in red) or any warnings (text in orange) and the warnings stop it from running you may need to refer to the "Debugging Documentation" section
8) Enjoy browsing codegen

## Debugging Documentation

Depending on what the error is there could be multiple issues / fixes, if your issue isn't described here please create a new issue on this github repo (you can also find the issues page by clicking the "report bug" button in the settings page) refer to the "Creating Issues" section when writing an issue

`You must install or update dotnet to run this application`

Download the latest version of dotnet from [here](https://dotnet.microsoft.com/)

Notes:
- I will add issues and their fixes here as they come up
- Warnings that *don't* stop codegen from running are not an issue, they happen

## Creating Issues

If you have any issues and you can't find any fixes for them feel free to create a github issue on this repo, although please make sure you describe the exact issue you are having and attach any logs, this includes application logs and electron logs

Application logs can be accessed by clicking the status bar in the top left

Electron logs can be accessed by pressing `ctrl` + `shift` + `i` and chromes devtools should open, click the console tab at the top to access the logs.
