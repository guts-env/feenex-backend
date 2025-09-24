import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder, sql } from 'kysely';
import { BaseRepository } from '@/common/modules/base/base.repository';
import { CreateExpenseDto } from '@/modules/expenses/dto/create-expense.dto';
import UpdateExpenseDto from '@/modules/expenses/dto/update-expense.dto';
import GetExpensesDto from '@/modules/expenses/dto/get-expenses.dto';
import {
  GetTotalExpensesDto,
  GetTotalExpensesResDto,
} from '@/modules/expenses/dto/get-total-expenses.dto';
import {
  type IExpenseItem,
  type IBaseRepositoryExpense,
} from '@/modules/expenses/types/expenses';
import {
  type ExpenseSource,
  type ExpenseStatus,
  type CurrencyCode,
  type ProcessingStatus,
  UserRole,
} from '@/database/types/db';
import { getCurrentMonth } from '@/utils/date.utils';

@Injectable()
export class ExpensesRepository extends BaseRepository {
  private addExpenseSelections(query: SelectQueryBuilder<any, any, any>) {
    return query.select([
      'e.id',
      'e.amount',
      'e.items',
      'e.source',
      'e.status',
      'e.processing_status',
      'e.merchant_name',
      'e.currency',
      'e.invoice_date',
      'e.payment_date',
      'e.description',
      'e.or_number',
      'e.is_vat',
      'e.vat',
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
      invoice_date: row['invoice_date'] as Date,
      payment_date: row['payment_date'] as Date,
      or_number: row['or_number'] as string | null,
      is_vat: row['is_vat'] as boolean | null,
      vat: row['vat'] ? Number(row['vat']) : null,
      description: row['description'] as string | null,
      merchant_name: row['merchant_name'] as string,
      photos: row['photos'] as string[] | null,
      source: row['source'] as ExpenseSource,
      status: row['status'] as ExpenseStatus,
      processing_status: row['processing_status'] as ProcessingStatus,
      created_at: row['created_at'] as Date,
      updated_at: row['updated_at'] as Date,
      verified_at: row['verified_at'] as Date | null,
      category: {
        id: row['category_id'] as string,
        name: row['category_name'] as string,
      },
      items: row['items'] as IExpenseItem[],
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
    roleName: UserRole,
    query: GetExpensesDto,
  ): Promise<{ count: number; data: IBaseRepositoryExpense[] }> {
    const {
      categoryIds,
      // createdByUsers,
      // verifiedByUsers,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      statuses,
      search,
      isVat,
      isSubscription,
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

      if (roleName === 'member') {
        expensesBaseQuery = expensesBaseQuery.where(
          'e.status',
          '!=',
          'verified',
        );
      }

      if (roleName === 'manager') {
        const today = new Date();
        const startOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        const endOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1,
        );

        expensesBaseQuery = expensesBaseQuery.where((eb) =>
          eb.or([
            eb('e.status', '!=', 'verified'),
            eb.and([
              eb('e.status', '=', 'verified'),
              eb('e.verified_at', '>=', startOfDay),
              eb('e.verified_at', '<', endOfDay),
            ]),
          ]),
        );
      }

      if (categoryIds && categoryIds.length > 0) {
        expensesBaseQuery = expensesBaseQuery.where(
          'e.category_id',
          'in',
          categoryIds,
        );
      }

      // if (createdByUsers && createdByUsers.length > 0) {
      //   expensesBaseQuery = expensesBaseQuery.where(
      //     'e.created_by',
      //     'in',
      //     createdByUsers,
      //   );
      // }

      // if (verifiedByUsers && verifiedByUsers.length > 0) {
      //   expensesBaseQuery = expensesBaseQuery.where(
      //     'e.verified_by',
      //     'in',
      //     verifiedByUsers,
      //   );
      // }

      if (startDate) {
        expensesBaseQuery = expensesBaseQuery.where(
          'e.payment_date',
          '>=',
          startDate,
        );
      }

      if (endDate) {
        expensesBaseQuery = expensesBaseQuery.where(
          'e.payment_date',
          '<=',
          endDate,
        );
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

      if (statuses && statuses.length > 0) {
        expensesBaseQuery = expensesBaseQuery.where('e.status', 'in', statuses);
      }

      if (search) {
        expensesBaseQuery = expensesBaseQuery.where((eb) =>
          eb.or([
            eb('e.merchant_name', 'ilike', `%${search}%`),
            eb('e.description', 'ilike', `%${search}%`),
            eb('e.or_number', 'ilike', `%${search}%`),
          ]),
        );
      }

      if (isVat !== undefined) {
        expensesBaseQuery = expensesBaseQuery.where('e.is_vat', '=', isVat);
      }

      if (isSubscription !== undefined) {
        expensesBaseQuery = expensesBaseQuery.where(
          'e.is_subscription',
          '=',
          isSubscription,
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
      invoiceDate,
      paymentDate,
      description,
      items,
      photos,
      currency,
      ocrResultId,
      llmResultId,
      source,
      processingStatus,
      status,
      orNumber,
      isVat,
      vat,
      verifiedBy,
      verifiedAt,
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
          invoice_date: invoiceDate,
          payment_date: paymentDate || invoiceDate,
          description: description || null,
          items: items ? JSON.stringify(items) : null,
          source,
          status,
          processing_status: processingStatus,
          photos: photos || null,
          ocr_result_id: ocrResultId || null,
          llm_result_id: llmResultId || null,
          or_number: orNumber || null,
          is_vat: isVat || null,
          vat: vat || null,
          verified_by: verifiedBy,
          verified_at: verifiedAt,
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
    dto: UpdateExpenseDto & { processingStatus?: ProcessingStatus },
  ): Promise<IBaseRepositoryExpense> {
    const {
      categoryId,
      merchantName,
      amount,
      invoiceDate,
      paymentDate,
      description,
      items,
      photos,
      status,
      processingStatus,
      orNumber,
      isVat,
      vat,
    } = dto;

    const updateObj = {};

    if (categoryId !== undefined) updateObj['category_id'] = categoryId;
    if (merchantName !== undefined) updateObj['merchant_name'] = merchantName;
    if (amount !== undefined) updateObj['amount'] = amount;
    if (invoiceDate !== undefined) updateObj['invoice_date'] = invoiceDate;
    if (paymentDate !== undefined) updateObj['payment_date'] = paymentDate;
    if (description !== undefined) updateObj['description'] = description;
    if (items !== undefined) updateObj['items'] = JSON.stringify(items);
    if (photos !== undefined) updateObj['photos'] = photos;
    if (orNumber !== undefined) updateObj['or_number'] = orNumber;
    if (isVat !== undefined) updateObj['is_vat'] = isVat;
    if (vat !== undefined) updateObj['vat'] = vat;
    if (status !== undefined) updateObj['status'] = status;
    if (status === 'verified') {
      updateObj['verified_by'] = userId;
      updateObj['verified_at'] = new Date();
    } else {
      updateObj['verified_by'] = null;
      updateObj['verified_at'] = null;
    }
    if (processingStatus !== undefined)
      updateObj['processing_status'] = processingStatus;

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

  async getTotalExpenses(
    orgId: string,
    dto: GetTotalExpensesDto,
  ): Promise<GetTotalExpensesResDto> {
    try {
      const startDate = dto.startDate
        ? new Date(dto.startDate)
        : getCurrentMonth().startDate;
      const endDate = dto.endDate
        ? new Date(dto.endDate)
        : getCurrentMonth().endDate;

      const result = await this.db
        .selectFrom('expenses')
        .select(({ fn }) => [
          fn.sum<number>('amount').as('total_expenses'),
          fn.count<number>('id').as('total_count'),
          sql<number>`SUM(CASE WHEN status = 'verified' THEN amount ELSE 0 END)`.as(
            'verified_total',
          ),
          sql<number>`SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END)`.as(
            'unverified_total',
          ),
          sql<number>`COUNT(CASE WHEN source = 'ocr' THEN 1 END)`.as(
            'receipts_processed',
          ),
        ])
        .where('organization_id', '=', orgId)
        .where('payment_date', '>=', startDate)
        .where('payment_date', '<=', endDate)
        .executeTakeFirst()
        .then(
          (result) =>
            result ?? {
              total_expenses: 0,
              total_count: 0,
              verified_total: 0,
              unverified_total: 0,
              receipts_processed: 0,
            },
        );

      return {
        total: Number(result.total_expenses || 0),
        count: Number(result.total_count || 0),
        verified: Number(result.verified_total || 0),
        unverified: Number(result.unverified_total || 0),
        receiptsProcessed: Number(result.receipts_processed || 0),
        dateRange: { startDate, endDate },
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
