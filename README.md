## 🚀 React Native Init 
### Template with Pre-configured Tools

This template provides a production-ready React Native project with essential development tools already configured.

### ✨ What's Included

- **React Native 0.78.2** with TypeScript support
- **Testing Framework**: Jest for unit tests + Detox for E2E testing
- **Navigation**: React Navigation pre-configured
- **Environment Management**: Cross-env for different environments
- **Code Quality**: ESLint with import sorting rules
- **Module Aliases**: Clean imports with path mapping

### 🛠️ Quick Start

1. **Create project using this template:**
   ```bash
   npx @react-native-community/cli init MyApp --template https://github.com/harsh25jai/react-native-init   
   ```

2. **Start development:**
   ```bash
   # Start Metro bundler
   npm start
   
   # Run on Android
   npm run android
   
   # Run on iOS  
   npm run ios
   ```

### 🧪 Testing Commands

- `npm test` - Run unit tests
- `npm run e2e-test:build-ios-debug` - Build iOS E2E tests
- `npm run e2e-test:test-ios-debug` - Run iOS E2E tests

### 🌍 Environment Support

The template includes environment-specific scripts for development and testing: 

- Development: Uses `.env` (default)
- Testing: Uses `.env.test` with cross-env

### 📱 Platform Support

Both Android and iOS are fully configured with:
- Environment variable integration via react-native-config
- Detox E2E testing setup

## Notes

This template eliminates the need for manual setup of testing frameworks, environment management, and development tooling. The folder structure follows React Native best practices with clear separation of components, screens, and utilities. All major development workflows are pre-configured with npm scripts for immediate productivity.

Wiki pages you might want to explore:
- [Overview (harsh25jai/react-native-init)](https://deepwiki.com/harsh25jai/react-native-init/1-overview)
