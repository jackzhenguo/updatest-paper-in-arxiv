const uppercaseRegex = /[A-Z]/;
const numberRegex = /[0-9]/;

export const isValidPassword = (password: string) => {
  if (password.length < 8) {
    return false;
  }
  if (!uppercaseRegex.test(password)) {
    return false;
  }
  if (!numberRegex.test(password)) {
    return false;
  }
  return true;
};
