import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OPENAI_API_KEY_CONFIG_KEY } from '@/config/keys.config';
import { type IExtractedData } from '@/modules/llm/types/llm';

@Injectable()
export class LlmService {
  private client: OpenAI;
  private readonly model = 'gpt-4o-mini';
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>(OPENAI_API_KEY_CONFIG_KEY)!,
    });
  }

  async analyzeData(ocrText: string): Promise<IExtractedData> {
    try {
      const prompt = `
        Extract receipt data as JSON: 
        { 
          "merchantName": "string", 
          "amount": number, 
          "date": "YYYY-MM-DD|null", 
          "category": "grocery|restaurant|retail|gas|pharmacy|other", 
          "items": [{"name": "string", "price": number, "quantity": number}], 
          "otherDetails": [{"key": "string", "value": string}] 
        }
        
        IMPORTANT PRICING RULES:
        Do not tag discounts, taxes, or other fees as items. Be mindful of negative prices.
        If quantity and price are both shown, determine if the price is:
        a) Unit price (price per single item) - multiply by quantity for line total
        b) Line total (already includes quantity) - divide by quantity for unit price
        Store the UNIT PRICE in the "price" field (price per single item)
        Look for context clues like "@ X.XX each", "unit price", "ea", or line totals that help determine pricing type
        If unclear whether price is unit or total, assume it's the line total and calculate unit price
        Evaluate prices with negative signs as discounts or refunds - preserve the negative sign
        Be mindful of OCR errors: 0 may look like 8, 5 like S, 2 like Z, etc.
        Cross-reference individual item calculations with receipt totals to validate pricing interpretation
        PRESERVE EXACT QUANTITIES: Do not round decimal quantities

        VALIDATION AND CORRECTION RULES:
        After extracting all items, calculate the sum of (price * quantity) for all line items
        Compare this calculated sum to the stated total amount on the receipt
        If there's ANY discrepancy, prioritize the calculated sum from line items over the stated total
        The "amount" field should reflect the sum of all line items (price * quantity), not the final receipt total
        Final receipt totals may include rounding, fees, or charges not reflected in line items

        OTHER DETAILS RULES:
        Include ONLY these critical business fields if present:

        VAT/tax registration numbers
        Invoice/transaction numbers
        Payment method
        Store location (city/state only)

        Use snake_case for keys (e.g., "vat_reg_number", "invoice_number", "payment_method", "store_location")
        EXCLUDE everything else: totals, customer info, terms, promotional text, printer details

        ${ocrText}

        Return only valid JSON. Use null for missing data.
    `;

      const startTime = Date.now();

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_completion_tokens: 1000,
      });

      const endTime = Date.now();
      const processingTimeMs = endTime - startTime;
      console.log(`LLM processing time: ${processingTimeMs} ms`);

      if (!response.choices[0].message.content) {
        this.logger.error('No response from LLM');
        throw new InternalServerErrorException(
          'Something went wrong while analyzing the receipt data.',
        );
      }

      /* TODO: save to database */

      const rawData = response.choices[0].message.content.trim();
      const analyzedData = this.sanitizeData(rawData);

      return analyzedData;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'Something went wrong while analyzing the receipt data.',
      );
    }
  }

  private sanitizeData(data: string): IExtractedData {
    const jsonData = JSON.parse(data) as IExtractedData;

    const merchantName = jsonData.merchantName || 'Merchant Name';
    const amount = jsonData.amount || '1.00';
    const date = jsonData.date || new Date().toISOString();
    const category = jsonData.category || 'Other';
    const items = jsonData.items || [];
    const otherDetails = jsonData.otherDetails || [];

    return {
      merchantName,
      amount,
      date,
      category,
      items,
      otherDetails,
    };
  }
}
