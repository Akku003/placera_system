const Tesseract = require('tesseract.js');

class OCRProcessor {
  async extractTextFromImage(imagePath) {
    try {
      console.log('🔍 Starting OCR processing...');
      
      const { data: { text, confidence } } = await Tesseract.recognize(
        imagePath,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`📊 OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      console.log(`✅ OCR completed with ${Math.round(confidence)}% confidence`);
      return text;
    } catch (error) {
      console.error('❌ OCR error:', error);
      throw new Error('Failed to extract text using OCR: ' + error.message);
    }
  }
}

module.exports = new OCRProcessor();