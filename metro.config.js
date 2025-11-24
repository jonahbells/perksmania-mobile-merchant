const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure resolver to support @ alias
config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
};

module.exports = config;