import React from 'react';
import {
  ImageBackground,
  StyleSheet,
} from 'react-native';
import {
  Formik,
  FormikProps,
} from 'formik';
import {
  Button,
  Layout,
  LayoutElement,
} from 'react-native-ui-kitten';
import { FormInput } from '@app-components/form-input.component';
import {
  SignUpData,
  SignUpSchema,
} from '@app-data/sign-up.model';
import { AppRoute } from '@app-navigation/app-routes';

export const SignUpScreen = (props): LayoutElement => {

  const onFormSubmit = (values: SignUpData): void => {
    navigateHome();
  };

  const navigateHome = (): void => {
    props.navigation.navigate(AppRoute.HOME);
  };

  const navigateSignIn = (): void => {
    props.navigation.navigate(AppRoute.SIGN_IN);
  };

  const renderForm = (props: FormikProps<SignUpData>): React.ReactFragment => (
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
        placeholder='Password'
      />
      <FormInput
        id='username'
        style={styles.formControl}
        placeholder='Username'
      />
      <Button
        style={styles.submitButton}
        onPress={props.handleSubmit}>
        SIGN UP
      </Button>
    </React.Fragment>
  );

  return (
    <React.Fragment>
      <ImageBackground
        style={styles.appBar}
        source={require('../../assets/image-note-background-1.jpg')}
      />
      <Layout style={styles.formContainer}>
        <Formik
          initialValues={SignUpData.empty()}
          validationSchema={SignUpSchema}
          onSubmit={onFormSubmit}>
          {renderForm}
        </Formik>
        <Button
          style={styles.haveAccountButton}
          appearance='ghost'
          status='basic'
          onPress={navigateSignIn}>
          Already have an account?
        </Button>
      </Layout>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  appBar: {
    height: 192,
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
