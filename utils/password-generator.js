/**
 * Generates a secure password based on specified requirements.
 *
 * @param {number} length - The length of the password (default: 10).
 * @param {boolean} includeUppercase - Specifies whether to include uppercase letters (default: true).
 * @param {boolean} includeLowercase - Specifies whether to include lowercase letters (default: true).
 * @param {boolean} includeNumbers - Specifies whether to include numbers (default: true).
 * @param {boolean} includeSpecialCharacters - Specifies whether to include special characters (default: true).
 * @returns {string} - The generated password.
 * @throws {Error} - Throws an error if invalid inputs or no requirements are selected.
 */
const generator = (
  length = 10,
  includeUppercase = true,
  includeLowercase = true,
  includeNumbers = true,
  includeSpecialCharacters = true
) => {
  // Check for invalid inputs or no requirements selected
  if (length < 1 || !(includeUppercase || includeLowercase || includeNumbers || includeSpecialCharacters)) {
    throw new Error('Must provide a valid length and select at least one requirement to generate a strong password.')
  }

  // Define character sets for different types of characters
  const characters = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    specialCharacters: '!@#$%^&*().,+;?-={}[]'
  }

  let allowedCharacters = ''

  // Build the list of allowed characters based on selected requirements
  if (includeUppercase) {
    allowedCharacters += characters.uppercase
  }

  if (includeLowercase) {
    allowedCharacters += characters.lowercase
  }

  if (includeNumbers) {
    allowedCharacters += characters.numbers
  }

  if (includeSpecialCharacters) {
    allowedCharacters += characters.specialCharacters
  }

  // If no requirements are selected, throw an error
  if (allowedCharacters.length === 0) {
    throw new Error('At least one requirement must be selected in order to generate a secure password.')
  }

  let password = ''

  // Generate the password by selecting random characters from the allowed character set
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allowedCharacters.length)
    password += allowedCharacters[randomIndex]
  }

  // Check if the generated password meets all the selected requirements
  const haveNumbers = includeNumbers && /[0-9]/.test(password)
  const haveUppercase = includeUppercase && /[A-Z]/.test(password)
  const haveLowercase = includeLowercase && /[a-z]/.test(password)
  const haveSpecial = includeSpecialCharacters && /[!@#$%^&*().,+;\-?=}{[\]]/.test(password)

  // If the password does not meet all the requirements, generate a new one recursively
  if (!(haveNumbers && haveUppercase && haveLowercase && haveSpecial)) {
    return generator(length, includeUppercase, includeLowercase, includeNumbers, includeSpecialCharacters)
  }

  return password
}

module.exports = generator
