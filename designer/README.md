# Visual Designer for fsm-lib

This is an application for visual creation of Finite State Machines that are compatible with the `fsm-lib`.

> **CAUTION**: This project is still a work in progress and doesn't have a full feature parity with the `fsm::Builder`.

# Table of contents

* [How it works](#how-it-works)
    * [Manifest files](#manifest-files)
* [Roadmap](#roadmap)
* [FAQ](#faq)
    * [How to update manifest of an existing project](#how-to-update-manifest-of-an-existing-project)

# How it works

The whole application is build as a static `.html` page working using the `file:///` protocol. This means that you **don't need** any server to run it, just open the `.html` file in your browser. The application lets you to import any project files so you can continue working on from where you previously left off. To save the file, the application will download the project as a `.json` file on your disc.

> **IMPORTANT**: If you are on a UNIX system and you installed your browser through something like `FlatPak` or `Snap`, the `file:///` protocol is by default sandboxed, so it is unable to load associated `.js`/`.css` files and the application refuses to work. You will need to relax the sandbox in such case - please refer to documentation of your package manager of choice.

## Manifest files

To use the application, you first need to have a manifest file declaring all actions and conditions that are allowed in your machine. You can obtain it as such:

```cpp
auto factory = fsm::Factory<CsvBlackboard>();

#define REGISTER_METHOD(x) #x, x

factory.registerAction(REGISTER_METHOD(doNothing));
factory.registerAction(REGISTER_METHOD(advanceChar));
factory.registerAction(REGISTER_METHOD(handleSeparator));
factory.registerAction(REGISTER_METHOD(handleNewline));
factory.registerAction(REGISTER_METHOD(advanceChar));
factory.registerCondition(REGISTER_METHOD(isEof));
factory.registerCondition(REGISTER_METHOD(isSeparator));
factory.registerCondition(REGISTER_METHOD(isNewline));

#undef REGISTER_METHOD

auto&& exporter = fsm::JsonManifestExporter("manifest.json");
factory.exportManifest(exporter);
```

Then you can load the manifest into the Designer, create your FSM, export the project and load it back into your C++ code:

```cpp
auto&& ifstream = std::ifstream("fsm.json");
auto&& importer = fsm::JsonModelImporter(sstream);
auto&& result = factory.importFsm(importer);
auto&& machine = std::move(result.value());
```

The full example can be found under `/examples/04-importing-fsms`.

# Roadmap

The following features are missing and are planned/considered to be added (non-AI PRs welcome, suggestions also welcome):

* Support for keyboard shortcuts (Ctrl+S, Ctrl+E, Ctrl+Z, Ctrl+Y at minimum)
* Ability to update manifest for an existing project
* Support for sub-machines
* Support for global error condition
* FSM debugger (connecting to a running instance of a FSM or a postmortem log, stepping through the transitions)

## Features not considered

* Localization - without a Javascript framework, this would be way too big pain in the ass

# FAQ

## How to update manifest of an existing project?

If you only want to **add** new actions/conditions to the project, you can manually edit the project file - it is a plaintext JSON with a dedicated `manifest` section. If you rename anything, you would have to grep+replace across the entire project file.
