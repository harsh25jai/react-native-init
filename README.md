
This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

## Includes

- [React](https://github.com/facebook/react) & [React Native](https://github.com/facebook/react-native)
- [Detox](https://wix.github.io/Detox/docs/introduction/getting-started)
- [Cross-Env](https://www.npmjs.com/package/cross-env)
- [Jest](https://jestjs.io/docs/tutorial-react-native)
- [aliasName](https://reactnative.dev/docs/typescript#using-custom-path-aliases-with-typescript)


# Getting Started
>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.


## Prerequisites
- [Node.js > 12](https://nodejs.org) and npm (Recommended: Use [nvm](https://github.com/nvm-sh/nvm))
- [Watchman](https://facebook.github.io/watchman)
- [Xcode 12](https://developer.apple.com/xcode)
- [Cocoapods 1.10.1](https://cocoapods.org)
- [JDK > 11](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html)
- [Android Studio and Android SDK](https://developer.android.com/studio)


## Folder structure
This template follows a very simple project structure:
- `src`: This folder is the main container of all the code inside your application.
  - `assets`: Asset folder to store all fonts, images, vectors, etc. 
    Filename strategy PascalCase for example NewImage.png, NewFont.ttf
  - `components`: Folder to store any common component that you use through your app (such as a generic button)
    Filename strategy FolderName PascalCase for example AppButton/index.tsx, create sepearte style file only when component is exceeding over 500 lines of code.
  - `utils`: Folder to store any kind of constant that you have and extra utility services.
  - `navigation`: Folder to store the navigators.
  - `screens`: Folder that contains all your application screens/features.
    - `Screen`: Each screen should be stored inside its folder and inside it a file for its code and a separate one for the styles and tests.
      - `Screen.tsx`
      - `Screen.styles.tsx`
      - `Screen.test.js`
  - `socket`: Folder to store the socket connection files.
  - `store`: Folder to put all redux middlewares and the store.
  - `test-utils`: Folder to store tests-related utilities and components.
  - `App.js`: Main component that starts your whole app.
  - `index.js`: Entry point of your application as per React-Native standards.
  - `package.json`:  Metadata file in a Node.js project that contains information about the project.

  

## Step 1: Start the Metro Server
First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

  

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm  start

# OR using Yarn
yarn  start
```


## Step 2: Start your Application
Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android
```bash
# using npm
npm  run  android

# OR using Yarn
yarn  android
```


### For iOS
```bash
# using npm
npm  run  ios

# OR using Yarn
yarn  ios
```
If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

  
## Step 3: Modifying your App
Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.

2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

  
For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

  

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

  

### Now what?
- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).

- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).


# Troubleshooting
If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.


# Learn More
To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.

- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.

- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.

- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.

- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.