import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  CustomerHistoryEntry,
  CustomerHistoryEntryType,
} from './entities/customer-history-entry.entity';
import { CreateCustomerHistoryEntryDto } from './dto/create-customer-history-entry.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(CustomerHistoryEntry)
    private customerHistoryRepository: Repository<CustomerHistoryEntry>,
  ) {}

  private toSignedAmount(
    entryType: CustomerHistoryEntryType,
    amount: number,
  ): number {
    const normalizedAmount = Number(amount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (entryType === CustomerHistoryEntryType.PAYMENT) {
      return -normalizedAmount;
    }

    return normalizedAmount;
  }

  private async applyCustomerAmountDelta(
    customerRepo: Repository<Customer>,
    customerId: number,
    delta: number,
  ): Promise<Customer> {
    const customer = await customerRepo.findOneBy({ id: customerId });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const nextAmount = Number(customer.amount) + Number(delta);
    if (nextAmount < 0) {
      throw new BadRequestException(
        'Paid amount cannot exceed customer balance',
      );
    }

    customer.amount = Number(nextAmount.toFixed(2));
    return customerRepo.save(customer);
  }

  private async createHistoryEntry(
    historyRepo: Repository<CustomerHistoryEntry>,
    payload: Partial<CustomerHistoryEntry>,
  ): Promise<CustomerHistoryEntry> {
    const entry = historyRepo.create({
      ...payload,
      amount: Number(payload.amount ?? 0).toFixed(2) as unknown as number,
      note:
        typeof payload.note === 'string' && payload.note.trim() !== ''
          ? payload.note.trim()
          : null,
    });

    return historyRepo.save(entry);
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customersRepository.manager.transaction(async (manager) => {
      const customerRepo = manager.getRepository(Customer);
      const historyRepo = manager.getRepository(CustomerHistoryEntry);
      const initialAmount = Number(createCustomerDto.amount) || 0;

      const customer = customerRepo.create({
        ...createCustomerDto,
        amount: initialAmount,
      });
      const savedCustomer = await customerRepo.save(customer);

      if (initialAmount > 0) {
        await this.createHistoryEntry(historyRepo, {
          customer_id: savedCustomer.id,
          type: CustomerHistoryEntryType.ADJUSTMENT,
          amount: initialAmount,
          note: 'رصيد افتتاحي',
        });
      }

      return savedCustomer;
    });
  }

  async findAll(): Promise<Customer[]> {
    return this.customersRepository.find();
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customersRepository.findOneBy({ id });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customersRepository.manager.transaction(async (manager) => {
      const customerRepo = manager.getRepository(Customer);
      const historyRepo = manager.getRepository(CustomerHistoryEntry);
      const customer = await customerRepo.findOneBy({ id });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      const nextAmount =
        updateCustomerDto.amount !== undefined
          ? Number(updateCustomerDto.amount)
          : Number(customer.amount);
      const delta = Number((nextAmount - Number(customer.amount)).toFixed(2));

      Object.assign(customer, {
        ...updateCustomerDto,
        amount: nextAmount,
      });

      const savedCustomer = await customerRepo.save(customer);

      if (delta !== 0) {
        await this.createHistoryEntry(historyRepo, {
          customer_id: savedCustomer.id,
          type: CustomerHistoryEntryType.ADJUSTMENT,
          amount: delta,
          note: 'تعديل يدوي من شاشة العملاء',
        });
      }

      return savedCustomer;
    });
  }

  async findHistory(id: number) {
    const customer = await this.findOne(id);
    const entries = await this.customerHistoryRepository.find({
      where: { customer_id: id },
      relations: ['invoice'],
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    let runningBalance = 0;
    const history = entries.map((entry) => {
      runningBalance += Number(entry.amount);

      return {
        id: entry.id,
        type: entry.type,
        amount: Number(entry.amount),
        note: entry.note ?? null,
        createdAt: entry.createdAt,
        invoice_id: entry.invoice_id ?? null,
        invoice_number: entry.invoice?.invoice_number ?? null,
        balance_after: Number(runningBalance.toFixed(2)),
      };
    });

    return {
      customer,
      history: history.reverse(),
      current_amount: Number(customer.amount),
    };
  }

  async addHistoryEntry(
    customerId: number,
    createCustomerHistoryEntryDto: CreateCustomerHistoryEntryDto,
  ) {
    return this.customersRepository.manager.transaction(async (manager) => {
      const customerRepo = manager.getRepository(Customer);
      const historyRepo = manager.getRepository(CustomerHistoryEntry);
      const signedAmount = this.toSignedAmount(
        createCustomerHistoryEntryDto.type,
        createCustomerHistoryEntryDto.amount,
      );

      const customer = await this.applyCustomerAmountDelta(
        customerRepo,
        customerId,
        signedAmount,
      );

      const entry = await this.createHistoryEntry(historyRepo, {
        customer_id: customer.id,
        type: createCustomerHistoryEntryDto.type,
        amount: signedAmount,
        note: createCustomerHistoryEntryDto.note,
      });

      return {
        customer,
        entry: {
          ...entry,
          amount: Number(entry.amount),
        },
      };
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    const customer = await this.findOne(id);
    await this.customersRepository.remove(customer);
    return { message: `Customer with ID ${id} has been deleted` };
  }
}
