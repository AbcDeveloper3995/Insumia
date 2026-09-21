import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AIzaSyCuI2Vlqss_AkKYRDcyMNV-YPM4XP-1f1M' });

async function listModels() {
  try {
    const models = await ai.models.list();
    for await (const model of models) {
      console.log(model.name);
    }
  } catch (e) {
    console.error(e);
  }
}

listModels();
