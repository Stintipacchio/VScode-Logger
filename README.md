# vscode-logger README

This extension helps you store your code metrics through a continuose activity monitoring such: lines, comments and tests added, modified or deleted. At the same time it also keeps track of the session time and files explorated.

## How to use

After the installation in the Explorer Tab will appear a teardown window named "VS-LOGGER", from there you can login by inserting your credentials and server addres in the form.

## Features

Credentials persistence trough differents sessions, local DB storing alla offline data while it waits for server connection. The exstension autostart with vscode.


## Requirements

To work properly this extension need a internet connection.


## Extension Settings

The exstension will generate a configuration file and a log file in home folder.


## Known Issues

Enlarging the explorer tab could lead to glitch of the Charts.
Inserting a non existent server will lead to a blank page to fix close and re open the extension tear menu.

## Release Notes

v0.0.1
Release in testing all the feature should work properly.


## How to install without VS Code Marketplace

1) Open VS Code.

2) Open the “Extensions” sidebar (you can use “Ctrl+Shift+X”).

3) Click on the ellipsis icon in the top right corner of the menu.

4) Select “Install from VSIX…”

5) VS Code will open a document browser. Locate the .VSIX file you transferred and select it.

6) VS Code will now begin the installation process of the extension.

7) After the extension has been installed, you’ll be able to see it in the “Extensions “menu and manage it accordingly.

## Credits

This extension is a porting of the atom package "atom-logger" (https://github.com/elPeroN/atom-logger.git)


