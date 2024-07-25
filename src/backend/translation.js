let franc;
import('franc').then(module => {
  franc = module.default;
}).catch(err => {
  console.error('Failed to import franc:', err);
});

const { Translate } = require('@google-cloud/translate').v2;

const translate = new Translate({ projectId: 'YOUR_PROJECT_ID' });

// translation.js



const detectLanguage = (text) => {
  try {
    const langCode = franc(text);
    return langCode;
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'und'; // Return 'und' (undetermined) or handle error case
  }
};

module.exports = {
  detectLanguage,
};


const translateText = async (text, targetLanguage) => {
  try {
    const [translation] = await translate.translate(text, targetLanguage);
    return translation;
  } catch (error) {
    console.error('Error translating text:', error);
    return 'Translation Error';
  }
};


module.exports = { detectLanguage, translateText };