import { Body, Controller, Get, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { FacadeValidatorService } from '../domain/validator/facade.validator.service';
import { User } from '../user/decorators/user.decorator';
import { CreateValidatorDto } from './dtos/create-validator.dto';
import { ValidatorService } from './service/validator.service';
import { ValidatorMapper } from './validator.mapper';

@Controller('validators')
export class ValidatorController {
  private readonly logger = new Logger(ValidatorController.name);

  constructor(
    private readonly facadeValidatorService: FacadeValidatorService,
    private readonly validatorService: ValidatorService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('register')
  async registerValidator(@User() user: any, @Body() stakeValidatorDto: CreateValidatorDto) {
    const result = await this.facadeValidatorService.registerValidator(user._id, stakeValidatorDto);
    return result;
  }

  @Post('search')
  async searchValidators(): Promise<any[]> {
    const validators = await this.validatorService.getAll();
    return validators;
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyValidators(@User() user: any) {
    const validators = await this.validatorService.getMyValidators(user._id);
    return validators.map(validator => ValidatorMapper.toApiResponse(validator));
  }

  @Get(':id')
  async getValidator(@Param('id') id: string) {
    const validator = await this.validatorService.getValidator(id);
    return validator;
  }
}
