import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/decorators/user-role.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@ApiTags('employees')
@Controller('employees')
@UseGuards(AuthTokenGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new employee',
    description: 'Create a new employee with name, phone number, and salary',
  })
  @ApiCreatedResponse({
    description: 'Employee created successfully',
    type: Employee,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Employee> {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all employees',
    description: 'Retrieve a list of all employees',
  })
  @ApiOkResponse({
    description: 'List of employees retrieved successfully',
    type: [Employee],
  })
  async findAll(
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Employee[]> {
    return this.employeesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get employee by ID',
    description: 'Retrieve a specific employee by their unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The employee ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Employee retrieved successfully',
    type: Employee,
  })
  @ApiNotFoundResponse({
    description: 'Employee with the specified ID not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Employee> {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update employee',
    description: 'Update employee information (name, phone number, or salary)',
  })
  @ApiParam({
    name: 'id',
    description: 'The employee ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Employee updated successfully',
    type: Employee,
  })
  @ApiNotFoundResponse({
    description: 'Employee with the specified ID not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<Employee> {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete employee',
    description: 'Remove an employee from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'The employee ID',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Employee deleted successfully',
    schema: {
      example: { message: 'Employee with ID 1 has been deleted' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Employee with the specified ID not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<{ message: string }> {
    return this.employeesService.remove(id);
  }
}
