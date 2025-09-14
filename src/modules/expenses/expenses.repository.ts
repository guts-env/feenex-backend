import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/common/modules/base/base.repository';
import { CreateExpenseDto } from '@/modules/expenses/dto/create-expense.dto';
import UpdateExpenseDto from '@/modules/expenses/dto/update-expense.dto';
import GetExpensesDto from '@/modules/expenses/dto/get-expenses.dto';
import {
  type IExpenseItem,
  type IExpenseOtherDetails,
  type IBaseRepositoryExpense,
} from '@/modules/expenses/types/expenses';
import {
  type ExpenseSource,
  type ExpenseStatus,
  type CurrencyCode,
  type ProcessingStatus,
} from '@/database/types/db';
import { SelectQueryBuilder } from 'kysely';

@Injectable()
export class ExpensesRepository extends BaseRepository {
  private addExpenseSelections(query: SelectQueryBuilder<any, any, any>) {
    return query.select([
      'e.id',
      'e.amount',
      'e.items',
      'e.other_details',
      'e.source',
      'e.status',
      'e.merchant_name',
      'e.currency',
      'e.date',
      'e.description',
      'e.photos',
      'e.created_at',
      'e.updated_at',
      'e.verified_at',
      'c.id as category_id',
      'c.name as category_name',
      'u.id as created_by',
      'u.first_name as created_by_first_name',
      'u.middle_name as created_by_middle_name',
      'u.last_name as created_by_last_name',
      'u.email as created_by_email',
      'u2.id as updated_by',
      'u2.first_name as updated_by_first_name',
      'u2.middle_name as updated_by_middle_name',
      'u2.last_name as updated_by_last_name',
      'u2.email as updated_by_email',
      'u3.id as verified_by',
      'u3.first_name as verified_by_first_name',
      'u3.middle_name as verified_by_middle_name',
      'u3.last_name as verified_by_last_name',
      'u3.email as verified_by_email',
    ]);
  }

  private get baseQuery() {
    return this.addExpenseSelections(
      this.db
        .selectFrom('expenses as e')
        .innerJoin('categories as c', 'e.category_id', 'c.id')
        .innerJoin('users as u', 'e.created_by', 'u.id')
        .innerJoin('users as u2', 'e.updated_by', 'u2.id')
        .leftJoin('users as u3', 'e.verified_by', 'u3.id'),
    );
  }

  private transformExpenseRow(
    row: Record<string, any>,
  ): IBaseRepositoryExpense {
    const result: IBaseRepositoryExpense = {
      id: row['id'] as string,
      amount: row['amount'] ? Number(row['amount']) : 1.0,
      currency: row['currency'] as CurrencyCode,
      date: row['date'] as Date,
      description: row['description'] as string | null,
      merchant_name: row['merchant_name'] as string,
      photos: row['photos'] as string[] | null,
      source: row['source'] as ExpenseSource,
      status: row['status'] as ExpenseStatus,
      created_at: row['created_at'] as Date,
      updated_at: row['updated_at'] as Date,
      verified_at: row['verified_at'] as Date | null,
      category: {
        id: row['category_id'] as string,
        name: row['category_name'] as string,
      },
      items: row['items'] as IExpenseItem[],
      other_details: row['other_details'] as IExpenseOtherDetails[],
      created_by: {
        id: row['created_by'] as string,
        first_name: row['created_by_first_name'] as string,
        last_name: row['created_by_last_name'] as string,
        middle_name: row['created_by_middle_name'] as string,
      },
      updated_by: {
        id: row['updated_by'] as string,
        first_name: row['updated_by_first_name'] as string,
        last_name: row['updated_by_last_name'] as string,
        middle_name: row['updated_by_middle_name'] as string,
      },
      verified_by: row['verified_by']
        ? {
            id: row['verified_by'] as string,
            first_name: row['verified_by_first_name'] as string,
            last_name: row['verified_by_last_name'] as string,
            middle_name: row['verified_by_middle_name'] as string,
          }
        : null,
    };

    return result;
  }

  async getExpenses(
    orgId: string,
    query: GetExpensesDto,
  ): Promise<{ count: number; data: IBaseRepositoryExpense[] }> {
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
      orderBy,
    } = query;

