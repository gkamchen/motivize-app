import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Layout, LayoutElement, Text } from '@ui-kitten/components';
import { TodoDoneScreenProps } from '../../navigation/todo.navigator';

export const TodoDoneScreen = (props: TodoDoneScreenProps): LayoutElement => (
  <Layout style={styles.container}>
    <Text category='h4'>
      Ainda não foram concluídos.
    </Text>
    <Button style={styles.addButton}>
      ADICIONAR A FAZERES
    </Button>
  </Layout>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    marginVertical: 8,
  },
});
