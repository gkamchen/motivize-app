const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function erroEmail(email: string): string | undefined {
  if (!email.trim()) return 'Informe o e-mail.';
  if (!EMAIL.test(email.trim())) return 'E-mail inválido.';
  return undefined;
}

export function erroSenha(senha: string): string | undefined {
  if (!senha) return 'Informe a senha.';
  if (senha.length < 8) return 'A senha precisa de pelo menos 8 caracteres.';
  return undefined;
}

export function erroNome(nome: string): string | undefined {
  if (nome.trim().length < 2) return 'Informe seu nome.';
  return undefined;
}
