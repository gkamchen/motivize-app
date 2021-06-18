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

const INI_DIA = 'INICIAR DIA'; 
const FIM_DIA = 'FINALIZAR DIA';

const INI_INTERVALO = 'INICIAR INTERVALO';
const FIM_INTERVALO = 'FINALIZAR INTERVALO';

const INI_ATENDIMENTO = 'INICIAR ATENDIMENTO';
const FIM_ATENDIMENTO = 'FINALIZAR ATENDIMENTO';

const INI_STATUS='primary';
const FIM_STATUS='danger';

const APAR_INI = 'filled';
const APAR_FIM = 'outline';

const DISABLE_BOTTON=true;
const ENABLE_BOTTON=false;

var ATIVAR_BDIA = ENABLE_BOTTON;
var ATIVAR_BATENDIMENTO = DISABLE_BOTTON;
var ATIVAR_BINTERVALO = DISABLE_BOTTON;

var INTERVALO = INI_INTERVALO;
var INTERVALO_STATUS = INI_STATUS;
var INTERVALO_APAR= APAR_INI;

var DIA = INI_DIA;
var DIA_STATUS = INI_STATUS;
var DIA_APAR = APAR_INI;

var ATENDIMENTO = INI_ATENDIMENTO;
var ATENDIMENTO_STATUS = INI_STATUS;
var ATENDIMENTO_APAR= APAR_INI;

export const ButtonsControl = () => {

  const [bDia, setDia] = React.useState(INI_DIA);
  const [bAtendimento, setAtendimento] = React.useState(INI_ATENDIMENTO);
  const [bIntervalor, setIntervalo] = React.useState(INI_INTERVALO);

  const onIntervalo = () => {

    console.log("\n-----------> LOG BOTÃO INTERVALO <-------------");

    console.log("1:" + INTERVALO);

    if (INTERVALO === INI_INTERVALO){

      INTERVALO = FIM_INTERVALO;
      INTERVALO_STATUS = FIM_STATUS;
      INTERVALO_APAR = APAR_FIM;

      const hoje = new Date();

      console.log("\n--------> " + hoje);

      ATIVAR_BDIA = DISABLE_BOTTON;
      ATIVAR_BATENDIMENTO = DISABLE_BOTTON;
      ATIVAR_BINTERVALO = ENABLE_BOTTON;

    }else{

      ATIVAR_BDIA = ENABLE_BOTTON;
      ATIVAR_BATENDIMENTO = ENABLE_BOTTON;
      ATIVAR_BINTERVALO = ENABLE_BOTTON;

      INTERVALO = INI_INTERVALO;  
      INTERVALO_STATUS = INI_STATUS;
      INTERVALO_APAR = APAR_INI;

    }
    
    setIntervalo(INTERVALO);
    
  };

  const onDia = () => {

    console.log("\n-----------> LOG BOTÃO DIA <-------------");

    console.log("1:" + DIA);

    if (DIA === INI_DIA){

      DIA = FIM_DIA;
      DIA_STATUS = FIM_STATUS;
      DIA_APAR = APAR_FIM;

      ATIVAR_BDIA = ENABLE_BOTTON;
      ATIVAR_BATENDIMENTO = ENABLE_BOTTON;
      ATIVAR_BINTERVALO = ENABLE_BOTTON;

    }else{

      ATIVAR_BDIA = ENABLE_BOTTON;
      ATIVAR_BATENDIMENTO = DISABLE_BOTTON;
      ATIVAR_BINTERVALO = DISABLE_BOTTON;

      DIA = INI_DIA;  
      DIA_STATUS = INI_STATUS;
      DIA_APAR = APAR_INI;

    }
    setDia(DIA);
    
  };

  const onAtendimento = () => {

    console.log("\n-----------> LOG BOTÃO ATENDIMENTO <-------------");

    console.log("1:" + ATENDIMENTO);

    if (ATENDIMENTO === INI_ATENDIMENTO){

      ATENDIMENTO = FIM_ATENDIMENTO;
      ATENDIMENTO_STATUS = FIM_STATUS;
      ATENDIMENTO_APAR = APAR_FIM;

      ATIVAR_BDIA = DISABLE_BOTTON;
      ATIVAR_BATENDIMENTO = ENABLE_BOTTON;
      ATIVAR_BINTERVALO = DISABLE_BOTTON;

    }else{

      ATIVAR_BDIA = ENABLE_BOTTON;
      ATIVAR_BATENDIMENTO = ENABLE_BOTTON;
      ATIVAR_BINTERVALO = ENABLE_BOTTON;

      ATENDIMENTO = INI_ATENDIMENTO;  
      ATENDIMENTO_STATUS = INI_STATUS;
      ATENDIMENTO_APAR = APAR_INI;

    }
    setAtendimento(ATENDIMENTO);
    
  };

  return (
    <Layout style={styles.container} level='3'>

      <Button style={styles.button} disabled={ATIVAR_BINTERVALO} status={INTERVALO_STATUS} appearance={INTERVALO_APAR} accessoryLeft={StarIcon} onPress={onIntervalo}>
        {bIntervalor}
    </Button>

      <Button style={styles.button} disabled={ATIVAR_BATENDIMENTO} status={ATENDIMENTO_STATUS} appearance={ATENDIMENTO_APAR} accessoryLeft={StarIcon} onPress={onAtendimento}>
        {bAtendimento}
    </Button>

      <Button style={styles.button} disabled={ATIVAR_BDIA} status={DIA_STATUS} appearance={DIA_APAR} accessoryLeft={StarIcon} onPress={onDia}>
        {bDia}
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



