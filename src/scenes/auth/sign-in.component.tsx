import React, { createRef } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { Button, CheckBox, Layout } from '@ui-kitten/components';
import { Formik, FormikProps } from 'formik';
import { SignInScreenProps } from '../../navigation/auth.navigator';
import { AppRoute } from '../../navigation/app-routes';
import { FormInput } from '../../components/form-input.component';
import { EyeIcon, EyeOffIcon } from '../../assets/icons';
import { SignInData, SignInSchema } from '../../data/sign-in.model';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import axios from 'axios';
import ConfirmModal from '../../components/modal.component';

export const SignInScreen = (props: SignInScreenProps) => {

  const [shouldRemember, setShouldRemember] = React.useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = React.useState<boolean>(false);

  const confirmModalRef = createRef();

  const getConfirmModalRef = () : any => {
    return confirmModalRef.current;
  };

  const onFormSubmit = async (values: SignInData): Promise<void> => {

    try {
      const { data } = await axios.get(
        `https://parseapi.back4app.com/login?username=${values.email}&password=${values.password}`,
        {
          headers: {
            'X-Parse-Application-Id': 'Lw7G4z03GONWsOTnnTmIuhB9qfPHW2aulUi6uHNe',
            'X-Parse-REST-API-Key': 'yh0F4KepoCVEYql8w0fuMgD2glcSHodmTaCm6bqP',
          },
        },
      );

      console.log(data);
      console.log(data.email);
      navigateHome();

    }
    catch (Error) {

      getConfirmModalRef().show({
        message: 'Email ou Senha inválidos!',
      });
    }
  };

  const navigateHome = (): void => {
    props.navigation.navigate(AppRoute.HOME);
  };

  const navigateSignUp = (): void => {
    props.navigation.navigate(AppRoute.SIGN_UP);
  };

  const navigateResetPassword = (): void => {
    props.navigation.navigate(AppRoute.RESET_PASSWORD);
  };

  const onPasswordIconPress = (): void => {
    setPasswordVisible(!passwordVisible);
  };

  const renderPasswordIcon = (props): React.ReactElement => {
    const IconComponent = passwordVisible ? EyeIcon : EyeOffIcon;
    return (
      <TouchableWithoutFeedback onPress={onPasswordIconPress}>
        <IconComponent {...props} />
      </TouchableWithoutFeedback>
    );
  };

  const renderForm = (props: FormikProps<SignInData>): React.ReactFragment => (
    <React.Fragment>
      <FormInput
        id='email'
        style={styles.formControl}
        placeholder='Email'
        keyboardType='email-address'
      />
      <FormInput
        id='password'
        style={styles.formControl}
        placeholder='Senha'
        secureTextEntry={!passwordVisible}
        accessoryRight={renderPasswordIcon}
      />
      <View style={styles.resetPasswordContainer}>
        <CheckBox
          style={styles.formControl}
          checked={shouldRemember}
          onChange={setShouldRemember}>
          Lembrar-me
        </CheckBox>
        <Button
          appearance='ghost'
          status='basic'
          onPress={navigateResetPassword}>
          Esqueceu a senha?
        </Button>
      </View>
      <Button
        style={styles.submitButton}
        onPress={props.handleSubmit}>
        ENTRAR
      </Button>
    </React.Fragment>
  );

  return (
    <React.Fragment>
      <ImageBackground
        style={styles.appBar}
        source={require('../../assets/image-background.png')}
      />
      <Layout style={styles.formContainer}>
        <Formik
          initialValues={SignInData.empty()}
          validationSchema={SignInSchema}
          onSubmit={onFormSubmit}>
          {renderForm}
        </Formik>
        <Button
          style={styles.noAccountButton}
          appearance='ghost'
          status='basic'
          onPress={navigateSignUp}>
          Não possui conta?
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
  resetPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formControl: {
    marginVertical: 4,
  },
  submitButton: {
    marginVertical: 24,
  },
  noAccountButton: {
    alignSelf: 'center',
  },
});
