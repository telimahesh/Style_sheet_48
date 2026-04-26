import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class HelpingAiService {
  /**
   * Answers a customer's question using AI context.
   */
  static async answerCustomerQuery(query: string, productContext: string = "") {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an elite tactical assistant for "Luxe Signal", a high-end tech hardware store.
        Store Context: We provide the latest hardware, neon-infused peripherals, and tactical setups.
        Product Context: ${productContext}
        
        Customer Query: "${query}"
        
        Provide a response that is helpful, professional, and fits our "Tactical Elite" aesthetic. Keep it concise.`,
        config: {
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("HelpingAiService Error:", error);
      return "Critical Signal Failure: Agent unable to process query. Please retry connection.";
    }
  }

  /**
   * Generates a tactical WhatsApp marketing message for a product or group of products.
   */
  static async generateAutoMessage(itemData: any, type: 'status' | 'broadcast' | 'direct' = 'direct') {
    try {
      const prompt = type === 'status' 
        ? `Generate a short, viral WhatsApp Status update for: ${itemData.name}. Include tactical emojis and a sense of urgency.`
        : `Generate a professional WhatsApp pitch for: ${itemData.name}. Price: ${itemData.price}. Highlight 2 key features.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    } catch (error) {
       return `[TACTICAL DEPLOYMENT] New gear available: ${itemData?.name || 'Asset'}. Contact for link.`;
    }
  }

  /**
   * Groups products and generates a collective update message.
   */
  static async generateGroupMessage(products: any[]) {
    try {
      const productList = products.map(p => p.name).join(", ");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I have a collection of products: ${productList}. 
        Generate a "New Stock Alert" message for a WhatsApp Group. 
        Theme: Hardware Reservoir Updated.
        Include instructions to check the storefront.`
      });
      return response.text;
    } catch (error) {
      return "New inventory detected in the reservoir. Scan catalog for details.";
    }
  }
}
