import React, {
  useEffect,
  Component,
} from 'react';
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
import { PieChart } from 'react-native-svg-charts'
import { RESULTS } from 'react-native-permissions';

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
var day: string = '';
var inicioIntervalo = 0;
var fimIntervalo = 0;
var inicioAtendimento = 0;
var fimAtendimento = 0;
var inicioDia = 0;
var fimDia = 0;
var chaveIntervalo: string = '';
var chaveAtendimento: string = '';
var longitude: string = '';
var latitude: string = '';

var pausarCronDia = false;
var pausarCronAte = false;
var pausarCronInt = false;
var pausarCronGra = false;

var somaAtendimento = 0;
var somaIntervalo = 0;
var somaDesl = 0;

function returnDateTime() {

  var data = new Date();

  var dia = data.getDate();           // 1-31
  var mes = data.getMonth();          // 0-11 (zero=janeiro)
  var ano = data.getFullYear();       // 4 dígitos
  var hora = data.getHours();          // 0-23
  var min = data.getMinutes();        // 0-59
  var seg = data.getSeconds();        // 0-59

  var dataF = (dia + "/" + mes + "/" + ano)
  var horario = (hora + ":" + min + ":" + seg);

  var segundoHora = converterHoraParaSegundo(horario);
  return { data, dataF, horario, segundoHora };

};

const converterHoraParaSegundo = (horario: string) => {

  var hor = horario.split(':');

  var horSeg = Number(hor[0]) * 3600;
  var minSeg = Number(hor[1]) * 60;
  var seg = Number(hor[2]) + minSeg + horSeg;

  return seg;

};

const converterSegundoParaHora = (seg: number) => {

  var ar = (seg / 3600).toString().split('.');

  var hor = ar[0];

  var ar2 = (0.60 * Number(ar[1])).toString().split('.');
  var min = ar2[0].substring(0, 2);
  var sec = (0.60 * Number(ar2[0].substring(2))).toString().substring(0, 2);

  var hora = hor + ':' + min + ':' + sec

  return hora;

};


const log = (chave: any = "", log: any = "", erro: any = "") => {

  var mensagem = "";

  console.log(">------------------------------------------------------------------------------------------<");

  if (chave != "") { console.log('Chave: ' + chave) };
  if (log != "") { console.log('Dados: ' + log) };
  if (erro != "") { console.log('Error:  ' + erro) };
};

//////////////////// APLICAÇÃo ////////////////////////

