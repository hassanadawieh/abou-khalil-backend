import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  private toInvoiceListItem(invoice: Invoice) {
    return {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      amount: Number(invoice.amount) || 0,
      discount: Number(invoice.discount) || 0,
      delivery_price: Number(invoice.delivery_price) || 0,
      total_amount: Number(invoice.total_amount) || 0,
      type: invoice.type,
      customer_id: invoice.customer_id,
      customer: invoice.customer
        ? {
            id: invoice.customer.id,
            firstName: invoice.customer.firstName,
            lastName: invoice.customer.lastName,
            phoneNumber1: invoice.customer.phoneNumber1,
            phoneNumber2: invoice.customer.phoneNumber2,
            city: invoice.customer.city,
            amount: Number(invoice.customer.amount) || 0,
          }
        : null,
      items: (invoice.items ?? []).map((item) => ({
        id: item.id,
        invoice_id: item.invoice_id,
        item_type: item.item_type,
        ceramic_item_id: item.ceramic_item_id ?? null,
        healthy_item_id: item.healthy_item_id ?? null,
        item_id:
          item.item_type === ItemType.CERAMIC
            ? item.ceramic_item_id
            : item.healthy_item_id,
        quantity: Number(item.quantity) || 0,
        unit_price:
          item.unit_price != null ? Number(item.unit_price) : null,
        price: item.unit_price != null ? Number(item.unit_price) : 0,
        place: item.place ?? null,
      })),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  async findAll() {
    const invoices = await this.invoicesRepository.find({
      relations: ['customer', 'items'],
      order: { id: 'DESC' },
    });

    // Return plain objects to avoid circular JSON (invoice <-> items).
    return invoices.map((invoice) => this.toInvoiceListItem(invoice));
  }

  async findOne(id: number) {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: ['customer', 'items'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const base = this.toInvoiceListItem(invoice);

    // Enrich line items with product details for edit/print screens.
    if (invoice.items && invoice.items.length > 0) {
      const itemsWithDetails = await Promise.all(
        invoice.items.map(async (invoiceItem) => {
          let itemDetails: CeramicItem | HealthyItem | null = null;

          if (
            invoiceItem.item_type === ItemType.CERAMIC &&
            invoiceItem.ceramic_item_id
          ) {
            itemDetails = await this.ceramicItemsRepository.findOne({
              where: { id: invoiceItem.ceramic_item_id },
            });
          } else if (
            invoiceItem.item_type === ItemType.HEALTHY &&
            invoiceItem.healthy_item_id
          ) {
            itemDetails = await this.healthyItemsRepository.findOne({
              where: { id: invoiceItem.healthy_item_id },
            });
          }

          const catalogPrice = itemDetails ? Number(itemDetails.price) : 0;
          const unitPrice =
            invoiceItem.unit_price != null
              ? Number(invoiceItem.unit_price)
              : catalogPrice;

          const catalogDetails: Record<string, unknown> = {};
          let stock_quantity: number | undefined;

          if (itemDetails) {
            const details = itemDetails as unknown as Record<string, unknown>;
            for (const [key, value] of Object.entries(details)) {
              if (key === 'quantity') {
                stock_quantity = Number(value) || 0;
              } else if (key !== 'password') {
                catalogDetails[key] = value;
              }
            }
          }

          return {
            ...catalogDetails,
            id: invoiceItem.id,
            invoice_id: invoiceItem.invoice_id,
            item_id:
              invoiceItem.item_type === ItemType.CERAMIC
                ? invoiceItem.ceramic_item_id
                : invoiceItem.healthy_item_id,
            item_type: invoiceItem.item_type,
            place: invoiceItem.place ?? null,
            unit_price: unitPrice,
            stock_quantity,
            price: unitPrice,
            quantity: Number(invoiceItem.quantity) || 0,
          };
        }),
      );

      return { ...base, items: itemsWithDetails };
    }

    return base;
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
