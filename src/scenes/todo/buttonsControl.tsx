import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import {
  Layout,
  Text,
  Button,
  Icon,
  Spinner,
  Card,
} from '@ui-kitten/components';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-community/async-storage';
import { promises } from 'dns';

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

const INI_STATUS = 'primary';
const FIM_STATUS = 'danger';

const APAR_INI = 'filled';
const APAR_FIM = 'outline';

const STOP = 'stop';
const START = 'start';
const CLEAR = 'clear';

const DISABLE_BOTTON = true;
const ENABLE_BOTTON = false;

var ATIVAR_BDIA = ENABLE_BOTTON;
var ATIVAR_BATENDIMENTO = DISABLE_BOTTON;
var ATIVAR_BINTERVALO = DISABLE_BOTTON;

var INTERVALO = INI_INTERVALO;
var INTERVALO_STATUS = INI_STATUS;
var INTERVALO_APAR = APAR_INI;

var DIA = INI_DIA;
var DIA_STATUS = INI_STATUS;
var DIA_APAR = APAR_INI;

var ATENDIMENTO = INI_ATENDIMENTO;
var ATENDIMENTO_STATUS = INI_STATUS;
var ATENDIMENTO_APAR = APAR_INI;

var cronometroDia;

function returnDateTime() {

  console.log("\n LOG: -----------> DATA E HORA -----> ");

  var data = new Date();

  var dia = data.getDate();           // 1-31
  var mes = data.getMonth();          // 0-11 (zero=janeiro)
  var ano = data.getFullYear();       // 4 dígitos
  var hora = data.getHours();          // 0-23
  var min = data.getMinutes();        // 0-59
  var seg = data.getSeconds();        // 0-59

  var dataF = (dia + "/" + mes + "/" + ano)
  var horario = (hora + ":" + min + ":" + seg);

  return { dataF, horario };

};