    try {
      let expensesBaseQuery = this.db
        .selectFrom('expenses as e')
        .innerJoin('categories as c', 'e.category_id', 'c.id')
        .innerJoin('users as u', 'e.created_by', 'u.id')
        .innerJoin('users as u2', 'e.updated_by', 'u2.id')
        .leftJoin('users as u3', 'e.verified_by', 'u3.id')
        .where('e.organization_id', '=', orgId);

      if (categories && categories.length > 0) {
        expensesBaseQuery = expensesBaseQuery.where(
          'e.category_id',
          'in',
          categories,
        );
      }

      if (createdByUsers && createdByUsers.length > 0) {
        expensesBaseQuery = expensesBaseQuery.where(
          'e.created_by',
          'in',
          createdByUsers,
        );
      }

      if (verifiedByUsers && verifiedByUsers.length > 0) {
        expensesBaseQuery = expensesBaseQuery.where(
          'e.verified_by',
          'in',
          verifiedByUsers,
        );
      }

      if (startDate) {
        expensesBaseQuery = expensesBaseQuery.where('e.date', '>=', startDate);
      }

      if (endDate) {
        expensesBaseQuery = expensesBaseQuery.where('e.date', '<=', endDate);
      }

      if (minAmount) {
        expensesBaseQuery = expensesBaseQuery.where(
          'e.amount',
          '>=',
          minAmount,
        );
      }

      if (maxAmount) {
        expensesBaseQuery = expensesBaseQuery.where(
          'e.amount',
          '<=',
          maxAmount,
        );
      }

      if (status && status.length > 0) {
        expensesBaseQuery = expensesBaseQuery.where('e.status', 'in', status);
      }

      if (search) {
        expensesBaseQuery = expensesBaseQuery.where((eb) =>
          eb.or([
            eb('e.merchant_name', 'ilike', `%${search}%`),
            eb('e.description', 'ilike', `%${search}%`),
          ]),
        );
      }

      let dbQuery = this.addExpenseSelections(expensesBaseQuery);
      const countQuery = expensesBaseQuery.select(({ fn }) => [
        fn.countAll().as('count'),
      ]);

      if (orderBy) {
        dbQuery = dbQuery.orderBy(`e.${orderBy.field}`, orderBy.order);
      } else {
        dbQuery = dbQuery.orderBy('e.created_at', 'desc');
      }

      if (offset !== undefined) {
        dbQuery = dbQuery.offset(offset);
      }
      if (limit !== undefined) {
        dbQuery = dbQuery.limit(limit);
      }

      const [rows, countResult] = await Promise.all([
        dbQuery.execute(),
        countQuery.executeTakeFirst(),
      ]);

      const count = countResult ? Number(countResult.count) : 0;

      return {
        count,
        data: rows.map((item) => this.transformExpenseRow(item)),
      };
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async create(
    orgId: string,
    userId: string,
    payload: CreateExpenseDto & {
      processingStatus: ProcessingStatus;
      verifiedBy?: string;
      verifiedAt?: Date;
    },
  ): Promise<{
    id: string;
    organization_id: string;
    merchant_name: string;
    amount: number;
  }> {
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
      processingStatus,
      status,
    } = payload;

    try {
      const expense = await this.db
        .insertInto('expenses')
        .values({
          organization_id: orgId,
          user_id: userId,
          category_id: categoryId,
          merchant_name: merchantName,
          amount,
          currency: (currency as CurrencyCode) || 'PHP',
          date,
          description: description || null,
          items: items ? JSON.stringify(items) : null,
          other_details: otherDetails ? JSON.stringify(otherDetails) : null,
          source,
          status,
          processing_status: processingStatus,
          photos: photos || null,
          ocr_result_id: ocrResultId || null,
          llm_result_id: llmResultId || null,
          created_by: userId,
          updated_by: userId,
        })
        .returning(['id', 'organization_id', 'merchant_name', 'amount'])
        .executeTakeFirstOrThrow();

      return {
        ...expense,
        amount: Number(expense.amount),
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async update(
    id: string,
    userId: string,
    orgId: string,
    dto: UpdateExpenseDto,
  ): Promise<IBaseRepositoryExpense> {
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

    const updateObj = {};

    if (categoryId !== undefined) updateObj['category_id'] = categoryId;
    if (merchantName !== undefined) updateObj['merchant_name'] = merchantName;
    if (amount !== undefined) updateObj['amount'] = amount;
    if (date !== undefined) updateObj['date'] = date;
    if (description !== undefined) updateObj['description'] = description;
    if (items !== undefined) updateObj['items'] = JSON.stringify(items);
    if (otherDetails !== undefined)
      updateObj['other_details'] = JSON.stringify(otherDetails);
    if (photos !== undefined) updateObj['photos'] = photos;

    updateObj['updated_by'] = userId;
    updateObj['updated_at'] = new Date();

    try {
      const updatedExpense = await this.db
        .updateTable('expenses')
        .set(updateObj)
        .where('id', '=', id)
        .where('organization_id', '=', orgId)
        .returningAll()
        .executeTakeFirstOrThrow();

      const result = await this.addExpenseSelections(
        this.db
          .selectFrom('expenses as e')
          .innerJoin('categories as c', 'e.category_id', 'c.id')
          .innerJoin('users as u', 'e.created_by', 'u.id')
          .innerJoin('users as u2', 'e.updated_by', 'u2.id')
          .leftJoin('users as u3', 'e.verified_by', 'u3.id'),
      )
        .where('e.id', '=', updatedExpense.id)
        .executeTakeFirstOrThrow();

      return this.transformExpenseRow(result);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findById(id: string, orgId: string): Promise<IBaseRepositoryExpense> {
    try {
      const result = await this.baseQuery
        .where('e.id', '=', id)
        .where('e.organization_id', '=', orgId)
        .executeTakeFirstOrThrow();

      return this.transformExpenseRow(result);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async verify(id: string, userId: string, orgId: string) {
    try {
      const verifiedExpense = await this.db
        .updateTable('expenses')
        .set({
          status: 'verified',
          verified_by: userId,
          updated_by: userId,
          updated_at: new Date(),
          verified_at: new Date(),
        })
        .where('id', '=', id)
        .where('organization_id', '=', orgId)
        .returningAll()
        .executeTakeFirstOrThrow();

      return verifiedExpense;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async delete(id: string, orgId: string) {
    try {
      await this.db
        .deleteFrom('expenses')
        .where('id', '=', id)
        .where('organization_id', '=', orgId)
        .execute();
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