export const ButtonsControl = () => {

  const [currentLatitude, setCurrentLatitude] = React.useState(0);
  const [currentLongitude, setCurrentLongitude] = React.useState(0);

  const [currentHorInt, setHorInt] = React.useState(0);
  const [currentHorAten, setHorAten] = React.useState(0);
  const [currentHorDesl, setHorDesl] = React.useState(1);

  const [bDia, setDia] = React.useState(INI_DIA);
  const [bAtendimento, setAtendimento] = React.useState(INI_ATENDIMENTO);
  const [bIntervalor, setIntervalo] = React.useState(INI_INTERVALO);

  const [pieData, setPieData]: any = React.useState([]);

  useEffect(() => {
    callLocation();
    atualizarGrafico();
  }, []);

  const Color = (index: number) => {
    var ar = ['#ff0009', '#8FC617', '#04CEF7'];
    return ar[index];
  };

  const limparCamposVariaveis = () => {
  
    day = '';
    inicioIntervalo = 0;
    fimIntervalo = 0;
    inicioAtendimento = 0;
    fimAtendimento = 0;
    inicioDia = 0;
    fimDia = 0;
    chaveIntervalo = '';
    chaveAtendimento = '';
    longitude = '';
    latitude = ''
    pausarCronDia = false;
    pausarCronAte = false;
    pausarCronInt = false;
    pausarCronGra = false
    somaAtendimento = 0;
    somaIntervalo = 0;
    somaDesl = 0;

    setHorInt(somaIntervalo);
    setHorAten(somaAtendimento);
    setHorDesl(somaDesl);

  };


  const atualizarGrafico = async () => {

    var data = [currentHorDesl, currentHorAten, currentHorInt]

    let pieData2 = data
      .filter((value) => value > 0)
      .map((value, index) => ({
        value,
        svg: {
          fill: Color(index),
          onPress: () => console.log('press', index),
        },
        key: `pie-${index}`,
      }));

    setPieData(pieData2);
  }

  const somarDesl = async () => {
    somaDesl = (returnDateTime().segundoHora - inicioDia) - (somaAtendimento + somaIntervalo);
    setHorDesl(somaDesl);

    if (pausarCronDia === false) {
      setTimeout(somarDesl, 1000);
    }
  };

  const somarAte = async () => {
    let resultado = somaAtendimento + (returnDateTime().segundoHora - inicioAtendimento);
    setHorAten(resultado);

    if (pausarCronAte === false) {
      setTimeout(somarAte, 1000);
    } else {
      somaAtendimento = resultado;
    };

  };

  const somarInt = async () => {
    let resultado = somaIntervalo + (returnDateTime().segundoHora - inicioIntervalo);
    setHorInt(resultado);

    if (pausarCronInt === false) {
      setTimeout(somarInt, 1000);
    } else {
      somaIntervalo = resultado;
    };

  };

  const GravarInicioInt = () => {

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
    var chave = 'int-' + day + '-' + inicioIntervalo;

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

      gravar(chaveIntervalo, inter);

    }
  };

  const GravarInicioAte = () => {

    const atendimento = {
      'data': day,
      'inicioAte': inicioAtendimento,
      'info':
      {
        'latitude': latitude,
        'longitude': longitude,
        'fimAte': fimAtendimento,
      }
    };

    var inter = JSON.stringify(atendimento);
    var chave = 'ate-' + day + '-' + inicioAtendimento;

    chaveAtendimento = chave;
    gravar(chave, inter);

  };

  const gravarFimAte = async () => {

    var valor = await buscar(chaveAtendimento);

    if (valor != null) {

      var obj = JSON.parse(valor);

      var data = obj.data;
      var inicioAte = obj.inicioInt;
      var infoLat = obj.info.latitude;
      var infoLon = obj.info.longitude;

      const atendimento = {
        'data': data,
        'inicioAte': inicioAte,
        'info':
        {
          'latitude': infoLat,
          'longitude': infoLon,
          'fimAte': fimAtendimento,
        }
      };

      deletar(chaveAtendimento);

      var inter = JSON.stringify(atendimento);

      gravar(chaveAtendimento, inter);

    }
  };

  const deletar = (chave: string) => {
    AsyncStorage.removeItem(chave);
  };

  const gravar = (chave: string, valor: any) => {
    AsyncStorage.setItem(chave, valor);
  };

  const buscar = async (chave: string) => {
    const valor = await AsyncStorage.getItem(chave);
    return valor;
  };


  const callLocation = () => {
    if (Platform.OS === 'ios') {
      getLocation();
    } else {
      requestLocationPermission();
    }
  }

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

    setIntervalo(DIA);
  };

  const onIntervalo = () => {
    disabledAllButton();

    if (INTERVALO === INI_INTERVALO) {

      pausarCronInt = false;
      pausarCronDia = true;

      inicioIntervalo = returnDateTime().segundoHora;
      fimIntervalo = 0;

      callLocation();
      GravarInicioInt();
      somarInt();
      atualizarGrafico();
      ativarBotIntervalo();

    } else {

      pausarCronInt = true;
      pausarCronDia = false;

      fimIntervalo = returnDateTime().segundoHora;

      callLocation();
      gravarFimIntervalor();
      somarDesl();
      atualizarGrafico();
      desativerBotIntervalo();

    };

  };

  const onAtendimento = () => {
    disabledAllButton();
    
    if (ATENDIMENTO === INI_ATENDIMENTO) {

      inicioAtendimento = returnDateTime().segundoHora;
      fimAtendimento = 0;
      pausarCronAte = false;
      pausarCronDia = true;

      callLocation();
      GravarInicioAte();
      somarAte();
      atualizarGrafico();
      ativarBotAtendimento();

    } else {
      pausarCronAte = true;
      pausarCronDia = false;
      fimAtendimento = returnDateTime().segundoHora;

      callLocation();
      gravarFimAte();
      somarDesl();
      atualizarGrafico();
      desativarBotAtenimento();
    }

  };

  const onDia = () => {
    
    disabledAllButton();

    if (DIA === INI_DIA) {
      limparCamposVariaveis();

      pausarCronDia = false;
      pausarCronGra = false;
      inicioDia = returnDateTime().segundoHora;
      day = returnDateTime().dataF;
      fimDia = 0;

      callLocation();
      somarDesl();
      atualizarGrafico();
      ativarBotDia();

    } else {

      pausarCronDia = true;
      pausarCronGra = true;
      fimDia = returnDateTime().segundoHora;

      callLocation();
      atualizarGrafico();
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

  const ativarBotAtendimento = () => {
    ATENDIMENTO = FIM_ATENDIMENTO;
    ATENDIMENTO_STATUS = FIM_STATUS;
    ATENDIMENTO_APAR = APAR_FIM;

    ATIVAR_BDIA = DISABLE_BOTTON;
    ATIVAR_BATENDIMENTO = ENABLE_BOTTON;
    ATIVAR_BINTERVALO = DISABLE_BOTTON;
    setAtendimento(ATENDIMENTO);
  };

  const desativarBotAtenimento = () => {
    ATIVAR_BDIA = ENABLE_BOTTON;
    ATIVAR_BATENDIMENTO = ENABLE_BOTTON;
    ATIVAR_BINTERVALO = ENABLE_BOTTON;

    ATENDIMENTO = INI_ATENDIMENTO;
    ATENDIMENTO_STATUS = INI_STATUS;
    ATENDIMENTO_APAR = APAR_INI;

    setAtendimento(ATENDIMENTO);
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

  return (
    <Layout style={styles.container} level='3'>

      <Card style={styles.card} status='danger'>

        <PieChart style={{ height: 250 }} data={pieData} />

        <Text style={styles.text} status='success'>INTERVALO: {currentHorInt}</Text>
        <Text style={styles.text} status='info'>ATENDIMENTO: {currentHorAten} </Text>
        <Text style={styles.text} status='danger'> DESLOCAMENTO: {currentHorDesl} </Text>

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

