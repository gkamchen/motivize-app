import React, { createRef, useEffect, useState } from 'react';
import { BackHandler, ImageBackground, StyleSheet } from 'react-native';
import { EdgeInsets, useSafeArea } from 'react-native-safe-area-context';
import { Button, Layout, LayoutElement } from '@ui-kitten/components';
import { Formik, FormikProps } from 'formik';
import { ResetPasswordScreenProps } from '../../navigation/auth.navigator';
import { AppRoute } from '../../navigation/app-routes';
import { FormInput } from '../../components/form-input.component';
import { Toolbar } from '../../components/toolbar.component';
import { ResetPasswordData, ResetPasswordSchema } from '../../data/reset-password.model';
import axios from 'axios';
import ConfirmModal from '../../components/modal.component';

export const ResetPasswordScreen = (props: ResetPasswordScreenProps): LayoutElement => {

  const insets: EdgeInsets = useSafeArea();

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

  const confirmModalRef = createRef();

  const getConfirmModalRef = (): any => {
    return confirmModalRef.current;
  };

  const [formData, setFormData] = useState(ResetPasswordData.empty());

  const onFormSubmit = async (values: ResetPasswordData): Promise<void> => {
    try {
      const { data } = await axios.post(
        'https://parseapi.back4app.com/requestPasswordReset',
        {
          'email': values.email
        },
        {
          headers: {
            'X-Parse-Application-Id': 'Lw7G4z03GONWsOTnnTmIuhB9qfPHW2aulUi6uHNe',
            'X-Parse-REST-API-Key': 'yh0F4KepoCVEYql8w0fuMgD2glcSHodmTaCm6bqP',
          },

        },
      );

      setFormData(ResetPasswordData.empty());
      getConfirmModalRef().show({
        message: 'Email enviado!',

      });
      navigateSignIn();

    } catch (Error) {

      getConfirmModalRef().show({
        message: 'Email não cadastrado!',

      });

      console.log(Error);
    }
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
          initialValues={ResetPasswordData.empty()}
          validationSchema={ResetPasswordSchema}
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
              <Button
                style={styles.button}
                onPress={handleSubmit}>
                ENVIAR
              </Button>
            </React.Fragment>
          }
        </Formik>
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
  button: {
    marginVertical: 24,
  },
});
