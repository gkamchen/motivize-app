import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { motivize, mapping } from './themes';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { AppNavigator } from './navigation/app.navigator';
import { AppRoute } from './navigation/app-routes';

export default (): React.ReactFragment => {

  // This value is used to determine the initial screen
  const isAuthorized: boolean = false;
  
  // useEffect(() => {
  //   const backAction = () => {
      
  //     console.log('app');
  //     return true;

  //   };

  //   const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  //   return () => {
  //     backHandler.remove();
  //   }

  // }, []);

  return (
    <React.Fragment>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider
        mapping={mapping}
        theme={motivize}>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppNavigator initialRouteName={isAuthorized ? AppRoute.HOME : AppRoute.AUTH} />
          </NavigationContainer>
        </SafeAreaProvider>
      </ApplicationProvider>
    </React.Fragment>
  );
};