export const ButtonsControl = () => {

  //ObterStateDay();

  const [currentLatitude, setCurrentLatitude] = React.useState(' ');
  const [currentLogitude, setCurrentLongitude] = React.useState(' ');
  const [watchId, setWatchId] = React.useState(0);

  const [currentDay, setDay] = React.useState(' ');
  const [currentUser, setUser] = React.useState('Wagner Teste');
  const [currentHorTrab, setHorTrab] = React.useState('0.0');
  const [currentHorAten, setHorAten] = React.useState('0.0');
  const [currentHorDesl, setHorDesl] = React.useState('0.0');

  const [currentIniDia, setIniDia] = React.useState(' ');
  const [currentFimDia, setFimDia] = React.useState(' ');
  const [currentIniInt, setIniInt] = React.useState(' ');
  const [currentFimInt, setFimInt] = React.useState(' ');

  const [bDia, setDia] = React.useState(INI_DIA);
  const [bAtendimento, setAtendimento] = React.useState(INI_ATENDIMENTO);
  const [bIntervalor, setIntervalo] = React.useState(INI_INTERVALO);

  const [currentCroDia, setCroDia] = React.useState('');

  const cronHorTrab = () => {

  };

  const cronHorAten = () => {

  };

  const cronHorDesl = () => {

  };

  const salveStateIntervalor = () => {

      const intervalo = {
        'data': currentDay,
        'inicioInt': currentIniInt,
        'info':[
          {
            'latitude':currentLatitude,
            'longitude':currentLogitude,
            'fimInt':currentFimInt,
          }
        ]
      };

      var inter = JSON.stringify(intervalo);
      var chave = currentDay+';'+currentIniInt;

    gravar(chave,inter);

  };

  const gravarFimIntervalor = async () =>{

    var chave = currentDay+';'+currentIniInt;

    var valor = await buscar(chave);
    if (valor != null) {
      var obj = JSON.parse(valor);

      obj.info.fimInt = currentFimInt;

      var inter = JSON.stringify(obj);

      gravar(chave,inter);

    }

  };


  const gravar = (chave:string,valor:any) => {
    console.log(valor);
    AsyncStorage.setItem(chave,valor);
  }

  const buscar = async (chave:string) => {
    const valor = await AsyncStorage.getItem(chave);
    return valor;
  };

  const getLocation = () => {

    Geolocation.getCurrentPosition(
      (position) => {
        const currentLatitude = JSON.stringify(position.coords.latitude);
        const currentLogitude = JSON.stringify(position.coords.longitude);
        setCurrentLatitude(currentLatitude);
        setCurrentLongitude(currentLogitude);
      },
      (error) => console.log(error.message), {
      enableHighAccuracy: true, timeout: 20000, maximumAge: 1000
    }
    );
    const watchId = Geolocation.watchPosition((position) => {
      const currentLatitude = JSON.stringify(position.coords.latitude);
      const currentLogitude = JSON.stringify(position.coords.longitude);
      setCurrentLatitude(currentLatitude);
      setCurrentLongitude(currentLogitude);
    });
    setWatchId(watchId);
  }

  const claerLocation = () => {
    Geolocation.clearWatch(watchId);
  }

  const onIntervalo = () => {

    console.log("\nLOG: ----------->CLICK  BOTÃO INTERVALO -------> " + INTERVALO);

    if (INTERVALO === INI_INTERVALO) {

      setIniInt(returnDateTime().horario);
      setFimInt("");

      salveStateIntervalor();
      
      INTERVALO = FIM_INTERVALO;
      INTERVALO_STATUS = FIM_STATUS;
      INTERVALO_APAR = APAR_FIM;
      
      ATIVAR_BDIA = DISABLE_BOTTON;
      ATIVAR_BATENDIMENTO = DISABLE_BOTTON;
      ATIVAR_BINTERVALO = ENABLE_BOTTON;
      
    } else {

      setFimInt(returnDateTime().horario);

      gravarFimIntervalor();
      
      ATIVAR_BDIA = ENABLE_BOTTON;
      ATIVAR_BATENDIMENTO = ENABLE_BOTTON;
      ATIVAR_BINTERVALO = ENABLE_BOTTON;
      
      INTERVALO = INI_INTERVALO;
      INTERVALO_STATUS = INI_STATUS;
      INTERVALO_APAR = APAR_INI;
      
    }

    setIntervalo(INTERVALO);

  };

  const onDia = async () => {

    console.log("\nLOG: -----------> CLICK BOTÃO DIA -----> " + DIA);

    if (DIA === INI_DIA) {

      getLocation();

      setDay(returnDateTime().dataF);
      setIniDia(returnDateTime().horario);
      setFimDia("");

      DIA = FIM_DIA;
      DIA_STATUS = FIM_STATUS;
      DIA_APAR = APAR_FIM;

      ATIVAR_BDIA = ENABLE_BOTTON;
      ATIVAR_BATENDIMENTO = ENABLE_BOTTON;
      ATIVAR_BINTERVALO = ENABLE_BOTTON;

    } else {

      setFimDia(returnDateTime().horario);

      console.log(currentFimDia);

      ATIVAR_BDIA = ENABLE_BOTTON;
      ATIVAR_BATENDIMENTO = DISABLE_BOTTON;
      ATIVAR_BINTERVALO = DISABLE_BOTTON;

      DIA = INI_DIA;
      DIA_STATUS = INI_STATUS;
      DIA_APAR = APAR_INI;

      claerLocation();

    }
    setDia(DIA);

  };

  const onAtendimento = () => {

    console.log("\nLOG: ----------->CLICK BOTÃO ATENDIMENTO ---------> " + ATENDIMENTO);

    if (ATENDIMENTO === INI_ATENDIMENTO) {

      ATENDIMENTO = FIM_ATENDIMENTO;
      ATENDIMENTO_STATUS = FIM_STATUS;
      ATENDIMENTO_APAR = APAR_FIM;

      ATIVAR_BDIA = DISABLE_BOTTON;
      ATIVAR_BATENDIMENTO = ENABLE_BOTTON;
      ATIVAR_BINTERVALO = DISABLE_BOTTON;

    } else {

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

      <Card style={styles.card} status='danger'>

        <Text style={styles.text} status='warning'>Data: {currentDay} </Text>
        <Text style={styles.text} status='danger'>Usuário: {currentUser} </Text>

        <Text style={styles.text} status='primary'>Latitude: {currentLatitude} </Text>
        <Text style={styles.text} status='primary'>Longitude: {currentLogitude} </Text>
        <Text style={styles.text} status='success'>Horas Trabalhadas: {currentHorTrab}</Text>
        <Text style={styles.text} status='success'>Horas Atendimento: {currentHorAten}</Text>
        <Text style={styles.text} status='success'>Horas Deslocamento: {currentHorDesl}</Text>

        <Text style={styles.text} status='info'>Inicio Dia: {currentIniDia} </Text>
        <Text style={styles.text} status='info'>Fim Dia: {currentFimDia}</Text>
        <Text style={styles.text} status='info'>Inicio Intervalo: {currentIniInt}</Text>
        <Text style={styles.text} status='info'>Fim Intervalo: {currentFimInt}</Text>


        <Button style={styles.button} disabled={ATIVAR_BINTERVALO} status={INTERVALO_STATUS} appearance={INTERVALO_APAR} accessoryLeft={StarIcon} onPress={onIntervalo}>
          {bIntervalor}
        </Button>

        <Button style={styles.button} disabled={ATIVAR_BATENDIMENTO} status={ATENDIMENTO_STATUS} appearance={ATENDIMENTO_APAR} accessoryLeft={StarIcon} onPress={onAtendimento}>
          {bAtendimento}
        </Button>

        <Button style={styles.button} disabled={ATIVAR_BDIA} status={DIA_STATUS} appearance={DIA_APAR} accessoryLeft={StarIcon} onPress={onDia}>
          {bDia}
        </Button>

      </Card>


    </Layout>
  );
};


const styles = StyleSheet.create({
  container: {
    display: 'flex',
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
  card: {
    marginTop: 0,
    margin: 2,
  },
  text: {
    margin: 4,
  },
});


