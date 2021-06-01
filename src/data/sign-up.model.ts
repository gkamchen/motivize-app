import * as Yup from 'yup';

export class SignUpData {

  constructor(
    readonly email: string,
    readonly password: string,
    readonly username: string) {

  }

  static empty(): SignUpData {
    return new SignUpData(
      '',
      '',
      '',
    );
  }
}

export const SignUpSchema = Yup.object().shape({
  email: Yup.string().email('Email inválido'),
  password: Yup.string().min(8, 'A senha deve conter no mínimo 8 caracteres'),
  username: Yup.string().min(2, 'O usuário deve conter no mínimo 2 caracteres'),
});

