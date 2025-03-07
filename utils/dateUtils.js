export const calculateAge = (birthdate) => {
    const birthDate = new Date(birthdate);
    if (isNaN(birthDate.getTime())) {
        return "Invalid Date";
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export const formatBirthday = (birthdate) => {
    const options = { day: 'numeric', month: 'long' };
    return new Date(birthdate).toLocaleDateString('fr-FR', options);
}; 