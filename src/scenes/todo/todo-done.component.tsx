import React, { useState, useEffect } from "react";
import { View, PermissionsAndroid, Platform, StyleSheet } from "react-native";
import MapboxGL from "@react-native-mapbox-gl/maps";
import Geolocation from '@react-native-community/geolocation';
import { mapbox } from "src/assets/icons";

MapboxGL.setAccessToken('pk.eyJ1Ijoid2FnbmVyLWFudW5jaW8iLCJhIjoiY2txZnJ5aWVnMXZtMDMwbzNzZGY4eWYxdCJ9.cGu9nT5t60ehCNXv77gnYg');

export const TodoDoneScreen = (): any => {

  const [currentLatitude, setCurrentLatitude] = useState(0);
  const [currentLongitude, setCurrentLongitude] = useState(0);

  useEffect(() => {
    callLocation();
  }, []);

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
        setCurrentLatitude(position.coords.latitude);
        setCurrentLongitude(position.coords.longitude);
      },
      (error) => console.log(error.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  }

  return (
    <View style={{ flex: 1, height: "100%", width: "100%" }}>
      <MapboxGL.MapView
        styleURL={MapboxGL.StyleURL.Dark}
        style={{ flex: 1 }}>
        <MapboxGL.Camera
          zoomLevel={17}
          centerCoordinate={[currentLongitude, currentLatitude]}
          animationMode={'flyTo'}
          animationDuration={0}
        >
        </MapboxGL.Camera>
        <MapboxGL.PointAnnotation
          key="pointAnnotation"
          id="pointAnnotation"
          coordinate={[currentLongitude, currentLatitude]}>
          <View style={{
            height: 30,
            width: 30,
            backgroundColor: '#4169E1',
            borderRadius: 50,
            borderColor: '#00cccc',
            borderWidth: 3
          }} />
        </MapboxGL.PointAnnotation>
      </MapboxGL.MapView>
    </View>
  );

};

