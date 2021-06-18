import React, { createRef, useEffect, useState } from 'react';
import { BackHandler, ImageBackground, StyleSheet } from 'react-native';
import { EdgeInsets, useSafeArea } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import { Button, Layout, LayoutElement } from '@ui-kitten/components';
import { SignUpScreenProps } from '../../navigation/auth.navigator';
import { AppRoute } from '../../navigation/app-routes';
import { Toolbar } from '../../components/toolbar.component';
import { FormInput } from '../../components/form-input.component';
import { SignUpData, SignUpSchema } from '../../data/sign-up.model';
import axios from 'axios';
import ConfirmModal from '../../components/modal.component';

export const SignUpScreen = (props: SignUpScreenProps): LayoutElement => {

  useEffect(() => {
    const backAction = () => {

      console.log('signUP');
      navigateSignIn();
      return true;

    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => {
      backHandler.remove();
    }

  }, []);

  const insets: EdgeInsets = useSafeArea();

  const confirmModalRef = createRef();

  const getConfirmModalRef = (): any => {
    return confirmModalRef.current;
  };

  const [formData, setFormData] = useState(SignUpData.empty());

  const onFormSubmit = async (values) => {
    try {
      const { data } = await axios.post(
        'https://parseapi.back4app.com/users',
        {
          'username': values.username,
          'email': values.email,
          'password': values.password,
        },
        {
          headers: {
            'X-Parse-Application-Id': 'Lw7G4z03GONWsOTnnTmIuhB9qfPHW2aulUi6uHNe',
            'X-Parse-REST-API-Key': 'yh0F4KepoCVEYql8w0fuMgD2glcSHodmTaCm6bqP',
          },

        },
      );

      setFormData(SignUpData.empty());
      navigateHome();

    } catch (Error) {

      getConfirmModalRef().show({
        message: 'Usuário ou email já cadastrado!',

      });

      console.log(Error);
    }
  };

  const navigateHome = (): void => {
    props.navigation.navigate(AppRoute.HOME);
  };

  const navigateSignIn = (): void => {
    props.navigation.navigate(AppRoute.SIGN_IN);
  };

  return (
    <React.Fragment>
      <ImageBackground
        style={[styles.appBar, { paddingTop: insets.top }]}
        source={require('../../assets/image-background.png')}>
        <Toolbar
          appearance='control'
          onBackPress={props.navigation.goBack}
        />
      </ImageBackground>
      <Layout style={styles.formContainer}>
        <Formik
          initialValues={SignUpData.empty()}
          validationSchema={SignUpSchema}
          onSubmit={onFormSubmit}
        >
          {({ handleSubmit }) =>
            <React.Fragment>
              <FormInput
                id="email"
                value={formData.email}
                style={styles.formControl}
                placeholder='Email'
                keyboardType='email-address'
                onChange={e => {
                  setFormData({
                    ...formData,
                    email: e.nativeEvent.text,
                  });
                }}
              />
              <FormInput
                id='password'
                value={formData.password}
                style={styles.formControl}
                placeholder='Senha'
                onChange={e => {
                  setFormData({
                    ...formData,
                    password: e.nativeEvent.text,
                  });
                }}
              />
              <FormInput
                id='username'
                value={formData.username}
                style={styles.formControl}
                placeholder='Usuário'
                onChange={e => {
                  setFormData({
                    ...formData,
                    username: e.nativeEvent.text,
                  });
                }}
              />
              <Button
                style={styles.submitButton}
                onPress={handleSubmit}>
                CADASTRAR
              </Button>
            </React.Fragment>
          }
        </Formik>
        <Button
          style={styles.haveAccountButton}
          appearance='ghost'
          status='basic'
          onPress={navigateSignIn}>
          Já possui uma conta?
        </Button>
      </Layout>
      <ConfirmModal ref={confirmModalRef} />
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  appBar: {
    height: 140,
  },
  formContainer: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  formControl: {
    marginVertical: 4,
  },
  submitButton: {
    marginVertical: 24,
  },
  haveAccountButton: {
    alignSelf: 'center',
  },
});
