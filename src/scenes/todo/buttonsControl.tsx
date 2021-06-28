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

//Variavei de controle
var cronometroDia: string = '';
var day: string = '';
var inicioIntervalo: string = '';
var fimIntervalo: string = '';
var inicioAtendimento: string = '';
var fimAtendimento: string = '';
var inicioDia: string = '';
var fimDia: string = '';
var chaveIntervalo: string = '';
var chaveAtendimento: string = '';
var chaveDia: string = '';
var longitude: string = '';
var latitude: string = '';

function returnDateTime() {

  var data = new Date();

  log('Data Hora', data)

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

const log = (chave: any = "", log: any = "", erro: any = "") => {

  var mensagem = "";

  console.log(">------------------------------------------------------------------------------------------<");

  if (chave != "") { console.log('Chave: ' + chave) };
  if (log != "") { console.log('Dados: ' + log) };
  if (erro != "") { console.log('Error:  ' + erro) };
};

export const ButtonsControl = () => {


  const [currentLatitude, setCurrentLatitude] = React.useState(0);
  const [currentLongitude, setCurrentLongitude] = React.useState(0);

  const [currentDay, setDay] = React.useState('00/00/0000');
  const [currentUser, setUser] = React.useState('Wagner');
  const [currentHorTrab, setHorTrab] = React.useState('0.0');
  const [currentHorAten, setHorAten] = React.useState('0.0');
  const [currentHorDesl, setHorDesl] = React.useState('0.0');

  const [currentIniDia, setIniDia] = React.useState('');
  const [currentFimDia, setFimDia] = React.useState('');
  const [currentIniInt, setIniInt] = React.useState('');
  const [currentFimInt, setFimInt] = React.useState('');
  const [currentIniAte, setIniAte] = React.useState('');
  const [currentFimAte, setFimAte] = React.useState('');

  const [bDia, setDia] = React.useState(INI_DIA);
  const [bAtendimento, setAtendimento] = React.useState(INI_ATENDIMENTO);
  const [bIntervalor, setIntervalo] = React.useState(INI_INTERVALO);

  const [currentCroDia, setCroDia] = React.useState('');

  useEffect(() => {
    callLocation();
  }, []);

  function limparCamposVariaveis() {

    setDay('');
    setIniDia('');
    setFimDia('');
    setIniInt('');
    setFimInt('');
    setIniAte('');
    setFimAte('');

    cronometroDia = '';
    day = '';
    inicioIntervalo = '';
    fimIntervalo = '';
    inicioAtendimento = '';
    fimAtendimento = '';
    inicioDia = '';
    fimDia = '';
    chaveIntervalo = '';
    chaveAtendimento = '';
    chaveDia = '';
    longitude = '';
    latitude = '';

  };

  const atualizarBancoDados = () => {

  };

  const GravarInicioInt = () => {

    log('data', currentDay);
    log('inicioInt', currentIniInt);

    const intervalo = {
      'data': day,
      'inicioInt': inicioIntervalo,
      'info':
      {
        'latitude': latitude,
        'longitude': longitude,
        'fimInt': fimIntervalo,
      }
    };

    var inter = JSON.stringify(intervalo);
    var chave = day + ' - ' + inicioIntervalo;

    chaveIntervalo = chave;
    gravar(chave, inter);

  };

  const gravarFimIntervalor = async () => {

    var valor = await buscar(chaveIntervalo);

    if (valor != null) {

      var obj = JSON.parse(valor);

      var data = obj.data;
      var inicioInt = obj.inicioInt;
      var infoLat = obj.info.latitude;
      var infoLon = obj.info.longitude;

      const intervalo = {
        'data': data,
        'inicioInt': inicioInt,
        'info':
        {
          'latitude': infoLat,
          'longitude': infoLon,
          'fimInt': fimIntervalo,
        }
      };

      deletar(chaveIntervalo);

      var inter = JSON.stringify(intervalo);

      log('JSON STRING', inter);

      gravar(chaveIntervalo, inter);

      atualizarBancoDados();

    }
  };

  const deletar = (chave: string) => {
    AsyncStorage.removeItem(chave);
  };

  const gravar = (chave: string, valor: any) => {
    log(chave, valor);
    AsyncStorage.setItem(chave, valor);
  };

  const buscar = async (chave: string) => {
    const valor = await AsyncStorage.getItem(chave);
    log(chave, valor)
    return valor;
  };


  const callLocation = () => {
    if (Platform.OS === 'ios') {
      getLocation();
    } else {
      const requestLocationPermission = async () => {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Permissão de Acesso à Localização",
            message: "Este aplicativo precisa acessar sua localização.",
            buttonNeutral: "Pergunte-me depois",
            buttonNegative: "Cancelar",
            buttonPositive: "OK"
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getLocation();
        } else {
          console.log('Permissão de Localização negada');
        }
      };
      requestLocationPermission();
    }
  }

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        latitude = JSON.stringify(position.coords.latitude);
        longitude = JSON.stringify(position.coords.longitude);
        setCurrentLatitude(position.coords.latitude);
        setCurrentLongitude(position.coords.longitude);
      },
      (error) => console.log(error.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  }

  const disabledAllButton = () => {

    ATIVAR_BDIA = DISABLE_BOTTON;
    ATIVAR_BATENDIMENTO = DISABLE_BOTTON;
    ATIVAR_BINTERVALO = DISABLE_BOTTON;

    setIntervalo(INTERVALO);

  };

  const onIntervalo = () => {

    if (INTERVALO === INI_INTERVALO) {

      disabledAllButton();

      inicioIntervalo = returnDateTime().horario;
      fimIntervalo = ""

      setIniInt(inicioIntervalo);
      setFimInt(fimIntervalo);

      GravarInicioInt();

      ativarBotIntervalo();

    } else {

      disabledAllButton();

      fimIntervalo = returnDateTime().horario;

      setFimInt(fimIntervalo);

      gravarFimIntervalor();

      desativerBotIntervalo();

    }

  };

  const ativarBotIntervalo = () => {

    INTERVALO = FIM_INTERVALO;
    INTERVALO_STATUS = FIM_STATUS;
    INTERVALO_APAR = APAR_FIM;

    ATIVAR_BDIA = DISABLE_BOTTON;
    ATIVAR_BATENDIMENTO = DISABLE_BOTTON;
    ATIVAR_BINTERVALO = ENABLE_BOTTON;

    setIntervalo(INTERVALO);
  };

  const desativerBotIntervalo = () => {

    ATIVAR_BDIA = ENABLE_BOTTON;
    ATIVAR_BATENDIMENTO = ENABLE_BOTTON;
    ATIVAR_BINTERVALO = ENABLE_BOTTON;

    INTERVALO = INI_INTERVALO;
    INTERVALO_STATUS = INI_STATUS;
    INTERVALO_APAR = APAR_INI;

    setIntervalo(INTERVALO);
  };

  const onDia = () => {

    if (DIA === INI_DIA) {

      disabledAllButton();

      limparCamposVariaveis();

      day = returnDateTime().dataF;
      fimDia = ""
      inicioDia = returnDateTime().horario;

      setDay(day);
      setIniDia(inicioDia);
      setFimDia(fimDia);

      ativarBotDia();

    } else {

      disabledAllButton();

      fimDia = returnDateTime().horario;

      setFimDia(fimDia);

      desativarBotDia();
    };

  };

  // Desativa os botões com relação ao fim do dia
  const desativarBotDia = () => {

    ATIVAR_BDIA = ENABLE_BOTTON;
    ATIVAR_BATENDIMENTO = DISABLE_BOTTON;
    ATIVAR_BINTERVALO = DISABLE_BOTTON;

    DIA = INI_DIA;
    DIA_STATUS = INI_STATUS;
    DIA_APAR = APAR_INI;

    setDia(DIA);

  };

  //Ativa os botão com relação ao inicio do dia
  const ativarBotDia = () => {
    DIA = FIM_DIA;
    DIA_STATUS = FIM_STATUS;
    DIA_APAR = APAR_FIM;

    ATIVAR_BDIA = ENABLE_BOTTON;
    ATIVAR_BATENDIMENTO = ENABLE_BOTTON;
    ATIVAR_BINTERVALO = ENABLE_BOTTON;

    setDia(DIA);
  };

  const onAtendimento = () => {


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
        <Text style={styles.text} status='primary'>{currentLatitude}   {currentLongitude} </Text>
      </Card>

      <Card style={styles.card} status='danger'>

        <Text style={styles.text} status='warning'>{currentDay} </Text>
        <Text style={styles.text} status='danger'> {currentUser} </Text>
        <Text style={styles.text} status='success'>Horas Trabalhadas: {currentHorTrab}</Text>
        <Text style={styles.text} status='success'>Horas Atendimento: {currentHorAten}</Text>
        <Text style={styles.text} status='success'>Horas Deslocamento: {currentHorDesl}</Text>

        <Text style={styles.text} status='info'>Inicio Dia: {currentIniDia} | Fim Dia: {currentFimDia} </Text>
        <Text style={styles.text} status='info'>Inicio Intervalo: {currentIniInt} | Fim Intervalo: {currentFimInt}</Text>
        <Text style={styles.text} status='info'>Inicio Atendimento: {currentIniAte} | Fim Atendimento: {currentFimAte}</Text>

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