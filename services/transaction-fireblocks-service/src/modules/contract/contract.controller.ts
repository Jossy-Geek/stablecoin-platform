import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ContractService } from './contract.service';
import { CreateContractDto, UpdateContractDto, TogglePauseDto } from './dto/contract.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { JwtAuthWithBlockCheckGuard } from '../../shared/guards/jwt-auth-with-block-check.guard';

@ApiTags('Contract')
@Controller('contracts')
@UseGuards(JwtAuthWithBlockCheckGuard)
@ApiBearerAuth()
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  @ApiOperation({ summary: 'Get all contracts (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of contracts' })
  async getAllContracts(@Request() req) {
    // Only admin and super_admin can view contracts
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new UnauthorizedException('Admin or Super Admin access required');
    }
    return this.contractService.getAllContracts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contract details' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getContractById(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin or Super Admin access required');
    }
    return this.contractService.getContractById(id);
  }

  @Get('address/:address')
  @ApiOperation({ summary: 'Get contract by address (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contract details' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getContractByAddress(@Request() req, @Param('address') address: string) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin or Super Admin access required');
    }
    return this.contractService.getContractByAddress(address);
  }

  @Post()
  @ApiOperation({ summary: 'Create new contract (Admin only)' })
  @ApiResponse({ status: 201, description: 'Contract created successfully' })
  @ApiResponse({ status: 409, description: 'Contract already exists' })
  async createContract(@Request() req, @Body() createDto: CreateContractDto) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin or Super Admin access required');
    }
    return this.contractService.createContract(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contract (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contract updated successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async updateContract(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateContractDto,
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin or Super Admin access required');
    }
    return this.contractService.updateContract(id, updateDto);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause or resume contract (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contract pause status updated' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async togglePause(
    @Request() req,
    @Param('id') id: string,
    @Body() toggleDto: TogglePauseDto,
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin or Super Admin access required');
    }
    return this.contractService.togglePause(id, toggleDto);
  }

  @Post('address/:address/pause')
  @ApiOperation({ summary: 'Pause or resume contract by address (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contract pause status updated' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async togglePauseByAddress(
    @Request() req,
    @Param('address') address: string,
    @Body() toggleDto: TogglePauseDto,
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin or Super Admin access required');
    }
    return this.contractService.togglePauseByAddress(address, toggleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contract (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Contract deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async deleteContract(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Super Admin access required');
    }
    await this.contractService.deleteContract(id);
    return { message: 'Contract deleted successfully' };
  }
}
