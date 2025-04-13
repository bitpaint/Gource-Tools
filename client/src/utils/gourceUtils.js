/**
 * Utilitaires pour convertir entre camelCase et kebab-case pour la configuration Gource
 */

// Convertit de camelCase à kebab-case (pour l'API Gource)
export const camelToKebab = (str) => {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
};

// Convertit de kebab-case à camelCase (pour l'UI React)
export const kebabToCamel = (str) => {
  return str.replace(/-./g, x => x[1].toUpperCase());
};

// Convertit un objet avec des clés kebab-case en un objet avec des clés camelCase
export const convertToCamelCase = (obj) => {
  if (!obj) return obj;
  
  const result = {};
  Object.entries(obj).forEach(([key, value]) => {
    result[kebabToCamel(key)] = value;
  });
  
  return result;
};

// Convertit un objet avec des clés camelCase en un objet avec des clés kebab-case
export const convertToKebabCase = (obj) => {
  if (!obj) return obj;
  
  const result = {};
  Object.entries(obj).forEach(([key, value]) => {
    result[camelToKebab(key)] = value;
  });
  
  return result;
}; 