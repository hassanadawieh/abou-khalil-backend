import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceItem, ItemType } from '../items/entities/invoice-item.entity';
import { CeramicItem } from '../items/entities/ceramic-item.entity';
import { HealthyItem } from '../items/entities/healthy-item.entity';
import { Customer } from '../customers/entities/customer.entity';
import {
  CustomerHistoryEntry,
  CustomerHistoryEntryType,
} from '../customers/entities/customer-history-entry.entity';

type InvoiceItemInput = {
  item_type: ItemType;
  item_id: number;
  quantity: number;
  place?: string;
};

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemsRepository: Repository<InvoiceItem>,
    @InjectRepository(CeramicItem)
    private ceramicItemsRepository: Repository<CeramicItem>,
    @InjectRepository(HealthyItem)
    private healthyItemsRepository: Repository<HealthyItem>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(CustomerHistoryEntry)
    private customerHistoryRepository: Repository<CustomerHistoryEntry>,
  ) {}

  private async applyCustomerAmountDelta(
    customerRepo: Repository<Customer>,
    customerId: number,
    delta: number,
  ): Promise<void> {
    const customer = await customerRepo.findOne({ where: { id: customerId } });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    customer.amount = Number(
      (Number(customer.amount) + Number(delta)).toFixed(2),
    );
    await customerRepo.save(customer);
  }

  private async upsertInvoiceCustomerHistory(
    historyRepo: Repository<CustomerHistoryEntry>,
    invoiceId: number,
    customerId: number,
    amount: number,
  ): Promise<void> {
    const existingEntry = await historyRepo.findOne({
      where: { invoice_id: invoiceId },
    });

    if (existingEntry) {
      existingEntry.customer_id = customerId;
      existingEntry.amount = Number(amount.toFixed(2));
      existingEntry.type = CustomerHistoryEntryType.INVOICE;
      existingEntry.note = null;
      await historyRepo.save(existingEntry);
      return;
    }

    const entry = historyRepo.create({
      customer_id: customerId,
      invoice_id: invoiceId,
      type: CustomerHistoryEntryType.INVOICE,
      amount: Number(amount.toFixed(2)),
      note: null,
    });
    await historyRepo.save(entry);
  }

  private normalizeQuantity(quantity: unknown): number {
    const normalizedQuantity = Number(quantity);

    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    return Number(normalizedQuantity.toFixed(2));
  }

  private async adjustStock(
    ceramicRepo: Repository<CeramicItem>,
    healthyRepo: Repository<HealthyItem>,
    itemType: ItemType,
    itemId: number,
    quantityDelta: number,
  ): Promise<void> {
    // Decimal columns are returned as strings; always coerce before math.
    const delta = Number(quantityDelta) || 0;
    if (delta === 0) {
      return;
    }

    if (itemType === ItemType.CERAMIC) {
      const ceramic = await ceramicRepo.findOne({ where: { id: itemId } });

      if (!ceramic) {
        throw new NotFoundException(`Ceramic item with ID ${itemId} not found`);
      }

      const currentQty = Number(ceramic.quantity) || 0;
      if (delta < 0 && currentQty < Math.abs(delta)) {
        throw new BadRequestException(
          `Insufficient ceramic stock for item ${ceramic.title}`,
        );
      }

      ceramic.quantity = Number((currentQty + delta).toFixed(2));
      await ceramicRepo.save(ceramic);
      return;
    }

    if (itemType === ItemType.HEALTHY) {
      const healthy = await healthyRepo.findOne({ where: { id: itemId } });

      if (!healthy) {
        throw new NotFoundException(`Healthy item with ID ${itemId} not found`);
      }

      const currentQty = Number(healthy.quantity) || 0;
      if (delta < 0 && currentQty < Math.abs(delta)) {
        throw new BadRequestException(
          `Insufficient healthy stock for item ${healthy.title}`,
        );
      }

      healthy.quantity = Number((currentQty + delta).toFixed(2));
      await healthyRepo.save(healthy);
    }
  }

  private async getItemUnitPrice(
    ceramicRepo: Repository<CeramicItem>,
    healthyRepo: Repository<HealthyItem>,
    itemType: ItemType,
    itemId: number,
  ): Promise<number> {
    if (itemType === ItemType.CERAMIC) {
      const ceramic = await ceramicRepo.findOne({ where: { id: itemId } });

      if (!ceramic) {
        throw new NotFoundException(`Ceramic item with ID ${itemId} not found`);
      }

      return Number(ceramic.price);
    }

    const healthy = await healthyRepo.findOne({ where: { id: itemId } });

    if (!healthy) {
      throw new NotFoundException(`Healthy item with ID ${itemId} not found`);
    }

    return Number(healthy.price);
  }

  private async createInvoiceItemRecord(
    invoiceItemsRepo: Repository<InvoiceItem>,
    ceramicRepo: Repository<CeramicItem>,
    healthyRepo: Repository<HealthyItem>,
    invoiceId: number,
    itemData: InvoiceItemInput,
  ): Promise<void> {
    const unit_price = await this.getItemUnitPrice(
      ceramicRepo,
      healthyRepo,
      itemData.item_type,
      itemData.item_id,
    );

    const invoiceItem = invoiceItemsRepo.create({
      invoice_id: invoiceId,
      item_type: itemData.item_type,
      quantity: itemData.quantity,
      unit_price,
      place:
        typeof itemData.place === 'string' && itemData.place.trim() !== ''
          ? itemData.place.trim()
          : undefined,
    });

    if (itemData.item_type === ItemType.CERAMIC) {
      invoiceItem.ceramic_item_id = itemData.item_id;
    } else if (itemData.item_type === ItemType.HEALTHY) {
      invoiceItem.healthy_item_id = itemData.item_id;
    }

    await invoiceItemsRepo.save(invoiceItem);
  }

  async create(createInvoiceDto: CreateInvoiceDto) {
    if (
      !createInvoiceDto.items ||
      !Array.isArray(createInvoiceDto.items) ||
      createInvoiceDto.items.length === 0
    ) {
      throw new BadRequestException('Invoice must include at least one item');
    }

    // Calculate total_amount = amount - discount + delivery_price
    const amount = Number(createInvoiceDto.amount) || 0;
    const discount = Number(createInvoiceDto.discount) || 0;
    const delivery_price = Number(createInvoiceDto.delivery_price) || 0;
    const total_amount = Number((amount - discount + delivery_price).toFixed(2));

    if (total_amount < 0) {
      throw new BadRequestException('Discount cannot be greater than amount');
    }

    if (!createInvoiceDto.customer_id) {
      throw new BadRequestException('Customer is required');
    }

    // Use a transaction so invoice + items + stock updates are atomic
    const savedInvoiceId = await this.invoicesRepository.manager.transaction(
      async (manager) => {
        const invoicesRepo = manager.getRepository(Invoice);
        const invoiceItemsRepo = manager.getRepository(InvoiceItem);
        const ceramicRepo = manager.getRepository(CeramicItem);
        const healthyRepo = manager.getRepository(HealthyItem);
        const customerRepo = manager.getRepository(Customer);
        const historyRepo = manager.getRepository(CustomerHistoryEntry);

        // Generate invoice number
        const lastInvoice = await invoicesRepo.find({
          order: { id: 'DESC' as const },
          take: 1,
        });
        const nextNumber = (lastInvoice[0]?.id || 0) + 1;
        const invoice_number = `AKC-${String(nextNumber).padStart(6, '0')}`;

        const invoice = invoicesRepo.create({
          invoice_number,
          amount,
          discount,
          delivery_price,
          total_amount,
          type: createInvoiceDto.type,
          customer_id: Number(createInvoiceDto.customer_id),
        });

        const savedInvoice = await invoicesRepo.save(invoice);
        await this.applyCustomerAmountDelta(
          customerRepo,
          savedInvoice.customer_id,
          Number(savedInvoice.total_amount),
        );
        await this.upsertInvoiceCustomerHistory(
          historyRepo,
          savedInvoice.id,
          savedInvoice.customer_id,
          Number(savedInvoice.total_amount),
        );

        // Create invoice items + decrement stock
        for (const itemData of createInvoiceDto.items) {
          const normalizedItem: InvoiceItemInput = {
            item_type: itemData.item_type as ItemType,
            item_id: Number(itemData.item_id),
            quantity: this.normalizeQuantity(itemData.quantity),
            place: (itemData as { place?: string }).place,
          };

          await this.adjustStock(
            ceramicRepo,
            healthyRepo,
            normalizedItem.item_type,
            normalizedItem.item_id,
            -normalizedItem.quantity,
          );

          await this.createInvoiceItemRecord(
            invoiceItemsRepo,
            ceramicRepo,
            healthyRepo,
            savedInvoice.id,
            normalizedItem,
          );
        }

        return savedInvoice.id;
      },
    );

    // Reload with customer and items details
    return this.findOne(savedInvoiceId);
  }

  private async loadInvoiceItems(invoiceIds: number[]) {
    if (invoiceIds.length === 0) return [] as Array<Record<string, unknown>>;

    let rows: Array<Record<string, unknown>>;
    try {
      rows = await this.invoiceItemsRepository.query(
        `
        SELECT
          id,
          invoice_id,
          item_type,
          ceramic_item_id,
          healthy_item_id,
          quantity,
          place,
          unit_price
        FROM invoice_items
        WHERE invoice_id = ANY($1::int[])
        ORDER BY id ASC
        `,
        [invoiceIds],
      );
    } catch {
      // Older DBs may not have unit_price yet.
      rows = await this.invoiceItemsRepository.query(
        `
        SELECT
          id,
          invoice_id,
          item_type,
          ceramic_item_id,
          healthy_item_id,
          quantity,
          place
        FROM invoice_items
        WHERE invoice_id = ANY($1::int[])
        ORDER BY id ASC
        `,
        [invoiceIds],
      );
    }

    return rows.map((row) => {
      const itemType = String(row.item_type);
      const ceramicId =
        row.ceramic_item_id != null ? Number(row.ceramic_item_id) : null;
      const healthyId =
        row.healthy_item_id != null ? Number(row.healthy_item_id) : null;
      const unitPrice =
        row.unit_price != null ? Number(row.unit_price) : null;

      return {
        id: Number(row.id),
        invoice_id: Number(row.invoice_id),
        item_type: itemType,
        ceramic_item_id: ceramicId,
        healthy_item_id: healthyId,
        item_id: itemType === ItemType.CERAMIC ? ceramicId : healthyId,
        quantity: Number(row.quantity) || 0,
        unit_price: unitPrice,
        price: unitPrice ?? 0,
        place: (row.place as string | null) ?? null,
      };
    });
  }

  private async loadCustomers(customerIds: number[]) {
    if (customerIds.length === 0) return new Map<number, Customer>();
    const customers = await this.customersRepository.find({
      where: { id: In(customerIds) },
    });
    return new Map(customers.map((customer) => [customer.id, customer]));
  }

  private mapInvoiceRow(
    invoice: Invoice,
    customer: Customer | undefined,
    items: Array<Record<string, unknown>>,
  ) {
    return {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      amount: Number(invoice.amount) || 0,
      discount: Number(invoice.discount) || 0,
      delivery_price: Number(invoice.delivery_price) || 0,
      total_amount: Number(invoice.total_amount) || 0,
      type: invoice.type,
      customer_id: Number(invoice.customer_id),
      customer: customer
        ? {
            id: customer.id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phoneNumber1: customer.phoneNumber1,
            phoneNumber2: customer.phoneNumber2,
            city: customer.city,
            amount: Number(customer.amount) || 0,
          }
        : null,
      items,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  private async loadInvoices(id?: number): Promise<Invoice[]> {
    if (id != null) {
      const rows: Invoice[] = await this.invoicesRepository.query(
        `
        SELECT
          id,
          invoice_number,
          amount,
          discount,
          delivery_price,
          total_amount,
          type,
          customer_id,
          "createdAt",
          "updatedAt"
        FROM invoices
        WHERE id = $1
        LIMIT 1
        `,
        [id],
      );
      return rows;
    }

    return this.invoicesRepository.query(
      `
      SELECT
        id,
        invoice_number,
        amount,
        discount,
        delivery_price,
        total_amount,
        type,
        customer_id,
        "createdAt",
        "updatedAt"
      FROM invoices
      ORDER BY id DESC
      `,
    );
  }

  async findAll() {
    try {
      // Plain SQL only — no TypeORM relations (avoids circular JSON / bad joins).
      const invoices = await this.loadInvoices();

      const customerMap = await this.loadCustomers(
        [...new Set(invoices.map((invoice) => Number(invoice.customer_id)))],
      );
      const allItems = await this.loadInvoiceItems(
        invoices.map((invoice) => Number(invoice.id)),
      );
      const itemsByInvoice = new Map<number, Array<Record<string, unknown>>>();

      for (const item of allItems) {
        const invoiceId = Number(item.invoice_id);
        const list = itemsByInvoice.get(invoiceId) ?? [];
        list.push(item);
        itemsByInvoice.set(invoiceId, list);
      }

      return invoices.map((invoice) =>
        this.mapInvoiceRow(
          invoice,
          customerMap.get(Number(invoice.customer_id)),
          itemsByInvoice.get(Number(invoice.id)) ?? [],
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`findAll invoices failed: ${message}`);
      throw new InternalServerErrorException(message);
    }
  }

  async findOne(id: number) {
    try {
      const rows = await this.loadInvoices(id);
      const invoice = rows[0];
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      const customerMap = await this.loadCustomers([
        Number(invoice.customer_id),
      ]);
      const items = await this.loadInvoiceItems([Number(invoice.id)]);

      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          let itemDetails: CeramicItem | HealthyItem | null = null;
          const itemType = String(item.item_type);
          const itemId = Number(item.item_id);

          if (itemType === ItemType.CERAMIC && itemId) {
            itemDetails = await this.ceramicItemsRepository.findOne({
              where: { id: itemId },
            });
          } else if (itemType === ItemType.HEALTHY && itemId) {
            itemDetails = await this.healthyItemsRepository.findOne({
              where: { id: itemId },
            });
          }

          const catalogPrice = itemDetails ? Number(itemDetails.price) : 0;
          const unitPrice =
            item.unit_price != null ? Number(item.unit_price) : catalogPrice;

          const catalogDetails: Record<string, unknown> = {};
          let stock_quantity: number | undefined;
          if (itemDetails) {
            const details = itemDetails as unknown as Record<string, unknown>;
            for (const [key, value] of Object.entries(details)) {
              if (key === 'quantity') stock_quantity = Number(value) || 0;
              else catalogDetails[key] = value;
            }
          }

          return {
            ...catalogDetails,
            ...item,
            unit_price: unitPrice,
            price: unitPrice,
            stock_quantity,
          };
        }),
      );

      return this.mapInvoiceRow(
        invoice,
        customerMap.get(Number(invoice.customer_id)),
        enrichedItems,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`findOne invoice failed: ${message}`);
      throw new InternalServerErrorException(message);
    }
  }

  async findByInvoiceNumber(invoice_number: string): Promise<Invoice | null> {
    return this.invoicesRepository.findOne({
      where: { invoice_number },
      relations: ['customer'],
    });
  }

  async update(id: number, updateInvoiceDto: UpdateInvoiceDto) {
    await this.invoicesRepository.manager.transaction(async (manager) => {
      const invoicesRepo = manager.getRepository(Invoice);
      const invoiceItemsRepo = manager.getRepository(InvoiceItem);
      const ceramicRepo = manager.getRepository(CeramicItem);
      const healthyRepo = manager.getRepository(HealthyItem);
      const customerRepo = manager.getRepository(Customer);
      const historyRepo = manager.getRepository(CustomerHistoryEntry);

      const invoiceEntity = await invoicesRepo.findOne({
        where: { id },
      });

      if (!invoiceEntity) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      const previousTotalAmount = Number(invoiceEntity.total_amount);
      const previousCustomerId = invoiceEntity.customer_id;

      const { items, ...invoiceFields } = updateInvoiceDto as unknown as {
        items?: InvoiceItemInput[];
        [k: string]: unknown;
      };

      if (invoiceFields.amount !== undefined) {
        invoiceEntity.amount = Number(invoiceFields.amount) || 0;
      }
      if (invoiceFields.discount !== undefined) {
        invoiceEntity.discount = Number(invoiceFields.discount) || 0;
      }
      if (invoiceFields.delivery_price !== undefined) {
        invoiceEntity.delivery_price =
          Number(invoiceFields.delivery_price) || 0;
      }
      if (invoiceFields.type !== undefined) {
        invoiceEntity.type = invoiceFields.type as Invoice['type'];
      }
      if (invoiceFields.customer_id !== undefined) {
        invoiceEntity.customer_id = Number(invoiceFields.customer_id);
      }

      const amount = Number(invoiceEntity.amount) || 0;
      const discount = Number(invoiceEntity.discount) || 0;
      const delivery_price = Number(invoiceEntity.delivery_price) || 0;
      const total_amount = Number(
        (amount - discount + delivery_price).toFixed(2),
      );

      if (total_amount < 0) {
        throw new BadRequestException(
          'Discount cannot be greater than amount',
        );
      }

      invoiceEntity.amount = amount;
      invoiceEntity.discount = discount;
      invoiceEntity.delivery_price = delivery_price;
      invoiceEntity.total_amount = total_amount;

      await invoicesRepo.save(invoiceEntity);

      const nextTotalAmount = Number(invoiceEntity.total_amount);
      const nextCustomerId = invoiceEntity.customer_id;

      if (previousCustomerId !== nextCustomerId) {
        await this.applyCustomerAmountDelta(
          customerRepo,
          previousCustomerId,
          -previousTotalAmount,
        );
        await this.applyCustomerAmountDelta(
          customerRepo,
          nextCustomerId,
          nextTotalAmount,
        );
      } else {
        const delta = Number(
          (nextTotalAmount - previousTotalAmount).toFixed(2),
        );
        if (delta !== 0) {
          await this.applyCustomerAmountDelta(
            customerRepo,
            nextCustomerId,
            delta,
          );
        }
      }

      await this.upsertInvoiceCustomerHistory(
        historyRepo,
        invoiceEntity.id,
        nextCustomerId,
        nextTotalAmount,
      );

      if (items) {
        const existingItems = await invoiceItemsRepo.find({
          where: { invoice_id: invoiceEntity.id },
        });

        for (const existingItem of existingItems) {
          const existingItemId =
            existingItem.item_type === ItemType.CERAMIC
              ? existingItem.ceramic_item_id
              : existingItem.healthy_item_id;

          if (!existingItemId) {
            continue;
          }

          await this.adjustStock(
            ceramicRepo,
            healthyRepo,
            existingItem.item_type,
            existingItemId,
            Number(existingItem.quantity) || 0,
          );
        }

        await invoiceItemsRepo.delete({ invoice_id: invoiceEntity.id });

        for (const itemData of items) {
          const normalizedItem: InvoiceItemInput = {
            item_type: itemData.item_type as ItemType,
            item_id: Number(itemData.item_id),
            quantity: this.normalizeQuantity(itemData.quantity),
            place: itemData.place,
          };

          await this.adjustStock(
            ceramicRepo,
            healthyRepo,
            normalizedItem.item_type,
            normalizedItem.item_id,
            -normalizedItem.quantity,
          );

          await this.createInvoiceItemRecord(
            invoiceItemsRepo,
            ceramicRepo,
            healthyRepo,
            invoiceEntity.id,
            normalizedItem,
          );
        }
      }
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.invoicesRepository.manager.transaction(async (manager) => {
      const invoicesRepo = manager.getRepository(Invoice);
      const invoiceItemsRepo = manager.getRepository(InvoiceItem);
      const ceramicRepo = manager.getRepository(CeramicItem);
      const healthyRepo = manager.getRepository(HealthyItem);
      const customerRepo = manager.getRepository(Customer);

      const invoice = await invoicesRepo.findOne({
        where: { id },
        relations: ['items'],
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      for (const existingItem of invoice.items) {
        const existingItemId =
          existingItem.item_type === ItemType.CERAMIC
            ? existingItem.ceramic_item_id
            : existingItem.healthy_item_id;

        if (!existingItemId) {
          continue;
        }

        await this.adjustStock(
          ceramicRepo,
          healthyRepo,
          existingItem.item_type,
          existingItemId,
          Number(existingItem.quantity) || 0,
        );
      }

      await invoiceItemsRepo.delete({ invoice_id: invoice.id });
      await this.applyCustomerAmountDelta(
        customerRepo,
        invoice.customer_id,
        -Number(invoice.total_amount),
      );
      await invoicesRepo.remove(invoice);
    });

    return { message: `Invoice with ID ${id} has been deleted` };
  }
}
