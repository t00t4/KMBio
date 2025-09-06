module.exports = {
  presets: [
    ['@react-native/babel-preset', { 
      unstable_transformProfile: 'hermes-stable' 
    }]
  ],
  plugins: [],
  env: {
    test: {
      presets: [
        ['@react-native/babel-preset', { 
          unstable_transformProfile: 'default' 
        }]
      ]
    }
  }
};