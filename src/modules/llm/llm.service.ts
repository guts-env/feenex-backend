import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OPENAI_API_KEY_CONFIG_KEY } from '@/config/keys.config';
import { LLmRepository } from '@/modules/llm/llm.repository';
import { CategoriesService } from '@/modules/categories/categories.service';
import { DEFAULT_CATEGORY_ID_CONFIG_KEY } from '@/config/keys.config';
import { type IExtractedData } from '@/modules/llm/types/llm';
import BaseCategoryResDto from '@/modules/categories/dto/base-category-res.dto';

@Injectable()
export class LlmService {
  private client: OpenAI;
  private readonly model = 'gpt-3.5-turbo';
  private readonly logger = new Logger(LlmService.name);
  private readonly defaultCategoryId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly llmRepository: LLmRepository,
    private readonly categoriesService: CategoriesService,
  ) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>(OPENAI_API_KEY_CONFIG_KEY)!,
    });
    this.defaultCategoryId = this.configService.get<string>(
      DEFAULT_CATEGORY_ID_CONFIG_KEY,
    )!;
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
      const categories = await this.categoriesService.getCategories();
      const categoryNames = categories
        .map((cat) => cat.name.toLowerCase())
        .join('|');

      const prompt = `
        CONTEXT: Multi-tenant expense tracking SaaS for Philippines SMBs with OCR processing.

        INPUT FORMAT: OCR text from multiple photos separated by "RECEIPT SEPARATOR" string.

        Extract and COMBINE receipt data into a SINGLE JSON object conforming to this interface:
        {
          "merchantName": "string",
          "amount": number,
          "invoiceDate": "YYYY-MM-DD|null",
          "paymentDate": "YYYY-MM-DD|null",
          "category": "${categoryNames}",
          "items": [{"name": "string", "price": number, "quantity": number}],
          "orNumber": "string|null",
          "isVat": boolean,
          "vat": number|null
        }

        RECEIPT SEPARATOR PROCESSING & COMBINATION:
        - Split input text by "RECEIPT SEPARATOR" to identify individual receipt sections
        - Process each section to extract data, then MERGE into single receipt object
        - Combine all line items from all sections into single "items" array
        - Aggregate amounts from all sections into single total "amount"
        - Use the FIRST valid merchantName found (prioritize clearest/most complete)
        - Use the EARLIEST date found across all sections
        - Choose most specific category (restaurant > grocery > other)

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
        - Choose the most appropriate category from the available options: ${categoryNames}
        - Match merchant type and items to these categories:
          * Food & Dining: Restaurants, fast food, takeout
          * Groceries: Food, toiletries, household items
          * Transportation: Gas, public transit, ride-sharing
          * Shopping: Clothing, electronics, general retail
          * Bills & Utilities: Rent, electricity, phone, internet
          * Entertainment: Movies, concerts, subscriptions, games
          * Healthcare: Medical, pharmacy, insurance
          * Equipment: Office supplies, equipment, software
          * Packaging: Packaging materials, shipping, delivery
          * Business: Business-related expenses
          * Other: Miscellaneous expenses
        - If sections have conflicting categories, use the most specific/appropriate category
        - If no clear match, use "Other"

        VAT AND OR NUMBER EXTRACTION:
        - "orNumber": Extract OR (Official Receipt) number from receipt - look for "OR #", "OR No.", "Receipt No.", "Invoice No."
        - "isVat": Boolean indicating if this is a VAT receipt - look for "VAT REG TIN", "VATABLE", "VAT EXEMPT", BIR permit numbers
        - "vat": Extract VAT amount if present - look for "VAT 12%", "VAT AMOUNT", "Value Added Tax", separate VAT line items
        - If multiple OR numbers found across sections: combine with semicolon
        - If any section shows VAT indicators: set isVat to true
        - Sum all VAT amounts found across sections


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
        7. Return single JSON object

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
          "orNumber": "OR-2024-001234",
          "isVat": true,
          "vat": 54.78
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

      const categoryId = this.resolveCategoryId(
        analyzedData.category,
        categories,
      );

      analyzedData.categoryId = categoryId;

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
    const invoiceDate = jsonData.invoiceDate || new Date().toISOString();
    const paymentDate =
      jsonData.paymentDate || jsonData.invoiceDate || new Date().toISOString();
    const category = jsonData.category || 'Other';
    const items = jsonData.items || [];
    const orNumber = jsonData.orNumber || null;
    const isVat = jsonData.isVat || false;
    const vat = jsonData.vat ? Number(jsonData.vat) : null;

    return {
      merchantName,
      amount,
      invoiceDate,
      paymentDate,
      category,
      items,
      orNumber,
      isVat,
      vat,
    };
  }

  private resolveCategoryId(
    categoryName: string,
    categories: BaseCategoryResDto[],
  ): string {
    const matchedCategory = categories.find(
      (cat) => cat.name.toLowerCase() === categoryName.toLowerCase(),
    );

    if (matchedCategory) {
      return matchedCategory.id;
    }

    return this.defaultCategoryId;
  }
}
