import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OPENAI_API_KEY_CONFIG_KEY } from '@/config/keys.config';
import { LLmRepository } from '@/modules/llm/llm.repository';
import { type IExtractedData } from '@/modules/llm/types/llm';

@Injectable()
export class LlmService {
  private client: OpenAI;
  private readonly model = 'gpt-3.5-turbo';
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly llmRepository: LLmRepository,
  ) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>(OPENAI_API_KEY_CONFIG_KEY)!,
    });
  }

  async analyzeData({
    ocrText,
    ocrResultId,
  }: {
    ocrText: string;
    ocrResultId: string;
  }): Promise<{ llmResultId: string; data: IExtractedData }> {
    const llmRecord = await this.llmRepository.create(ocrResultId);

    try {
      const prompt = `
        CONTEXT: Multi-tenant expense tracking SaaS for Philippines SMBs with OCR processing.

        INPUT FORMAT: OCR text from multiple photos separated by "RECEIPT SEPARATOR" string.

        Extract and COMBINE receipt data into a SINGLE JSON object conforming to this interface:
        {
          "merchantName": "string",
          "amount": number,
          "date": "YYYY-MM-DD|null", 
          "category": "grocery|restaurant|retail|gas|pharmacy|transportation|office_supplies|entertainment|professional_services|utilities|other",
          "items": [{"name": "string", "price": number, "quantity": number}],
          "otherDetails": [{"key": "string", "value": "string"}]
        }

        RECEIPT SEPARATOR PROCESSING & COMBINATION:
        - Split input text by "RECEIPT SEPARATOR" to identify individual receipt sections
        - Process each section to extract data, then MERGE into single receipt object
        - Combine all line items from all sections into single "items" array
        - Aggregate amounts from all sections into single total "amount"
        - Use the FIRST valid merchantName found (prioritize clearest/most complete)
        - Use the EARLIEST date found across all sections
        - Choose most specific category (restaurant > grocery > other)
        - Merge otherDetails without duplicates

        DUPLICATE ITEM ELIMINATION:
        - Remove duplicate items with EXACT same name, price, and quantity
        - For same item name but different prices: keep separate entries (likely different sizes/variants)
        - For same item name and price but different quantities: SUM the quantities into single entry
        - Case-insensitive comparison for item names ("Coke" = "COKE" = "coke")
        - Normalize item names: trim whitespace, standardize abbreviations

        MERCHANT & DATE RESOLUTION:
        - If multiple merchants found: use the most complete/readable name
        - If dates conflict: use earliest valid date (YYYY-MM-DD format)
        - If no valid dates: use null
        - If merchantName unclear across all sections: use "Merchant Name"

        AMOUNT CALCULATION:
        - Sum all individual item calculations: Σ(price * quantity) for ALL items after deduplication
        - DO NOT simply add stated totals from different sections (may include different taxes/fees)
        - Final amount = combined calculation of all line items
        - Ignore section-level totals, taxes, and fees when combining

        CRITICAL PRICING RULES (Applied Per Section, Then Combined):
        - NEVER tag discounts, taxes, service charges, or delivery fees as line items
        - Preserve negative pricing for discounts/refunds with exact negative sign
        - UNIT PRICE PRIORITY: Store price per single item in "price" field
        - For quantity/price pairs, identify if price is:
          a) Unit price (@X.XX each, per piece, ea) → use directly
          b) Line total (already includes quantity) → divide by quantity for unit price
        - Context clues: "@", "each", "ea", "per", line totals, unit indicators
        - When ambiguous, assume line total and calculate unit price = total ÷ quantity
        - OCR ERROR CORRECTION: 0→8, 5→S, 2→Z, 1→I, 6→G common errors
        - PRESERVE EXACT QUANTITIES: No rounding of decimal quantities (1.5kg → 1.5, not 2)

        CATEGORY RESOLUTION:
        - Priority order: professional_services > restaurant > transportation > pharmacy > grocery > retail > utilities > office_supplies > entertainment > gas > other
        - If sections have conflicting categories, use highest priority category
        - If same priority level, use category from section with highest total amount

        OTHER DETAILS COMBINATION (snake_case keys):
        INCLUDE ONLY (merge from all sections, avoid duplicates):
        - "vat_reg_number" / "tin_number" (BIR tax IDs) - use first valid found
        - "invoice_number" / "receipt_number" / "or_number" / "si_number" - combine with semicolon if multiple
        - "payment_method" (Cash, Card, GCash, PayMaya, etc.) - use first valid found
        - "store_location" (City/Province only) - use most complete location
        - "transaction_id" / "reference_number" - combine with semicolon if multiple
        - "cashier_name" / "server_name" - use first valid found

        EXCLUDE: Customer info, terms, promotional text, printer details, timestamps, section subtotals

        ERROR HANDLING FOR COMBINED RECEIPTS:
        - Empty separator sections → skip entirely
        - Corrupted OCR between separators → attempt text reconstruction
        - Conflicting data → use resolution rules above
        - Missing critical data → apply fallback values

        PROCESSING ALGORITHM:
        1. Split ocrText by "RECEIPT SEPARATOR"
        2. Filter out empty/whitespace-only sections
        3. Extract data from each section independently
        4. Apply deduplication rules to combine items
        5. Resolve merchant, date, category using priority rules
        6. Calculate final amount from combined item totals
        7. Merge otherDetails without duplicates
        8. Return single JSON object

        EXAMPLE COMBINATION SCENARIO:
        Section 1: McDonald's breakfast items
        Section 2: McDonald's lunch items (same receipt continuation)
        Result: Single McDonald's receipt with all items combined, duplicates removed, quantities summed

        EXAMPLE OUTPUT:
        {
          "merchantName": "McDonald's",
          "amount": 456.50,
          "date": "2024-01-15",
          "category": "restaurant",
          "items": [
            {"name": "Big Mac", "price": 120.00, "quantity": 2},
            {"name": "Fries Large", "price": 85.00, "quantity": 1},
            {"name": "Coke", "price": 45.00, "quantity": 3}
          ],
          "otherDetails": [
            {"key": "payment_method", "value": "Card"},
            {"key": "store_location", "value": "Makati City"}
          ]
        }

        ${ocrText}

        Return ONLY a single valid JSON object representing the combined receipt data.
    `;

      const startTime = Date.now();

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_completion_tokens: 2000,
      });

      const endTime = Date.now();
      const processingTimeMs = endTime - startTime;

      if (!response.choices[0].message.content) {
        this.logger.error('No response from LLM');
        await this.llmRepository.update(llmRecord.id, {
          status: 'failed',
          errorMessage: 'No response from LLM',
        });

        throw new InternalServerErrorException(
          'Something went wrong while analyzing the receipt data',
        );
      }

      const rawData = response.choices[0].message.content.trim();
      const analyzedData = this.sanitizeData(rawData);

      await this.llmRepository.update(llmRecord.id, {
        extractedData: analyzedData,
        processingTimeMs,
        status: 'completed',
      });

      return {
        llmResultId: llmRecord.id,
        data: analyzedData,
      };
    } catch (error) {
      await this.llmRepository.update(llmRecord.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      this.logger.error(error);
      throw new InternalServerErrorException(
        'Something went wrong while analyzing the receipt data',
      );
    }
  }

  private sanitizeData(data: string): IExtractedData {
    const jsonData = JSON.parse(data) as IExtractedData;

    const merchantName = jsonData.merchantName || 'Merchant Name';
    const amount = jsonData.amount ? Number(jsonData.amount) : 1.0;
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
