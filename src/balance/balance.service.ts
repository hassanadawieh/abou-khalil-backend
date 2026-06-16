import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CeramicItem } from '../items/entities/ceramic-item.entity';
import { HealthyItem } from '../items/entities/healthy-item.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Customer } from '../customers/entities/customer.entity';
import { InvoiceItem } from '../items/entities/invoice-item.entity';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(CeramicItem)
    private readonly ceramicItemRepository: Repository<CeramicItem>,
    @InjectRepository(HealthyItem)
    private readonly healthyItemRepository: Repository<HealthyItem>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
  ) {}

  async getGeneralBalance(fromDate?: Date, toDate?: Date) {
    // Get all ceramic items with pricing
    const ceramicItems = await this.ceramicItemRepository.find();
    let ceramicPriceSum = 0;
    let ceramicMainPriceSum = 0;

    for (const item of ceramicItems) {
      const quantity = Number(item.quantity) || 0;
      ceramicPriceSum += Number(item.price) * quantity;
      ceramicMainPriceSum += Number(item.main_price) * quantity;
    }

    // Get all healthy items with pricing
    const healthyItems = await this.healthyItemRepository.find();
    let healthyPriceSum = 0;
    let healthyMainPriceSum = 0;

    for (const item of healthyItems) {
      const quantity = Number(item.quantity) || 0;
      healthyPriceSum += Number(item.price) * quantity;
      healthyMainPriceSum += Number(item.main_price) * quantity;
    }

    // Build query for invoices based on date range
    let invoiceQuery = this.invoiceRepository.createQueryBuilder('invoice');
    if (fromDate) {
      invoiceQuery = invoiceQuery.andWhere('invoice.createdAt >= :fromDate', {
        fromDate,
      });
    }
    if (toDate) {
      invoiceQuery = invoiceQuery.andWhere('invoice.createdAt <= :toDate', {
        toDate,
      });
    }

    // Get invoices with items
    const invoices = await invoiceQuery
      .leftJoinAndSelect('invoice.items', 'items')
      .getMany();

    // Calculate sold items totals by type
    let ceramicSoldPrice = 0;
    let ceramicSoldMainPrice = 0;
    let ceramicQuantitySold = 0;

    let healthySoldPrice = 0;
    let healthySoldMainPrice = 0;
    let healthyQuantitySold = 0;

    for (const invoice of invoices) {
      for (const invoiceItem of invoice.items) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (invoiceItem.item_type === 'ceramic') {
          const ceramicItem = ceramicItems.find(
            (item) => item.id === invoiceItem.ceramic_item_id,
          );
          if (ceramicItem) {
            ceramicSoldPrice +=
              Number(ceramicItem.price) * invoiceItem.quantity;
            ceramicSoldMainPrice +=
              Number(ceramicItem.main_price) * invoiceItem.quantity;
            ceramicQuantitySold += invoiceItem.quantity;
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        else if (invoiceItem.item_type === 'healthy') {
          const healthyItem = healthyItems.find(
            (item) => item.id === invoiceItem.healthy_item_id,
          );
          if (healthyItem) {
            healthySoldPrice +=
              Number(healthyItem.price) * invoiceItem.quantity;
            healthySoldMainPrice +=
              Number(healthyItem.main_price) * invoiceItem.quantity;
            healthyQuantitySold += invoiceItem.quantity;
          }
        }
      }
    }

    // Get customer statistics
    const totalCustomers = await this.customerRepository.count();

    // Get new customers based on date range
    let newCustomerCount = 0;
    if (fromDate || toDate) {
      if (fromDate && toDate) {
        newCustomerCount = await this.customerRepository
          .createQueryBuilder('customer')
          .where('customer.createdAt >= :fromDate', { fromDate })
          .andWhere('customer.createdAt <= :toDate', { toDate })
          .getCount();
      } else if (fromDate) {
        newCustomerCount = await this.customerRepository
          .createQueryBuilder('customer')
          .where('customer.createdAt >= :fromDate', { fromDate })
          .getCount();
      } else if (toDate) {
        newCustomerCount = await this.customerRepository
          .createQueryBuilder('customer')
          .where('customer.createdAt <= :toDate', { toDate })
          .getCount();
      }
    }

    return {
      ceramics: {
        price: ceramicPriceSum,
        main_price: ceramicMainPriceSum,
        amount: ceramicPriceSum - ceramicMainPriceSum,
      },
      healthy: {
        price: healthyPriceSum,
        main_price: healthyMainPriceSum,
        amount: healthyPriceSum - healthyMainPriceSum,
      },
      sold: {
        ceramics: {
          price: ceramicSoldPrice,
          main_price: ceramicSoldMainPrice,
          amount: ceramicSoldPrice - ceramicSoldMainPrice,
          quantity: ceramicQuantitySold,
        },
        healthy: {
          price: healthySoldPrice,
          main_price: healthySoldMainPrice,
          amount: healthySoldPrice - healthySoldMainPrice,
          quantity: healthyQuantitySold,
        },
      },
      number_customer: totalCustomers,
      new_customers: newCustomerCount,
      date_range: {
        from: fromDate || null,
        to: toDate || null,
      },
    };
  }
}
