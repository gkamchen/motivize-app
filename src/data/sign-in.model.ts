import * as Yup from 'yup';

export class SignInData {

  constructor(
    readonly email: string,
    readonly password: string) {

  }

  static empty(): SignInData {
    return new SignInData(
      '',
      '',
    );
  }
}

export const SignInSchema = Yup.object().shape({
  email: Yup.string().email('Email inválido'),
  password: Yup.string().min(8, 'A senha deve conter no mínimo 8 caracteres'),
});

