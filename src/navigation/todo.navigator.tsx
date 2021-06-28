import React from 'react';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/core';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
  MaterialTopTabNavigationProp,
} from '@react-navigation/material-top-tabs';
import { TodoTabNavigationProp } from './home.navigator';
import { AppRoute } from './app-routes';
import {
  TodoDoneScreen,
  TodoTabBar,
  ButtonsControl,
} from '../scenes/todo';
import { DoneAllIcon, GridIcon, mapbox } from '../assets/icons';

type TodoNavigatorParams = {
  [AppRoute.TODO]: undefined;
}

type TodoTabsNavigatorParams = {
  [AppRoute.TODO_BUTTON]: undefined;
  [AppRoute.TODO_DONE]: undefined;
}

export type TodoScreenProps = MaterialTopTabBarProps & {
  navigation: TodoTabNavigationProp;
}

export interface TodoInProgressScreenProps {
  navigation: CompositeNavigationProp<
    TodoTabNavigationProp & StackNavigationProp<TodoNavigatorParams, AppRoute.TODO>,
    MaterialTopTabNavigationProp<TodoTabsNavigatorParams, AppRoute.TODO_BUTTON>>;
  route: RouteProp<TodoTabsNavigatorParams, AppRoute.TODO_BUTTON>;
}

export interface TodoDoneScreenProps {
  navigation: CompositeNavigationProp<
    TodoTabNavigationProp & StackNavigationProp<TodoNavigatorParams, AppRoute.TODO>,
    MaterialTopTabNavigationProp<TodoTabsNavigatorParams, AppRoute.TODO_DONE>>;
  route: RouteProp<TodoTabsNavigatorParams, AppRoute.TODO_DONE>;
}

const Stack = createStackNavigator<TodoNavigatorParams>();
const TopTab = createMaterialTopTabNavigator<TodoTabsNavigatorParams>();

// FIXME: Is it possible to track swipe progress?
//
// In this case, it's needed to synchronize tab-bar indicator in TodoScreen
// Currently I have set `swipeEnabled` to `false` just for saving navigation consistence

const TodoTabsNavigator = (): React.ReactElement => (
  // @ts-ignore: `tabBar` also contains a DrawerNavigationProp & BottomTabNavigationProp
  <TopTab.Navigator tabBar={props => <TodoTabBar {...props} />}>
    <TopTab.Screen
      name={AppRoute.TODO_BUTTON}
      component={ButtonsControl}
      options={{ title: 'EM PROGRESSO', tabBarIcon: GridIcon }}
    />
    <TopTab.Screen
      name={AppRoute.TODO_DONE}
      component={TodoDoneScreen}
      options={{ title: 'MAPA', tabBarIcon: mapbox }}
    />
  </TopTab.Navigator>
);

export const TodoNavigator = (): React.ReactElement => (
  <Stack.Navigator headerMode='none'>
    <Stack.Screen name={AppRoute.TODO} component={TodoTabsNavigator} />
  </Stack.Navigator>
);
