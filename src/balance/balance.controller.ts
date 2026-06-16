import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BalanceService } from './balance.service';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';

@ApiTags('balance')
@Controller('balance')
@UseGuards(AuthTokenGuard)
@ApiBearerAuth()
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('general')
  @ApiOperation({
    summary: 'Get general balance report',
    description:
      'Get a comprehensive balance report with total pricing summary for items and sold items',
  })
  @ApiOkResponse({
    description: 'General balance report retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        ceramics: {
          type: 'object',
          properties: {
            price: {
              type: 'number',
              description: 'Total selling price for all ceramic items',
            },
            main_price: {
              type: 'number',
              description: 'Total cost price for all ceramic items',
            },
            amount: {
              type: 'number',
              description:
                'Total profit (price - main_price) for ceramic items',
            },
          },
        },
        healthy: {
          type: 'object',
          properties: {
            price: {
              type: 'number',
              description: 'Total selling price for all healthy items',
            },
            main_price: {
              type: 'number',
              description: 'Total cost price for all healthy items',
            },
            amount: {
              type: 'number',
              description:
                'Total profit (price - main_price) for healthy items',
            },
          },
        },
        sold: {
          type: 'object',
          properties: {
            ceramics: {
              type: 'object',
              properties: {
                price: {
                  type: 'number',
                  description: 'Total selling price of sold ceramic items',
                },
                main_price: {
                  type: 'number',
                  description: 'Total cost price of sold ceramic items',
                },
                amount: {
                  type: 'number',
                  description: 'Total profit from sold ceramic items',
                },
                quantity: {
                  type: 'number',
                  description: 'Total quantity of ceramic items sold',
                },
              },
            },
            healthy: {
              type: 'object',
              properties: {
                price: {
                  type: 'number',
                  description: 'Total selling price of sold healthy items',
                },
                main_price: {
                  type: 'number',
                  description: 'Total cost price of sold healthy items',
                },
                amount: {
                  type: 'number',
                  description: 'Total profit from sold healthy items',
                },
                quantity: {
                  type: 'number',
                  description: 'Total quantity of healthy items sold',
                },
              },
            },
          },
        },
        number_customer: {
          type: 'number',
          description: 'Total number of customers',
        },
        new_customers: {
          type: 'number',
          description:
            'Number of new customers (filtered by date range if provided)',
        },
        date_range: {
          type: 'object',
          properties: {
            from: {
              type: 'string',
              nullable: true,
              description: 'Start date for filtering',
            },
            to: {
              type: 'string',
              nullable: true,
              description: 'End date for filtering',
            },
          },
        },
      },
    },
  })
  async getGeneralBalance(
    @Query('fromDate') fromDateStr?: string,
    @Query('toDate') toDateStr?: string,
  ) {
    const fromDate = fromDateStr ? new Date(fromDateStr) : undefined;
    const toDate = toDateStr ? new Date(toDateStr) : undefined;

    return this.balanceService.getGeneralBalance(fromDate, toDate);
  }
}
