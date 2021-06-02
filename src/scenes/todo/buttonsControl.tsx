import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Layout,
  Text,
  Button,
  Icon,
  Spinner,
} from '@ui-kitten/components';

const StarIcon = (props) => (
  <Icon {...props} name='star' />
);

const LoadingIndicator = (props) => (
  <View style={[props.style, styles.indicator]}>
    <Spinner size='small' />
  </View>
);


export const ButtonsControl = () => {

  const [counter, setCounter] = React.useState(0);

  return (
    <Layout style={styles.container} level='3'>

      <Button style={styles.button} status='primary' accessoryLeft={StarIcon}>
        INICIAR INTERVALO
    </Button>

      <Button style={styles.button} status='primary' accessoryLeft={StarIcon}>
        INICIAR ATENDIMENTO
    </Button>

      <Button style={styles.button} status='primary' accessoryLeft={StarIcon}>
        INICIAR DIA
    </Button>

    </Layout>
  );
};


const styles = StyleSheet.create({
  container: {
    display: 'flex',
    marginTop: '50%',
    flexDirection: 'column',
    justifyContent: 'center',

  },
  button: {
    margin: 10,
    height: 70,
  },
  indicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },

});



