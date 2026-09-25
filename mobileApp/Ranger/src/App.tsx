import React from 'react';
import { StatusBar } from 'react-native';
import { RangerNavigator } from './navigation/RangerNavigator';

export const App: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <RangerNavigator />
    </>
  );
};

export default App;
