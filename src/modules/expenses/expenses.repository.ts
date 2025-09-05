import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { BaseRepository } from '@/common/modules/base/base.repository';
import { DatabaseService } from '@/database/database.service';
import {
  CreateExpenseDto,
  IExpenseValue,
} from '@/modules/expenses/dto/create-expense.dto';
import UpdateExpenseDto from '@/modules/expenses/dto/update-expense.dto';
import GetExpensesDto, {
  GetExpensesDtoValues,
} from '@/modules/expenses/dto/get-expenses.dto';
import {
  ExpenseStatusEnum,
  CurrencyCodeEnum,
  SortOrderEnum,
} from '@/common/constants/enums';
import { type IRepositoryExpense } from '@/modules/expenses/types/expenses';

@Injectable()
export class ExpensesRepository extends BaseRepository {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async getExpenses(
    orgId: string,
    query: GetExpensesDto,
  ): Promise<IRepositoryExpense[]> {
    const {
      categories,
      createdByUsers,
      verifiedByUsers,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      status,
      search,
      offset,
      limit,
      sortBy,
      sortOrder,
    } = query;

    let conditionIndex = 2;
    const conditions: string[] = [];
    const params: GetExpensesDtoValues = [];

    if (categories && categories.length > 0) {
      const categoryPlaceholders = categories
        .map(() => `$${conditionIndex++}`)
        .join(', ');
      conditions.push(`e.category_id IN (${categoryPlaceholders})`);
      params.push(...categories);
    }

    if (createdByUsers && createdByUsers.length > 0) {
      const userPlaceholders = createdByUsers
        .map(() => `$${conditionIndex++}`)
        .join(', ');
      conditions.push(`e.created_by IN (${userPlaceholders})`);
      params.push(...createdByUsers);
    }

    if (verifiedByUsers && verifiedByUsers.length > 0) {
      const verifierPlaceholders = verifiedByUsers
        .map(() => `$${conditionIndex++}`)
        .join(', ');
      conditions.push(`e.verified_by IN (${verifierPlaceholders})`);
      params.push(...verifiedByUsers);
    }

    if (startDate) {
      conditions.push(`e.date >= $${conditionIndex}`);
      params.push(startDate);
      conditionIndex++;
    }

    if (endDate) {
      conditions.push(`e.date <= $${conditionIndex}`);
      params.push(endDate);
      conditionIndex++;
    }

    if (minAmount) {
      conditions.push(`e.amount >= $${conditionIndex}`);
      params.push(minAmount);
      conditionIndex++;
    }

    if (maxAmount) {
      conditions.push(`e.amount <= $${conditionIndex}`);
      params.push(maxAmount);
      conditionIndex++;
    }

    if (status) {
      const statusPlaceholders = status
        .map(() => `$${conditionIndex++}`)
        .join(', ');
      conditions.push(`e.status IN (${statusPlaceholders})`);
      params.push(...status);
    }

    if (search) {
      conditions.push(
        `(e.merchant_name ILIKE $${conditionIndex} OR e.description ILIKE $${conditionIndex})`,
      );
      params.push(`%${search}%`);
      conditionIndex++;
    }

    let queryStatement =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    if (sortBy) {
      /* TODO: replace with proper sorting logic */
      queryStatement += `ORDER BY e.created_at `;
    } else {
      queryStatement += `ORDER BY e.created_at `;
    }

    if (sortOrder) {
      queryStatement += `$${sortOrder} `;
      params.push(sortOrder);
      conditionIndex++;
    } else {
      queryStatement += `${SortOrderEnum.DESC} `;
    }

    if (offset) {
      queryStatement += `OFFSET $${conditionIndex} `;
      params.push(offset);
      conditionIndex++;
    }

    if (limit) {
      queryStatement += `LIMIT $${conditionIndex}`;
      params.push(limit);
    }

    try {
      const result: QueryResult<IRepositoryExpense> =
        await this.db.isolatedQuery(
          `
            SELECT e.*
            FROM expenses e
            ${queryStatement}
          `,
          [...params],
          orgId,
        );

      return result.rows;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async create(orgId: string, userId: string, dto: CreateExpenseDto) {
    const {
      categoryId,
      merchantName,
      amount,
      date,
      description,
      items,
      otherDetails,
      photos,
      currency,
      ocrResultId,
      llmResultId,
      source,
    } = dto;

    try {
      await this.db.query(
        `
        INSERT INTO expenses (
          organization_id,
          user_id,
          category_id,
          merchant_name,
          amount,
          currency,
          date,
          description,
          items,
          other_details,
          source,
          status,
          photos,
          ocr_result_id,
          llm_result_id,
          created_by,
          updated_by
        ) 
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17
        ) 
        RETURNING *
      `,
        [
          orgId, // $1
          userId, // $2
          categoryId, // $3
          merchantName, // $4
          amount, // $5
          currency || CurrencyCodeEnum.PHP, // $6
          date, // $7
          description || null, // $8
          items ? JSON.stringify(items) : null, // $9
          otherDetails ? JSON.stringify(otherDetails) : null, // $10
          source, // $11
          ExpenseStatusEnum.PENDING, // $12
          photos || null, // $13
          ocrResultId || null, // $14
          llmResultId || null, // $15
          userId, // $16
          userId, // $17
        ],
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async update(
    id: string,
    userId: string,
    orgId: string,
    dto: UpdateExpenseDto,
  ): Promise<IRepositoryExpense | null> {
    const {
      categoryId,
      merchantName,
      amount,
      date,
      description,
      items,
      otherDetails,
      photos,
    } = dto;

    try {
      const fields: Map<keyof IRepositoryExpense, IExpenseValue> = new Map();

      if (categoryId !== undefined) {
        fields.set('category_id', categoryId);
      }

      if (merchantName !== undefined) {
        fields.set('merchant_name', merchantName);
      }

      if (amount !== undefined) {
        fields.set('amount', amount);
      }

      if (date !== undefined) {
        fields.set('date', date);
      }

      if (description !== undefined) {
        fields.set('description', description);
      }

      if (items !== undefined) {
        fields.set('items', items);
      }

      if (otherDetails !== undefined) {
        fields.set('other_details', otherDetails);
      }

      if (photos !== undefined) {
        fields.set('photos', photos);
      }

      fields.set('updated_by', userId);
      fields.set('updated_at', new Date().toISOString());

      const fieldNames = Array.from(fields.keys());
      const fieldValues = Array.from(fields.values());

      const setClause = fieldNames
        .map((field, index) => `${field} = $${index + 1}`)
        .join(', ');

      const idParamIndex = fieldValues.length + 1;

      const result: QueryResult<IRepositoryExpense> =
        await this.db.isolatedQuery(
          `
          UPDATE expenses 
          SET ${setClause}
          WHERE id = $${idParamIndex}
          RETURNING *
        `,
          [id],
          orgId,
        );

      return result.rows[0];
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findById(
    id: string,
    orgId: string,
  ): Promise<IRepositoryExpense | null> {
    try {
      const result: QueryResult<IRepositoryExpense> =
        await this.db.isolatedQuery(
          `SELECT * FROM expenses WHERE id = $1`,
          [id],
          orgId,
        );

      return result.rows[0] || null;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async verify(id: string, userId: string, orgId: string) {
    try {
      await this.db.isolatedQuery(
        `UPDATE expenses SET status = $1, verified_by = $2 WHERE id = $3`,
        [ExpenseStatusEnum.VERIFIED, userId, id],
        orgId,
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async delete(id: string, orgId: string) {
    try {
      await this.db.isolatedQuery(
        `DELETE FROM expenses WHERE id = $1`,
        [id],
        orgId,
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
